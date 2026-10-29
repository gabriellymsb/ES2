const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const messages = require('../data/messages');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.path = '/web/index.php/auth/login';

    // locators
    this.title = page.getByRole('heading', { name: 'Login' });
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.forgotPasswordLink = page.getByText('Forgot your password?');
    this.alert = page.locator('.oxd-alert-content-text');
    this.fieldErrors = page.locator('.oxd-input-field-error-message');

    // área logada
    this.dashboardHeading = page.getByRole('heading', { name: 'Dashboard' });
    this.userMenu = page.locator('.oxd-userdropdown-tab');
    this.logoutItem = page.getByRole('menuitem', { name: 'Logout' });
    this.sideMenu = page.getByRole('navigation', { name: 'Sidepanel' });
  }

  async goto() {
    await this.page.goto(this.path);
    await expect(this.loginButton).toBeVisible();
  }

  async fill(username, password) {
    if (username !== undefined) await this.usernameInput.fill(username);
    if (password !== undefined) await this.passwordInput.fill(password);
  }

  async login(username, password) {
    await this.fill(username, password);
    await this.loginButton.click();
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutItem.click();
  }

  // ---- asserções ----
  async expectLoginSuccessful() {
    await expect(this.page).toHaveURL(/\/dashboard\/index/);
    await expect(this.dashboardHeading).toBeVisible();
    await expect(this.sideMenu).toBeVisible();
    await expect(this.userMenu).toBeVisible();
  }

  async expectInvalidCredentials() {
    await expect(this.alert).toHaveText(messages.invalidCredentials);
    await this.expectOnLoginPage();
  }

  /** @param {number} count quantidade de campos obrigatórios sinalizados */
  async expectRequiredErrors(count) {
    await expect(this.fieldErrors).toHaveCount(count);
    await expect(this.fieldErrors.first()).toHaveText(messages.required);
    await this.expectOnLoginPage();
  }

  /** Erro "Required" em um campo específico: 'Username' ou 'Password'. */
  async expectRequiredOn(label) {
    await expect(this.fieldError(label)).toHaveText(messages.required);
  }

  async expectOnLoginPage() {
    await expect(this.page).toHaveURL(/\/auth\/login/);
    await expect(this.loginButton).toBeVisible();
  }

  async expectPasswordMasked() {
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }
}

module.exports = { LoginPage };
