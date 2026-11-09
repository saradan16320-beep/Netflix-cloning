import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isPhysicalOnline, setIsPhysicalOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  // Simulated offline mode toggle
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => {
    return localStorage.getItem('netflix_simulate_offline') === 'true';
  });

  useEffect(() => {
    const handleOnline = () => setIsPhysicalOnline(true);
    const handleOffline = () => setIsPhysicalOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      localStorage.setItem('netflix_simulate_offline', String(next));
      return next;
    });
  };

  const isEffectiveOnline = isPhysicalOnline && !isSimulatedOffline;

  return {
    isOnline: isEffectiveOnline,
    isPhysicalOnline,
    isSimulatedOffline,
    toggleSimulatedOffline,
  };
}
