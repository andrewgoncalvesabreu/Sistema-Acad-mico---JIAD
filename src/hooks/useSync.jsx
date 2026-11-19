import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useNetwork } from './useNetwork';
import { syncNow, getSyncState, subscribeSync } from '../services/sync/syncService';
import { countPendingOperations, subscribeDb } from '../services/database/sqlite';

const RETRY_INTERVAL_MS = 30000;

// Expõe o estado da sincronização para a interface e dispara o envio automático:
//  - quando a internet volta (isOnline passa a true)
//  - a cada 30 s enquanto houver pendências (repete falhas sem duplicar dados)
export function useSync() {
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const [sync, setSync] = useState(getSyncState());
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = useCallback(async () => {
    if (!user) {
      setPendingCount(0);
      return;
    }
    try {
      setPendingCount(await countPendingOperations(user.uid));
    } catch {
      /* banco ainda abrindo */
    }
  }, [user]);

  useEffect(() => subscribeSync(setSync), []);

  useEffect(() => {
    refreshCount();
    return subscribeDb(refreshCount);
  }, [refreshCount]);

  useEffect(() => {
    if (isOnline && user) syncNow();
  }, [isOnline, user]);

  useEffect(() => {
    if (!isOnline || !user || pendingCount === 0) return undefined;
    const timer = setInterval(() => syncNow(), RETRY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isOnline, user, pendingCount]);

  return {
    isOnline,
    pendingCount,
    syncing: sync.syncing,
    lastSyncAt: sync.lastSyncAt,
    lastError: sync.lastError,
    syncNow,
  };
}
