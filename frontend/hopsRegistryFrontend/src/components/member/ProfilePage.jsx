// src/components/member/ProfilePage.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../api/client";
import { useForm } from "../../hooks/useForm";
import { Alert, Loading, Empty, Spinner } from "../ui";
import { Chart as ChartJS, registerables } from "chart.js";
ChartJS.register(...registerables);

function formatKg(value) {
  const num = parseFloat(value);
  if (num < 0.01) return num.toFixed(5);
  if (num < 1)    return num.toFixed(3);
  return num.toFixed(2);
}

// ─── Chart component — must be OUTSIDE ProfilePage ───────────────────────────
function ProfileYieldChart({ profile }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const varieties = profile?.hop_varieties || [];
  const yields    = profile?.yield_records  || [];

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    if (!varieties.length || !yields.length) return;

    const years = [...new Set(yields.map(y => y.harvest_date?.slice(0, 4)))].sort();

    const style  = getComputedStyle(document.documentElement);
    const forest = style.getPropertyValue("--forest").trim() || "#8b0000";
    const gold   = style.getPropertyValue("--gold").trim()   || "#c9a84c";
    const fog    = style.getPropertyValue("--fog").trim()    || "#8a8878";
    const border = style.getPropertyValue("--border").trim() || "#c8c0ae";

    const palette = [
      `${forest}dd`, `${gold}dd`, "#c0392bdd", "#d4760add",
      "#8b4513dd", "#6b8e23dd", "#4682b4dd", "#9370dbdd",
    ];

    const datasets = varieties.map((v, i) => ({
      label:           v.name,
      data:            years.map(year =>
        parseFloat(yields
          .filter(y => y.hop_variety === v.id && y.harvest_date?.startsWith(year))
          .reduce((sum, y) => sum + parseFloat(y.quantity_kg || 0), 0)
          .toFixed(5))
      ),
      backgroundColor: palette[i % palette.length],
      borderColor:     palette[i % palette.length].replace("dd", ""),
      borderWidth:     1.5,
      borderRadius:    4,
    }));

    if (!datasets.some(d => d.data.some(v => v > 0))) return;

    chartRef.current = new ChartJS(canvasRef.current, {
      type: "bar",
      data: { labels: years, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: {
              font:     { family: "'DM Mono', monospace", size: 10 },
              color:    fog,
              boxWidth: 12,
              padding:  12,
            },
          },
          tooltip: {
            backgroundColor: "#1a1a14",
            titleColor:      gold,
            bodyColor:       "#e8e4dc",
            padding:         10,
            cornerRadius:    6,
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} kg`,
            },
          },
        },
        scales: {
          x: {
            grid:   { display: false },
            ticks:  { color: fog, font: { family: "'DM Mono', monospace", size: 10 } },
            border: { color: border },
          },
          y: {
            beginAtZero: true,
            grid:   { color: `${border}66` },
            ticks:  {
              color: fog,
              font:  { family: "'DM Mono', monospace", size: 10 },
              callback: val => `${val}kg`,
            },
            border: { color: border },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    };
  }, [profile]);

  if (!varieties.length || !yields.length) return null;

  const totals = varieties.map(v => ({
    name:  v.name,
    total: yields
      .filter(y => y.hop_variety === v.id)
      .reduce((sum, y) => sum + parseFloat(y.quantity_kg || 0), 0),
  })).sort((a, b) => b.total - a.total);

  const grandTotal = totals.reduce((s, v) => s + v.total, 0);

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <div style={{ fontSize: "0.67rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fog)", marginBottom: "0.75rem" }}>
          Yield by variety per year (kg)
        </div>
        <canvas ref={canvasRef} style={{ maxHeight: 240 }} />
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.85rem" }}>
        <div style={{ fontSize: "0.67rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fog)", marginBottom: "0.6rem" }}>
          All-time totals
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {totals.map(v => (
            <div key={v.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem" }}>
              <span style={{ color: "var(--dark)", fontWeight: 500 }}>{v.name}</span>
              <span style={{ background: "var(--parchment)", border: "1px solid var(--border)", borderRadius: "3px", padding: "0.15rem 0.5rem", fontSize: "0.75rem", color: "var(--forest)", fontWeight: 500 }}>
                {v.total.toFixed(5).replace(/\.?0+$/, "") || "0"} kg
              </span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "0.4rem", marginTop: "0.2rem" }}>
            <span style={{ color: "var(--fog)", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Total</span>
            <span style={{ background: "var(--forest)", color: "var(--gold)", borderRadius: "3px", padding: "0.15rem 0.5rem", fontSize: "0.75rem", fontWeight: 500 }}>
              {grandTotal.toFixed(5).replace(/\.?0+$/, "") || "0"} kg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────
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

      <div className="tabs">
      <button className={`tab ${tab === "details"   ? "active" : ""}`} onClick={() => setTab("details")}>
        <span className="tab-short">Details</span>
        <span className="tab-long">My Details</span>
      </button>
      <button className={`tab ${tab === "varieties" ? "active" : ""}`} onClick={() => setTab("varieties")}>
        <span className="tab-short">Varieties ({profile.hop_varieties?.length || 0})</span>
        <span className="tab-long">Hop Varieties ({profile.hop_varieties?.length || 0})</span>
      </button>
      <button className={`tab ${tab === "yields" ? "active" : ""}`} onClick={() => setTab("yields")}>
        <span className="tab-short">Yields ({profile.yield_records?.length || 0})</span>
        <span className="tab-long">Yield Records ({profile.yield_records?.length || 0})</span>
      </button>
    </div>

      {/* ── Details ── */}
      {tab === "details" && (
        <div className="details-grid">
          <div className="card">
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
                  {Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              ) : (
                <input value={values.start_year || "Not set"} readOnly />
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
                <button className="btn btn-outline" onClick={() => { setEditMode(false); setMsg({}); }}>Cancel</button>
              </div>
            )}
          </div>

          {/* Chart sits alongside on wide screens */}
          <ProfileYieldChart profile={profile} />
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