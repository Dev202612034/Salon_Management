import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { Ticket } from '../types';
import {
  Users,
  PlusCircle,
  Search,
  Clock,
  Phone,
  Scissors,
  UserCheck,
  AlertTriangle,
  Play,
  CheckCircle,
  X,
  Coffee,
  Sparkles,
} from 'lucide-react';

interface ReceptionProps {
  navigate: (path: string) => void;
}

export const Reception: React.FC<ReceptionProps> = ({ navigate }) => {
  const { t, language } = useLanguage();
  const {
    tickets,
    barbers,
    services,
    callNext,
    markNoShow,
    cancelTicket,
    addWalkin,
    toggleBarberBreak,
    stats,
  } = useQueue();

  const [searchTerm, setSearchTerm] = useState('');
  const [showWalkinModal, setShowWalkinModal] = useState(false);

  // Walk-in form state
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinServiceIds, setWalkinServiceIds] = useState<string[]>(['srv-1']);
  const [walkinBarberId, setWalkinBarberId] = useState('ANY');
  const [walkinError, setWalkinError] = useState('');
  const [walkinSubmitting, setWalkinSubmitting] = useState(false);

  const isGu = language === 'gu';

  // Waiting list in chronological order
  const waitingTickets = tickets
    .filter((t) => t.status === 'WAITING')
    .sort((a, b) => a.sequence - b.sequence);

  // Filtered waiting tickets by search
  const filteredTickets = waitingTickets.filter((t) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.tokenNumber.toLowerCase().includes(term) ||
      t.customerName.toLowerCase().includes(term) ||
      t.customerPhone.includes(term)
    );
  });

  // Called tickets list (candidates for No-Show)
  const calledTickets = tickets.filter((t) => t.status === 'CALLED');

  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkinError('');

    if (!walkinName.trim()) {
      setWalkinError(isGu ? 'કૃપા કરીને ગ્રાહકનું નામ દાખલ કરો.' : 'Please enter customer name.');
      return;
    }

    if (walkinServiceIds.length === 0) {
      setWalkinError(isGu ? 'ઓછામાં ઓછી ૧ સેવા પસંદ કરો.' : 'Please select at least 1 service.');
      return;
    }

    setWalkinSubmitting(true);
    const res = await addWalkin({
      customerName: walkinName.trim(),
      customerPhone: walkinPhone.trim() || '9999999999',
      serviceIds: walkinServiceIds,
      preferredBarberId: walkinBarberId,
    });
    setWalkinSubmitting(false);

    if (res.success) {
      setShowWalkinModal(false);
      setWalkinName('');
      setWalkinPhone('');
      setWalkinServiceIds(['srv-1']);
      setWalkinBarberId('ANY');
    } else {
      setWalkinError(res.error || 'Failed to add walk-in');
    }
  };

  const toggleWalkinService = (id: string) => {
    if (walkinServiceIds.includes(id)) {
      if (walkinServiceIds.length > 1) {
        setWalkinServiceIds((prev) => prev.filter((sId) => sId !== id));
      }
    } else {
      if (walkinServiceIds.length < 3) {
        setWalkinServiceIds((prev) => [...prev, id]);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-fade-in">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-charcoal-900 border border-charcoal-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2">
            <Users className="w-6 h-6 text-gold-400" />
            <span>{t('receptionTitle')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {waitingTickets.length} {t('peopleWaiting')} · {t('statsAvgWait')}: ~{stats.avgWaitMin} min
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full min-h-[44px] pl-9 pr-3 rounded-xl bg-charcoal-950 border border-charcoal-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
            />
          </div>

          {/* Add Walk-in Button */}
          <button
            onClick={() => setShowWalkinModal(true)}
            className="min-h-[44px] px-5 py-2.5 rounded-xl gold-gradient text-charcoal-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-gold-500/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center space-x-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('addWalkinBtn')}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Left = Barbers, Right = Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Barbers Stations (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-200 flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-gold-400" />
              <span>{t('barberStations')}</span>
            </h2>
            <span className="text-xs text-slate-400 bg-charcoal-800 px-2.5 py-0.5 rounded-full border border-charcoal-700">
              {barbers.length} Chairs
            </span>
          </div>

          <div className="space-y-4">
            {barbers.map((barber) => {
              const barberName = isGu && barber.nameGu ? barber.nameGu : barber.name;
              const activeTicket = barber.currentTicketId
                ? tickets.find((t) => t.id === barber.currentTicketId)
                : null;
              const isOnBreak = barber.status === 'ON_BREAK';
              const isBusy = barber.status === 'BUSY' || Boolean(activeTicket);
              const isFree = !isOnBreak && !isBusy && barber.isOnDuty;

              // Calculate elapsed time if active
              const startTime = activeTicket?.inChairAt || activeTicket?.calledAt;
              const elapsedMin = startTime ? Math.floor((Date.now() - startTime) / 60000) : 0;
              const expectedMin = activeTicket?.totalDurationMin || 30;
              const progressPct = Math.min(100, Math.round((elapsedMin / expectedMin) * 100));

              return (
                <div
                  key={barber.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isBusy
                      ? 'bg-charcoal-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : isOnBreak
                      ? 'bg-charcoal-900/60 border-rose-900/40'
                      : 'bg-charcoal-900 border-charcoal-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={barber.avatar}
                        alt={barber.name}
                        className="w-12 h-12 rounded-xl object-cover border border-charcoal-700"
                      />
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-white">
                          {barberName}
                        </h3>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isFree
                                ? 'bg-emerald-400 animate-pulse'
                                : isBusy
                                ? 'bg-amber-400'
                                : isOnBreak
                                ? 'bg-rose-400'
                                : 'bg-slate-500'
                            }`}
                          />
                          <span className="text-xs text-slate-400 font-semibold">
                            {isOnBreak
                              ? t('statusBreak')
                              : isBusy
                              ? activeTicket?.status === 'IN_CHAIR'
                                ? t('statusInChair')
                                : t('statusCalled')
                              : t('statusFree')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Toggle Break Button */}
                    <button
                      onClick={() => toggleBarberBreak(barber.id)}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1 ${
                        isOnBreak
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                          : 'bg-charcoal-800 border-charcoal-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Coffee className="w-3.5 h-3.5" />
                      <span>{isOnBreak ? t('resumeToggle') : t('onBreakToggle')}</span>
                    </button>
                  </div>

                  {/* Current In-Chair Customer Details */}
                  {activeTicket ? (
                    <div className="mt-4 p-3.5 rounded-xl bg-charcoal-950 border border-charcoal-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-gold-400 text-sm">
                          {activeTicket.tokenNumber}
                        </span>
                        <span className="font-bold text-white truncate max-w-[120px]">
                          {activeTicket.customerName}
                        </span>
                        <span className="text-slate-400 font-mono">
                          {elapsedMin}m / {expectedMin}m
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-charcoal-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gold-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 rounded-xl bg-charcoal-950/60 border border-charcoal-800/80 text-center">
                      <p className="text-xs text-slate-400 italic">
                        {isOnBreak ? 'Barber is taking a short break' : t('noClientInChair')}
                      </p>
                    </div>
                  )}

                  {/* Actions: Call Next */}
                  <div className="mt-4 flex gap-2">
                    <button
                      disabled={isOnBreak || Boolean(activeTicket) || waitingTickets.length === 0}
                      onClick={async () => {
                        const res = await callNext(barber.id);
                        if (!res.success) {
                          alert(res.error || 'No eligible customer for this barber.');
                        }
                      }}
                      className="flex-1 min-h-[44px] py-2 rounded-xl gold-gradient text-charcoal-950 font-bold text-xs sm:text-sm transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{t('callNextBtn')}</span>
                    </button>

                    <button
                      onClick={() => navigate(`/barber/${encodeURIComponent(barber.name)}`)}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 text-slate-300 text-xs font-semibold"
                    >
                      Mirror
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Ordered Waiting Queue (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-200 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gold-400" />
              <span>{t('waitingQueueList')}</span>
            </h2>
            <span className="text-xs text-gold-400 font-bold bg-charcoal-800 px-2.5 py-0.5 rounded-full border border-charcoal-700">
              {waitingTickets.length} In Line
            </span>
          </div>

          {/* Currently Called / Awaiting Chair Row */}
          {calledTickets.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Currently Called (Awaiting Chair)</span>
                </span>
                <span>{calledTickets.length} Called</span>
              </div>

              <div className="space-y-2">
                {calledTickets.map((tkt) => {
                  const calledElapsedMin = tkt.calledAt
                    ? Math.floor((Date.now() - tkt.calledAt) / 60000)
                    : 0;

                  return (
                    <div
                      key={tkt.id}
                      className="p-3 rounded-xl bg-charcoal-900 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-black text-amber-400">
                          {tkt.tokenNumber}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-white">
                            {tkt.customerName}
                          </div>
                          <div className="text-xs text-slate-400">
                            To: <strong className="text-slate-200">{tkt.assignedBarberName || 'Barber'}</strong> · Called {calledElapsedMin}m ago
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Mark No-Show button */}
                        <button
                          onClick={async () => {
                            if (window.confirm(`Mark ${tkt.tokenNumber} (${tkt.customerName}) as No-Show?`)) {
                              await markNoShow(tkt.id);
                            }
                          }}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition"
                        >
                          {t('noShowBtn')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Waiting Tickets List */}
          {filteredTickets.length === 0 ? (
            <div className="p-10 rounded-2xl bg-charcoal-900 border border-charcoal-800 text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="font-bold text-slate-200 text-sm sm:text-base">
                {t('noWaitingCustomers')}
              </p>
              <p className="text-xs text-slate-400">
                Click "+ Add Walk-in" to add arriving guests to the live queue.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket, index) => {
                const waitElapsedMin = Math.floor((Date.now() - ticket.createdAt) / 60000);
                const isOver60 = waitElapsedMin > 60;
                const prefBarber =
                  ticket.preferredBarberId !== 'ANY'
                    ? barbers.find((b) => b.id === ticket.preferredBarberId)?.name
                    : t('anyBarber');

                return (
                  <div
                    key={ticket.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isOver60
                        ? 'bg-amber-950/20 border-amber-500/80 shadow-md shadow-amber-500/10'
                        : 'bg-charcoal-900 border-charcoal-800 hover:border-charcoal-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Token & info */}
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-charcoal-950 border border-charcoal-700 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-xs text-slate-400 font-mono">#{index + 1}</span>
                          <span className="font-black text-sm text-gold-400">{ticket.tokenNumber}</span>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-sm sm:text-base text-white">
                              {ticket.customerName}
                            </span>
                            {ticket.isWalkIn && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-charcoal-800 text-slate-400 border border-charcoal-700 font-semibold">
                                Walk-in
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{ticket.customerPhone}</span>
                            <span>•</span>
                            <span className="text-slate-300 font-medium">
                              Pref: {prefBarber}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {ticket.services.map((s) => (isGu ? s.nameGu : s.nameEn)).join(', ')} (
                            {ticket.totalDurationMin} min) · ₹{ticket.totalPrice}
                          </div>
                        </div>
                      </div>

                      {/* Right: Wait time indicator & Cancel */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-charcoal-800">
                        <div className="text-right">
                          <div
                            className={`text-xs sm:text-sm font-extrabold ${
                              isOver60 ? 'text-amber-400 animate-pulse' : 'text-slate-300'
                            }`}
                          >
                            {waitElapsedMin} min wait
                          </div>
                          {isOver60 && (
                            <span className="text-[10px] text-amber-400 font-bold block">
                              {t('walkinOver60Notice')}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={async () => {
                            if (window.confirm(`Cancel ticket ${ticket.tokenNumber} for ${ticket.customerName}?`)) {
                              await cancelTicket(ticket.id);
                            }
                          }}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-charcoal-950 hover:bg-rose-950/40 border border-charcoal-700 hover:border-rose-800 text-rose-400 text-xs font-bold transition"
                        >
                          {t('cancelBtn')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Walk-in Registration Modal */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-charcoal-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-gold-400" />
                <span>{t('walkinModalTitle')}</span>
              </h3>
              <button
                onClick={() => setShowWalkinModal(false)}
                className="w-8 h-8 rounded-full bg-charcoal-800 hover:bg-charcoal-700 text-slate-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {walkinError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                {walkinError}
              </div>
            )}

            <form onSubmit={handleWalkinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('fullNameLabel')} *
                </label>
                <input
                  type="text"
                  required
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-sm focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('phoneLabel')} (Optional)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210 (Optional for walk-in)"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-sm focus:outline-none focus:border-gold-500"
                />
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('step2Title')} (Select up to 3)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {services
                    .filter((s) => s.isActive)
                    .map((s) => {
                      const selected = walkinServiceIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleWalkinService(s.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition select-none flex justify-between items-center ${
                            selected
                              ? 'bg-gold-500/15 border-gold-500 text-gold-300 font-bold'
                              : 'bg-charcoal-950 border-charcoal-800 text-slate-400'
                          }`}
                        >
                          <span className="truncate">{isGu ? s.nameGu : s.nameEn}</span>
                          <span>₹{s.price}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Barber Preference */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('step3Title')}
                </label>
                <select
                  value={walkinBarberId}
                  onChange={(e) => setWalkinBarberId(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-sm focus:outline-none focus:border-gold-500"
                >
                  <option value="ANY">{t('anyBarber')}</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {isGu && b.nameGu ? b.nameGu : b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="min-h-[44px] flex-1 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 text-xs font-semibold"
                >
                  {t('closeBtn')}
                </button>
                <button
                  type="submit"
                  disabled={walkinSubmitting}
                  className="min-h-[44px] flex-1 rounded-xl gold-gradient text-charcoal-950 text-xs font-extrabold shadow-lg"
                >
                  {walkinSubmitting ? 'Registering...' : t('addWalkinBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
