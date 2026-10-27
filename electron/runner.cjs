const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const running = new Map();

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
    const compiled = await capture(spawn('clang++', ['-std=c++17', '-O2', '-Wall', '-Wextra', source, '-o', binary], { shell: false, cwd: directory }), 15000, sessionId);
    if (compiled.code !== 0) return { phase: 'compile', ...compiled, elapsedMs: Number(process.hrtime.bigint() - started) / 1e6 };
    const child = spawn(binary, [], { shell: false, cwd: directory, stdio: ['pipe','pipe','pipe'] });
    child.stdin.end(String(input).slice(0, 100000));
    const result = await capture(child, 5000, sessionId);
    return { phase: 'run', ...result, elapsedMs: Number(process.hrtime.bigint() - started) / 1e6 };
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

function cancelRun(sessionId) { const child = running.get(sessionId); if (!child) return false; child.kill('SIGKILL'); return true; }
module.exports = { compileAndRun, cancelRun };
