import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { ShoppingCart, Package, TrendingUp, Users, Clock, CheckCircle, BarChart3, ArrowUpRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

async function getWholesalerStats(wholesalerId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [ordersToday, totalRevenue, pendingOrders, catalogCount] = await Promise.all([
    prisma.wholesalerOrder.count({ where: { wholesalerId, createdAt: { gte: today } } }),
    prisma.wholesalerOrder.aggregate({ where: { wholesalerId, status: "DELIVERED" }, _sum: { totalAmount: true } }),
    prisma.wholesalerOrder.count({ where: { wholesalerId, status: "SENT" } }),
    prisma.wholesalerCatalog.count({ where: { wholesalerId } }),
  ]);

  const recentOrders = await prisma.wholesalerOrder.findMany({
    where: { wholesalerId },
    include: { pharmacy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    ordersToday,
    totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
    pendingOrders,
    catalogCount,
    recentOrders,
  };
}

export default async function WholesalerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const wholesalerId = (session.user as any).wholesalerId;
  if (!wholesalerId) redirect("/login?error=unauthorized");

  const stats = await getWholesalerStats(wholesalerId);

  return (
    <div className="dashboard-wrapper">
      <DashboardSidebar role="WHOLESALER" userName={session.user.name ?? ""} />

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Espace Grossiste</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Vue d'ensemble de votre activité B2B</p>
          </div>
        </header>

        <div className="dashboard-content">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="stat-label">Commandes reçues</span>
                <ShoppingCart size={20} style={{ color: "var(--accent-primary)" }} />
              </div>
              <div className="stat-value">{stats.ordersToday}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Aujourd'hui</div>
            </div>

            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="stat-label">CA Total (Livré)</span>
                <TrendingUp size={20} style={{ color: "var(--accent-success)" }} />
              </div>
              <div className="stat-value" style={{ fontSize: "1.5rem" }}>{formatPrice(stats.totalRevenue)}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Depuis l'inscription</div>
            </div>

            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="stat-label">À confirmer</span>
                <Clock size={20} style={{ color: "var(--accent-warning)" }} />
              </div>
              <div className="stat-value" style={{ color: "var(--accent-warning)" }}>{stats.pendingOrders}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Commandes en attente</div>
            </div>

            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="stat-label">Mon Catalogue</span>
                <Package size={20} style={{ color: "var(--accent-purple)" }} />
              </div>
              <div className="stat-value">{stats.catalogCount}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Produits référencés</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
            <div className="glass-card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "20px" }}>Dernières commandes B2B</h2>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Pharmacie</th>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: "center", padding: "40px" }}>Aucune commande</td></tr>
                    ) : stats.recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.pharmacy.name}</td>
                        <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td>{formatPrice(Number(o.totalAmount))}</td>
                        <td><span className="badge badge-gray">{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "20px" }}>Actions rapides</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Link href="/wholesaler/catalog" className="btn-secondary" style={{ justifyContent: "space-between", padding: "16px" }}>
                  <span>Modifier les prix</span> <ArrowUpRight size={16} />
                </Link>
                <Link href="/wholesaler/catalog" className="btn-secondary" style={{ justifyContent: "space-between", padding: "16px" }}>
                  <span>Gérer les stocks</span> <ArrowUpRight size={16} />
                </Link>
                <Link href="/wholesaler/orders" className="btn-primary" style={{ padding: "16px" }}>
                   Traiter les commandes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
