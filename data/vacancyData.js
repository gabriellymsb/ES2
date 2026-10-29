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

/**
 * O formulário mostra o nome completo do funcionário ("Ana Maria Silva"), mas a lista de
 * vacancies e o filtro mostram só primeiro e último nome ("Ana Silva").
 */
function listName(fullName) {
  const words = fullName.trim().split(/\s+/);
  return words.length > 2 ? `${words[0]} ${words[words.length - 1]}` : words.join(' ');
}

/** Regex que casa com o nome do funcionário, com ou sem nome do meio. */
function managerPattern(fullName) {
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const words = fullName.trim().split(/\s+/);
  const first = escape(words[0]);
  const last = escape(words[words.length - 1]);
  return words.length > 1 ? new RegExp(`^${first}(\\s.*)?\\s${last}$`) : new RegExp(`^${first}$`);
}

module.exports = { JOB_TITLE, OTHER_JOB_TITLE, uniqueName, buildVacancy, listName, managerPattern };
