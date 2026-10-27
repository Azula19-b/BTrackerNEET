import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const catalog = require('../data/neetcode150.json');

describe('built-in NeetCode 150 catalog', () => {
  it('contains exactly 150 unique problems in 18 topics', () => {
    expect(catalog).toHaveLength(150);
    expect(new Set(catalog.map(item => item.id)).size).toBe(150);
    expect(new Set(catalog.map(item => item.url)).size).toBe(150);
    expect(new Set(catalog.map(item => item.topic)).size).toBe(18);
  });

  it('matches the official difficulty distribution', () => {
    const counts = catalog.reduce((all, item) => ({ ...all, [item.difficulty]: (all[item.difficulty] || 0) + 1 }), {});
    expect(counts).toEqual({ Easy: 28, Medium: 101, Hard: 21 });
  });

  it('includes required offline learning material for every record', () => {
    for (const problem of catalog) {
      expect(problem.hints).toHaveLength(3);
      expect(new Set(problem.hints).size).toBe(3);
      expect(problem.summary.length).toBeGreaterThan(60);
      expect(problem.solutionCode).toContain('#include');
      expect(problem.explanation.length).toBeGreaterThan(80);
      expect(problem.starterCode).toContain('class');
      expect(problem.cppConcepts.length).toBeGreaterThan(2);
    }
  });
});
