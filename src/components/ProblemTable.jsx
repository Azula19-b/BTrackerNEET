import StatusControls from './StatusControls';
export default function ProblemTable({ problems, onPractice, onProgress, customActions }) {
  if (!problems.length) return <div className="empty-state"><div>⌕</div><h3>No matching problems</h3><p>Try changing one of the filters above.</p></div>;
  return <div className="table-wrap"><table className="problem-table"><thead><tr><th>Problem</th><th>Difficulty</th><th>Learning status</th><th>Next review</th><th /></tr></thead><tbody>{problems.map(problem => <tr key={problem.id}>
    <td><button className="problem-title" onClick={() => onPractice(problem)}>{problem.title}</button><span>{problem.topic}</span></td><td><span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span></td>
    <td><StatusControls problem={problem} onChange={onProgress} compact /></td><td>{problem.next_review_date ? new Date(`${problem.next_review_date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Not scheduled'}</td>
    <td className="row-actions"><button className="practice-button" onClick={() => onPractice(problem)}>Practice</button>{customActions?.(problem)}</td></tr>)}</tbody></table></div>;
}
