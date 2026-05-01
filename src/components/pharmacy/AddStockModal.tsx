"use client";

import { useState, useEffect } from "react";
import { Search, X, Loader2, Check, Package, Plus } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Medicine {
  id: string;
  name: string;
  dci: string;
  dosage?: string;
  codeCIP: string;
}

interface AddStockModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStockModal({ onClose, onSuccess }: AddStockModalProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Medicine[]>([]);
  const [selected, setSelected] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    quantity: 1,
    purchasePrice: 0,
    sellingPrice: 0,
    expirationDate: "",
    batchNumber: "",
  });

  useEffect(() => {
    if (search.length < 3) {
      setResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/medicines?q=${encodeURIComponent(search)}&radius=100000`);
        const data = await res.json();
        // L'API de recherche publique renvoie un format différent, on adapte
        const medicines = (data.data || []).map((r: any) => r.medicine);
        setResults(medicines);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      const payload = {
        medicineId: selected.id,
        ...form,
      };

      const res = await fetch("/api/pharmacy/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert(data.error || "Erreur lors de l'ajout");
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-content" style={{ width: "600px", padding: 0, overflow: "hidden" }}>
        <header style={{ padding: "20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
            <Plus size={20} color="var(--accent-primary)" /> Ajouter au stock
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={20} /></button>
        </header>

        <div style={{ padding: "25px" }}>
          {!selected ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Rechercher un médicament (Base nationale)</label>
              <div style={{ position: "relative" }}>
                <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input 
                  type="text" className="input-field" placeholder="Nom ou DCI (ex: Doliprane...)" 
                  style={{ paddingLeft: "42px" }} value={search} onChange={(e) => setSearch(e.target.value)} autoFocus
                />
              </div>

              <div style={{ maxHeight: "300px", overflowY: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                {loading ? (
                  <div style={{ padding: "40px", textAlign: "center" }}><Loader2 className="spinner" style={{ margin: "0 auto" }} /></div>
                ) : results.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {search.length < 3 ? "Tapez au moins 3 caractères" : "Aucun médicament trouvé"}
                  </div>
                ) : (
                  results.map((m) => (
                    <div 
                      key={m.id} onClick={() => setSelected(m)}
                      style={{ padding: "12px 15px", borderBottom: "1px solid var(--border-subtle)", cursor: "pointer", transition: "background 0.2s" }}
                      className="search-item"
                    >
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{m.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.dci} • {m.codeCIP}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ padding: "12px", background: "rgba(0,212,255,0.05)", borderRadius: "var(--radius-md)", border: "1px solid var(--accent-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{selected.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{selected.dci}</div>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="btn-secondary btn-sm" style={{ padding: "4px 8px" }}>Changer</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "6px", display: "block" }}>Quantité</label>
                  <input 
                    type="number" className="input-field" min="1" required 
                    value={form.quantity || ""} 
                    onChange={(e) => setForm({...form, quantity: e.target.value === "" ? 0 : parseInt(e.target.value)})} 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "6px", display: "block" }}>Numéro de lot</label>
                  <input type="text" className="input-field" placeholder="ex: LOT12345" value={form.batchNumber} onChange={(e) => setForm({...form, batchNumber: e.target.value})} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "6px", display: "block" }}>Prix d'achat (DA)</label>
                  <input 
                    type="number" step="0.01" className="input-field" required 
                    value={form.purchasePrice || ""} 
                    onChange={(e) => setForm({...form, purchasePrice: e.target.value === "" ? 0 : parseFloat(e.target.value)})} 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "6px", display: "block" }}>Prix de vente (DA)</label>
                  <input 
                    type="number" step="0.01" className="input-field" required 
                    value={form.sellingPrice || ""} 
                    onChange={(e) => setForm({...form, sellingPrice: e.target.value === "" ? 0 : parseFloat(e.target.value)})} 
                  />
                </div>
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "6px", display: "block" }}>Date d'expiration</label>
                  <input type="date" className="input-field" required value={form.expirationDate} onChange={(e) => setForm({...form, expirationDate: e.target.value})} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Annuler</button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={submitting}>
                  {submitting ? <Loader2 className="spinner" /> : "Confirmer l'ajout"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
          display: flex; align-items: center; justifyContent: center; z-index: 1000;
        }
        .search-item:hover { background: rgba(0,212,255,0.08); }
        .form-group label { color: var(--text-secondary); }
      `}</style>
    </div>
  );
}

