const { test, expect } = require('../fixtures');
const { admin } = require('../data/users');

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('LOG-01 deve logar com credenciais válidas', async ({ loginPage }) => {
    await loginPage.login(admin.username, admin.password);

    await loginPage.expectLoginSuccessful();
  });

  // Tabela de decisão R5, R6, R7 / PCE I1, I4 (data-driven: só mudam os dados)
  const invalidCredentials = [
    { id: 'LOG-02', title: 'usuário inexistente', username: 'usuario.inexistente', password: admin.password },
    { id: 'LOG-03', title: 'senha incorreta', username: admin.username, password: 'senhaErrada123' },
    { id: 'LOG-04', title: 'usuário e senha incorretos', username: 'usuario.inexistente', password: 'senhaErrada123' },
    { id: 'LOG-08', title: 'senha com caixa alterada (case-sensitive)', username: admin.username, password: admin.password.toUpperCase() },
    { id: 'LOG-09', title: "injeção de SQL (' OR '1'='1)", username: "' OR '1'='1", password: "' OR '1'='1" },
  ];

  for (const data of invalidCredentials) {
    test(`${data.id} deve negar acesso com ${data.title}`, async ({ loginPage }) => {
      await loginPage.login(data.username, data.password);

      await loginPage.expectInvalidCredentials();
    });
  }

  // Tabela de decisão R1, R2, R3 / AVL (0 caracteres)
  test('LOG-05 deve exigir o usuário quando vazio', async ({ loginPage }) => {
    await loginPage.login('', admin.password);

    await loginPage.expectRequiredErrors(1);
    await loginPage.expectRequiredOn('Username');
  });

  test('LOG-06 deve exigir a senha quando vazia', async ({ loginPage }) => {
    await loginPage.login(admin.username, '');

    await loginPage.expectRequiredErrors(1);
    await loginPage.expectRequiredOn('Password');
  });

  test('LOG-07 deve exigir usuário e senha quando ambos vazios', async ({ loginPage }) => {
    await loginPage.login('', '');

    await loginPage.expectRequiredErrors(2);
    await loginPage.expectRequiredOn('Username');
    await loginPage.expectRequiredOn('Password');
  });

  test('LOG-10 deve mascarar o campo de senha', async ({ loginPage }) => {
    await loginPage.expectPasswordMasked();
  });

  test('LOG-12 deve redirecionar ao login ao acessar página protegida sem sessão', async ({ page, loginPage }) => {
    await page.goto('/web/index.php/dashboard/index');

    await loginPage.expectOnLoginPage();
  });

  test('LOG-13 deve abrir a tela de recuperação de senha', async ({ page, loginPage }) => {
    await loginPage.forgotPasswordLink.click();

    await expect(page).toHaveURL(/requestPasswordResetCode/);
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
  });
});

test.describe('Logout', () => {
  test('LOG-11 deve voltar ao login após o logout', async ({ loggedIn, loginPage }) => {
    await loginPage.logout();

    await loginPage.expectOnLoginPage();
  });
});
