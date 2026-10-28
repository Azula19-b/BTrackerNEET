import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/neetcode150.json'), 'utf8'));

function clean(value = '') {
  return value
    .replace(/```\w*\n?/g, '').replace(/```/g, '')
    .replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function originalSummary(description) {
  const first = clean(description.split(/\*\*Example\s*\d*\s*:\*\*/i)[0]);
  return first
    .replace(/^You are given\b/i, 'The input provides')
    .replace(/^Given\b/i, 'The input consists of')
    .replace(/\breturn\b/i, 'produce')
    .replace(/\bDetermine\b/i, 'Find')
    .replace(/\bYou must\b/i, 'Your task is to')
    .trim();
}

function extractExamples(description) {
  const sections = description.split(/\*\*Example\s*\d*\s*:\*\*/i).slice(1);
  return sections.map(section => {
    const beforeNext = section.split(/\*\*(?:Constraints|Example\s*\d*)\s*:\*\*/i)[0];
    const input = beforeNext.match(/Input:\s*([\s\S]*?)\n\s*Output:/i)?.[1];
    const output = beforeNext.match(/Output:\s*([\s\S]*?)(?=\n\s*(?:Explanation|Input|Constraints)\s*:|\n\s*<br|\n\s*```|$)/i)?.[1];
    const explanation = beforeNext.match(/Explanation:\s*([\s\S]*?)(?=\n\s*<br|\n\s*```|$)/i)?.[1];
    return input && output ? { input: clean(input), output: clean(output), ...(explanation ? { explanation: clean(explanation) } : {}) } : null;
  }).filter(Boolean);
}

function extractConstraints(description) {
  const block = description.match(/\*\*Constraints:\*\*([\s\S]*?)(?=<br|<details|\*\*Example|$)/i)?.[1] || '';
  return block.split('\n').map(line => clean(line.replace(/^\s*[-*]\s*/, ''))).filter(line => line && !/^constraints:?$/i.test(line));
}

function extractHints(description) {
  const hints = [];
  for (let number = 1; number <= 3; number++) {
    const match = description.match(new RegExp(`<summary>Hint ${number}<\\/summary>\\s*<p>([\\s\\S]*?)<\\/p>`, 'i'));
    if (match) hints.push(clean(match[1]));
  }
  return hints;
}

function methodContract(starter) {
  const cleaned = starter.replace(/\/\*[\s\S]*?\*\//g, '');
  const classes = [...cleaned.matchAll(/class\s+(\w+)\s*\{/g)];
  const selected = classes.find(match => match[1] === 'Solution') || classes.at(-1);
  const className = selected?.[1] || 'Solution';
  const body = selected ? cleaned.slice(selected.index) : cleaned;
  const method = body.match(/public:\s*([\w:<>,*&\s]+?)\s+(\w+)\s*\(([^)]*)\)\s*\{/s);
  return method ? { className, returnType: method[1].replace(/\s+/g, ' ').trim(), functionName: method[2], parameters: method[3].replace(/\s+/g, ' ').trim() } : { className, returnType: '', functionName: '', parameters: '' };
}

function implementationHint(metadata, contract) {
  const code = metadata.solutions?.cpp || '';
  const tools = [];
  if (code.includes('unordered_set')) tools.push('unordered_set');
  if (code.includes('unordered_map')) tools.push('unordered_map');
  if (code.includes('priority_queue')) tools.push('priority_queue');
  if (code.includes('queue<')) tools.push('queue');
  if (code.includes('stack<')) tools.push('stack');
  if (code.includes('sort(')) tools.push('sort');
  if (code.includes('vector<')) tools.push('vector');
  const structure = tools.length ? ` The reference pattern can be expressed with ${tools.slice(0, 2).join(' and ')}.` : '';
  if (contract.functionName) return `In C++23, implement ${contract.functionName}(${contract.parameters}) and return ${contract.returnType}.${structure} Check empty input and pointer or index boundaries before the main update.`;
  return `Implement every public operation shown in the C++23 starter class.${structure} Preserve the class state between method calls and handle an empty structure explicitly.`;
}

const content = {};
for (const problem of catalog) {
  const slug = new URL(problem.neetcodeUrl).pathname.split('/').filter(Boolean).at(-1);
  const metadata = JSON.parse(fs.readFileSync(path.join(root, '.content-cache', `${slug}.json`), 'utf8'));
  const examples = extractExamples(metadata.description);
  const constraints = extractConstraints(metadata.description);
  if (!constraints.length && slug === 'reverse-bits') constraints.push('n is represented as an unsigned 32-bit integer.');
  const hints = extractHints(metadata.description);
  if (!examples.length) throw new Error(`${slug}: no examples parsed`);
  if (!constraints.length) throw new Error(`${slug}: no constraints parsed`);
  const starterCode = metadata.starterCode.cpp.trim();
  const contract = methodContract(starterCode);
  while (hints.length < 3) hints.push(implementationHint(metadata, contract));
  content[problem.id] = {
    officialId: slug,
    title: metadata.name.trim(),
    difficulty: metadata.difficulty,
    description: originalSummary(metadata.description),
    examples,
    constraints,
    starterCode,
    solutionCode: metadata.solutions.cpp.trim(),
    hints,
    contract,
    sampleInputs: metadata.custom_test_cases || [],
    sourceRevision: 'neetcode-public-metadata-2026-10-28',
    solutionLicense: 'MIT — https://github.com/neetcode-gh/leetcode',
  };
}

fs.writeFileSync(path.join(root, 'scripts/verified-content-source.json'), `${JSON.stringify(content, null, 2)}\n`);
console.log(`Built verified factual content for ${Object.keys(content).length} problems.`);
