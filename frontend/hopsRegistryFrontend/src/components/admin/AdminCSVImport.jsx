// src/components/admin/AdminCSVImport.jsx
// ─────────────────────────────────────────────────────────────────────────────
// CSV bulk import for new members. Accepts a CSV with columns:
// first_name, last_name, email, telephone (optional)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { API_BASE } from "../../api/client";
import { Alert, Spinner } from "../ui";

export default function AdminCSVImport() {
  const [file, setFile]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState("");
  const fileInputRef            = useRef(null);

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (selected && !selected.name.endsWith(".csv")) {
      setError("Please select a .csv file.");
      setFile(null);
      return;
    }
    setError("");
    setResult(null);
    setFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      if (!dropped.name.endsWith(".csv")) {
        setError("Please drop a .csv file.");
        return;
      }
      setError("");
      setResult(null);
      setFile(dropped);
    }
  };

  const submit = async () => {
    if (!file) { setError("Please select a CSV file first."); return; }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("access_token");
      const res   = await fetch(`${API_BASE}/admin/members/import-csv/`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Import failed.");
        return;
      }
      setResult(data);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError("Network error — is the Django server running?");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv     = "first_name,last_name,email,telephone\nJohn,Smith,john@example.com,07700900001\nJane,Doe,jane@example.com,";
    const blob    = new Blob([csv], { type: "text/csv" });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement("a");
    a.href        = url;
    a.download    = "member_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p style={{ color: "var(--fog)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Upload a CSV file to bulk-create member accounts. Each member will receive an auto-generated username and temporary password.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={downloadTemplate}>
          ↓ Download Template
        </button>
      </div>

      {/* Expected format info */}
      <div className="card" style={{ background: "var(--parchment)", marginBottom: "1.5rem", padding: "1.25rem" }}>
        <div style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fog)", marginBottom: "0.75rem" }}>
          Expected CSV Format
        </div>
        <code style={{ fontSize: "0.8rem", color: "var(--dark)", display: "block", lineHeight: 1.8 }}>
          first_name, last_name, email, telephone<br />
          John, Smith, john@example.com, 07700900001<br />
          Jane, Doe, jane@example.com,
        </code>
        <div style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--fog)" }}>
          • <strong>Required:</strong> first_name, last_name, email<br />
          • <strong>Optional:</strong> telephone<br />
          • Usernames and passwords are generated automatically<br />
          • Rows with an already-registered email are skipped
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${file ? "var(--moss)" : "var(--border)"}`,
          borderRadius: "8px",
          padding: "2.5rem",
          textAlign: "center",
          cursor: "pointer",
          background: file ? "#f0f7f0" : "white",
          transition: "all 0.2s",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📄</div>
        {file ? (
          <>
            <div style={{ fontWeight: 500, color: "var(--forest)" }}>{file.name}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--fog)", marginTop: "0.25rem" }}>
              {(file.size / 1024).toFixed(1)} KB — click to change
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 500, color: "var(--dark)" }}>Drop CSV here or click to browse</div>
            <div style={{ fontSize: "0.78rem", color: "var(--fog)", marginTop: "0.25rem" }}>.csv files only</div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          style={{ display: "none" }}
        />
      </div>

      <Alert msg={error} />

      <button
        className="btn btn-primary"
        onClick={submit}
        disabled={loading || !file}
        style={{ width: "100%", justifyContent: "center" }}
      >
        {loading ? <><Spinner /> &nbsp;Importing...</> : "Import Members"}
      </button>

      {/* Results */}
      {result && (
        <div style={{ marginTop: "1.5rem" }}>

          {/* Summary badges */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <div className="stat-box" style={{ flex: 1, minWidth: 120 }}>
              <div className="num" style={{ color: "var(--moss)" }}>{result.summary.created}</div>
              <div className="lbl">Created</div>
            </div>
            <div className="stat-box" style={{ flex: 1, minWidth: 120 }}>
              <div className="num" style={{ color: "var(--amber)" }}>{result.summary.skipped}</div>
              <div className="lbl">Skipped</div>
            </div>
            <div className="stat-box" style={{ flex: 1, minWidth: 120 }}>
              <div className="num" style={{ color: "var(--rust)" }}>{result.summary.errors}</div>
              <div className="lbl">Errors</div>
            </div>
          </div>

          {/* Created members — show temp passwords */}
          {result.created.length > 0 && (
            <>
              <div style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fog)", marginBottom: "0.75rem" }}>
                ✅ Created members — share these credentials securely
              </div>
              <div className="table-wrap" style={{ marginBottom: "1.25rem" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Username</th>
                      <th>Temp Password</th>
                      <th>Membership No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.created.map((m, i) => (
                      <tr key={i}>
                        <td>{m.full_name}</td>
                        <td style={{ color: "var(--fog)" }}>{m.email}</td>
                        <td><code>{m.username}</code></td>
                        <td>
                          <code style={{ background: "var(--parchment)", padding: "0.2rem 0.5rem", borderRadius: "3px", fontSize: "0.85rem" }}>
                            {m.temp_password}
                          </code>
                        </td>
                        <td><span className="mem-chip">{m.membership_number}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Skipped rows */}
          {result.skipped.length > 0 && (
            <>
              <div style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fog)", marginBottom: "0.75rem" }}>
                ⚠️ Skipped rows
              </div>
              <div className="table-wrap" style={{ marginBottom: "1.25rem" }}>
                <table>
                  <thead><tr><th>Row</th><th>Email</th><th>Reason</th></tr></thead>
                  <tbody>
                    {result.skipped.map((s, i) => (
                      <tr key={i}>
                        <td>{s.row}</td>
                        <td>{s.email}</td>
                        <td style={{ color: "var(--amber)" }}>{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <>
              <div style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fog)", marginBottom: "0.75rem" }}>
                ❌ Errors
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Row</th><th>Reason</th></tr></thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={i}>
                        <td>{e.row}</td>
                        <td style={{ color: "var(--rust)" }}>{e.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}