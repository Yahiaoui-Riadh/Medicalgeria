"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Search, Send, MessageSquare, Phone, Info, Building2 } from "lucide-react";

export default function PatientMessagesPage() {
  const { data: session } = useSession();
  const [activeChat, setActiveChat] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length >= 2) {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search/pharmacies?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSearchResults(data.data || []);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const selectPharmacy = (pharmacy: any) => {
    setActiveChat({
      id: pharmacy.id,
      userId: pharmacy.userId, // On stocke le userId pour les messages
      name: pharmacy.name,
      address: pharmacy.address,
      city: pharmacy.city,
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Charger les messages quand le chat change
  useEffect(() => {
    if (activeChat?.userId) {
      const fetchMessages = async () => {
        try {
          const res = await fetch(`/api/messages?otherUserId=${activeChat.userId}`);
          const data = await res.json();
          if (data.data) setMessages(data.data);
        } catch (e) {
          console.error("Fetch messages error:", e);
        }
      };
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Polling plus rapide (3s)
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [activeChat?.userId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat?.userId) return;
    
    const content = newMessage;
    setNewMessage(""); // Clear immédiat pour l'UX
    
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: activeChat.userId, content }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.data) {
        setMessages(prev => [...prev, data.data]);
      }
    } catch (e: any) {
      console.error("Send message error:", e);
      alert("Erreur lors de l'envoi : " + e.message);
    }
  };

  const role = (session?.user as any)?.role ?? "PATIENT";

  return (
    <div className="dashboard-wrapper">
      <DashboardSidebar role={role} userName={(session?.user as any)?.name} />
      <div className="dashboard-main" style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", height: "100vh" }}>
          
          {/* Liste des conversations */}
          <div style={{ borderRight: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px", borderBottom: "1px solid var(--border-subtle)" }}>
              <h1 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "15px" }}>Mes Messages</h1>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Rechercher une pharmacie..." 
                  style={{ paddingLeft: "40px" }} 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                
                {/* Résultats de recherche */}
                {searchResults.length > 0 && (
                  <div style={{ 
                    position: "absolute", top: "100%", left: 0, right: 0, 
                    background: "var(--bg-secondary)", border: "1px solid var(--border-default)", 
                    borderRadius: "8px", marginTop: "5px", zIndex: 100,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)", overflow: "hidden"
                  }}>
                    {searchResults.map((p) => (
                      <div 
                        key={p.id} 
                        onClick={() => selectPharmacy(p)}
                        style={{ padding: "12px 15px", cursor: "pointer", borderBottom: "1px solid var(--border-subtle)", transition: "all 0.2s" }}
                        className="dropdown-item"
                      >
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.city}, {p.address}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto" }}>
              {activeChat && (
                <div 
                  style={{ padding: "15px 20px", background: "rgba(0, 212, 255, 0.1)", borderLeft: "4px solid var(--accent-primary)", cursor: "pointer" }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{activeChat.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>{activeChat.isNew ? "Nouvelle conversation" : "En ligne"}</div>
                </div>
              )}
              {!activeChat && (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                  <MessageSquare size={48} strokeWidth={1} style={{ marginBottom: "15px", opacity: 0.3 }} />
                  <p style={{ fontSize: "0.85rem" }}>Aucune conversation.</p>
                </div>
              )}
            </div>
          </div>

          {/* Zone de chat */}
          <div style={{ display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.15)" }}>
            {!activeChat ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--glass-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                  <MessageSquare size={32} />
                </div>
                <h3>Discutez avec vos pharmaciens</h3>
                <p style={{ fontSize: "0.85rem" }}>Posez des questions sur vos médicaments ou le suivi de vos commandes.</p>
              </div>
            ) : (
              <>
                <header style={{ padding: "15px 25px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                     <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white" }}>
                       {activeChat.name.charAt(0).toUpperCase()}
                     </div>
                     <div>
                       <div style={{ fontWeight: 700 }}>{activeChat.name}</div>
                       <div style={{ fontSize: "0.75rem", color: "var(--accent-success)" }}>En ligne</div>
                     </div>
                   </div>
                   <div style={{ display: "flex", gap: "10px" }}>
                     <button className="btn-secondary btn-sm" style={{ padding: "8px", borderRadius: "50%" }}><Phone size={16} /></button>
                     <button className="btn-secondary btn-sm" style={{ padding: "8px", borderRadius: "50%" }}><Info size={16} /></button>
                   </div>
                </header>
                
                <div style={{ flex: 1, padding: "25px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px" }}>
                   {messages.length === 0 ? (
                     <div style={{ textAlign: "center", marginTop: "100px", color: "var(--text-muted)" }}>
                       <p>Dites bonjour à <strong>{activeChat.name}</strong> !</p>
                     </div>
                   ) : (
                     messages.map((m) => (
                       <div key={m.id} style={{ alignSelf: m.senderId === session?.user?.id ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                         <div style={{ 
                           padding: "12px 18px", 
                           borderRadius: "18px", 
                           background: m.senderId === session?.user?.id ? "var(--accent-primary)" : "var(--bg-secondary)",
                           color: m.senderId === session?.user?.id ? "white" : "inherit",
                           fontSize: "0.9rem",
                           boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                         }}>
                           {m.content}
                         </div>
                         <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "4px", textAlign: m.senderId === session?.user?.id ? "right" : "left" }}>
                           {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </div>
                       </div>
                     ))
                   )}
                </div>

                <div style={{ padding: "20px", background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)" }}>
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    style={{ display: "flex", gap: "12px" }}
                  >
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Écrivez votre message..." 
                      style={{ flex: 1, borderRadius: "25px", paddingLeft: "20px" }} 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button 
                      type="submit"
                      className="btn-primary" 
                      style={{ width: "45px", height: "45px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", flexShrink: 0 }}
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
