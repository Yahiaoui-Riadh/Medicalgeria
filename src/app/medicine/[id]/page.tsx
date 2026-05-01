"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Pill, ShieldCheck, DollarSign, Globe, Building2, 
  Info, RefreshCw, ChevronRight, FileText, CheckCircle2, AlertCircle,
  Stethoscope, LayoutPanelLeft, Scale, Clock, MapPin
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface MedicineDetail {
  id: string;
  name: string;
  dci: string;
  dosage?: string;
  form?: string;
  laboratory?: string;
  category?: string;
  conditionnement?: string;
  paysOrigine?: string;
  isPrescriptionRequired: boolean;
  isPrinceps: boolean;
  isFrigo: boolean;
  isRemboursable: boolean;
  shp?: number;
  ppa?: number;
  codeCIP: string;
  description?: string;
  remarque?: string;
  designation2?: string;
}

interface PharmacyStock {
  pharmacyId: string;
  pharmacyName: string;
  address: string;
  city: string;
  sellingPrice: number;
  quantity: number;
  isOpen: boolean;
  isOnDuty: boolean;
}

export default function MedicineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [medicine, setMedicine] = useState<MedicineDetail | null>(null);
  const [stocks, setStocks] = useState<PharmacyStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // En conditions réelles, on ferait un appel API spécifique
        // Ici on simule pour la démo
        const res = await fetch(`/api/search/medicines?q=${params.id}`); // On triche un peu pour la démo
        const data = await res.json();
        
        if (data.data && data.data[0]) {
          setMedicine(data.data[0].medicine);
          setStocks(data.data[0].pharmacies);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id]);

  if (loading) return (
    <div className="hero-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <RefreshCw className="spinner" size={40} />
    </div>
  );

  if (!medicine) return <div>Médicament non trouvé</div>;

  return (
    <main className="hero-bg" style={{ minHeight: "100vh", paddingBottom: "100px" }}>
      {/* Header / Nav */}
      <nav style={{
        padding: "20px 40px",
        background: "rgba(5, 13, 26, 0.8)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", gap: "20px",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer" }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.2rem", fontWeight: 700 }}>Fiche produit</h1>
      </nav>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "30px 20px" }}>
        
        {/* Main Info Section */}
        <div className="glass-card" style={{ padding: "30px", marginBottom: "25px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "8px" }}>{medicine.name}</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
              {medicine.dosage} • {medicine.form}
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "30px" }}>
            {medicine.isPrinceps && <div className="badge badge-primary" style={{ padding: "6px 12px" }}>B (Princeps)</div>}
            {medicine.isRemboursable && <div className="badge badge-success" style={{ padding: "6px 12px" }}>Remboursable</div>}
            {medicine.isPrescriptionRequired && <div className="badge badge-purple" style={{ padding: "6px 12px" }}>Ordonnance</div>}
            {medicine.isFrigo && <div className="badge badge-warning" style={{ padding: "6px 12px" }}>🌡️ Frigo</div>}
          </div>

          {/* Caractéristiques générales */}
          <div style={{ marginBottom: "40px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Info size={18} /> Caractéristiques générales
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>DCI</span>
                <span style={{ fontWeight: 600 }}>{medicine.dci}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Laboratoire</span>
                <span style={{ fontWeight: 600 }}>{medicine.laboratory || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Pays d'origine</span>
                <span style={{ fontWeight: 600 }}>{medicine.paysOrigine || "Algérie"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Présentation</span>
                <span style={{ fontWeight: 600 }}>{medicine.conditionnement || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Usage thérapeutique (Simulé pour la démo) */}
          <div style={{ marginBottom: "40px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Stethoscope size={18} /> Usage thérapeutique
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: "8px", color: "var(--accent-primary)" }}>Classe Thérapeutique</div>
                <p style={{ fontSize: "0.9rem", lineHeight: "1.6", color: "var(--text-secondary)" }}>
                  {medicine.category || "Information non disponible"}
                </p>
              </div>
              {(medicine.description || medicine.remarque) && (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "8px", color: "var(--accent-secondary)" }}>Notes & Remarques</div>
                  <p style={{ fontSize: "0.9rem", lineHeight: "1.6", color: "var(--text-secondary)" }}>
                    {medicine.description}
                    {medicine.description && medicine.remarque && <br />}
                    {medicine.remarque}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Alternatives disponibles */}
          <Link href={`/rechercher?dci=${medicine.dci}`} style={{ textDecoration: "none" }}>
            <div style={{ 
              background: "rgba(107, 70, 255, 0.1)", 
              border: "1px solid rgba(107, 70, 255, 0.3)", 
              borderRadius: "var(--radius-lg)", 
              padding: "20px",
              display: "flex", alignItems: "center", gap: "15px",
              transition: "transform 0.2s"
            }} className="hover-scale">
               <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "var(--accent-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                 <RefreshCw size={20} color="#fff" />
               </div>
               <div style={{ flex: 1 }}>
                 <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Alternatives disponibles</div>
                 <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Trouver des génériques pour cette DCI</div>
               </div>
               <ChevronRight size={20} style={{ color: "var(--text-muted)" }} />
            </div>
          </Link>
        </div>

        {/* Tarification */}
        <div className="glass-card" style={{ padding: "25px", marginBottom: "25px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Scale size={18} /> Tarification
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ padding: "15px", background: "rgba(0,229,160,0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(0,229,160,0.1)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Tarif de référence (SHP)</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent-success)" }}>{formatPrice(medicine.shp || 0)}</div>
            </div>
            <div style={{ padding: "15px", background: "rgba(0,212,255,0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(0,212,255,0.1)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Prix Public Algérie (PPA)</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent-primary)" }}>{formatPrice(medicine.ppa || 0)}</div>
            </div>
          </div>
        </div>

        {/* Disponibilité en pharmacie */}
        <div className="glass-card" style={{ padding: "25px" }}>
           <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <MapPin size={18} /> Pharmacies disponibles
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {stocks.length === 0 ? (
              <p style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>Aucune pharmacie avec stock trouvée à proximité.</p>
            ) : stocks.map(p => (
              <div key={p.pharmacyId} style={{ 
                padding: "15px", background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-md)", 
                border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div>
                  <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                    {p.pharmacyName}
                    {p.isOnDuty && <span className="badge badge-purple" style={{ fontSize: "0.6rem" }}>Garde</span>}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{p.address}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                   <div style={{ fontWeight: 800, color: "var(--accent-primary)", fontSize: "1.1rem" }}>{formatPrice(p.sellingPrice)}</div>
                   <Link href={`/commande/new?medicineId=${medicine.id}&pharmacyId=${p.pharmacyId}`} className="btn-primary btn-sm" style={{ marginTop: "5px" }}>
                     Commander
                   </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style jsx>{`
        .hover-scale:hover {
          transform: translateY(-2px);
          background: rgba(107, 70, 255, 0.15) !important;
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
