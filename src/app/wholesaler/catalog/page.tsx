"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Search, Plus, Package, RefreshCw, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface CatalogItem {
  id: string;
  unitPrice: string;
  minOrderQuantity: number;
  isAvailable: boolean;
  medicine: { name: string; dci: string; dosage?: string; codeCIP: string };
}

export default function WholesalerCatalogPage() {
  const { data: session } = useSession();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    // Note: In real app, we'd have a specific endpoint for the logged in wholesaler
    const res = await fetch(`/api/wholesaler/catalog`);
    const data = await res.json();
    setCatalog(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);
  
  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce produit de votre catalogue ?")) return;
    try {
      const res = await fetch(`/api/wholesaler/catalog?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchCatalog();
      else alert("Erreur lors de la suppression");
    } catch (e) {
      console.error(e);
    }
  };

  const role = (session?.user as any)?.role ?? "WHOLESALER";

  return (
    <div className="dashboard-wrapper">
      <DashboardSidebar role={role} userName={(session?.user as any)?.name} />
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Mon Catalogue</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{catalog.length} produits référencés</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-secondary btn-sm" onClick={fetchCatalog}><RefreshCw size={14} /> Actualiser</button>
            <button className="btn-primary btn-sm"><Plus size={14} /> Ajouter un produit</button>
          </div>
        </header>

        <div className="dashboard-content">
          <div style={{ marginBottom: "20px" }}>
            <div style={{ position: "relative", maxWidth: "400px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                type="text" className="input-field" placeholder="Rechercher dans mon catalogue..." 
                style={{ paddingLeft: "40px" }} value={search} onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Médicament</th>
                  <th>CIP</th>
                  <th>Prix Unitaire</th>
                  <th>Qté Min. Commande</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array(5).fill(0).map((_, i) => (
                  <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: "18px" }} /></td>)}</tr>
                )) : catalog.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Votre catalogue est vide</td></tr>
                ) : catalog.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.medicine.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.medicine.dci}</div>
                    </td>
                    <td style={{ fontSize: "0.85rem", fontFamily: "monospace" }}>{item.medicine.codeCIP}</td>
                    <td style={{ fontWeight: 700, color: "var(--accent-primary)" }}>{formatPrice(item.unitPrice)}</td>
                    <td>{item.minOrderQuantity} unités</td>
                    <td>
                      {item.isAvailable ? (
                        <span className="badge badge-success"><CheckCircle size={12} /> Disponible</span>
                      ) : (
                        <span className="badge badge-danger"><XCircle size={12} /> Rupture</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn-secondary btn-sm" style={{ padding: "6px" }} title="Modifier"><Pencil size={14} /></button>
                        <button 
                          className="btn-danger btn-sm" 
                          style={{ padding: "6px" }} 
                          title="Supprimer"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
