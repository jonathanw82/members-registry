// src/components/admin/AdminMembers.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Searchable table of all members with view / delete actions.
// Clicking "View" opens AdminMemberModal for full CRUD on that member.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import api from "../../api/client";
import { Loading, Empty, ConfirmModal } from "../ui";
import AdminMemberModal from "./AdminMemberModal";
import AdminCreateMemberModal from "./AdminCreateMemberModal";


export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    const data = await api.get(`/admin/members/${qs}`);
    if (data) setMembers(data);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const deleteMember = (m) => {
  setConfirmModal({
    title:        m.is_active === false ? "Reactivate Member" : "Deactivate Member",
    message:      m.is_active === false
      ? `Reactivate "${m.full_name}"? They will be able to log in again.`
      : `Deactivate "${m.full_name}"? They will no longer be able to log in but all their yield history will be preserved.`,
    confirmLabel: m.is_active === false ? "Reactivate" : "Deactivate",
    confirmStyle: m.is_active === false ? "btn-primary" : "btn-danger",
    onConfirm: async () => {
      setConfirmModal(null);
        if (m.is_active === false) {
          await api.patch(`/admin/members/${m.id}/`, { is_active: true });
        } else {
          await api.delete(`/admin/members/${m.id}/`);
        }
        await load();
      },
    });
  };

  const anonymiseMember = (m) => {
  setConfirmModal({
      title:        "Anonymise Member",
      message:      `This will remove all personal details for "${m.full_name}" including their name, email and telephone. Their yield history will be preserved under their membership number. This cannot be undone.`,
      confirmLabel: "Anonymise",
      confirmStyle: "btn-danger",
      onConfirm: async () => {
        setConfirmModal(null);
        await api.post(`/admin/members/${m.id}/anonymise/`, {});
        await load();
      },
    });
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
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          confirmStyle={confirmModal.confirmStyle}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </>
  );
}
