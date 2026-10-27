import { navItems } from '../lib/api';
export default function Sidebar({ page, onNavigate, theme, onTheme }) {
  return <aside className="sidebar"><div className="brand"><span className="brand-mark">B</span><div><strong>BTracker</strong><span>NEET</span></div></div><nav>
    {navItems.map(([id, icon, label]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => onNavigate(id)}><span className="nav-icon">{icon}</span>{label}</button>)}
  </nav><div className="sidebar-footer"><div className="offline"><span /> Offline ready</div><button className="theme-button" onClick={onTheme}>{theme === 'dark' ? '☀ Light theme' : '☾ Dark theme'}</button></div></aside>;
}
