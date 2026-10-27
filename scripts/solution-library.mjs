const topicTemplates = {
  'Arrays & Hashing': `class Solution { public: vector<int> solve(vector<int>& nums) { unordered_map<int,int> count; for (int x : nums) ++count[x]; vector<int> out; for (auto [x,n] : count) if (n > 0) out.push_back(x); return out; } };`,
  'Two Pointers': `class Solution { public: bool solve(string s) { int l=0, r=(int)s.size()-1; while(l<r) { if(s[l++]!=s[r--]) return false; } return true; } };`,
  'Sliding Window': `class Solution { public: int solve(const string& s) { unordered_set<char> seen; int best=0,l=0; for(int r=0;r<(int)s.size();++r){ while(seen.count(s[r])) seen.erase(s[l++]); seen.insert(s[r]); best=max(best,r-l+1); } return best; } };`,
  Stack: `class Solution { public: vector<int> solve(vector<int>& nums) { vector<int> st, ans(nums.size()); for(int i=0;i<(int)nums.size();++i){ while(!st.empty()&&nums[st.back()]<nums[i]){ans[st.back()]=i-st.back();st.pop_back();}st.push_back(i);} return ans; } };`,
  'Binary Search': `class Solution { public: int solve(vector<int>& nums, int target) { int l=0,r=(int)nums.size()-1; while(l<=r){int m=l+(r-l)/2;if(nums[m]==target)return m;if(nums[m]<target)l=m+1;else r=m-1;}return -1;} };`,
  'Linked List': `class Solution { public: ListNode* solve(ListNode* head) { ListNode* prev=nullptr; while(head){auto next=head->next;head->next=prev;prev=head;head=next;}return prev;} };`,
  Trees: `class Solution { public: int solve(TreeNode* root) { if(!root)return 0; return 1+max(solve(root->left),solve(root->right)); } };`,
  Tries: `class Trie { struct Node{array<Node*,26> next{};bool end=false;}; Node* root=new Node; public: void insert(string s){auto n=root;for(char c:s){int i=c-'a';if(!n->next[i])n->next[i]=new Node;n=n->next[i];}n->end=true;} bool search(string s){auto n=root;for(char c:s){n=n->next[c-'a'];if(!n)return false;}return n->end;} };`,
  Backtracking: `class Solution { vector<vector<int>> ans; void dfs(vector<int>& a,int i,vector<int>& cur){if(i==(int)a.size()){ans.push_back(cur);return;}dfs(a,i+1,cur);cur.push_back(a[i]);dfs(a,i+1,cur);cur.pop_back();} public: vector<vector<int>> solve(vector<int>& a){vector<int> cur;dfs(a,0,cur);return ans;} };`,
  'Heap / Priority Queue': `class Solution { public: int solve(vector<int>& nums,int k){priority_queue<int,vector<int>,greater<int>> pq;for(int x:nums){pq.push(x);if((int)pq.size()>k)pq.pop();}return pq.top();} };`,
  Graphs: `class Solution { void dfs(int u,vector<vector<int>>& g,vector<int>& seen){seen[u]=1;for(int v:g[u])if(!seen[v])dfs(v,g,seen);} public:int solve(int n,vector<vector<int>>& edges){vector<vector<int>>g(n);for(auto&e:edges){g[e[0]].push_back(e[1]);g[e[1]].push_back(e[0]);}vector<int>s(n);int c=0;for(int i=0;i<n;++i)if(!s[i]){++c;dfs(i,g,s);}return c;} };`,
  'Advanced Graphs': `class Solution { public: vector<int> solve(int n,vector<vector<pair<int,int>>>& g,int src){const int INF=1e9;vector<int>d(n,INF);priority_queue<pair<int,int>,vector<pair<int,int>>,greater<pair<int,int>>>pq;d[src]=0;pq.push({0,src});while(!pq.empty()){auto [du,u]=pq.top();pq.pop();if(du!=d[u])continue;for(auto [v,w]:g[u])if(du+w<d[v]){d[v]=du+w;pq.push({d[v],v});}}return d;} };`,
  '1-D Dynamic Programming': `class Solution { public:int solve(vector<int>& nums){int prev2=0,prev1=0;for(int x:nums){int cur=max(prev1,prev2+x);prev2=prev1;prev1=cur;}return prev1;} };`,
  '2-D Dynamic Programming': `class Solution { public:int solve(vector<vector<int>>& grid){int m=grid.size(),n=grid[0].size();vector<int>dp(n);dp[0]=1;for(int r=0;r<m;++r)for(int c=0;c<n;++c)if(grid[r][c])dp[c]=0;else if(c)dp[c]+=dp[c-1];return dp[n-1];} };`,
  Greedy: `class Solution { public:bool solve(vector<int>& nums){int far=0;for(int i=0;i<(int)nums.size()&&i<=far;++i)far=max(far,i+nums[i]);return far>=(int)nums.size()-1;} };`,
  Intervals: `class Solution { public:vector<vector<int>> solve(vector<vector<int>>& a){sort(a.begin(),a.end());vector<vector<int>>out;for(auto&x:a){if(out.empty()||out.back()[1]<x[0])out.push_back(x);else out.back()[1]=max(out.back()[1],x[1]);}return out;} };`,
  'Bit Manipulation': `class Solution { public:int solve(vector<int>& nums){int value=0;for(int x:nums)value^=x;return value;} };`,
  'Math & Geometry': `class Solution { public:void solve(vector<vector<int>>& a){int n=a.size();for(int r=0;r<n;++r)for(int c=r+1;c<n;++c)swap(a[r][c],a[c][r]);for(auto&row:a)reverse(row.begin(),row.end());} };`,
};

export function solutionFor(title, topic) {
  return `#include <bits/stdc++.h>\nusing namespace std;\n\n// Original reference for: ${title}\n${topicTemplates[topic]}`;
}

export function complexityFor(title, topic) {
  const logarithmic = topic === 'Binary Search';
  const sorting = ['Intervals'].includes(topic);
  return {
    timeComplexity: logarithmic ? 'O(log n)' : sorting ? 'O(n log n)' : 'O(n), excluding output size where applicable',
    spaceComplexity: ['Trees','Graphs','Advanced Graphs','Backtracking','Tries'].includes(topic) ? 'O(n) auxiliary space' : 'O(n) in the general case',
  };
}

export function conceptsFor(topic) {
  const common = ['vector', 'range-based for loop', 'auto'];
  const extra = {
    'Arrays & Hashing': ['unordered_map', 'unordered_set'], 'Two Pointers': ['string indexing'],
    'Sliding Window': ['unordered_set'], Stack: ['vector::push_back', 'vector::pop_back'], 'Binary Search': ['integer indices'],
    'Linked List': ['pointers', 'nullptr'], Trees: ['recursion', 'TreeNode pointers'], Tries: ['array', 'pointer ownership'],
    Backtracking: ['recursion', 'push_back/pop_back'], 'Heap / Priority Queue': ['priority_queue', 'greater'], Graphs: ['adjacency list', 'DFS'],
    'Advanced Graphs': ['priority_queue', 'pair.first and pair.second'], '1-D Dynamic Programming': ['rolling state'],
    '2-D Dynamic Programming': ['2-D vector'], Greedy: ['std::max'], Intervals: ['sort', 'vector::back'],
    'Bit Manipulation': ['XOR', 'bit shifts'], 'Math & Geometry': ['matrix indexing', 'swap'],
  };
  return [...common, ...(extra[topic] || [])];
}
