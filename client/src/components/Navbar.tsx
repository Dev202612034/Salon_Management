import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { Scissors, Globe, Tv, Shield, Users, UserCheck, PlusCircle } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { settings, isConnected } = useQueue();

  // If on TV display screen, keep navbar minimal or hidden
  if (currentPath === '/display') {
    return (
      <div className="fixed top-2 right-3 z-50 flex items-center space-x-2 bg-charcoal-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-charcoal-700 text-xs">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
        <button
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-gold-400 font-medium transition"
        >
          Exit TV Mode
        </button>
        <button
          onClick={toggleLanguage}
          className="text-gold-400 hover:text-gold-300 font-bold ml-2 pl-2 border-l border-charcoal-700"
        >
          {language === 'en' ? 'ગુજરાતી' : 'English'}
        </button>
      </div>
    );
  }

  const navLinks = [
    { path: '/', label: t('navHome'), icon: Scissors },
    { path: '/join', label: t('navJoin'), icon: PlusCircle },
    { path: '/reception', label: t('navReception'), icon: Users },
    { path: '/barber', label: t('navBarber'), icon: UserCheck },
    { path: '/display', label: t('navTv'), icon: Tv },
    { path: '/admin', label: t('navAdmin'), icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-40 bg-charcoal-900/90 backdrop-blur-md border-b border-charcoal-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-lg shadow-gold-600/20 group-hover:scale-105 transition transform">
              <Scissors className="w-5 h-5 text-charcoal-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-gold-400 transition">
                  {t('salonName')}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    settings.isOpen
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                  }`}
                >
                  {settings.isOpen ? t('openBadge') : t('closedBadge')}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">{t('salonTagline')}</p>
            </div>
          </div>

          {/* Navigation links - Desktop & Tablet */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    isActive
                      ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-charcoal-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Language Switcher & Connection */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live socket dot */}
            <div
              title={isConnected ? 'Real-time sync active' : 'Connecting to server...'}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-charcoal-800 border border-charcoal-700 text-xs text-slate-400"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="hidden sm:inline">{isConnected ? 'Live' : 'Syncing'}</span>
            </div>

            {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 text-gold-400 hover:text-gold-300 text-xs sm:text-sm font-bold shadow-sm transition active:scale-95"
              aria-label="Toggle language between English and Gujarati"
            >
              <Globe className="w-4 h-4" />
              <span>{language === 'en' ? 'ગુજરાતી' : 'English'}</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-charcoal-800 space-x-1 scrollbar-none text-xs">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex-shrink-0 flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition ${
                  isActive
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-charcoal-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
