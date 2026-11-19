// CRUD de Alunos. As telas só chamam estas funções (nunca o Firestore direto).
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

const COLLECTION = COLLECTIONS.ALUNOS;

// CPF/matrícula único dentro dos alunos do usuário (ignora o próprio aluno ao editar).
async function assertCpfMatriculaDisponivel(cpfMatricula, ignoreId = null) {
  const alunos = await listByUser(COLLECTION);
  const duplicado = alunos.some((a) => a.id !== ignoreId && a.cpfMatricula === cpfMatricula);
  if (duplicado) {
    throw new Error('Já existe um aluno cadastrado com este CPF/matrícula.');
  }
}

// READ (lista) — ordenada por nome
export async function listAlunos({ apenasAtivos = false } = {}) {
  const alunos = await listByUser(COLLECTION);
  return alunos
    .filter((a) => !apenasAtivos || a.status === 'ativo')
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
}

// READ (um registro)
export async function getAluno(id) {
  return getById(COLLECTION, id);
}

// CREATE
export async function createAluno(data) {
  await assertCpfMatriculaDisponivel(data.cpfMatricula);
  return upsertDocument(COLLECTION, { ...data, id: newId(COLLECTION) });
}

// UPDATE
export async function updateAluno(id, data) {
  await assertCpfMatriculaDisponivel(data.cpfMatricula, id);
  return updateDocument(COLLECTION, id, data);
}

export async function countMatriculasDoAluno(id) {
  const matriculas = await listByUser(COLLECTIONS.MATRICULAS);
  return matriculas.filter((m) => m.alunoId === id).length;
}

// DELETE — bloqueia se houver matrículas ligadas, para não deixar referência quebrada.
export async function deleteAluno(id) {
  const total = await countMatriculasDoAluno(id);
  if (total > 0) {
    throw new Error(
      `Este aluno possui ${total} matrícula(s) vinculada(s). ` +
        'Exclua ou cancele as matrículas antes de excluir o aluno, ou marque o aluno como inativo.'
    );
  }
  await removeDocument(COLLECTION, id);
}
