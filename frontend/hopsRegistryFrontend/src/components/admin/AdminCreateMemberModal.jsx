// src/components/admin/AdminCreateMemberModal.jsx

import { useState } from "react";
import { API_BASE } from "../../api/client";
import { useForm } from "../../hooks/useForm";
import { Alert, Modal, Spinner } from "../ui";

export default function AdminCreateMemberModal({ onClose }) {
  const { values, field } = useForm({
    username: "", email: "", first_name: "", last_name: "",
    telephone: "", password: "", password2: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (values.password !== values.password2) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const e = await res.json();
        const msgs = Object.entries(e)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        setError(msgs);
        return;
      }
      onClose();
    } catch {
      setError("Failed to create member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create New Member" onClose={onClose}>
      <Alert msg={error} />

      <div className="form-row">
        <div className="form-group"><label>First Name</label><input {...field("first_name")} /></div>
        <div className="form-group"><label>Last Name</label><input {...field("last_name")} /></div>
      </div>
      <div className="form-group"><label>Username</label><input {...field("username")} /></div>
      <div className="form-group"><label>Email</label><input type="email" {...field("email")} /></div>
      <div className="form-group"><label>Telephone</label><input {...field("telephone")} /></div>
      <div className="form-row">
        <div className="form-group"><label>Password</label><input type="password" {...field("password")} /></div>
        <div className="form-group"><label>Confirm</label><input type="password" {...field("password2")} /></div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? <Spinner /> : "Create Member"}
        </button>
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
