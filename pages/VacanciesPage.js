const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const messages = require('../data/messages');

/** Lista / pesquisa / deleção de vacancies (Recruitment > Vacancies). */
class VacanciesPage extends BasePage {
  constructor(page) {
    super(page);
    this.path = '/web/index.php/recruitment/viewJobVacancy';

    // locators
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.resetButton = page.getByRole('button', { name: 'Reset' });
    this.rows = page.locator('.oxd-table-card');
    this.recordsInfo = page.getByText(/\(\d+\) Records? Found|No Records Found/).first();
    this.deleteDialog = page.locator('.oxd-dialog-container-default');
    this.confirmDeleteButton = this.deleteDialog.getByRole('button', { name: 'Yes, Delete' });
    this.cancelDeleteButton = this.deleteDialog.getByRole('button', { name: 'No, Cancel' });
    this.options = page.getByRole('option');
  }

  async goto() {
    await this.page.goto(this.path);
    await expect(this.addButton).toBeVisible();
    await expect(this.recordsInfo).toBeVisible();
  }

  async clickAdd() {
    await this.addButton.click();
  }

  // ---- linhas ----
  row(name) {
    return this.rows.filter({ hasText: name });
  }

  async openEdit(name) {
    await this.row(name).locator('button').filter({ has: this.page.locator('i.bi-pencil-fill') }).click();
  }

  async clickDelete(name) {
    await this.row(name).locator('button').filter({ has: this.page.locator('i.bi-trash') }).click();
  }

  // ---- pesquisa ----
  /**
   * Aplica filtros (todos opcionais) e clica em Search.
   * @param {{jobTitle?: string, vacancy?: string, hiringManager?: string, status?: string}} filters
   */
  async search({ jobTitle, vacancy, hiringManager, status } = {}) {
    if (jobTitle) await this.selectOption('Job Title', jobTitle);
    if (vacancy) await this.selectOption('Vacancy', vacancy);
    if (hiringManager) await this.selectOption('Hiring Manager', hiringManager);
    if (status) await this.selectOption('Status', status);
    await this.searchButton.click();
    await expect(this.recordsInfo).toBeVisible();
  }

  async reset() {
    await this.resetButton.click();
    await expect(this.recordsInfo).toBeVisible();
  }

  /** Verifica se o nome é oferecido como opção no filtro "Vacancy". */
  async vacancyFilterHasOption(name) {
    await this.group('Vacancy').locator('.oxd-select-text').click();
    const count = await this.page.getByRole('option', { name, exact: true }).count();
    await this.page.keyboard.press('Escape');
    return count > 0;
  }

  // ---- deleção ----
  async deleteVacancy(name) {
    await this.clickDelete(name);
    await expect(this.deleteDialog).toBeVisible();
    await this.confirmDeleteButton.click();
    await this.expectToast(messages.deleted);
  }

  /** Limpeza silenciosa: remove a vacancy se ela existir. */
  async deleteIfExists(name) {
    await this.goto();
    if (!(await this.vacancyFilterHasOption(name))) return;
    await this.search({ vacancy: name });
    if ((await this.row(name).count()) > 0) await this.deleteVacancy(name);
  }

  // ---- asserções ----
  async expectVacancyListed(name) {
    await expect(this.row(name)).toHaveCount(1);
  }

  async expectVacancyNotListed(name) {
    await expect(this.row(name)).toHaveCount(0);
  }

  async expectRecordCount(count) {
    await expect(this.rows).toHaveCount(count);
  }

  /** Posição da coluna pelo texto do cabeçalho (layout de tabela, viewport desktop). */
  async columnIndex(header) {
    const headers = (await this.page.locator('.oxd-table-header-cell').allInnerTexts()).map((t) => t.trim());
    const index = headers.indexOf(header);
    expect(index, `coluna "${header}" não encontrada em [${headers.join(', ')}]`).toBeGreaterThanOrEqual(0);
    return index;
  }

  /** Todas as linhas exibem `value` na coluna `header` (ex.: 'Job Title', 'Status'). */
  async expectAllRowsHave(header, value) {
    const index = await this.columnIndex(header);
    const total = await this.rows.count();
    expect(total).toBeGreaterThan(0);
    for (let i = 0; i < total; i++) {
      await expect(this.rows.nth(i).locator('.oxd-table-cell').nth(index)).toContainText(value);
    }
  }

  async expectRowStatus(name, status) {
    await expect(this.row(name)).toContainText(status);
  }

  async expectRowValues(name, { jobTitle, hiringManager, status }) {
    const row = this.row(name);
    if (jobTitle) await expect(row).toContainText(jobTitle);
    if (hiringManager) await expect(row).toContainText(hiringManager);
    if (status) await expect(row).toContainText(status);
  }

  async expectFiltersCleared() {
    for (const label of ['Job Title', 'Vacancy', 'Hiring Manager', 'Status']) {
      await expect(this.group(label).locator('.oxd-select-text-input')).toHaveText('-- Select --');
    }
  }

  async expectDeleteDialogClosed() {
    await expect(this.deleteDialog).toBeHidden();
  }
}

module.exports = { VacanciesPage };
