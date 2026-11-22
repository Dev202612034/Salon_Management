import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { Ticket } from '../types';
import { Clock, Scissors, AlertCircle, ArrowLeft, CheckCircle2, XCircle, Sparkles, AlertTriangle } from 'lucide-react';
import { chimePlayer } from '../components/AudioChime';

interface MyStatusProps {
  ticketId: string;
  navigate: (path: string) => void;
}

export const MyStatus: React.FC<MyStatusProps> = ({ ticketId, navigate }) => {
  const { t, language } = useLanguage();
  const { tickets, barbers, cancelTicket, fetchTicket, lastCalledTicket } = useQueue();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [position, setPosition] = useState<number>(0);
  const [estimatedWaitMin, setEstimatedWaitMin] = useState<number>(0);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Find ticket from socket state or fetch by id
  useEffect(() => {
    const liveTicket = tickets.find(
      (t) => t.id === ticketId || t.tokenNumber.toLowerCase() === ticketId.toLowerCase()
    );

    if (liveTicket) {
      setTicket(liveTicket);
      // calculate position
      const waitingTickets = tickets
        .filter((t) => t.status === 'WAITING')
        .sort((a, b) => a.sequence - b.sequence);
      const pos = waitingTickets.findIndex((t) => t.id === liveTicket.id);
      setPosition(pos >= 0 ? pos + 1 : 0);

      // calculate wait time
      const activeBarbers = barbers.filter((b) => b.isOnDuty && b.status !== 'ON_BREAK');
      const bCount = Math.max(1, activeBarbers.length);
      const ticketsAhead = waitingTickets.slice(0, pos >= 0 ? pos : 0);
      const minutesAhead = ticketsAhead.reduce((acc, curr) => acc + curr.totalDurationMin, 0);
      setEstimatedWaitMin(Math.max(5, Math.ceil(minutesAhead / bCount)));
    } else {
      // Fetch initial
      fetchTicket(ticketId).then((res) => {
        if (res.ticket) {
          setTicket(res.ticket);
          setPosition(res.position || 0);
          setEstimatedWaitMin(res.estimatedWaitMin || 0);
        } else {
          setErrorMsg(res.error || 'Ticket not found');
        }
      });
    }
  }, [ticketId, tickets, barbers, fetchTicket]);

  // If this ticket is called via socket event, trigger turn chime
  useEffect(() => {
    if (ticket && lastCalledTicket && lastCalledTicket.id === ticket.id) {
      chimePlayer.playTurnChime();
    }
  }, [lastCalledTicket, ticket]);

  const handleCancelSpot = async () => {
    if (!ticket) return;
    setCancelLoading(true);
    const res = await cancelTicket(ticket.id);
    setCancelLoading(false);
    setShowCancelModal(false);
    if (!res.success) {
      alert(res.error || 'Failed to cancel ticket.');
    }
  };

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/15 text-rose-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">{errorMsg}</h2>
        <button
          onClick={() => navigate('/join')}
          className="min-h-[44px] px-6 py-2 rounded-xl gold-gradient text-charcoal-950 font-bold text-sm"
        >
          {t('joinQueueBtn')}
        </button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Loading ticket status...</p>
      </div>
    );
  }

  const isGu = language === 'gu';
  const isCalled = ticket.status === 'CALLED';
  const isInChair = ticket.status === 'IN_CHAIR';
  const isDone = ticket.status === 'DONE';
  const isCancelled = ticket.status === 'CANCELLED';
  const isNoShow = ticket.status === 'NO_SHOW';
  const isWaiting = ticket.status === 'WAITING';

  // Position string
  let positionText = '';
  if (position === 1) positionText = t('position1st');
  else if (position === 2) positionText = t('position2nd');
  else if (position === 3) positionText = t('position3rd');
  else if (position > 3) positionText = `${position}${isGu ? 'મો' : 'th'} ${t('positionInLine')}`;

  const assignedOrPreferredBarber =
    ticket.assignedBarberName ||
    (ticket.preferredBarberId !== 'ANY'
      ? barbers.find((b) => b.id === ticket.preferredBarberId)?.name
      : t('anyBarber'));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 animate-fade-in space-y-6">
      {/* Top back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-gold-400 font-medium transition min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('navHome')}</span>
        </button>
        <span className="text-xs text-slate-400 font-mono">
          ID: {ticket.id.slice(-8)}
        </span>
      </div>

      {/* FULL-SCREEN GOLD CELEBRATION MODAL IF CALLED */}
      {isCalled && (
        <div className="rounded-3xl p-6 sm:p-10 gold-gradient text-charcoal-950 shadow-2xl animate-pulse-gold relative overflow-hidden text-center space-y-4 border-2 border-amber-300">
          <div className="w-16 h-16 rounded-full bg-charcoal-950/15 mx-auto flex items-center justify-center text-charcoal-950 animate-bounce">
            <Sparkles className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight uppercase">
            {t('itsYourTurnTitle')}
          </h2>

          <div className="text-lg sm:text-2xl font-extrabold">
            {ticket.tokenNumber} — {ticket.customerName}
          </div>

          <p className="text-sm sm:text-lg font-bold text-charcoal-900 max-w-md mx-auto">
            {t('itsYourTurnSubtitle')}{' '}
            <span className="underline decoration-charcoal-950 underline-offset-4 font-black">
              {ticket.assignedBarberName || 'Barber Chair'}
            </span>
          </p>

          <div className="pt-2">
            <div className="inline-block px-4 py-2 rounded-full bg-charcoal-950 text-gold-400 font-black text-sm uppercase tracking-wider">
              Please enter the salon now
            </div>
          </div>
        </div>
      )}

      {/* "Start Coming" Alert Banner if Position == 2 */}
      {isWaiting && position === 2 && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-500 text-amber-300 flex items-center space-x-3 animate-pulse">
          <Sparkles className="w-6 h-6 flex-shrink-0 text-amber-400" />
          <div>
            <div className="font-extrabold text-sm sm:text-base">{t('startComingBanner')}</div>
            <div className="text-xs text-amber-200/80 mt-0.5">
              {isGu
                ? 'તમારો વારો ખૂબ જ ટૂંક સમયમાં આવવાનો છે. કૃપા કરીને સલૂનમાં હાજર રહો.'
                : 'Your turn is right around the corner. Please arrive at the salon lobby.'}
            </div>
          </div>
        </div>
      )}

      {/* Main Ticket Card */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Token Number & Customer Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-charcoal-800 pb-6 text-center sm:text-left">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-gold-400">
              {t('tokenLabel')}
            </span>
            <div className="text-5xl sm:text-6xl font-black tracking-tight text-white mt-1">
              {ticket.tokenNumber}
            </div>
            <div className="text-base font-bold text-slate-300 mt-1">
              {ticket.customerName}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              {ticket.customerPhone}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-center sm:items-end space-y-2">
            <span
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold tracking-wide uppercase ${
                isCalled
                  ? 'bg-amber-400 text-charcoal-950 animate-bounce'
                  : isInChair
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : isDone
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : isCancelled
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : isNoShow
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                  : 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
              }`}
            >
              {isCalled
                ? t('statusCalled')
                : isInChair
                ? t('statusInChair')
                : isDone
                ? t('statusDone')
                : isCancelled
                ? t('statusCancelled')
                : isNoShow
                ? t('statusNoShow')
                : t('statusWaiting')}
            </span>

            {isWaiting && (
              <span className="text-xs text-slate-400">
                Preferred Barber: <strong className="text-slate-200">{assignedOrPreferredBarber}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Circular Waiting Countdown Visualizer (Only when Waiting) */}
        {isWaiting && (
          <div className="py-4 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full border-4 border-charcoal-800 flex items-center justify-center bg-charcoal-950/60 shadow-inner">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border-4 border-gold-500/40 border-t-gold-500 animate-spin" style={{ animationDuration: '6s' }} />

              <div className="text-center space-y-1 z-10 px-4">
                <Clock className="w-5 h-5 text-gold-400 mx-auto" />
                <div className="text-3xl sm:text-4xl font-extrabold text-white">
                  ~{estimatedWaitMin}
                  <span className="text-sm font-semibold text-slate-400 ml-1">min</span>
                </div>
                <div className="text-xs font-bold text-gold-400 uppercase tracking-wider">
                  {positionText}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center max-w-sm">
              {position > 2 ? t('relaxBanner') : t('startComingBanner')}
            </p>
          </div>
        )}

        {/* In Chair State Info */}
        {isInChair && (
          <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">
              {t('statusInChair')}
            </h3>
            <p className="text-xs text-emerald-300">
              {ticket.assignedBarberName || 'Barber'} is currently taking care of your style.
            </p>
          </div>
        )}

        {/* Done State Info */}
        {isDone && (
          <div className="p-6 rounded-2xl bg-blue-950/20 border border-blue-800 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-gold-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">
              {t('statusDone')}
            </h3>
            <p className="text-xs text-slate-300">
              Thank you for visiting Royal Shave Salon. Look sharp!
            </p>
            <button
              onClick={() => navigate('/join')}
              className="mt-4 min-h-[44px] px-6 py-2 rounded-xl gold-gradient text-charcoal-950 font-bold text-sm cursor-pointer"
            >
              {t('joinQueueBtn')}
            </button>
          </div>
        )}

        {/* Cancelled / No-show State Info */}
        {(isCancelled || isNoShow) && (
          <div className="p-6 rounded-2xl bg-charcoal-950 border border-charcoal-800 text-center space-y-3">
            <XCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">
              {isCancelled ? t('statusCancelled') : t('statusNoShow')}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {isNoShow
                ? 'Your turn was called, but you did not arrive within the grace period. You may rejoin the queue at any time.'
                : 'This spot was cancelled.'}
            </p>
            <button
              onClick={() => navigate('/join')}
              className="mt-2 min-h-[44px] px-6 py-2 rounded-xl gold-gradient text-charcoal-950 font-bold text-sm"
            >
              {t('joinQueueBtn')}
            </button>
          </div>
        )}

        {/* Services & Bill Breakdown */}
        <div className="p-4 rounded-2xl bg-charcoal-950 border border-charcoal-800 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t('colServices')} ({ticket.services.length})
          </div>
          <div className="divide-y divide-charcoal-800 text-xs sm:text-sm">
            {ticket.services.map((s, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white">
                    {isGu ? s.nameGu : s.nameEn}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">({s.durationMin} min)</span>
                </div>
                <span className="font-bold text-gold-400">₹{s.price}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-charcoal-800 flex justify-between items-center text-sm font-extrabold text-white">
            <span>{t('totalEstimatedPrice')}</span>
            <span className="text-base text-gold-400">₹{ticket.totalPrice}</span>
          </div>
        </div>

        {/* Cancel Spot Button (Only while Waiting) */}
        {isWaiting && (
          <div className="pt-2">
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full min-h-[48px] py-3 rounded-2xl bg-charcoal-950 hover:bg-rose-950/40 border border-charcoal-700 hover:border-rose-800 text-rose-400 font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{t('cancelSpotBtn')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white text-center">
              {t('cancelConfirmTitle')}
            </h3>

            <p className="text-xs text-slate-400 text-center">
              {t('cancelConfirmDesc')}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="min-h-[44px] py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 font-semibold text-xs transition"
              >
                {t('confirmNo')}
              </button>
              <button
                disabled={cancelLoading}
                onClick={handleCancelSpot}
                className="min-h-[44px] py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelling...' : t('confirmYes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
