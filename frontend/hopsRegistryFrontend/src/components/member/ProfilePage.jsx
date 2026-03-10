// src/components/member/ProfilePage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Member's personal dashboard. Tabs: Details | Hop Varieties | Yield Records
// Members can edit their own details but NOT their membership number.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import api from "../../api/client";
import { useForm } from "../../hooks/useForm";
import { Alert, Loading, Empty, Spinner } from "../ui";

function formatKg(value) {
  const num = parseFloat(value);
  if (num < 0.01) return num.toFixed(5);   // small amounts: 0.00308
  if (num < 1)    return num.toFixed(3);   // medium: 0.583
  return num.toFixed(2);                   // normal: 120.50
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("details");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [editMode, setEditMode] = useState(false);
  const { values, setValues, field } = useForm({});

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.get("/member/me/");
    if (data) {
      setProfile(data);
      setValues({
        first_name: data.first_name,
        last_name:  data.last_name,
        email:      data.email,
        telephone:  data.telephone,
        start_year: data.start_year || "",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async () => {
    setSaving(true);
    setMsg({});
    try {
      await api.patch("/member/me/", {
        first_name: values.first_name,
        last_name:  values.last_name,
        email:      values.email,
        telephone:  values.telephone,
        start_year: values.start_year ? parseInt(values.start_year) : null,
      });
      setMsg({ type: "success", text: "Profile updated successfully." });
      setEditMode(false);
      load();
    } catch {
      setMsg({ type: "error", text: "Failed to save profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (!profile) return <Alert msg="Could not load profile." />;

  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase()
    || profile.username?.[0]?.toUpperCase();

  return (
    <div>
      <div className="page-header">
        <div className="tag">Member Portal</div>
        <h1>{profile.first_name} {profile.last_name}</h1>
        <div style={{ marginTop: "0.5rem" }}>
          <span className="mem-chip">{profile.membership_number}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === "details"   ? "active" : ""}`} onClick={() => setTab("details")}>My Details</button>
        <button className={`tab ${tab === "varieties" ? "active" : ""}`} onClick={() => setTab("varieties")}>
          Hop Varieties ({profile.hop_varieties?.length || 0})
        </button>
        <button className={`tab ${tab === "yields"    ? "active" : ""}`} onClick={() => setTab("yields")}>
          Yield Records ({profile.yield_records?.length || 0})
        </button>
      </div>

      {/* ── Details ── */}
      {tab === "details" && (
        <div className="card" style={{ maxWidth: 520 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div>
              <div className="profile-avatar">{initials}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--fog)" }}>
                Member since {new Date(profile.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long" })}
              </div>
            </div>
            {!editMode && (
              <button className="btn btn-outline btn-sm" onClick={() => setEditMode(true)}>Edit</button>
            )}
          </div>

          <Alert type={msg.type} msg={msg.text} />

          <div className="form-row">
            <div className="form-group"><label>First Name</label><input {...field("first_name")} readOnly={!editMode} /></div>
            <div className="form-group"><label>Last Name</label><input {...field("last_name")} readOnly={!editMode} /></div>
          </div>
          <div className="form-group"><label>Email</label><input type="email" {...field("email")} readOnly={!editMode} /></div>
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
              {!values.start_year && !editMode && (
                <div className="form-hint">Click Edit to set your start year</div>
              )}
            </div>
          <div className="form-group">
            <label>Membership Number</label>
            <input value={profile.membership_number} readOnly />
            <div className="form-hint">🔒 Membership number cannot be changed</div>
          </div>

          {editMode && (
            <div className="btn-group">
              <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                {saving ? <Spinner /> : "Save Changes"}
              </button>
              <button className="btn btn-outline" onClick={() => { setEditMode(false); setMsg({}); }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Hop Varieties ── */}
      {tab === "varieties" && (
        <>
          {profile.hop_varieties?.length === 0 ? (
            <Empty icon="🌱" text="No hop varieties added yet." />
          ) : (
            <div className="card-grid">
              {profile.hop_varieties.map(v => (
                <div className="card" key={v.id}>
                  <h3>{v.name}</h3>
                  <p style={{ fontSize: "0.83rem", color: "var(--fog)", margin: "0.5rem 0 1rem" }}>
                    {v.description || "No description"}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--fog)", marginTop: "0.5rem" }}>
                      Contact an admin to add or remove varieties
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Yields ── */}
      {tab === "yields" && (
        profile.yield_records?.length === 0 ? (
          <Empty icon="📊" text="No yield records yet. An admin will add these after your harvest." />
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
                </tr>
              </thead>
              <tbody>
                {profile.yield_records.map(y => (
                  <tr key={y.id}>
                    <td><strong>{y.hop_variety_name}</strong></td>
                    <td>{y.harvest_date}</td>
                    <td><span className="badge badge-green">{formatKg(y.quantity_kg)} kg</span></td>
                    <td style={{ color: "var(--fog)", fontSize: "0.82rem" }}>{y.notes || "—"}</td>
                    <td style={{ color: "var(--fog)", fontSize: "0.82rem" }}>{y.recorded_by_username || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
