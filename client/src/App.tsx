import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import { QueueProvider } from './context/QueueContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { JoinQueue } from './pages/JoinQueue';
import { MyStatus } from './pages/MyStatus';
import { Reception } from './pages/Reception';
import { BarberView } from './pages/BarberView';
import { TvDisplay } from './pages/TvDisplay';
import { OwnerSettings } from './pages/OwnerSettings';

export const AppContent: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route matching
  const renderScreen = () => {
    if (currentPath === '/' || currentPath === '') {
      return <Home navigate={navigate} />;
    }

    if (currentPath === '/join') {
      return <JoinQueue navigate={navigate} />;
    }

    if (currentPath.startsWith('/status/')) {
      const ticketId = currentPath.replace('/status/', '');
      return <MyStatus ticketId={ticketId} navigate={navigate} />;
    }

    if (currentPath === '/reception') {
      return <Reception navigate={navigate} />;
    }

    if (currentPath === '/barber' || currentPath.startsWith('/barber/')) {
      const barberParam = currentPath.startsWith('/barber/') ? currentPath.replace('/barber/', '') : undefined;
      return <BarberView barberParam={barberParam} navigate={navigate} />;
    }

    if (currentPath === '/display') {
      return <TvDisplay />;
    }

    if (currentPath === '/admin') {
      return <OwnerSettings />;
    }

    // Fallback: Home
    return <Home navigate={navigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-charcoal-950 text-slate-100">
      <Navbar currentPath={currentPath} navigate={navigate} />
      <main className="flex-1 pb-16">{renderScreen()}</main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <QueueProvider>
        <AppContent />
      </QueueProvider>
    </LanguageProvider>
  );
};

export default App;
