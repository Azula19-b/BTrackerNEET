export default function Modal({ title, children, actions, onClose }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose}>×</button><h2>{title}</h2><div className="modal-body">{children}</div>{actions && <div className="modal-actions">{actions}</div>}</section></div>;
}
