// Camada local (SQLite). NENHUMA tela acessa o banco direto: tudo passa por aqui.
import * as SQLite from 'expo-sqlite';
import { DB_NAME, ENTITIES, runMigrations } from './migrations';

let dbPromise = null;
const listeners = new Set();

export function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await runMigrations(db);
      return db;
    })().catch((error) => {
      dbPromise = null; // permite tentar abrir de novo
      throw error;
    });
  }
  return dbPromise;
}

// Avisa a interface (useSync) quando a fila/dados locais mudam.
export function subscribeDb(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function notify() {
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      /* listener com erro não pode quebrar o banco */
    }
  });
}

function assertEntity(entity) {
  if (!ENTITIES.includes(entity)) throw new Error(`Entidade inválida: ${entity}`);
}

function rowToDoc(row) {
  return {
    ...JSON.parse(row.data),
    id: row.id,
    userId: row.userId,
    updatedAt: row.updatedAt,
    syncStatus: row.syncStatus,
  };
}

const UPSERT_SQL = (entity) => `
  INSERT INTO ${entity} (id, userId, data, updatedAt, syncStatus, deleted)
  VALUES (?, ?, ?, ?, ?, 0)
  ON CONFLICT(id) DO UPDATE SET
    userId = excluded.userId,
    data = excluded.data,
    updatedAt = excluded.updatedAt,
    syncStatus = excluded.syncStatus,
    deleted = 0
`;

// ───────────── CRUD local dos documentos ─────────────

export async function localList(entity, userId) {
  assertEntity(entity);
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT * FROM ${entity} WHERE userId = ? AND deleted = 0 ORDER BY updatedAt DESC`,
    [userId]
  );
  return rows.map(rowToDoc);
}

export async function localGet(entity, id, userId) {
  assertEntity(entity);
  const db = await getDb();
  const row = await db.getFirstAsync(
    `SELECT * FROM ${entity} WHERE id = ? AND userId = ? AND deleted = 0`,
    [id, userId]
  );
  return row ? rowToDoc(row) : null;
}

export async function localUpsert(entity, doc) {
  assertEntity(entity);
  const db = await getDb();
  await db.runAsync(UPSERT_SQL(entity), [
    doc.id,
    doc.userId,
    JSON.stringify(doc),
    doc.updatedAt,
    doc.syncStatus ?? 'synced',
  ]);
  notify();
}

// Exclusão "lógica": o registro some das listas, mas só é apagado de vez após sincronizar.
export async function localMarkDeleted(entity, id) {
  assertEntity(entity);
  const db = await getDb();
  await db.runAsync(`UPDATE ${entity} SET deleted = 1, syncStatus = 'pending' WHERE id = ?`, [id]);
  notify();
}

// Substitui o cache local pelo que veio do Firestore, SEM mexer no que ainda está pendente.
export async function replaceSyncedFromRemote(entity, userId, remoteDocs) {
  assertEntity(entity);
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const locals = await db.getAllAsync(
      `SELECT id, syncStatus FROM ${entity} WHERE userId = ?`,
      [userId]
    );
    const localStatus = new Map(locals.map((r) => [r.id, r.syncStatus]));
    const remoteIds = new Set(remoteDocs.map((d) => d.id));

    for (const remote of remoteDocs) {
      const status = localStatus.get(remote.id);
      if (status && status !== 'synced') continue; // alteração local pendente vence até sincronizar
      const doc = { ...remote, syncStatus: 'synced' };
      await db.runAsync(UPSERT_SQL(entity), [
        doc.id,
        doc.userId,
        JSON.stringify(doc),
        doc.updatedAt,
        'synced',
      ]);
    }

    // apagado em outro aparelho: remove do cache (só o que já estava sincronizado)
    for (const [id, status] of localStatus) {
      if (status === 'synced' && !remoteIds.has(id)) {
        await db.runAsync(`DELETE FROM ${entity} WHERE id = ?`, [id]);
      }
    }
  });
  notify();
}

// ───────────── Fila de pendências ─────────────

function makeOpId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Registra uma operação pendente. Mantém UMA entrada por registro (compactação):
 *  create + update  → create com o payload novo
 *  create + delete  → some tudo (o dado nunca chegou ao Firestore)
 *  update + update  → update com o payload novo
 *  update + delete  → delete
 */
export async function enqueueOperation({ userId, operation, entity, entityId, payload }) {
  assertEntity(entity);
  const db = await getDb();
  const now = new Date().toISOString();
  const json = JSON.stringify(payload);

  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync(
      'SELECT * FROM sync_queue WHERE entity = ? AND entityId = ?',
      [entity, entityId]
    );

    if (!existing) {
      await db.runAsync(
        `INSERT INTO sync_queue (id, userId, operation, entity, entityId, payload, createdAt, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [makeOpId(), userId, operation, entity, entityId, json, now]
      );
      return;
    }

    if (existing.operation === 'create' && operation === 'delete') {
      await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [existing.id]);
      await db.runAsync(`DELETE FROM ${entity} WHERE id = ?`, [entityId]);
      return;
    }

    const merged = existing.operation === 'create' && operation === 'update' ? 'create' : operation;
    await db.runAsync(
      `UPDATE sync_queue SET operation = ?, payload = ?, status = 'pending', attempts = 0, lastError = NULL
       WHERE id = ?`,
      [merged, json, existing.id]
    );
  });
  notify();
}

export async function getPendingOperations(userId) {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM sync_queue WHERE userId = ? ORDER BY createdAt ASC', [userId]);
}

export async function countPendingOperations(userId) {
  const db = await getDb();
  const row = await db.getFirstAsync(
    'SELECT COUNT(*) AS total FROM sync_queue WHERE userId = ?',
    [userId]
  );
  return row?.total ?? 0;
}

// Sucesso: tira da fila e marca o registro como sincronizado.
// O "AND payload = ?" protege contra edição durante o envio: se o usuário mexeu no registro
// enquanto sincronizava, a pendência continua na fila com o dado novo.
export async function completeOperation(op) {
  assertEntity(op.entity);
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync('DELETE FROM sync_queue WHERE id = ? AND payload = ?', [
      op.id,
      op.payload,
    ]);
    if (res.changes > 0) {
      if (op.operation === 'delete') {
        await db.runAsync(`DELETE FROM ${op.entity} WHERE id = ?`, [op.entityId]);
      } else {
        await db.runAsync(`UPDATE ${op.entity} SET syncStatus = 'synced' WHERE id = ?`, [op.entityId]);
      }
    }
  });
  notify();
}

// Falha: mantém na fila (será repetida) e marca o registro com erro.
export async function markOperationError(op, message) {
  assertEntity(op.entity);
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE sync_queue SET status = 'error', attempts = attempts + 1, lastError = ? WHERE id = ?`,
      [String(message || 'Erro desconhecido').slice(0, 300), op.id]
    );
    if (op.operation !== 'delete') {
      await db.runAsync(`UPDATE ${op.entity} SET syncStatus = 'error' WHERE id = ?`, [op.entityId]);
    }
  });
  notify();
}

// Conflito: a versão do Firestore é mais nova → descarta a pendência e guarda a versão remota.
export async function discardOperationWithRemote(op, remoteDoc) {
  assertEntity(op.entity);
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [op.id]);
    const doc = { ...remoteDoc, syncStatus: 'synced' };
    await db.runAsync(UPSERT_SQL(op.entity), [
      doc.id,
      doc.userId,
      JSON.stringify(doc),
      doc.updatedAt,
      'synced',
    ]);
  });
  notify();
}
