// CRUD de Cursos. As telas só chamam estas funções (nunca o Firestore ou o SQLite direto).
// OFFLINE-FIRST: usa o repositório genérico (baseRepository), que grava no SQLite, enfileira a
// operação e a envia ao Firestore quando há internet. Sem internet o cadastro NÃO se perde:
// fica no aparelho como "pendente" e é sincronizado quando a conexão voltar.

import { createRepository } from './baseRepository';
import { turmaRepository } from './turmaRepository';

const cursos = createRepository('cursos');

const byNome = (a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR');

// Código único dentro dos cursos do usuário (ignora o próprio curso ao editar).
async function assertCodigoDisponivel(codigo, ignoreId = null) {
  const lista = await cursos.list();
  const duplicado = lista.some(
    (c) => c.id !== ignoreId && String(c.codigo).toUpperCase() === String(codigo).toUpperCase()
  );
  if (duplicado) {
    throw new Error(`Já existe um curso com o código ${codigo}.`);
  }
}

// READ (lista) — ordenada por nome; apenasAtivos serve para o cadastro de turmas.
// refresh: false lê só o SQLite, sem sincronizar (usado pela tela quando um sync acabou de terminar).
export async function listCursos({ apenasAtivos = false, refresh = true } = {}) {
  const lista = await cursos.list({ refresh });
  return lista.filter((c) => !apenasAtivos || c.status === 'ativo').sort(byNome);
}

// READ (um registro) — do SQLite; se ainda não estiver no cache, atualiza a lista e procura de novo.
export async function getCurso(id) {
  const local = await cursos.getById(id);
  if (local) return local;
  return (await cursos.list()).find((c) => c.id === id) || null;
}

// CREATE
export async function createCurso(data) {
  await assertCodigoDisponivel(data.codigo);
  return cursos.create(data);
}

// UPDATE
export async function updateCurso(id, data) {
  await assertCodigoDisponivel(data.codigo, id);
  return cursos.update(id, data);
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
  await getCurso(id); // garante que o registro está no cache local antes de excluir
  await cursos.remove(id);
}
