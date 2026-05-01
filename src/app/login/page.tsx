"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const errorParam = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "unauthorized" ? "Accès refusé pour votre rôle." : null
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    // Redirect based on role — middleware handles it
    router.push(callbackUrl === "/" ? "/dashboard" : callbackUrl);
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-primary)",
      padding: "24px",
    }} className="hero-bg">
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "56px", height: "56px",
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              borderRadius: "16px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "28px",
            }}>⚕️</div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "var(--text-primary)" }}>
              Medic<span style={{ color: "var(--accent-primary)" }}>algeria</span>
            </span>
          </Link>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontSize: "0.9rem" }}>
            Connectez-vous à votre espace
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: "40px" }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "28px", textAlign: "center" }}>
            Connexion
          </h1>

          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "12px 16px",
              background: "rgba(255,71,87,0.1)",
              border: "1px solid rgba(255,71,87,0.3)",
              borderRadius: "var(--radius-sm)",
              color: "var(--accent-danger)",
              fontSize: "0.875rem",
              marginBottom: "24px",
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="input-group">
              <label className="input-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="votre@email.dz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="login-password">Mot de passe</label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: "48px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-muted)",
                  }}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <a href="#" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", textDecoration: "none" }}>
                Mot de passe oublié ?
              </a>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "14px" }}>
              {loading ? <span className="spinner" /> : <LogIn size={18} />}
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "28px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Pas encore de compte ?{" "}
            <Link href="/register" style={{ color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none" }}>
              Créer un compte
            </Link>
          </p>
        </div>

        {/* Demo accounts */}
        <div style={{
          marginTop: "20px",
          background: "rgba(0,212,255,0.05)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "16px",
          fontSize: "0.78rem",
          color: "var(--text-muted)",
        }}>
          <strong style={{ color: "var(--text-secondary)" }}>Comptes démo :</strong>
          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span>🧑 Patient : patient@demo.dz / Demo@2026</span>
            <span>💊 Pharmacien : pharma@demo.dz / Demo@2026</span>
            <span>🏭 Grossiste : grossiste@demo.dz / Demo@2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
