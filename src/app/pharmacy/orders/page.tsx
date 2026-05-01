"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import {
  ShoppingBag, RefreshCw, FileText, CheckCircle, XCircle,
  Package, Truck, Eye, X, AlertCircle, Clock, ChevronDown,
  Printer
} from "lucide-react";
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  medicine: { name: string; dci: string; dosage?: string; isPrescriptionRequired: boolean };
}

interface PatientInfo {
  fullName: string;
  userId: string;
  address?: string;
  dateOfBirth?: string;
  emergencyContact?: { name?: string; phone?: string } | null;
  geoLocation?: { lat: number; lng: number } | null;
  user?: { phone?: string; email?: string };
}

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  prescriptionImageUrl?: string;
  pharmacistNote?: string;
  createdAt: string;
  patient: PatientInfo;
  items: OrderItem[];
  statusHistory?: { status: string; changedAt: string; note?: string }[];
}

const STATUS_ACTIONS: Record<string, { label: string; action: string; icon: React.ReactNode; cls: string }[]> = {
  PENDING: [
    { label: "Valider", action: "validate", icon: <CheckCircle size={14} />, cls: "btn-success" },
    { label: "Refuser", action: "refuse", icon: <XCircle size={14} />, cls: "btn-danger" },
  ],
  PREPARING: [
    { label: "Prête", action: "ready", icon: <Package size={14} />, cls: "btn-primary" },
    { label: "Refuser", action: "refuse", icon: <XCircle size={14} />, cls: "btn-danger" },
  ],
  READY: [
    { label: "Livrée", action: "deliver", icon: <Truck size={14} />, cls: "btn-success" },
  ],
};

export default function PharmacyOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [hasPrescription, setHasPrescription] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refuseMode, setRefuseMode] = useState(false);
  const [refuseReason, setRefuseReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = (msg: string, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (hasPrescription) params.set("hasPrescription", "true");
      const res = await fetch(`/api/pharmacy/orders?${params}`);
      const data = await res.json();
      setOrders(data.data ?? []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, hasPrescription]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handlePrint = () => {
    window.print();
  };

  async function handleAction(orderId: string, action: string) {
    if (action === "refuse" && !refuseMode) {
      setRefuseMode(true);
      return;
    }

    setActionLoading(orderId + action);
    const body = action === "refuse" ? JSON.stringify({ reason: refuseReason }) : undefined;

    const res = await fetch(`/api/pharmacy/orders/${orderId}/${action}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const data = await res.json();
    if (res.ok) {
      const labels: Record<string, string> = {
        validate: "Commande validée ✅",
        refuse: "Commande refusée",
        ready: "Commande marquée prête 📦",
        deliver: "Commande livrée 🎉",
      };
      showToast(labels[action] ?? "Mise à jour effectuée");
      setRefuseMode(false);
      setRefuseReason("");
      setSelectedOrder(null);
      fetchOrders();
    } else {
      showToast(data.error ?? "Erreur lors de l'action", "error");
    }
    setActionLoading(null);
  }

  const role = (session?.user as any)?.role ?? "PHARMACIST";

  const statusCounts = {
    PENDING: orders.filter(o => o.status === "PENDING").length,
    PREPARING: orders.filter(o => o.status === "PREPARING").length,
    READY: orders.filter(o => o.status === "READY").length,
  };

  return (
    <div className="dashboard-wrapper">
      <DashboardSidebar role={role} pharmacyName={(session?.user as any)?.name} />
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Gestion des commandes</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {orders.length} commande{orders.length > 1 ? "s" : ""} • Mise à jour automatique
            </p>
          </div>
          <button className="btn-secondary btn-sm" onClick={fetchOrders}>
            <RefreshCw size={14} /> Actualiser
          </button>
        </header>

        <div className="dashboard-content">
          {/* KPI strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
            {[
              { label: "En attente", count: statusCounts.PENDING, color: "var(--accent-warning)", icon: <Clock size={18} /> },
              { label: "En préparation", count: statusCounts.PREPARING, color: "var(--accent-primary)", icon: <Package size={18} /> },
              { label: "Prêtes", count: statusCounts.READY, color: "var(--accent-success)", icon: <CheckCircle size={18} /> },
            ].map(({ label, count, color, icon }) => (
              <div key={label} className="glass-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}
                onClick={() => setStatusFilter(label === "En attente" ? "PENDING" : label === "En préparation" ? "PREPARING" : "READY")}>
                <div style={{ color, background: `${color}18`, padding: "10px", borderRadius: "10px" }}>{icon}</div>
                <div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color }}>{count}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <select className="input-field" style={{ width: "200px" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="PREPARING">En préparation</option>
              <option value="READY">Prêtes</option>
              <option value="DELIVERED">Livrées</option>
              <option value="REFUSED">Refusées</option>
            </select>
            <button className={hasPrescription ? "btn-primary btn-sm" : "btn-secondary btn-sm"} onClick={() => setHasPrescription(!hasPrescription)}>
              <FileText size={14} /> Avec ordonnance
            </button>
            {statusFilter && (
              <button className="btn-secondary btn-sm" onClick={() => setStatusFilter("")}>
                <X size={12} /> Effacer filtre
              </button>
            )}
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Articles</th>
                  <th>Ordo.</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>{Array(8).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: "18px" }} /></td>)}</tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                      <ShoppingBag size={40} strokeWidth={1} style={{ marginBottom: "12px", opacity: 0.3 }} />
                      <p>Aucune commande {statusFilter ? `avec le statut « ${getStatusLabel(statusFilter)} »` : ""}</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => setSelectedOrder(o)}>
                      <td style={{ fontSize: "0.8rem", fontFamily: "monospace", color: "var(--accent-primary)" }}>#{o.id.slice(0, 8)}</td>
                      <td><div style={{ fontWeight: 600 }}>{o.patient.fullName}</div></td>
                      <td style={{ fontSize: "0.85rem" }}>{formatDateTime(o.createdAt)}</td>
                      <td style={{ fontWeight: 700 }}>{formatPrice(o.totalAmount)}</td>
                      <td style={{ fontSize: "0.85rem" }}>{o.items.length} article{o.items.length > 1 ? "s" : ""}</td>
                      <td>
                        {o.prescriptionImageUrl
                          ? <span className="badge badge-purple" style={{ fontSize: "0.65rem" }}>Oui</span>
                          : <span className="badge badge-gray" style={{ fontSize: "0.65rem" }}>Non</span>}
                      </td>
                      <td><span className={`badge ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className="btn-secondary btn-sm" style={{ padding: "4px 8px" }} onClick={() => setSelectedOrder(o)}>
                            <Eye size={14} />
                          </button>
                          {STATUS_ACTIONS[o.status]?.map(({ label, action, icon, cls }) => (
                            <button key={action} className={`${cls} btn-sm`} style={{ padding: "4px 8px" }}
                              disabled={!!actionLoading}
                              onClick={() => { setSelectedOrder(o); handleAction(o.id, action); }}>
                              {actionLoading === o.id + action ? <span className="spinner" style={{ width: 14, height: 14 }} /> : icon}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail / Action Drawer */}
      {selectedOrder && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "flex-end"
        }} onClick={() => { setSelectedOrder(null); setRefuseMode(false); setRefuseReason(""); }}>
          <div style={{
            width: "480px", height: "100%", background: "var(--bg-secondary)",
            borderLeft: "1px solid var(--border-default)", overflowY: "auto",
            padding: "32px", display: "flex", flexDirection: "column", gap: "24px"
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Commande #{selectedOrder.id.slice(0, 8)}</h2>
                <span className={`badge ${getStatusColor(selectedOrder.status)}`} style={{ marginTop: "8px", display: "inline-block" }}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn-secondary btn-sm no-print" onClick={handlePrint} title="Imprimer le bon">
                  <Printer size={16} />
                </button>
                <button className="btn-secondary btn-sm no-print" style={{ padding: "6px" }} onClick={() => { setSelectedOrder(null); setRefuseMode(false); }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Patient info card */}
            <div style={{ padding: "20px", background: "rgba(0,212,255,0.04)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <p style={{ fontSize: "0.7rem", color: "var(--accent-primary)", marginBottom: "14px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: "6px" }}>
                👤 Informations du patient
              </p>
              
              <div style={{ display: "grid", gap: "12px" }}>
                {/* Name */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", flexShrink: 0, marginRight: "10px" }}>Nom complet</span>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", textAlign: "right" }}>{selectedOrder.patient.fullName}</span>
                </div>

                {/* Phone */}
                {selectedOrder.patient.user?.phone && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Téléphone</span>
                    <a href={`tel:${selectedOrder.patient.user.phone}`} style={{ fontWeight: 600, color: "var(--accent-success)", textDecoration: "none", fontSize: "0.9rem" }}>
                      📞 {selectedOrder.patient.user.phone}
                    </a>
                  </div>
                )}

                {/* Email */}
                {selectedOrder.patient.user?.email && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Email</span>
                    <a href={`mailto:${selectedOrder.patient.user.email}`} style={{ fontWeight: 500, color: "var(--accent-primary)", textDecoration: "none", fontSize: "0.82rem" }}>
                      {selectedOrder.patient.user.email}
                    </a>
                  </div>
                )}

                {/* Address */}
                {selectedOrder.patient.address && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", flexShrink: 0 }}>Adresse</span>
                    <span style={{ fontSize: "0.82rem", textAlign: "right", color: "var(--text-secondary)" }}>
                      📍 {selectedOrder.patient.address}
                    </span>
                  </div>
                )}

                {/* Date of birth */}
                {selectedOrder.patient.dateOfBirth && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Date de naissance</span>
                    <span style={{ fontWeight: 500, fontSize: "0.85rem" }}>
                      {new Date(selectedOrder.patient.dateOfBirth).toLocaleDateString("fr-DZ", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                  </div>
                )}

                {/* Emergency contact */}
                {selectedOrder.patient.emergencyContact && (
                  <div style={{ marginTop: "4px", padding: "10px 14px", background: "rgba(255,179,0,0.06)", borderRadius: "8px", border: "1px solid rgba(255,179,0,0.15)" }}>
                    <p style={{ fontSize: "0.7rem", color: "var(--accent-warning)", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase" }}>Contact d'urgence</p>
                    <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>{(selectedOrder.patient.emergencyContact as any).name}</p>
                    {(selectedOrder.patient.emergencyContact as any).phone && (
                      <a href={`tel:${(selectedOrder.patient.emergencyContact as any).phone}`} style={{ fontSize: "0.82rem", color: "var(--accent-success)", textDecoration: "none" }}>
                        📞 {(selectedOrder.patient.emergencyContact as any).phone}
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Commande passée le {new Date(selectedOrder.createdAt).toLocaleString("fr-DZ", { dateStyle: "long", timeStyle: "short" })}
              </div>
            </div>

            {/* Items */}
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase", fontWeight: 700 }}>Articles commandés</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.medicine.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{item.medicine.dci} {item.medicine.dosage}</div>
                      {item.medicine.isPrescriptionRequired && <span className="badge badge-purple" style={{ fontSize: "0.6rem", marginTop: "4px" }}>Ordonnance</span>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>x{item.quantity}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--accent-primary)" }}>{formatPrice(item.unitPrice)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(0,212,255,0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(0,212,255,0.15)" }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--accent-primary)" }}>{formatPrice(selectedOrder.totalAmount)}</span>
            </div>

            {/* Pharmacist note */}
            {selectedOrder.pharmacistNote && (
              <div style={{ padding: "12px 16px", background: "rgba(255,179,0,0.05)", border: "1px solid rgba(255,179,0,0.2)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem" }}>
                <strong style={{ color: "var(--accent-warning)" }}>Note pharmacien :</strong>
                <p style={{ marginTop: "4px", color: "var(--text-secondary)" }}>{selectedOrder.pharmacistNote}</p>
              </div>
            )}

            {/* Refuse form */}
            {refuseMode && (
              <div style={{ padding: "16px", background: "rgba(255,71,87,0.05)", border: "1px solid rgba(255,71,87,0.2)", borderRadius: "var(--radius-md)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <AlertCircle size={16} color="var(--accent-danger)" />
                  <span style={{ fontWeight: 700, color: "var(--accent-danger)", fontSize: "0.9rem" }}>Motif de refus</span>
                </div>
                <textarea
                  className="input-field"
                  placeholder="Expliquer la raison du refus (min. 5 caractères)..."
                  value={refuseReason}
                  onChange={(e) => setRefuseReason(e.target.value)}
                  rows={3}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>
            )}

            {/* Actions */}
            {STATUS_ACTIONS[selectedOrder.status] && (
              <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                {refuseMode ? (
                  <>
                    <button className="btn-danger" style={{ flex: 1 }}
                      disabled={refuseReason.trim().length < 5 || !!actionLoading}
                      onClick={() => handleAction(selectedOrder.id, "refuse")}>
                      {actionLoading ? <span className="spinner" /> : <><XCircle size={14} /> Confirmer le refus</>}
                    </button>
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setRefuseMode(false); setRefuseReason(""); }}>Annuler</button>
                  </>
                ) : (
                  STATUS_ACTIONS[selectedOrder.status].map(({ label, action, icon, cls }) => (
                    <button key={action} className={`${cls}`} style={{ flex: 1 }}
                      disabled={!!actionLoading}
                      onClick={() => {
                        if (action === "refuse") { setRefuseMode(true); }
                        else { handleAction(selectedOrder.id, action); }
                      }}>
                      {actionLoading === selectedOrder.id + action ? <span className="spinner" /> : <>{icon} {label}</>}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 999,
          padding: "14px 22px", borderRadius: "12px", fontWeight: 600,
          background: toast.type === "error" ? "rgba(255,71,87,0.9)" : "rgba(0,212,100,0.9)",
          color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animation: "fadeIn 0.3s ease"
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
