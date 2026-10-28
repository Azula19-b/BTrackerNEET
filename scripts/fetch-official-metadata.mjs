import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(await fs.readFile(path.join(root, 'data/neetcode150.json'), 'utf8'));
const cacheDir = path.join(root, '.content-cache');
await fs.mkdir(cacheDir, { recursive: true });

async function fetchOne(problem, attempt = 1) {
  const slug = new URL(problem.neetcodeUrl).pathname.split('/').filter(Boolean).at(-1);
  const target = path.join(cacheDir, `${slug}.json`);
  try {
    const existing = JSON.parse(await fs.readFile(target, 'utf8'));
    if (existing.id === slug && existing.starterCode?.cpp) return { slug, cached: true };
  } catch {}
  const response = await fetch('https://us-central1-neetcode-dd170.cloudfunctions.net/getProblemMetadataFunctionHttp', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: { problemId: slug } }),
  });
  if (!response.ok) {
    if (attempt < 4) { await new Promise(resolve => setTimeout(resolve, 500 * attempt)); return fetchOne(problem, attempt + 1); }
    throw new Error(`${slug}: HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (!payload.data?.starterCode?.cpp) throw new Error(`${slug}: C++ starter code missing`);
  await fs.writeFile(target, `${JSON.stringify(payload.data, null, 2)}\n`);
  return { slug, cached: false };
}

let completed = 0;
for (let index = 0; index < catalog.length; index += 6) {
  const batch = await Promise.all(catalog.slice(index, index + 6).map(problem => fetchOne(problem)));
  completed += batch.length;
  console.log(`${completed}/150 metadata records ready`);
}
