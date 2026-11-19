# Alunos e Cursos — dados de demonstração e relato de testes (Italo)

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

## 2. Roteiro de testes manuais (preencher com o resultado real)

### Cursos
| # | Teste | Resultado esperado | Resultado obtido |
|---|---|---|---|
| C1 | Salvar formulário vazio | 4 mensagens de erro, nada é gravado | |
| C2 | Cadastrar curso válido | Volta para a lista com o curso novo | |
| C3 | Cadastrar outro curso com o mesmo código | Mensagem "Já existe um curso com o código..." | |
| C4 | Abrir detalhes | Todos os campos exibidos | |
| C5 | Editar nome e turno | Lista e detalhes mostram os novos dados | |
| C6 | Excluir curso sem matrículas | Pede confirmação e remove da lista | |
| C7 | Excluir curso com matrícula | Mensagem de bloqueio, curso permanece | |
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
| A11 | Excluir aluno sem matrículas | Pede confirmação e remove da lista | |
| A12 | Excluir aluno com matrícula | Mensagem de bloqueio, aluno permanece | |
| A13 | Falha de persistência (sem internet/permissão) | Mensagem de erro, formulário mantém os dados | |

## 3. Onde está cada coisa (para a arguição)

| Item | Aluno | Curso |
|---|---|---|
| Create / Read / Update / Delete | `src/repository/alunoRepository.jsx` | `src/repository/cursoRepository.jsx` |
| Telas | `src/screens/alunos/` | `src/screens/cursos/` |
| Rotas | `src/app/alunos/` | `src/app/cursos/` |
| Validação | `validateAluno` em `src/utils/validators.jsx` | `validateCurso` |
| Normalização (formulário ↔ banco) | `toAlunoPayload` / `toAlunoForm` em `src/utils/formatters.jsx` | `toCursoPayload` / `toCursoForm` |
| Acesso ao Firestore | `src/services/firestoreService.js` (Andrew) | idem |
| Coleção no Firestore | `alunos` | `cursos` |
