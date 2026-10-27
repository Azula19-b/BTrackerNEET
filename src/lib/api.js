export const api = window.btracker;
export const understandingOptions = [
  { value: 'none', label: "I Don't Understand" }, { value: 'partial', label: 'I Partially Understand' }, { value: 'full', label: 'I Fully Understand' },
];
export const progressOptions = [
  { value: 'not_started', label: 'Not Started' }, { value: 'partial', label: 'Partially Solved' }, { value: 'solved', label: 'Solved by Myself' },
];
export const navItems = [
  ['dashboard', 'Overview', 'Dashboard'], ['builtin', '150', 'NeetCode 150'], ['custom', '+', 'My Problems'], ['practice', '</>', 'Practice Mode'],
  ['reviews', '↻', 'Review Today'], ['analytics', '↗', 'Progress & Analytics'], ['settings', '⚙', 'Settings'],
];
