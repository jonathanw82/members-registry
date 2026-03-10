// src/components/admin/AdminYields.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Select a member, view all their yield records, add or delete entries.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import api from "../../api/client";
import { Loading, Empty } from "../ui";
import AdminAddYieldModal from "./AdminAddYieldModal";

function formatKg(value) {
  const num = parseFloat(value);
  if (num < 0.01) return num.toFixed(5);   // small amounts: 0.00308
  if (num < 1)    return num.toFixed(3);   // medium: 0.583
  return num.toFixed(2);                   // normal: 120.50
}

export default function AdminYields() {
  const [members, setMembers]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedMember, setSelectedMember] = useState("");
  const [yields, setYields]               = useState([]);
  const [varieties, setVarieties]         = useState([]);
  const [yieldLoading, setYieldLoading]   = useState(false);
  const [showAdd, setShowAdd]             = useState(false);

  // Load member list on mount
  useEffect(() => {
    api.get("/admin/members/").then(data => {
      if (data) setMembers(data);
      setLoading(false);
    });
  }, []);

  // Load yields + varieties when a member is selected
  useEffect(() => {
    if (!selectedMember) { setYields([]); setVarieties([]); return; }
    setYieldLoading(true);
    Promise.all([
      api.get(`/admin/members/${selectedMember}/yields/`),
      api.get(`/admin/members/${selectedMember}/`),
    ]).then(([y, m]) => {
      if (y) setYields(y);
      if (m) setVarieties(m.hop_varieties || []);
      setYieldLoading(false);
    });
  }, [selectedMember]);

  const refreshYields = async () => {
    const data = await api.get(`/admin/members/${selectedMember}/yields/`);
    if (data) setYields(data);
  };

  const deleteYield = async (id) => {
    if (!confirm("Delete this yield?")) return;
    await api.delete(`/admin/yields/${id}/`);
    refreshYields();
  };

  return (
    <>
      {/* Member selector + Add button */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          {loading ? (
            <select disabled><option>Loading members...</option></select>
          ) : (
            <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)} style={{ maxWidth: 400 }}>
              <option value="">— Select a member —</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name} [{m.membership_number}]
                </option>
              ))}
            </select>
          )}
        </div>
        {selectedMember && (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + Record Yield
          </button>
        )}
      </div>

      {/* Content */}
      {!selectedMember ? (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <p style={{ color: "var(--fog)" }}>Select a member above to view and manage their yield records.</p>
        </div>
      ) : yieldLoading ? (
        <Loading />
      ) : yields.length === 0 ? (
        <Empty icon="📊" text="No yields recorded for this member yet." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Variety</th>
                <th>Harvest Date</th>
                <th>Quantity (kg)</th>
                <th>Notes</th>
                <th>Recorded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {yields.map(y => (
                <tr key={y.id}>
                  <td><strong>{y.hop_variety_name}</strong></td>
                  <td>{y.harvest_date}</td>
                  <td><span className="badge badge-green">{formatKg(y.quantity_kg)} kg</span></td>
                  <td style={{ color: "var(--fog)", fontSize: "0.82rem" }}>{y.notes || "—"}</td>
                  <td style={{ color: "var(--fog)", fontSize: "0.82rem" }}>{y.recorded_by_username || "—"}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteYield(y.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && selectedMember && (
        <AdminAddYieldModal
          memberId={selectedMember}
          varieties={varieties}
          onClose={() => { setShowAdd(false); refreshYields(); }}
        />
      )}
    </>
  );
}
