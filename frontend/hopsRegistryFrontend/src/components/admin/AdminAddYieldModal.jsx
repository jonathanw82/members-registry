// src/components/admin/AdminAddYieldModal.jsx

import { useState } from "react";
import api from "../../api/client";
import { useForm } from "../../hooks/useForm";
import { Alert, Modal, Spinner } from "../ui";


export default function AdminAddYieldModal({ memberId, varieties, onClose }) {
  const { values, field, set } = useForm({
    hop_variety: "", harvest_date: "", quantity_kg: "", notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!values.hop_variety || !values.harvest_date || !values.quantity_kg) {
      setError("Variety, date and quantity are all required.");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/admin/members/${memberId}/yields/`, {
        ...values,
        hop_variety: parseInt(values.hop_variety),
        quantity_kg: parseFloat(values.quantity_kg),
      });
      onClose();
    } catch (e) {
      const msgs = Object.entries(e || {})
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join(" ");
      setError(msgs || "Failed to record yield.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Record Yield" onClose={onClose}>
      <Alert msg={error} />

      {varieties.length === 0 ? (
        <div className="alert alert-error">
          This member has no hop varieties. Add varieties first before recording yields.
        </div>
      ) : (
        <>
          <div className="form-group">
            <label>Hop Variety</label>
            <select value={values.hop_variety} onChange={e => set("hop_variety", e.target.value)}>
              <option value="">— Select variety —</option>
              {varieties.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Harvest Date</label>
              <input type="date" {...field("harvest_date")} />
            </div>
            <div className="form-group">
              <label>Quantity (kg)</label>
              <input type="number" step="0.00001" {...field("quantity_kg")} placeholder="0.00308" />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea {...field("notes")} placeholder="Any notes about this harvest..." />
          </div>

          <div className="btn-group">
            <button className="btn btn-primary" onClick={submit} disabled={loading}>
              {loading ? <Spinner /> : "Record Yield"}
            </button>
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          </div>
        </>
      )}
    </Modal>
  );
}
