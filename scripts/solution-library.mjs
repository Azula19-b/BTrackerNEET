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

// Each entry is independently written for the named problem. The signatures follow the
// linked judge; list/tree node declarations are supplied by that judge.
const specificSolutions = {
  'Contains Duplicate': `class Solution { public: bool containsDuplicate(vector<int>& nums){ unordered_set<int> seen; for(int x:nums) if(!seen.insert(x).second) return true; return false; } };`,
  'Valid Anagram': `class Solution { public: bool isAnagram(string s,string t){ if(s.size()!=t.size()) return false; array<int,26> count{}; for(char c:s) ++count[c-'a']; for(char c:t) if(--count[c-'a']<0) return false; return true; } };`,
  'Two Sum': `class Solution { public: vector<int> twoSum(vector<int>& nums,int target){ unordered_map<int,int> index; for(int i=0;i<(int)nums.size();++i){ auto it=index.find(target-nums[i]); if(it!=index.end()) return {it->second,i}; index[nums[i]]=i; } return {}; } };`,
  'Group Anagrams': `class Solution { public: vector<vector<string>> groupAnagrams(vector<string>& words){ unordered_map<string,vector<string>> groups; for(string word:words){ string key=word; sort(key.begin(),key.end()); groups[key].push_back(move(word)); } vector<vector<string>> answer; for(auto& [key,group]:groups) answer.push_back(move(group)); return answer; } };`,
  'Top K Frequent Elements': `class Solution { public: vector<int> topKFrequent(vector<int>& nums,int k){ unordered_map<int,int> freq; for(int x:nums) ++freq[x]; vector<vector<int>> bucket(nums.size()+1); for(auto [x,n]:freq) bucket[n].push_back(x); vector<int> answer; for(int n=nums.size();n>0&&answer.size()<(size_t)k;--n) for(int x:bucket[n]){ answer.push_back(x); if(answer.size()==(size_t)k) break; } return answer; } };`,
  'Encode and Decode Strings': `class Solution { public: string encode(vector<string>& words){ string out; for(auto&s:words) out+=to_string(s.size())+'#'+s; return out; } vector<string> decode(string data){ vector<string> out; for(int i=0;i<(int)data.size();){ int j=i; while(data[j]!='#') ++j; int n=stoi(data.substr(i,j-i)); out.push_back(data.substr(j+1,n)); i=j+1+n; } return out; } };`,
  'Product of Array Except Self': `class Solution { public: vector<int> productExceptSelf(vector<int>& nums){ int n=nums.size(),suffix=1; vector<int> answer(n,1); for(int i=1;i<n;++i) answer[i]=answer[i-1]*nums[i-1]; for(int i=n-1;i>=0;--i){ answer[i]*=suffix; suffix*=nums[i]; } return answer; } };`,
  'Valid Sudoku': `class Solution { public: bool isValidSudoku(vector<vector<char>>& board){ array<array<bool,9>,9> row{},col{},box{}; for(int r=0;r<9;++r) for(int c=0;c<9;++c) if(board[r][c]!='.'){ int x=board[r][c]-'1',b=(r/3)*3+c/3; if(row[r][x]||col[c][x]||box[b][x]) return false; row[r][x]=col[c][x]=box[b][x]=true; } return true; } };`,
  'Longest Consecutive Sequence': `class Solution { public: int longestConsecutive(vector<int>& nums){ unordered_set<int> values(nums.begin(),nums.end()); int best=0; for(int x:values) if(!values.count(x-1)){ int y=x; while(values.count(y)) ++y; best=max(best,y-x); } return best; } };`,
  'Valid Palindrome': `class Solution { public: bool isPalindrome(string s){ int l=0,r=(int)s.size()-1; while(l<r){ while(l<r&&!isalnum((unsigned char)s[l])) ++l; while(l<r&&!isalnum((unsigned char)s[r])) --r; if(tolower(s[l++])!=tolower(s[r--])) return false; } return true; } };`,
  'Two Sum II Input Array Is Sorted': `class Solution { public: vector<int> twoSum(vector<int>& a,int target){ int l=0,r=(int)a.size()-1; while(l<r){ long sum=(long)a[l]+a[r]; if(sum==target) return {l+1,r+1}; if(sum<target) ++l; else --r; } return {}; } };`,
  '3Sum': `class Solution { public: vector<vector<int>> threeSum(vector<int>& a){ sort(a.begin(),a.end()); vector<vector<int>> out; for(int i=0;i<(int)a.size()-2;++i){ if(i&&a[i]==a[i-1]) continue; int l=i+1,r=a.size()-1; while(l<r){ long sum=(long)a[i]+a[l]+a[r]; if(sum<0) ++l; else if(sum>0) --r; else{ out.push_back({a[i],a[l],a[r]}); int x=a[l],y=a[r]; while(l<r&&a[l]==x) ++l; while(l<r&&a[r]==y) --r; } } } return out; } };`,
  'Container With Most Water': `class Solution { public: int maxArea(vector<int>& h){ int l=0,r=h.size()-1,best=0; while(l<r){ best=max(best,(r-l)*min(h[l],h[r])); if(h[l]<h[r]) ++l; else --r; } return best; } };`,
  'Trapping Rain Water': `class Solution { public: int trap(vector<int>& h){ int l=0,r=h.size()-1,left=0,right=0,water=0; while(l<r){ if(h[l]<=h[r]){ left=max(left,h[l]); water+=left-h[l++]; }else{ right=max(right,h[r]); water+=right-h[r--]; } } return water; } };`,
  'Best Time to Buy And Sell Stock': `class Solution { public: int maxProfit(vector<int>& prices){ int low=INT_MAX,best=0; for(int price:prices){ low=min(low,price); best=max(best,price-low); } return best; } };`,
  'Longest Substring Without Repeating Characters': `class Solution { public: int lengthOfLongestSubstring(string s){ array<int,256> last; last.fill(-1); int left=0,best=0; for(int r=0;r<(int)s.size();++r){ left=max(left,last[(unsigned char)s[r]]+1); last[(unsigned char)s[r]]=r; best=max(best,r-left+1); } return best; } };`,
  'Longest Repeating Character Replacement': `class Solution { public: int characterReplacement(string s,int k){ array<int,26> count{}; int left=0,best=0,largest=0; for(int right=0;right<(int)s.size();++right){ largest=max(largest,++count[s[right]-'A']); while(right-left+1-largest>k) --count[s[left++]-'A']; best=max(best,right-left+1); } return best; } };`,
  'Permutation In String': `class Solution { public: bool checkInclusion(string a,string b){ if(a.size()>b.size()) return false; array<int,26> need{},window{}; for(char c:a) ++need[c-'a']; for(int i=0;i<(int)b.size();++i){ ++window[b[i]-'a']; if(i>=(int)a.size()) --window[b[i-a.size()]-'a']; if(window==need) return true; } return false; } };`,
  'Minimum Window Substring': `class Solution { public: string minWindow(string s,string t){ array<int,128> need{}; for(char c:t) ++need[c]; int missing=t.size(),left=0,start=0,len=INT_MAX; for(int right=0;right<(int)s.size();++right){ if(need[s[right]]-- >0) --missing; while(!missing){ if(right-left+1<len){start=left;len=right-left+1;} if(++need[s[left++]]>0) ++missing; } } return len==INT_MAX?"":s.substr(start,len); } };`,
  'Sliding Window Maximum': `class Solution { public: vector<int> maxSlidingWindow(vector<int>& a,int k){ deque<int> q; vector<int> out; for(int i=0;i<(int)a.size();++i){ while(!q.empty()&&q.front()<=i-k) q.pop_front(); while(!q.empty()&&a[q.back()]<=a[i]) q.pop_back(); q.push_back(i); if(i>=k-1) out.push_back(a[q.front()]); } return out; } };`,
  'Valid Parentheses': `class Solution { public: bool isValid(string s){ vector<char> st; for(char c:s){ if(c=='('||c=='['||c=='{') st.push_back(c); else{ if(st.empty()) return false; char open=st.back(); st.pop_back(); if((c==')'&&open!='(')||(c==']'&&open!='[')||(c=='}'&&open!='{')) return false; } } return st.empty(); } };`,
  'Min Stack': `class MinStack { vector<pair<int,int>> values; public: void push(int x){ values.push_back({x,values.empty()?x:min(x,values.back().second)}); } void pop(){values.pop_back();} int top(){return values.back().first;} int getMin(){return values.back().second;} };`,
  'Evaluate Reverse Polish Notation': `class Solution { public: int evalRPN(vector<string>& tokens){ vector<long> st; for(auto&t:tokens){ if(t.size()>1||isdigit(t[0])) st.push_back(stol(t)); else{ long b=st.back();st.pop_back();long a=st.back();st.pop_back(); if(t=="+")st.push_back(a+b);else if(t=="-")st.push_back(a-b);else if(t=="*")st.push_back(a*b);else st.push_back(a/b); } } return st.back(); } };`,
  'Daily Temperatures': `class Solution { public: vector<int> dailyTemperatures(vector<int>& t){ vector<int> answer(t.size()),st; for(int i=0;i<(int)t.size();++i){ while(!st.empty()&&t[st.back()]<t[i]){ answer[st.back()]=i-st.back();st.pop_back(); } st.push_back(i); } return answer; } };`,
  'Car Fleet': `class Solution { public: int carFleet(int target,vector<int>& position,vector<int>& speed){ vector<pair<int,double>> cars; for(int i=0;i<(int)position.size();++i) cars.push_back({position[i],double(target-position[i])/speed[i]}); sort(cars.rbegin(),cars.rend()); int fleets=0; double slow=-1; for(auto [p,time]:cars) if(time>slow){++fleets;slow=time;} return fleets; } };`,
  'Largest Rectangle In Histogram': `class Solution { public: int largestRectangleArea(vector<int>& h){ vector<int> st; long best=0; for(int i=0;i<=(int)h.size();++i){ int height=i==(int)h.size()?0:h[i]; while(!st.empty()&&h[st.back()]>height){ int x=h[st.back()];st.pop_back();int left=st.empty()?0:st.back()+1;best=max(best,(long)x*(i-left)); } st.push_back(i); } return best; } };`,
  'Binary Search': `class Solution { public: int search(vector<int>& a,int target){ int l=0,r=a.size()-1; while(l<=r){int m=l+(r-l)/2;if(a[m]==target)return m;if(a[m]<target)l=m+1;else r=m-1;}return -1;} };`,
  'Search a 2D Matrix': `class Solution { public: bool searchMatrix(vector<vector<int>>& m,int target){ int rows=m.size(),cols=m[0].size(),l=0,r=rows*cols-1; while(l<=r){int mid=l+(r-l)/2,x=m[mid/cols][mid%cols];if(x==target)return true;if(x<target)l=mid+1;else r=mid-1;}return false;} };`,
  'Koko Eating Bananas': `class Solution { public: int minEatingSpeed(vector<int>& piles,int h){ int l=1,r=*max_element(piles.begin(),piles.end()); while(l<r){int m=l+(r-l)/2;long hours=0;for(int p:piles)hours+=(p+m-1)/m;if(hours<=h)r=m;else l=m+1;}return l;} };`,
  'Find Minimum In Rotated Sorted Array': `class Solution { public: int findMin(vector<int>& a){ int l=0,r=a.size()-1; while(l<r){int m=l+(r-l)/2;if(a[m]>a[r])l=m+1;else r=m;}return a[l];} };`,
  'Search In Rotated Sorted Array': `class Solution { public: int search(vector<int>& a,int target){int l=0,r=a.size()-1;while(l<=r){int m=l+(r-l)/2;if(a[m]==target)return m;if(a[l]<=a[m]){if(a[l]<=target&&target<a[m])r=m-1;else l=m+1;}else{if(a[m]<target&&target<=a[r])l=m+1;else r=m-1;}}return -1;} };`,
  'Time Based Key Value Store': `class TimeMap { unordered_map<string,vector<pair<int,string>>> values; public: void set(string key,string value,int timestamp){values[key].push_back({timestamp,move(value)});} string get(string key,int timestamp){auto& a=values[key];auto it=upper_bound(a.begin(),a.end(),make_pair(timestamp,string(1,char(127))));return it==a.begin()?"":prev(it)->second;} };`,
  'Median of Two Sorted Arrays': `class Solution { public: double findMedianSortedArrays(vector<int>& a,vector<int>& b){if(a.size()>b.size())return findMedianSortedArrays(b,a);int total=a.size()+b.size(),half=(total+1)/2,l=0,r=a.size();while(l<=r){int i=(l+r)/2,j=half-i;int al=i? a[i-1]:INT_MIN,ar=i<(int)a.size()?a[i]:INT_MAX,bl=j?b[j-1]:INT_MIN,br=j<(int)b.size()?b[j]:INT_MAX;if(al<=br&&bl<=ar)return total%2?max(al,bl):(max(al,bl)+min(ar,br))/2.0;if(al>br)r=i-1;else l=i+1;}return 0;} };`,
};

export function solutionFor(title, topic) {
  return `#include <bits/stdc++.h>\nusing namespace std;\n\n// Original reference for: ${title}\n${specificSolutions[title] || topicTemplates[topic]}`;
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
