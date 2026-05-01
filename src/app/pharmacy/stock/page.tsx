"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import AddStockModal from "@/components/pharmacy/AddStockModal";
import { Search, Plus, AlertTriangle, Filter, RefreshCw, Eye, EyeOff, Pencil, ExternalLink, Package, Download, Upload, MoreVertical, Trash2 } from "lucide-react";
import { formatPrice, formatDate, daysUntilExpiry } from "@/lib/utils";
import * as XLSX from "xlsx";
import Link from "next/link";

interface StockItem {
  id: string; quantity: number; purchasePrice: string; sellingPrice: string;
  expirationDate: string; isVisible: boolean; isLowStock: boolean; isExpiringSoon: boolean;
  medicine: { name: string; dci: string; dosage?: string; form?: string; isPrescriptionRequired: boolean; isFrigo: boolean; codeCIP: string };
}

const ActionMenu = ({ s, activeMenu, setActiveMenu, toggleVisibility, deleteStock }: any) => {
  const isMenuOpen = activeMenu === s.id;
  return (
    <div style={{ position: "relative" }}>
      <button 
        onClick={(e) => { e.stopPropagation(); setActiveMenu(isMenuOpen ? null : s.id); }}
        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
        className="btn-icon-hover"
      >
        <MoreVertical size={18} />
      </button>

      {isMenuOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setActiveMenu(null)} />
          <div style={{ 
            position: "absolute", right: "0", top: "40px", width: "180px", 
            background: "var(--bg-secondary)", border: "1px solid var(--border-default)", 
            borderRadius: "var(--radius-md)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", 
            zIndex: 100, padding: "6px", animation: "fadeIn 0.2s ease"
          }}>
            <button className="dropdown-item" style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", borderRadius: "4px", fontSize: "0.85rem", textAlign: "left" }}>
              <Pencil size={14} /> Modifier
            </button>
            <button 
              onClick={() => { toggleVisibility(s.id, s.isVisible); setActiveMenu(null); }}
              className="dropdown-item" 
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", borderRadius: "4px", fontSize: "0.85rem", textAlign: "left" }}
            >
              {s.isVisible ? <><EyeOff size={14} /> Masquer</> : <><Eye size={14} /> Afficher</>}
            </button>
            {s.isLowStock && (
              <Link 
                href="/pharmacy/wholesale" 
                className="dropdown-item" 
                style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", padding: "10px", color: "var(--accent-warning)", cursor: "pointer", borderRadius: "4px", fontSize: "0.85rem" }}
              >
                <ExternalLink size={14} /> Commander
              </Link>
            )}
            <div style={{ height: "1px", background: "var(--border-subtle)", margin: "4px 0" }} />
            <button 
              onClick={() => { deleteStock(s.id); setActiveMenu(null); }}
              className="dropdown-item" 
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "none", border: "none", color: "var(--accent-danger)", cursor: "pointer", borderRadius: "4px", fontSize: "0.85rem", textAlign: "left" }}
            >
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default function PharmacyStockPage() {

  const { data: session } = useSession();
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLow, setFilterLow] = useState(false);
  const [filterExp, setFilterExp] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type = "success") => { 
    setToast({ msg, type }); 
    setTimeout(() => setToast(null), 3000); 
  };

  const fetchStocks = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterLow) params.set("lowStock", "true");
      if (filterExp) params.set("expiringSoon", "true");
      if (!reset && cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/pharmacy/stock?${params}`);
      const data = await res.json();
      
      setStocks((prev) => reset ? data.data ?? [] : [...prev, ...(data.data ?? [])]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [search, filterLow, filterExp, cursor]);

  useEffect(() => { 
    setCursor(null); 
    fetchStocks(true); 
  }, [search, filterLow, filterExp, fetchStocks]);

  const handleExportXLSX = () => {
    if (stocks.length === 0) return;
    const data = stocks.map(s => ({
      "Médicament": s.medicine.name,
      "DCI": s.medicine.dci,
      "Code CIP": s.medicine.codeCIP,
      "Quantité": s.quantity,
      "Prix Achat": parseFloat(s.purchasePrice),
      "Prix Vente": parseFloat(s.sellingPrice),
      "Expiration": s.expirationDate
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock");
    XLSX.writeFile(workbook, `stock_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportXLSX = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];

        const items = json.map(row => ({
          codeCIP: String(row["Code CIP"] || row["CIP"] || row["codeCIP"] || ""),
          quantity: parseInt(row["Quantité"] || row["Stock"] || row["quantity"] || "0"),
          purchasePrice: parseFloat(row["Prix Achat"] || row["Achat"] || row["purchasePrice"] || "0"),
          sellingPrice: parseFloat(row["Prix Vente"] || row["Vente"] || row["sellingPrice"] || "0"),
          expirationDate: row["Expiration"] || row["Date"] || row["expirationDate"]
        })).filter(i => i.codeCIP && !isNaN(i.quantity));

        if (items.length === 0) {
          showToast("Aucune donnée valide trouvée", "error");
          return;
        }

        const res = await fetch("/api/pharmacy/stock/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(items)
        });

        if (res.ok) {
          const result = await res.json();
          showToast(`Import réussi: ${result.results.updated} mis à jour, ${result.results.created} créés`);
          fetchStocks(true);
        } else {
          showToast("Erreur lors de l'import", "error");
        }
      } catch (err) {
        showToast("Fichier Excel invalide", "error");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  async function toggleVisibility(id: string, current: boolean) {
    const res = await fetch(`/api/pharmacy/stock/${id}`, { 
      method: "PATCH", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ isVisible: !current }) 
    });
    if (res.ok) { 
      setStocks((s) => s.map((i) => i.id === id ? { ...i, isVisible: !current } : i)); 
      showToast(current ? "Masqué" : "Visible"); 
    } else {
      showToast("Erreur", "error");
    }
  }

  async function adjustQty(id: string, qty: number, delta: number) {
    const newQty = Math.max(0, qty + delta);
    const res = await fetch(`/api/pharmacy/stock/${id}`, { 
      method: "PATCH", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ quantity: newQty }) 
    });
    if (res.ok) {
      setStocks((s) => s.map((i) => i.id === id ? { ...i, quantity: newQty, isLowStock: newQty <= 10 } : i));
    }
  }

  async function deleteStock(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer ce produit de votre stock ?")) return;
    const res = await fetch(`/api/pharmacy/stock/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      setStocks(s => s.filter(i => i.id !== id));
      showToast("Produit supprimé");
    } else {
      showToast(data.error || "Erreur lors de la suppression", "error");
    }
  }

  const role = (session?.user as any)?.role ?? "PHARMACIST";

  return (
    <div className="dashboard-wrapper">
      <DashboardSidebar role={role} pharmacyName={(session?.user as any)?.name} />
      <div className="dashboard-main" onClick={() => setActiveMenu(null)}>
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Gestion du stock</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{stocks.length} produits</p>
          </div>
          <div className="btn-group" style={{ display: "flex", gap: "10px" }}>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".xlsx, .xls" 
              onChange={handleImportXLSX} 
            />
            <button className="btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <Upload size={14} /> <span className="desktop-only">{importing ? "Import..." : "Importer"}</span>
            </button>
            <button className="btn-secondary btn-sm" onClick={handleExportXLSX}>
              <Download size={14} /> <span className="desktop-only">Exporter</span>
            </button>
            <button className="btn-secondary btn-sm" onClick={() => fetchStocks(true)}><RefreshCw size={14} /> <span className="desktop-only">Actualiser</span></button>
            <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}><Plus size={14} /> Ajouter</button>
          </div>
        </header>

        <div className="dashboard-content">
          {/* ... filters same ... */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 260px" }}>
              <Search size={15} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Médicament, DCI..." 
                style={{ paddingLeft: "40px" }} 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <button className={filterLow ? "btn-danger btn-sm" : "btn-secondary btn-sm"} onClick={() => setFilterLow(!filterLow)}>
              <AlertTriangle size={13} /> <span className="desktop-only">Stock faible</span>
            </button>
            <button className={filterExp ? "btn-danger btn-sm" : "btn-secondary btn-sm"} onClick={() => setFilterExp(!filterExp)}>
              <Filter size={13} /> <span className="desktop-only">Expirant</span>
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="table-wrapper desktop-only" style={{ paddingBottom: activeMenu ? "150px" : "20px" }}>
            {/* ... Existing table content ... */}
            <table>
              <thead>
                <tr>
                  <th>Médicament</th><th>DCI</th><th>Quantité</th>
                  <th>Prix achat</th><th>Prix vente</th><th>Expiration</th>
                  <th>Statut</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && stocks.length === 0 ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>{Array(8).fill(0).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: "18px" }} /></td>
                    ))}</tr>
                  ))
                ) : stocks.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                    <Package size={36} style={{ display: "block", margin: "0 auto 12px", opacity: 0.3 }} />
                    Aucun produit trouvé
                  </td></tr>
                ) : stocks.map((s) => {
                  const days = daysUntilExpiry(s.expirationDate);
                  const isMenuOpen = activeMenu === s.id;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{s.medicine.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{s.medicine.codeCIP}</div>
                      </td>
                      <td><div style={{ fontSize: "0.8rem" }}>{s.medicine.dci}</div></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button onClick={() => adjustQty(s.id, s.quantity, -1)} style={{ background: "none", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", borderRadius: "4px", width: "22px", height: "22px", cursor: "pointer" }}>−</button>
                          <span style={{ fontWeight: 700, color: s.isLowStock ? "var(--accent-warning)" : "inherit", minWidth: "28px", textAlign: "center" }}>{s.quantity}</span>
                          <button onClick={() => adjustQty(s.id, s.quantity, 1)} style={{ background: "none", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", borderRadius: "4px", width: "22px", height: "22px", cursor: "pointer" }}>+</button>
                        </div>
                      </td>
                      <td style={{ fontSize: "0.875rem" }}>{formatPrice(s.purchasePrice)}</td>
                      <td style={{ fontSize: "0.875rem", fontWeight: 600 }}>{formatPrice(s.sellingPrice)}</td>
                      <td>
                        <div style={{ fontSize: "0.875rem", color: days < 0 ? "var(--accent-danger)" : days < 30 ? "var(--accent-warning)" : "inherit" }}>{formatDate(s.expirationDate)}</div>
                      </td>
                      <td>
                        {!s.isVisible && <span className="badge badge-gray" style={{ fontSize: "0.68rem" }}>Masqué</span>}
                        {s.isLowStock && <span className="badge badge-warning" style={{ fontSize: "0.68rem" }}>⚠ Faible</span>}
                        {days < 0 && <span className="badge badge-danger" style={{ fontSize: "0.68rem" }}>Expiré</span>}
                        {!s.isLowStock && days >= 0 && s.isVisible && <span className="badge badge-success" style={{ fontSize: "0.68rem" }}>✓ OK</span>}
                      </td>
                      <td>
                        <ActionMenu s={s} activeMenu={activeMenu} setActiveMenu={setActiveMenu} toggleVisibility={toggleVisibility} deleteStock={deleteStock} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="mobile-only" style={{ paddingBottom: activeMenu ? "200px" : "20px" }}>
            {loading && stocks.length === 0 ? (
              Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: "150px", marginBottom: "12px", borderRadius: "12px" }} />)
            ) : stocks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Aucun produit</div>
            ) : stocks.map((s) => {
              const days = daysUntilExpiry(s.expirationDate);
              return (
                <div key={s.id} className="mobile-stock-card">
                  <div className="card-header">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{s.medicine.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>{s.medicine.codeCIP} • {s.medicine.dci}</div>
                    </div>
                    <ActionMenu s={s} activeMenu={activeMenu} setActiveMenu={setActiveMenu} toggleVisibility={toggleVisibility} deleteStock={deleteStock} />
                  </div>
                  <div className="card-info">
                    <div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: "2px" }}>Prix Vente</div>
                      <div style={{ fontWeight: 600 }}>{formatPrice(s.sellingPrice)}</div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: "2px" }}>Expiration</div>
                      <div style={{ color: days < 0 ? "var(--accent-danger)" : days < 30 ? "var(--accent-warning)" : "inherit" }}>
                        {formatDate(s.expirationDate)} ({days}j)
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <div style={{ display: "flex", gap: "4px" }}>
                      {!s.isVisible && <span className="badge badge-gray" style={{ fontSize: "0.65rem" }}>Masqué</span>}
                      {s.isLowStock && <span className="badge badge-warning" style={{ fontSize: "0.65rem" }}>Faible</span>}
                      {days < 0 && <span className="badge badge-danger" style={{ fontSize: "0.65rem" }}>Expiré</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button onClick={() => adjustQty(s.id, s.quantity, -1)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "6px", width: "30px", height: "30px", fontSize: "18px" }}>−</button>
                      <span style={{ fontWeight: 800, fontSize: "1.1rem", minWidth: "30px", textAlign: "center" }}>{s.quantity}</span>
                      <button onClick={() => adjustQty(s.id, s.quantity, 1)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "6px", width: "30px", height: "30px", fontSize: "18px" }}>+</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>


          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button className="btn-secondary" onClick={() => fetchStocks()} disabled={loading}>
                {loading ? <span className="spinner" /> : "Charger plus"}
              </button>
            </div>
          )}
        </div>
      </div>
      {showAddModal && (
        <AddStockModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => { showToast("Stock ajouté avec succès"); fetchStocks(true); }} 
        />
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.type === "success" ? "✓" : "✗"} {toast.msg}</div>}
    </div>
  );
}
