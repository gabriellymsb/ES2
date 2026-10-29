# OrangeHRM E2E — Playwright + Page Object

[![Playwright Tests](https://github.com/gabriellymsb/ES2/actions/workflows/playwright.yml/badge.svg)](https://github.com/gabriellymsb/ES2/actions/workflows/playwright.yml)

Automação de testes web E2E do site [OrangeHRM demo](https://opensource-demo.orangehrmlive.com/) para as funcionalidades **Login** e **Recruitment › Vacancies** (adição, edição, pesquisa e deleção).

- Cenários (derivados com PCE, AVL e tabela de decisão): [`cenarios.md`](./cenarios.md)
- 36 testes automatizados (13 de login/logout + 23 de vacancies), com IDs `LOG-xx` e `VAC-xx` iguais aos do `cenarios.md`.
- Executados automaticamente no GitHub Actions a cada push (aba **Actions**).

## Estrutura

```
cenarios.md            lista de cenários e técnicas de caixa preta aplicadas
pages/                 Page Objects (locators + métodos + asserções)
  BasePage.js          helpers comuns (grupos de campo, dropdowns, toast)
  LoginPage.js
  VacanciesPage.js     lista, pesquisa (com paginação) e deleção
  VacancyFormPage.js   formulário de adição/edição
fixtures/index.js      fixtures: page objects, login e limpeza automática dos dados criados
data/                  usuários, mensagens e geração de dados únicos
tests/                 specs (só descrevem o cenário; não têm locators)
.github/workflows/     pipeline do GitHub Actions
```

## Como executar

Requisitos: Node.js 18+.

```bash
npm install
npx playwright install        # baixa os navegadores
npm run test:chromium         # só Chrome (36 testes)
npm test                      # chromium, firefox e webkit
npm run test:login
npm run test:vacancies
npm run test:ui               # modo UI (depuração)
npm run report                # abre o relatório HTML
```

> A validação foi feita no Chromium (é o que roda na CI). Firefox e WebKit estão configurados, mas não foram validados.

### No GitHub

1. Abra a aba **Actions** do repositório e clique na execução **Playwright Tests**.
2. O resultado aparece no job **test**, passo `Run npx playwright test --project=chromium`.
3. O relatório HTML (com screenshots, vídeos e traces das falhas) fica em **Artifacts → playwright-report**.
4. Para rodar de novo sem novo commit: **Run workflow**.

Se um teste falhar localmente, abra o trace: `npx playwright show-trace test-results/<pasta-do-teste>/trace.zip`.

### Variáveis de ambiente (opcionais)

| Variável | Padrão | Uso |
|---|---|---|
| `BASE_URL` | `https://opensource-demo.orangehrmlive.com` | ambiente testado |
| `ORANGE_USER` / `ORANGE_PASSWORD` | `Admin` / `admin123` | credenciais |
| `JOB_TITLE` | `QA Engineer` | Job Title usado nas vacancies (precisa existir no demo) |
| `OTHER_JOB_TITLE` | `Payroll Administrator` | segundo Job Title |
| `HIRING_MANAGER_HINT` | `a` | texto digitado no autocomplete do Hiring Manager |

## Decisões de projeto

- **Page Object:** locators, ações e asserções ficam nas páginas; os specs só descrevem o cenário.
- **Independência:** cada teste cria suas vacancies com nome único e as remove ao final (fixture `createdVacancies`, inclusive as fechadas), pois o demo é compartilhado.
- **Critério de sucesso sem depender do toast:** o toast "Successfully Saved" some junto com a página, então o teste confirma pelo estado final (URL com id da vacancy, linha na lista, diálogo fechado).
- **Lista paginada:** o demo acumula registros (50 por página). As vacancies são localizadas pelo filtro "Vacancy" (`find`) ou, nos filtros por Job Title, Hiring Manager e Status, percorrendo as páginas dos resultados. Vacancies fechadas só aparecem pelo filtro Status = Closed (`findClosed`).
- **Locators resilientes:** preferência por papel/label/placeholder (`getByRole`, `getByPlaceholder`); classes `oxd-*` só onde o componente não expõe papel acessível.
- **Data-driven** apenas onde muda só o dado (login inválido e campos obrigatórios).
- **Estabilidade:** auto-wait do Playwright, sem `waitForTimeout`; espera explícita de respostas da API ao pesquisar e ao salvar edições; timeouts maiores e 2 retries na CI por causa do demo lento.
