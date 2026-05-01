"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Search, Send, User, MessageSquare, Phone, Info } from "lucide-react";

export default function PharmacyMessagesPage() {
  const { data: session } = useSession();
  const [activeChat, setActiveChat] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Charger les conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/messages/conversations");
        const data = await res.json();
        setConversations(data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingConversations(false);
      }
    };
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Rafraîchir la liste
    return () => clearInterval(interval);
  }, []);

  // Charger les messages du chat actif
  useEffect(() => {
    if (activeChat?.userId) {
      const fetchMessages = async () => {
        try {
          const res = await fetch(`/api/messages?otherUserId=${activeChat.userId}`);
          const data = await res.json();
          setMessages(data.data || []);
        } catch (e) {
          console.error(e);
        }
      };
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat?.userId) return;
    const content = newMessage;
    setNewMessage("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: activeChat.userId, content }),
      });
      const data = await res.json();
      if (data.data) {
        setMessages(prev => [...prev, data.data]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const role = (session?.user as any)?.role ?? "PHARMACIST";

  return (
    <div className="dashboard-wrapper">
      <DashboardSidebar role={role} pharmacyName={(session?.user as any)?.name} />
      <div className="dashboard-main" style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", height: "100vh" }}>
          
          {/* Liste des conversations */}
          <div style={{ borderRight: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px", borderBottom: "1px solid var(--border-subtle)" }}>
              <h1 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "15px" }}>Messagerie</h1>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="text" className="input-field" placeholder="Rechercher un patient..." style={{ paddingLeft: "40px" }} />
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto" }}>
              {loadingConversations ? (
                <div style={{ padding: "20px", textAlign: "center" }}>Chargement...</div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                  <MessageSquare size={48} strokeWidth={1} style={{ marginBottom: "15px", opacity: 0.3 }} />
                  <p style={{ fontSize: "0.85rem" }}>Aucune conversation active.</p>
                </div>
              ) : (
                conversations.map((c) => (
                  <div 
                    key={c.userId}
                    onClick={() => setActiveChat(c)}
                    style={{ 
                      padding: "15px 20px", 
                      borderBottom: "1px solid var(--border-subtle)", 
                      cursor: "pointer",
                      background: activeChat?.userId === c.userId ? "rgba(0, 212, 255, 0.05)" : "transparent",
                      borderLeft: activeChat?.userId === c.userId ? "4px solid var(--accent-primary)" : "none"
                    }}
                    className="chat-list-item"
                  >
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.lastMessage}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Zone de chat */}
          <div style={{ display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.1)" }}>
            {!activeChat ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--glass-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                  <MessageSquare size={32} />
                </div>
                <h3>Sélectionnez une conversation</h3>
                <p style={{ fontSize: "0.85rem" }}>Discutez en temps réel avec vos patients pour leurs commandes.</p>
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
                     <button className="btn-secondary btn-sm" style={{ padding: "8px" }}><Phone size={16} /></button>
                     <button className="btn-secondary btn-sm" style={{ padding: "8px" }}><Info size={16} /></button>
                   </div>
                </header>
                
                <div style={{ flex: 1, padding: "25px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                   {messages.map((m) => (
                     <div key={m.id} style={{ alignSelf: m.senderId === session?.user?.id ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                       <div style={{ 
                         padding: "10px 15px", 
                         borderRadius: "15px", 
                         background: m.senderId === session?.user?.id ? "var(--accent-primary)" : "var(--bg-secondary)",
                         color: m.senderId === session?.user?.id ? "white" : "inherit"
                       }}>
                         {m.content}
                       </div>
                       <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "4px", textAlign: m.senderId === session?.user?.id ? "right" : "left" }}>
                         {new Date(m.createdAt).toLocaleTimeString()}
                       </div>
                     </div>
                   ))}
                </div>

                <div style={{ padding: "20px", background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)" }}>
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    style={{ display: "flex", gap: "10px" }}
                  >
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Écrivez votre message..." 
                      style={{ flex: 1 }} 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" className="btn-primary" style={{ width: "45px", height: "45px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-md)" }}>
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
