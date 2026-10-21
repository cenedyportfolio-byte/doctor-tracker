/**
 * Index-backed prefix search.
 *
 * Every searchable document stores a `searchKeywords` array of normalised tokens taken from
 * its searchable fields (name, email, hospital, phone digits, ...). The array has a multikey
 * index. A search for "joh smi" becomes
 *
 *   { searchKeywords: { $all: [/^joh/, /^smi/] } }
 *
 * Anchored, case-sensitive regexes on a lowercase field can be turned into tight index bounds
 * (["joh", "joi")), so a search never has to scan the collection the way an unanchored or
 * case-insensitive `$regex` would, and it still matches partial words, unlike `$text`.
 */

const MAX_TERMS = 5;
const MAX_TERM_LENGTH = 40;
// A one-letter prefix matches most keywords, so the index can't narrow anything; skip it.
const MIN_TERM_LENGTH = 2;

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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

    // Keep full emails and digit-only phone numbers searchable as single tokens too.
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

/** Builds the Mongo filter fragment for a free-text search, or `undefined` for empty input. */
export function buildSearchFilter(search: string | undefined) {
  if (!search) return undefined;

  const normalized = normalize(search);
  const terms = new Set<string>();

  // A full email is matched as one token; everything else is split into words.
  if (normalized.includes('@')) terms.add(normalized);
  else for (const term of tokenize(search)) terms.add(term);

  const regexes = [...terms]
    .filter((term) => term.length >= MIN_TERM_LENGTH)
    .slice(0, MAX_TERMS)
    .map((term) => new RegExp(`^${escapeRegex(term.slice(0, MAX_TERM_LENGTH))}`));

  if (regexes.length === 0) return undefined;
  return { searchKeywords: { $all: regexes } };
}
