// Validações dos formulários. Cada validateX recebe os valores do FORMULÁRIO
// (texto com máscara) e devolve { isValid, errors } com uma mensagem por campo.

import { TURNOS, STATUS_OPTIONS } from './constants';
import { onlyDigits, normalizeText, normalizeCpfMatricula } from './formatters';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value ?? '').trim());
}

export function isValidCpf(value) {
  const d = onlyDigits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digit = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(9) === Number(d[9]) && digit(10) === Number(d[10]);
}

// Aceita CPF válido (11 dígitos) ou uma matrícula (4 a 20 letras/números).
export function isValidCpfOrMatricula(value) {
  const v = normalizeCpfMatricula(value);
  if (/^\d+$/.test(v)) {
    return v.length === 11 ? isValidCpf(v) : v.length >= 4 && v.length <= 20;
  }
  return /^[A-Z0-9]{4,20}$/.test(v);
}

export function isValidPhone(value) {
  const d = onlyDigits(value);
  if (d.length !== 10 && d.length !== 11) return false;
  if (Number(d.slice(0, 2)) < 11) return false; // DDD inválido
  return d.length === 10 || d[2] === '9'; // celular começa com 9
}

export function isValidCep(value) {
  return onlyDigits(value).length === 8;
}

// Data no formato DD/MM/AAAA, real e que não esteja no futuro.
export function isValidBirthDateBr(value) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value ?? ''));
  if (!m) return false;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const date = new Date(year, month - 1, day);
  const real =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return real && year >= 1900 && date <= new Date();
}

export function validateAluno(form) {
  const errors = {};

  if (normalizeText(form.nome).length < 3) {
    errors.nome = 'Informe o nome completo (mínimo 3 caracteres).';
  }
  if (!String(form.email ?? '').trim()) {
    errors.email = 'Informe o e-mail.';
  } else if (!isValidEmail(form.email)) {
    errors.email = 'E-mail inválido. Exemplo: nome@dominio.com';
  }
  if (!onlyDigits(form.telefone)) {
    errors.telefone = 'Informe o telefone.';
  } else if (!isValidPhone(form.telefone)) {
    errors.telefone = 'Telefone inválido. Use DDD + número, ex.: (61) 91234-5678';
  }
  if (!String(form.cpfMatricula ?? '').trim()) {
    errors.cpfMatricula = 'Informe o CPF ou a matrícula.';
  } else if (!isValidCpfOrMatricula(form.cpfMatricula)) {
    errors.cpfMatricula = 'Informe um CPF válido ou uma matrícula (4 a 20 letras/números).';
  }
  if (!String(form.dataNascimento ?? '').trim()) {
    errors.dataNascimento = 'Informe a data de nascimento.';
  } else if (!isValidBirthDateBr(form.dataNascimento)) {
    errors.dataNascimento = 'Data inválida. Use o formato DD/MM/AAAA.';
  }

  if (!onlyDigits(form.cep)) {
    errors.cep = 'Informe o CEP.';
  } else if (!isValidCep(form.cep)) {
    errors.cep = 'CEP inválido. Ele deve ter 8 números.';
  }
  if (!normalizeText(form.logradouro)) errors.logradouro = 'Informe o logradouro.';
  if (!normalizeText(form.numero)) errors.numero = 'Informe o número.';
  if (!normalizeText(form.bairro)) errors.bairro = 'Informe o bairro.';
  if (!normalizeText(form.cidade)) errors.cidade = 'Informe a cidade.';
  if (!/^[A-Za-z]{2}$/.test(normalizeText(form.uf))) {
    errors.uf = 'Informe a UF com 2 letras (ex.: DF).';
  }
  if (!STATUS_OPTIONS.some((s) => s.value === form.status)) {
    errors.status = 'Selecione o status.';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateCurso(form) {
  const errors = {};

  if (normalizeText(form.nome).length < 3) {
    errors.nome = 'Informe o nome do curso (mínimo 3 caracteres).';
  }
  if (!/^[A-Za-z0-9-]{2,10}$/.test(normalizeText(form.codigo))) {
    errors.codigo = 'Informe o código (2 a 10 letras, números ou hífen). Ex.: ADS01';
  }
  if (String(form.descricao ?? '').trim().length < 5) {
    errors.descricao = 'Descreva o curso (mínimo 5 caracteres).';
  }
  const horas = Number(onlyDigits(form.cargaHoraria));
  if (!onlyDigits(form.cargaHoraria) || horas < 1 || horas > 10000) {
    errors.cargaHoraria = 'Informe a carga horária em horas (número inteiro entre 1 e 10000).';
  }
  if (!TURNOS.some((t) => t.value === form.turno)) {
    errors.turno = 'Selecione o turno.';
  }
  if (!STATUS_OPTIONS.some((s) => s.value === form.status)) {
    errors.status = 'Selecione o status.';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
