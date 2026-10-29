# Cenários de teste automatizados — OrangeHRM (demo)

**Sistema sob teste:** https://opensource-demo.orangehrmlive.com/ (OrangeHRM OS 5.x)
**Funcionalidades:** (1) Login · (2) Recruitment → Vacancies (adição, edição, pesquisa e deleção)
**Credencial de teste (exibida na própria tela de login):** `Admin` / `admin123`

---

## 1. Critérios adotados

### 1.1 Técnicas de caixa preta
Os cenários foram derivados **apenas da especificação observável** (campos, regras de validação e mensagens exibidas), sem olhar o código-fonte:

| Técnica | Onde foi usada |
|---|---|
| **Particionamento em classes de equivalência (PCE)** | Entradas de usuário/senha e campos do formulário de vacancy |
| **Análise de valor limite (AVL)** | Tamanho do nome da vacancy (50 / 51 caracteres) e entradas vazias |
| **Tabela de decisão** | Combinações usuário/senha no login e combinações dos campos obrigatórios ao salvar a vacancy |

### 1.2 Função, quantidade e formato dos testes E2E
Seguindo a pirâmide de testes (Fowler), a camada de UI é **lenta e cara**, então:

- Cada teste E2E valida **um comportamento** (uma classe de equivalência, um limite ou uma coluna da tabela de decisão) e é **independente** dos demais (cada um cria e remove seus próprios dados, com nomes únicos).
- Só automatizamos o que traz valor pela UI: fluxos principais (caminho feliz), regras de validação visíveis ao usuário e fluxos de cancelamento. Regras puramente de dados/API ficariam em camadas inferiores.
- Formato: **Page Object** (locators + métodos + asserções na página; *specs* só descrevem o cenário), um arquivo de *spec* por funcionalidade, IDs rastreáveis (`LOG-xx`, `VAC-xx`) no título do teste, dados dinâmicos e *data-driven* quando só mudam os dados (login inválido, campos obrigatórios).

---

## 2. Funcionalidade: Login

### 2.1 PCE

| Condição de entrada | Classes válidas | Classes inválidas |
|---|---|---|
| Username | V1: usuário cadastrado (`Admin`) | I1: usuário inexistente · I2: vazio · I3: injeção de SQL (`' OR '1'='1`) |
| Password | V2: senha correta (`admin123`) | I4: senha incorreta · I5: vazia · I6: senha correta com caixa alterada (`ADMIN123`) |

### 2.2 AVL
O formulário só diferencia "vazio" de "preenchido"; os limites relevantes são **0 caracteres** (vazio → `Required`) e **1+ caracteres** (processado). Os limites de tamanho máximo não são documentados na tela, portanto não foram automatizados.

### 2.3 Tabela de decisão

| Regra | R1 | R2 | R3 | R4 | R5 | R6 | R7 |
|---|---|---|---|---|---|---|---|
| Username preenchido | F | V | F | V | V | V | V |
| Password preenchido | V | F | F | V | V | V | V |
| Username cadastrado | – | – | – | V | V | F | F |
| Password correta | – | – | – | V | F | V | F |
| **Efeito** | Required (user) | Required (senha) | Required (ambos) | **Dashboard** | Invalid credentials | Invalid credentials | Invalid credentials |

### 2.4 Cenários

| ID | Cenário | Técnica | Dado / Quando / Então | Automatizar |
|---|---|---|---|---|
| LOG-01 | Login com credenciais válidas | PCE (V1,V2) · R4 | **Dado** que estou na tela de login **Quando** informo `Admin`/`admin123` e clico em Login **Então** sou levado ao Dashboard e vejo o menu | Sim |
| LOG-02 | Usuário inexistente | PCE I1 · R6 | **Quando** informo usuário inexistente e senha válida **Então** vejo "Invalid credentials" e permaneço no login | Sim |
| LOG-03 | Senha incorreta | PCE I4 · R5 | **Quando** informo `Admin` e senha errada **Então** vejo "Invalid credentials" | Sim |
| LOG-04 | Usuário e senha incorretos | R7 | **Quando** informo ambos inválidos **Então** vejo "Invalid credentials" | Sim |
| LOG-05 | Usuário vazio | PCE I2 · AVL · R1 | **Quando** deixo o usuário vazio e preencho a senha **Então** vejo "Required" no campo usuário | Sim |
| LOG-06 | Senha vazia | PCE I5 · AVL · R2 | **Quando** preencho o usuário e deixo a senha vazia **Então** vejo "Required" no campo senha | Sim |
| LOG-07 | Ambos vazios | AVL · R3 | **Quando** clico em Login sem preencher nada **Então** vejo "Required" nos dois campos | Sim |
| LOG-08 | Senha diferencia maiúsculas/minúsculas | PCE I6 | **Quando** informo `Admin`/`ADMIN123` **Então** vejo "Invalid credentials" | Sim |
| LOG-09 | Tentativa de injeção de SQL | PCE I3 | **Quando** informo `' OR '1'='1` no usuário e na senha **Então** o acesso é negado ("Invalid credentials") | Sim |
| LOG-10 | Campo de senha mascarado | Especificação | **Então** o campo senha tem `type="password"` | Sim |
| LOG-11 | Logout | Fluxo principal | **Dado** que estou logado **Quando** escolho Logout no menu do usuário **Então** retorno à tela de login | Sim |
| LOG-12 | Acesso a página protegida sem login | Fluxo alternativo | **Quando** abro a URL do Dashboard sem sessão **Então** sou redirecionado ao login | Sim |
| LOG-13 | Link "Forgot your password?" | Fluxo alternativo | **Quando** clico no link **Então** abre a tela "Reset Password" | Sim |

---

## 3. Funcionalidade: Recruitment → Vacancies

### 3.1 Regras observáveis no formulário (Add/Edit Vacancy)
- **Vacancy Name**: obrigatório, máx. 50 caracteres, único.
- **Job Title**: obrigatório (lista).
- **Hiring Manager**: obrigatório (autocomplete de funcionários).
- **Description**, **Number of Positions**, **Active** e **Publish in RSS**: opcionais.
- Ao salvar: toast de sucesso; na lista, cada vacancy exibe Job Title, Hiring Manager e Status (**Active** ou **Closed**).

### 3.2 PCE

| Condição de entrada | Classes válidas | Classes inválidas |
|---|---|---|
| Vacancy Name | V1: 1 a 50 caracteres, não repetido | I1: vazio · I2: > 50 caracteres · I3: já existente |
| Job Title | V2: item da lista | I4: não selecionado |
| Hiring Manager | V3: funcionário existente (selecionado no autocomplete) | I5: não selecionado |
| Active | V4: marcado (→ Active) · V5: desmarcado (→ Closed) | – |
| Filtros de busca | V6: Job Title, Vacancy, Hiring Manager, Status (isolados) | – |

### 3.3 AVL — Vacancy Name

| Valor | Tamanho | Resultado esperado |
|---|---|---|
| vazio | 0 | Required |
| 1 caractere | 1 | Salva |
| limite superior | 50 | Salva |
| acima do limite | 51 | "Should not exceed 50 characters" |

### 3.4 Tabela de decisão — salvar vacancy

| Regra | D1 | D2 | D3 | D4 | D5 | D6 |
|---|---|---|---|---|---|---|
| Nome preenchido | V | F | V | V | F | V |
| Job Title selecionado | V | V | F | V | F | V |
| Hiring Manager selecionado | V | V | V | F | F | V |
| Nome único | V | – | – | – | – | F |
| **Efeito** | Salva + toast | Required (nome) | Required (job title) | Required (manager) | Required nos 3 | "Already exists" |

### 3.5 Cenários

#### Adição
| ID | Cenário | Técnica | Resultado esperado | Automatizar |
|---|---|---|---|---|
| VAC-01 | Adicionar vacancy só com campos obrigatórios | PCE V1,V2,V3 · D1 | Sistema abre a tela de edição da vacancy criada (`Edit Vacancy`); ela aparece na lista com status Active | Sim |
| VAC-02 | Adicionar vacancy com todos os campos (descrição, nº de vagas, RSS) | PCE | Salva; ao reabrir, os dados persistidos estão corretos | Sim |
| VAC-03 | Adicionar vacancy desmarcando "Active" | PCE V5 | Na lista, status = Closed | Sim |
| VAC-04 | Salvar sem preencher nada | D5 | "Required" em Vacancy Name, Job Title e Hiring Manager; nada é salvo | Sim |
| VAC-05 | Salvar sem Vacancy Name | PCE I1 · D2 | "Required" no nome | Sim |
| VAC-06 | Salvar sem Job Title | PCE I4 · D3 | "Required" no Job Title | Sim |
| VAC-07 | Salvar sem Hiring Manager | PCE I5 · D4 | "Required" no Hiring Manager | Sim |
| VAC-08 | Nome com 50 caracteres (limite superior) | AVL | Salva com sucesso | Sim |
| VAC-09 | Nome com 51 caracteres (acima do limite) | AVL · PCE I2 | Mensagem de limite excedido; não salva | Sim |
| VAC-10 | Nome duplicado | PCE I3 · D6 | "Already exists"; não salva | Sim |
| VAC-11 | Cancelar a adição | Fluxo alternativo | Volta à lista sem criar a vacancy | Sim |

#### Edição
| ID | Cenário | Técnica | Resultado esperado | Automatizar |
|---|---|---|---|---|
| VAC-12 | Editar nome e descrição | PCE | Alteração gravada; lista mostra o novo nome e o antigo some | Sim |
| VAC-13 | Fechar vacancy (desmarcar Active) | PCE V5 | Status na lista passa a Closed | Sim |
| VAC-14 | Editar apagando o nome | PCE I1 | "Required"; alteração não é gravada | Sim |

#### Pesquisa
| ID | Cenário | Técnica | Resultado esperado | Automatizar |
|---|---|---|---|---|
| VAC-15 | Pesquisar por Vacancy (nome) | PCE V6 | Exatamente 1 registro: a vacancy escolhida | Sim |
| VAC-16 | Pesquisar por Job Title | PCE V6 | Todos os registros exibidos têm o Job Title filtrado e incluem a vacancy criada | Sim |
| VAC-17 | Pesquisar por Hiring Manager | PCE V6 | A vacancy criada aparece e todos os registros têm o manager filtrado | Sim |
| VAC-18 | Pesquisar por Status = Closed | PCE V6 | A vacancy fechada aparece; todos os registros têm status Closed | Sim |
| VAC-19 | Combinar Job Title + Vacancy | Combinação | 1 registro | Sim |
| VAC-20 | Reset dos filtros | Fluxo alternativo | Filtros voltam ao estado inicial ("-- Select --") e a lista deixa de ser filtrada | Sim |

#### Deleção
| ID | Cenário | Técnica | Resultado esperado | Automatizar |
|---|---|---|---|---|
| VAC-21 | Deletar confirmando | Fluxo principal | Diálogo de confirmação fecha e a vacancy some da lista | Sim |
| VAC-22 | Deletar cancelando na confirmação | Fluxo alternativo | A vacancy permanece na lista | Sim |
| VAC-23 | Vacancy deletada não é mais pesquisável | Pós-condição | Não aparece como opção no filtro "Vacancy" | Sim |

---

## 4. Fora do escopo desta automação (cobertura reduzida de propósito)
- Limites de tamanho máximo de usuário/senha e do campo Number of Positions (não documentados na interface; exigiriam confirmação com o time de produto).
- Validação de Description > 250 caracteres e demais campos opcionais (baixa criticidade).
- Candidatos, entrevistas e demais abas de Recruitment.
- Testes de acessibilidade, desempenho e responsividade (outras camadas/ferramentas).
- Bloqueio de conta por tentativas excessivas (não existe no demo).

## 5. Riscos conhecidos
- O site demo é **compartilhado e reinicializado periodicamente**: por isso os testes não dependem de dados pré-existentes (exceto o Job Title `QA Engineer`, configurável por variável de ambiente) e limpam o que criam.
- Textos de mensagens vêm da versão atual do demo (inglês); se a versão mudar, ajuste em `data/messages.js`.
