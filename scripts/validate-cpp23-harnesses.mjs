import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const catalog = JSON.parse(await fs.readFile(new URL('../data/neetcode150.json', import.meta.url), 'utf8'));
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'btracker-harness-validation-'));
const limit = Number(process.env.BTRACKER_HARNESS_LIMIT || catalog.length);

function execute(command, args, options = {}, timeout = 20000) {
  return new Promise(resolve => {
    const child = spawn(command, args, { ...options, shell: false }); let stdout = '', stderr = '', timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeout);
    child.stdout?.on('data', value => stdout += value); child.stderr?.on('data', value => stderr += value);
    child.on('error', error => { clearTimeout(timer); resolve({ code: -1, stdout, stderr: error.message, timedOut }); });
    child.on('close', code => { clearTimeout(timer); resolve({ code, stdout, stderr, timedOut }); });
  });
}

async function validate(problem) {
  if (!problem.harness) return { position: problem.position, title: problem.title, status: 'unsupported', detail: problem.harnessIssue };
  const directory = path.join(root, String(problem.position).padStart(3, '0'));
  await fs.mkdir(directory); const source = path.join(directory, 'main.cpp'), binary = path.join(directory, 'test');
  await fs.writeFile(source, problem.harness.replace('{{USER_CODE}}', problem.solutionCode));
  const compiled = await execute('clang++', ['-std=c++23','-O1','-Wall','-Wextra',source,'-o',binary], { cwd: directory }, 30000);
  if (compiled.code !== 0) return { position: problem.position, title: problem.title, status: 'compile_failed', detail: compiled.stderr.slice(0, 1200) };
  const ran = await execute(binary, [], { cwd: directory }, 10000);
  if (ran.code !== 0) return { position: problem.position, title: problem.title, status: 'tests_failed', detail: `${ran.stdout}\n${ran.stderr}`.slice(0, 1600) };
  return { position: problem.position, title: problem.title, status: 'passed', detail: ran.stdout.trim() };
}

const targets = catalog.slice(0, limit); const results = [];
for (let index = 0; index < targets.length; index += 4) {
  const batch = await Promise.all(targets.slice(index, index + 4).map(validate)); results.push(...batch);
  process.stdout.write(`\rValidated ${results.length}/${targets.length}`);
}
process.stdout.write('\n');
const summary = results.reduce((all, result) => ({ ...all, [result.status]: (all[result.status] || 0) + 1 }), {});
const report = { generatedAt: new Date().toISOString(), compiler: 'clang++ -std=c++23', summary, results };
await fs.writeFile(new URL('../data/cpp23-validation-report.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
await fs.rm(root, { recursive: true, force: true });
console.log(JSON.stringify(summary));
for (const result of results.filter(item => item.status !== 'passed' && item.status !== 'unsupported')) console.error(`\n${result.position} ${result.title}: ${result.status}\n${result.detail}`);
if (summary.compile_failed || summary.tests_failed) process.exitCode = 1;
