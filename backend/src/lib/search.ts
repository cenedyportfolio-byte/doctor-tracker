const MAX_TERMS = 5;
const MAX_TERM_LENGTH = 40;
const MIN_TERM_LENGTH = 2;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function buildSearchKeywords(...values: Array<string | null | undefined>): string[] {
  const keywords = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    for (const token of tokenize(value)) keywords.add(token);

    const normalized = normalize(value);
    if (normalized.includes('@')) keywords.add(normalized);
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 7) keywords.add(digits);
  }
  return [...keywords];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildSearchFilter(search: string | undefined) {
  if (!search) return undefined;

  const normalized = normalize(search);
  const terms = new Set<string>();

  if (normalized.includes('@')) terms.add(normalized);
  else for (const term of tokenize(search)) terms.add(term);

  const regexes = [...terms]
    .filter((term) => term.length >= MIN_TERM_LENGTH)
    .slice(0, MAX_TERMS)
    .map((term) => new RegExp(`^${escapeRegex(term.slice(0, MAX_TERM_LENGTH))}`));

  if (regexes.length === 0) return undefined;
  return { searchKeywords: { $all: regexes } };
}
