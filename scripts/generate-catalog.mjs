import fs from 'node:fs';
import { solutionFor, complexityFor, conceptsFor } from './solution-library.mjs';

const source = JSON.parse(fs.readFileSync(new URL('./neetcode150-source.json', import.meta.url)));
const verified = JSON.parse(fs.readFileSync(new URL('./verified-content-source.json', import.meta.url)));

const topicGuidance = {
  'Arrays & Hashing': ['Track the information that must be retrieved quickly.', 'Choose a hash set, hash map, or indexed frequency table so each lookup is cheap.', 'In C++, prefer unordered_map or unordered_set and check before inserting when order is irrelevant.'],
  'Two Pointers': ['Look for two positions that can move without revisiting every pair.', 'Define what the left and right pointers mean, then move the one that cannot improve the answer.', 'Use size_t carefully; signed int indices are simpler when a pointer may move below zero.'],
  'Sliding Window': ['Ask whether a contiguous range can be updated one element at a time.', 'Maintain only the state for the current window; shrink from the left when it becomes invalid.', 'Keep left and right indices plus a frequency map or running aggregate.'],
  Stack: ['Look for unfinished work that should be resolved in reverse order.', 'A stack preserves the most recent unresolved item; a monotonic stack can discard dominated items.', 'Use vector as a stack when you need to inspect stored indices, or std::stack for pure LIFO behavior.'],
  'Binary Search': ['Identify a sorted order or a monotonic yes/no condition.', 'Choose a precise invariant for the half-open or closed search interval.', 'Compute mid as left + (right - left) / 2 to avoid overflow.'],
  'Linked List': ['Draw the pointer links before changing them.', 'Use a dummy node when the head may change, and consider slow/fast pointers for distance or cycles.', 'Save next pointers before rewiring nodes so the remaining list is not lost.'],
  Trees: ['State what information a subtree should return to its parent.', 'Use DFS for subtree facts and BFS for level-by-level order; treat the null base case explicitly.', 'Write a small recursive helper or use queue<TreeNode*> for breadth-first traversal.'],
  Tries: ['Think in prefixes rather than whole strings.', 'Store one edge per next character and mark nodes that end a word.', 'A fixed array<unique_ptr<Node>, 26> is fast for lowercase letters; a map supports broader alphabets.'],
  Backtracking: ['Describe one decision and how to undo it.', 'Build a partial candidate, recurse only while valid, then remove the last choice.', 'Pass the working vector by reference and push_back/pop_back around the recursive call.'],
  'Heap / Priority Queue': ['Ask whether only the current best few elements matter.', 'Use a heap so the next minimum or maximum is available without sorting everything repeatedly.', 'std::priority_queue is a max-heap; add greater<T> for a min-heap.'],
  Graphs: ['Choose the graph state and mark it before exploring neighbors.', 'Use DFS/BFS for reachability, topological order for dependencies, or union-find for components.', 'Represent sparse graphs with vector<vector<int>> and keep visited state separate.'],
  'Advanced Graphs': ['Model the input as weighted edges or ordering constraints.', 'Select Dijkstra, minimum spanning tree, Eulerian traversal, or topological sorting based on the goal.', 'Store (distance,node) pairs in a min-priority_queue and ignore stale entries.'],
  '1-D Dynamic Programming': ['Define the answer for a smaller prefix or ending position.', 'Write the recurrence first, then keep only the previous states that it reads.', 'Initialize base cases separately before the main loop.'],
  '2-D Dynamic Programming': ['Name both dimensions of the state before writing code.', 'Relate each cell to already-computed neighbors or smaller subproblems.', 'Use a vector table for clarity, then compress a dimension only after the recurrence is correct.'],
  Greedy: ['Find the local choice that leaves the most flexibility for the suffix.', 'Prove the choice with an exchange or reachability argument rather than relying on intuition.', 'Track the best boundary, count, or extreme needed by the next step.'],
  Intervals: ['Sort endpoints or start times so overlapping ranges become adjacent.', 'Maintain the active interval and decide whether to merge, replace, or emit it.', 'Store intervals as vector<vector<int>> or pair<int,int> and compare starts explicitly.'],
  'Bit Manipulation': ['Write a few values in binary and look for cancellation or per-bit independence.', 'Use XOR for paired cancellation and masks for reading or setting individual bits.', 'Prefer unsigned values for shifts and use n &= n - 1 to remove the lowest set bit.'],
  'Math & Geometry': ['Translate the operation into coordinates, digits, or modular arithmetic.', 'Handle signs, overflow, and boundary cases before optimizing the main transformation.', 'Use long long for intermediate arithmetic and update matrix layers with saved temporary values.'],
};

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function starterFor(title, solution) {
  const signature = solution.match(/class Solution\s*\{[\s\S]*?public:\s*([\s\S]*?)\{/);
  const method = signature?.[1]?.trim().replace(/\s+/g, ' ') || 'void solve()';
  return `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    ${method} {\n        // Work through the invariant before filling this in.\n    }\n};`;
}

let position = 0;
const catalog = [];
for (const [topic, problems] of Object.entries(source)) {
  for (const [title, meta] of Object.entries(problems)) {
    position += 1;
    const solution = solutionFor(title, topic);
    const guidance = topicGuidance[topic];
    const facts = verified[`nc150-${String(position).padStart(3, '0')}-${slug(title)}`];
    if (!facts) throw new Error(`Verified content is missing for ${title}`);
    catalog.push({
      id: `nc150-${String(position).padStart(3, '0')}-${slug(title)}`,
      position,
      title: facts.title,
      topic,
      difficulty: meta.difficulty,
      url: meta.url,
      neetcodeUrl: meta.nurl,
      summary: facts.description,
      examples: facts.examples,
      constraints: facts.constraints,
      starterCode: facts.starterCode,
      hints: facts.hints,
      contract: facts.contract,
      sampleInputs: facts.sampleInputs,
      solutionCode: solution,
      explanation: `${title} is a ${meta.difficulty.toLowerCase()} ${topic} exercise. The key is to represent only the state needed for the next decision. ${guidance[1]} This avoids recomputing earlier work and makes the invariant visible in the code.`,
      walkthrough: `Read the helper and main method from top to bottom. Initialization establishes the base case. Each loop or recursive call advances one valid state, and the return statement converts the maintained state into the required answer. Pay special attention to empty input and boundary indices.`,
      ...complexityFor(title, topic),
      cppConcepts: conceptsFor(topic),
    });
  }
}

fs.mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../data/neetcode150.json', import.meta.url), `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Generated ${catalog.length} problems across ${Object.keys(source).length} topics.`);
