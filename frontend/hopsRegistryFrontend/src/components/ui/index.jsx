// src/components/ui/index.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Small, reusable UI primitives used across the app.
// Import what you need: import { Spinner, Modal, Alert } from "../ui";
// ─────────────────────────────────────────────────────────────────────────────

export function Spinner() {
  return <div className="spinner" />;
}

export function Loading() {
  return (
    <div className="loading-wrap">
      <div className="spinner" />
    </div>
  );
}

export function Alert({ type = "error", msg }) {
  if (!msg) return null;
  return <div className={`alert alert-${type}`}>{msg}</div>;
}

export function Empty({ icon = "🌿", text = "Nothing here yet." }) {
  return (
    <div className="empty">
      <div className="icon">{icon}</div>
      <p>{text}</p>
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-backdrop"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
