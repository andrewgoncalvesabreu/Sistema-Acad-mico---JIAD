// Repositório genérico OFFLINE-FIRST (padrão "outbox"):
//   1) toda escrita grava no SQLite com syncStatus = 'pending' e entra na fila (sync_queue);
//   2) se houver internet, a fila é enviada ao Firestore na hora (syncService);
//   3) sem internet, o dado fica seguro no aparelho e é enviado quando a conexão voltar.
// Leitura: com internet, atualiza o cache a partir do Firestore; sempre devolve o que está no SQLite.
// Qualquer entidade (alunos, cursos, cursos) pode usar: createRepository('alunos').
import { auth } from '../services/firebaseConfig';
import { newId, listByUser, buildDocumentPayload } from '../services/firestoreService';
import {
  localList,
  localGet,
  localUpsert,
  localMarkDeleted,
  enqueueOperation,
  replaceSyncedFromRemote,
} from '../services/database/sqlite';
import { isOnlineNow, syncNow, withTimeout } from '../services/sync/syncService';

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado.');
  return uid;
}

export function createRepository(entity, { defaultStatus = 'ativo' } = {}) {
  async function refreshFromRemote(uid) {
    try {
      if (!(await isOnlineNow())) return;
      await syncNow(); // envia pendências ANTES de ler, para não sobrescrever alterações locais
      const remote = await withTimeout(listByUser(entity));
      await replaceSyncedFromRemote(entity, uid, remote);
    } catch (error) {
      console.warn(`[${entity}] não foi possível atualizar do Firestore:`, error?.message);
    }
  }

  function flush() {
    syncNow().catch(() => {}); // sem await: a tela não espera a rede
  }

  return {
    entity,

    // READ (lista)
    async list({ refresh = true } = {}) {
      const uid = requireUid();
      if (refresh) await refreshFromRemote(uid);
      return localList(entity, uid);
    },

    // READ (um registro) — sempre do SQLite
    async getById(id) {
      return localGet(entity, id, requireUid());
    },

    // CREATE
    async create(data) {
      const uid = requireUid();
      const id = newId(entity); // ID gerado no aparelho: funciona offline e evita duplicação
      const doc = buildDocumentPayload({
        status: defaultStatus,
        ...data,
        id,
        userId: uid,
        syncStatus: 'pending',
      });
      await localUpsert(entity, doc);
      await enqueueOperation({ userId: uid, operation: 'create', entity, entityId: id, payload: doc });
      flush();
      return doc;
    },

    // UPDATE
    async update(id, changes) {
      const uid = requireUid();
      const existing = await localGet(entity, id, uid);
      if (!existing) throw new Error('Registro não encontrado.');
      const doc = buildDocumentPayload({ ...changes, syncStatus: 'pending' }, existing);
      await localUpsert(entity, doc);
      await enqueueOperation({ userId: uid, operation: 'update', entity, entityId: id, payload: doc });
      flush();
      return doc;
    },

    // DELETE
    async remove(id) {
      const uid = requireUid();
      const existing = await localGet(entity, id, uid);
      if (!existing) return;
      await localMarkDeleted(entity, id);
      await enqueueOperation({
        userId: uid,
        operation: 'delete',
        entity,
        entityId: id,
        payload: existing,
      });
      flush();
    },
  };
}
