import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { Scissors, Clock, Users, Sparkles, Volume2 } from 'lucide-react';
import { chimePlayer } from '../components/AudioChime';

export const TvDisplay: React.FC = () => {
  const { t, language } = useLanguage();
  const { barbers, tickets, stats, lastCalledTicket } = useQueue();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [flashingTokenId, setFlashingTokenId] = useState<string | null>(null);

  const isGu = language === 'gu';

  // Live digital clock with seconds
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString(isGu ? 'gu-IN' : 'en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [isGu]);

  // Flash newly called token for 8 seconds
  useEffect(() => {
    if (lastCalledTicket) {
      setFlashingTokenId(lastCalledTicket.id);
      const timer = setTimeout(() => {
        setFlashingTokenId(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [lastCalledTicket]);

  // Up next: first 5 waiting tickets
  const upcomingTickets = tickets
    .filter((t) => t.status === 'WAITING')
    .sort((a, b) => a.sequence - b.sequence)
    .slice(0, 5);

  const activeBarbers = barbers.filter((b) => b.isOnDuty && b.status !== 'ON_BREAK');
  const barberCount = Math.max(1, activeBarbers.length);

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden">
      {/* 1. TV Header */}
      <header className="flex items-center justify-between border-b border-charcoal-800 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-2xl shadow-gold-500/30">
            <Scissors className="w-8 h-8 text-charcoal-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center space-x-3">
              <span>{t('tvTitle')}</span>
            </h1>
            <p className="text-sm sm:text-base text-gold-400 font-bold uppercase tracking-widest mt-0.5">
              {t('tvSubtitle')}
            </p>
          </div>
        </div>

        {/* Digital Clock & Audio Test */}
        <div className="flex items-center space-x-6 text-right">
          <button
            onClick={() => chimePlayer.playTurnChime()}
            title="Test audio chime"
            className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-charcoal-900 border border-charcoal-800 text-slate-400 hover:text-gold-400 text-xs transition"
          >
            <Volume2 className="w-4 h-4" />
            <span>Chime</span>
          </button>

          <div>
            <div className="text-3xl sm:text-5xl font-black text-white font-mono tracking-wider">
              {currentTime || '00:00:00'}
            </div>
            <div className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
              {currentDate}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Middle: Barber Stations ("Now Serving") */}
      <main className="my-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-gold-400 flex items-center space-x-3 uppercase tracking-wider">
            <Sparkles className="w-6 h-6" />
            <span>{t('tvNowServing')}</span>
          </h2>
          <div className="text-sm font-bold text-slate-400 flex items-center space-x-2">
            <Users className="w-4 h-4 text-gold-400" />
            <span>{tickets.filter((t) => t.status === 'WAITING').length} {t('peopleWaiting')}</span>
          </div>
        </div>

        {/* Stations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {barbers.map((barber, index) => {
            const barberName = isGu && barber.nameGu ? barber.nameGu : barber.name;
            const activeTicket = barber.currentTicketId
              ? tickets.find((t) => t.id === barber.currentTicketId)
              : null;
            const isFlashing = activeTicket && activeTicket.id === flashingTokenId;
            const isOnBreak = barber.status === 'ON_BREAK';
            const isCalled = activeTicket?.status === 'CALLED';

            return (
              <div
                key={barber.id}
                className={`relative rounded-3xl p-6 sm:p-8 border-2 transition-all duration-500 overflow-hidden ${
                  isFlashing
                    ? 'gold-gradient text-charcoal-950 scale-105 shadow-2xl shadow-gold-500/50 border-amber-300 animate-pulse-gold'
                    : activeTicket
                    ? 'bg-charcoal-900/90 border-gold-500/50 shadow-xl shadow-gold-500/10'
                    : 'bg-charcoal-900/40 border-charcoal-800'
                }`}
              >
                {/* Station header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-charcoal-800/60 pb-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={barber.avatar}
                      alt={barber.name}
                      className="w-12 h-12 rounded-xl object-cover border border-charcoal-700 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className={`text-xs font-bold uppercase tracking-wider truncate ${isFlashing ? 'text-charcoal-900' : 'text-slate-400'}`}>
                        {t('tvStation')} {index + 1}
                      </div>
                      <h3 className={`text-base sm:text-lg font-black truncate ${isFlashing ? 'text-charcoal-950' : 'text-white'}`}>
                        {barberName}
                      </h3>
                    </div>
                  </div>

                  <span
                    className={`self-start sm:self-auto px-3 py-1 rounded-full text-[11px] sm:text-xs font-extrabold uppercase flex-shrink-0 ${
                      isFlashing
                        ? 'bg-charcoal-950 text-gold-400 animate-bounce'
                        : isCalled
                        ? 'bg-amber-400 text-charcoal-950 animate-bounce'
                        : activeTicket
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isOnBreak
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-charcoal-800 text-slate-400'
                    }`}
                  >
                    {isCalled
                      ? 'CALLING...'
                      : activeTicket
                      ? 'IN CHAIR'
                      : isOnBreak
                      ? 'ON BREAK'
                      : 'AVAILABLE'}
                  </span>
                </div>

                {/* Token Callout */}
                <div className="py-6 sm:py-8 text-center space-y-2">
                  {activeTicket ? (
                    <>
                      <div className="text-xs uppercase font-extrabold tracking-widest opacity-80">
                        {isFlashing ? 'PLEASE PROCEED TO CHAIR' : 'TOKEN NUMBER'}
                      </div>
                      <div
                        className={`text-6xl sm:text-7xl font-black tracking-tight ${
                          isFlashing ? 'text-charcoal-950' : 'text-white'
                        }`}
                      >
                        {activeTicket.tokenNumber}
                      </div>
                      <div
                        className={`text-xl sm:text-2xl font-bold truncate px-4 ${
                          isFlashing ? 'text-charcoal-900' : 'text-slate-300'
                        }`}
                      >
                        {activeTicket.customerName}
                      </div>
                    </>
                  ) : (
                    <div className="py-6 text-slate-500 font-bold text-lg">
                      {isOnBreak ? 'Barber on Break' : 'Ready for Customer'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 3. Bottom Section: Next 5 Tokens in Queue */}
      <footer className="bg-charcoal-900/90 border border-charcoal-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-slate-200 flex items-center space-x-2 uppercase tracking-wider">
            <Clock className="w-5 h-5 text-gold-400" />
            <span>{t('tvUpcomingTokens')}</span>
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            First-Come, First-Served (FCFS)
          </span>
        </div>

        {upcomingTickets.length === 0 ? (
          <div className="py-4 text-center text-slate-500 text-sm font-semibold">
            {t('tvNoUpcoming')}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {upcomingTickets.map((ticket, idx) => {
              // Estimate minutes ahead
              const priorTickets = upcomingTickets.slice(0, idx);
              const sumPrior = priorTickets.reduce((a, b) => a + b.totalDurationMin, 0);
              const estWait = Math.max(5, Math.ceil(sumPrior / barberCount));

              const prefBarber =
                ticket.preferredBarberId !== 'ANY'
                  ? barbers.find((b) => b.id === ticket.preferredBarberId)?.name?.split(' ')[0]
                  : 'Any';

              return (
                <div
                  key={ticket.id}
                  className="p-4 rounded-2xl bg-charcoal-950 border border-charcoal-800 flex flex-col justify-between space-y-2 hover:border-charcoal-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-charcoal-800 text-gold-400 border border-charcoal-700">
                      ~{estWait} min
                    </span>
                  </div>

                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      {ticket.tokenNumber}
                    </div>
                    <div className="text-xs font-bold text-slate-300 truncate mt-0.5">
                      {ticket.customerName}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1 border-t border-charcoal-900 flex justify-between">
                    <span>Barber:</span>
                    <strong className="text-slate-300">{prefBarber}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </footer>
    </div>
  );
};
