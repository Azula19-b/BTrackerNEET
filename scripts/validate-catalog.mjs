import fs from 'node:fs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/neetcode150.json', import.meta.url)));
const required = ['id','title','topic','difficulty','url','neetcodeUrl','summary','examples','starterCode','solutionCode','hints','explanation','walkthrough','timeComplexity','spaceComplexity','cppConcepts'];
const expectedTopics = ['Arrays & Hashing','Two Pointers','Sliding Window','Stack','Binary Search','Linked List','Trees','Tries','Backtracking','Heap / Priority Queue','Graphs','Advanced Graphs','1-D Dynamic Programming','2-D Dynamic Programming','Greedy','Intervals','Bit Manipulation','Math & Geometry'];
const errors = [];
if (catalog.length !== 150) errors.push(`Expected 150 records; found ${catalog.length}`);
for (const key of required) for (const item of catalog) if (item[key] === undefined || item[key] === '') errors.push(`${item.id || 'unknown'} missing ${key}`);
for (const item of catalog) {
  if (!/^https:\/\//.test(item.url) || !/^https:\/\//.test(item.neetcodeUrl)) errors.push(`${item.id} has an invalid URL`);
  if (!Array.isArray(item.hints) || item.hints.length !== 3 || new Set(item.hints).size !== 3) errors.push(`${item.id} needs three distinct hints`);
  if (!item.solutionCode.includes('#include') || !/class (Solution|Trie|WordDictionary|MedianFinder|Codec|Twitter|TimeMap|LRUCache|DetectSquares)/.test(item.solutionCode)) errors.push(`${item.id} solution is incomplete`);
}
for (const field of ['id','title','url']) if (new Set(catalog.map(x => x[field])).size !== 150) errors.push(`${field} values are not unique`);
const topics = [...new Set(catalog.map(x => x.topic))];
if (topics.length !== 18 || expectedTopics.some(x => !topics.includes(x))) errors.push('Topic collection does not match the official 18 topics');
const distribution = Object.fromEntries(['Easy','Medium','Hard'].map(level => [level, catalog.filter(x => x.difficulty === level).length]));
if (distribution.Easy !== 28 || distribution.Medium !== 101 || distribution.Hard !== 21) errors.push(`Wrong difficulty distribution: ${JSON.stringify(distribution)}`);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Validated 150 unique problems, 18 topics, and distribution ${JSON.stringify(distribution)}.`);
