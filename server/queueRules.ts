import { Ticket, TicketStatus, Barber, SalonService } from './types';

/**
 * Validates whether a status transition is allowed.
 * Strict forward-only state machine:
 * WAITING -> CALLED | CANCELLED
 * CALLED -> IN_CHAIR | NO_SHOW
 * IN_CHAIR -> DONE
 */
export function isValidStatusTransition(currentStatus: TicketStatus, targetStatus: TicketStatus): boolean {
  if (currentStatus === targetStatus) return true;

  switch (currentStatus) {
    case 'WAITING':
      return targetStatus === 'CALLED' || targetStatus === 'CANCELLED';
    case 'CALLED':
      return targetStatus === 'IN_CHAIR' || targetStatus === 'NO_SHOW';
    case 'IN_CHAIR':
      return targetStatus === 'DONE';
    case 'DONE':
    case 'CANCELLED':
    case 'NO_SHOW':
      return false; // Terminal states
    default:
      return false;
  }
}

/**
 * Validates Indian 10-digit phone number.
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Checks if a phone number already has an active spot in the queue.
 */
export function findActiveTicketForPhone(tickets: Ticket[], phone: string): Ticket | undefined {
  const cleaned = phone.replace(/[\s-]/g, '');
  return tickets.find(
    (t) =>
      t.customerPhone.replace(/[\s-]/g, '') === cleaned &&
      (t.status === 'WAITING' || t.status === 'CALLED' || t.status === 'IN_CHAIR')
  );
}

/**
 * Validates service selection (between 1 and 3 active services).
 */
export function validateServiceSelection(
  selectedIds: string[],
  availableServices: SalonService[]
): { valid: boolean; error?: string; services: SalonService[]; totalDuration: number; totalPrice: number } {
  if (!selectedIds || selectedIds.length === 0) {
    return { valid: false, error: 'Please select at least 1 service.', services: [], totalDuration: 0, totalPrice: 0 };
  }
  if (selectedIds.length > 3) {
    return { valid: false, error: 'Maximum 3 services can be selected.', services: [], totalDuration: 0, totalPrice: 0 };
  }

  const services: SalonService[] = [];
  let totalDuration = 0;
  let totalPrice = 0;

  for (const id of selectedIds) {
    const s = availableServices.find((srv) => srv.id === id && srv.isActive);
    if (!s) {
      return { valid: false, error: `Service '${id}' is either invalid or inactive.`, services: [], totalDuration: 0, totalPrice: 0 };
    }
    services.push(s);
    totalDuration += s.durationMin;
    totalPrice += s.price;
  }

  return { valid: true, services, totalDuration, totalPrice };
}

/**
 * Picks the next eligible ticket for a specific barber.
 * - Earliest WAITING ticket with preferredBarberId == barberId OR preferredBarberId == 'ANY'.
 * - If ticket prefers another barber (e.g. preferredBarberId == 'ravi' and barberId == 'amit'), it is skipped!
 */
export function getNextEligibleTicket(tickets: Ticket[], barberId: string): Ticket | null {
  const waitingTickets = tickets
    .filter((t) => t.status === 'WAITING')
    .sort((a, b) => a.sequence - b.sequence);

  for (const t of waitingTickets) {
    if (t.preferredBarberId === barberId || t.preferredBarberId === 'ANY') {
      return t;
    }
  }
  return null;
}

/**
 * Calculates estimated waiting time for a ticket.
 * Formula:
 * - If specific barber: sum of remaining service minutes of waiting tickets ahead preferring that barber or Any,
 *   plus estimated remaining time of current in-chair customer.
 * - If 'ANY': sum of durations of all waiting tickets ahead / active working barbers.
 */
export function calculateEstimatedWaitTime(
  ticket: Ticket,
  allTickets: Ticket[],
  barbers: Barber[]
): number {
  if (ticket.status !== 'WAITING') {
    return 0;
  }

  const activeBarbers = barbers.filter((b) => b.isOnDuty && b.status !== 'ON_BREAK');
  const barberCount = Math.max(1, activeBarbers.length);

  // Tickets ahead of this ticket in WAITING state
  const ticketsAhead = allTickets
    .filter((t) => t.status === 'WAITING' && t.sequence < ticket.sequence)
    .sort((a, b) => a.sequence - b.sequence);

  if (ticket.preferredBarberId !== 'ANY') {
    // Specific barber queue
    const relevantAhead = ticketsAhead.filter(
      (t) => t.preferredBarberId === ticket.preferredBarberId || t.preferredBarberId === 'ANY'
    );
    const sumAhead = relevantAhead.reduce((acc, curr) => acc + curr.totalDurationMin, 0);

    // Add estimated time left for that barber's current customer (if any)
    const targetBarber = barbers.find((b) => b.id === ticket.preferredBarberId);
    let inChairExtra = 0;
    if (targetBarber && targetBarber.currentTicketId) {
      const activeCurrent = allTickets.find((t) => t.id === targetBarber.currentTicketId && (t.status === 'IN_CHAIR' || t.status === 'CALLED'));
      if (activeCurrent) {
        // approximate remaining: roughly half or 15 mins default
        inChairExtra = Math.max(5, Math.round(activeCurrent.totalDurationMin * 0.5));
      }
    }
    return sumAhead + inChairExtra;
  } else {
    // 'ANY' barber: shared queue distribution
    const totalMinutesAhead = ticketsAhead.reduce((acc, curr) => acc + curr.totalDurationMin, 0);
    const estimated = Math.ceil(totalMinutesAhead / barberCount);
    return Math.max(5, estimated);
  }
}

/**
 * Calculates current queue position among active waiting tickets.
 */
export function calculateQueuePosition(ticketId: string, tickets: Ticket[]): number {
  const waitingTickets = tickets
    .filter((t) => t.status === 'WAITING')
    .sort((a, b) => a.sequence - b.sequence);

  const index = waitingTickets.findIndex((t) => t.id === ticketId);
  return index >= 0 ? index + 1 : 0;
}

/**
 * Computes today's operational stats.
 */
export function computeQueueStats(tickets: Ticket[]): {
  servedToday: number;
  avgWaitMin: number;
  waitingCount: number;
  noShowCount: number;
  cancelledCount: number;
} {
  const served = tickets.filter((t) => t.status === 'DONE');
  const waiting = tickets.filter((t) => t.status === 'WAITING');
  const noShows = tickets.filter((t) => t.status === 'NO_SHOW');
  const cancelled = tickets.filter((t) => t.status === 'CANCELLED');

  let totalWaitTime = 0;
  let waitCount = 0;
  for (const t of served) {
    if (t.calledAt && t.createdAt) {
      const waitMin = Math.max(1, Math.round((t.calledAt - t.createdAt) / 60000));
      totalWaitTime += waitMin;
      waitCount++;
    }
  }

  const avgWaitMin = waitCount > 0 ? Math.round(totalWaitTime / waitCount) : 18;

  return {
    servedToday: served.length,
    avgWaitMin,
    waitingCount: waiting.length,
    noShowCount: noShows.length,
    cancelledCount: cancelled.length,
  };
}
