const orderInsensitiveOuter = new Set([4, 5, 12, 62, 67, 68, 69, 70, 71, 72, 74, 75, 76, 79, 85]);
const orderInsensitiveInner = new Set([4, 12, 67, 68, 69, 71]);

// NeetCode's executable custom cases do not always use the same inputs as the
// prose examples. These expected values are for the custom cases specifically.
const customExpected = new Map([
  [15, [5, 0]],
  [23, [9]],
  [45, [[4, 7, 2, 9, 6, 3, 1], [2, 3, 1], []]],
  [54, [3, 3]],
  [105, [2, 3, 0]],
  [115, [0]],
  [145, [3, 30]],
]);

const standardIncludes = `#include <algorithm>
#include <array>
#include <bitset>
#include <cmath>
#include <cstdint>
#include <climits>
#include <deque>
#include <functional>
#include <iomanip>
#include <iostream>
#include <limits>
#include <map>
#include <numeric>
#include <optional>
#include <queue>
#include <set>
#include <sstream>
#include <stack>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>`;

function splitTopLevel(value, delimiter = ',') {
  const parts = []; let start = 0, angle = 0, square = 0, round = 0, quoted = false;
  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    if (char === '"' && value[index - 1] !== '\\') quoted = !quoted;
    if (quoted) continue;
    if (char === '<') angle++; if (char === '>') angle--; if (char === '[') square++; if (char === ']') square--; if (char === '(') round++; if (char === ')') round--;
    if (char === delimiter && !angle && !square && !round) { parts.push(value.slice(start, index).trim()); start = index + 1; }
  }
  parts.push(value.slice(start).trim()); return parts.filter(Boolean);
}

function parseParameters(parameters) {
  return splitTopLevel(parameters).map(declaration => {
    const match = declaration.match(/([A-Za-z_]\w*)\s*$/); if (!match) throw new Error(`Cannot parse parameter: ${declaration}`);
    return { name: match[1], type: declaration.slice(0, match.index).replace(/\s*&\s*/g, '&').trim() };
  });
}

function parseAssignments(raw) {
  const values = {};
  for (const line of raw.split('\n')) {
    const equal = line.indexOf('='); if (equal < 1) continue;
    const name = line.slice(0, equal).trim(); let source = line.slice(equal + 1).trim();
    if (/^\[\(.*\)\]$/.test(source)) source = source.replace(/\(/g, '[').replace(/\)/g, ']');
    if (source === '00000000000000000000000000010101') values[name] = 21;
    else { try { values[name] = JSON.parse(source); } catch { if (source.endsWith(']]]')) values[name] = JSON.parse(source.slice(0, -1)); else throw new Error(`Cannot parse ${name}=${source}`); } }
  }
  return values;
}

function parseExpected(raw) {
  let source = raw.trim();
  if (/^\d+\s*\([01]+\)$/.test(source)) source = source.match(/^\d+/)[0];
  return JSON.parse(source.replace(/'/g, '"'));
}

function baseType(type) { return type.replace(/\bconst\b/g, '').replace(/[&\s]/g, ''); }
function innerType(type) { const cleanType = baseType(type); return cleanType.slice(cleanType.indexOf('<') + 1, -1); }
function quoteString(value) { return JSON.stringify(String(value)).replace(/\\u2028|\\u2029/g, ''); }

function literal(value, type, context = {}) {
  const cleanType = baseType(type);
  if (cleanType === 'string') return quoteString(value);
  if (cleanType === 'char') return `'${String(value).replace(/'/g, "\\'")}'`;
  if (cleanType === 'bool') return value ? 'true' : 'false';
  if (['int','long','longlong','double','float','uint32_t'].includes(cleanType)) return String(value);
  if (cleanType === 'ListNode*') return `btBuildList(${literal(value, 'vector<int>')})`;
  if (cleanType === 'TreeNode*') {
    if (!Array.isArray(value)) return `btFindTreeNode(${context.rootName || 'root'}, ${value})`;
    return `btBuildTree(${literal(value, 'vector<optional<int>>')})`;
  }
  if (cleanType === 'Node*') return context.nodeKind === 'random' ? `btBuildRandomList(${literal(value, 'vector<vector<optional<int>>>')})` : `btBuildGraph(${literal(value, 'vector<vector<int>>')})`;
  if (cleanType === 'Interval') return `Interval(${value[0]}, ${value[1]})`;
  if (cleanType === 'optional<int>') return value === null ? 'nullopt' : String(value);
  if (cleanType.startsWith('vector<')) {
    const child = innerType(cleanType);
    if (cleanType === 'vector<ListNode*>') return `btBuildLists(${literal(value, 'vector<vector<int>>')})`;
    return `{${(value || []).map(item => literal(item, child, context)).join(', ')}}`;
  }
  throw new Error(`Unsupported literal type: ${type}`);
}

const commonPrelude = `
template<class T> string btShow(const T& value) { if constexpr (is_same_v<T,bool>) return value ? "true" : "false"; else if constexpr (is_same_v<T,string>) return "\\\"" + value + "\\\""; else if constexpr (is_same_v<T,char>) return string(1,value); else { ostringstream out; out << value; return out.str(); } }
template<class T> string btShow(const optional<T>& value) { return value ? btShow(*value) : "null"; }
template<class T> string btShow(const vector<T>& values) { string out="["; for(size_t i=0;i<values.size();++i){if(i)out+=",";out+=btShow(values[i]);}return out+"]"; }
template<class T> bool btEqual(const T& actual,const T& expected){ if constexpr (is_floating_point_v<T>) return abs(actual-expected)<=1e-6*max(1.0,abs((double)expected)); else return actual==expected; }
template<class T> bool btEqual(const vector<T>& actual,const vector<T>& expected){return actual==expected;}
string btJsonArray(const vector<string>& values){string out="[";for(size_t i=0;i<values.size();++i){if(i)out+=",";out+=values[i];}return out+"]";}
`;

const listPrelude = `
struct ListNode { int val; ListNode* next; ListNode():val(0),next(nullptr){} ListNode(int x):val(x),next(nullptr){} ListNode(int x,ListNode*n):val(x),next(n){} };
ListNode* btBuildList(const vector<int>& values){ListNode dummy;auto*tail=&dummy;for(int x:values){tail->next=new ListNode(x);tail=tail->next;}return dummy.next;}
vector<ListNode*> btBuildLists(const vector<vector<int>>& lists){vector<ListNode*> out;for(auto&v:lists)out.push_back(btBuildList(v));return out;}
vector<int> btListValues(ListNode* node){vector<int> out;unordered_set<ListNode*>seen;while(node&&!seen.count(node)){seen.insert(node);out.push_back(node->val);node=node->next;}return out;}
void btAttachCycle(ListNode* head,int index){if(index<0||!head)return;ListNode*target=nullptr,*tail=head;for(int i=0;tail;i++,tail=tail->next){if(i==index)target=tail;if(!tail->next){tail->next=target;break;}}}
`;

const treePrelude = `
struct TreeNode { int val; TreeNode* left; TreeNode* right; TreeNode():val(0),left(nullptr),right(nullptr){} TreeNode(int x):val(x),left(nullptr),right(nullptr){} TreeNode(int x,TreeNode*l,TreeNode*r):val(x),left(l),right(r){} };
TreeNode* btBuildTree(const vector<optional<int>>& values){if(values.empty()||!values[0])return nullptr;auto*root=new TreeNode(*values[0]);queue<TreeNode*>q;q.push(root);size_t i=1;while(i<values.size()){auto*n=q.front();q.pop();if(i<values.size()&&values[i]){n->left=new TreeNode(*values[i]);q.push(n->left);}i++;if(i<values.size()&&values[i]){n->right=new TreeNode(*values[i]);q.push(n->right);}i++;}return root;}
TreeNode* btFindTreeNode(TreeNode*root,int value){if(!root)return nullptr;if(root->val==value)return root;if(auto*x=btFindTreeNode(root->left,value))return x;return btFindTreeNode(root->right,value);}
vector<optional<int>> btTreeValues(TreeNode*root){if(!root)return {};vector<optional<int>>out;queue<TreeNode*>q;q.push(root);while(!q.empty()){auto*n=q.front();q.pop();if(n){out.push_back(n->val);q.push(n->left);q.push(n->right);}else out.push_back(nullopt);}while(!out.empty()&&!out.back())out.pop_back();return out;}
`;

const intervalPrelude = `struct Interval { int start,end; Interval(int s=0,int e=0):start(s),end(e){} };`;
const randomPrelude = `
class Node { public:int val;Node*next;Node*random;Node(int value):val(value),next(nullptr),random(nullptr){} };
Node* btBuildRandomList(const vector<vector<optional<int>>>& data){vector<Node*>nodes;for(auto&r:data)nodes.push_back(new Node(*r[0]));for(size_t i=0;i<nodes.size();++i){if(i+1<nodes.size())nodes[i]->next=nodes[i+1];if(data[i].size()>1&&data[i][1])nodes[i]->random=nodes[*data[i][1]];}return nodes.empty()?nullptr:nodes[0];}
vector<vector<optional<int>>> btRandomValues(Node*head){vector<Node*>nodes;unordered_map<Node*,int>index;for(auto*n=head;n;n=n->next){index[n]=nodes.size();nodes.push_back(n);}vector<vector<optional<int>>>out;for(auto*n:nodes)out.push_back({n->val,n->random?optional<int>(index[n->random]):nullopt});return out;}
`;
const graphPrelude = `
class Node { public:int val;vector<Node*>neighbors;Node():val(0){}Node(int value):val(value){}Node(int value,vector<Node*>n):val(value),neighbors(move(n)){} };
Node* btBuildGraph(const vector<vector<int>>& adjacency){if(adjacency.empty())return nullptr;vector<Node*>nodes(adjacency.size());for(size_t i=0;i<nodes.size();++i)nodes[i]=new Node(i+1);for(size_t i=0;i<nodes.size();++i)for(int v:adjacency[i])nodes[i]->neighbors.push_back(nodes[v-1]);return nodes[0];}
vector<vector<int>> btGraphValues(Node*root){if(!root)return {};map<int,vector<int>> rows;rows[root->val]={};queue<Node*>q;q.push(root);set<Node*>seen{root};while(!q.empty()){auto*n=q.front();q.pop();for(auto*x:n->neighbors){rows[n->val].push_back(x->val);if(seen.insert(x).second){rows[x->val];q.push(x);}}}vector<vector<int>>out(rows.rbegin()->first);for(auto&[id,row]:rows){sort(row.begin(),row.end());out[id-1]=row;}return out;}
`;

function normalizeStatements(position, variable) {
  let statements = '';
  if (orderInsensitiveInner.has(position)) statements += `for(auto& item:${variable}) sort(item.begin(),item.end());`;
  if (orderInsensitiveOuter.has(position)) statements += `sort(${variable}.begin(),${variable}.end());`;
  return statements;
}

function buildFunctionHarness(problem) {
  const { contract } = problem; const parameters = parseParameters(contract.parameters);
  const nodeKind = problem.position === 39 ? 'random' : problem.position === 82 ? 'graph' : '';
  let prelude = commonPrelude;
  if (contract.parameters.includes('ListNode') || contract.returnType.includes('ListNode')) prelude += listPrelude;
  if (contract.parameters.includes('TreeNode') || contract.returnType.includes('TreeNode')) prelude += treePrelude;
  if (contract.parameters.includes('Interval')) prelude += intervalPrelude;
  if (nodeKind === 'random') prelude += randomPrelude;
  if (nodeKind === 'graph') prelude += graphPrelude;
  const count = customExpected.has(problem.position)
    ? Math.min(customExpected.get(problem.position).length, problem.sampleInputs.length)
    : Math.min(problem.examples.length, problem.sampleInputs.length);
  const tests = []; const blocks = [];
  for (let index = 0; index < count; index++) {
    const values = parseAssignments(problem.sampleInputs[index]);
    const expectedValue = customExpected.get(problem.position)?.[index] ?? parseExpected(problem.examples[index].output);
    const declarations = [];
    for (const parameter of parameters) {
      let value = values[parameter.name];
      if (value === undefined) value = values[parameter.name.replace(/s$/, '')] ?? values[`${parameter.name}s`];
      if (problem.position === 82 && parameter.name === 'node') value = values.adjList;
      const context = { nodeKind, rootName: values.root !== undefined ? 'root' : parameters.find(item => baseType(item.type) === 'TreeNode*')?.name };
      declarations.push(`${parameter.type.replace(/&$/,'')} ${parameter.name} = ${literal(value, parameter.type, context)};`);
    }
    if (problem.position === 36) declarations.push(`btAttachCycle(head, ${values.index});`);
    const args = parameters.map(item => item.name).join(', ');
    let actualExpression = `Solution().${contract.functionName}(${args})`;
    let callPrefix = '';
    let expectedType = contract.returnType;
    let comparison = '';
    if (contract.returnType === 'void') {
      const first = parameters[0]; callPrefix = `${actualExpression};`; actualExpression = first.name; expectedType = first.type.replace(/&$/,'');
    }
    if (problem.position === 6) { actualExpression = `Solution().decode(Solution().encode(strs))`; expectedType = 'vector<string>'; }
    const comparisonType = contract.returnType === 'void' ? expectedType : contract.returnType;
    if (baseType(comparisonType) === 'ListNode*') { comparison = `auto actualValue=btListValues(actual);vector<int> expectedValue=${literal(expectedValue,'vector<int>')};`; }
    else if (baseType(comparisonType) === 'TreeNode*') {
      if (problem.position === 51) comparison = `auto actualValue=actual?actual->val:INT_MIN;auto expectedValue=${expectedValue};`;
      else comparison = `auto actualValue=btTreeValues(actual);vector<optional<int>> expectedValue=${literal(expectedValue,'vector<optional<int>>')};`;
    } else if (baseType(comparisonType) === 'Node*' && nodeKind === 'random') comparison = `auto actualValue=btRandomValues(actual);vector<vector<optional<int>>> expectedValue=${literal(expectedValue,'vector<vector<optional<int>>>')};`;
    else if (baseType(comparisonType) === 'Node*' && nodeKind === 'graph') comparison = `auto actualValue=btGraphValues(actual);vector<vector<int>> expectedValue=${literal(expectedValue,'vector<vector<int>>')};`;
    else comparison = `auto actualValue=actual;${expectedType.replace(/&$/,'')} expectedValue=${literal(expectedValue, expectedType)};`;
    const normalize = `${normalizeStatements(problem.position,'actualValue')}${normalizeStatements(problem.position,'expectedValue')}`;
    const equality = problem.position === 103 ? `(actualValue.size()==expectedValue.size() && equal(actualValue.begin(),actualValue.end(),actualValue.rbegin()))` : 'btEqual(actualValue,expectedValue)';
    blocks.push(`{${declarations.join('')}${callPrefix}auto actual=${actualExpression};${comparison}${normalize}bool ok=${equality};passed+=ok;cout<<"__BT_CASE__|${index + 1}|"<<(ok?"PASS":"FAIL")<<"|"<<btShow(actualValue)<<"|"<<btShow(expectedValue)<<"\\n";}`);
    tests.push({
      kind: index < problem.examples.length ? 'sample' : 'additional',
      input: problem.sampleInputs[index],
      expected: customExpected.has(problem.position) ? JSON.stringify(expectedValue) : problem.examples[index].output,
    });
  }
  if (!blocks.length) throw new Error(`${problem.title}: no executable test blocks`);
  return { harness: `${standardIncludes}\nusing namespace std;\n${prelude}\n{{USER_CODE}}\nint main(){int passed=0;${blocks.join('\n')}cout<<"__BT_SUMMARY__|"<<passed<<"|${blocks.length}\\n";return passed==${blocks.length}?0:3;}\n`, tests };
}

const designConfigs = {
  22: { className: 'MinStack', constructor: [], methods: { push: { args: ['int'] }, pop: { args: [] }, top: { args: [], returns: 'int' }, getMin: { args: [], returns: 'int' } } },
  32: { className: 'TimeMap', constructor: [], methods: { set: { args: ['string', 'string', 'int'] }, get: { args: ['string', 'int'], returns: 'string' } } },
  42: { className: 'LRUCache', constructor: ['int'], methods: { put: { args: ['int', 'int'] }, get: { args: ['int'], returns: 'int' } } },
  60: { className: 'KthLargest', constructor: ['int', 'vector<int>'], methods: { add: { args: ['int'], returns: 'int' } } },
  65: { className: 'Twitter', constructor: [], methods: { postTweet: { args: ['int', 'int'] }, getNewsFeed: { args: ['int'], returns: 'vector<int>' }, follow: { args: ['int', 'int'] }, unfollow: { args: ['int', 'int'] } } },
  66: { className: 'MedianFinder', constructor: [], methods: { addNum: { args: ['int'] }, findMedian: { args: [], returns: 'double' } } },
  77: { className: 'PrefixTree', constructor: [], methods: { insert: { args: ['string'] }, search: { args: ['string'], returns: 'bool' }, startsWith: { args: ['string'], returns: 'bool' } } },
  78: { className: 'WordDictionary', constructor: [], methods: { addWord: { args: ['string'] }, search: { args: ['string'], returns: 'bool' } } },
  143: { className: 'CountSquares', constructor: [], methods: { add: { args: ['vector<int>'] }, count: { args: ['vector<int>'], returns: 'int' } } },
};

function normalizedArguments(raw, types) {
  if (!types.length) return [];
  if (types.length === 1) {
    if (Array.isArray(raw) && raw.length === 1) return [raw[0]];
    return [raw];
  }
  return raw;
}

function parseDesignOperations(problem, config) {
  if (problem.position === 78) {
    const [operations, argumentsList] = problem.sampleInputs[0].split('\n').map(JSON.parse);
    return operations.map((name, index) => ({ name, args: argumentsList[index] }));
  }
  const sequence = JSON.parse(problem.sampleInputs[0]);
  const operations = [{ name: sequence[0], args: [] }];
  let cursor = 1;
  if (config.constructor.length) operations[0].args = sequence[cursor++];
  while (cursor < sequence.length) {
    const name = sequence[cursor++];
    const method = config.methods[name];
    if (!method) throw new Error(`${problem.title}: unknown operation ${name}`);
    operations.push({ name, args: method.args.length ? sequence[cursor++] : [] });
  }
  return operations;
}

function buildDesignHarness(problem) {
  if (problem.position === 59) {
    const blocks = problem.sampleInputs.map((input, index) => {
      const root = parseAssignments(input).root;
      const expected = parseExpected(problem.examples[index].output);
      return `{TreeNode* root=btBuildTree(${literal(root,'vector<optional<int>>')});Codec codec;TreeNode* actual=codec.deserialize(codec.serialize(root));auto actualValue=btTreeValues(actual);vector<optional<int>> expectedValue=${literal(expected,'vector<optional<int>>')};bool ok=btEqual(actualValue,expectedValue);passed+=ok;cout<<"__BT_CASE__|${index + 1}|"<<(ok?"PASS":"FAIL")<<"|"<<btShow(actualValue)<<"|"<<btShow(expectedValue)<<"\\n";}`;
    });
    return {
      harness: `${standardIncludes}\nusing namespace std;\n${commonPrelude}${treePrelude}\n{{USER_CODE}}\nint main(){int passed=0;${blocks.join('\n')}cout<<"__BT_SUMMARY__|"<<passed<<"|${blocks.length}\\n";return passed==${blocks.length}?0:3;}\n`,
      tests: problem.sampleInputs.map((input, index) => ({ kind: 'sample', input, expected: problem.examples[index].output })),
    };
  }
  const config = designConfigs[problem.position];
  if (!config) throw new Error('Stateful design harness requires an operation-sequence adapter.');
  const operations = parseDesignOperations(problem, config);
  let expected = parseExpected(problem.examples[0].output);
  if (problem.position === 66) expected = [null, null, 1, null, 1.5, null, 2];
  const constructor = operations[0];
  const constructorValues = normalizedArguments(constructor.args, config.constructor);
  const constructorDeclarations = [];
  const constructorArgs = config.constructor.map((type, index) => {
    if (baseType(type).startsWith('vector<')) {
      constructorDeclarations.push(`${type} constructorArg${index}=${literal(constructorValues[index], type)};`);
      return `constructorArg${index}`;
    }
    return literal(constructorValues[index], type);
  }).join(', ');
  const statements = [...constructorDeclarations, `${config.className} subject{${constructorArgs}};`, 'vector<string> actualOut={"null"};', 'bool ok=true;'];
  for (let index = 1; index < operations.length; index++) {
    const operation = operations[index];
    const method = config.methods[operation.name];
    const values = normalizedArguments(operation.args, method.args);
    const args = method.args.map((type, argumentIndex) => literal(values[argumentIndex], type)).join(', ');
    if (!method.returns) statements.push(`subject.${operation.name}(${args});actualOut.push_back("null");`);
    else {
      const expectedValue = expected[index];
      statements.push(`auto value${index}=subject.${operation.name}(${args});${method.returns} expected${index}=${literal(expectedValue, method.returns)};ok=ok&&btEqual(value${index},expected${index});actualOut.push_back(btShow(value${index}));`);
    }
  }
  const expectedDisplay = JSON.stringify(expected);
  const block = `{${statements.join('')}passed+=ok;cout<<"__BT_CASE__|1|"<<(ok?"PASS":"FAIL")<<"|"<<btJsonArray(actualOut)<<"|"<<${quoteString(expectedDisplay)}<<"\\n";}`;
  return {
    harness: `${standardIncludes}\nusing namespace std;\n${commonPrelude}\n{{USER_CODE}}\nint main(){int passed=0;${block}cout<<"__BT_SUMMARY__|"<<passed<<"|1\\n";return passed==1?0:3;}\n`,
    tests: [{ kind: 'sample', input: problem.sampleInputs[0], expected: expectedDisplay }],
  };
}

export function buildHarness(problem) {
  const isDesign = !problem.contract.returnType || problem.contract.functionName === problem.contract.className;
  try { return isDesign ? buildDesignHarness(problem) : buildFunctionHarness(problem); }
  catch (error) { return { harness: '', tests: [], unsupportedReason: error.message }; }
}
