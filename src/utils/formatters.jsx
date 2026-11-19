// Normalização e formatação de dados (entrada dos formulários e exibição nas telas).
// Regra geral: o formulário trabalha com texto "bonito" (com máscara);
// o banco guarda o valor normalizado (só dígitos, data em ISO, etc.).

import { TURNOS, STATUS_OPTIONS } from './constants';

export function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

// ---------- Máscaras (usadas enquanto o usuário digita) ----------

export function formatCpf(value) {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function formatPhone(value) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formatCep(value) {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function maskDateBr(value) {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

// ---------- CPF ou matrícula ----------

// Remove pontos, hífens e espaços. Numérico (CPF ou matrícula) fica só com dígitos;
// matrícula com letras fica em maiúsculas.
export function normalizeCpfMatricula(value) {
  return String(value ?? '').replace(/[.\-\s]/g, '').toUpperCase();
}

export function formatCpfMatricula(value) {
  const v = String(value ?? '');
  return /^\d{11}$/.test(v) ? formatCpf(v) : v;
}

// ---------- Datas ----------

export function isoToBr(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

export function brToIso(br) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(br ?? ''));
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

// ---------- Rótulos para exibição ----------

export function labelTurno(value) {
  return TURNOS.find((t) => t.value === value)?.label ?? '—';
}

export function labelStatus(value) {
  return STATUS_OPTIONS.find((s) => s.value === value)?.label ?? '—';
}

export function formatCargaHoraria(value) {
  return value || value === 0 ? `${value} h` : '—';
}

// ---------- Formulário <-> documento do banco ----------

export const EMPTY_ALUNO_FORM = {
  nome: '',
  email: '',
  telefone: '',
  cpfMatricula: '',
  dataNascimento: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  status: 'ativo',
};

export function toAlunoForm(aluno) {
  const e = aluno?.endereco ?? {};
  return {
    nome: aluno?.nome ?? '',
    email: aluno?.email ?? '',
    telefone: formatPhone(aluno?.telefone),
    cpfMatricula: formatCpfMatricula(aluno?.cpfMatricula),
    dataNascimento: isoToBr(aluno?.dataNascimento),
    cep: formatCep(e.cep),
    logradouro: e.logradouro ?? '',
    numero: e.numero ?? '',
    complemento: e.complemento ?? '',
    bairro: e.bairro ?? '',
    cidade: e.cidade ?? '',
    uf: e.uf ?? '',
    status: aluno?.status ?? 'ativo',
  };
}

export function toAlunoPayload(form) {
  return {
    nome: normalizeText(form.nome),
    email: String(form.email ?? '').trim().toLowerCase(),
    telefone: onlyDigits(form.telefone),
    cpfMatricula: normalizeCpfMatricula(form.cpfMatricula),
    dataNascimento: brToIso(form.dataNascimento),
    endereco: {
      cep: onlyDigits(form.cep),
      logradouro: normalizeText(form.logradouro),
      numero: normalizeText(form.numero),
      complemento: normalizeText(form.complemento),
      bairro: normalizeText(form.bairro),
      cidade: normalizeText(form.cidade),
      uf: normalizeText(form.uf).toUpperCase(),
    },
    status: form.status,
  };
}

export const EMPTY_CURSO_FORM = {
  nome: '',
  codigo: '',
  descricao: '',
  cargaHoraria: '',
  turno: 'manha',
  status: 'ativo',
};

export function toCursoForm(curso) {
  return {
    nome: curso?.nome ?? '',
    codigo: curso?.codigo ?? '',
    descricao: curso?.descricao ?? '',
    cargaHoraria: curso?.cargaHoraria != null ? String(curso.cargaHoraria) : '',
    turno: curso?.turno ?? 'manha',
    status: curso?.status ?? 'ativo',
  };
}

export function toCursoPayload(form) {
  return {
    nome: normalizeText(form.nome),
    codigo: normalizeText(form.codigo).toUpperCase(),
    descricao: String(form.descricao ?? '').trim(),
    cargaHoraria: Number(onlyDigits(form.cargaHoraria)),
    turno: form.turno,
    status: form.status,
  };
}
