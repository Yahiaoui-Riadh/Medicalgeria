"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronLeft, ShoppingBag, Store, Pill, AlertCircle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

function OrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const medicineId = searchParams.get("medicineId");
  const pharmacyId = searchParams.get("pharmacyId");
  const quantity = parseInt(searchParams.get("q") || "1");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<{ medicine: any; pharmacy: any; stock: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/commande/new?medicineId=${medicineId}&pharmacyId=${pharmacyId}`);
      return;
    }

    if (status === "authenticated" && medicineId && pharmacyId) {
      fetchDetails();
    }
  }, [status, medicineId, pharmacyId]);

  async function fetchDetails() {
    try {
      setLoading(true);
      // On utilise la recherche pour récupérer les détails car on n'a pas d'API single-item dédiée simple
      const res = await fetch(`/api/search/medicines?q=${medicineId}`);
      const result = await res.json();
      
      // Trouver le médicament spécifique dans les résultats
      const found = result.data?.find((r: any) => r.medicine.id === medicineId);
      if (found) {
        const pharmacy = found.pharmacies.find((p: any) => p.pharmacyId === pharmacyId);
        setData({
          medicine: found.medicine,
          pharmacy: pharmacy,
          stock: pharmacy // L'objet pharmacy contient les infos de prix/quantité du stock
        });
      } else {
        setError("Médicament introuvable ou indisponible.");
      }
    } catch (err) {
      setError("Erreur lors de la récupération des détails.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/patient/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacyId,
          items: [{ medicineId, quantity }]
        })
      });
      
      const result = await res.json();
      if (res.ok) {
        router.push("/patient/orders?success=true");
      } else {
        alert(result.error || "Erreur lors de la réservation");
      }
    } catch (err) {
      alert("Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)" }}>
      <Loader2 className="spinner" size={40} color="var(--accent-primary)" />
    </div>
  );

  if (error || !data) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg-main)", gap: "20px" }}>
      <AlertCircle size={48} color="var(--accent-danger)" />
      <p>{error || "Données manquantes"}</p>
      <Link href="/rechercher" className="btn-secondary">Retour à la recherche</Link>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", color: "var(--text-primary)" }} className="hero-bg">
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
        <Link href="/rechercher" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", textDecoration: "none", marginBottom: "30px", fontSize: "0.9rem" }}>
          <ChevronLeft size={16} /> Retour à la recherche
        </Link>

        <div className="glass-card" style={{ padding: "0", overflow: "hidden" }}>
          <header style={{ padding: "30px", borderBottom: "1px solid var(--border-subtle)", background: "rgba(0,212,255,0.05)" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "12px" }}>
              <ShoppingBag color="var(--accent-primary)" /> Finaliser votre réservation
            </h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontSize: "0.9rem" }}>Veuillez confirmer les détails de votre commande</p>
          </header>

          <div style={{ padding: "30px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
              {/* Détails Médicament */}
              <div>
                <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Pill size={14} /> Produit sélectionné
                </h3>
                <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "5px" }}>{data.medicine.name}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{data.medicine.dci}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "5px" }}>{data.medicine.dosage} {data.medicine.form}</div>
                  {data.medicine.isPrescriptionRequired && (
                    <div className="badge badge-purple" style={{ marginTop: "12px", fontSize: "0.7rem" }}>Ordonnance requise</div>
                  )}
                </div>
              </div>

              {/* Détails Pharmacie */}
              <div>
                <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Store size={14} /> Pharmacie de retrait
                </h3>
                <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "5px" }}>{data.pharmacy.pharmacyName}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{data.pharmacy.address}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "5px" }}>{data.pharmacy.city}</div>
                  <div style={{ marginTop: "12px", fontSize: "0.75rem", color: "var(--accent-success)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={12} /> Disponible pour retrait immédiat
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "40px", padding: "25px", background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Quantité</span>
                <span style={{ fontWeight: 700 }}>{quantity} unité{quantity > 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", paddingTop: "15px", borderTop: "1px dashed var(--border-subtle)" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>Total à payer en pharmacie</span>
                <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--accent-primary)" }}>{formatPrice(data.stock.sellingPrice * quantity)}</span>
              </div>

              <div style={{ display: "flex", gap: "15px" }}>
                <button 
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="btn-primary" 
                  style={{ flex: 2, padding: "16px", borderRadius: "12px", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                >
                  {submitting ? <Loader2 className="spinner" /> : (
                    <>Confirmer la réservation <ArrowRight size={18} /></>
                  )}
                </button>
                <button onClick={() => router.back()} className="btn-secondary" style={{ flex: 1, borderRadius: "12px" }}>Annuler</button>
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px", alignItems: "flex-start", padding: "15px", background: "rgba(255,179,0,0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,179,0,0.2)" }}>
              <AlertCircle size={18} color="var(--accent-warning)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                <strong>Note :</strong> Cette réservation est valable 24h. Le paiement s'effectue directement à la pharmacie lors du retrait. Munissez-vous de votre ordonnance si nécessaire.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)" }}>
        <Loader2 className="spinner" size={40} color="var(--accent-primary)" />
      </div>
    }>
      <OrderContent />
    </Suspense>
  );
}
