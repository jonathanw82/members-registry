// src/components/admin/AdminMemberModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Full detail modal for a single member — tabs for details, varieties, yields.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import api from "../../api/client";
import { useForm } from "../../hooks/useForm";
import { Alert, Loading, Empty, Modal, Spinner } from "../ui";
import AdminAddYieldModal from "./AdminAddYieldModal";

const HOP_VARIETIES = [
  { name: "Bramling +",  description: "Enhanced Bramling variety with intensified fruit and spice character." },
  { name: "Bullion",     description: "Old English high alpha hop with blackcurrant and herbal notes." },
  { name: "Cascade",     description: "Classic American hop with floral, citrus and grapefruit character." },
  { name: "Centennial",  description: "High alpha hop with floral and citrus aromas." },
  { name: "Challenger",  description: "Versatile English hop with clean bitterness and cedar notes." },
  { name: "Chinnock",    description: "English hop with mild bitterness and pleasant aroma." },
  { name: "First Gold",  description: "PrimaDonna Dwarf English hop with floral and fruity character." },
  { name: "Fuggle",      description: "Traditional English hop, earthy and woody with mild bitterness." },
  { name: "Goldings",    description: "Smooth English hop with honey, spice and floral notes." },
  { name: "Northern Brewer", description: "Dual-purpose hop with clean bitterness and woody, mint notes." },
  { name: "Unkown",     description: "Unidentified variety" },
];

export default function AdminMemberModal({ memberId, onClose }) {
  const [member, setMember]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("details");
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState({});
  const [editMode, setEditMode] = useState(false);
  const [showAddYield, setShowAddYield] = useState(false);
  const [newVariety, setNewVariety]     = useState({ name: "", description: "" });
  const [addingVariety, setAddingVariety] = useState(false);
  const [varietyError, setVarietyError]   = useState("");
  const { values, setValues, field } = useForm({});

  const load = useCallback(async () => {
    const data = await api.get(`/admin/members/${memberId}/`);
    if (data) {
      setMember(data);
      setValues({
        first_name: data.first_name,
        last_name:  data.last_name,
        email:      data.email,
        telephone:  data.telephone,
        username:   data.username,
        start_year: data.start_year || "",
      });
    }
    setLoading(false);
  }, [memberId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    setMsg({});
    try {
      await api.patch(`/admin/members/${memberId}/`, {
        first_name: values.first_name,
        last_name:  values.last_name,
        email:      values.email,
        telephone:  values.telephone,
        start_year: values.start_year ? parseInt(values.start_year) : null,
      });
      setMsg({ type: "success", text: "Saved successfully." });
      setEditMode(false);
      load();
    } catch {
      setMsg({ type: "error", text: "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  const addVariety = async () => {
    if (!newVariety.name.trim()) { setVarietyError("Name is required."); return; }
    setAddingVariety(true);
    setVarietyError("");
    try {
      await api.post(`/admin/members/${memberId}/varieties/`, newVariety);
      setNewVariety({ name: "", description: "" });
      load();
    } catch (e) {
      setVarietyError(e?.name?.[0] || "Failed to add variety.");
    } finally {
      setAddingVariety(false);
    }
  };

  const deleteVariety = async (id) => {
    if (!confirm("Remove this hop variety from the member? Any yield records for this variety will also be deleted.")) return;
    try {
      await api.delete(`/admin/varieties/${id}/`);
      load();
    } catch {
      setMsg({ type: "error", text: "Failed to remove variety." });
    }
  };

  const deleteYield = async (id) => {
    if (!confirm("Delete this yield record?")) return;
    await api.delete(`/admin/yields/${id}/`);
    load();
  };

  return (
    <Modal title={member ? `${member.first_name} ${member.last_name}` : "Member Details"} onClose={onClose}>
      {loading ? <Loading /> : !member ? <Alert msg="Failed to load member." /> : (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <span className="mem-chip">{member.membership_number}</span>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button className={`tab ${tab === "details"   ? "active" : ""}`} onClick={() => setTab("details")}   style={{ fontSize: "0.72rem", padding: "0.5rem 0.9rem" }}>Details</button>
            <button className={`tab ${tab === "varieties" ? "active" : ""}`} onClick={() => setTab("varieties")} style={{ fontSize: "0.72rem", padding: "0.5rem 0.9rem" }}>Varieties ({member.hop_varieties?.length || 0})</button>
            <button className={`tab ${tab === "yields"    ? "active" : ""}`} onClick={() => setTab("yields")}    style={{ fontSize: "0.72rem", padding: "0.5rem 0.9rem" }}>Yields ({member.yield_records?.length || 0})</button>
          </div>

          {/* ── Details ── */}
          {tab === "details" && (
            <>
              <Alert type={msg.type} msg={msg.text} />
              <div className="form-row">
                <div className="form-group"><label>First Name</label><input {...field("first_name")} readOnly={!editMode} /></div>
                <div className="form-group"><label>Last Name</label><input {...field("last_name")} readOnly={!editMode} /></div>
              </div>
              <div className="form-group"><label>Email</label><input {...field("email")} readOnly={!editMode} /></div>
              <div className="form-group"><label>Telephone</label><input {...field("telephone")} readOnly={!editMode} /></div>
              <div className="form-group">
                <label>Growing Since (Year)</label>
                {editMode ? (
                  <select {...field("start_year")}>
                    <option value="">— Select year —</option>
                    {Array.from(
                      { length: new Date().getFullYear() - 1950 + 1 },
                      (_, i) => new Date().getFullYear() - i
                    ).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={values.start_year || "Not set"}
                    readOnly
                  />
                )}
              </div>
              <div className="form-group">
                <label>Membership Number</label>
                <input value={member.membership_number} readOnly />
                <div className="form-hint">🔒 Read-only</div>
              </div>
              <div className="btn-group">
                {!editMode
                  ? <button className="btn btn-outline btn-sm" onClick={() => setEditMode(true)}>Edit Details</button>
                  : <>
                      <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? <Spinner /> : "Save"}</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                    </>
                }
              </div>
            </>
          )}

          {/* ── Varieties ── */}
          {tab === "varieties" && (
            <>
              {/* Inline add form */}
              <div className="card" style={{ marginBottom: "1rem", background: "var(--parchment)" }}>
                <div style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fog)", marginBottom: "0.75rem" }}>Add New Variety</div>
                {varietyError && <Alert msg={varietyError} />}
               <div className="form-group" style={{ marginBottom: "0.75rem" }}>
              <label>Select Variety</label>
              <select
                  value={newVariety.name}
                  onChange={e => {
                    const selected = HOP_VARIETIES.find(v => v.name === e.target.value);
                    setNewVariety({ name: selected?.name || "", description: selected?.description || "" });
                  }}>
                  <option value="">— Choose a hop variety —</option>
                  {HOP_VARIETIES.filter(v => !member.hop_varieties.find(existing => existing.name === v.name))
                    .map(v => <option key={v.name} value={v.name}>{v.name}</option>)
                  }
                  </select>
                  {newVariety.description && (
                    <div className="form-hint" style={{ marginTop: "0.5rem" }}>{newVariety.description}</div>
                  )}
                    </div>
                  <button className="btn btn-primary btn-sm" onClick={addVariety} disabled={addingVariety}>
                    {addingVariety ? <Spinner /> : "+ Add Variety"}
                  </button>
                </div>

              {member.hop_varieties?.length === 0 ? (
                <Empty icon="🌱" text="No varieties." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                 {member.hop_varieties.map(v => (
                    <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--parchment)", padding: "0.75rem 1rem", borderRadius: "6px" }}>
                      <div>
                        <strong style={{ fontSize: "0.88rem" }}>{v.name}</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--fog)" }}>{v.description || "No description"}</div>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteVariety(v.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Yields ── */}
          {tab === "yields" && (
            <>
              <button className="btn btn-primary btn-sm" style={{ marginBottom: "1rem" }} onClick={() => setShowAddYield(true)}>
                + Record Yield
              </button>
              {member.yield_records?.length === 0 ? (
                <Empty icon="📊" text="No yields recorded." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {member.yield_records.map(y => (
                    <div key={y.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--parchment)", padding: "0.75rem 1rem", borderRadius: "6px" }}>
                      <div>
                        <strong style={{ fontSize: "0.85rem" }}>{y.hop_variety_name}</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--fog)" }}>
                          {y.harvest_date} · {y.notes || "No notes"}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span className="badge badge-green">{parseFloat(y.quantity_kg).toFixed(5)} kg</span>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteYield(y.id)}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAddYield && (
                <AdminAddYieldModal
                  memberId={memberId}
                  varieties={member.hop_varieties || []}
                  onClose={() => { setShowAddYield(false); load(); }}
                />
              )}
            </>
          )}
        </>
      )}
    </Modal>
  );
}
