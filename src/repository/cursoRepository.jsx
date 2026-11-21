// CRUD de Cursos. As telas só chamam estas funções (nunca o Firestore direto).
// Hoje persiste no Firestore via firestoreService; a camada SQLite/sincronização
// (Davi) passa a decidir entre nuvem e local aqui dentro, sem mudar as telas.

import {
  COLLECTIONS,
  newId,
  listByUser,
  getById,
  upsertDocument,
  updateDocument,
  removeDocument,
} from '../services/firestoreService';
import { turmaRepository } from './turmaRepository';

const COLLECTION = COLLECTIONS.CURSOS;

// Código único dentro dos cursos do usuário (ignora o próprio curso ao editar).
async function assertCodigoDisponivel(codigo, ignoreId = null) {
  const cursos = await listByUser(COLLECTION);
  const duplicado = cursos.some(
    (c) => c.id !== ignoreId && String(c.codigo).toUpperCase() === String(codigo).toUpperCase()
  );
  if (duplicado) {
    throw new Error(`Já existe um curso com o código ${codigo}.`);
  }
}

// READ (lista) — ordenada por nome; apenasAtivos serve para o cadastro de matrículas.
export async function listCursos({ apenasAtivos = false } = {}) {
  const cursos = await listByUser(COLLECTION);
  return cursos
    .filter((c) => !apenasAtivos || c.status === 'ativo')
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
}

// READ (um registro)
export async function getCurso(id) {
  return getById(COLLECTION, id);
}

// CREATE
export async function createCurso(data) {
  await assertCodigoDisponivel(data.codigo);
  return upsertDocument(COLLECTION, { ...data, id: newId(COLLECTION) });
}

// UPDATE
export async function updateCurso(id, data) {
  await assertCodigoDisponivel(data.codigo, id);
  return updateDocument(COLLECTION, id, data);
}

// DELETE — bloqueia se o curso tiver turmas, para não deixar referência quebrada.
export async function deleteCurso(id) {
  const total = await turmaRepository.countTurmasDoCurso(id);
  if (total > 0) {
    throw new Error(
      `Este curso possui ${total} turma(s). ` +
        'Exclua as turmas antes de excluir o curso, ou marque o curso como inativo.'
    );
  }
  await removeDocument(COLLECTION, id);
}
