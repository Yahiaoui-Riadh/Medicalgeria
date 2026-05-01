"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle, AlertCircle, User, Pill, Building2 } from "lucide-react";
import { WILAYAS } from "@/types";

type RoleKey = "PATIENT" | "PHARMACIST" | "WHOLESALER";

const ROLES: { key: RoleKey; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  { key: "PATIENT", label: "Patient", icon: <User size={22} />, desc: "Rechercher et commander des médicaments", color: "var(--accent-primary)" },
  { key: "PHARMACIST", label: "Pharmacien", icon: <Pill size={22} />, desc: "Gérer mon officine et traiter les commandes", color: "var(--accent-success)" },
  { key: "WHOLESALER", label: "Grossiste", icon: <Building2 size={22} />, desc: "Gérer mon catalogue et mes livraisons B2B", color: "var(--accent-warning)" },
];

const DAYS_FR: Record<string, string> = {
  monday: "Lundi", tuesday: "Mardi", wednesday: "Mercredi",
  thursday: "Jeudi", friday: "Vendredi", saturday: "Samedi", sunday: "Dimanche",
};

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initRole = (params.get("role")?.toUpperCase() ?? "PATIENT") as RoleKey;

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<RoleKey>(initRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Step 1 — Common
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Patient
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");

  // Pharmacy
  const [pharmacyName, setPharmacyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [city, setCity] = useState("");
  const [wilaya, setWilaya] = useState("16");
  const [hours, setHours] = useState<Record<string, string>>({
    monday: "08:00-19:00", tuesday: "08:00-19:00", wednesday: "08:00-19:00",
    thursday: "08:00-19:00", friday: "08:00-12:00", saturday: "08:00-19:00", sunday: "fermé",
  });

  // Wholesaler
  const [companyName, setCompanyName] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [taxId, setTaxId] = useState("");

  function validateStep1() {
    if (!email.trim()) return "Email requis";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email invalide";
    if (password.length < 8) return "Mot de passe : 8 caractères minimum";
    if (!/[A-Z]/.test(password)) return "Mot de passe : au moins une majuscule";
    if (!/[0-9]/.test(password)) return "Mot de passe : au moins un chiffre";
    if (!/[^A-Za-z0-9]/.test(password)) return "Mot de passe : au moins un symbole";
    if (!phone.trim()) return "Téléphone requis";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validateStep1();
    if (err) { setError(err); return; }

    setLoading(true);
    setError(null);

    const endpointMap: Record<RoleKey, string> = {
      PATIENT: "/api/auth/register/patient",
      PHARMACIST: "/api/auth/register/pharmacy",
      WHOLESALER: "/api/auth/register/wholesaler",
    };

    const bodies: Record<RoleKey, object> = {
      PATIENT: { email, password, phone, fullName, dateOfBirth: dateOfBirth || undefined, address: address || undefined },
      PHARMACIST: { email, password, phone, name: pharmacyName, licenseNumber, address, city, wilaya, openingHours: hours },
      WHOLESALER: { email, password, phone, companyName, rcNumber, taxId, address, wilaya },
    };

    try {
      const res = await fetch(endpointMap[role], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodies[role]),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }} className="hero-bg">
        <div className="glass-card animate-fade-in" style={{ padding: "60px", textAlign: "center", maxWidth: "400px" }}>
          <CheckCircle size={56} style={{ color: "var(--accent-success)", margin: "0 auto 20px" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "12px" }}>Compte créé !</h2>
          <p style={{ color: "var(--text-secondary)" }}>Redirection vers la connexion…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} className="hero-bg">
      <div style={{ width: "100%", maxWidth: "520px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.4rem" }}>
              ⚕️ Medic<span style={{ color: "var(--accent-primary)" }}>algeria</span>
            </span>
          </Link>
        </div>

        <div className="glass-card" style={{ padding: "40px" }}>
          {/* Step indicator */}
          <div className="step-indicator" style={{ marginBottom: "32px" }}>
            {[1, 2].map((s, i) => (
              <div key={s} className="step" style={{ flex: i < 1 ? "0 0 auto" : 1 }}>
                <div className={`step-dot ${step > s ? "completed" : step === s ? "active" : ""}`}>{s > step ? s : step > s ? "✓" : s}</div>
                {i < 1 && <div className={`step-line ${step > 1 ? "completed" : ""}`} />}
              </div>
            ))}
          </div>

          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "24px", textAlign: "center" }}>
            {step === 1 ? "Créer un compte" : "Compléter votre profil"}
          </h1>

          {error && (
            <div style={{ display: "flex", gap: "10px", padding: "12px 16px", background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", borderRadius: "var(--radius-sm)", color: "var(--accent-danger)", fontSize: "0.875rem", marginBottom: "20px" }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} /> {error}
            </div>
          )}

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); const err = validateStep1(); if (err) { setError(err); } else { setError(null); setStep(2); } } : handleSubmit}>
            {/* ── Step 1 ── */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Role selector */}
                <div className="input-group">
                  <label className="input-label">Vous êtes</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                    {ROLES.map((r) => (
                      <button key={r.key} type="button" onClick={() => setRole(r.key)} style={{
                        padding: "14px 8px", border: `1px solid ${role === r.key ? r.color : "var(--border-subtle)"}`,
                        borderRadius: "var(--radius-md)", background: role === r.key ? `${r.color}15` : "var(--bg-card)",
                        color: role === r.key ? r.color : "var(--text-secondary)",
                        cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column",
                        alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: 600,
                      }}>
                        {r.icon} {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="reg-email">Email</label>
                  <input id="reg-email" type="email" className="input-field" placeholder="votre@email.dz"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="reg-phone">Téléphone</label>
                  <input id="reg-phone" type="tel" className="input-field" placeholder="0555 00 00 00"
                    value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="reg-password">Mot de passe</label>
                  <div style={{ position: "relative" }}>
                    <input id="reg-password" type={showPw ? "text" : "password"} className="input-field"
                      placeholder="Min. 8 car., 1 maj., 1 chiffre, 1 symbole"
                      value={password} onChange={(e) => setPassword(e.target.value)} required
                      style={{ paddingRight: "48px" }} />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{
                      position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                    }}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ width: "100%", padding: "14px", marginTop: "8px" }}>
                  Continuer →
                </button>
              </div>
            )}

            {/* ── Step 2 — Patient ── */}
            {step === 2 && role === "PATIENT" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="input-group">
                  <label className="input-label">Nom complet *</label>
                  <input type="text" className="input-field" placeholder="Prénom Nom" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Date de naissance</label>
                  <input type="date" className="input-field" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Adresse</label>
                  <input type="text" className="input-field" placeholder="Rue, ville" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>← Retour</button>
                  <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>
                    {loading ? <span className="spinner" /> : null} {loading ? "Création..." : "Créer mon compte"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2 — Pharmacy ── */}
            {step === 2 && role === "PHARMACIST" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="input-group">
                  <label className="input-label">Nom de la pharmacie *</label>
                  <input type="text" className="input-field" placeholder="Pharmacie El Shifa" value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">N° Autorisation d'exploitation *</label>
                  <input type="text" className="input-field" placeholder="AE-16-2024-XXXX" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="input-group">
                    <label className="input-label">Ville *</label>
                    <input type="text" className="input-field" placeholder="Alger" value={city} onChange={(e) => setCity(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Wilaya *</label>
                    <select className="input-field" value={wilaya} onChange={(e) => setWilaya(e.target.value)}>
                      {WILAYAS.map((w) => <option key={w.code} value={w.code}>{w.code} - {w.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Adresse complète *</label>
                  <input type="text" className="input-field" placeholder="N° rue, quartier" value={address} onChange={(e) => setAddress(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Horaires d'ouverture</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {Object.entries(hours).map(([day, val]) => (
                      <div key={day} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ width: "80px", fontSize: "0.8rem", color: "var(--text-secondary)", flexShrink: 0 }}>{DAYS_FR[day]}</span>
                        <input type="text" className="input-field" style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem" }}
                          value={val} onChange={(e) => setHours((h) => ({ ...h, [day]: e.target.value }))}
                          placeholder="08:00-19:00 ou fermé" />
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>← Retour</button>
                  <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>
                    {loading ? <span className="spinner" /> : null} {loading ? "Création..." : "Créer mon compte"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2 — Wholesaler ── */}
            {step === 2 && role === "WHOLESALER" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="input-group">
                  <label className="input-label">Raison sociale *</label>
                  <input type="text" className="input-field" placeholder="SARL Pharma Distribution" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="input-group">
                    <label className="input-label">N° RC *</label>
                    <input type="text" className="input-field" placeholder="16/00-123456B16" value={rcNumber} onChange={(e) => setRcNumber(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">NIF *</label>
                    <input type="text" className="input-field" placeholder="000016012345678" value={taxId} onChange={(e) => setTaxId(e.target.value)} required />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Adresse *</label>
                  <input type="text" className="input-field" placeholder="Zone industrielle, ville" value={address} onChange={(e) => setAddress(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Wilaya *</label>
                  <select className="input-field" value={wilaya} onChange={(e) => setWilaya(e.target.value)}>
                    {WILAYAS.map((w) => <option key={w.code} value={w.code}>{w.code} - {w.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>← Retour</button>
                  <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>
                    {loading ? <span className="spinner" /> : null} {loading ? "Création..." : "Créer mon compte"}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Déjà inscrit ?{" "}
            <Link href="/login" style={{ color: "var(--accent-primary)", fontWeight: 600, textDecoration: "none" }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
