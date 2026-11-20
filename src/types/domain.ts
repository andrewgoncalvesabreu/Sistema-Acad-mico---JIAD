// Modelo de dados do Sistema Acadêmico JIAD.
// Coleções do Firestore: alunos, cursos, matriculas (documentos com ID gerado por newId()).

export type SyncStatus = 'synced' | 'pending' | 'error';

export interface BaseDoc {
  id: string;
  userId: string;        // uid do Firebase Auth do dono do registro
  status: string;
  createdAt: string;     // ISO 8601
  updatedAt: string;     // ISO 8601 (usado para resolver conflitos na sincronização)
  syncStatus: SyncStatus;
}

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Aluno extends BaseDoc {
  nome: string;
  email: string;
  telefone: string;
  cpfMatricula: string;
  dataNascimento: string;
  endereco: Endereco;
  status: 'ativo' | 'inativo';
}

export interface Curso extends BaseDoc {
  nome: string;
  codigo: string;
  descricao: string;
  cargaHoraria: number;
  turno: 'manha' | 'tarde' | 'noite';
  status: 'ativo' | 'inativo';
}

export interface Matricula extends BaseDoc {
  alunoId: string;
  cursoId: string;
  dataMatricula: string;
  periodo: string;
  status: 'ativa' | 'concluida' | 'cancelada';
}

export interface Turma extends BaseDoc {
  nome: string;          // ex.: "Turma A"
  cursoId: string;
  periodo: string;       // ex.: "2026.2"
  vagas: number;
  alunoIds: string[];    // alunos que estão dentro da turma
  status: 'aberta' | 'encerrada';
}

export interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entity: 'alunos' | 'cursos' | 'matriculas' | 'turmas';
  entityId: string;
  payload: string;       // JSON do documento
  createdAt: string;
  status: 'pending' | 'error';
}