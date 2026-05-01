"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { User, Bell, Shield, MapPin, Clock, Save, Building2, ToggleLeft, ToggleRight, Key, Phone, Mail, RefreshCw } from "lucide-react";

const MapPicker = dynamic(() => import("@/components/maps/MapPicker"), { ssr: false });

type TabType = "profile" | "hours" | "notifications" | "security";

export default function PharmacySettingsPage() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  
  // States pour les paramètres
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [geo, setGeo] = useState({ lat: 36.73, lng: 3.08 });
  const [hours, setHours] = useState<any>({});
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [notifications, setNotifications] = useState({
    newOrder: true,
    stockLow: true,
    chatMessage: true,
    emailAlerts: false
  });

  // Charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/pharmacy/settings");
        const data = await res.json();
        if (data.data) {
          const p = data.data;
          setName(p.name);
          setAddress(p.address);
          setPhone(p.user?.phone || "");
          setEmail(p.user?.email || "");
          setGeo(p.geoLocation || { lat: 36.73, lng: 3.08 });
          setHours(p.openingHours || {});
          setIsOnDuty(p.isOnDuty || false);
        }
      } catch (e) {
        console.error("Fetch settings error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/pharmacy/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          phone,
          email,
          geoLocation: geo,
          openingHours: hours,
          isOnDuty
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // Update local session if name changed
      await update({ name });
      alert("Paramètres enregistrés avec succès !");
    } catch (e: any) {
      alert("Erreur: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const role = (session?.user as any)?.role ?? "PHARMACIST";

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="glass-card animate-fade-in" style={{ padding: "30px", maxWidth: "800px" }}>
            <div style={{ marginBottom: "30px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                <Building2 size={20} color="var(--accent-primary)" /> Informations générales
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>Nom de l'officine</label>
                  <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>Numéro d'agrément</label>
                  <input type="text" className="input-field" disabled value="PH-2026-XXXX" />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>Téléphone</label>
                  <input type="text" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>Email professionnel</label>
                  <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>Adresse complète</label>
                  <input type="text" className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "30px 0" }} />

            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <MapPin size={20} color="var(--accent-secondary)" /> Localisation GPS
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Pharmacie de garde ?</span>
                  <button onClick={() => setIsOnDuty(!isOnDuty)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: isOnDuty ? "var(--accent-primary)" : "var(--text-muted)" }}>
                    {isOnDuty ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>
              </h3>
              <div style={{ marginBottom: "15px" }}>
                <MapPicker initialPos={geo} onChange={(pos: any) => setGeo(pos)} />
              </div>
              <div style={{ padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", fontSize: "0.85rem", display: "flex", gap: "20px" }}>
                <span><strong>Lat:</strong> {geo.lat.toFixed(6)}</span>
                <span><strong>Lng:</strong> {geo.lng.toFixed(6)}</span>
              </div>
            </div>
          </div>
        );
      case "hours":
        const days = [
          { key: "monday", label: "Lundi" },
          { key: "tuesday", label: "Mardi" },
          { key: "wednesday", label: "Mercredi" },
          { key: "thursday", label: "Jeudi" },
          { key: "friday", label: "Vendredi" },
          { key: "saturday", label: "Samedi" },
          { key: "sunday", label: "Dimanche" }
        ];
        
        const updateHours = (day: string, val: string) => {
          setHours({ ...hours, [day]: val });
        };

        return (
          <div className="glass-card animate-fade-in" style={{ padding: "30px", maxWidth: "800px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Clock size={20} color="var(--accent-primary)" /> Horaires d'ouverture
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "20px" }}>Exemple: "08:00-19:00" ou "fermé"</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {days.map(day => (
                <div key={day.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{day.label}</span>
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ width: "150px", padding: "6px 10px", textAlign: "center" }} 
                    value={hours[day.key] || ""} 
                    onChange={(e) => updateHours(day.key, e.target.value)}
                    placeholder="08:00-19:00"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      case "notifications":
        return (
          <div className="glass-card animate-fade-in" style={{ padding: "30px", maxWidth: "800px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Bell size={20} color="var(--accent-primary)" /> Préférences
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {[
                { key: "newOrder", label: "Nouvelle commande patient", desc: "Recevoir une notification push lors d'une nouvelle commande." },
                { key: "stockLow", label: "Alerte stock faible", desc: "Être prévenu quand un produit descend sous le seuil critique." },
                { key: "chatMessage", label: "Nouveau message patient", desc: "Notification lors de la réception d'un message dans le chat." }
              ].map(item => (
                <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{item.label}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{item.desc}</div>
                  </div>
                  <button 
                    onClick={() => setNotifications(prev => ({...prev, [item.key]: !prev[item.key as keyof typeof notifications]}))}
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
              <Shield size={20} color="var(--accent-danger)" /> Sécurité
            </h3>
            <div style={{ marginBottom: "30px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "12px" }}>Changer le mot de passe</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input type="password" title="Mot de passe actuel" className="input-field" placeholder="Mot de passe actuel" />
                <input type="password" title="Nouveau mot de passe" className="input-field" placeholder="Nouveau mot de passe" />
                <button className="btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>Mettre à jour le mot de passe</button>
              </div>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>L'authentification à deux facteurs sera bientôt disponible.</p>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-wrapper">
      <DashboardSidebar role={role} pharmacyName={name || (session?.user as any)?.name} />
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Paramètres de l'officine</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Gérez vos informations et préférences</p>
          </div>
          <button 
            className="btn-primary btn-sm" 
            disabled={saving || loading}
            onClick={handleSave}
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} 
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </header>

        <div className="dashboard-content">
          {loading ? (
             <div style={{ display: "flex", justifyContent: "center", padding: "100px" }}>
                <RefreshCw size={40} className="animate-spin" color="var(--accent-primary)" />
             </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "40px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <button onClick={() => setActiveTab("profile")} className={`sidebar-nav-item ${activeTab === "profile" ? "active" : ""}`} style={{ border: "none", width: "100%", justifyContent: "flex-start" }}>
                  <User size={18} /> Profil Officine
                </button>
                <button onClick={() => setActiveTab("hours")} className={`sidebar-nav-item ${activeTab === "hours" ? "active" : ""}`} style={{ border: "none", width: "100%", justifyContent: "flex-start" }}>
                  <Clock size={18} /> Horaires
                </button>
                <button onClick={() => setActiveTab("notifications")} className={`sidebar-nav-item ${activeTab === "notifications" ? "active" : ""}`} style={{ border: "none", width: "100%", justifyContent: "flex-start" }}>
                  <Bell size={18} /> Préférences
                </button>
                <button onClick={() => setActiveTab("security")} className={`sidebar-nav-item ${activeTab === "security" ? "active" : ""}`} style={{ border: "none", width: "100%", justifyContent: "flex-start" }}>
                  <Shield size={18} /> Sécurité
                </button>
              </div>
              {renderContent()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
