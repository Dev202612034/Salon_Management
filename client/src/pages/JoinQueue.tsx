import React, { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { Scissors, Sparkles, Check, Clock, AlertTriangle, ArrowLeft, ArrowRight, UserCheck } from 'lucide-react';

interface JoinQueueProps {
  navigate: (path: string) => void;
}

export const JoinQueue: React.FC<JoinQueueProps> = ({ navigate }) => {
  const { t, language } = useLanguage();
  const { services, barbers, settings, tickets, joinQueue } = useQueue();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(['srv-1']); // default Haircut
  const [preferredBarberId, setPreferredBarberId] = useState<string>('ANY');

  const [errorMsg, setErrorMsg] = useState('');
  const [existingTicketAlert, setExistingTicketAlert] = useState<{ id: string; tokenNumber: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active services only
  const activeServices = useMemo(() => services.filter((s) => s.isActive), [services]);

  // Selected services calculations
  const selectedServices = useMemo(() => {
    return activeServices.filter((s) => selectedServiceIds.includes(s.id));
  }, [activeServices, selectedServiceIds]);

  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMin, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  // Live estimated wait time calculation
  const waitingTickets = tickets.filter((t) => t.status === 'WAITING');
  const activeBarbers = barbers.filter((b) => b.isOnDuty && b.status !== 'ON_BREAK');
  const barberCount = Math.max(1, activeBarbers.length);

  const estimatedWaitMin = useMemo(() => {
    if (preferredBarberId === 'ANY') {
      const sumMinutesAhead = waitingTickets.reduce((sum, t) => sum + t.totalDurationMin, 0);
      return Math.max(5, Math.ceil(sumMinutesAhead / barberCount));
    } else {
      const specificAhead = waitingTickets.filter(
        (t) => t.preferredBarberId === preferredBarberId || t.preferredBarberId === 'ANY'
      );
      const sumMin = specificAhead.reduce((sum, t) => sum + t.totalDurationMin, 0);
      const barber = barbers.find((b) => b.id === preferredBarberId);
      const chairExtra = barber && barber.currentTicketId ? 15 : 0;
      return Math.max(5, sumMin + chairExtra);
    }
  }, [waitingTickets, preferredBarberId, barberCount, barbers]);

  const toggleService = (serviceId: string) => {
    setErrorMsg('');
    if (selectedServiceIds.includes(serviceId)) {
      if (selectedServiceIds.length === 1) {
        setErrorMsg(language === 'gu' ? 'ઓછામાં ઓછી ૧ સેવા પસંદ કરવી જરૂરી છે.' : 'Please select at least 1 service.');
        return;
      }
      setSelectedServiceIds((prev) => prev.filter((id) => id !== serviceId));
    } else {
      if (selectedServiceIds.length >= 3) {
        setErrorMsg(language === 'gu' ? 'મહત્તમ ૩ સેવાઓ જ પસંદ કરી શકાય છે.' : 'Maximum 3 services allowed per booking.');
        return;
      }
      setSelectedServiceIds((prev) => [...prev, serviceId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setExistingTicketAlert(null);

    if (!settings.isOpen) {
      setErrorMsg(settings.closedMessage || t('queueClosedNotice'));
      return;
    }

    if (!customerName.trim()) {
      setErrorMsg(language === 'gu' ? 'કૃપા કરીને તમારું નામ દાખલ કરો.' : 'Please enter your name.');
      return;
    }

    const cleanPhone = customerPhone.replace(/[\s-]/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg(
        language === 'gu'
          ? 'કૃપા કરીને માન્ય ૧૦ આંકડાનો મોબાઇલ નંબર દાખલ કરો (દા.ત. 9876543210).'
          : 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).'
      );
      return;
    }

    if (selectedServiceIds.length === 0) {
      setErrorMsg(language === 'gu' ? 'ઓછામાં ઓછી ૧ સેવા પસંદ કરો.' : 'Please select at least 1 service.');
      return;
    }

    setIsSubmitting(true);
    const result = await joinQueue({
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      serviceIds: selectedServiceIds,
      preferredBarberId,
    });
    setIsSubmitting(false);

    if (!result.success) {
      if (result.existingTicket) {
        setExistingTicketAlert({
          id: result.existingTicket.id,
          tokenNumber: result.existingTicket.tokenNumber,
        });
      } else {
        setErrorMsg(result.error || 'Failed to join queue.');
      }
      return;
    }

    if (result.ticket) {
      // Store ticket id in localStorage for easy access
      localStorage.setItem('my_salon_ticket_id', result.ticket.id);
      navigate(`/status/${result.ticket.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      {/* Top back nav */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-gold-400 font-medium mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('navHome')}</span>
      </button>

      <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center space-x-2">
            <span>{t('joinTitle')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('joinSubtitle')}
          </p>
        </div>

        {/* Existing ticket warning if any */}
        {existingTicketAlert && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-300">
            <div className="text-xs sm:text-sm">
              <span className="font-bold">{t('alreadyHaveTicket')}</span>{' '}
              <span className="font-extrabold underline">{existingTicketAlert.tokenNumber}</span>
            </div>
            <button
              onClick={() => navigate(`/status/${existingTicketAlert.id}`)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-charcoal-950 font-bold text-xs hover:bg-amber-400 transition"
            >
              {t('viewActiveTicket')}
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs sm:text-sm flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Customer Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gold-400 font-bold text-sm sm:text-base border-b border-charcoal-800 pb-2">
              <Sparkles className="w-4 h-4" />
              <span>{t('step1Title')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('fullNameLabel')} *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  className="w-full min-h-[48px] px-4 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('phoneLabel')} *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('phonePlaceholder')}
                  className="w-full min-h-[48px] px-4 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Multi-select Services (Max 3) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-charcoal-800 pb-2">
              <div className="flex items-center space-x-2 text-gold-400 font-bold text-sm sm:text-base">
                <Scissors className="w-4 h-4" />
                <span>{t('step2Title')}</span>
              </div>
              <span className="text-xs text-slate-400 bg-charcoal-800 px-2.5 py-1 rounded-full border border-charcoal-700">
                {selectedServiceIds.length} / 3 {t('selectedCount')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeServices.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id);
                const isGu = language === 'gu';
                const serviceName = isGu ? service.nameGu : service.nameEn;
                const serviceDesc = isGu ? service.descriptionGu : service.descriptionEn;

                return (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`min-h-[64px] p-4 rounded-2xl cursor-pointer border transition-all flex items-start justify-between select-none ${
                      isSelected
                        ? 'bg-gold-500/10 border-gold-500 shadow-md shadow-gold-500/10 ring-1 ring-gold-500'
                        : 'bg-charcoal-950/60 border-charcoal-800 hover:border-charcoal-700'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{serviceName}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-charcoal-800 text-slate-400">
                          {service.durationMin} min
                        </span>
                      </div>
                      {serviceDesc && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{serviceDesc}</p>
                      )}
                      <div className="mt-2 text-sm font-extrabold text-gold-400">
                        ₹{service.price}
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border mt-0.5 transition ${
                        isSelected
                          ? 'bg-gold-500 border-gold-500 text-charcoal-950'
                          : 'border-charcoal-600 bg-charcoal-900'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Barber Picker */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gold-400 font-bold text-sm sm:text-base border-b border-charcoal-800 pb-2">
              <UserCheck className="w-4 h-4" />
              <span>{t('step3Title')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Option 1: Any Barber (Fastest) */}
              <div
                onClick={() => setPreferredBarberId('ANY')}
                className={`p-4 rounded-2xl cursor-pointer border transition-all select-none ${
                  preferredBarberId === 'ANY'
                    ? 'bg-gold-500/10 border-gold-500 ring-1 ring-gold-500'
                    : 'bg-charcoal-950/60 border-charcoal-800 hover:border-charcoal-700'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Sparkles className="w-4 h-4 text-gold-400" />
                  <span className="text-xs font-extrabold text-gold-400 uppercase tracking-wider">Fastest</span>
                </div>
                <div className="font-bold text-sm text-white">{t('anyBarber')}</div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t('anyBarberDesc')}</p>
              </div>

              {/* Individual Barbers */}
              {barbers.map((barber) => {
                const isSelected = preferredBarberId === barber.id;
                const isGu = language === 'gu';
                const barberName = isGu && barber.nameGu ? barber.nameGu : barber.name;
                const isOnBreak = barber.status === 'ON_BREAK';

                return (
                  <div
                    key={barber.id}
                    onClick={() => setPreferredBarberId(barber.id)}
                    className={`p-3.5 rounded-2xl cursor-pointer border transition-all flex items-center space-x-3 select-none ${
                      isSelected
                        ? 'bg-gold-500/10 border-gold-500 ring-1 ring-gold-500'
                        : 'bg-charcoal-950/60 border-charcoal-800 hover:border-charcoal-700'
                    }`}
                  >
                    <img
                      src={barber.avatar}
                      alt={barber.name}
                      className="w-11 h-11 rounded-xl object-cover border border-charcoal-700"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-white truncate">{barberName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isOnBreak
                              ? 'bg-rose-400'
                              : barber.status === 'FREE'
                              ? 'bg-emerald-400'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span>
                          {isOnBreak
                            ? t('statusBreak')
                            : barber.status === 'FREE'
                            ? t('statusFree')
                            : t('statusBusy')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 4: Live Summary Card */}
          <div className="p-5 rounded-2xl bg-charcoal-950 border border-charcoal-700/80 space-y-3">
            <h3 className="text-xs font-bold text-gold-400 uppercase tracking-wider">
              {t('summaryTitle')}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 block text-xs">{t('totalServices')}</span>
                <span className="text-white font-bold">{selectedServices.length}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">{t('totalDuration')}</span>
                <span className="text-white font-bold">{totalDuration} min</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">{t('totalEstimatedPrice')}</span>
                <span className="text-gold-400 font-extrabold text-base">₹{totalPrice}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">{t('expectedWait')}</span>
                <span className="text-amber-400 font-extrabold text-base">~{estimatedWaitMin} min</span>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={isSubmitting || !settings.isOpen}
            className="w-full min-h-[52px] py-4 rounded-2xl gold-gradient text-charcoal-950 font-extrabold text-base sm:text-lg shadow-xl shadow-gold-500/20 hover:shadow-gold-500/35 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
          >
            <span>{isSubmitting ? 'Securing your token...' : t('confirmJoinBtn')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
