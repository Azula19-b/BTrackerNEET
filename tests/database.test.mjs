import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createDatabase } = require('../electron/database.cjs');
const catalog = require('../data/neetcode150.json');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let repository;
beforeEach(() => { repository = createDatabase(':memory:', catalog); });
afterEach(() => repository.close());

describe('database initialization', () => {
  it('seeds built-ins without hardcoded analytics', () => {
    const analytics = repository.getAnalytics();
    expect(analytics.builtin).toBe(150);
    expect(analytics.total).toBe(150);
    expect(analytics.solved).toBe(0);
    expect(analytics.topic).toHaveLength(18);
  });
});

describe('custom problem CRUD', () => {
  const input = { title: 'My Extra Problem', url: 'https://leetcode.com/problems/example-personal', topic: 'Graphs', difficulty: 'Medium', summary: 'Find a path through my personal practice graph.', personalNotes: 'Try BFS first.', hints: ['Queue nodes'] };
  it('creates, edits, searches, and deletes a custom problem', () => {
    const added = repository.addCustomProblem(input);
    expect(added.source).toBe('custom');
    expect(repository.listProblems({ source: 'custom', search: 'Extra' })).toHaveLength(1);
    const edited = repository.updateCustomProblem(added.id, { title: 'Updated Extra Problem', hints: ['One','Two'] });
    expect(edited.title).toBe('Updated Extra Problem');
    expect(repository.deleteCustomProblem(added.id)).toBe(true);
    expect(repository.getProblem(added.id)).toBeNull();
  });

  it('rejects duplicate URLs', () => {
    repository.addCustomProblem(input);
    expect(() => repository.addCustomProblem({ ...input, title: 'Duplicate' })).toThrow(/already exists/);
  });
});

describe('learning workflow', () => {
  const id = catalog[0].id;
  it('keeps understanding separate from solving progress and schedules review', () => {
    const updated = repository.updateProgress(id, { understanding: 'full', solvingProgress: 'partial' });
    expect(updated.understanding).toBe('full');
    expect(updated.solving_progress).toBe('partial');
    expect(updated.next_review_date).toBeTruthy();
  });

  it('tracks progressive hints and solution views without marking solved', () => {
    const session = repository.startSession(id);
    repository.viewHint(id, 1, session.id);
    repository.viewHint(id, 2, session.id);
    repository.revealSolution(id, session.id);
    const problem = repository.getProblem(id);
    expect(problem.hints_used).toBe(2);
    expect(problem.solution_viewed).toBe(true);
    expect(problem.solving_progress).toBe('not_started');
  });

  it('autosaves one draft and preserves multiple permanent attempts', () => {
    repository.saveDraft(id, 'draft one');
    repository.saveDraft(id, 'draft two');
    repository.saveAttempt(id, 'attempt A');
    repository.saveAttempt(id, 'attempt B');
    const attempts = repository.getAttempts(id);
    expect(attempts.filter(item => item.is_draft)).toHaveLength(1);
    expect(attempts.find(item => item.is_draft).code).toBe('draft two');
    expect(attempts.filter(item => !item.is_draft)).toHaveLength(2);
  });

  it('persists personal notes for built-in problems', () => {
    repository.updateNotes(id, 'Use a set and explain the invariant.');
    expect(repository.getProblem(id).personal_notes).toContain('invariant');
  });

  it('records review completion and computes updated analytics', () => {
    repository.completeReview(id, { understanding: 'full', solvingProgress: 'solved', notes: 'Recalled independently.' });
    const analytics = repository.getAnalytics();
    expect(analytics.solved).toBe(1);
    expect(analytics.full).toBe(1);
    expect(repository.getReviews()).toHaveLength(1);
  });
});

describe('persistence and backups', () => {
  it('persists to SQLite after the repository is reopened', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'btracker-test-'));
    const file = path.join(dir, 'test.db');
    const first = createDatabase(file, catalog);
    first.updateProgress(catalog[1].id, { understanding: 'partial', solvingProgress: 'solved' });
    first.close();
    const second = createDatabase(file, catalog);
    expect(second.getProblem(catalog[1].id).solving_progress).toBe('solved');
    second.close(); fs.rmSync(dir, { recursive: true, force: true });
  });

  it('round-trips user data through JSON export and import', () => {
    repository.updateProgress(catalog[2].id, { understanding: 'full', solvingProgress: 'solved' });
    const payload = repository.exportData();
    const target = createDatabase(':memory:');
    target.importData(payload);
    expect(target.getProblem(catalog[2].id).understanding).toBe('full');
    target.close();
  });
});
