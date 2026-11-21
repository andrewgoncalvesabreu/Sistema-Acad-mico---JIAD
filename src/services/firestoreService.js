import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

export const COLLECTIONS = {
  ALUNOS: 'alunos',
  CURSOS: 'cursos',
  TURMAS: 'turmas'
};

function requireUserId() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Usuário não autenticado.');
  }
  return uid;
}

export function newId(collectionName) {
  return doc(collection(db, collectionName)).id; // gera ID local, funciona offline
}

export function buildDocumentPayload(data, existing = null, { keepTimestamps = false } = {}) {
  const uid = requireUserId();
  const now = new Date().toISOString();
  return {
    ...existing,
    ...data,
    id: data.id || existing?.id,
    userId: existing?.userId || data.userId || uid,
    status: data.status ?? existing?.status ?? 'ativo',
    createdAt: existing?.createdAt || data.createdAt || now,
    updatedAt: keepTimestamps ? (data.updatedAt || now) : now,
    syncStatus: data.syncStatus ?? 'synced',
  };
}

export async function listByUser(collectionName) {
  const uid = requireUserId();
  const q = query(collection(db, collectionName), where('userId', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getById(collectionName, id) {
  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function upsertDocument(collectionName, payload, options) {
  const docData = buildDocumentPayload(payload, null, options);
  if (!docData.id) throw new Error('Documento sem id. Use newId() ao criar.');
  const ref = doc(db, collectionName, docData.id);
  await setDoc(ref, docData, { merge: true });
  return docData;
}

export async function updateDocument(collectionName, id, partialData) {
  requireUserId();
  const ref = doc(db, collectionName, id);
  const updates = {
    ...partialData,
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced',
  };
  await updateDoc(ref, updates);
  return updates;
}

export async function removeDocument(collectionName, id) {
  requireUserId();
  const ref = doc(db, collectionName, id);
  await deleteDoc(ref);
}