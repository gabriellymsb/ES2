const base = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { VacanciesPage } = require('../pages/VacanciesPage');
const { VacancyFormPage } = require('../pages/VacancyFormPage');
const { admin } = require('../data/users');

/**
 * Fixtures com os Page Objects, sessão autenticada e limpeza automática
 * das vacancies criadas pelo teste.
 */
const test = base.test.extend({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  vacanciesPage: async ({ page }, use) => use(new VacanciesPage(page)),
  vacancyForm: async ({ page }, use) => use(new VacancyFormPage(page)),

  /** Faz login como Admin antes do teste (use quando precisar de sessão). */
  loggedIn: async ({ loginPage }, use) => {
    await loginPage.goto();
    await loginPage.login(admin.username, admin.password);
    await loginPage.expectLoginSuccessful();
    await use();
  },

  /**
   * Lista onde o teste registra os nomes de vacancies que criou/renomeou.
   * Ao final (mesmo se o teste falhar) elas são removidas do sistema.
   */
  createdVacancies: async ({ loggedIn, vacanciesPage }, use) => {
    const names = [];
    await use(names);
    for (const name of names) {
      try {
        await vacanciesPage.deleteIfExists(name);
      } catch (error) {
        console.warn(`Não foi possível limpar a vacancy "${name}": ${error.message}`);
      }
    }
  },
});

module.exports = { test, expect: base.expect };
