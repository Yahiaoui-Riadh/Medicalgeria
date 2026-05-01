import Link from "next/link";
import { Search, ShoppingCart, Package, TrendingUp, MapPin, Shield, Clock, Star, ChevronRight, Activity, Pill, Building2, Users } from "lucide-react";

const stats = [
  { value: "2,800+", label: "Médicaments référencés" },
  { value: "580+", label: "Pharmacies connectées" },
  { value: "48", label: "Wilayas couvertes" },
  { value: "15k+", label: "Patients actifs" },
];

const features = [
  {
    icon: <Search size={24} />,
    title: "Recherche géolocalisée",
    desc: "Trouvez instantanément vos médicaments dans les pharmacies proches, avec disponibilité en temps réel.",
    color: "var(--accent-primary)",
  },
  {
    icon: <Package size={24} />,
    title: "Gestion de stock intelligente",
    desc: "Gérez votre inventaire, alertes d'expiration et ruptures, commandes B2B chez le grossiste en 1 clic.",
    color: "var(--accent-success)",
  },
  {
    icon: <Activity size={24} />,
    title: "OCR Ordonnances",
    desc: "Photographiez votre ordonnance — l'IA extrait automatiquement les médicaments et génère votre panier.",
    color: "var(--accent-purple)",
  },
  {
    icon: <TrendingUp size={24} />,
    title: "B2B Grossiste",
    desc: "Pharmaciens : comparez les catalogues grossistes et réapprovisionnez au meilleur prix en quelques minutes.",
    color: "var(--accent-warning)",
  },
  {
    icon: <Shield size={24} />,
    title: "Conformité HIPAA/RGPD",
    desc: "Données de santé chiffrées, journalisation d'audit complète, soft-delete et conservation réglementaire.",
    color: "var(--accent-danger)",
  },
  {
    icon: <Clock size={24} />,
    title: "Temps réel",
    desc: "Notifications push, messagerie sécurisée et suivi de commande en temps réel via Socket.io.",
    color: "var(--accent-secondary)",
  },
];

const roles = [
  {
    icon: <Users size={32} />,
    title: "Patient",
    desc: "Recherchez vos médicaments, uploadez votre ordonnance et suivez vos commandes.",
    link: "/register?role=patient",
    color: "var(--accent-primary)",
    bg: "rgba(0, 212, 255, 0.08)",
    border: "rgba(0, 212, 255, 0.2)",
  },
  {
    icon: <Pill size={32} />,
    title: "Pharmacien",
    desc: "Gérez votre stock, traitez les ordonnances et commandez chez vos grossistes.",
    link: "/register?role=pharmacy",
    color: "var(--accent-success)",
    bg: "rgba(0, 229, 160, 0.08)",
    border: "rgba(0, 229, 160, 0.2)",
  },
  {
    icon: <Building2 size={32} />,
    title: "Grossiste",
    desc: "Publiez votre catalogue, recevez les commandes des pharmacies et gérez vos livraisons.",
    link: "/register?role=wholesaler",
    color: "var(--accent-warning)",
    bg: "rgba(255, 179, 0, 0.08)",
    border: "rgba(255, 179, 0, 0.2)",
  },
];

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      {/* ── Navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(5, 13, 26, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "0 40px",
        height: "68px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px", height: "36px",
            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px",
          }}>⚕️</div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "var(--text-primary)" }}>
            Medic<span style={{ color: "var(--accent-primary)" }}>algeria</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/ordonnance" style={{ color: "var(--accent-primary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 700, padding: "8px 16px", border: "1px solid rgba(0, 212, 255, 0.2)", borderRadius: "20px", background: "rgba(0, 212, 255, 0.05)" }}>
            📸 Scanner Ordonnance
          </Link>
          <Link href="/rechercher" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, padding: "8px 16px" }}>
            Rechercher
          </Link>
          <Link href="/login" className="btn-secondary" style={{ padding: "8px 20px", fontSize: "0.875rem" }}>
            Connexion
          </Link>
          <Link href="/register" className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.875rem" }}>
            S'inscrire
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-bg" style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        textAlign: "center",
        padding: "100px 24px 60px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: "15%", left: "8%",
          width: "300px", height: "300px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "20%", right: "10%",
          width: "250px", height: "250px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: "800px", position: "relative", zIndex: 1 }} className="animate-fade-in">
          <div className="badge badge-primary" style={{ marginBottom: "24px", fontSize: "0.8rem" }}>
            <Activity size={12} /> Plateforme Santé Numérique Algérienne
          </div>

          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: "24px",
            color: "var(--text-primary)",
          }}>
            La pharmacie algérienne<br />
            <span className="gradient-text">connectée & intelligente</span>
          </h1>

          <p style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "var(--text-secondary)",
            maxWidth: "600px",
            margin: "0 auto 40px",
            lineHeight: 1.7,
          }}>
            Patients, pharmaciens et grossistes sur une seule plateforme.
            Trouvez vos médicaments en temps réel, gérez votre stock, et optimisez votre chaîne B2B.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", marginBottom: "60px" }}>
            <Link href="/rechercher" className="btn-primary" style={{ fontSize: "1rem", padding: "14px 32px" }}>
              <Search size={18} /> Trouver un médicament
            </Link>
            <Link href="/register" className="btn-secondary" style={{ fontSize: "1rem", padding: "14px 32px" }}>
              Créer un compte <ChevronRight size={18} />
            </Link>
          </div>

          {/* Quick search bar */}
          <div style={{
            maxWidth: "560px", margin: "0 auto",
            background: "var(--bg-glass)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--border-default)",
            borderRadius: "50px",
            padding: "8px 8px 8px 24px",
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <Search size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", flex: 1, textAlign: "left" }}>
              Rechercher : Doliprane, Amoxicilline, Metformine...
            </span>
            <Link href="/rechercher" className="btn-primary" style={{ borderRadius: "50px", padding: "10px 20px", fontSize: "0.875rem" }}>
              Rechercher
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{
        padding: "60px 40px",
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{
          maxWidth: "1100px", margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "32px",
          textAlign: "center",
        }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "2.8rem", fontWeight: 900, color: "var(--accent-primary)", lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "8px", fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "100px 40px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, marginBottom: "16px" }}>
            Une plateforme,{" "}
            <span className="gradient-text">trois acteurs, zéro friction</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto" }}>
            Tous les outils dont vous avez besoin pour digitaliser la chaîne pharmaceutique algérienne.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {features.map((f, i) => (
            <div key={i} className="glass-card" style={{ padding: "32px" }}>
              <div style={{
                width: "52px", height: "52px",
                background: `${f.color}18`,
                border: `1px solid ${f.color}40`,
                borderRadius: "14px",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: f.color, marginBottom: "20px",
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "12px" }}>{f.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Roles CTA ── */}
      <section style={{
        padding: "80px 40px",
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-subtle)",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, marginBottom: "16px" }}>
            Rejoignez <span className="gradient-text">l'écosystème Medicalgeria</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "48px" }}>
            Choisissez votre profil pour commencer
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {roles.map((r, i) => (
              <Link key={i} href={r.link} style={{ textDecoration: "none" }}>
                <div style={{
                  background: r.bg,
                  border: `1px solid ${r.border}`,
                  borderRadius: "var(--radius-xl)",
                  padding: "40px 32px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  textAlign: "center", gap: "16px",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{ color: r.color, marginBottom: "4px" }}>{r.icon}</div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: r.color }}>{r.title}</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>{r.desc}</p>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    color: r.color, fontWeight: 600, fontSize: "0.875rem",
                    marginTop: "8px",
                  }}>
                    S'inscrire <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: "48px 40px",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap",
        gap: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>⚕️</span>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
            Medic<span style={{ color: "var(--accent-primary)" }}>algeria</span>
          </span>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          © 2026 Medicalgeria. Plateforme de santé numérique algérienne. Toutes données protégées HIPAA/RGPD.
        </p>
        <div style={{ display: "flex", gap: "24px" }}>
          {["CGU", "Confidentialité", "Contact"].map((l) => (
            <a key={l} href="#" style={{ color: "var(--text-muted)", fontSize: "0.8rem", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
      </footer>
    </main>
  );
}
