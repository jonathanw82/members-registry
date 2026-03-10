// src/App.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Root component. Wires together auth, routing, and page rendering.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Router, useRouter }    from "./context/RouterContext";

// Layout
import Nav from "./components/layout/Nav";

// Pages
import PublicPage   from "./components/public/PublicPage";
import LoginPage    from "./components/public/LoginPage";
import RegisterPage from "./components/public/RegisterPage";
import ProfilePage  from "./components/member/ProfilePage";
import AdminPage    from "./components/admin/AdminPage";

// Styles — import order matters: variables first, then components, then page-specific
import "./styles/variables.css";
import "./styles/nav.css";
import "./styles/components.css";
import "./styles/public.css";

function AppContent() {
  const { user } = useAuth();
  const { page, navigate } = useRouter();

  // Guard routes
  useEffect(() => {
    if (!user && (page === "profile" || page === "admin")) navigate("login");
    if (user?.is_staff && page === "profile") navigate("admin");
  }, [user, page]);

  // Redirect already-logged-in users away from login/register
  useEffect(() => {
    if (user && (page === "login" || page === "register")) {
      navigate(user.is_staff ? "admin" : "profile");
    }
  }, [user, page]);

  return (
    <div className="app">
      <Nav />
      <main>
        {page === "public"   &&                          <PublicPage />}
        {page === "login"    && !user &&                 <LoginPage />}
        {page === "register" && !user &&                 <RegisterPage />}
        {page === "profile"  && user && !user.is_staff && <ProfilePage />}
        {page === "admin"    && user &&  user.is_staff && <AdminPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}