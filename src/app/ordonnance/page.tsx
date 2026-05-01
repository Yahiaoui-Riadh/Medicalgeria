"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Camera, Upload, FileText, Loader2, Search, 
  CheckCircle2, ArrowLeft, Pill, Info, Sparkles
} from "lucide-react";

interface AnalyzedMedicine {
  nom: string;
  dosage: string;
  posologie: string;
}

export default function OrdonnancePage() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalyzedMedicine[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          
          if (width > height && width > maxDim) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else if (height > maxDim) {
            width = (width * maxDim) / height;
            height = maxDim;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.7);
          setImage(compressed);
          setResults(null);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const [availability, setAvailability] = useState<Record<string, number>>({});

  const checkAvailability = async (medicines: AnalyzedMedicine[]) => {
    const results: Record<string, number> = {};
    for (const med of medicines) {
      try {
        const res = await fetch(`/api/search/medicines?q=${encodeURIComponent(med.nom)}&inStock=true`);
        const data = await res.json();
        // Le nombre total de pharmacies qui ont ce médicament en stock
        const totalPharmacies = data.data?.reduce((acc: number, item: any) => acc + item.pharmacies.length, 0) || 0;
        results[med.nom] = totalPharmacies;
      } catch (e) {
        console.error("Erreur check availability:", e);
      }
    }
    setAvailability(results);
  };

  const analyzeOrdonnance = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");
      const medicines = data.medicines || [];
      setResults(medicines);
      checkAvailability(medicines);
    } catch (err: any) {
      console.error(err);
      alert("Erreur: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <main className="hero-bg" style={{ minHeight: "100vh", paddingBottom: "50px" }}>
      {/* Header */}
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
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.2rem", fontWeight: 700 }}>Analyse d'ordonnance IA</h1>
      </nav>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ 
            width: "80px", height: "80px", borderRadius: "50%", 
            background: "var(--accent-primary-gradient)", 
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", boxShadow: "0 0 30px rgba(0, 212, 255, 0.3)"
          }}>
            <FileText size={40} color="#fff" />
          </div>
          <h2 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "12px" }}>Numérisez votre <span className="gradient-text">ordonnance</span></h2>
          <p style={{ color: "var(--text-secondary)" }}>Prenez une photo pour extraire automatiquement vos médicaments et les trouver en pharmacie.</p>
        </div>

        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="glass-card" 
            style={{ 
              height: "300px", display: "flex", flexDirection: "column", 
              alignItems: "center", justifyContent: "center", cursor: "pointer",
              border: "2px dashed var(--border-default)", gap: "15px",
              transition: "all 0.3s"
            }}
          >
            <div style={{ padding: "20px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }}>
              <Camera size={48} style={{ color: "var(--accent-primary)" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>Cliquez pour prendre une photo</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>ou importez un fichier image</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: "none" }} 
              capture="environment"
            />
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="glass-card" style={{ padding: "10px", marginBottom: "25px", position: "relative" }}>
              <img 
                src={image} 
                alt="Ordonnance" 
                style={{ width: "100%", borderRadius: "var(--radius-lg)", maxHeight: "400px", objectFit: "cover" }} 
              />
              <button 
                onClick={() => setImage(null)}
                style={{ 
                  position: "absolute", top: "20px", right: "20px", 
                  background: "rgba(0,0,0,0.6)", border: "none", color: "#fff",
                  padding: "8px 15px", borderRadius: "20px", cursor: "pointer",
                  backdropFilter: "blur(5px)", fontSize: "0.8rem"
                }}
              >
                Changer de photo
              </button>
            </div>

            {!results && (
              <button 
                onClick={analyzeOrdonnance}
                disabled={analyzing}
                className="btn-primary" 
                style={{ width: "100%", padding: "18px", borderRadius: "var(--radius-lg)", fontSize: "1.1rem", fontWeight: 700 }}
              >
                {analyzing ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                    <Loader2 className="spinner" size={20} /> Analyse par l'IA en cours...
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                    <Sparkles size={20} /> Analyser l'ordonnance
                  </span>
                )}
              </button>
            )}
          </div>
        )}

        {results && (
          <div className="animate-fade-in" style={{ marginTop: "30px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <CheckCircle2 size={24} color="var(--accent-success)" /> Médicaments détectés
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {results.length === 0 ? (
                <div className="glass-card" style={{ padding: "30px", textAlign: "center" }}>
                   <Info size={30} style={{ color: "var(--text-muted)", marginBottom: "10px" }} />
                   <p>Aucun médicament n'a pu être identifié. Essayez une photo plus nette.</p>
                </div>
              ) : results.map((med, idx) => {
                const count = availability[med.nom];
                const isChecking = count === undefined;
                
                return (
                  <div key={idx} className="glass-card" style={{ 
                    padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center",
                    borderLeft: `4px solid ${isChecking ? "var(--border-default)" : count > 0 ? "var(--accent-success)" : "var(--accent-danger)"}`
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "4px" }}>{med.nom}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", gap: "10px", marginBottom: "8px" }}>
                        <span>{med.dosage}</span>
                        {med.posologie && <span style={{ fontStyle: "italic" }}>• {med.posologie}</span>}
                      </div>
                      
                      {/* Badge de disponibilité */}
                      {isChecking ? (
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                          <Loader2 size={10} className="spinner" /> Vérification disponibilité...
                        </span>
                      ) : count > 0 ? (
                        <span style={{ 
                          fontSize: "0.75rem", background: "rgba(0, 200, 150, 0.1)", 
                          color: "#00e699", padding: "4px 10px", borderRadius: "12px",
                          fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "5px"
                        }}>
                          <CheckCircle2 size={12} /> Disponible dans {count} pharmacie{count > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span style={{ 
                          fontSize: "0.75rem", background: "rgba(255, 100, 100, 0.1)", 
                          color: "#ff6666", padding: "4px 10px", borderRadius: "12px",
                          fontWeight: 600
                        }}>
                          Non trouvé à proximité
                        </span>
                      )}
                    </div>
                    
                    <Link 
                      href={`/rechercher?q=${encodeURIComponent(med.nom)}`}
                      title="Voir sur la carte"
                      style={{ 
                        width: "45px", height: "45px", borderRadius: "50%", 
                        background: "rgba(0, 212, 255, 0.1)", display: "flex", 
                        alignItems: "center", justifyContent: "center", color: "var(--accent-primary)",
                        transition: "all 0.2s"
                      }}
                      className="btn-icon-hover"
                    >
                      <Search size={20} />
                    </Link>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => { setImage(null); setResults(null); }}
              className="btn-secondary"
              style={{ width: "100%", marginTop: "30px", padding: "15px", borderRadius: "var(--radius-lg)" }}
            >
              Scanner une autre ordonnance
            </button>
          </div>
        )}

        <div style={{ marginTop: "40px", padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)" }}>
           <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
             <Info size={16} /> Note importante
           </h4>
           <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
             L'analyse par IA est une aide à la saisie. Vérifiez toujours les résultats avec votre pharmacien. L'ordonnance originale papier reste obligatoire pour le retrait des médicaments.
           </p>
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
