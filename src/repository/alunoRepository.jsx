// CRUD de Alunos. As telas só chamam estas funções (nunca o Firestore ou o SQLite direto).
// OFFLINE-FIRST: usa o repositório genérico (baseRepository), que grava no SQLite, enfileira a
// operação e a envia ao Firestore quando há internet. Sem internet o cadastro NÃO se perde:
// fica no aparelho como "pendente" e é sincronizado quando a conexão voltar.

import { createRepository } from './baseRepository';
import { turmaRepository } from './turmaRepository';

const alunos = createRepository('alunos');

const byNome = (a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR');

// CPF/matrícula único dentro dos alunos do usuário (ignora o próprio aluno ao editar).
async function assertCpfMatriculaDisponivel(cpfMatricula, ignoreId = null) {
  const lista = await alunos.list();
  const duplicado = lista.some((a) => a.id !== ignoreId && a.cpfMatricula === cpfMatricula);
  if (duplicado) {
    throw new Error('Já existe um aluno cadastrado com este CPF/matrícula.');
  }
}

// READ (lista) — ordenada por nome.
// refresh: false lê só o SQLite, sem sincronizar (usado pela tela quando um sync acabou de terminar).
export async function listAlunos({ apenasAtivos = false, refresh = true } = {}) {
  const lista = await alunos.list({ refresh });
  return lista.filter((a) => !apenasAtivos || a.status === 'ativo').sort(byNome);
}

// READ (um registro) — do SQLite; se ainda não estiver no cache, atualiza a lista e procura de novo.
export async function getAluno(id) {
  const local = await alunos.getById(id);
  if (local) return local;
  return (await alunos.list()).find((a) => a.id === id) || null;
}

// CREATE
export async function createAluno(data) {
  await assertCpfMatriculaDisponivel(data.cpfMatricula);
  return alunos.create(data);
}

// UPDATE
export async function updateAluno(id, data) {
  await assertCpfMatriculaDisponivel(data.cpfMatricula, id);
  return alunos.update(id, data);
}

// DELETE — bloqueia se o aluno estiver em alguma turma, para não deixar referência quebrada.
export async function deleteAluno(id) {
  const total = await turmaRepository.countTurmasDoAluno(id);
  if (total > 0) {
    throw new Error(
      `Este aluno está em ${total} turma(s). ` +
        'Remova-o das turmas antes de excluir, ou marque o aluno como inativo.'
    );
  }
  await getAluno(id); // garante que o registro está no cache local antes de excluir
  await alunos.remove(id);
}
