// Integração com a API ViaCEP.
//   Endpoint:  GET https://viacep.com.br/ws/{cep}/json/      (cep = 8 dígitos, sem hífen)
//   Entrada:   CEP digitado no cadastro do aluno
//   Resposta:  { cep, logradouro, bairro, localidade, uf, ... }  ou  { erro: true } se não existir
//   Uso no app: preencher logradouro, bairro, cidade e UF do endereço do aluno.
const BASE_URL = 'https://viacep.com.br/ws';
const TIMEOUT_MS = 8000;

export const onlyDigits = (value = '') => String(value).replace(/\D/g, '');

export function formatCep(value) {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export const isValidCep = (value) => onlyDigits(value).length === 8;

export class CepError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'CepError';
    this.code = code; // INVALID | NOT_FOUND | TIMEOUT | NETWORK | UNAVAILABLE
  }
}

export async function buscarCep(cepInput) {
  const cep = onlyDigits(cepInput);
  if (cep.length !== 8) {
    throw new CepError('INVALID', 'CEP inválido. Digite os 8 números do CEP.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}/${cep}/json/`, { signal: controller.signal });

    if (!response.ok) {
      if (response.status === 400) {
        throw new CepError('INVALID', 'CEP inválido. Confira os números digitados.');
      }
      throw new CepError(
        'UNAVAILABLE',
        'O serviço de CEP está indisponível no momento. Preencha o endereço manualmente.'
      );
    }

    const data = await response.json();
    if (data.erro) {
      throw new CepError('NOT_FOUND', 'CEP não encontrado. Confira o número ou preencha manualmente.');
    }

    return {
      cep: formatCep(data.cep || cep),
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      uf: data.uf || '',
    };
  } catch (error) {
    if (error instanceof CepError) throw error;
    if (error?.name === 'AbortError') {
      throw new CepError(
        'TIMEOUT',
        'O serviço de CEP demorou para responder. Tente de novo ou preencha manualmente.'
      );
    }
    throw new CepError(
      'NETWORK',
      'Sem conexão com a internet. Preencha o endereço manualmente.'
    );
  } finally {
    clearTimeout(timer);
  }
}
