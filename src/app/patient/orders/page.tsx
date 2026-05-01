"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import {
  ShoppingCart, RefreshCw, MapPin, Phone, Mail, Clock,
  ChevronDown, Package, CheckCircle2, Truck,
  XCircle, Moon, ExternalLink, Pill, Loader2, Navigation
} from "lucide-react";
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor, isPharmacyOpen } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  medicine: { name: string; dci: string; dosage?: string; form?: string };
}

interface PharmacyInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  wilaya: string;
  isOnDuty: boolean;
  openingHours: Record<string, string>;
  geoLocation?: { lat: number; lng: number };
  user?: { phone?: string; email?: string };
}

interface StatusHistoryEntry {
  status: string;
  changedAt: string;
  note?: string;
}

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  pharmacistNote?: string;
  prescriptionImageUrl?: string;
  createdAt: string;
  pharmacy: PharmacyInfo;
  items: OrderItem[];
  statusHistory: StatusHistoryEntry[];
}

const STATUS_STEPS = ["PENDING", "PREPARING", "READY", "DELIVERED"];

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:   <Clock size={16} />,
  PREPARING: <Package size={16} />,
  READY:     <CheckCircle2 size={16} />,
  DELIVERED: <Truck size={16} />,
  REFUSED:   <XCircle size={16} />,
  CANCELLED: <XCircle size={16} />,
};

function ProgressBar({ status }: { status: string }) {
  const isCancelled = ["REFUSED", "CANCELLED"].includes(status);
  const stepIdx = STATUS_STEPS.indexOf(status);

  if (isCancelled) return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 0" }}>
      <XCircle size={18} color="var(--accent-danger)" />
      <span style={{ fontSize: "0.85rem", color: "var(--accent-danger)", fontWeight: 600 }}>
        {getStatusLabel(status)}
      </span>
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0", marginTop: "8px" }}>
      {STATUS_STEPS.map((step, i) => {
        const done = i <= stepIdx;
        const active = i === stepIdx;
        return (
          <div key={step} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: done ? (active ? "var(--accent-primary)" : "rgba(0,212,255,0.2)") : "rgba(255,255,255,0.05)",
              border: `2px solid ${done ? "var(--accent-primary)" : "var(--border-subtle)"}`,
              color: done ? (active ? "#000" : "var(--accent-primary)") : "var(--text-muted)",
              fontSize: "0.7rem", fontWeight: 800,
              boxShadow: active ? "0 0 12px rgba(0,212,255,0.4)" : "none",
              transition: "all 0.3s"
            }}>
              {STATUS_ICON[step]}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div style={{
                flex: 1, height: "2px",
                background: done && i < stepIdx ? "var(--accent-primary)" : "var(--border-subtle)",
                transition: "background 0.5s"
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const isOpen = order.pharmacy.openingHours ? isPharmacyOpen(order.pharmacy.openingHours) : false;
  const hasNote = !!order.pharmacistNote;

  return (
    <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{ padding: "20px 24px", cursor: "pointer", userSelect: "none" }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: 700 }}>
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <span className={`badge ${getStatusColor(order.status)}`}>
                {STATUS_ICON[order.status]} {getStatusLabel(order.status)}
              </span>
              {order.pharmacy.isOnDuty && (
                <span className="badge badge-purple" style={{ fontSize: "0.65rem" }}>
                  <Moon size={10} /> De garde
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
              {order.items.length} article{order.items.length > 1 ? "s" : ""} • {formatDateTime(order.createdAt)}
            </p>
            <p style={{ fontWeight: 800, fontSize: "1rem", color: "var(--accent-primary)" }}>
              {formatPrice(order.totalAmount)}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
            <div style={{ color: "var(--text-muted)", transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none" }}>
              <ChevronDown size={20} />
            </div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginTop: "14px" }}>
          <ProgressBar status={order.status} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
            {STATUS_STEPS.map((s) => (
              <span key={s} style={{ fontSize: "0.6rem", color: "var(--text-muted)", textAlign: "center", flex: 1 }}>
                {getStatusLabel(s)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
          {/* Articles */}
          <div style={{ padding: "20px 24px" }}>
            <h4 style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Pill size={12} /> Articles commandés
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {order.items.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{item.medicine.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {item.medicine.dci} {item.medicine.dosage && `· ${item.medicine.dosage}`} {item.medicine.form && `· ${item.medicine.form}`}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                      {formatPrice(item.unitPrice)}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>x{item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pharmacist note */}
          {hasNote && (
            <div style={{ margin: "0 24px 16px", padding: "14px 16px", background: order.status === "READY" ? "rgba(0,229,160,0.06)" : "rgba(255,179,0,0.05)", borderRadius: "var(--radius-sm)", border: `1px solid ${order.status === "READY" ? "rgba(0,229,160,0.25)" : "rgba(255,179,0,0.2)"}` }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase", color: order.status === "READY" ? "var(--accent-success)" : "var(--accent-warning)" }}>
                {order.status === "READY" ? "🎉 Code de retrait" : "📝 Note du pharmacien"}
              </p>
              <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", fontWeight: order.status === "READY" ? 800 : 500, letterSpacing: order.status === "READY" ? "0.1em" : "normal" }}>
                {order.pharmacistNote}
              </p>
            </div>
          )}

          {/* Pharmacy info */}
          <div style={{ margin: "0 24px 24px", padding: "20px", background: "rgba(0,212,255,0.04)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <h4 style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
              🏥 Votre pharmacie
            </h4>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "4px" }}>{order.pharmacy.name}</p>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={12} /> {order.pharmacy.address}, {order.pharmacy.city} (W. {order.pharmacy.wilaya})
                </p>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {isOpen
                  ? <span className="badge badge-success" style={{ fontSize: "0.65rem" }}>Ouvert</span>
                  : <span className="badge badge-gray" style={{ fontSize: "0.65rem" }}>Fermé</span>
                }
                {order.pharmacy.isOnDuty && <span className="badge badge-purple" style={{ fontSize: "0.65rem" }}><Moon size={10} /> Garde</span>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px", marginTop: "16px" }}>
              {order.pharmacy.geoLocation && (
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${order.pharmacy.geoLocation.lat},${order.pharmacy.geoLocation.lng}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", textDecoration: "none", transition: "all 0.2s" }}
                >
                  <Navigation size={14} color="var(--accent-primary)" />
                  <div>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Localisation</p>
                    <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Itinéraire</p>
                  </div>
                </a>
              )}

              {order.pharmacy.user?.phone && (
                <a href={`tel:${order.pharmacy.user.phone}`} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "rgba(0,229,160,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(0,229,160,0.2)", textDecoration: "none", transition: "all 0.2s" }}>
                  <Phone size={14} color="var(--accent-success)" />
                  <div>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Téléphone</p>
                    <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-success)" }}>{order.pharmacy.user.phone}</p>
                  </div>
                </a>
              )}

              {order.pharmacy.user?.email && (
                <a href={`mailto:${order.pharmacy.user.email}`} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "rgba(0,212,255,0.05)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(0,212,255,0.15)", textDecoration: "none", transition: "all 0.2s" }}>
                  <Mail size={14} color="var(--accent-primary)" />
                  <div>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Email</p>
                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent-primary)" }}>{order.pharmacy.user.email}</p>
                  </div>
                </a>
              )}

              {order.pharmacy.openingHours && (() => {
                const days: Record<string, string> = { monday: "Lun", tuesday: "Mar", wednesday: "Mer", thursday: "Jeu", friday: "Ven", saturday: "Sam", sunday: "Dim" };
                const today = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][new Date().getDay()];
                const todayHours = (order.pharmacy.openingHours as Record<string,string>)[today];
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "rgba(255,179,0,0.05)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,179,0,0.15)" }}>
                    <Clock size={14} color="var(--accent-warning)" />
                    <div>
                      <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Horaires aujourd'hui</p>
                      <p style={{ fontSize: "0.85rem", fontWeight: 700, color: todayHours === "fermé" ? "var(--accent-danger)" : "var(--accent-warning)" }}>
                        {todayHours || "Non renseigné"}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Status history */}
          {order.statusHistory.length > 0 && (
            <div style={{ margin: "0 24px 24px" }}>
              <h4 style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                Historique de la commande
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {order.statusHistory.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-primary)", marginTop: "5px", flexShrink: 0 }} />
                    <div>
                      <span className={`badge ${getStatusColor(h.status)}`} style={{ fontSize: "0.65rem" }}>{getStatusLabel(h.status)}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "8px" }}>{formatDateTime(h.changedAt)}</span>
                      {h.note && <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "2px" }}>{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PatientOrdersContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/patient/orders");
    if (res.ok) {
      const data = await res.json();
      setOrders(data.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const role = (session?.user as any)?.role ?? "PATIENT";
  const successNew = searchParams.get("success") === "true";

  return (
    <div className="dashboard-wrapper">
      <DashboardSidebar role={role} userName={(session?.user as any)?.name} />
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Mes Réservations</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {orders.length} commande{orders.length !== 1 ? "s" : ""} · Cliquez pour voir les détails
            </p>
          </div>
          <button className="btn-secondary btn-sm" onClick={fetchOrders}>
            <RefreshCw size={14} /> Actualiser
          </button>
        </header>

        <div className="dashboard-content">
          {/* Success banner */}
          {successNew && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", background: "rgba(0,229,160,0.08)", border: "1px solid rgba(0,229,160,0.25)", borderRadius: "var(--radius-md)", marginBottom: "24px" }}>
              <CheckCircle2 size={20} color="var(--accent-success)" />
              <div>
                <p style={{ fontWeight: 700, color: "var(--accent-success)" }}>Réservation confirmée !</p>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>La pharmacie va valider votre commande. Vous serez notifié dès qu'elle sera prête.</p>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: "120px", borderRadius: "var(--radius-lg)" }} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 40px", color: "var(--text-muted)" }}>
              <ShoppingCart size={56} strokeWidth={1} style={{ marginBottom: "20px", opacity: 0.3 }} />
              <p style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>Aucune réservation</p>
              <p style={{ fontSize: "0.9rem", marginBottom: "24px" }}>Commencez par rechercher un médicament disponible près de chez vous</p>
              <a href="/rechercher" className="btn-primary" style={{ display: "inline-flex" }}>
                <ExternalLink size={16} /> Rechercher un médicament
              </a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PatientOrdersPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <Loader2 size={40} color="var(--accent-primary)" style={{ animation: "spin 0.8s linear infinite" }} />
      </div>
    }>
      <PatientOrdersContent />
    </Suspense>
  );
}
