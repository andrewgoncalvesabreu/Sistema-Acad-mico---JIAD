# Alunos, Cursos e Turmas — dados de demonstração e relato de testes

## 1. Dados de demonstração

### Cursos
| Nome | Código | Descrição | Carga horária | Turno | Status |
|---|---|---|---|---|---|
| Análise e Desenvolvimento de Sistemas | ADS01 | Formação em desenvolvimento de software | 2400 | Noite | Ativo |
| Redes de Computadores | RED01 | Infraestrutura e segurança de redes | 2000 | Manhã | Ativo |
| Gestão de TI | GTI01 | Gestão de projetos e serviços de TI | 1600 | Tarde | Inativo |

### Alunos
| Nome | E-mail | Telefone | CPF/matrícula | Nascimento | CEP | Logradouro | Nº | Bairro | Cidade/UF |
|---|---|---|---|---|---|---|---|---|---|
| Maria da Silva | maria@exemplo.com | (61) 91234-5678 | 123.456.789-09 | 20/05/2000 | 72010-000 | CNB 1 | 10 | Taguatinga Norte | Brasília/DF |
| João Pereira | joao@exemplo.com | (61) 99876-5432 | 111.444.777-35 | 15/03/1998 | 70040-010 | Esplanada dos Ministérios | S/N | Zona Cívico-Administrativa | Brasília/DF |
| Ana Souza | ana@exemplo.com | (61) 3234-5678 | 2024001 (matrícula) | 01/12/2002 | 72215-000 | QNM 2 | 25 | Ceilândia Sul | Brasília/DF |

Dados de endereço são fictícios, apenas para demonstração.

### Turmas
| Nome | Curso | Período | Vagas | Alunos dentro |
|---|---|---|---|---|
| Turma 01 - ADS | Análise e Desenvolvimento de Sistemas | 2026.2 | 20 | Maria da Silva, João Pereira |
| Turma 01 - REDES | Redes de Computadores | 2026.2 | 2 | Ana Souza (e mais uma vaga, para testar a lotação) |

Cada turma pertence a um curso e guarda a lista de alunos dentro dela. Turma nova nasce **aberta** e vazia.

## 2. Roteiro de testes manuais (preencher com o resultado real)

### Cursos
| # | Teste | Resultado esperado | Resultado obtido |
|---|---|---|---|
| C1 | Salvar formulário vazio | 4 mensagens de erro, nada é gravado | |
| C2 | Cadastrar curso válido | Volta para a lista com o curso novo | |
| C3 | Cadastrar outro curso com o mesmo código | Mensagem "Já existe um curso com o código..." | |
| C4 | Abrir detalhes | Todos os campos exibidos | |
| C5 | Editar nome e turno | Lista e detalhes mostram os novos dados | |
| C6 | Excluir curso sem turmas | Pede confirmação e remove da lista | |
| C7 | Excluir curso com turma | Mensagem de bloqueio, curso permanece | |
| C8 | Falha de persistência (sem internet/permissão) | Mensagem de erro, formulário mantém os dados | |

### Alunos
| # | Teste | Resultado esperado | Resultado obtido |
|---|---|---|---|
| A1 | Salvar formulário vazio | Mensagens de erro nos campos obrigatórios | |
| A2 | E-mail `maria@` | "E-mail inválido" | |
| A3 | CPF `111.111.111-11` | "Informe um CPF válido ou uma matrícula" | |
| A4 | Data `31/02/2000` | "Data inválida" | |
| A5 | Telefone com 8 dígitos | "Telefone inválido" | |
| A6 | Cadastrar aluno válido | Volta para a lista com o aluno novo | |
| A7 | Cadastrar outro aluno com o mesmo CPF | Mensagem de CPF/matrícula já cadastrado | |
| A8 | Buscar por parte do nome na lista | Lista filtrada; sem resultado mostra aviso | |
| A9 | Abrir detalhes | Dados pessoais e endereço exibidos | |
| A10 | Editar telefone | Dado atualizado na lista e nos detalhes | |
| A11 | Excluir aluno sem turmas | Pede confirmação e remove da lista | |
| A12 | Excluir aluno que está em uma turma | Mensagem de bloqueio, aluno permanece | |
| A13 | Falha de persistência (sem internet/permissão) | Mensagem de erro, formulário mantém os dados | |

### Turmas
| # | Teste | Resultado esperado | Resultado obtido |
|---|---|---|---|
| T1 | Salvar formulário vazio | Mensagens de erro em curso, nome, período e vagas; nada é gravado | |
| T2 | Vagas `0` e depois `201` | "Informe um número de vagas entre 1 e 200." | |
| T3 | Cadastrar turma válida | Volta para a lista com a turma "Aberta" e `0/N alunos` | |
| T4 | Cadastrar turma com mesmo curso, nome e período | "Já existe uma turma com este nome neste curso e período." | |
| T5 | Abrir "Nova turma" com um curso inativo cadastrado | O curso inativo não aparece no seletor | |
| T6 | Abrir detalhes | Curso, período, vagas e lista de alunos exibidos | |
| T7 | Adicionar aluno à turma | Aluno aparece na lista e as vagas passam a `1/N` | |
| T8 | Reabrir o seletor de alunos | Aluno já na turma e aluno inativo não aparecem para adicionar | |
| T9 | Encher todas as vagas e tentar adicionar mais um aluno | "A turma está lotada. Aumente as vagas para adicionar mais alunos." | |
| T10 | Remover aluno da turma | Aluno some da lista da turma (continua cadastrado em Alunos) | |
| T11 | Editar vagas para menos que o total de alunos | "A turma já tem N aluno(s). As vagas não podem ser menores que isso." | |
| T12 | Encerrar turma | Status "Encerrada"; seletor e botões "Remover" somem | |
| T13 | Reabrir turma encerrada | Status "Aberta"; seletor e "Remover" voltam | |
| T14 | Excluir turma | Pede confirmação e remove da lista; os alunos continuam cadastrados | |
| T15 | Excluir aluno que está em turma / curso que tem turma | Mensagem de bloqueio (ver A12 e C7) | |
| T16 | Sem internet: cadastrar turma | Turma salva no aparelho com "⏳ Pendente de sincronização" | |
| T17 | Internet volta | Turma é enviada ao Firestore e o selo de pendente some | |

## 3. Onde está cada coisa (para a arguição)

| Item | Aluno | Curso | Turma |
|---|---|---|---|
| Create / Read / Update / Delete | `src/repository/alunoRepository.jsx` | `src/repository/cursoRepository.jsx` | `src/repository/turmaRepository.jsx` |
| Telas | `src/screens/alunos/` | `src/screens/cursos/` | `src/screens/turmas/` |
| Rotas | `src/app/alunos/` | `src/app/cursos/` | `src/app/turmas/` |
| Validação | `validateAluno` em `src/utils/validators.jsx` | `validateCurso` | `validateTurma` em `src/repository/turmaRepository.jsx` |
| Normalização (formulário ↔ banco) | `toAlunoPayload` / `toAlunoForm` em `src/utils/formatters.jsx` | `toCursoPayload` / `toCursoForm` | `normalize` em `turmaRepository.jsx` |
| Acesso aos dados | `src/services/firestoreService.js` (Andrew) | idem | `src/repository/baseRepository.js` (SQLite + fila) e `src/services/sync/syncService.jsx` |
| Coleção no Firestore | `alunos` | `cursos` | `turmas` |