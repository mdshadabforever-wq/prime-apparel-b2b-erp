"use client";

import { useState, useEffect, useRef } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  MessageSquare,
  Send,
  User,
  Sparkles,
  Bot,
  UserCheck,
  AlertCircle,
  Clock,
  CheckCheck,
  Zap,
  Info
} from "lucide-react";

export default function AdminWhatsAppPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeNumber, setActiveNumber] = useState("919876543210"); // Defaults to Sneha Garments
  const [buyers, setBuyers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Message inputs
  const [buyerInput, setBuyerInput] = useState("");
  const [staffInput, setStaffInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBuyersAndLeads();
    fetchLogs();
    
    // Auto polling simulated checks every 5 seconds to load organic database logs updates!
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversations, activeNumber]);

  const fetchBuyersAndLeads = async () => {
    try {
      const resBuyers = await fetch("/api/buyers");
      const dataBuyers = await resBuyers.json();
      setBuyers(Array.isArray(dataBuyers) ? dataBuyers : []);

      const resLeads = await fetch("/api/leads");
      const dataLeads = await resLeads.json();
      setLeads(Array.isArray(dataLeads) ? dataLeads : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/whatsapp");
      const data = await res.json();
      if (Array.isArray(data)) {
        setConversations(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Action: Simulate Buyer message incoming (webhook)
  const handleBuyerSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerInput.trim()) return;

    const message = buyerInput;
    setBuyerInput("");
    setIsReplying(true);

    try {
      // 1. Post to simulated webhook endpoint
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactNumber: activeNumber,
          messageContent: message
        })
      });

      if (!res.ok) throw new Error("Webhook processing failed.");
      
      // Refresh conversation logs
      await fetchLogs();
    } catch (e) {
      alert("Simulated incoming message failed.");
    } finally {
      setIsReplying(false);
    }
  };

  // Action: Staff manually replies (outgoing human reply)
  const handleStaffSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffInput.trim()) return;

    const message = staffInput;
    setStaffInput("");

    try {
      // Record manual outgoing staff reply in DB whatsAppLog
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactNumber: activeNumber,
          messageContent: `🧑‍💼 Staff: ${message}` // Prepends Staff prefix to bypass chatbot responder triggers!
        })
      });

      await fetchLogs();
    } catch (e) {
      alert("Manual reply failed.");
    }
  };

  // Quick reply template selector trigger
  const sendTemplate = async (templateName: string, text: string) => {
    try {
      await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactNumber: activeNumber,
          messageContent: `🧑‍💼 Staff: ${text}`
        })
      });
      await fetchLogs();
    } catch (e) {
      console.error(e);
    }
  };

  // Extract messages of active contact
  const activeChats = conversations.filter((c) => c.contact_number === activeNumber);

  // Identify contact details
  const activeBuyer = buyers.find((b) => b.mobile === activeNumber);
  const activeLead = leads.find((l) => l.mobile === activeNumber);
  const contactName = activeBuyer ? activeBuyer.business_name : activeLead ? activeLead.name : `Lead (+${activeNumber})`;
  const leadScore = activeBuyer ? activeBuyer.score : activeLead ? activeLead.score : 0;
  const leadStatus = activeBuyer ? activeBuyer.lead_status : activeLead ? activeLead.status.toUpperCase() : "COLD";

  // Contacts lists compiling
  const uniqueContacts = Array.from(new Set(conversations.map((c) => c.contact_number)));

  return (
    <div className="flex-grow flex flex-col h-[calc(100vh-10rem)] border border-slate-800 rounded-2xl overflow-hidden glass-panel font-sans">
      
      {/* 2-Column Workspace */}
      <div className="flex-grow flex overflow-hidden h-full">
        
        {/* Left Column: Active Chats Inbox */}
        <div className="w-72 border-r border-slate-800 bg-slate-900/40 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-slate-800 font-outfit font-bold text-xs uppercase text-slate-500 tracking-wider">
            Active WhatsApp Inbox
          </div>

          <div className="flex flex-col divide-y divide-slate-800/60">
            {uniqueContacts.map((num) => {
              const bInfo = buyers.find((b) => b.mobile === num);
              const lInfo = leads.find((l) => l.mobile === num);
              const name = bInfo ? bInfo.business_name : lInfo ? lInfo.name : `Lead (+${num})`;
              const isSelected = num === activeNumber;

              // Last message preview
              const contactsChats = conversations.filter((c) => c.contact_number === num);
              const lastMsg = contactsChats[contactsChats.length - 1]?.message_content || "";

              return (
                <button
                  key={num}
                  onClick={() => setActiveNumber(num)}
                  className={`p-4 flex flex-col gap-1 text-left transition-all ${
                    isSelected ? "bg-gold/10 border-r-2 border-r-gold" : "hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-white truncate max-w-[70%]">{name}</span>
                    <span className="text-[9px] text-slate-500 font-medium">+{num.slice(-5)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate leading-relaxed">{lastMsg}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Conversation area */}
        <div className="flex-grow flex flex-col md:flex-row h-full overflow-hidden">
          
          {/* Chat Bubble Feeds Area */}
          <div className="flex-grow flex flex-col justify-between h-full bg-slate-950/20 overflow-hidden">
            
            {/* Contact Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-bold text-gold text-xs">
                  {contactName.slice(0, 1)}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-white">{contactName}</span>
                  <span className="text-[9px] text-slate-500">Active simulated dialog thread</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Scorecard:</span>
                <Tooltip content="AI-assisted buyer quality score computed from lead activity and credit history." position="bottom">
                  <span className="py-0.5 px-2 rounded bg-gold/10 text-gold text-[10px] font-black cursor-help">{leadScore} / 100</span>
                </Tooltip>
              </div>
            </div>

            {/* Bubble Feeds */}
            <div className="flex-grow overflow-y-auto p-4 md:p-6 flex flex-col gap-3">
              {activeChats.map((c) => {
                const isIncoming = c.direction === "incoming";
                const isAI = c.handled_by === "ai";
                const isHuman = c.handled_by === "human";

                return (
                  <div
                    key={c.message_id}
                    className={`flex flex-col max-w-[80%] ${
                      isIncoming ? "self-start" : "self-end"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                        isIncoming
                          ? "bg-slate-900 text-slate-300 rounded-tl-none border border-slate-800"
                          : isAI
                          ? "bg-emerald-600 text-white rounded-tr-none"
                          : "bg-slate-950 text-slate-300 rounded-tr-none border border-gold/25"
                      }`}
                    >
                      {c.message_content.replace(/^🧑‍💼 Staff: /, "")}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-500 font-sans px-1">
                      {isIncoming ? (
                        <span>Buyer</span>
                      ) : isAI ? (
                        <Tooltip content="AI Chatbot Assistant responded using business knowledge bases." position="top">
                          <span className="text-emerald-400 font-semibold flex items-center gap-0.5 cursor-help"><Bot className="w-3 h-3" /> AI Bot</span>
                        </Tooltip>
                      ) : (
                        <Tooltip content="Message sent manually by a registered sales or accounting representative." position="top">
                          <span className="text-gold font-semibold flex items-center gap-0.5 cursor-help"><User className="w-3 h-3 text-gold" /> Human Staff</span>
                        </Tooltip>
                      )}
                      <span>•</span>
                      <span>{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {!isIncoming && <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                  </div>
                );
              })}

              {isReplying && (
                <div className="self-end flex items-center gap-2 p-3 bg-emerald-600/30 text-emerald-400 rounded-2xl rounded-tr-none text-xs font-bold animate-pulse">
                  <Bot className="w-4 h-4 text-gold animate-spin" /> AI Assistant is replying...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Inputs & Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/20 flex flex-col gap-3">
              {/* STAFF REPLY FORM (Manual chat replies) */}
              <form onSubmit={handleStaffSend} className="flex gap-2">
                <input
                  type="text"
                  value={staffInput}
                  onChange={(e) => setStaffInput(e.target.value)}
                  placeholder="Type manual reply as Staff Representative..."
                  className="flex-grow py-2 px-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-gold outline-none text-xs text-white"
                />
                <Tooltip content="Send human staff manual message override, suspending AI chatbot triggers temporarily." position="top">
                  <button
                    type="submit"
                    className="py-2 px-4 bg-gold hover:bg-gold-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-950" /> Send
                  </button>
                </Tooltip>
              </form>
            </div>

          </div>

          {/* SIMULATION WORKSPACE PANEL (Right Column box inside Chat box) */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between overflow-y-auto">
            
            {/* Simulated WhatsApp input */}
            <div className="flex flex-col gap-4 text-xs">
              <span className="text-[10px] font-bold text-gold uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-gold shrink-0 animate-bounce" /> WhatsApp Sandbox Widget
              </span>
              
              <div className="text-[10px] text-slate-500 leading-relaxed border-b border-slate-800/80 pb-3">
                Select an active contact on the left, type a message below, and click <strong>"Simulate Incoming Message"</strong> to inspect the AI bot state machine flow responses in real-time.
              </div>

              {/* Simulated Buyer Send Form */}
              <form onSubmit={handleBuyerSend} className="flex flex-col gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500">Incoming Buyer Message *</label>
                  <textarea
                    value={buyerInput}
                    onChange={(e) => setBuyerInput(e.target.value)}
                    rows={3}
                    placeholder="e.g. Minimum order kya hai? or Return policy batayein."
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-gold outline-none text-xs text-white resize-none"
                    required
                  />
                </div>
                <Tooltip content="Simulate an incoming WhatsApp message sent by the buyer to test automated AI agent chatbot responses." position="top" className="w-full">
                  <button
                    type="submit"
                    disabled={isReplying}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-center text-xs transition-all flex items-center justify-center gap-1 active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5 fill-current" /> Simulate Incoming Message
                  </button>
                </Tooltip>
              </form>
            </div>

            {/* Quick Template Outbox Dispatcher */}
            <div className="flex flex-col gap-3 mt-6 border-t border-slate-800/80 pt-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fast Staff Templates</span>
              <div className="flex flex-col gap-2 text-xs">
                <Tooltip content="Instantly send a standardized WhatsApp message with transport dispatch carrier and LR tracking details." position="top" className="w-full">
                  <button
                    onClick={() => sendTemplate("dispatch", "Aapka Sales Order 20260524-001 dispatch ho gaya hai standard transport se! LR consignment number: VT-10928374.")}
                    className="w-full py-1.5 px-3 rounded bg-slate-950 border border-slate-800 hover:border-gold/30 hover:bg-slate-900 text-left text-[11px] text-slate-400 font-semibold transition-all truncate active:scale-98"
                  >
                    📢 Dispatch Alert LR template
                  </button>
                </Tooltip>
                <Tooltip content="Send a professional credit maturity payment outstanding reminder to the buyer's WhatsApp." position="top" className="w-full">
                  <button
                    onClick={() => sendTemplate("payment", "Namaste! 😊 Prime Apparel Exports ki taraf se friendly payment reminder. Invoice #20260524-001 is due today.")}
                    className="w-full py-1.5 px-3 rounded bg-slate-950 border border-slate-800 hover:border-gold/30 hover:bg-slate-900 text-left text-[11px] text-slate-400 font-semibold transition-all truncate active:scale-98"
                  >
                    📢 Credit Payment due reminder
                  </button>
                </Tooltip>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
