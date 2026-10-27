import { progressOptions, understandingOptions } from '../lib/api';
export default function StatusControls({ problem, onChange, compact = false }) {
  const change = (field, value) => onChange(problem.id, { understanding: field === 'understanding' ? value : problem.understanding, solvingProgress: field === 'solvingProgress' ? value : problem.solving_progress });
  return <div className={`status-controls ${compact ? 'compact' : ''}`}><label><span>Understanding</span><select value={problem.understanding || 'none'} onChange={e => change('understanding', e.target.value)}>{understandingOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label><label><span>Solving progress</span><select value={problem.solving_progress || 'not_started'} onChange={e => change('solvingProgress', e.target.value)}>{progressOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label></div>;
}
