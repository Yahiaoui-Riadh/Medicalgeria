"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Period = "week" | "month" | "year";

export default function PharmacyStatsPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(false);
  
  // Simulation de données
  const stats = {
    revenue: period === "month" ? 124500 : period === "week" ? 32000 : 1450000,
    orders: period === "month" ? 142 : period === "week" ? 38 : 1650,
    newPatients: period === "month" ? 24 : period === "week" ? 6 : 280,
    growth: period === "month" ? "+12%" : period === "week" ? "+2%" : "+18%"
  };

  const role = (session?.user as any)?.role ?? "PHARMACIST";

  return (
    <div className="dashboard-wrapper">
      <DashboardSidebar role={role} pharmacyName={(session?.user as any)?.name} />
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Statistiques & Analyses</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Suivez la performance de votre officine</p>
          </div>
          <div style={{ display: "flex", gap: "8px", background: "var(--glass-bg)", padding: "4px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <button 
              onClick={() => setPeriod("week")}
              className={`btn-sm ${period === "week" ? "btn-primary" : "btn-ghost"}`}
              style={{ fontSize: "0.75rem", padding: "6px 12px" }}
            >Cette semaine</button>
            <button 
              onClick={() => setPeriod("month")}
              className={`btn-sm ${period === "month" ? "btn-primary" : "btn-ghost"}`}
              style={{ fontSize: "0.75rem", padding: "6px 12px" }}
            >Ce mois</button>
            <button 
              onClick={() => setPeriod("year")}
              className={`btn-sm ${period === "year" ? "btn-primary" : "btn-ghost"}`}
              style={{ fontSize: "0.75rem", padding: "6px 12px" }}
            >Cette année</button>
          </div>
        </header>

        <div className="dashboard-content">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            <div className="glass-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Chiffre d'affaires</div>
                <div style={{ color: "var(--accent-success)", display: "flex", alignItems: "center", fontSize: "0.75rem" }}><ArrowUpRight size={14} /> {stats.growth}</div>
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{formatPrice(stats.revenue)}</div>
            </div>
            <div className="glass-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Commandes total</div>
                <div style={{ color: "var(--accent-success)", display: "flex", alignItems: "center", fontSize: "0.75rem" }}><ArrowUpRight size={14} /> +5%</div>
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{stats.orders}</div>
            </div>
            <div className="glass-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Nouveaux patients</div>
                <div style={{ color: "var(--accent-danger)", display: "flex", alignItems: "center", fontSize: "0.75rem" }}><ArrowDownRight size={14} /> -2%</div>
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{stats.newPatients}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
             <div className="glass-card" style={{ padding: "20px", height: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  <TrendingUp size={64} opacity={0.1} style={{ marginBottom: "15px" }} />
                  <p>Graphique des ventes ({period})</p>
                  <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "center" }}>
                    {[0.4, 0.6, 0.8, 0.5, 0.9, 0.7, 0.85].map((h, i) => (
                      <div key={i} style={{ width: "20px", height: `${h * 150}px`, background: "var(--accent-primary)", borderRadius: "4px", opacity: 0.6 + (h * 0.4) }}></div>
                    ))}
                  </div>
                </div>
             </div>
             <div className="glass-card" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "20px" }}>Top Médicaments</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {[
                    { name: "Doliprane 1g", dci: "Paracétamol", sales: 450 },
                    { name: "Amoxil 500mg", dci: "Amoxicilline", sales: 230 },
                    { name: "Xenid 75mg", dci: "Diclofenac", sales: 120 }
                  ].map((med, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: "1px solid var(--border-subtle)" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{med.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{med.dci}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--accent-primary)" }}>{med.sales} v.</div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
