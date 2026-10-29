# OrangeHRM E2E — Playwright + Page Object

Automação de testes web E2E do site [OrangeHRM demo](https://opensource-demo.orangehrmlive.com/) para as funcionalidades **Login** e **Recruitment › Vacancies** (adição, edição, pesquisa e deleção).

- Cenários (derivados com PCE, AVL e tabela de decisão): [`cenarios.md`](./cenarios.md)
- 36 testes automatizados (13 de login/logout + 23 de vacancies), IDs `LOG-xx` e `VAC-xx` iguais aos do `cenarios.md`.

## Estrutura

```
cenarios.md            lista de cenários e técnicas de caixa preta aplicadas
pages/                 Page Objects (locators + métodos + asserções)
  BasePage.js          helpers comuns (grupos de campo, dropdowns, toast)
  LoginPage.js
  VacanciesPage.js     lista, pesquisa e deleção
  VacancyFormPage.js   formulário de adição/edição
fixtures/index.js      fixtures: page objects, login e limpeza automática dos dados criados
data/                  usuários, mensagens e geração de dados únicos
tests/                 specs (só descrevem o cenário; não têm locators)
```

## Como executar

Requisitos: Node.js 18+.

```bash
npm install
npx playwright install        # baixa os navegadores
npm test                      # chromium, firefox e webkit
npm run test:chromium         # só Chrome
npm run test:login
npm run test:vacancies
npm run test:ui               # modo UI (depuração)
npm run report                # abre o relatório HTML
```

Se um teste falhar, abra o trace: `npx playwright show-trace test-results/<pasta-do-teste>/trace.zip`.

### Variáveis de ambiente (opcionais)

| Variável | Padrão | Uso |
|---|---|---|
| `BASE_URL` | `https://opensource-demo.orangehrmlive.com` | ambiente testado |
| `ORANGE_USER` / `ORANGE_PASSWORD` | `Admin` / `admin123` | credenciais |
| `JOB_TITLE` | `QA Engineer` | Job Title usado nas vacancies (precisa existir no demo) |
| `OTHER_JOB_TITLE` | `Payroll Administrator` | segundo Job Title |
| `HIRING_MANAGER_HINT` | `a` | texto digitado no autocomplete do Hiring Manager |

## Decisões de projeto

- **Independência:** cada teste cria suas vacancies com nome único e as remove ao final (fixture `createdVacancies`), pois o demo é compartilhado e reinicializado.
- **Locators resilientes:** preferência por papel/label/placeholder (`getByRole`, `getByPlaceholder`); classes `oxd-*` só onde o componente não expõe papel acessível.
- **Data-driven** apenas onde muda só o dado (login inválido e campos obrigatórios).
- Auto-wait do Playwright, sem `waitForTimeout`.
