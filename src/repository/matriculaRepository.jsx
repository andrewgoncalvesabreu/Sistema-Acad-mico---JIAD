// CRUD de Matrículas. Usa o repositório genérico offline-first (SQLite + fila + Firestore).
// Coleção do Firestore: "matriculas"  |  Tabela local: "matriculas"
import { createRepository } from './baseRepository';
import { auth } from '../services/firebaseConfig';

const matriculas = createRepository('matriculas', { defaultStatus: 'ativa' });
const alunos = createRepository('alunos');
const cursos = createRepository('cursos');

export const STATUS_MATRICULA = ['ativa', 'concluida', 'cancelada'];
export const STATUS_LABEL = { ativa: 'Ativa', concluida: 'Concluída', cancelada: 'Cancelada' };

export function validateMatricula(values) {
  const errors = {};
  if (!values.alunoId) errors.alunoId = 'Selecione o aluno.';
  if (!values.cursoId) errors.cursoId = 'Selecione o curso.';
  if (!values.dataMatricula || !/^\d{4}-\d{2}-\d{2}$/.test(values.dataMatricula)) {
    errors.dataMatricula = 'Informe uma data válida (DD/MM/AAAA).';
  }
  if (!values.periodo || !String(values.periodo).trim()) {
    errors.periodo = 'Informe o período/turma (ex.: 2026.2).';
  } else if (String(values.periodo).trim().length > 30) {
    errors.periodo = 'Use no máximo 30 caracteres.';
  }
  if (values.status && !STATUS_MATRICULA.includes(values.status)) {
    errors.status = 'Status inválido.';
  }
  return errors;
}

// Regras que dependem de dados: aluno e curso precisam existir e não pode haver duplicidade.
async function assertBusinessRules(values, { ignoreId, isNew }) {
  const aluno = await alunos.getById(values.alunoId);
  if (!aluno) throw new Error('O aluno selecionado não existe mais. Escolha outro.');

  const curso = await cursos.getById(values.cursoId);
  if (!curso) throw new Error('O curso selecionado não existe mais. Escolha outro.');
  if (isNew && curso.status === 'inativo') {
    throw new Error('Este curso está inativo e não aceita novas matrículas.');
  }

  const todas = await matriculas.list({ refresh: false });
  const duplicada = todas.find(
    (m) =>
      m.id !== ignoreId &&
      m.alunoId === values.alunoId &&
      m.cursoId === values.cursoId &&
      m.periodo.trim().toLowerCase() === String(values.periodo).trim().toLowerCase() &&
      m.status !== 'cancelada'
  );
  if (duplicada) throw new Error('Este aluno já está matriculado neste curso e período.');
}

function normalize(values) {
  return {
    alunoId: values.alunoId,
    cursoId: values.cursoId,
    dataMatricula: values.dataMatricula,
    periodo: String(values.periodo).trim(),
    status: values.status || 'ativa',
  };
}

function withNames(m, alunoMap, cursoMap) {
  return {
    ...m,
    alunoNome: alunoMap.get(m.alunoId)?.nome || 'Aluno removido',
    cursoNome: cursoMap.get(m.cursoId)?.nome || 'Curso removido',
    cursoCodigo: cursoMap.get(m.cursoId)?.codigo || '',
  };
}

export const matriculaRepository = {
    async count() {
    return (await matriculas.list()).length;
  },
  // READ — lista com nome do aluno e do curso (junção feita aqui, não na tela)
  async listWithDetails() {
    const [ms, as, cs] = await Promise.all([matriculas.list(), alunos.list(), cursos.list()]);
    const alunoMap = new Map(as.map((a) => [a.id, a]));
    const cursoMap = new Map(cs.map((c) => [c.id, c]));
    return ms.map((m) => withNames(m, alunoMap, cursoMap));
  },

  // READ — um registro com detalhes
  async getDetails(id) {
    const m = await matriculas.getById(id);
    if (!m) return null;
    const [aluno, curso] = await Promise.all([alunos.getById(m.alunoId), cursos.getById(m.cursoId)]);
    return {
      ...m,
      alunoNome: aluno?.nome || 'Aluno removido',
      alunoEmail: aluno?.email || '',
      cursoNome: curso?.nome || 'Curso removido',
      cursoCodigo: curso?.codigo || '',
      cursoTurno: curso?.turno || '',
    };
  },

  getById: (id) => matriculas.getById(id),

  // Alunos e cursos para os seletores do formulário
  async listOptions() {
    const [as, cs] = await Promise.all([alunos.list(), cursos.list()]);
    return { alunos: as, cursos: cs };
  },

  // CREATE
  async create(values) {
    const errors = validateMatricula(values);
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
    const data = normalize({ ...values, status: 'ativa' });
    await assertBusinessRules(data, { isNew: true });
    return matriculas.create(data);
  },

  // UPDATE
  async update(id, values) {
    const errors = validateMatricula(values);
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
    const data = normalize(values);
    await assertBusinessRules(data, { ignoreId: id, isNew: false });
    return matriculas.update(id, data);
  },

  // Mudança de status (ativa → concluída / cancelada)
  async setStatus(id, status) {
    if (!STATUS_MATRICULA.includes(status)) throw new Error('Status inválido.');
    return matriculas.update(id, { status });
  },
  cancelar: (id) => matriculaRepository.setStatus(id, 'cancelada'),
  concluir: (id) => matriculaRepository.setStatus(id, 'concluida'),

  // DELETE
  remove: (id) => matriculas.remove(id),

  // Integridade referencial: Italo usa antes de excluir aluno/curso.
  //   hasMatriculasFor('alunoId', alunoId)  |  hasMatriculasFor('cursoId', cursoId)
  async hasMatriculasFor(field, id) {
    if (!auth.currentUser) return false;
    const todas = await matriculas.list({ refresh: false });
    return todas.some((m) => m[field] === id && m.status !== 'cancelada');
  },
};

