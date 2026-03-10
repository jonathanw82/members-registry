// src/components/public/LoginPage.jsx

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "../../context/RouterContext";
import { useForm } from "../../hooks/useForm";
import { Alert, Spinner } from "../ui";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { navigate } = useRouter();
  const { values, field } = useForm({ username: "", password: "" });
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    try {
      const user = await login(values.username, values.password);
      navigate(user.is_staff ? "admin" : "profile");
    } catch {
      setError("Invalid username or password.");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "3rem auto" }}>
      <div className="page-header" style={{ textAlign: "center" }}>
        <div className="tag">Member Access</div>
        <h1>Sign In</h1>
      </div>

      <div className="card">
        <Alert msg={error} />

        <div className="form-group">
          <label>Username</label>
          <input {...field("username")} onKeyDown={e => e.key === "Enter" && submit()} />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input type="password" {...field("password")} onKeyDown={e => e.key === "Enter" && submit()} />
        </div>

        <button className="btn btn-primary" style={{ width: "100%" }} onClick={submit} disabled={loading}>
          {loading ? <Spinner /> : "Sign In"}
        </button>

        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.82rem", color: "var(--fog)" }}>
          No account? Please contact your administrator to request access.
        </p>
      </div>
    </div>
  );
}
