import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { Users, Clock, ArrowRight, Search, Sparkles, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

interface HomeProps {
  navigate: (path: string) => void;
}

export const Home: React.FC<HomeProps> = ({ navigate }) => {
  const { t, language } = useLanguage();
  const { tickets, barbers, settings, stats } = useQueue();
  const [searchToken, setSearchToken] = useState('');
  const [searchError, setSearchError] = useState('');

  const waitingTickets = tickets.filter((t) => t.status === 'WAITING');
  const activeCount = waitingTickets.length;

  // Calculate overall estimated wait for a new joiner (average minutes)
  const activeBarbers = barbers.filter((b) => b.isOnDuty && b.status !== 'ON_BREAK');
  const barberDivisor = Math.max(1, activeBarbers.length);
  const totalWaitingMinutes = waitingTickets.reduce((acc, curr) => acc + curr.totalDurationMin, 0);
  const approxWaitMin = activeCount === 0 ? 0 : Math.max(5, Math.ceil(totalWaitingMinutes / barberDivisor));

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchToken.trim();
    if (!query) return;

    // Search by tokenNumber (e.g. S-1) or customer phone or ticket ID
    const found = tickets.find(
      (t) =>
        t.tokenNumber.toLowerCase() === query.toLowerCase() ||
        t.id === query ||
        t.customerPhone.replace(/[\s-]/g, '') === query.replace(/[\s-]/g, '')
    );

    if (found) {
      navigate(`/status/${found.id}`);
    } else {
      setSearchError(language === 'gu' ? 'ટોકન મળ્યું નથી' : 'No ticket found with this token or phone number.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fade-in">
      {/* Hero Live Status Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-charcoal-900 via-charcoal-850 to-charcoal-900 border border-charcoal-700/60 p-6 sm:p-10 shadow-2xl">
        {/* Decorative gold ambient glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gold-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs sm:text-sm font-bold tracking-wide uppercase">
            <Sparkles className="w-4 h-4" />
            <span>{t('liveQueueTitle')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-2xl">
            {language === 'gu' ? (
              <>સ્માર્ટ કતાર વ્યવસ્થાપન સાથે <span className="gold-gradient-text">સમય બચાવો</span></>
            ) : (
              <>Experience Luxury Grooming <span className="gold-gradient-text">Without The Wait</span></>
            )}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl">
            {t('joinSubtitle')}
          </p>

          {/* Big Live Waiting Metric Banner */}
          <div className="w-full max-w-lg mt-4 p-5 rounded-2xl bg-charcoal-950/70 border border-charcoal-700/80 backdrop-blur-md flex items-center justify-around">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  {activeCount}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {activeCount === 1 ? t('personWaiting') : t('peopleWaiting')}
                </div>
              </div>
            </div>

            <div className="h-10 w-px bg-charcoal-700" />

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  {approxWaitMin === 0 ? '0' : `~${approxWaitMin}`}
                  <span className="text-sm font-semibold text-slate-400 ml-1">min</span>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {t('expectedWait')}
                </div>
              </div>
            </div>
          </div>

          {/* Big Gold Join CTA Button */}
          <div className="pt-4 w-full max-w-md">
            {settings.isOpen ? (
              <button
                onClick={() => navigate('/join')}
                className="w-full min-h-[52px] py-4 px-6 rounded-2xl gold-gradient text-charcoal-950 font-extrabold text-lg sm:text-xl shadow-xl shadow-gold-500/25 hover:shadow-gold-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 group cursor-pointer"
              >
                <span>{t('joinQueueBtn')}</span>
                <ArrowRight className="w-6 h-6 transform group-hover:translate-x-1.5 transition" />
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm">
                <AlertCircle className="w-5 h-5 mx-auto mb-1 text-rose-400" />
                <p className="font-semibold">{t('queueClosedNotice')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barbers On Duty Status Chips */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-200 flex items-center space-x-2">
          <span>{t('barbersOnDuty')}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-charcoal-800 text-gold-400 border border-charcoal-700">
            {barbers.filter((b) => b.isOnDuty).length} Active
          </span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {barbers.map((barber) => {
            const isGu = language === 'gu';
            const barberName = isGu && barber.nameGu ? barber.nameGu : barber.name;
            const isBusy = barber.status === 'BUSY';
            const isOnBreak = barber.status === 'ON_BREAK';
            const isFree = barber.status === 'FREE' && barber.isOnDuty;

            return (
              <div
                key={barber.id}
                className="flex items-center space-x-3 p-3.5 rounded-2xl bg-charcoal-900 border border-charcoal-800 hover:border-charcoal-700 transition"
              >
                <img
                  src={barber.avatar}
                  alt={barber.name}
                  className="w-12 h-12 rounded-xl object-cover border border-charcoal-700"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{barberName}</h3>
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
                    <span className="text-xs text-slate-400 font-medium">
                      {isFree
                        ? t('statusFree')
                        : isBusy
                        ? t('statusBusy')
                        : isOnBreak
                        ? t('statusBreak')
                        : t('statusOffDuty')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Lookup Card for Existing Token */}
      <div className="p-6 rounded-2xl bg-charcoal-900 border border-charcoal-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
          <Search className="w-4 h-4 text-gold-400" />
          <span>{t('findTicketBtn')}</span>
        </h3>
        <p className="text-xs text-slate-400">
          {language === 'gu'
            ? 'તમારો ટોકન નંબર (દા.ત. S-1) અથવા ૧૦ આંકડાનો મોબાઇલ નંબર દાખલ કરો:'
            : 'Enter your Token number (e.g. S-1) or your 10-digit mobile number to view live status:'}
        </p>

        <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={searchToken}
            onChange={(e) => {
              setSearchToken(e.target.value);
              setSearchError('');
            }}
            placeholder="e.g. S-1 or 9876543210"
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-gold-500"
          />
          <button
            type="submit"
            className="min-h-[44px] px-6 rounded-xl bg-charcoal-800 hover:bg-gold-600 hover:text-charcoal-950 border border-charcoal-700 text-gold-400 text-sm font-bold transition flex items-center justify-center space-x-2"
          >
            <span>{t('findTicketBtn')}</span>
          </button>
        </form>
        {searchError && (
          <p className="text-xs text-rose-400 font-medium">{searchError}</p>
        )}
      </div>

      {/* Salon Information Footer Card */}
      <div className="p-5 rounded-2xl bg-charcoal-900/60 border border-charcoal-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gold-400 flex-shrink-0" />
          <span>{t('salonHours')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gold-400 flex-shrink-0" />
          <span>{t('salonLocation')}</span>
        </div>
      </div>
    </div>
  );
};
