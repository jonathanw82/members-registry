
import { useState } from "react";
import AdminMembers   from "./AdminMembers";
import AdminYields    from "./AdminYields";
import AdminCSVImport from "./AdminCSVImport";
import { useAuth } from "../../context/AuthContext";


export default function AdminPage() {
  const [tab, setTab] = useState("members");
  const { user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <div className="tag">Admin Panel</div>
         <p>Logged in as <strong>{user?.first_name} {user?.last_name}</strong></p>
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
