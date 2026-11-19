// Sincronização SQLite → Firestore.
// Estratégia de conflito: "última alteração vence" comparando updatedAt (ISO 8601).
//  - create/update: se o Firestore tem versão MAIS NOVA, ela vence e a pendência é descartada.
//  - delete: a exclusão sempre é aplicada.
// Sem duplicação: o ID do documento é gerado no aparelho e o envio usa setDoc(id, merge),
// então repetir o envio apenas sobrescreve o mesmo documento.
import NetInfo from '@react-native-community/netinfo';
import { auth } from '../firebaseConfig';
import { getById, upsertDocument, removeDocument } from '../firestoreService';
import {
  getPendingOperations,
  completeOperation,
  markOperationError,
  discardOperationWithRemote,
} from '../database/sqlite';

const FIRESTORE_TIMEOUT_MS = 10000;

let running = null;
let state = { syncing: false, lastSyncAt: null, lastError: null };
const listeners = new Set();

function emit(patch) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

export function getSyncState() {
  return state;
}

export function subscribeSync(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function isOnlineNow() {
  const net = await NetInfo.fetch();
  return !!net.isConnected && net.isInternetReachable !== false;
}

// O SDK do Firestore pode ficar "pendurado" sem rede; o timeout evita travar o app.
export function withTimeout(promise, ms = FIRESTORE_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Tempo esgotado ao falar com o Firestore.')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function processOperation(op) {
  const payload = JSON.parse(op.payload);

  if (op.operation === 'delete') {
    await withTimeout(removeDocument(op.entity, op.entityId));
    await completeOperation(op);
    return 'synced';
  }

  if (op.operation === 'update') {
    const remote = await withTimeout(getById(op.entity, op.entityId));
    if (remote?.updatedAt && remote.updatedAt > payload.updatedAt) {
      await discardOperationWithRemote(op, remote); // versão remota é mais nova: ela vence
      return 'remote-wins';
    }
  }

  await withTimeout(
    upsertDocument(op.entity, { ...payload, syncStatus: 'synced' }, { keepTimestamps: true })
  );
  await completeOperation(op);
  return 'synced';
}

async function runSync() {
  const uid = auth.currentUser?.uid;
  if (!uid) return { synced: 0, failed: 0, skipped: true };
  if (!(await isOnlineNow())) return { synced: 0, failed: 0, skipped: true };

  emit({ syncing: true, lastError: null });
  let synced = 0;
  let failed = 0;
  let lastError = null;

  try {
    const ops = await getPendingOperations(uid);
    for (const op of ops) {
      try {
        await processOperation(op);
        synced += 1;
      } catch (error) {
        failed += 1;
        lastError = error?.message || 'Falha ao sincronizar.';
        await markOperationError(op, lastError);
      }
    }
  } catch (error) {
    lastError = error?.message || 'Falha ao ler a fila de sincronização.';
  } finally {
    emit({ syncing: false, lastSyncAt: new Date().toISOString(), lastError });
  }
  return { synced, failed };
}

// Só roda uma sincronização por vez. Se alguém pedir sync DURANTE uma execução (ex.: o usuário
// salvou um registro agora), marcamos "rerun" e fazemos mais uma passada ao terminar,
// para a pendência nova não ficar esperando.
let rerun = false;

export function syncNow() {
  if (running) {
    rerun = true;
    return running;
  }
  running = (async () => {
    let result;
    do {
      rerun = false;
      result = await runSync();
    } while (rerun);
    return result;
  })().finally(() => {
    running = null;
  });
  return running;
}
