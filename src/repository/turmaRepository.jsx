// CRUD de Turmas. Uma turma é uma oferta de um curso, com os alunos dentro dela (alunoIds).
// Usa o repositório genérico offline-first (SQLite + fila + Firestore).
// Coleção do Firestore: "turmas"  |  Tabela local: "turmas"
import { createRepository } from './baseRepository';
import { auth } from '../services/firebaseConfig';

const turmas = createRepository('turmas', { defaultStatus: 'aberta' });
const alunos = createRepository('alunos');
const cursos = createRepository('cursos');

export const STATUS_TURMA = ['aberta', 'encerrada'];
export const STATUS_LABEL = { aberta: 'Aberta', encerrada: 'Encerrada' };
export const MAX_VAGAS = 200;

const byNome = (a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR');

// alunos e cursos são gravados direto no Firestore pelos outros repositórios, então o cache
// local (SQLite) pode ainda não ter um registro recém-criado: se não achar, atualiza e procura de novo.
async function findById(repo, id) {
  const local = await repo.getById(id);
  if (local) return local;
  return (await repo.list()).find((item) => item.id === id) || null;
}

// Validação de campos (pura, sem banco) — a tela usa para mostrar erros embaixo de cada campo.
export function validateTurma(values) {
  const errors = {};
  const nome = String(values.nome ?? '').trim();
  const periodo = String(values.periodo ?? '').trim();
  const vagas = Number(values.vagas);

  if (!nome) errors.nome = 'Informe o nome da turma (ex.: Turma A).';
  else if (nome.length > 40) errors.nome = 'Use no máximo 40 caracteres.';

  if (!values.cursoId) errors.cursoId = 'Selecione o curso.';

  if (!periodo) errors.periodo = 'Informe o período (ex.: 2026.2).';
  else if (periodo.length > 30) errors.periodo = 'Use no máximo 30 caracteres.';

  if (!Number.isInteger(vagas) || vagas < 1 || vagas > MAX_VAGAS) {
    errors.vagas = `Informe um número de vagas entre 1 e ${MAX_VAGAS}.`;
  }

  if (values.status && !STATUS_TURMA.includes(values.status)) errors.status = 'Status inválido.';
  return errors;
}

function normalize(values) {
  return {
    nome: String(values.nome).trim(),
    cursoId: values.cursoId,
    periodo: String(values.periodo).trim(),
    vagas: Number(values.vagas),
  };
}

// Regras que dependem de dados: o curso precisa existir e não pode haver turma duplicada.
async function assertBusinessRules(values, { ignoreId, isNew }) {
  const curso = await findById(cursos, values.cursoId);
  if (!curso) throw new Error('O curso selecionado não existe mais. Escolha outro.');
  if (isNew && curso.status === 'inativo') {
    throw new Error('Este curso está inativo e não aceita novas turmas.');
  }

  const todas = await turmas.list({ refresh: false });
  const duplicada = todas.find(
    (t) =>
      t.id !== ignoreId &&
      t.cursoId === values.cursoId &&
      String(t.nome).trim().toLowerCase() === values.nome.toLowerCase() &&
      String(t.periodo).trim().toLowerCase() === values.periodo.toLowerCase()
  );
  if (duplicada) throw new Error('Já existe uma turma com este nome neste curso e período.');

  if (ignoreId) {
    const atual = await turmas.getById(ignoreId);
    const total = atual?.alunoIds?.length ?? 0;
    if (values.vagas < total) {
      throw new Error(`A turma já tem ${total} aluno(s). As vagas não podem ser menores que isso.`);
    }
  }
}

function withCurso(t, cursoMap) {
  const alunoIds = t.alunoIds || [];
  return {
    ...t,
    alunoIds,
    totalAlunos: alunoIds.length,
    cursoNome: cursoMap.get(t.cursoId)?.nome || 'Curso removido',
    cursoCodigo: cursoMap.get(t.cursoId)?.codigo || '',
  };
}

export const turmaRepository = {
  // READ — lista com nome do curso e total de alunos (junção feita aqui, não na tela)
  // refresh: false lê só o SQLite, sem sincronizar (usado pela tela quando um sync acabou de terminar)
  async listWithDetails({ refresh = true } = {}) {
    const [ts, cs] = await Promise.all([turmas.list({ refresh }), cursos.list({ refresh })]);
    const cursoMap = new Map(cs.map((c) => [c.id, c]));
    return ts.map((t) => withCurso(t, cursoMap)).sort(byNome);
  },

  // READ — uma turma com o curso e a lista de alunos que estão dentro dela
  async getDetails(id) {
    const t = await turmas.getById(id);
    if (!t) return null;
    const [curso, todosAlunos] = await Promise.all([findById(cursos, t.cursoId), alunos.list()]);
    const alunoMap = new Map(todosAlunos.map((a) => [a.id, a]));
    const alunosDaTurma = (t.alunoIds || [])
      .map((alunoId) => alunoMap.get(alunoId) || { id: alunoId, nome: 'Aluno removido', removido: true })
      .sort(byNome);
    return {
      ...t,
      alunoIds: t.alunoIds || [],
      totalAlunos: (t.alunoIds || []).length,
      cursoNome: curso?.nome || 'Curso removido',
      cursoCodigo: curso?.codigo || '',
      cursoTurno: curso?.turno || '',
      alunos: alunosDaTurma,
    };
  },

  getById: (id) => turmas.getById(id),

  // Cursos para o seletor do formulário
  async listOptions() {
    return { cursos: await cursos.list() };
  },

  // Alunos que podem ser adicionados: ativos e que ainda não estão nesta turma
  async listAlunosDisponiveis(turmaId) {
    const [t, todos] = await Promise.all([turmas.getById(turmaId), alunos.list()]);
    const dentro = new Set(t?.alunoIds || []);
    return todos.filter((a) => a.status === 'ativo' && !dentro.has(a.id)).sort(byNome);
  },

  // CREATE — a turma nasce aberta e vazia
  async create(values) {
    const errors = validateTurma(values);
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
    const data = normalize(values);
    await assertBusinessRules(data, { isNew: true });
    return turmas.create({ ...data, alunoIds: [], status: 'aberta' });
  },

  // UPDATE — dados da turma (os alunos e o status têm operações próprias)
  async update(id, values) {
    const errors = validateTurma(values);
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
    const data = normalize(values);
    await assertBusinessRules(data, { ignoreId: id, isNew: false });
    return turmas.update(id, data);
  },

  // Colocar um aluno dentro da turma
  async addAluno(turmaId, alunoId) {
    const t = await turmas.getById(turmaId);
    if (!t) throw new Error('Turma não encontrada.');
    if (t.status !== 'aberta') throw new Error('Esta turma está encerrada e não aceita novos alunos.');

    const ids = t.alunoIds || [];
    if (ids.includes(alunoId)) throw new Error('Este aluno já está na turma.');
    if (ids.length >= t.vagas) throw new Error('A turma está lotada. Aumente as vagas para adicionar mais alunos.');

    const aluno = await findById(alunos, alunoId);
    if (!aluno) throw new Error('O aluno selecionado não existe mais.');
    if (aluno.status === 'inativo') throw new Error('Este aluno está inativo e não pode entrar em turmas.');

    return turmas.update(turmaId, { alunoIds: [...ids, alunoId] });
  },

  // Tirar um aluno da turma
  async removeAluno(turmaId, alunoId) {
    const t = await turmas.getById(turmaId);
    if (!t) throw new Error('Turma não encontrada.');
    if (t.status !== 'aberta') throw new Error('Reabra a turma para alterar a lista de alunos.');
    return turmas.update(turmaId, { alunoIds: (t.alunoIds || []).filter((id) => id !== alunoId) });
  },

  // Mudança de status (aberta ⇄ encerrada)
  async setStatus(id, status) {
    if (!STATUS_TURMA.includes(status)) throw new Error('Status inválido.');
    return turmas.update(id, { status });
  },
  encerrar: (id) => turmaRepository.setStatus(id, 'encerrada'),
  reabrir: (id) => turmaRepository.setStatus(id, 'aberta'),

  // DELETE
  remove: (id) => turmas.remove(id),

  // Total de turmas (usado pelo painel inicial)
  async count() {
    return (await turmas.list()).length;
  },

  // Integridade referencial: alunoRepository e cursoRepository usam antes de excluir.
  async countTurmasDoCurso(cursoId) {
    if (!auth.currentUser) return 0;
    const todas = await turmas.list(); // atualiza do Firestore antes de contar (checagem de exclusão)
    return todas.filter((t) => t.cursoId === cursoId).length;
  },
  async countTurmasDoAluno(alunoId) {
    if (!auth.currentUser) return 0;
    const todas = await turmas.list(); // atualiza do Firestore antes de contar (checagem de exclusão)
    return todas.filter((t) => (t.alunoIds || []).includes(alunoId)).length;
  },
};
