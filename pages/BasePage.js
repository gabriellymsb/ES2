const { expect } = require('@playwright/test');

/** Elementos e ações comuns às páginas do OrangeHRM (componentes "oxd"). */
class BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.toast = page.locator('.oxd-toast');
    this.pageTitle = page.locator('.oxd-topbar-header-breadcrumb-module');
  }

  /** Grupo de campo (label + input) pelo texto do label. */
  group(label) {
    return this.page
      .locator('.oxd-input-group')
      .filter({ has: this.page.locator('label', { hasText: label }) });
  }

  /** Mensagem de validação exibida logo abaixo do campo. */
  fieldError(label) {
    return this.group(label).locator('.oxd-input-field-error-message');
  }

  /** Seleciona uma opção em um dropdown (oxd-select) do grupo informado. */
  async selectOption(label, optionText) {
    await this.group(label).locator('.oxd-select-text').click();
    await this.page.getByRole('option', { name: optionText, exact: true }).click();
  }

  async expectToast(message) {
    await expect(this.toast.first()).toContainText(message);
  }
}

module.exports = { BasePage };
