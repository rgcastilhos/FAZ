// Hook for data synchronization logic

import { useState, useCallback, useEffect } from 'react';
import { encodeBase64, decodeBase64 } from '../utils/formatters';

export const useSync = () => {
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const generateSyncCode = useCallback((data: any): string => {
    try {
      const jsonStr = JSON.stringify(data);
      const encoded = encodeBase64(jsonStr);
      setSyncCode(encoded);
      return encoded;
    } catch (err) {
      setSyncError('Erro ao gerar código de sincronização');
      return '';
    }
  }, []);

  const importFromSyncCode = useCallback((code: string): any | null => {
    try {
      setSyncError(null);
      const jsonStr = decodeBase64(code);
      const data = JSON.parse(jsonStr);
      return data;
    } catch (err: any) {
      setSyncError(err?.message || 'Código de sincronização inválido');
      return null;
    }
  }, []);

  const exportData = useCallback((data: any): void => {
    try {
      setIsSyncing(true);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `faz-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setSyncError(err?.message || 'Erro ao exportar dados');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    syncCode,
    isSyncing,
    syncError,
    generateSyncCode,
    importFromSyncCode,
    exportData,
  };
};
