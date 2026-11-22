import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Ticket, Barber, SalonService, QueueSettings, QueueStats } from '../types';
import { chimePlayer } from '../components/AudioChime';

interface QueueContextType {
  tickets: Ticket[];
  barbers: Barber[];
  services: SalonService[];
  settings: QueueSettings;
  stats: QueueStats;
  isLoading: boolean;
  isConnected: boolean;
  lastCalledTicket: Ticket | null;
  joinQueue: (data: { customerName: string; customerPhone: string; serviceIds: string[]; preferredBarberId: string }) => Promise<{ success: boolean; ticket?: Ticket; position?: number; estimatedWaitMin?: number; error?: string; existingTicket?: Ticket }>;
  addWalkin: (data: { customerName: string; customerPhone: string; serviceIds: string[]; preferredBarberId: string }) => Promise<{ success: boolean; ticket?: Ticket; error?: string }>;
  cancelTicket: (ticketId: string) => Promise<{ success: boolean; error?: string }>;
  callNext: (barberId: string) => Promise<{ success: boolean; ticket?: Ticket; error?: string }>;
  startService: (barberId: string) => Promise<{ success: boolean; error?: string }>;
  doneService: (barberId: string) => Promise<{ success: boolean; error?: string }>;
  markNoShow: (ticketId: string) => Promise<{ success: boolean; error?: string }>;
  toggleBarberBreak: (barberId: string) => Promise<{ success: boolean; error?: string }>;
  toggleBarberDuty: (barberId: string) => Promise<{ success: boolean; error?: string }>;
  saveServiceAdmin: (service: Partial<SalonService>) => Promise<{ success: boolean; error?: string }>;
  deleteServiceAdmin: (serviceId: string) => Promise<{ success: boolean; error?: string }>;
  updateSettingsAdmin: (settings: Partial<QueueSettings>) => Promise<{ success: boolean; error?: string }>;
  resetQueueAdmin: (seedDemo?: boolean) => Promise<{ success: boolean; error?: string }>;
  fetchTicket: (id: string) => Promise<{ ticket?: Ticket; position?: number; estimatedWaitMin?: number; error?: string }>;
}

const defaultSettings: QueueSettings = {
  isOpen: true,
  closedMessage: 'Online queue is currently closed. Walk-ins are welcome at counter.',
  adminPin: '1234',
  openingTime: '09:00 AM',
  closingTime: '09:00 PM',
};

const defaultStats: QueueStats = {
  servedToday: 0,
  avgWaitMin: 18,
  waitingCount: 0,
  noShowCount: 0,
  cancelledCount: 0,
};

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<SalonService[]>([]);
  const [settings, setSettings] = useState<QueueSettings>(defaultSettings);
  const [stats, setStats] = useState<QueueStats>(defaultStats);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastCalledTicket, setLastCalledTicket] = useState<Ticket | null>(null);

  // Determine socket url
  useEffect(() => {
    const socketUrl = window.location.port === '5173' ? 'http://localhost:3001' : window.location.origin;
    const socket: Socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[QueueContext] Socket connected to', socketUrl);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[QueueContext] Socket disconnected');
    });

    socket.on('queue:updated', (payload: any) => {
      if (payload.tickets) setTickets(payload.tickets);
      if (payload.barbers) setBarbers(payload.barbers);
      if (payload.services) setServices(payload.services);
      if (payload.settings) setSettings(payload.settings);
      if (payload.stats) setStats(payload.stats);
      setIsLoading(false);
    });

    socket.on('ticket:called', (ticket: Ticket) => {
      setLastCalledTicket(ticket);
      chimePlayer.playTurnChime();
    });

    // Initial fetch fallback
    fetch('/api/state')
      .then((res) => res.json())
      .then((data) => {
        if (data.tickets) setTickets(data.tickets);
        if (data.barbers) setBarbers(data.barbers);
        if (data.services) setServices(data.services);
        if (data.settings) setSettings(data.settings);
        if (data.stats) setStats(data.stats);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Initial state fetch error:', err);
        setIsLoading(false);
      });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinQueue = useCallback(async (data: { customerName: string; customerPhone: string; serviceIds: string[]; preferredBarberId: string }) => {
    try {
      const res = await fetch('/api/queue/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: json.message || json.error || 'Failed to join queue',
          existingTicket: json.ticket,
        };
      }
      return {
        success: true,
        ticket: json.ticket,
        position: json.position,
        estimatedWaitMin: json.estimatedWaitMin,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const addWalkin = useCallback(async (data: { customerName: string; customerPhone: string; serviceIds: string[]; preferredBarberId: string }) => {
    try {
      const res = await fetch('/api/queue/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to add walk-in' };
      }
      return { success: true, ticket: json.ticket };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const fetchTicket = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      const json = await res.json();
      if (!res.ok) {
        return { error: json.error || 'Ticket not found' };
      }
      return {
        ticket: json.ticket,
        position: json.position,
        estimatedWaitMin: json.estimatedWaitMin,
      };
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  }, []);

  const cancelTicket = useCallback(async (ticketId: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/cancel`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to cancel ticket' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const callNext = useCallback(async (barberId: string) => {
    try {
      const res = await fetch(`/api/barbers/${barberId}/call-next`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to call next customer' };
      }
      return { success: true, ticket: json.ticket };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const startService = useCallback(async (barberId: string) => {
    try {
      const res = await fetch(`/api/barbers/${barberId}/start`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to start service' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const doneService = useCallback(async (barberId: string) => {
    try {
      const res = await fetch(`/api/barbers/${barberId}/done`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to complete service' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const markNoShow = useCallback(async (ticketId: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/noshow`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to mark no-show' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const toggleBarberBreak = useCallback(async (barberId: string) => {
    try {
      const res = await fetch(`/api/barbers/${barberId}/toggle-break`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to toggle break' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const toggleBarberDuty = useCallback(async (barberId: string) => {
    try {
      const res = await fetch(`/api/barbers/${barberId}/toggle-duty`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to toggle duty' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const saveServiceAdmin = useCallback(async (service: Partial<SalonService>) => {
    try {
      const url = service.id ? `/api/admin/services/${service.id}` : '/api/admin/services';
      const method = service.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to save service' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const deleteServiceAdmin = useCallback(async (serviceId: string) => {
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to delete service' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const updateSettingsAdmin = useCallback(async (newSettings: Partial<QueueSettings>) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to update settings' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const resetQueueAdmin = useCallback(async (seedDemo: boolean = false) => {
    try {
      const res = await fetch('/api/admin/queue/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedDemo }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to reset queue' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  return (
    <QueueContext.Provider
      value={{
        tickets,
        barbers,
        services,
        settings,
        stats,
        isLoading,
        isConnected,
        lastCalledTicket,
        joinQueue,
        addWalkin,
        cancelTicket,
        callNext,
        startService,
        doneService,
        markNoShow,
        toggleBarberBreak,
        toggleBarberDuty,
        saveServiceAdmin,
        deleteServiceAdmin,
        updateSettingsAdmin,
        resetQueueAdmin,
        fetchTicket,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
