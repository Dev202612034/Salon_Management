export type BarberStatus = 'FREE' | 'BUSY' | 'ON_BREAK';

export interface Barber {
  id: string;
  name: string;
  nameGu: string;
  avatar: string;
  status: BarberStatus;
  isOnDuty: boolean;
  currentTicketId?: string | null;
}

export interface SalonService {
  id: string;
  nameEn: string;
  nameGu: string;
  durationMin: number;
  price: number;
  isActive: boolean;
  category: string;
  descriptionEn?: string;
  descriptionGu?: string;
}

export type TicketStatus = 
  | 'WAITING' 
  | 'CALLED' 
  | 'IN_CHAIR' 
  | 'DONE' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export interface Ticket {
  id: string;
  tokenNumber: string;
  sequence: number;
  customerName: string;
  customerPhone: string;
  serviceIds: string[];
  services: SalonService[];
  preferredBarberId: string;
  assignedBarberId?: string | null;
  assignedBarberName?: string | null;
  status: TicketStatus;
  totalDurationMin: number;
  totalPrice: number;
  createdAt: number;
  calledAt?: number | null;
  inChairAt?: number | null;
  doneAt?: number | null;
  isWalkIn: boolean;
}

export interface QueueSettings {
  isOpen: boolean;
  closedMessage: string;
  adminPin: string;
  openingTime: string;
  closingTime: string;
}

export interface QueueStats {
  servedToday: number;
  avgWaitMin: number;
  waitingCount: number;
  noShowCount: number;
  cancelledCount: number;
}
