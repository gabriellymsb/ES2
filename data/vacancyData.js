const JOB_TITLE = process.env.JOB_TITLE || 'QA Engineer';
const OTHER_JOB_TITLE = process.env.OTHER_JOB_TITLE || 'Payroll Administrator';

let counter = 0;

/** Sufixo único por execução/teste/worker (o demo é compartilhado). */
function uniqueSuffix() {
  counter += 1;
  return `${Date.now().toString(36)}${process.pid}${counter}${Math.floor(Math.random() * 1000)}`;
}

/**
 * Gera um nome único com exatamente `length` caracteres (padrão: 30).
 * @param {number} [length]
 * @param {string} [prefix]
 */
function uniqueName(length = 30, prefix = 'AutoVac-') {
  const base = `${prefix}${uniqueSuffix()}`;
  if (length >= base.length) return base.padEnd(length, 'x');
  // nomes muito curtos: mantém a parte final (mais aleatória)
  return base.slice(base.length - length);
}

/** Dados mínimos válidos de uma vacancy (hiringManager é escolhido na tela). */
function buildVacancy(overrides = {}) {
  return {
    name: uniqueName(),
    jobTitle: JOB_TITLE,
    ...overrides,
  };
}

module.exports = { JOB_TITLE, OTHER_JOB_TITLE, uniqueName, buildVacancy };
