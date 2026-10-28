import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const catalog = require('../data/neetcode150.json');
const { parseTestOutput, runProblemTests } = require('../electron/runner.cjs');

describe('C++23 problem runner', () => {
  it('parses structured per-case output', () => {
    expect(parseTestOutput('__BT_CASE__|1|PASS|true|true\n__BT_SUMMARY__|1|1\n')).toEqual({
      cases: [{ number: 1, passed: true, actual: 'true', expected: 'true' }],
      passed: 1,
      total: 1,
      allPassed: true,
    });
  });

  it('compiles and passes the reference solution through its problem harness', async () => {
    const problem = catalog[0];
    const result = await runProblemTests({
      code: problem.solutionCode,
      harness: problem.harness,
      sessionId: 'runner-test',
    });
    expect(result.phase).toBe('run');
    expect(result.testResults.allPassed).toBe(true);
    expect(result.testResults.total).toBeGreaterThan(0);
  }, 20000);
});
