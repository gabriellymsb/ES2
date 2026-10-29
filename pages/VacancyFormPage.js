const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

/** Formulário Add/Edit Vacancy. */
class VacancyFormPage extends BasePage {
  constructor(page) {
    super(page);
    this.path = '/web/index.php/recruitment/addJobVacancy';

    // locators
    this.heading = page.getByRole('heading', { name: /^(Add|Edit) Vacancy$/ });
    this.nameInput = this.group('Vacancy Name').locator('input');
    this.descriptionInput = this.group('Description').locator('textarea');
    this.hiringManagerInput = this.group('Hiring Manager').getByPlaceholder('Type for hints...');
    this.positionsInput = this.group('Number of Positions').locator('input');
    // "Active" e "Publish in RSS" são switches (input checkbox + texto). Em vez de depender
    // da classe do componente, pega o menor elemento que contém o texto e o checkbox.
    const toggle = (text) =>
      page
        .locator('div, label')
        .filter({ has: page.locator('input[type="checkbox"]'), hasText: text })
        .last();
    this.activeWrapper = toggle(/^Active$/);
    this.rssWrapper = toggle(/Publish in RSS/);
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.autocompleteOptions = page.getByRole('option').filter({ hasNotText: /Searching|No Records/ });
  }

  async gotoAdd() {
    await this.page.goto(this.path);
    await expect(this.heading).toHaveText('Add Vacancy');
    await expect(this.nameInput).toBeVisible();
  }

  /**
   * Escolhe o primeiro funcionário sugerido no autocomplete e devolve seu nome.
   * @param {string} [hint]
   */
  async selectHiringManager(hint = process.env.HIRING_MANAGER_HINT || 'a') {
    await this.hiringManagerInput.fill(hint);
    const option = this.autocompleteOptions.first();
    await option.waitFor();
    const text = (await option.innerText()).trim();
    await option.click();
    return text;
  }

  async setCheckbox(wrapper, checked) {
    const input = wrapper.locator('input[type="checkbox"]');
    if ((await input.isChecked()) !== checked) {
      // o input do switch fica visualmente oculto; click() nativo dispara o evento de mudança
      await input.evaluate((el) => el.click());
    }
    await expect(input).toBeChecked({ checked });
  }

  /**
   * Preenche apenas os campos informados.
   * @param {{name?: string, jobTitle?: string, hiringManager?: boolean|string, description?: string,
   *          positions?: string|number, active?: boolean, rss?: boolean}} data
   *   hiringManager: true = primeiro sugerido; string = dica de busca.
   * @returns {Promise<{hiringManager?: string}>}
   */
  async fillForm({ name, jobTitle, hiringManager, description, positions, active, rss }) {
    const filled = {};
    if (name !== undefined) await this.nameInput.fill(name);
    if (jobTitle) await this.selectOption('Job Title', jobTitle);
    if (hiringManager) {
      filled.hiringManager = await this.selectHiringManager(
        typeof hiringManager === 'string' ? hiringManager : undefined,
      );
    }
    if (description !== undefined) await this.descriptionInput.fill(description);
    if (positions !== undefined) await this.positionsInput.fill(String(positions));
    if (active !== undefined) await this.setCheckbox(this.activeWrapper, active);
    if (rss !== undefined) await this.setCheckbox(this.rssWrapper, rss);
    return filled;
  }

  async save() {
    await this.saveButton.click();
  }

  /**
   * Salva e espera a requisição de gravação terminar (use na edição, onde a URL não muda
   * e navegar logo em seguida poderia cancelar a gravação).
   */
  async saveAndWait() {
    const request = this.page
      .waitForResponse(
        (r) => ['POST', 'PUT'].includes(r.request().method()) && r.url().includes('/recruitment/vacancies'),
        { timeout: 20_000 },
      )
      .catch(() => null); // se o endpoint mudar, os asserts seguintes ainda validam o resultado
    await this.saveButton.click();
    await request;
  }

  async cancel() {
    await this.cancelButton.click();
  }

  /** Preenche e salva; devolve os valores efetivamente usados (inclui o manager). */
  async createVacancy(data) {
    const filled = await this.fillForm(data);
    await this.save();
    return filled;
  }

  async clearName() {
    await this.nameInput.fill('');
  }

  // ---- asserções ----
  /**
   * Após salvar, o sistema navega (página inteira) para a tela de edição da vacancy
   * (/addJobVacancy/<id>). O toast "Successfully Saved" some junto com a página antiga,
   * por isso o sinal confiável de sucesso é a URL com o id + o título "Edit Vacancy".
   */
  async expectSaved() {
    await expect(this.page).toHaveURL(/\/recruitment\/addJobVacancy\/\d+/);
    await expect(this.heading).toHaveText('Edit Vacancy');
  }

  async expectOnEditPage() {
    await expect(this.page).toHaveURL(/\/recruitment\/addJobVacancy\/\d+/);
    await expect(this.heading).toHaveText('Edit Vacancy');
    await expect(this.nameInput).not.toHaveValue('');
  }

  /** Mensagem de erro sob o campo (ex.: label 'Vacancy Name'). */
  async expectFieldError(label, message) {
    await expect(this.fieldError(label)).toHaveText(message);
  }

  async expectNotSaved() {
    await expect(this.page).not.toHaveURL(/\/recruitment\/addJobVacancy\/\d+/);
  }

  async expectValues({ name, description, positions, active, rss }) {
    if (name !== undefined) await expect(this.nameInput).toHaveValue(name);
    if (description !== undefined) await expect(this.descriptionInput).toHaveValue(description);
    if (positions !== undefined) await expect(this.positionsInput).toHaveValue(String(positions));
    if (active !== undefined) {
      expect(await this.activeWrapper.locator('input[type="checkbox"]').isChecked()).toBe(active);
    }
    if (rss !== undefined) {
      expect(await this.rssWrapper.locator('input[type="checkbox"]').isChecked()).toBe(rss);
    }
  }
}

module.exports = { VacancyFormPage };
