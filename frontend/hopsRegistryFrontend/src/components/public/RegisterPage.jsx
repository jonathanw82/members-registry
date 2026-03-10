// src/components/public/RegisterPage.jsx

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "../../context/RouterContext";
import { useForm } from "../../hooks/useForm";
import { Alert, Spinner } from "../ui";

export default function RegisterPage() {
  const { register } = useAuth();
  const { navigate } = useRouter();
  const { values, field } = useForm({
    username: "", email: "", first_name: "", last_name: "",
    telephone: "", password: "", password2: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (values.password !== values.password2) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await register(values);
      navigate("profile");
    } catch (e) {
      const msgs = Object.entries(e || {})
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join(" | ");
      setError(msgs || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "2rem auto" }}>
      <div className="page-header" style={{ textAlign: "center" }}>
        <div className="tag">New Member</div>
        <h1>Join the Registry</h1>
      </div>

      <div className="card">
        <Alert msg={error} />

        <div className="form-row">
          <div className="form-group"><label>First Name</label><input {...field("first_name")} /></div>
          <div className="form-group"><label>Last Name</label><input {...field("last_name")} /></div>
        </div>

        <div className="form-group"><label>Username</label><input {...field("username")} /></div>
        <div className="form-group"><label>Email</label><input type="email" {...field("email")} /></div>
        <div className="form-group"><label>Telephone</label><input {...field("telephone")} /></div>

        <div className="form-row">
          <div className="form-group"><label>Password</label><input type="password" {...field("password")} /></div>
          <div className="form-group"><label>Confirm Password</label><input type="password" {...field("password2")} /></div>
        </div>

        <button className="btn btn-primary" style={{ width: "100%" }} onClick={submit} disabled={loading}>
          {loading ? <Spinner /> : "Create Account"}
        </button>

        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.82rem", color: "var(--fog)" }}>
          Already a member?{" "}
          <button
            className="nav-btn"
            style={{ display: "inline", padding: 0, color: "var(--forest)", textDecoration: "underline" }}
            onClick={() => navigate("login")}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
