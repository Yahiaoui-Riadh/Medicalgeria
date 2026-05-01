"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Search, Building2, ShoppingCart, Plus, RefreshCw, Eye, Package, CheckCircle, MapPin, ExternalLink, X } from "lucide-react";
import { formatPrice, formatDateTime } from "@/lib/utils";

interface Wholesaler {
  id: string;
  companyName: string;
  address: string;
  wilaya: string;
}

interface WholesalerOrder {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  wholesaler: { companyName: string };
  items: { quantity: number; medicine: { name: string } }[];
}

export default function PharmacyWholesalePage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<WholesalerOrder[]>([]);
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrder, setShowNewOrder] = useState(false);

  const fetchWholesaleData = useCallback(async () => {
    setLoading(true);
    try {
      // Simuler la récupération des grossistes (en réalité on chercherait dans la DB)
      setWholesalers([
        { id: "w1", companyName: "Biopharm Distribution", address: "Oued Smar, Alger", wilaya: "16" },
        { id: "w2", companyName: "Hydra Pharma", address: "Hydra, Alger", wilaya: "16" },
        { id: "w3", companyName: "Constantine Med", address: "Hamma Bouziane", wilaya: "25" }
      ]);
      setOrders([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWholesaleData(); }, [fetchWholesaleData]);

  const role = (session?.user as any)?.role ?? "PHARMACIST";

  return (
    <div className="dashboard-wrapper">
      <DashboardSidebar role={role} pharmacyName={(session?.user as any)?.name} />
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Commandes B2B (Grossistes)</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Gérez vos approvisionnements</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-secondary btn-sm" onClick={fetchWholesaleData}><RefreshCw size={14} /> Actualiser</button>
            <button className="btn-primary btn-sm" onClick={() => setShowNewOrder(true)}><Plus size={14} /> Nouvelle commande</button>
          </div>
        </header>

        <div className="dashboard-content">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
              <div style={{ width: "45px", height: "45px", borderRadius: "12px", background: "rgba(0,212,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-primary)" }}>
                <Building2 size={24} />
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{wholesalers.length}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Grossistes disponibles</div>
              </div>
            </div>
            <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
              <div style={{ width: "45px", height: "45px", borderRadius: "12px", background: "rgba(107,70,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-secondary)" }}>
                <Package size={24} />
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>0</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Commandes en cours</div>
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Commande #</th>
                  <th>Grossiste</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array(3).fill(0).map((_, i) => (
                  <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: "18px" }} /></td>)}</tr>
                )) : orders.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "80px", color: "var(--text-muted)" }}>
                    <ShoppingCart size={48} strokeWidth={1} style={{ marginBottom: "15px", opacity: 0.3 }} />
                    <p>Vous n'avez pas encore passé de commande B2B.</p>
                    <button className="btn-primary btn-sm" style={{ marginTop: "15px" }} onClick={() => setShowNewOrder(true)}>Explorer les grossistes</button>
                  </td></tr>
                ) : orders.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id.slice(0, 8)}</td>
                    <td>{o.wholesaler.companyName}</td>
                    <td>{formatDateTime(o.createdAt)}</td>
                    <td>{formatPrice(o.totalAmount)}</td>
                    <td><span className="badge badge-blue">{o.status}</span></td>
                    <td><button className="btn-secondary btn-sm"><Eye size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Nouvelle Commande (Sélection Grossiste) */}
      {showNewOrder && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ width: "700px", padding: 0 }}>
             <header style={{ padding: "20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Sélectionnez un grossiste</h2>
                <button onClick={() => setShowNewOrder(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={20} /></button>
             </header>
             <div style={{ padding: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  {wholesalers.map(w => (
                    <div key={w.id} className="glass-card" style={{ padding: "15px", border: "1px solid var(--border-subtle)", cursor: "pointer", transition: "transform 0.2s" }} onClick={() => {}}>
                       <div style={{ fontWeight: 700, marginBottom: "5px" }}>{w.companyName}</div>
                       <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={12} /> {w.address} (W.{w.wilaya})</div>
                       <button className="btn-primary btn-sm" style={{ width: "100%", marginTop: "12px" }}>Voir le catalogue <ExternalLink size={12} style={{ marginLeft: "6px" }} /></button>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
          display: flex; align-items: center; justifyContent: center; z-index: 1000;
        }
        .modal-content { max-height: 80vh; overflow-y: auto; }
      `}</style>
    </div>
  );
}
