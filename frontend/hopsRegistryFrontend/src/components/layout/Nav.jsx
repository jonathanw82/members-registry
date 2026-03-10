// src/components/layout/Nav.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Top navigation bar. Shows different links based on auth state.
// ─────────────────────────────────────────────────────────────────────────────

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "../../context/RouterContext";

export default function Nav() {
  const { user, logout } = useAuth();
  const { page, navigate } = useRouter();

  return (
    <nav>
      <div className="nav-brand" onClick={() => navigate("public")}>
        <span>🌿</span> BRISTOL HOPS COLLECTIVE
      </div>

      <div className="nav-links">
        {/* Always visible */}
        <button
          className={`nav-btn ${page === "public" ? "active" : ""}`}
          onClick={() => navigate("public")}
        >
          Crop Yields
        </button>

        {/* Logged out */}
        {!user && (
          <>
            <div className="nav-divider" />
            <button
              className={`nav-btn ${page === "login" ? "active" : ""}`}
              onClick={() => navigate("login")}
            >
              Login
            </button>
            {/* <button
              className="nav-btn primary"
              onClick={() => navigate("register")}
            >
              Register
            </button> */}
          </>
        )}

        {/* Regular member */}
        {user && !user.is_staff && (
          <>
            <div className="nav-divider" />
            <button
              className={`nav-btn ${page === "profile" ? "active" : ""}`}
              onClick={() => navigate("profile")}
            >
              My Profile
            </button>
          </>
        )}

        {/* Admin */}
        {user && user.is_staff && (
          <>
            <div className="nav-divider" />
            <button
              className={`nav-btn ${page === "admin" ? "active" : ""}`}
              onClick={() => navigate("admin")}
            >
              Admin
            </button>
          </>
        )}

        {/* Logged in — logout */}
        {user && (
          <>
            <div className="nav-divider" />
            <button className="nav-btn" onClick={logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
