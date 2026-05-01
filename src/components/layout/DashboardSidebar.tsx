"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, ShoppingCart, FileText,
  MessageSquare, BarChart3, Settings, LogOut,
  Pill, Building2, Users, Bell, ChevronRight,
} from "lucide-react";

interface SidebarProps {
  role: "PHARMACIST" | "PATIENT" | "WHOLESALER" | "ADMIN";
  userName?: string;
  pharmacyName?: string;
}

const NAV_PHARMACY = [
  { href: "/pharmacy/dashboard", icon: <LayoutDashboard size={18} />, label: "Tableau de bord" },
  { href: "/pharmacy/stock", icon: <Package size={18} />, label: "Gestion stock" },
  { href: "/pharmacy/orders", icon: <ShoppingCart size={18} />, label: "Commandes" },
  { href: "/pharmacy/prescriptions", icon: <FileText size={18} />, label: "Ordonnances" },
  { href: "/pharmacy/wholesale", icon: <Building2 size={18} />, label: "Commandes B2B" },
  { href: "/pharmacy/messages", icon: <MessageSquare size={18} />, label: "Messagerie" },
  { href: "/pharmacy/stats", icon: <BarChart3 size={18} />, label: "Statistiques" },
  { href: "/pharmacy/settings", icon: <Settings size={18} />, label: "Paramètres" },
];

const NAV_PATIENT = [
  { href: "/patient/dashboard", icon: <LayoutDashboard size={18} />, label: "Mon espace" },
  { href: "/rechercher", icon: <Pill size={18} />, label: "Rechercher" },
  { href: "/ordonnance", icon: <FileText size={18} />, label: "Mon ordonnance" },
  { href: "/patient/orders", icon: <ShoppingCart size={18} />, label: "Mes commandes" },
  { href: "/patient/messages", icon: <MessageSquare size={18} />, label: "Messagerie" },
  { href: "/patient/settings", icon: <Settings size={18} />, label: "Paramètres" },
];

const NAV_WHOLESALER = [
  { href: "/wholesaler/dashboard", icon: <LayoutDashboard size={18} />, label: "Tableau de bord" },
  { href: "/wholesaler/catalog", icon: <Package size={18} />, label: "Mon catalogue" },
  { href: "/wholesaler/orders", icon: <ShoppingCart size={18} />, label: "Commandes reçues" },
  { href: "/wholesaler/stats", icon: <BarChart3 size={18} />, label: "Statistiques" },
  { href: "/wholesaler/settings", icon: <Settings size={18} />, label: "Paramètres" },
];

const NAV_ADMIN = [
  { href: "/admin/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard Admin" },
  { href: "/admin/pharmacies", icon: <Pill size={18} />, label: "Pharmacies" },
  { href: "/admin/wholesalers", icon: <Building2 size={18} />, label: "Grossistes" },
  { href: "/admin/patients", icon: <Users size={18} />, label: "Patients" },
  { href: "/admin/medicines", icon: <Package size={18} />, label: "Médicaments" },
];

const NAV_MAP: Record<string, typeof NAV_PHARMACY> = {
  PHARMACIST: NAV_PHARMACY,
  PATIENT: NAV_PATIENT,
  WHOLESALER: NAV_WHOLESALER,
  ADMIN: NAV_ADMIN,
};

const ROLE_LABELS: Record<string, string> = {
  PHARMACIST: "Pharmacien", PATIENT: "Patient", WHOLESALER: "Grossiste", ADMIN: "Admin",
};

export default function DashboardSidebar({ role, userName, pharmacyName }: SidebarProps) {
  const pathname = usePathname();
  const nav = NAV_MAP[role] ?? NAV_PATIENT;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚕️</div>
        <div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1rem" }}>
            Medic<span style={{ color: "var(--accent-primary)" }}>algeria</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500 }}>
            {ROLE_LABELS[role]}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div style={{
        padding: "16px 16px 8px",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{
          background: "rgba(0,212,255,0.06)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "12px",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", flexShrink: 0,
          }}>
            {role === "PHARMACIST" ? "💊" : role === "WHOLESALER" ? "🏭" : role === "ADMIN" ? "🔑" : "👤"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
              {pharmacyName ?? userName ?? "Utilisateur"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{ROLE_LABELS[role]}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Navigation</div>
        {nav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} className={`sidebar-nav-item ${isActive ? "active" : ""}`}>
              {item.icon}
              <span>{item.label}</span>
              {isActive && <ChevronRight size={14} style={{ marginLeft: "auto" }} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px", borderTop: "1px solid var(--border-subtle)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="sidebar-nav-item"
          style={{ color: "var(--accent-danger)", width: "100%" }}
        >
          <LogOut size={18} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}
