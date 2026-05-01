import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { ShoppingBag, Search, FileText, Pill, Clock, MapPin, ChevronRight } from "lucide-react";
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor } from "@/lib/utils";
import Link from "next/link";

async function getPatientData(patientId: string) {
  const recentOrders = await prisma.order.findMany({
    where: { patientId },
    include: { pharmacy: { select: { name: true, address: true } } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const notifications = await prisma.notification.findMany({
    where: { user: { patient: { id: patientId } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return { recentOrders, notifications };
}

export default async function PatientDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const patientId = (session.user as any).patientId;
  if (!patientId) redirect("/login?error=unauthorized");

  const { recentOrders, notifications } = await getPatientData(patientId);

  return (
    <div className="dashboard-wrapper">
      <DashboardSidebar role="PATIENT" userName={session.user.name ?? ""} />

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Mon Espace Santé</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Bienvenue, {session.user.name}</p>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Quick Actions Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
            <Link href="/rechercher" style={{ textDecoration: "none" }}>
              <div className="glass-card" style={{ padding: "30px", textAlign: "center", border: "1px solid var(--accent-primary)" }}>
                <Search size={32} style={{ color: "var(--accent-primary)", marginBottom: "16px" }} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Trouver un médicament</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "8px" }}>Disponibilités et prix</p>
              </div>
            </Link>

            <Link href="/ordonnance" style={{ textDecoration: "none" }}>
              <div className="glass-card" style={{ padding: "30px", textAlign: "center", border: "1px solid var(--accent-purple)" }}>
                <FileText size={32} style={{ color: "var(--accent-purple)", marginBottom: "16px" }} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Uploader Ordonnance</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "8px" }}>Analyse IA instantanée</p>
              </div>
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
            {/* Recent Orders */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Mes dernières commandes</h2>
                <Link href="/patient/orders" style={{ fontSize: "0.85rem", color: "var(--accent-primary)", textDecoration: "none" }}>Voir tout</Link>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {recentOrders.length === 0 ? (
                  <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    Vous n'avez pas encore passé de commande.
                  </div>
                ) : recentOrders.map((o) => (
                  <div key={o.id} className="glass-card" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>#{o.id.slice(0, 8)}</span>
                        <div style={{ fontWeight: 700 }}>{o.pharmacy.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <MapPin size={12} /> {o.pharmacy.address}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className={`badge ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span>
                        <div style={{ fontWeight: 800, marginTop: "8px", color: "var(--accent-primary)" }}>{formatPrice(Number(o.totalAmount))}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                      <Clock size={12} /> Commandé le {formatDateTime(o.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications / Alerts */}
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "20px" }}>Notifications</h2>
              <div className="glass-card" style={{ padding: "12px" }}>
                {notifications.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.85rem" }}>Aucune notification</p>
                ) : notifications.map((n, idx) => (
                  <div key={n.id} style={{ padding: "12px", borderBottom: idx === notifications.length - 1 ? "none" : "1px solid var(--border-subtle)" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{n.title}</div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>{n.message}</p>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>{new Date(n.createdAt).toLocaleTimeString()}</div>
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
