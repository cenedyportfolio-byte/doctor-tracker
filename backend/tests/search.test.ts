import { describe, expect, it } from 'vitest';
import { buildSearchFilter, buildSearchKeywords } from '../src/lib/search.js';

describe('buildSearchKeywords', () => {
  it('tokenizes, lowercases and strips accents', () => {
    const keywords = buildSearchKeywords('José Álvarez', 'Cardiology');
    expect(keywords).toEqual(expect.arrayContaining(['jose', 'alvarez', 'cardiology']));
  });

  it('keeps full emails and digit-only phone numbers as tokens', () => {
    const keywords = buildSearchKeywords('a.b@example.com', '+1 (555) 123-4567');
    expect(keywords).toContain('a.b@example.com');
    expect(keywords).toContain('15551234567');
    expect(keywords).toEqual(expect.arrayContaining(['a', 'b', 'example', 'com']));
  });

  it('ignores empty values and de-duplicates', () => {
    expect(buildSearchKeywords('Anna Anna', undefined, null, '')).toEqual(['anna']);
  });
});

describe('buildSearchFilter', () => {
  it('returns undefined for blank input', () => {
    expect(buildSearchFilter(undefined)).toBeUndefined();
    expect(buildSearchFilter('   ')).toBeUndefined();
    expect(buildSearchFilter('!!!')).toBeUndefined();
  });

  it('builds anchored prefix regexes per term', () => {
    const filter = buildSearchFilter('Jo SMI');
    expect(filter?.searchKeywords.$all.map(String)).toEqual(['/^jo/', '/^smi/']);
  });

  it('treats an email as a single, escaped term', () => {
    const filter = buildSearchFilter('a.b+c@example.com');
    const [regex] = filter!.searchKeywords.$all;
    expect(regex!.test('a.b+c@example.com')).toBe(true);
    expect(regex!.test('aXb+c@example.com')).toBe(false);
  });

  it('caps the number of terms', () => {
    const filter = buildSearchFilter('a b c d e f g h');
    expect(filter?.searchKeywords.$all).toHaveLength(5);
  });
});
