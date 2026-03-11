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

export function ConfirmModal({ title, message, confirmLabel = "Confirm", confirmStyle = "btn-danger", onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <p style={{ fontSize: "0.88rem", color: "var(--fog)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          {message}
        </p>
        <div className="btn-group">
          <button className={`btn ${confirmStyle}`} onClick={onConfirm}>{confirmLabel}</button>
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function AlertModal({ title, message, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title || "Notice"}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p style={{ fontSize: "0.88rem", color: "var(--fog)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          {message}
        </p>
        <button className="btn btn-primary" onClick={onClose} style={{ width: "100%" }}>OK</button>
      </div>
    </div>
  );
}
