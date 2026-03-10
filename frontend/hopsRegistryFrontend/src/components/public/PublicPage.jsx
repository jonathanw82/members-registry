// src/components/public/PublicPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Public landing page — shows aggregate yields per hop variety.
// Includes a Chart.js bar chart of total yields by variety.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { Chart as ChartJS, registerables } from "chart.js";
import api from "../../api/client";
import { useRouter } from "../../context/RouterContext";
import { Loading } from "../ui";

// Register only the Chart.js components we need (keeps bundle small)
ChartJS.register(...registerables);

function formatKg(value) {
  const num = parseFloat(value);
  if (num < 0.01) return num.toFixed(5);   // small amounts: 0.00308
  if (num < 1)    return num.toFixed(3);   // medium: 0.583
  return num.toFixed(2);                   // normal: 120.50
}

export default function PublicPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { navigate }          = useRouter();

  const canvasRef = useRef(null);
  const chartRef  = useRef(null); // holds Chart instance so we can destroy/recreate

  useEffect(() => { loadPublicData(); }, []);

  // Build / rebuild the chart whenever data changes
  useEffect(() => {
    if (!data?.varieties?.length || !canvasRef.current) return;

    // Destroy previous instance to avoid "Canvas already in use" error
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const varieties = data.varieties;
    const labels    = varieties.map(v => v.name);
    const totals    = varieties.map(v => parseFloat(v.total.toFixed(2)));

    // Pull CSS variables so chart respects theme changes
    const style  = getComputedStyle(document.documentElement);
    const forest = style.getPropertyValue("--forest").trim() || "#8b0000";
    const gold   = style.getPropertyValue("--gold").trim()   || "#c9a84c";
    const fog    = style.getPropertyValue("--fog").trim()    || "#8a8878";
    const border = style.getPropertyValue("--border").trim() || "#c8c0ae";

    chartRef.current = new ChartJS(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Total Yield (kg)",
          data: totals,
          backgroundColor: varieties.map((_, i) =>
            i % 2 === 0 ? `${forest}cc` : `${gold}cc`
          ),
          borderColor: varieties.map((_, i) =>
            i % 2 === 0 ? forest : gold
          ),
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1a1a14",
            titleColor: gold,
            bodyColor: "#e8e4dc",
            padding: 12,
            cornerRadius: 6,
            callbacks: {
              label: ctx => ` ${ctx.parsed.y.toFixed(3)} kg`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: fog,
              font: { family: "'DM Mono', monospace", size: 11 },
            },
            border: { color: border },
          },
          y: {
            beginAtZero: true,
            grid: { color: `${border}88` },
            ticks: {
              color: fog,
              font: { family: "'DM Mono', monospace", size: 11 },
              callback: val => `${val} kg`,
            },
            border: { color: border },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data]);

  // ── Data loading ───────────────────────────────────────────────────────────

    async function loadPublicData() {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/api/public/yields/");
        const yields = await res.json();

        console.log("Public yields response:", yields); // ← add this

        if (!Array.isArray(yields) || yields.length === 0) {
          setData({ varieties: [], totalGrowers: 0 });
          return;
        }

       setData({
        varieties: yields.map(v => ({
          name:        v.name,
          description: v.description,
          total:       v.total_kg,
          growers:     v.grower_count,
          records:     v.record_count,
        })),
        totalGrowers: yields.reduce((max, v) => Math.max(max, v.grower_count), 0),
      });
      } catch (err) {
        console.error("Failed to load public yields:", err); // ← and this
        setData({ varieties: [], totalGrowers: 0 });
      } finally {
        setLoading(false);
      }
  }

  const maxYield = data?.varieties?.reduce((m, v) => Math.max(m, v.total), 1) || 1;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <h1>British Hop Harvest Registry</h1>
        <p>A transparent record of hop varieties grown and yields harvested across our member growers.</p>
        <div className="hero-btns">
          <button className="btn btn-gold" onClick={() => navigate("login")}>Member Login</button>
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          {/* Stats strip */}
          {data?.varieties?.length > 0 && (
            <div className="stats-strip">
              <div className="stat-box">
                <div className="num">{data.varieties.length}</div>
                <div className="lbl">Hop Varieties</div>
              </div>
              <div className="stat-box">
                <div className="num">{data.totalGrowers}</div>
                <div className="lbl">Growers</div>
              </div>
              <div className="stat-box">
                <div className="num">{data.varieties.reduce((s, v) => s + v.records, 0)}</div>
                <div className="lbl">Yield Records</div>
              </div>
              <div className="stat-box">
                <div className="num">{data.varieties.reduce((s, v) => s + v.total, 0).toFixed(3)}kg</div>
                <div className="lbl">Total Recorded</div>
              </div>
            </div>
          )}

          <div className="page-header">
            <div className="tag">All Varieties</div>
            <h1>Crop Yield Overview</h1>
            <p>Combined totals across all registered growers</p>
          </div>

          {data?.varieties?.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🌿</div>
              <p style={{ color: "var(--fog)", marginBottom: "1rem" }}>No public yield data available yet.</p>
              <p style={{ color: "var(--fog)", fontSize: "0.83rem" }}>
                Log in as an admin to see full data, or register as a grower to add your own.
              </p>
            </div>
          ) : (
            <>
              {/* ── Bar Chart ── */}
              <div className="card" style={{ marginBottom: "2rem" }}>
                <div style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fog)", marginBottom: "1.25rem" }}>
                  Total yield by variety (kg)
                </div>
                <canvas ref={canvasRef} style={{ maxHeight: 340 }} />
              </div>

              {/* ── Variety Cards ── */}
              <div className="hop-grid">
                {data.varieties.map((v, i) =>  (
                  <div className="hop-card" key={`${v.name}-${i}`}>
                    <div className="hop-card-top">
                      <h3>{v.name}</h3>
                      <p>{v.description || "A registered hop variety"}</p>
                    </div>
                    <div className="hop-card-body">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--fog)" }}>
                          {v.growers} grower{v.growers !== 1 ? "s" : ""} · {v.records} harvest{v.records !== 1 ? "s" : ""}
                        </span>
                        <span className="badge badge-green">{v.total.toFixed(1)} kg</span>
                      </div>
                      <div className="yield-bar-wrap">
                        <div className="yield-bar-track">
                          <div
                            className="yield-bar-fill"
                            style={{ width: `${Math.min(100, (v.total / maxYield) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}