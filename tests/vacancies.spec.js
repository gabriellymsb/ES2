const { test, expect } = require('../fixtures');
const { buildVacancy, uniqueName, JOB_TITLE, OTHER_JOB_TITLE } = require('../data/vacancyData');
const messages = require('../data/messages');

/**
 * Cria uma vacancy pela UI, registra para limpeza e devolve os dados usados
 * (inclui o Hiring Manager escolhido). Termina na lista de vacancies.
 */
async function createVacancy({ vacanciesPage, vacancyForm, createdVacancies }, overrides = {}) {
  const data = buildVacancy({ hiringManager: true, ...overrides });
  createdVacancies.push(data.name);
  await vacanciesPage.goto();
  await vacanciesPage.clickAdd();
  const filled = await vacancyForm.createVacancy(data);
  await vacancyForm.expectSaved();
  await vacanciesPage.goto();
  return { ...data, hiringManager: filled.hiringManager };
}

test.describe('Recruitment > Vacancies — Adição', () => {
  test.beforeEach(async ({ loggedIn, vacanciesPage }) => {
    await vacanciesPage.goto();
    await vacanciesPage.clickAdd();
  });

  test('VAC-01 deve adicionar vacancy apenas com campos obrigatórios', async ({ vacancyForm, vacanciesPage, createdVacancies }) => {
    const data = buildVacancy({ hiringManager: true });
    createdVacancies.push(data.name);

    const { hiringManager } = await vacancyForm.createVacancy(data);

    await vacancyForm.expectSaved();
    await vacanciesPage.goto();
    await vacanciesPage.expectVacancyListed(data.name);
    await vacanciesPage.expectRowValues(data.name, { jobTitle: data.jobTitle, hiringManager, status: 'Active' });
  });

  test('VAC-02 deve adicionar vacancy com todos os campos e persistir os dados', async ({ vacancyForm, vacanciesPage, createdVacancies }) => {
    const data = buildVacancy({
      hiringManager: true,
      description: 'Vaga criada por teste automatizado',
      positions: 3,
      active: true,
      rss: true,
    });
    createdVacancies.push(data.name);

    await vacancyForm.createVacancy(data);
    await vacancyForm.expectSaved();

    await vacanciesPage.goto();
    await vacanciesPage.openEdit(data.name);
    await vacancyForm.expectOnEditPage();
    await vacancyForm.expectValues({
      name: data.name,
      description: data.description,
      positions: data.positions,
      active: true,
      rss: true,
    });
  });

  test('VAC-03 deve criar vacancy fechada ao desmarcar "Active"', async ({ vacancyForm, vacanciesPage, createdVacancies }) => {
    const data = buildVacancy({ hiringManager: true, active: false });
    createdVacancies.push(data.name);

    await vacancyForm.createVacancy(data);
    await vacancyForm.expectSaved();

    await vacanciesPage.goto();
    await vacanciesPage.expectRowStatus(data.name, 'Closed');
  });

  test('VAC-04 deve exigir todos os campos obrigatórios ao salvar vazio', async ({ vacancyForm }) => {
    await vacancyForm.save();

    await vacancyForm.expectFieldError('Vacancy Name', messages.required);
    await vacancyForm.expectFieldError('Job Title', messages.required);
    await vacancyForm.expectFieldError('Hiring Manager', messages.required);
    await vacancyForm.expectNotSaved();
  });

  // Tabela de decisão D2, D3, D4 / PCE I1, I4, I5 (data-driven)
  const missingField = [
    { id: 'VAC-05', label: 'Vacancy Name', fill: { jobTitle: JOB_TITLE, hiringManager: true } },
    { id: 'VAC-06', label: 'Job Title', fill: { name: 'will-be-replaced', hiringManager: true } },
    { id: 'VAC-07', label: 'Hiring Manager', fill: { name: 'will-be-replaced', jobTitle: JOB_TITLE } },
  ];

  for (const { id, label, fill } of missingField) {
    test(`${id} deve exigir "${label}" quando não informado`, async ({ vacancyForm }) => {
      const data = { ...fill };
      if ('name' in data) data.name = uniqueName();

      await vacancyForm.fillForm(data);
      await vacancyForm.save();

      await vacancyForm.expectFieldError(label, messages.required);
      await vacancyForm.expectNotSaved();
    });
  }

  test('VAC-08 deve aceitar nome com 50 caracteres (limite superior)', async ({ vacancyForm, vacanciesPage, createdVacancies }) => {
    const name = uniqueName(50);
    expect(name).toHaveLength(50);
    createdVacancies.push(name);

    await vacancyForm.createVacancy({ name, jobTitle: JOB_TITLE, hiringManager: true });

    await vacancyForm.expectSaved();
    await vacanciesPage.goto();
    await vacanciesPage.expectVacancyListed(name);
  });

  test('VAC-09 deve rejeitar nome com 51 caracteres (acima do limite)', async ({ vacancyForm }) => {
    const name = uniqueName(51);
    expect(name).toHaveLength(51);

    await vacancyForm.createVacancy({ name, jobTitle: JOB_TITLE, hiringManager: true });

    await vacancyForm.expectFieldError('Vacancy Name', messages.maxLength50);
    await vacancyForm.expectNotSaved();
  });

  test('VAC-10 deve rejeitar nome duplicado', async ({ vacancyForm, vacanciesPage, createdVacancies, page }) => {
    // cria a primeira vacancy e volta ao formulário de adição
    const existing = await createVacancy({ vacanciesPage, vacancyForm, createdVacancies });
    await vacanciesPage.clickAdd();

    await vacancyForm.createVacancy({ name: existing.name, jobTitle: JOB_TITLE, hiringManager: true });

    await vacancyForm.expectFieldError('Vacancy Name', messages.alreadyExists);
    await expect(page).not.toHaveURL(/addJobVacancy\/\d+/);
  });

  test('VAC-11 deve cancelar a adição sem criar a vacancy', async ({ vacancyForm, vacanciesPage }) => {
    const name = uniqueName();
    await vacancyForm.fillForm({ name, jobTitle: JOB_TITLE, hiringManager: true });

    await vacancyForm.cancel();

    await vacanciesPage.goto();
    await vacanciesPage.expectVacancyNotListed(name);
  });
});

test.describe('Recruitment > Vacancies — Edição', () => {
  test('VAC-12 deve editar nome e descrição', async ({ loggedIn, vacanciesPage, vacancyForm, createdVacancies }) => {
    const original = await createVacancy({ vacanciesPage, vacancyForm, createdVacancies });
    const newName = uniqueName(30, 'AutoVacEdit-');
    createdVacancies.push(newName);

    await vacanciesPage.openEdit(original.name);
    await vacancyForm.expectOnEditPage();
    await vacancyForm.fillForm({ name: newName, description: 'Descrição editada' });
    await vacancyForm.saveAndWait();

    await vacancyForm.expectSaved();
    await vacanciesPage.goto();
    await vacanciesPage.expectVacancyListed(newName);
    await vacanciesPage.expectVacancyNotListed(original.name);
  });

  test('VAC-13 deve fechar a vacancy ao desmarcar "Active"', async ({ loggedIn, vacanciesPage, vacancyForm, createdVacancies }) => {
    const data = await createVacancy({ vacanciesPage, vacancyForm, createdVacancies });
    await vacanciesPage.expectRowStatus(data.name, 'Active');

    await vacanciesPage.openEdit(data.name);
    await vacancyForm.fillForm({ active: false });
    await vacancyForm.saveAndWait();

    await vacancyForm.expectSaved();
    await vacanciesPage.goto();
    await vacanciesPage.expectRowStatus(data.name, 'Closed');
  });

  test('VAC-14 deve exigir o nome ao editar com campo vazio', async ({ loggedIn, vacanciesPage, vacancyForm, createdVacancies }) => {
    const data = await createVacancy({ vacanciesPage, vacancyForm, createdVacancies });

    await vacanciesPage.openEdit(data.name);
    await vacancyForm.expectOnEditPage();
    await vacancyForm.clearName();
    await vacancyForm.save();

    await vacancyForm.expectFieldError('Vacancy Name', messages.required);
    // a alteração não foi gravada
    await vacanciesPage.goto();
    await vacanciesPage.expectVacancyListed(data.name);
  });
});

test.describe('Recruitment > Vacancies — Pesquisa', () => {
  test('VAC-15 deve pesquisar por nome da vacancy', async ({ loggedIn, vacanciesPage, vacancyForm, createdVacancies }) => {
    const data = await createVacancy({ vacanciesPage, vacancyForm, createdVacancies });

    await vacanciesPage.search({ vacancy: data.name });

    await vacanciesPage.expectRecordCount(1);
    await vacanciesPage.expectVacancyListed(data.name);
  });

  test('VAC-16 deve pesquisar por Job Title', async ({ loggedIn, vacanciesPage, vacancyForm, createdVacancies }) => {
    const data = await createVacancy({ vacanciesPage, vacancyForm, createdVacancies });

    await vacanciesPage.search({ jobTitle: data.jobTitle });

    await vacanciesPage.expectVacancyListed(data.name);
    await vacanciesPage.expectAllRowsHave('Job Title', data.jobTitle);
  });

  test('VAC-17 deve pesquisar por Hiring Manager', async ({ loggedIn, vacanciesPage, vacancyForm, createdVacancies }) => {
    const data = await createVacancy({ vacanciesPage, vacancyForm, createdVacancies });

    await vacanciesPage.search({ hiringManager: data.hiringManager });

    await vacanciesPage.expectVacancyListed(data.name);
    await vacanciesPage.expectAllRowsHave('Hiring Manager', data.hiringManager);
  });

  test('VAC-18 deve pesquisar por Status = Closed', async ({ loggedIn, vacanciesPage, vacancyForm, createdVacancies }) => {
    const data = await createVacancy({ vacanciesPage, vacancyForm, createdVacancies, active: false });

    await vacanciesPage.search({ status: 'Closed' });

    await vacanciesPage.expectVacancyListed(data.name);
    await vacanciesPage.expectAllRowsHave('Status', 'Closed');
  });

  test('VAC-19 deve combinar filtros (Job Title + Vacancy)', async ({ loggedIn, vacanciesPage, vacancyForm, createdVacancies }) => {
    const data = await createVacancy({ vacanciesPage, vacancyForm, createdVacancies });

    await vacanciesPage.search({ jobTitle: data.jobTitle, vacancy: data.name });

    await vacanciesPage.expectRecordCount(1);
    await vacanciesPage.expectVacancyListed(data.name);
  });

  test('VAC-20 deve limpar os filtros com Reset', async ({ loggedIn, vacanciesPage, vacancyForm, createdVacancies }) => {
    const data = await createVacancy({ vacanciesPage, vacancyForm, createdVacancies, jobTitle: OTHER_JOB_TITLE });
    await vacanciesPage.search({ vacancy: data.name });
    await vacanciesPage.expectRecordCount(1);

    await vacanciesPage.reset();

    await vacanciesPage.expectFiltersCleared();
    await expect(vacanciesPage.rows.nth(1)).toBeVisible(); // lista deixou de estar filtrada
  });
});

test.describe('Recruitment > Vacancies — Deleção', () => {
  test('VAC-21 deve deletar a vacancy ao confirmar', async ({ loggedIn, vacanciesPage, vacancyForm, createdVacancies }) => {
    const data = await createVacancy({ vacanciesPage, vacancyForm, createdVacancies });

    await vacanciesPage.deleteVacancy(data.name);

    await vacanciesPage.expectVacancyNotListed(data.name);
  });

  test('VAC-22 deve manter a vacancy ao cancelar a deleção', async ({ loggedIn, vacanciesPage, vacancyForm, createdVacancies }) => {
    const data = await createVacancy({ vacanciesPage, vacancyForm, createdVacancies });

    await vacanciesPage.clickDelete(data.name);
    await vacanciesPage.cancelDeleteButton.click();

    await vacanciesPage.expectDeleteDialogClosed();
    await vacanciesPage.expectVacancyListed(data.name);
  });

  test('VAC-23 não deve oferecer a vacancy deletada no filtro "Vacancy"', async ({ loggedIn, vacanciesPage, vacancyForm, createdVacancies }) => {
    const data = await createVacancy({ vacanciesPage, vacancyForm, createdVacancies });
    expect(await vacanciesPage.vacancyFilterHasOption(data.name)).toBe(true);

    await vacanciesPage.deleteVacancy(data.name);
    await vacanciesPage.goto();

    expect(await vacanciesPage.vacancyFilterHasOption(data.name)).toBe(false);
  });
});
