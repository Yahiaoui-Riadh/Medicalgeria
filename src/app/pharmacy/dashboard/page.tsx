import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import {
  ShoppingCart, Package, TrendingUp, AlertTriangle,
  Clock, CheckCircle, XCircle, BarChart2, ArrowUp, ArrowDown,
} from "lucide-react";
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor, daysUntilExpiry } from "@/lib/utils";

async function getPharmacyStats(pharmacyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  const [
    ordersToday, revenueToday, pendingOrders, lowStockCount,
    expiredCount, recentOrders, stockAlerts,
    revenueMonth, revenuePrevMonth,
  ] = await Promise.all([
    prisma.order.count({ where: { pharmacyId, createdAt: { gte: today } } }),
    prisma.order.aggregate({ where: { pharmacyId, createdAt: { gte: today }, status: { notIn: ["CANCELLED", "REFUSED"] } }, _sum: { totalAmount: true } }),
    prisma.order.count({ where: { pharmacyId, status: "PENDING" } }),
    prisma.stock.count({ where: { pharmacyId, isLowStock: true, deletedAt: null } }),
    prisma.stock.count({ where: { pharmacyId, isExpiringSoon: true, deletedAt: null } }),
    prisma.order.findMany({
      where: { pharmacyId },
      include: { patient: { select: { fullName: true } }, items: { select: { quantity: true, unitPrice: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.stock.findMany({
      where: { pharmacyId, OR: [{ isLowStock: true }, { isExpiringSoon: true }], deletedAt: null },
      include: { medicine: { select: { name: true, dci: true } } },
      orderBy: { expirationDate: "asc" },
      take: 5,
    }),
    prisma.order.aggregate({ where: { pharmacyId, createdAt: { gte: startOfMonth }, status: { notIn: ["CANCELLED", "REFUSED"] } }, _sum: { totalAmount: true } }),
    prisma.order.aggregate({ where: { pharmacyId, createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth }, status: { notIn: ["CANCELLED", "REFUSED"] } }, _sum: { totalAmount: true } }),
  ]);

  return {
    ordersToday,
    revenueToday: Number(revenueToday._sum.totalAmount ?? 0),
    pendingOrders,
    lowStockCount,
    expiredCount,
    recentOrders,
    stockAlerts,
    revenueMonth: Number(revenueMonth._sum.totalAmount ?? 0),
    revenuePrevMonth: Number(revenuePrevMonth._sum.totalAmount ?? 0),
  };
}

export default async function PharmacyDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const pharmacyId = (session.user as any).pharmacyId;
  if (!pharmacyId) redirect("/login?error=unauthorized");

  const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
  const stats = await getPharmacyStats(pharmacyId);

  const revChange = stats.revenuePrevMonth
    ? ((stats.revenueMonth - stats.revenuePrevMonth) / stats.revenuePrevMonth) * 100
    : 0;

  const STATUS_ICON: Record<string, React.ReactNode> = {
    PENDING: <Clock size={14} />,
    CONFIRMED: <CheckCircle size={14} />,
    PREPARING: <Package size={14} />,
    READY: <CheckCircle size={14} />,
    DELIVERED: <CheckCircle size={14} />,
    CANCELLED: <XCircle size={14} />,
    REFUSED: <XCircle size={14} />,
  };

  return (
    <div className="dashboard-wrapper">
      <DashboardSidebar role="PHARMACIST" pharmacyName={pharmacy?.name} />

      <div className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Tableau de bord</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {pharmacy?.name} • {new Date().toLocaleDateString("fr-DZ", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {stats.pendingOrders > 0 && (
              <div style={{
                background: "rgba(255,71,87,0.15)", border: "1px solid rgba(255,71,87,0.3)",
                color: "var(--accent-danger)", padding: "6px 14px", borderRadius: "50px",
                fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px",
              }}>
                <span style={{ width: "8px", height: "8px", background: "var(--accent-danger)", borderRadius: "50%", animation: "pulse-glow 1.5s infinite" }} />
                {stats.pendingOrders} en attente
              </div>
            )}
          </div>
        </header>

        <div className="dashboard-content">
          {/* ── Stats Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="stat-label">Commandes aujourd'hui</span>
                <ShoppingCart size={20} style={{ color: "var(--accent-primary)" }} />
              </div>
              <div className="stat-value">{stats.ordersToday}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{formatPrice(stats.revenueToday)}</div>
            </div>

            <div className="stat-card" style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="stat-label">En attente</span>
                <Clock size={20} style={{ color: "var(--accent-warning)" }} />
              </div>
              <div className="stat-value" style={{ color: stats.pendingOrders > 0 ? "var(--accent-warning)" : "inherit" }}>
                {stats.pendingOrders}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>commandes à traiter</div>
            </div>

            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="stat-label">Alertes stock</span>
                <AlertTriangle size={20} style={{ color: "var(--accent-danger)" }} />
              </div>
              <div className="stat-value" style={{ color: "var(--accent-danger)" }}>
                {stats.lowStockCount + stats.expiredCount}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{stats.lowStockCount} faibles · {stats.expiredCount} expirant</div>
            </div>

            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="stat-label">CA du mois</span>
                <TrendingUp size={20} style={{ color: "var(--accent-success)" }} />
              </div>
              <div className="stat-value" style={{ fontSize: "1.5rem" }}>{formatPrice(stats.revenueMonth)}</div>
              <div className={`stat-change ${revChange >= 0 ? "positive" : "negative"}`}>
                {revChange >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {Math.abs(revChange).toFixed(1)}% vs mois dernier
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* ── Commandes récentes ── */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Commandes récentes</h2>
                <a href="/pharmacy/orders" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", textDecoration: "none" }}>
                  Voir tout →
                </a>
              </div>

              {stats.recentOrders.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "20px" }}>
                  Aucune commande aujourd'hui
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {stats.recentOrders.map((order) => (
                    <div key={order.id} style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "12px", background: "rgba(0,212,255,0.03)",
                      border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)",
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {order.patient.fullName}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {formatDateTime(order.createdAt)} · {formatPrice(Number(order.totalAmount))}
                        </div>
                      </div>
                      <div className={`badge ${getStatusColor(order.status)}`} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {STATUS_ICON[order.status]} {getStatusLabel(order.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Alertes stock ── */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>⚠️ Alertes stock</h2>
                <a href="/pharmacy/stock?expiringSoon=true" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", textDecoration: "none" }}>
                  Voir tout →
                </a>
              </div>

              {stats.stockAlerts.length === 0 ? (
                <p style={{ color: "var(--accent-success)", fontSize: "0.875rem", textAlign: "center", padding: "20px" }}>
                  ✅ Aucune alerte
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {stats.stockAlerts.map((s) => {
                    const days = daysUntilExpiry(s.expirationDate);
                    const isExp = days < 0;
                    return (
                      <div key={s.id} style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "12px", background: isExp ? "rgba(255,71,87,0.05)" : "rgba(255,179,0,0.05)",
                        border: `1px solid ${isExp ? "rgba(255,71,87,0.2)" : "rgba(255,179,0,0.2)"}`,
                        borderRadius: "var(--radius-md)",
                      }}>
                        <AlertTriangle size={18} style={{ color: isExp ? "var(--accent-danger)" : "var(--accent-warning)", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.medicine.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {s.isLowStock && `Qté: ${s.quantity}`}
                            {s.isExpiringSoon && ` · ${isExp ? `Expiré il y a ${Math.abs(days)}j` : `Expire dans ${days}j`}`}
                          </div>
                        </div>
                        <a href="/pharmacy/wholesale" style={{
                          fontSize: "0.72rem", fontWeight: 700, color: "var(--accent-primary)",
                          textDecoration: "none", padding: "4px 10px",
                          border: "1px solid var(--border-default)", borderRadius: "50px", flexShrink: 0,
                        }}>
                          Commander
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginTop: "24px" }}>
            {[
              { href: "/pharmacy/stock", icon: "📦", label: "Gérer le stock", color: "var(--accent-primary)" },
              { href: "/pharmacy/orders", icon: "🛒", label: "Voir commandes", color: "var(--accent-success)" },
              { href: "/pharmacy/wholesale", icon: "🏭", label: "Commander B2B", color: "var(--accent-warning)" },
              { href: "/pharmacy/messages", icon: "💬", label: "Messagerie", color: "var(--accent-purple)" },
            ].map((a) => (
              <a key={a.href} href={a.href} style={{
                background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)", padding: "20px 16px",
                textDecoration: "none", textAlign: "center",
                transition: "all 0.2s ease", display: "block",
              }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>{a.icon}</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: a.color }}>{a.label}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
