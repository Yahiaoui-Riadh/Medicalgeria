"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search as SearchIcon, MapPin, Pill, Clock, ChevronRight, Navigation, Info, Moon, ShieldCheck, DollarSign } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface PharmacyResult {
// ... same ...
  pharmacyId: string;
  pharmacyName: string;
  address: string;
  city: string;
  distance: number;
  sellingPrice: number;
  quantity: number;
  isOpen: boolean;
  isOnDuty: boolean;
}

interface MedicineResult {
  medicine: {
    id: string;
    name: string;
    dci: string;
    dosage?: string;
    form?: string;
    isPrescriptionRequired: boolean;
    shp?: number;
    ppa?: number;
  };
  pharmacies: PharmacyResult[];
}

export default function SearchPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQ);
  const [suggestions, setSuggestions] = useState<string[]>([]);
// ... same ...
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState<MedicineResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({ lat: 36.737, lng: 3.086 }); // Default Alger
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [meta, setMeta] = useState<{ provider: string; total: number } | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });
        
        // Si on a une query initiale, on lance la recherche avec la nouvelle localisation
        if (initialQ) {
          handleSearchExplicit(initialQ, lat, lng);
        }
      }, (err) => {
        // Fallback si géoloc refusée
        if (initialQ) handleSearchExplicit(initialQ, 36.737, 3.086);
      });
    } else if (initialQ) {
      handleSearchExplicit(initialQ, 36.737, 3.086);
    }
  }, [initialQ]);

  // J'ajoute une fonction explicite pour éviter les problèmes de closure avec location
  async function handleSearchExplicit(q: string, lat: number, lng: number) {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("q", q);
      params.set("lat", lat.toString());
      params.set("lng", lng.toString());
      const res = await fetch(`/api/search/medicines?${params.toString()}`);
      const data = await res.json();
      setResults(data.data || []);
      setMeta({ provider: data.meta?.provider, total: data.total });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }


  // Fetch suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        try {
          const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          setSuggestions(data.data || []);
          setShowSuggestions(true);
        } catch (e) {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const selectSuggestion = (s: string) => {
    setQuery(s);
    setSuggestions([]);
    setShowSuggestions(false);
    handleSearch(undefined, s);
  };

  async function handleSearch(e?: React.FormEvent, overrideQuery?: string) {
    if (e) e.preventDefault();
    const q = overrideQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setShowSuggestions(false);
    try {
      const params = new URLSearchParams();
      params.set("q", q);
      params.set("lat", location.lat.toString());
      params.set("lng", location.lng.toString());
      if (isOnDuty) params.set("isOnDuty", "true");
      if (openNow) params.set("openNow", "true");

      const res = await fetch(`/api/search/medicines?${params.toString()}`);
      const data = await res.json();
      setResults(data.data ?? []);
      setMeta({ 
        provider: data.meta?.provider ?? "prisma", 
        total: data.total ?? 0 
      });
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  }

  // Trigger search when filters change
  useEffect(() => {
    if (query.trim()) handleSearch();
  }, [isOnDuty, openNow]);

  return (
    <main style={{ minHeight: "100vh" }} className="hero-bg">
      <nav style={{
        padding: "20px 40px",
        background: "rgba(5, 13, 26, 0.8)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>⚕️</span>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: "var(--text-primary)" }}>Medicalgeria</span>
        </Link>
        {status === "authenticated" ? (
          <Link 
            href={
              (session?.user as any)?.role === "PHARMACIST" ? "/pharmacy/dashboard" :
              (session?.user as any)?.role === "WHOLESALER" ? "/wholesaler/dashboard" :
              (session?.user as any)?.role === "ADMIN" ? "/admin/dashboard" : "/patient/dashboard"
            } 
            className="btn-secondary btn-sm"
          >
            Tableau de bord
          </Link>
        ) : (
          <Link href="/login" className="btn-secondary btn-sm">Mon compte</Link>
        )}
      </nav>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "2.5rem", fontWeight: 900, marginBottom: "16px" }}>
            Trouvez votre <span className="gradient-text">médicament</span>
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>Recherchez parmi des milliers de pharmacies à travers l'Algérie</p>
        </div>

        <div 
          style={{ marginBottom: "40px", position: "relative" }} 
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSearch} style={{
            display: "flex", gap: "12px", marginBottom: "20px",
            background: "var(--bg-glass)", padding: "10px", borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border-default)", boxShadow: "var(--shadow-glow)"
          }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px", paddingLeft: "12px" }}>
              <SearchIcon size={20} style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Nom du médicament, DCI, laboratoire..."
                style={{ background: "none", border: "none", outline: "none", color: "var(--text-primary)", width: "100%", fontSize: "1rem" }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ borderRadius: "50px", padding: "12px 30px" }}>
              {loading ? <span className="spinner" /> : "Rechercher"}
            </button>
          </form>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "75px", left: "10px", right: "140px",
              background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-default)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              zIndex: 50, overflow: "hidden", animation: "fadeIn 0.2s ease"
            }}>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => selectSuggestion(s)}
                  style={{
                    padding: "12px 16px", cursor: "pointer",
                    borderBottom: i === suggestions.length - 1 ? "none" : "1px solid var(--border-subtle)",
                    transition: "all 0.2s", display: "flex", alignItems: "center", gap: "10px"
                  }}
                  className="suggestion-item"
                >
                  <Pill size={14} style={{ color: "var(--accent-primary)" }} />
                  <span style={{ fontSize: "0.9rem" }}>{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button 
              onClick={() => setIsOnDuty(!isOnDuty)}
              className={isOnDuty ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
              style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "20px" }}
            >
              <Moon size={14} /> Pharmacie de Garde
            </button>
            <button 
              onClick={() => setOpenNow(!openNow)}
              className={openNow ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
              style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "20px" }}
            >
              <Clock size={14} /> Ouvert maintenant
            </button>
          </div>
        </div>

        {meta && query && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", padding: "0 10px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {meta.total} résultat{meta.total > 1 ? "s" : ""} trouvé{meta.total > 1 ? "s" : ""}
            </span>
            {meta.provider === "meilisearch" && (
              <span className="badge badge-success" style={{ fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <ShieldCheck size={12} /> Autocorrection active
              </span>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {results.map((r) => (
            <div key={r.medicine.id} className="glass-card" style={{ padding: "0", overflow: "hidden" }}>
              <div style={{ padding: "24px", background: "rgba(0,212,255,0.05)", borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Link href={`/medicine/${r.medicine.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{r.medicine.name}</h3>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{r.medicine.dci} • {r.medicine.dosage} {r.medicine.form}</p>
                    
                    {/* Prices SHP/PPA */}
                    <div style={{ display: "flex", gap: "15px", marginTop: "12px" }}>
                       {r.medicine.shp && (
                         <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                           <ShieldCheck size={12} color="var(--accent-success)" /> SHP: {formatPrice(r.medicine.shp)}
                         </div>
                       )}
                       {r.medicine.ppa && (
                         <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                           <DollarSign size={12} color="var(--accent-primary)" /> PPA: {formatPrice(r.medicine.ppa)}
                         </div>
                       )}
                    </div>
                  </Link>
                  {r.medicine.isPrescriptionRequired && (
                    <span className="badge badge-purple">Sur ordonnance</span>
                  )}
                </div>
              </div>
              
              <div style={{ padding: "20px" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                   <MapPin size={14} /> Pharmacies à proximité avec stock
                </h4>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {r.pharmacies.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-subtle)" }}>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Produit actuellement indisponible dans les pharmacies de votre zone.</p>
                      <Link href={`/medicine/${r.medicine.id}`} style={{ fontSize: "0.8rem", color: "var(--accent-primary)", marginTop: "8px", display: "inline-block" }}>Voir les détails du produit</Link>
                    </div>
                  ) : r.pharmacies.map((p) => (
                    <div key={p.pharmacyId} style={{
                      display: "flex", alignItems: "center", gap: "16px", padding: "16px",
                      background: "rgba(10, 22, 40, 0.4)", borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)", transition: "all 0.2s"
                    }}>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 700 }}>{p.pharmacyName}</span>
                          {p.isOnDuty && <span className="badge badge-purple" style={{ fontSize: "0.65rem" }}><Moon size={10} /> De Garde</span>}
                          {p.isOpen ? <span className="badge badge-success" style={{ fontSize: "0.65rem" }}>Ouvert</span> : <span className="badge badge-gray" style={{ fontSize: "0.65rem" }}>Fermé</span>}
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{p.address}, {p.city}</p>
                        <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Navigation size={12} /> {p.distance > 1000 ? `${(p.distance/1000).toFixed(1)} km` : `${p.distance} m`}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Pill size={12} /> {p.quantity > 20 ? "En stock" : "Stock limité"}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent-primary)", marginBottom: "8px" }}>{formatPrice(p.sellingPrice)}</div>
                        <Link href={`/commande/new?medicineId=${r.medicine.id}&pharmacyId=${p.pharmacyId}`} className="btn-primary btn-sm">
                          Réserver
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {!loading && query && results.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
              <Info size={40} style={{ marginBottom: "16px", opacity: 0.3 }} />
              <p>Aucun résultat pour "{query}".</p>
              <p style={{ fontSize: "0.9rem" }}>Essayez avec le nom de la molécule (DCI).</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
