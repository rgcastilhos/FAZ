// Hook for managing app updates

import { useState, useCallback, useEffect } from 'react';

const CURRENT_VERSION = '1.0.0'; // Update this when you release new versions
const VERSION_CHECK_INTERVAL = 60000; // Check every 60 seconds

interface VersionInfo {
  version: string;
  releaseDate: string;
  updateUrl?: string;
  changelog?: string;
  isRequired?: boolean;
}

export const useAppUpdate = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [newVersion, setNewVersion] = useState<VersionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdates = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    try {
      const response = await fetch('/api/version');
      if (!response.ok) {
        throw new Error('Falha ao verificar versão');
      }
      const data: VersionInfo = await response.json();
      
      if (data.version !== CURRENT_VERSION) {
        setNewVersion(data);
        setHasUpdate(true);
      } else {
        setHasUpdate(false);
        setNewVersion(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao verificar atualizações');
    } finally {
      setIsChecking(false);
    }
  }, []);

  const performUpdate = useCallback(async () => {
    try {
      setIsChecking(true);
      // For web: reload to get new version from server
      window.location.reload();
      
      // For mobile/Capacitor: download and install APK if updateUrl provided
      if (newVersion?.updateUrl) {
        // You can implement Capacitor App update here
        window.location.href = newVersion.updateUrl;
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao atualizar');
      setIsChecking(false);
    }
  }, [newVersion]);

  const dismissUpdate = useCallback(() => {
    setHasUpdate(false);
    setNewVersion(null);
  }, []);

  // Check for updates on mount and periodically
  useEffect(() => {
    void checkForUpdates();
    const interval = setInterval(() => {
      void checkForUpdates();
    }, VERSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [checkForUpdates]);

  return {
    hasUpdate,
    isChecking,
    newVersion,
    error,
    checkForUpdates,
    performUpdate,
    dismissUpdate,
  };
};
