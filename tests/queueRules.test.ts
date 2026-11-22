import { describe, it, expect } from 'vitest';
import {
  isValidStatusTransition,
  isValidPhoneNumber,
  findActiveTicketForPhone,
  validateServiceSelection,
  getNextEligibleTicket,
  calculateEstimatedWaitTime,
  calculateQueuePosition,
  computeQueueStats,
} from '../server/queueRules';
import { Ticket, Barber, SalonService } from '../server/types';

describe('Salon Queue Management System - Business Logic & Rules', () => {
  const dummyServices: SalonService[] = [
    {
      id: 'srv-1',
      nameEn: 'Haircut & Styling',
      nameGu: 'વાળ કાપવા અને સ્ટાઇલિંગ',
      durationMin: 30,
      price: 150,
      isActive: true,
      category: 'Hair',
    },
    {
      id: 'srv-2',
      nameEn: 'Beard Trim & Shape',
      nameGu: 'દાઢી સેટિંગ અને ટ્રિમ',
      durationMin: 15,
      price: 80,
      isActive: true,
      category: 'Beard',
    },
    {
      id: 'srv-3',
      nameEn: 'Luxury Hair Spa',
      nameGu: 'લક્ઝરી હેર સ્પા',
      durationMin: 45,
      price: 400,
      isActive: true,
      category: 'Hair',
    },
    {
      id: 'srv-4',
      nameEn: 'Inactive Service',
      nameGu: 'બંધ સેવા',
      durationMin: 60,
      price: 500,
      isActive: false,
      category: 'Special',
    },
  ];

  const dummyBarbers: Barber[] = [
    {
      id: 'barber-ravi',
      name: 'Ravi Sharma',
      nameGu: 'રવિ શર્મા',
      avatar: 'ravi.jpg',
      status: 'FREE',
      isOnDuty: true,
    },
    {
      id: 'barber-amit',
      name: 'Amit Varma',
      nameGu: 'અમિત વર્મા',
      avatar: 'amit.jpg',
      status: 'FREE',
      isOnDuty: true,
    },
    {
      id: 'barber-imran',
      name: 'Imran Khan',
      nameGu: 'ઇમરાન ખાન',
      avatar: 'imran.jpg',
      status: 'FREE',
      isOnDuty: true,
    },
  ];

  // TC-01: Multi-Service Calculation
  it('TC-01: Multi-Service Calculation (Haircut 30m ₹150 + Beard 15m ₹80 = 45m ₹230)', () => {
    const result = validateServiceSelection(['srv-1', 'srv-2'], dummyServices);
    expect(result.valid).toBe(true);
    expect(result.totalDuration).toBe(45);
    expect(result.totalPrice).toBe(230);
    expect(result.services.length).toBe(2);
  });

  it('TC-01b: Enforces minimum 1 service and maximum 3 services', () => {
    const emptyResult = validateServiceSelection([], dummyServices);
    expect(emptyResult.valid).toBe(false);

    const overMax = validateServiceSelection(['srv-1', 'srv-2', 'srv-3', 'srv-4'], dummyServices);
    expect(overMax.valid).toBe(false);
    expect(overMax.error).toContain('Maximum 3 services');

    const inactiveResult = validateServiceSelection(['srv-4'], dummyServices);
    expect(inactiveResult.valid).toBe(false);
  });

  // TC-02: Phone Validation & Duplicate Active Spot Check
  it('TC-02: Phone Validation accepts valid 10-digit Indian numbers and rejects invalid', () => {
    expect(isValidPhoneNumber('9876543210')).toBe(true);
    expect(isValidPhoneNumber('8123456789')).toBe(true);
    expect(isValidPhoneNumber('7000000000')).toBe(true);
    expect(isValidPhoneNumber('6999999999')).toBe(true);

    expect(isValidPhoneNumber('1234567890')).toBe(false); // Does not start with 6-9
    expect(isValidPhoneNumber('98765')).toBe(false); // Too short
    expect(isValidPhoneNumber('987654321000')).toBe(false); // Too long
    expect(isValidPhoneNumber('abcdefghij')).toBe(false);
  });

  it('TC-02b: Duplicate active spot prevention - returns existing active ticket for same phone', () => {
    const tickets: Ticket[] = [
      {
        id: 'tkt-1',
        tokenNumber: 'S-1',
        sequence: 1,
        customerName: 'Kunal',
        customerPhone: '9876543210',
        serviceIds: ['srv-1'],
        services: [dummyServices[0]],
        preferredBarberId: 'barber-ravi',
        status: 'WAITING',
        totalDurationMin: 30,
        totalPrice: 150,
        createdAt: Date.now(),
        isWalkIn: false,
      },
    ];

    const existing = findActiveTicketForPhone(tickets, '9876543210');
    expect(existing).toBeDefined();
    expect(existing?.tokenNumber).toBe('S-1');

    const notFound = findActiveTicketForPhone(tickets, '9123456780');
    expect(notFound).toBeUndefined();
  });

  // TC-03: Barber Preference Isolation
  it('TC-03: Barber Preference Isolation - Amit calling next MUST skip a customer who requested Ravi', () => {
    const tickets: Ticket[] = [
      {
        id: 'tkt-ravi-lover',
        tokenNumber: 'S-1',
        sequence: 1,
        customerName: 'Hardik (wants Ravi only)',
        customerPhone: '9876543211',
        serviceIds: ['srv-1'],
        services: [dummyServices[0]],
        preferredBarberId: 'barber-ravi', // explicitly Ravi
        status: 'WAITING',
        totalDurationMin: 30,
        totalPrice: 150,
        createdAt: Date.now(),
        isWalkIn: false,
      },
      {
        id: 'tkt-any-lover',
        tokenNumber: 'S-2',
        sequence: 2,
        customerName: 'Pooja (chose Any)',
        customerPhone: '9876543212',
        serviceIds: ['srv-2'],
        services: [dummyServices[1]],
        preferredBarberId: 'ANY', // Any barber
        status: 'WAITING',
        totalDurationMin: 15,
        totalPrice: 80,
        createdAt: Date.now(),
        isWalkIn: false,
      },
    ];

    // Amit calls next: must SKIP Hardik (who chose Ravi) and pick Pooja (who chose Any)
    const amitNext = getNextEligibleTicket(tickets, 'barber-amit');
    expect(amitNext).toBeDefined();
    expect(amitNext?.id).toBe('tkt-any-lover');
    expect(amitNext?.customerName).toBe('Pooja (chose Any)');

    // Ravi calls next: will take the earliest (Hardik)
    const raviNext = getNextEligibleTicket(tickets, 'barber-ravi');
    expect(raviNext).toBeDefined();
    expect(raviNext?.id).toBe('tkt-ravi-lover');
  });

  // Status Machine: Strict Forward-Only Transitions
  it('TC-05: Valid Forward-Only State Transitions & Terminal States', () => {
    // WAITING can go to CALLED or CANCELLED
    expect(isValidStatusTransition('WAITING', 'CALLED')).toBe(true);
    expect(isValidStatusTransition('WAITING', 'CANCELLED')).toBe(true);
    expect(isValidStatusTransition('WAITING', 'DONE')).toBe(false);
    expect(isValidStatusTransition('WAITING', 'IN_CHAIR')).toBe(false);

    // CALLED can go to IN_CHAIR or NO_SHOW
    expect(isValidStatusTransition('CALLED', 'IN_CHAIR')).toBe(true);
    expect(isValidStatusTransition('CALLED', 'NO_SHOW')).toBe(true);
    expect(isValidStatusTransition('CALLED', 'WAITING')).toBe(false); // Never backwards!

    // IN_CHAIR can only go to DONE
    expect(isValidStatusTransition('IN_CHAIR', 'DONE')).toBe(true);
    expect(isValidStatusTransition('IN_CHAIR', 'WAITING')).toBe(false);
    expect(isValidStatusTransition('IN_CHAIR', 'CALLED')).toBe(false);

    // Terminal states cannot transition
    expect(isValidStatusTransition('DONE', 'WAITING')).toBe(false);
    expect(isValidStatusTransition('CANCELLED', 'WAITING')).toBe(false);
    expect(isValidStatusTransition('NO_SHOW', 'WAITING')).toBe(false);
  });

  // TC-09: Waiting Time and Position Calculation
  it('TC-09: Queue position and estimated wait time calculations', () => {
    const tickets: Ticket[] = [
      {
        id: 't-1',
        tokenNumber: 'S-1',
        sequence: 1,
        customerName: 'Alice',
        customerPhone: '9000000001',
        serviceIds: ['srv-1'],
        services: [dummyServices[0]],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        totalDurationMin: 30,
        totalPrice: 150,
        createdAt: Date.now(),
        isWalkIn: false,
      },
      {
        id: 't-2',
        tokenNumber: 'S-2',
        sequence: 2,
        customerName: 'Bob',
        customerPhone: '9000000002',
        serviceIds: ['srv-2'],
        services: [dummyServices[1]],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        totalDurationMin: 15,
        totalPrice: 80,
        createdAt: Date.now(),
        isWalkIn: false,
      },
      {
        id: 't-3',
        tokenNumber: 'S-3',
        sequence: 3,
        customerName: 'Charlie',
        customerPhone: '9000000003',
        serviceIds: ['srv-1'],
        services: [dummyServices[0]],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        totalDurationMin: 30,
        totalPrice: 150,
        createdAt: Date.now(),
        isWalkIn: false,
      },
    ];

    expect(calculateQueuePosition('t-1', tickets)).toBe(1);
    expect(calculateQueuePosition('t-2', tickets)).toBe(2);
    expect(calculateQueuePosition('t-3', tickets)).toBe(3);

    // Estimated wait for Charlie (t-3):
    // Ahead: Alice (30m) + Bob (15m) = 45m.
    // 3 active barbers: 45 / 3 = 15 minutes!
    const charlieWait = calculateEstimatedWaitTime(tickets[2], tickets, dummyBarbers);
    expect(charlieWait).toBe(15);
  });

  // Today's Operational Stats
  it('Computes operational stats accurately', () => {
    const now = Date.now();
    const tickets: Ticket[] = [
      {
        id: 't-done-1',
        tokenNumber: 'S-1',
        sequence: 1,
        customerName: 'Done 1',
        customerPhone: '9000000010',
        serviceIds: ['srv-1'],
        services: [dummyServices[0]],
        preferredBarberId: 'ANY',
        status: 'DONE',
        totalDurationMin: 30,
        totalPrice: 150,
        createdAt: now - 30 * 60000,
        calledAt: now - 10 * 60000, // waited 20 min
        doneAt: now,
        isWalkIn: false,
      },
      {
        id: 't-wait-1',
        tokenNumber: 'S-2',
        sequence: 2,
        customerName: 'Waiting 1',
        customerPhone: '9000000011',
        serviceIds: ['srv-1'],
        services: [dummyServices[0]],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        totalDurationMin: 30,
        totalPrice: 150,
        createdAt: now,
        isWalkIn: false,
      },
      {
        id: 't-noshow-1',
        tokenNumber: 'S-3',
        sequence: 3,
        customerName: 'NoShow 1',
        customerPhone: '9000000012',
        serviceIds: ['srv-1'],
        services: [dummyServices[0]],
        preferredBarberId: 'ANY',
        status: 'NO_SHOW',
        totalDurationMin: 30,
        totalPrice: 150,
        createdAt: now - 40 * 60000,
        calledAt: now - 30 * 60000,
        isWalkIn: false,
      },
      {
        id: 't-cancel-1',
        tokenNumber: 'S-4',
        sequence: 4,
        customerName: 'Cancel 1',
        customerPhone: '9000000013',
        serviceIds: ['srv-1'],
        services: [dummyServices[0]],
        preferredBarberId: 'ANY',
        status: 'CANCELLED',
        totalDurationMin: 30,
        totalPrice: 150,
        createdAt: now - 15 * 60000,
        isWalkIn: false,
      },
    ];

    const stats = computeQueueStats(tickets);
    expect(stats.servedToday).toBe(1);
    expect(stats.waitingCount).toBe(1);
    expect(stats.noShowCount).toBe(1);
    expect(stats.cancelledCount).toBe(1);
    expect(stats.avgWaitMin).toBe(20);
  });
});
