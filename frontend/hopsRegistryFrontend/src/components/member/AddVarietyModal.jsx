// src/components/member/AddVarietyModal.jsx

import { useState } from "react";
import api from "../../api/client";
import { useForm } from "../../hooks/useForm";
import { Alert, Modal, Spinner } from "../ui";

export default function AddVarietyModal({ onClose }) {
  const { values, field } = useForm({ name: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!values.name.trim()) { setError("Name is required."); return; }
    setLoading(true);
    try {
      await api.post("/member/me/hop-varieties/", values);
      onClose();
    } catch (e) {
      setError(e?.name?.[0] || "Failed to add variety.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Hop Variety" onClose={onClose}>
      <Alert msg={error} />

      <div className="form-group">
        <label>Variety Name</label>
        <input {...field("name")} placeholder="e.g. Cascade" />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea {...field("description")} placeholder="Flavour profile, aroma notes..." />
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? <Spinner /> : "Add Variety"}
        </button>
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
