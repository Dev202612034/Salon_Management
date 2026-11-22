import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { Barber, SalonService, Ticket, QueueSettings } from './types';

const DB_FILE = path.join(process.cwd(), 'salon.sqlite');

let db: Database;

export async function initDatabase(): Promise<Database> {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Error reading existing sqlite file, creating fresh DB:', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Create tables if not exist
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      nameEn TEXT NOT NULL,
      nameGu TEXT NOT NULL,
      durationMin INTEGER NOT NULL,
      price REAL NOT NULL,
      isActive INTEGER NOT NULL,
      category TEXT NOT NULL,
      descriptionEn TEXT,
      descriptionGu TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS barbers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nameGu TEXT NOT NULL,
      avatar TEXT NOT NULL,
      status TEXT NOT NULL,
      isOnDuty INTEGER NOT NULL,
      currentTicketId TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      tokenNumber TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      customerName TEXT NOT NULL,
      customerPhone TEXT NOT NULL,
      serviceIds TEXT NOT NULL,
      servicesJson TEXT NOT NULL,
      preferredBarberId TEXT NOT NULL,
      assignedBarberId TEXT,
      assignedBarberName TEXT,
      status TEXT NOT NULL,
      totalDurationMin INTEGER NOT NULL,
      totalPrice REAL NOT NULL,
      createdAt INTEGER NOT NULL,
      calledAt INTEGER,
      inChairAt INTEGER,
      doneAt INTEGER,
      isWalkIn INTEGER NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  seedInitialData();
  persistDb();

  return db;
}

function persistDb() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist SQLite database:', err);
  }
}

function seedInitialData() {
  // Check services
  const svcCountRes = db.exec('SELECT count(*) as count FROM services');
  const svcCount = svcCountRes[0]?.values[0]?.[0] || 0;
  if (svcCount === 0) {
    const defaultServices: SalonService[] = [
      {
        id: 'srv-1',
        nameEn: 'Haircut & Styling',
        nameGu: 'વાળ કાપવા અને સ્ટાઇલિંગ',
        durationMin: 30,
        price: 150,
        isActive: true,
        category: 'Hair',
        descriptionEn: 'Professional hair cut with styling & wash',
        descriptionGu: 'વોશ અને પ્રોફેશનલ સ્ટાઇલિંગ સાથે હેરકટ',
      },
      {
        id: 'srv-2',
        nameEn: 'Beard Trim & Shape',
        nameGu: 'દાઢી સેટિંગ અને ટ્રિમ',
        durationMin: 15,
        price: 80,
        isActive: true,
        category: 'Beard',
        descriptionEn: 'Sharp beard shaping and hot towel finish',
        descriptionGu: 'હોટ ટોવેલ સાથે શાર્પ દાઢી શેપિંગ',
      },
      {
        id: 'srv-3',
        nameEn: 'Luxury Hair Spa',
        nameGu: 'લક્ઝરી હેર સ્પા',
        durationMin: 45,
        price: 400,
        isActive: true,
        category: 'Hair',
        descriptionEn: 'Deep conditioning & scalp rejuvenation',
        descriptionGu: 'ડીપ કન્ડીશનીંગ અને સ્કેલ્પ રિજુવેનેશન',
      },
      {
        id: 'srv-4',
        nameEn: 'Relaxing Head Massage',
        nameGu: 'રિલેક્સિંગ માથાની માલિશ',
        durationMin: 20,
        price: 120,
        isActive: true,
        category: 'Massage',
        descriptionEn: 'Ayurvedic cooling oil head massage',
        descriptionGu: 'આયુર્વેદિક તેલ સાથે આરામદાયક માલિશ',
      },
      {
        id: 'srv-5',
        nameEn: 'Mister Cuts Facial & Cleanup',
        nameGu: 'મિસ્ટર કટ્સ ફેશિયલ અને ક્લીન-અપ',
        durationMin: 40,
        price: 350,
        isActive: true,
        category: 'Skin',
        descriptionEn: 'Herbal glow cleanup for refreshed skin',
        descriptionGu: 'કુદરતી ચમક માટે હર્બલ ક્લીનઅપ',
      },
      {
        id: 'srv-6',
        nameEn: 'Classic Mister Shave',
        nameGu: 'ક્લાસિક મિસ્ટર શેવિંગ',
        durationMin: 20,
        price: 100,
        isActive: true,
        category: 'Beard',
        descriptionEn: 'Traditional straight razor shave with aloe vera',
        descriptionGu: 'એલોવેરા જેલ સાથે ટ્રેડિશનલ સેવિંગ',
      },
    ];

    for (const s of defaultServices) {
      db.run(
        `INSERT INTO services (id, nameEn, nameGu, durationMin, price, isActive, category, descriptionEn, descriptionGu)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.nameEn, s.nameGu, s.durationMin, s.price, s.isActive ? 1 : 0, s.category, s.descriptionEn || '', s.descriptionGu || '']
      );
    }
  }

  // Check barbers
  const barberCountRes = db.exec('SELECT count(*) as count FROM barbers');
  const barberCount = barberCountRes[0]?.values[0]?.[0] || 0;
  if (barberCount === 0) {
    const defaultBarbers: Barber[] = [
      {
        id: 'barber-ravi',
        name: 'Ravi Sharma',
        nameGu: 'રવિ શર્મા',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        status: 'FREE',
        isOnDuty: true,
      },
      {
        id: 'barber-amit',
        name: 'Amit Varma',
        nameGu: 'અમિત વર્મા',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
        status: 'FREE',
        isOnDuty: true,
      },
      {
        id: 'barber-imran',
        name: 'Imran Khan',
        nameGu: 'ઇમરાન ખાન',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
        status: 'FREE',
        isOnDuty: true,
      },
    ];

    for (const b of defaultBarbers) {
      db.run(
        `INSERT INTO barbers (id, name, nameGu, avatar, status, isOnDuty, currentTicketId)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [b.id, b.name, b.nameGu, b.avatar, b.status, b.isOnDuty ? 1 : 0, null]
      );
    }
  }

  // Check settings
  const settingRes = db.exec("SELECT value FROM settings WHERE key = 'isOpen'");
  if (!settingRes[0] || settingRes[0].values.length === 0) {
    db.run("INSERT INTO settings (key, value) VALUES ('isOpen', 'true')");
    db.run("INSERT INTO settings (key, value) VALUES ('closedMessage', 'Online queue is currently closed. Walk-ins are welcome at counter.')");
    db.run("INSERT INTO settings (key, value) VALUES ('adminPin', '1234')");
    db.run("INSERT INTO settings (key, value) VALUES ('openingTime', '09:00 AM')");
    db.run("INSERT INTO settings (key, value) VALUES ('closingTime', '09:00 PM')");
  }
}

// ----------------- Data Access Functions -----------------

export function getServices(): SalonService[] {
  const res = db.exec('SELECT * FROM services');
  if (!res[0]) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((col, idx) => (obj[col] = row[idx]));
    obj.isActive = Boolean(obj.isActive);
    return obj as SalonService;
  });
}

export function saveService(service: SalonService) {
  const exists = db.exec('SELECT id FROM services WHERE id = ?', [service.id]);
  if (exists[0] && exists[0].values.length > 0) {
    db.run(
      `UPDATE services SET nameEn = ?, nameGu = ?, durationMin = ?, price = ?, isActive = ?, category = ?, descriptionEn = ?, descriptionGu = ?
       WHERE id = ?`,
      [service.nameEn, service.nameGu, service.durationMin, service.price, service.isActive ? 1 : 0, service.category, service.descriptionEn || '', service.descriptionGu || '', service.id]
    );
  } else {
    db.run(
      `INSERT INTO services (id, nameEn, nameGu, durationMin, price, isActive, category, descriptionEn, descriptionGu)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [service.id, service.nameEn, service.nameGu, service.durationMin, service.price, service.isActive ? 1 : 0, service.category, service.descriptionEn || '', service.descriptionGu || '']
    );
  }
  persistDb();
}

export function deleteService(serviceId: string) {
  db.run('DELETE FROM services WHERE id = ?', [serviceId]);
  persistDb();
}

export function getBarbers(): Barber[] {
  const res = db.exec('SELECT * FROM barbers');
  if (!res[0]) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((col, idx) => (obj[col] = row[idx]));
    obj.isOnDuty = Boolean(obj.isOnDuty);
    return obj as Barber;
  });
}

export function updateBarber(barber: Barber) {
  db.run(
    `UPDATE barbers SET name = ?, nameGu = ?, avatar = ?, status = ?, isOnDuty = ?, currentTicketId = ?
     WHERE id = ?`,
    [barber.name, barber.nameGu, barber.avatar, barber.status, barber.isOnDuty ? 1 : 0, barber.currentTicketId || null, barber.id]
  );
  persistDb();
}

export function getTickets(): Ticket[] {
  const res = db.exec('SELECT * FROM tickets ORDER BY sequence ASC');
  if (!res[0]) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((col, idx) => (obj[col] = row[idx]));
    try {
      obj.serviceIds = JSON.parse(obj.serviceIds);
    } catch {
      obj.serviceIds = [];
    }
    try {
      obj.services = JSON.parse(obj.servicesJson);
    } catch {
      obj.services = [];
    }
    obj.isWalkIn = Boolean(obj.isWalkIn);
    return obj as Ticket;
  });
}

export function getTicketById(id: string): Ticket | undefined {
  return getTickets().find((t) => t.id === id || t.tokenNumber.toLowerCase() === id.toLowerCase());
}

export function getNextSequence(): number {
  const res = db.exec('SELECT MAX(sequence) as maxSeq FROM tickets');
  const currentMax = res[0]?.values[0]?.[0];
  return typeof currentMax === 'number' ? currentMax + 1 : 1;
}

export function createTicket(ticket: Ticket) {
  db.run(
    `INSERT INTO tickets (id, tokenNumber, sequence, customerName, customerPhone, serviceIds, servicesJson, preferredBarberId, assignedBarberId, assignedBarberName, status, totalDurationMin, totalPrice, createdAt, calledAt, inChairAt, doneAt, isWalkIn)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ticket.id,
      ticket.tokenNumber,
      ticket.sequence,
      ticket.customerName,
      ticket.customerPhone,
      JSON.stringify(ticket.serviceIds),
      JSON.stringify(ticket.services),
      ticket.preferredBarberId,
      ticket.assignedBarberId || null,
      ticket.assignedBarberName || null,
      ticket.status,
      ticket.totalDurationMin,
      ticket.totalPrice,
      ticket.createdAt,
      ticket.calledAt || null,
      ticket.inChairAt || null,
      ticket.doneAt || null,
      ticket.isWalkIn ? 1 : 0,
    ]
  );
  persistDb();
}

export function updateTicket(ticket: Ticket) {
  db.run(
    `UPDATE tickets SET
      assignedBarberId = ?,
      assignedBarberName = ?,
      status = ?,
      calledAt = ?,
      inChairAt = ?,
      doneAt = ?
     WHERE id = ?`,
    [
      ticket.assignedBarberId || null,
      ticket.assignedBarberName || null,
      ticket.status,
      ticket.calledAt || null,
      ticket.inChairAt || null,
      ticket.doneAt || null,
      ticket.id,
    ]
  );
  persistDb();
}

export function getSettings(): QueueSettings {
  const res = db.exec('SELECT key, value FROM settings');
  const map: Record<string, string> = {};
  if (res[0]) {
    res[0].values.forEach(([k, v]) => {
      map[k as string] = v as string;
    });
  }
  return {
    isOpen: map['isOpen'] !== 'false',
    closedMessage: map['closedMessage'] || 'Online queue is closed.',
    adminPin: map['adminPin'] || '1234',
    openingTime: map['openingTime'] || '09:00 AM',
    closingTime: map['closingTime'] || '09:00 PM',
  };
}

export function updateSettings(settings: Partial<QueueSettings>) {
  if (settings.isOpen !== undefined) {
    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('isOpen', ?)", [settings.isOpen ? 'true' : 'false']);
  }
  if (settings.closedMessage !== undefined) {
    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('closedMessage', ?)", [settings.closedMessage]);
  }
  if (settings.adminPin !== undefined) {
    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('adminPin', ?)", [settings.adminPin]);
  }
  persistDb();
}

/**
 * Resets the active queue or seeds realistic demo data.
 */
export function resetQueue(seedDemoData: boolean = false) {
  db.run('DELETE FROM tickets');
  
  // Reset barber status
  db.run("UPDATE barbers SET status = 'FREE', currentTicketId = NULL");

  if (seedDemoData) {
    const allServices = getServices();
    const barbers = getBarbers();
    const dummyCustomers = [
      { name: 'Kunal Shah', phone: '9876543210', srv: [allServices[0]], barber: 'barber-ravi' },
      { name: 'Pooja Mehta', phone: '9823456789', srv: [allServices[0], allServices[1]], barber: 'ANY' },
      { name: 'Hardik Patel', phone: '9988776655', srv: [allServices[1]], barber: 'barber-amit' },
      { name: 'Bhavin Dave', phone: '9123456780', srv: [allServices[3], allServices[0]], barber: 'ANY' },
      { name: 'Sanjay Joshi', phone: '9765432109', srv: [allServices[2]], barber: 'barber-imran' },
    ];

    let seq = 1;
    for (const c of dummyCustomers) {
      const duration = c.srv.reduce((a, b) => a + b.durationMin, 0);
      const price = c.srv.reduce((a, b) => a + b.price, 0);
      const ticket: Ticket = {
        id: `tkt-${Date.now()}-${seq}`,
        tokenNumber: `S-${seq}`,
        sequence: seq,
        customerName: c.name,
        customerPhone: c.phone,
        serviceIds: c.srv.map((s) => s.id),
        services: c.srv,
        preferredBarberId: c.barber,
        status: 'WAITING',
        totalDurationMin: duration,
        totalPrice: price,
        createdAt: Date.now() - (dummyCustomers.length - seq) * 4 * 60000,
        isWalkIn: seq % 2 === 0,
      };
      createTicket(ticket);
      seq++;
    }
  }

  persistDb();
}
