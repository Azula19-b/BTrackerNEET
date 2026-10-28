const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const running = new Map();
const cppStandard = 'c++23';

function capture(child, timeoutMs, sessionId) {
  return new Promise(resolve => {
    let stdout = '', stderr = '', timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeoutMs);
    running.set(sessionId, child);
    child.stdout?.on('data', data => { if (stdout.length < 200000) stdout += data; });
    child.stderr?.on('data', data => { if (stderr.length < 200000) stderr += data; });
    child.on('close', code => { clearTimeout(timer); running.delete(sessionId); resolve({ code, stdout, stderr, timedOut }); });
    child.on('error', error => { clearTimeout(timer); running.delete(sessionId); resolve({ code: -1, stdout, stderr: error.message, timedOut }); });
  });
}

async function compileAndRun({ code, input = '', sessionId }) {
  if (typeof code !== 'string' || code.length > 500000) throw new Error('Invalid source code');
  if (!/\bint\s+main\s*\(/.test(code)) return { phase: 'validation', code: 1, stdout: '', stderr: 'This editor contains a LeetCode-style class without main(). A problem-specific test harness is not available. Add a standalone main() to compile and run locally.' };
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'btrackerneet-'));
  const source = path.join(directory, 'main.cpp'), binary = path.join(directory, 'program');
  fs.writeFileSync(source, code, { mode: 0o600 });
  const started = process.hrtime.bigint();
  try {
    const compiled = await capture(spawn('clang++', [`-std=${cppStandard}`, '-O2', '-Wall', '-Wextra', source, '-o', binary], { shell: false, cwd: directory }), 15000, sessionId);
    if (compiled.code === -1) compiled.stderr = `A compatible C++23 compiler was not found. Install Apple Command Line Tools with “xcode-select --install”, or make a C++23-capable clang++ available on PATH.\n\n${compiled.stderr}`;
    else if (/invalid value|unknown argument|unsupported option/i.test(compiled.stderr)) compiled.stderr = `The selected clang++ does not support -std=c++23. Install or select a newer Apple Clang compiler.\n\n${compiled.stderr}`;
    if (compiled.code !== 0) return { phase: 'compile', ...compiled, elapsedMs: Number(process.hrtime.bigint() - started) / 1e6 };
    const child = spawn(binary, [], { shell: false, cwd: directory, stdio: ['pipe','pipe','pipe'] });
    child.stdin.end(String(input).slice(0, 100000));
    const result = await capture(child, 5000, sessionId);
    return { phase: 'run', ...result, elapsedMs: Number(process.hrtime.bigint() - started) / 1e6 };
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

async function checkCompiler() {
  const sessionId = `compiler-check-${Date.now()}`;
  const version = await capture(spawn('clang++', ['--version'], { shell: false }), 5000, sessionId);
  if (version.code !== 0) return { supported: false, standard: cppStandard, error: 'clang++ was not found. Install Apple Command Line Tools with xcode-select --install.' };
  const probe = spawn('clang++', [`-std=${cppStandard}`, '-x', 'c++', '-fsyntax-only', '-'], { shell: false, stdio: ['pipe','pipe','pipe'] });
  probe.stdin.end('#include <expected>\nint main(){ std::expected<int,int> value=1; return *value-1; }\n');
  const result = await capture(probe, 10000, `${sessionId}-probe`);
  return { supported: result.code === 0, standard: cppStandard, version: version.stdout.split('\n')[0], error: result.code === 0 ? '' : `This compiler cannot compile the C++23 feature probe with -std=c++23. ${result.stderr}` };
}

function cancelRun(sessionId) { const child = running.get(sessionId); if (!child) return false; child.kill('SIGKILL'); return true; }
module.exports = { compileAndRun, cancelRun, checkCompiler };
