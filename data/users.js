// Credenciais públicas do demo (exibidas na tela de login).
// Podem ser sobrescritas por variáveis de ambiente.
module.exports = {
  admin: {
    username: process.env.ORANGE_USER || 'Admin',
    password: process.env.ORANGE_PASSWORD || 'admin123',
  },
};
