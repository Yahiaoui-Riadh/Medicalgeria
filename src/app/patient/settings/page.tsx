"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { User, Bell, Shield, MapPin, Save, ToggleLeft, ToggleRight, Key, Mail, Phone, Heart } from "lucide-react";

type TabType = "profile" | "health" | "notifications" | "security";

export default function PatientSettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [notifications, setNotifications] = useState({
    orderStatus: true,
    promoAlerts: false,
    messageAlerts: true
  });

  const role = (session?.user as any)?.role ?? "PATIENT";

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="glass-card animate-fade-in" style={{ padding: "30px", maxWidth: "800px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px" }}>
              <User size={20} color="var(--accent-primary)" /> Informations personnelles
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div className="form-group">
                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>Nom complet</label>
                <input type="text" className="input-field" defaultValue={(session?.user as any)?.name} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>Date de naissance</label>
                <input type="date" className="input-field" defaultValue="1990-01-01" />
              </div>
              <div className="form-group">
                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>Téléphone</label>
                <input type="tel" className="input-field" defaultValue="+213 5XX XX XX XX" />
              </div>
              <div className="form-group">
                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>Email</label>
                <input type="email" className="input-field" defaultValue={session?.user?.email ?? ""} />
              </div>
              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>Adresse de résidence</label>
                <input type="text" className="input-field" defaultValue="Alger, Algérie" />
              </div>
            </div>
          </div>
        );
      case "health":
        return (
          <div className="glass-card animate-fade-in" style={{ padding: "30px", maxWidth: "800px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Heart size={20} color="var(--accent-danger)" /> Carnet de santé numérique
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
               <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>Allergies connues</label>
                  <textarea className="input-field" style={{ minHeight: "80px" }} placeholder="ex: Pénicilline, Pollen..."></textarea>
               </div>
               <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>Maladies chroniques</label>
                  <textarea className="input-field" style={{ minHeight: "80px" }} placeholder="ex: Diabète, Hypertension..."></textarea>
               </div>
               <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>Groupe sanguin</label>
                  <select className="input-field" style={{ width: "150px" }}>
                    <option>O+</option><option>O-</option><option>A+</option><option>A-</option>
                    <option>B+</option><option>B-</option><option>AB+</option><option>AB-</option>
                  </select>
               </div>
            </div>
          </div>
        );
      case "notifications":
        return (
          <div className="glass-card animate-fade-in" style={{ padding: "30px", maxWidth: "800px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Bell size={20} color="var(--accent-primary)" /> Alertes et Rappels
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {[
                { key: "orderStatus", label: "Suivi de commande", desc: "Être informé du changement d'état (préparée, prête)." },
                { key: "messageAlerts", label: "Messages du pharmacien", desc: "Notification lors d'une réponse à vos questions." },
                { key: "promoAlerts", label: "Offres et conseils santé", desc: "Recevoir des conseils personnalisés et offres des pharmacies." }
              ].map(item => (
                <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{item.label}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{item.desc}</div>
                  </div>
                  <button 
                    onClick={() => setNotifications({...notifications, [item.key]: !notifications[item.key as keyof typeof notifications]})}
                    style={{ background: "none", border: "none", color: notifications[item.key as keyof typeof notifications] ? "var(--accent-primary)" : "var(--text-muted)", cursor: "pointer" }}
                  >
                    {notifications[item.key as keyof typeof notifications] ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case "security":
        return (
          <div className="glass-card animate-fade-in" style={{ padding: "30px", maxWidth: "800px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Shield size={20} color="var(--accent-primary)" /> Sécurité et Confidentialité
            </h3>
            <div style={{ marginBottom: "25px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "12px" }}>Changer mon mot de passe</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input type="password" title="Mot de passe actuel" className="input-field" placeholder="Mot de passe actuel" />
                <input type="password" title="Nouveau mot de passe" className="input-field" placeholder="Nouveau mot de passe" />
                <button className="btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>Confirmer le changement</button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-wrapper">
      <DashboardSidebar role={role} userName={(session?.user as any)?.name} />
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Paramètres du compte</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Gérez votre profil et votre carnet de santé</p>
          </div>
          <button className="btn-primary btn-sm"><Save size={14} /> Enregistrer</button>
        </header>

        <div className="dashboard-content">
          <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "40px" }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <button onClick={() => setActiveTab("profile")} className={`sidebar-nav-item ${activeTab === "profile" ? "active" : ""}`} style={{ border: "none", width: "100%", justifyContent: "flex-start" }}>
                <User size={18} /> Profil Personnel
              </button>
              <button onClick={() => setActiveTab("health")} className={`sidebar-nav-item ${activeTab === "health" ? "active" : ""}`} style={{ border: "none", width: "100%", justifyContent: "flex-start" }}>
                <Heart size={18} /> Infos Santé
              </button>
              <button onClick={() => setActiveTab("notifications")} className={`sidebar-nav-item ${activeTab === "notifications" ? "active" : ""}`} style={{ border: "none", width: "100%", justifyContent: "flex-start" }}>
                <Bell size={18} /> Notifications
              </button>
              <button onClick={() => setActiveTab("security")} className={`sidebar-nav-item ${activeTab === "security" ? "active" : ""}`} style={{ border: "none", width: "100%", justifyContent: "flex-start" }}>
                <Shield size={18} /> Sécurité
              </button>
            </div>

            {renderContent()}

          </div>
        </div>
      </div>
    </div>
  );
}
