import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import {
  initDatabase,
  getServices,
  saveService,
  deleteService,
  getBarbers,
  updateBarber,
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  getNextSequence,
  getSettings,
  updateSettings,
  resetQueue,
} from './db';
import {
  isValidStatusTransition,
  isValidPhoneNumber,
  findActiveTicketForPhone,
  validateServiceSelection,
  getNextEligibleTicket,
  calculateEstimatedWaitTime,
  calculateQueuePosition,
  computeQueueStats,
} from './queueRules';
import { Ticket, TicketStatus } from './types';

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// Helper to broadcast full state
function broadcastState(callingTicket?: Ticket) {
  const tickets = getTickets();
  const barbers = getBarbers();
  const services = getServices();
  const settings = getSettings();
  const stats = computeQueueStats(tickets);

  io.emit('queue:updated', {
    tickets,
    barbers,
    services,
    settings,
    stats,
  });

  if (callingTicket) {
    io.emit('ticket:called', callingTicket);
  }
}

// ------------------- API ROUTES -------------------

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Salon Queue Management API',
    timestamp: new Date().toISOString(),
  });
});

// 2. Full State
app.get('/api/state', (req: Request, res: Response) => {
  const tickets = getTickets();
  const barbers = getBarbers();
  const services = getServices();
  const settings = getSettings();
  const stats = computeQueueStats(tickets);

  res.json({
    tickets,
    barbers,
    services,
    settings,
    stats,
  });
});

// 3. Customer Join Queue
app.post('/api/queue/join', (req: Request, res: Response) => {
  const settings = getSettings();
  if (!settings.isOpen) {
    return res.status(403).json({
      error: 'QUEUE_CLOSED',
      message: settings.closedMessage || 'Online queue is currently closed. Walk-ins available at counter.',
    });
  }

  const { customerName, customerPhone, serviceIds, preferredBarberId } = req.body;

  if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
    return res.status(400).json({ error: 'Customer name is required.' });
  }

  if (!customerPhone || !isValidPhoneNumber(customerPhone)) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
  }

  const allTickets = getTickets();
  const existingActive = findActiveTicketForPhone(allTickets, customerPhone);
  if (existingActive) {
    return res.status(409).json({
      error: 'ALREADY_ACTIVE',
      message: `You already have an active token (${existingActive.tokenNumber}) in the queue.`,
      ticket: existingActive,
    });
  }

  const allServices = getServices();
  const svcValidation = validateServiceSelection(serviceIds, allServices);
  if (!svcValidation.valid) {
    return res.status(400).json({ error: svcValidation.error });
  }

  const seq = getNextSequence();
  const ticketId = `tkt-${Date.now()}-${seq}`;
  const newTicket: Ticket = {
    id: ticketId,
    tokenNumber: `S-${seq}`,
    sequence: seq,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    serviceIds,
    services: svcValidation.services,
    preferredBarberId: preferredBarberId || 'ANY',
    status: 'WAITING',
    totalDurationMin: svcValidation.totalDuration,
    totalPrice: svcValidation.totalPrice,
    createdAt: Date.now(),
    isWalkIn: false,
  };

  createTicket(newTicket);
  broadcastState();

  const barbers = getBarbers();
  const position = calculateQueuePosition(newTicket.id, getTickets());
  const waitMin = calculateEstimatedWaitTime(newTicket, getTickets(), barbers);

  res.status(201).json({
    success: true,
    ticket: newTicket,
    position,
    estimatedWaitMin: waitMin,
  });
});

// 4. Reception Walk-in Join
app.post('/api/queue/walkin', (req: Request, res: Response) => {
  const { customerName, customerPhone, serviceIds, preferredBarberId } = req.body;

  if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
    return res.status(400).json({ error: 'Customer name is required.' });
  }

  const phone = customerPhone ? customerPhone.trim() : '9999999999';

  const allServices = getServices();
  const svcValidation = validateServiceSelection(serviceIds, allServices);
  if (!svcValidation.valid) {
    return res.status(400).json({ error: svcValidation.error });
  }

  const seq = getNextSequence();
  const ticketId = `tkt-${Date.now()}-${seq}`;
  const newTicket: Ticket = {
    id: ticketId,
    tokenNumber: `S-${seq}`,
    sequence: seq,
    customerName: customerName.trim(),
    customerPhone: phone,
    serviceIds,
    services: svcValidation.services,
    preferredBarberId: preferredBarberId || 'ANY',
    status: 'WAITING',
    totalDurationMin: svcValidation.totalDuration,
    totalPrice: svcValidation.totalPrice,
    createdAt: Date.now(),
    isWalkIn: true,
  };

  createTicket(newTicket);
  broadcastState();

  res.status(201).json({
    success: true,
    ticket: newTicket,
  });
});

// 5. Get Ticket by ID or Token
app.get('/api/tickets/:id', (req: Request, res: Response) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const allTickets = getTickets();
  const barbers = getBarbers();
  const position = calculateQueuePosition(ticket.id, allTickets);
  const waitMin = calculateEstimatedWaitTime(ticket, allTickets, barbers);

  res.json({
    ticket,
    position,
    estimatedWaitMin: waitMin,
  });
});

// 6. Cancel Ticket
app.post('/api/tickets/:id/cancel', (req: Request, res: Response) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (ticket.status !== 'WAITING') {
    return res.status(400).json({ error: 'Only waiting tickets can be cancelled.' });
  }

  ticket.status = 'CANCELLED';
  updateTicket(ticket);
  broadcastState();

  res.json({ success: true, ticket });
});

// 7. Barber Call Next
app.post('/api/barbers/:id/call-next', (req: Request, res: Response) => {
  const barberId = req.params.id;
  const barbers = getBarbers();
  const barber = barbers.find((b) => b.id === barberId);

  if (!barber) {
    return res.status(404).json({ error: 'Barber not found.' });
  }

  if (!barber.isOnDuty) {
    return res.status(400).json({ error: 'Barber is not marked on duty.' });
  }

  if (barber.status === 'ON_BREAK') {
    return res.status(400).json({ error: 'Barber is currently on break.' });
  }

  const allTickets = getTickets();
  if (barber.currentTicketId) {
    const activeCurrent = allTickets.find(
      (t) => t.id === barber.currentTicketId && (t.status === 'CALLED' || t.status === 'IN_CHAIR')
    );
    if (activeCurrent) {
      return res.status(400).json({
        error: `Barber ${barber.name} already has an active customer in chair (${activeCurrent.tokenNumber}). Complete or finish that customer first.`,
      });
    }
  }

  const nextTicket = getNextEligibleTicket(allTickets, barberId);
  if (!nextTicket) {
    return res.status(404).json({ error: 'No waiting customer eligible for this barber right now.' });
  }

  if (!isValidStatusTransition(nextTicket.status, 'CALLED')) {
    return res.status(400).json({ error: `Cannot transition from ${nextTicket.status} to CALLED.` });
  }

  nextTicket.status = 'CALLED';
  nextTicket.assignedBarberId = barber.id;
  nextTicket.assignedBarberName = barber.name;
  nextTicket.calledAt = Date.now();
  updateTicket(nextTicket);

  barber.status = 'BUSY';
  barber.currentTicketId = nextTicket.id;
  updateBarber(barber);

  broadcastState(nextTicket);

  res.json({ success: true, barber, ticket: nextTicket });
});

// 8. Barber Start Service
app.post('/api/barbers/:id/start', (req: Request, res: Response) => {
  const barberId = req.params.id;
  const barbers = getBarbers();
  const barber = barbers.find((b) => b.id === barberId);

  if (!barber) {
    return res.status(404).json({ error: 'Barber not found.' });
  }

  if (!barber.currentTicketId) {
    return res.status(400).json({ error: 'No active ticket called for this barber.' });
  }

  const ticket = getTicketById(barber.currentTicketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Active ticket not found.' });
  }

  if (!isValidStatusTransition(ticket.status, 'IN_CHAIR')) {
    return res.status(400).json({ error: `Cannot transition from ${ticket.status} to IN_CHAIR.` });
  }

  ticket.status = 'IN_CHAIR';
  ticket.inChairAt = Date.now();
  updateTicket(ticket);

  broadcastState();

  res.json({ success: true, ticket });
});

// 9. Barber Complete Service (Done)
app.post('/api/barbers/:id/done', (req: Request, res: Response) => {
  const barberId = req.params.id;
  const barbers = getBarbers();
  const barber = barbers.find((b) => b.id === barberId);

  if (!barber) {
    return res.status(404).json({ error: 'Barber not found.' });
  }

  if (!barber.currentTicketId) {
    return res.status(400).json({ error: 'No active customer to finish.' });
  }

  const ticket = getTicketById(barber.currentTicketId);
  if (ticket) {
    if (isValidStatusTransition(ticket.status, 'DONE')) {
      ticket.status = 'DONE';
      ticket.doneAt = Date.now();
      updateTicket(ticket);
    }
  }

  barber.status = 'FREE';
  barber.currentTicketId = null;
  updateBarber(barber);

  broadcastState();

  res.json({ success: true, ticket });
});

// 10. Mark No-Show
app.post('/api/tickets/:id/noshow', (req: Request, res: Response) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  if (!isValidStatusTransition(ticket.status, 'NO_SHOW')) {
    return res.status(400).json({ error: 'Only CALLED tickets can be marked as No-Show.' });
  }

  ticket.status = 'NO_SHOW';
  updateTicket(ticket);

  // If assigned to a barber, release that barber
  if (ticket.assignedBarberId) {
    const barbers = getBarbers();
    const barber = barbers.find((b) => b.id === ticket.assignedBarberId);
    if (barber && barber.currentTicketId === ticket.id) {
      barber.status = 'FREE';
      barber.currentTicketId = null;
      updateBarber(barber);
    }
  }

  broadcastState();

  res.json({ success: true, ticket });
});

// 11. Toggle Barber Break
app.post('/api/barbers/:id/toggle-break', (req: Request, res: Response) => {
  const barbers = getBarbers();
  const barber = barbers.find((b) => b.id === req.params.id);
  if (!barber) {
    return res.status(404).json({ error: 'Barber not found.' });
  }

  if (barber.status === 'ON_BREAK') {
    barber.status = barber.currentTicketId ? 'BUSY' : 'FREE';
  } else {
    barber.status = 'ON_BREAK';
  }

  updateBarber(barber);
  broadcastState();

  res.json({ success: true, barber });
});

// 12. Toggle Barber Duty
app.post('/api/barbers/:id/toggle-duty', (req: Request, res: Response) => {
  const barbers = getBarbers();
  const barber = barbers.find((b) => b.id === req.params.id);
  if (!barber) {
    return res.status(404).json({ error: 'Barber not found.' });
  }

  barber.isOnDuty = !barber.isOnDuty;
  updateBarber(barber);
  broadcastState();

  res.json({ success: true, barber });
});

// 13. Admin Services CRUD
app.post('/api/admin/services', (req: Request, res: Response) => {
  const { nameEn, nameGu, durationMin, price, category, descriptionEn, descriptionGu } = req.body;
  if (!nameEn || !nameGu || !durationMin || !price) {
    return res.status(400).json({ error: 'All service fields are required.' });
  }

  const id = `srv-${Date.now()}`;
  const newService = {
    id,
    nameEn,
    nameGu,
    durationMin: Number(durationMin),
    price: Number(price),
    isActive: true,
    category: category || 'General',
    descriptionEn,
    descriptionGu,
  };

  saveService(newService);
  broadcastState();

  res.status(201).json({ success: true, service: newService });
});

app.put('/api/admin/services/:id', (req: Request, res: Response) => {
  const services = getServices();
  const existing = services.find((s) => s.id === req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Service not found.' });
  }

  const updated = {
    ...existing,
    ...req.body,
    id: req.params.id,
  };

  saveService(updated);
  broadcastState();

  res.json({ success: true, service: updated });
});

app.delete('/api/admin/services/:id', (req: Request, res: Response) => {
  deleteService(req.params.id);
  broadcastState();
  res.json({ success: true });
});

// 14. Admin Settings & Queue Toggle
app.post('/api/admin/settings', (req: Request, res: Response) => {
  updateSettings(req.body);
  broadcastState();
  res.json({ success: true, settings: getSettings() });
});

// 15. Admin Reset Queue / Demo Seed
app.post('/api/admin/queue/reset', (req: Request, res: Response) => {
  const seedDemo = Boolean(req.body?.seedDemo);
  resetQueue(seedDemo);
  broadcastState();
  res.json({ success: true, message: seedDemo ? 'Demo queue seeded successfully.' : 'Queue reset cleanly.' });
});

// ------------------- PRODUCTION STATIC SERVING -------------------
const clientDistPath = path.join(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// ------------------- SOCKET.IO CONNECTION -------------------
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Send current state on connection
  socket.emit('queue:updated', {
    tickets: getTickets(),
    barbers: getBarbers(),
    services: getServices(),
    settings: getSettings(),
    stats: computeQueueStats(getTickets()),
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  await initDatabase();
  server.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` Salon Queue Management System Server Running!   `);
    console.log(` Port: ${PORT}                                   `);
    console.log(` Health: http://localhost:${PORT}/api/health     `);
    console.log(` State:  http://localhost:${PORT}/api/state      `);
    console.log(`=================================================`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app, server, io };
