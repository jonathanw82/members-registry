// src/components/admin/AdminPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin dashboard shell. Two tabs: Members | Yield Entry
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import AdminMembers   from "./AdminMembers";
import AdminYields    from "./AdminYields";
import AdminCSVImport from "./AdminCSVImport";

export default function AdminPage() {
  const [tab, setTab] = useState("members");

  return (
    <div>
      <div className="page-header">
        <div className="tag">Admin Panel</div>
        <h1>Registry Management</h1>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "members" ? "active" : ""}`} onClick={() => setTab("members")}>
          Members
        </button>
        <button className={`tab ${tab === "yields"  ? "active" : ""}`} onClick={() => setTab("yields")}>
          Yield Entry
        </button>
        <button className={`tab ${tab === "import"  ? "active" : ""}`} onClick={() => setTab("import")}>
          CSV Import
        </button>
      </div>

      {tab === "members" && <AdminMembers />}
      {tab === "yields"  && <AdminYields />}
      {tab === "import"  && <AdminCSVImport />}
    </div>
  );
}
