"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Search, FileText, CheckCircle, XCircle, Eye, RefreshCw, ZoomIn, Download } from "lucide-react";
import { formatDateTime, getStatusLabel, getStatusColor } from "@/lib/utils";

interface Order {
  id: string;
  status: string;
  prescriptionImageUrl?: string;
  createdAt: string;
  patient: { fullName: string };
  items: { medicine: { name: string; isPrescriptionRequired: boolean } }[];
}

export default function PharmacyPrescriptionsPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = (msg: string, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    // On réutilise l'API des commandes avec le filtre ordonnance
    const res = await fetch(`/api/pharmacy/orders?hasPrescription=true`);
    const data = await res.json();
    setOrders(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPrescriptions(); }, [fetchPrescriptions]);

  async function handleAction(id: string, action: string) {
    const res = await fetch(`/api/pharmacy/orders/${id}/${action}`, { method: "PATCH" });
    if (res.ok) {
      showToast(`Ordonnance traitée avec succès`);
      fetchPrescriptions();
      if (selectedOrder?.id === id) setSelectedOrder(null);
    } else {
      const err = await res.json();
      showToast(err.error ?? "Erreur", "error");
    }
  }

  const role = (session?.user as any)?.role ?? "PHARMACIST";

  return (
    <div className="dashboard-wrapper">
      <DashboardSidebar role={role} pharmacyName={(session?.user as any)?.name} />
      
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Ordonnances reçues</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{orders.length} ordonnances à traiter</p>
          </div>
          <button className="btn-secondary btn-sm" onClick={fetchPrescriptions}><RefreshCw size={14} /> Actualiser</button>
        </header>

        <div className="dashboard-content" style={{ display: "grid", gridTemplateColumns: selectedOrder ? "1fr 400px" : "1fr", gap: "20px" }}>
          
          {/* Liste des ordonnances */}
          <div className="glass-card" style={{ padding: "0", overflow: "hidden" }}>
            <div className="table-wrapper" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date d'envoi</th>
                    <th>Médicaments</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array(3).fill(0).map((_, i) => (
                    <tr key={i}>{Array(5).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: "18px" }} /></td>)}</tr>
                  )) : orders.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Aucune ordonnance en attente</td></tr>
                  ) : orders.map((o) => (
                    <tr key={o.id} className={selectedOrder?.id === o.id ? "active-row" : ""} onClick={() => setSelectedOrder(o)} style={{ cursor: "pointer" }}>
                      <td><div style={{ fontWeight: 600 }}>{o.patient.fullName}</div></td>
                      <td style={{ fontSize: "0.85rem" }}>{formatDateTime(o.createdAt)}</td>
                      <td style={{ fontSize: "0.85rem" }}>
                        {o.items.filter(i => i.medicine.isPrescriptionRequired).length} requis
                      </td>
                      <td><span className={`badge ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span></td>
                      <td>
                        <button className="btn-secondary btn-sm"><Eye size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visionneuse d'ordonnance */}
          {selectedOrder && (
            <div className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", height: "calc(100vh - 180px)", position: "sticky", top: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Détails Ordonnance</h3>
                <button onClick={() => setSelectedOrder(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ flex: 1, background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-md)", overflow: "hidden", position: "relative", border: "1px solid var(--border-subtle)" }}>
                {selectedOrder.prescriptionImageUrl ? (
                  <img 
                    src={selectedOrder.prescriptionImageUrl} 
                    alt="Ordonnance" 
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "10px", color: "var(--text-muted)" }}>
                    <FileText size={48} opacity={0.2} />
                    <span>Image non disponible</span>
                  </div>
                )}
                <div style={{ position: "absolute", bottom: "10px", right: "10px", display: "flex", gap: "6px" }}>
                   <button className="btn-secondary btn-sm" style={{ padding: "6px" }}><ZoomIn size={14} /></button>
                   <button className="btn-secondary btn-sm" style={{ padding: "6px" }}><Download size={14} /></button>
                </div>
              </div>

              <div style={{ fontSize: "0.85rem" }}>
                <div style={{ fontWeight: 600, marginBottom: "8px" }}>Médicaments sous prescription :</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {selectedOrder.items.filter(i => i.medicine.isPrescriptionRequired).map((item, idx) => (
                    <li key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <CheckCircle size={14} color="var(--accent-success)" />
                      {item.medicine.name}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedOrder.status === "PENDING" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "auto" }}>
                  <button className="btn-danger btn-sm" onClick={() => handleAction(selectedOrder.id, 'refuse')}>
                    <XCircle size={14} /> Refuser
                  </button>
                  <button className="btn-success btn-sm" onClick={() => handleAction(selectedOrder.id, 'validate')}>
                    <CheckCircle size={14} /> Valider
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <style jsx>{`
        .active-row {
          background: rgba(0, 212, 255, 0.05) !important;
          border-left: 3px solid var(--accent-primary) !important;
        }
      `}</style>
    </div>
  );
}
