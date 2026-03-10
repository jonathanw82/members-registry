// src/components/admin/AdminMembers.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Searchable table of all members with view / delete actions.
// Clicking "View" opens AdminMemberModal for full CRUD on that member.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import api from "../../api/client";
import { Loading, Empty } from "../ui";
import AdminMemberModal from "./AdminMemberModal";
import AdminCreateMemberModal from "./AdminCreateMemberModal";

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    const data = await api.get(`/admin/members/${qs}`);
    if (data) setMembers(data);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const deleteMember = async (m) => {
    if (m.is_active === false) {
      // Reactivate
      if (!confirm(`Reactivate "${m.full_name}"? They will be able to log in again.`)) return;
      await api.patch(`/admin/members/${m.id}/`, { is_active: true });
    } else {
      // Deactivate
      if (!confirm(`Deactivate "${m.full_name}"? They will no longer be able to log in but all their yield history will be preserved.`)) return;
      await api.delete(`/admin/members/${m.id}/`);
    }
    await load();
  };

  const anonymiseMember = async (m) => {
    if (!confirm(
      `Anonymise "${m.full_name}"?\n\n` +
      `This will:\n` +
      `• Remove their name, email and telephone\n` +
      `• Deactivate their account\n` +
      `• Preserve all yield history under their membership number\n\n` +
      `This cannot be undone.`
    )) return;
    await api.post(`/admin/members/${m.id}/anonymise/`, {});
    await load();
  };

  return (
    <>
      <div className="search-bar">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or membership no..."
        />
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New Member
        </button>
      </div>

      {loading ? <Loading /> : members.length === 0 ? (
        <Empty icon="👤" text="No members found." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Membership No.</th>
                <th>Name</th>
                <th>Email</th>
                <th>Telephone</th>
                <th>Varieties</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td><span className="mem-chip">{m.membership_number}</span></td>
                 <td>
                    <strong>{m.full_name}</strong>
                    {m.is_active === false && (
                      <span className="badge badge-grey" style={{ marginLeft: "0.5rem" }}>Inactive</span>
                    )}
                    {m.username?.startsWith("anon_") && (
                      <span className="badge badge-gold" style={{ marginLeft: "0.5rem" }}>Anonymised</span>
                    )}
                  </td>
                  <td style={{ color: "var(--fog)" }}>{m.email}</td>
                  <td style={{ color: "var(--fog)" }}>{m.telephone || "—"}</td>
                  <td><span className="badge badge-green">{m.hop_variety_count}</span></td>
                 <td>
                  <div className="actions">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelected(m)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteMember(m)}
                    >
                      {m.is_active === false ? "Reactivate" : "Deactivate"}
                    </button>
                    {m.is_active !== false && (
                      <button
                        className="btn btn-sm"
                        style={{ background: "var(--amber)", color: "white" }}
                        onClick={() => anonymiseMember(m)}>
                        Anonymise
                      </button>
                    )}
                  </div>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected   && <AdminMemberModal memberId={selected.id} onClose={() => { setSelected(null); load(); }} />}
      {showCreate && <AdminCreateMemberModal onClose={() => { setShowCreate(false); load(); }} />}
    </>
  );
}
