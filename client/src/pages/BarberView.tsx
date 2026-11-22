import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { Barber, Ticket } from '../types';
import { Scissors, Play, CheckCircle2, Coffee, Clock, Sparkles, User, AlertCircle, ArrowLeft } from 'lucide-react';

interface BarberViewProps {
  barberParam?: string;
  navigate: (path: string) => void;
}

export const BarberView: React.FC<BarberViewProps> = ({ barberParam, navigate }) => {
  const { t, language } = useLanguage();
  const {
    barbers,
    tickets,
    callNext,
    startService,
    doneService,
    toggleBarberBreak,
  } = useQueue();

  const isGu = language === 'gu';

  // Select barber based on URL param or default to first barber
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');

  useEffect(() => {
    if (barbers.length > 0) {
      if (barberParam) {
        const decoded = decodeURIComponent(barberParam).toLowerCase();
        const matched = barbers.find(
          (b) => b.id.toLowerCase().includes(decoded) || b.name.toLowerCase().includes(decoded)
        );
        if (matched) {
          setSelectedBarberId(matched.id);
          return;
        }
      }
      if (!selectedBarberId) {
        setSelectedBarberId(barbers[0].id);
      }
    }
  }, [barberParam, barbers, selectedBarberId]);

  const activeBarber = barbers.find((b) => b.id === selectedBarberId) || barbers[0];

  // Current in-chair or called ticket for this barber
  const activeTicket = activeBarber?.currentTicketId
    ? tickets.find((t) => t.id === activeBarber.currentTicketId)
    : null;

  // Live stopwatch timer calculation
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startTime = activeTicket?.inChairAt || activeTicket?.calledAt;
    if (!startTime) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const sec = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(sec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeTicket]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Find next eligible ticket for this barber
  const nextTicket = React.useMemo(() => {
    if (!activeBarber) return null;
    const waiting = tickets
      .filter((t) => t.status === 'WAITING')
      .sort((a, b) => a.sequence - b.sequence);

    return waiting.find(
      (t) => t.preferredBarberId === activeBarber.id || t.preferredBarberId === 'ANY'
    );
  }, [tickets, activeBarber]);

  if (!activeBarber) {
    return (
      <div className="max-w-md mx-auto py-20 text-center text-slate-400">
        Loading barber screen...
      </div>
    );
  }

  const barberName = isGu && activeBarber.nameGu ? activeBarber.nameGu : activeBarber.name;
  const isOnBreak = activeBarber.status === 'ON_BREAK';
  const isCalled = activeTicket?.status === 'CALLED';
  const isInChair = activeTicket?.status === 'IN_CHAIR';

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-fade-in">
      {/* Top Bar with Barber Selection Tabs */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-3 sm:p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold uppercase tracking-wider">{t('selectBarberTab')}</span>
          <span className="text-[11px] font-mono text-gold-400">Station Mirror Mode</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {barbers.map((b) => {
            const isSelected = b.id === activeBarber.id;
            const bName = isGu && b.nameGu ? b.nameGu : b.name;
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBarberId(b.id)}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-1.5 ${
                  isSelected
                    ? 'gold-gradient text-charcoal-950 shadow-md shadow-gold-500/20'
                    : 'bg-charcoal-950 text-slate-300 hover:bg-charcoal-800 border border-charcoal-700'
                }`}
              >
                <span className="truncate">{bName.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barber Active Header & Status Toggle */}
      <div className="flex items-center justify-between bg-charcoal-900 border border-charcoal-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <img
            src={activeBarber.avatar}
            alt={activeBarber.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-gold-500/40"
          />
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white">
              {barberName}
            </h1>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnBreak
                    ? 'bg-rose-400'
                    : activeBarber.status === 'FREE'
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-xs text-slate-400 font-semibold">
                {isOnBreak
                  ? t('statusBreak')
                  : activeBarber.status === 'FREE'
                  ? t('statusFree')
                  : t('statusBusy')}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => toggleBarberBreak(activeBarber.id)}
          className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold transition flex items-center space-x-1.5 ${
            isOnBreak
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
              : 'bg-charcoal-800 border-charcoal-700 text-slate-400 hover:text-white'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>{isOnBreak ? t('resumeToggle') : t('onBreakToggle')}</span>
        </button>
      </div>

      {/* Main Chair Card */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-charcoal-800 pb-3">
          <span className="text-xs uppercase font-extrabold tracking-widest text-gold-400">
            {t('inChairWith')}
          </span>
          {activeTicket && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                isInChair
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-400 text-charcoal-950 animate-bounce'
              }`}
            >
              {isInChair ? t('statusInChair') : t('statusCalled')}
            </span>
          )}
        </div>

        {activeTicket ? (
          <div className="space-y-6">
            {/* Customer & Token Display */}
            <div className="text-center space-y-1">
              <div className="text-5xl sm:text-6xl font-black tracking-tight text-white">
                {activeTicket.tokenNumber}
              </div>
              <div className="text-xl font-extrabold text-slate-200">
                {activeTicket.customerName}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {activeTicket.customerPhone}
              </div>
            </div>

            {/* Live Stopwatch Timer */}
            <div className="p-4 rounded-2xl bg-charcoal-950 border border-charcoal-800 flex items-center justify-around">
              <div className="text-center">
                <span className="text-xs text-slate-400 block">{t('timerElapsed')}</span>
                <span className="text-3xl font-black text-amber-400 font-mono">
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>
              <div className="h-8 w-px bg-charcoal-800" />
              <div className="text-center">
                <span className="text-xs text-slate-400 block">{t('totalDuration')}</span>
                <span className="text-2xl font-bold text-white">
                  {activeTicket.totalDurationMin} min
                </span>
              </div>
            </div>

            {/* Services List */}
            <div className="p-3.5 rounded-xl bg-charcoal-950 border border-charcoal-800/80 text-xs">
              <span className="text-slate-400 block font-semibold mb-1">
                Requested Services:
              </span>
              <div className="font-bold text-white space-y-1">
                {activeTicket.services.map((s, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{isGu ? s.nameGu : s.nameEn}</span>
                    <span className="text-gold-400 font-mono">₹{s.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BIG ACTION BUTTONS */}
            <div className="space-y-3 pt-2">
              {isCalled && (
                <button
                  onClick={() => startService(activeBarber.id)}
                  className="w-full min-h-[52px] py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-black text-base sm:text-lg shadow-xl shadow-emerald-500/20 active:scale-[0.99] transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{t('startServiceBtn')} (Customer Sat)</span>
                </button>
              )}

              {isInChair && (
                <button
                  onClick={() => doneService(activeBarber.id)}
                  className="w-full min-h-[52px] py-4 rounded-2xl gold-gradient text-charcoal-950 font-black text-base sm:text-lg shadow-xl shadow-gold-500/25 active:scale-[0.99] transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{t('doneServiceBtn')}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-charcoal-950 border border-charcoal-800 mx-auto flex items-center justify-center text-slate-500">
              <Scissors className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{t('noClientInChair')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {isOnBreak
                  ? 'You are currently marked on break. Toggle available when ready.'
                  : 'Ready to take the next customer in queue.'}
              </p>
            </div>

            <button
              disabled={isOnBreak || !nextTicket}
              onClick={async () => {
                const res = await callNext(activeBarber.id);
                if (!res.success) {
                  alert(res.error || 'No customer to call.');
                }
              }}
              className="w-full min-h-[52px] py-3.5 rounded-2xl gold-gradient text-charcoal-950 font-black text-base transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-gold-500/20 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t('callNextBtn')}</span>
            </button>
          </div>
        )}
      </div>

      {/* "Next for You" Upcoming Ticket Preview Card */}
      <div className="p-5 rounded-3xl bg-charcoal-900 border border-charcoal-800 space-y-3">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-gold-400 flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>{t('nextForYou')}</span>
        </h3>

        {nextTicket ? (
          <div className="p-3.5 rounded-2xl bg-charcoal-950 border border-charcoal-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center font-black text-gold-400 text-sm">
                {nextTicket.tokenNumber}
              </div>
              <div>
                <div className="font-extrabold text-sm text-white">
                  {nextTicket.customerName}
                </div>
                <div className="text-xs text-slate-400">
                  {nextTicket.services.map((s) => (isGu ? s.nameGu : s.nameEn)).join(', ')} ({nextTicket.totalDurationMin} min)
                </div>
              </div>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-charcoal-800 text-slate-300 border border-charcoal-700">
              {nextTicket.preferredBarberId === activeBarber.id ? 'Preferred You' : 'Any Barber'}
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            {t('noUpcomingForBarber')}
          </p>
        )}
      </div>
    </div>
  );
};
