"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  Coins,
  DollarSign,
  FileText,
  HelpCircle,
  Info,
  MessageCircle,
  MessageSquare,
  Paperclip,
  Pin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Tag,
  TrendingUp,
  Trash2,
  User,
  Users,
  AlertTriangle,
  Send,
  Sparkles
} from "lucide-react";

export default function CustomerProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const buyerId = params.id;

  // Data states
  const [customer, setCustomer] = useState<any>(null);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [buyer, setBuyer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Interaction tab
  const [activeTab, setActiveTab] = useState("communication"); // communication, orders, finance, timeline, ai

  // Form states
  const [noteContent, setNoteContent] = useState("");
  const [notePinned, setNotePinned] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);

  const [followupDesc, setFollowupDesc] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [followupLoading, setFollowupLoading] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentInvoice, setPaymentInvoice] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [newTag, setNewTag] = useState("");
  const [messageText, setMessageText] = useState("");
  const [chatDirection, setChatDirection] = useState("outgoing"); // incoming, outgoing

  useEffect(() => {
    fetchProfile();
  }, [buyerId]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crm/customers/${buyerId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load customer profile.");
      setCustomer(data.customer);
      setSalesOrders(data.salesOrders || []);
      setBuyer(data.buyer);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (payload: any) => {
    try {
      const res = await fetch(`/api/crm/customers/${buyerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "CRM Action failed.");
      
      // Fast refresh
      const refreshRes = await fetch(`/api/crm/customers/${buyerId}`);
      const refreshData = await refreshRes.json();
      if (refreshRes.ok) {
        setCustomer(refreshData.customer);
        setSalesOrders(refreshData.salesOrders || []);
        setBuyer(refreshData.buyer);
      }
      return data;
    } catch (e: any) {
      alert(e.message || "Action failed.");
      throw e;
    }
  };

  // 1. Note log
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setNoteLoading(true);
    try {
      await handleAction({
        action: "add_note",
        content: noteContent,
        isPinned: notePinned
      });
      setNoteContent("");
      setNotePinned(false);
    } catch (err) {}
    finally { setNoteLoading(false); }
  };

  const handleTogglePinNote = async (noteId: number, currentPinned: boolean) => {
    await handleAction({
      action: "pin_note",
      noteId,
      isPinned: !currentPinned
    });
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm("Are you sure you want to delete this note log?")) return;
    await handleAction({
      action: "delete_note",
      noteId
    });
  };

  // 2. Follow-up
  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupDesc.trim() || !followupDate) return;
    setFollowupLoading(true);
    try {
      await handleAction({
        action: "add_followup",
        taskDescription: followupDesc,
        scheduledDate: followupDate
      });
      setFollowupDesc("");
      setFollowupDate("");
    } catch (err) {}
    finally { setFollowupLoading(false); }
  };

  const handleCompleteFollowup = async (followupId: number, status: string) => {
    await handleAction({
      action: "update_followup",
      followupId,
      status
    });
  };

  // 3. Add Tag
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    try {
      await handleAction({
        action: "add_tag",
        label: newTag.trim()
      });
      setNewTag("");
    } catch (e) {}
  };

  const handleDeleteTag = async (tagId: number) => {
    await handleAction({
      action: "delete_tag",
      tagId
    });
  };

  // 4. Manual message Sync
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    try {
      await handleAction({
        action: "add_message",
        content: messageText,
        direction: chatDirection,
        sender: chatDirection === "incoming" ? "customer" : "salesperson",
        channel: "WHATSAPP"
      });
      setMessageText("");
    } catch (e) {}
  };

  // 5. Payment Receipt
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || !paymentMethod) return;
    setPaymentLoading(true);
    try {
      await handleAction({
        action: "add_payment",
        amount: paymentAmount,
        paymentMethod,
        transactionRef: paymentRef,
        invoiceId: paymentInvoice,
        notes: paymentNotes
      });
      setPaymentAmount("");
      setPaymentRef("");
      setPaymentInvoice("");
      setPaymentNotes("");
    } catch (err) {}
    finally { setPaymentLoading(false); }
  };

  // 6. Simulate AI Summary Update
  const handleSimulateAI = async () => {
    setSyncing(true);
    try {
      // Gather conversations to build a meaningful summary
      const messagesStr = customer?.conversations?.[0]?.messages
        ?.map((m: any) => `${m.sender}: ${m.content}`)
        ?.join(" | ") || "";

      // Quick logic to extract state from GST
      const stateCode = customer?.gstin ? customer.gstin.substring(0, 2) : "Unknown";
      const repeatStr = '["Cambric Kurti Sacks", "Rayon Festive sets"]';
      let delayMsg = "ON TIME (Fast Payer)";
      if (customer?.pending_payments > 50000) {
        delayMsg = "⚠️ Risk: Payment delay likely by 7-10 days.";
      }

      await handleAction({
        action: "update_ai",
        summary: messagesStr ? `Customer is actively negotiating cargo delivery schedules. Sourcing priority is premium 60-60 cambric cotton kurtis. Mobile contact active.` : `CRM memory initialized. Primary trade partner verified on state code: ${stateCode}. Direct follow-up channels established.`,
        buyerBehavior: "Prefers morning dispatch. High response rates on outgoing WhatsApp catalogues. Standard 15-days credit maturity cycles.",
        repeatProducts: ["Cambric Kurti 60x60 Sacks", "Rayon Festive Sets", "Surat Printed Suits"],
        followupSuggestion: "Initiate next wholesale catalog broadcast. Inquire about summer boutique stocks requirements.",
        priorityScore: customer?.total_revenue > 200000 ? 92 : 74,
        riskDetection: customer?.pending_payments > 75000 ? "MEDIUM CHURN / OVERDUE RISK" : "LOW CHURN / TRUSTED B2B PARTNER",
        paymentDelayEst: delayMsg
      });
    } catch (err) {}
    finally { setSyncing(false); }
  };

  // 7. Toggle Churn Risk
  const handleUpdateRisk = async (newRisk: string) => {
    await handleAction({
      action: "update_profile",
      riskLevel: newRisk
    });
  };

  // 8. Toggle Lead Stage
  const handleUpdateLeadStage = async (newStage: string) => {
    await handleAction({
      action: "update_profile",
      leadStage: newStage
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400 font-sans text-xs">
        <RefreshCw className="w-8 h-8 text-gold animate-spin" />
        <span className="font-semibold uppercase tracking-wider text-slate-500">Retrieving B2B Customer Memory Brain...</span>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-red-500/10 text-center max-w-md mx-auto my-12 font-sans flex flex-col items-center gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h3 className="text-white font-bold text-base uppercase">Profile Retrieval Failed</h3>
        <p className="text-xs text-slate-400">{error || "Customer profile could not be loaded."}</p>
        <button
          onClick={() => router.push("/admin/buyers")}
          className="mt-2 py-2 px-6 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white hover:bg-slate-800 transition"
        >
          Back to Buyers Directory
        </button>
      </div>
    );
  }

  // Helper: auto-detect state code from GSTIN
  const stateCodeDetected = customer.gstin ? customer.gstin.substring(0, 2) : null;

  return (
    <div className="flex flex-col gap-6 text-left font-sans text-slate-300 animate-fade-in pb-16">
      
      {/* HEADER / NAVIGATION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/buyers")}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-white transition-colors"
            title="Back to Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">{customer.company_name}</h2>
              <span className={`py-0.5 px-2 rounded font-extrabold uppercase text-[8px] border ${
                customer.risk_level === "HIGH" 
                  ? "bg-red-500/10 text-red-400 border-red-500/20" 
                  : customer.risk_level === "MEDIUM" 
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>
                {customer.risk_level} RISK
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              PROP: {buyer?.full_name || "N/A"} | B2B MEMORY SYNC MATURITY | SYSTEM ASSIGNED: {customer.assigned_salesperson}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Simulate AI Action Button */}
          <button
            onClick={handleSimulateAI}
            disabled={syncing}
            className="py-2 px-4 rounded-xl bg-gold text-navy font-bold text-xs flex items-center gap-1.5 hover:bg-gold/80 transition-all shadow-lg shadow-gold/5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Analyzing Sourcing...' : 'Simulate CRM AI Sync'}
          </button>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: STICKY CUSTOMER SUMMARY SIDEBAR (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-4">
          
          {/* Card 1: 360° Stats panel */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-gold/5 rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mb-4 border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-gold" /> Commercial Intelligence stats
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-slate-950/60 border border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase">Total Purchases</span>
                <span className="text-sm font-black text-white font-sans">
                  ₹{customer.total_revenue.toLocaleString()}
                </span>
                <span className="text-[8px] text-slate-500 font-semibold">{customer.total_orders} Orders</span>
              </div>
              <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-slate-950/60 border border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase">Pending Ledger</span>
                <span className={`text-sm font-black font-sans ${customer.pending_payments > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  ₹{customer.pending_payments.toLocaleString()}
                </span>
                <span className="text-[8px] text-slate-500 font-semibold">Active exposure</span>
              </div>
              <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-slate-950/60 border border-slate-850 col-span-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase">Avg Sourcing Basket</span>
                <span className="text-xs font-bold text-white">
                  ₹{Math.round(customer.average_order_value).toLocaleString()} per Sack
                </span>
              </div>
              <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-slate-950/60 border border-slate-850 col-span-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase">Repeat Sourcing Frequency</span>
                <span className="text-xs font-bold text-gold">{customer.repeat_frequency || "LOW"}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Basic parameters profile details */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40">
            <h3 className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mb-4 border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gold" /> Basic profile parameters
            </h3>

            <div className="flex flex-col gap-3.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-500 text-[10px] uppercase">Proprietor Name</span>
                <span className="text-slate-200">{buyer?.full_name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[10px] uppercase">Registered Mobile</span>
                <span className="text-slate-200">+{customer.mobile}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[10px] uppercase">GSTIN Identification</span>
                <span className="text-emerald-400 font-bold font-mono">{customer.gstin || "Unregistered"}</span>
              </div>
              
              {stateCodeDetected && (
                <div className="p-2 rounded bg-slate-950 border border-slate-850 text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Info className="w-3 h-3 text-gold flex-shrink-0" />
                  <span>State code detected: <strong>{stateCodeDetected}</strong> (Auto-IGST calculation ready)</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-500 text-[10px] uppercase">Email Sourcing ID</span>
                <span className="text-slate-300 truncate max-w-[160px]">{customer.email || "None Provided"}</span>
              </div>
              <div className="flex flex-col gap-1 border-t border-slate-850 pt-2.5">
                <span className="text-slate-500 text-[10px] uppercase">Billing & Shipping Cargo Address</span>
                <span className="text-slate-400 leading-normal font-sans font-medium text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                  {customer.address ? `${customer.address}, ${customer.city}, ${customer.state}` : "No verified address synced."}
                </span>
              </div>

              {/* Status Toggles for Lead & Risk */}
              <div className="border-t border-slate-850 pt-3 space-y-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500 text-[10px] uppercase">CRM Lead Stage Tier</span>
                  <div className="grid grid-cols-3 gap-1">
                    {["COLD", "WARM", "HOT"].map((stage) => (
                      <button
                        key={stage}
                        onClick={() => handleUpdateLeadStage(stage)}
                        className={`py-1 rounded text-[9px] font-bold border transition ${
                          customer.lead_stage === stage
                            ? "bg-gold text-navy border-gold"
                            : "bg-slate-950 text-slate-400 border-slate-850 hover:border-slate-700"
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500 text-[10px] uppercase">Operator Churn Risk Tag</span>
                  <div className="grid grid-cols-3 gap-1">
                    {["LOW", "MEDIUM", "HIGH"].map((risk) => (
                      <button
                        key={risk}
                        onClick={() => handleUpdateRisk(risk)}
                        className={`py-1 rounded text-[9px] font-bold border transition ${
                          customer.risk_level === risk
                            ? risk === "HIGH" 
                              ? "bg-red-500/20 text-red-400 border-red-500/30" 
                              : risk === "MEDIUM"
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-slate-950 text-slate-400 border-slate-850 hover:border-slate-700"
                        }`}
                      >
                        {risk}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Custom labels / tags */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40">
            <h3 className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mb-4 border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-gold" /> Buyer Segmentation Tags
            </h3>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {customer.tags && customer.tags.length > 0 ? (
                customer.tags.map((t: any) => (
                  <span
                    key={t.tag_id}
                    className="inline-flex items-center gap-1 py-0.5 px-2 rounded-md bg-slate-950 text-slate-300 border border-slate-850 font-bold text-[9px] uppercase tracking-wider"
                  >
                    {t.label}
                    <button
                      onClick={() => handleDeleteTag(t.tag_id)}
                      className="text-slate-500 hover:text-red-400 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-slate-500 italic font-medium">No classification labels applied.</span>
              )}
            </div>

            <form onSubmit={handleAddTag} className="flex gap-2 mt-3">
              <input
                type="text"
                placeholder="e.g. Surat Wholesaler"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-grow py-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-850 focus:border-gold outline-none text-[11px] text-white"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-gold hover:text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: SEARCHABLE TABS & DETAILS DISPLAY (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* SEARCHABLE TABS HEADER */}
          <div className="glass-panel p-2.5 rounded-xl border border-white/5 flex flex-wrap gap-1.5 bg-slate-900/60 sticky top-0 z-10 backdrop-blur-md">
            {[
              { id: "communication", label: "Communication Memory", icon: MessageCircle },
              { id: "orders", label: "Orders Timeline", icon: FileText },
              { id: "finance", label: "Financial Ledger", icon: Coins },
              { id: "timeline", label: "Operational Timeline", icon: Clock },
              { id: "ai", label: "AI Memory Brain", icon: Sparkles },
              { id: "compliance", label: "Compliance & KYC", icon: ShieldCheck }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold uppercase transition ${
                    activeTab === tab.id
                      ? "bg-gold text-navy"
                      : "bg-slate-950 text-slate-400 border border-slate-850 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT 1: COMMUNICATION MEMORY */}
          {activeTab === "communication" && (
            <div className="flex flex-col gap-6">
              
              {/* Chat Thread View */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-850 pb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-gold" /> Synchronized WhatsApp Thread Log
                </h4>

                <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 mb-4">
                  {customer.conversations?.[0]?.messages && customer.conversations[0].messages.length > 0 ? (
                    customer.conversations[0].messages.map((m: any) => (
                      <div
                        key={m.message_id}
                        className={`flex flex-col max-w-[80%] rounded-xl p-3 border ${
                          m.direction === "incoming"
                            ? "self-start bg-slate-900 border-slate-800 text-slate-300"
                            : "self-end bg-navy border-gold/15 text-slate-100"
                        }`}
                      >
                        <div className="flex justify-between items-center gap-4 mb-1">
                          <span className="text-[8px] text-slate-500 font-bold uppercase">
                            {m.sender === "system" ? "🤖 SYSTEM LOG" : m.direction === "incoming" ? "👤 BUYER WHATSAPP" : "👔 SALES STAFF"}
                          </span>
                          <span className="text-[7px] text-slate-500 font-semibold">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed break-words font-sans">{m.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 italic text-[11px] font-medium">No synced messages logged.</div>
                  )}
                </div>

                {/* Simulated Message sender */}
                <form onSubmit={handleSendMessage} className="flex flex-col gap-2.5 border-t border-slate-850 pt-4">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Simulate messaging exchange</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="dir"
                          checked={chatDirection === "incoming"}
                          onChange={() => setChatDirection("incoming")}
                          className="text-gold"
                        />
                        Incoming WhatsApp (Buyer)
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="dir"
                          checked={chatDirection === "outgoing"}
                          onChange={() => setChatDirection("outgoing")}
                          className="text-gold"
                        />
                        Outgoing WhatsApp (ERP staff)
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a wholesale dialogue message to log..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-grow py-2 px-3 rounded-lg bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="py-2 px-4 rounded-lg bg-gold text-navy font-extrabold text-xs flex items-center gap-1 hover:bg-gold/80 transition"
                    >
                      <Send className="w-3.5 h-3.5" /> Synchronize
                    </button>
                  </div>
                </form>
              </div>

              {/* CRM Pinned and Operator Notes Log */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-850 pb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gold" /> CRM pinned & Operator Notes Log
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {customer.notes && customer.notes.length > 0 ? (
                    customer.notes.map((n: any) => (
                      <div
                        key={n.note_id}
                        className={`p-3.5 rounded-xl bg-slate-950 border flex flex-col gap-2.5 justify-between transition-all relative ${
                          n.is_pinned 
                            ? "border-gold/30 bg-slate-950/90 shadow-md shadow-gold/5" 
                            : "border-slate-850"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] leading-relaxed text-slate-300 font-sans font-medium whitespace-pre-wrap">
                            {n.content}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleTogglePinNote(n.note_id, n.is_pinned)}
                              className={`p-1 rounded hover:bg-slate-900 transition ${n.is_pinned ? "text-gold" : "text-slate-500"}`}
                              title={n.is_pinned ? "Unpin Note" : "Pin Note"}
                            >
                              <Pin className="w-3 h-3 fill-current" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(n.note_id)}
                              className="p-1 rounded hover:bg-slate-900 text-slate-500 hover:text-red-400 transition"
                              title="Delete Note"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-900 pt-2 text-[8px] text-slate-500 font-extrabold uppercase">
                          <span>Logged: {n.created_by}</span>
                          <span>{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-6 text-slate-500 italic text-[11px] font-medium">No notes recorded yet. Add one below.</div>
                  )}
                </div>

                <form onSubmit={handleAddNote} className="flex flex-col gap-3 border-t border-slate-850 pt-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Write a note log entry</span>
                  <textarea
                    rows={2}
                    placeholder="Log operator observations (e.g. Sourcing Surat printed sets, requested credit extensions)..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white resize-none"
                    required
                  />
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notePinned}
                        onChange={(e) => setNotePinned(e.target.checked)}
                        className="form-checkbox text-gold bg-slate-950 border-slate-850 rounded focus:ring-gold"
                      />
                      Pin this note to the top of profile dashboard
                    </label>
                    <button
                      type="submit"
                      disabled={noteLoading}
                      className="py-2 px-5 rounded-lg bg-gold text-navy font-bold text-xs hover:bg-gold/80 transition"
                    >
                      {noteLoading ? "Logging..." : "Log Note"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Follow-up tasks scheduler */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-850 pb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gold" /> CRM Follow-up tasks Scheduler
                </h4>

                <div className="flex flex-col gap-3 mb-4">
                  {customer.followups && customer.followups.length > 0 ? (
                    customer.followups.map((f: any) => (
                      <div
                        key={f.followup_id}
                        className={`flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-xl bg-slate-950 border text-xs gap-3 ${
                          f.status === "COMPLETED" ? "border-slate-850 bg-slate-950/40 opacity-70" : "border-gold/15 bg-slate-950"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {f.status === "COMPLETED" ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex flex-col gap-0.5">
                            <span className={`font-bold font-sans ${f.status === "COMPLETED" ? "line-through text-slate-500" : "text-white"}`}>
                              {f.task_description}
                            </span>
                            <span className="text-[8px] text-slate-500 font-extrabold uppercase">
                              Target Date: {new Date(f.scheduled_date).toLocaleDateString()} | Assigned: {f.assigned_to || "Sales staff"}
                            </span>
                          </div>
                        </div>

                        {f.status === "PENDING" && (
                          <button
                            onClick={() => handleCompleteFollowup(f.followup_id, "COMPLETED")}
                            className="py-1 px-3 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-bold text-[9px] uppercase tracking-wider"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-500 italic text-[11px] font-medium">No scheduled follow-up tasks. Add one below.</div>
                  )}
                </div>

                <form onSubmit={handleAddFollowup} className="grid grid-cols-1 md:grid-cols-12 gap-3 border-t border-slate-850 pt-4">
                  <div className="md:col-span-12">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Schedule next operator action</span>
                  </div>
                  <div className="md:col-span-6">
                    <input
                      type="text"
                      placeholder="e.g. Inquire about summer linen boutique items order..."
                      value={followupDesc}
                      onChange={(e) => setFollowupDesc(e.target.value)}
                      className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white"
                      required
                    />
                  </div>
                  <div className="md:col-span-4">
                    <input
                      type="date"
                      value={followupDate}
                      onChange={(e) => setFollowupDate(e.target.value)}
                      className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-850 focus:border-gold outline-none text-[11px] text-slate-300 font-bold"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={followupLoading}
                      className="w-full py-2 px-4 rounded-lg bg-gold text-navy font-bold text-xs hover:bg-gold/80 transition"
                    >
                      {followupLoading ? "Saving..." : "Schedule"}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* TAB CONTENT 2: ORDERS TIMELINE */}
          {activeTab === "orders" && (
            <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-850 pb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-gold" /> Chronological B2B Orders History Timeline
              </h4>

              <div className="flex flex-col gap-4">
                {salesOrders && salesOrders.length > 0 ? (
                  salesOrders.map((order: any) => (
                    <div
                      key={order.order_id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex flex-col gap-3 hover:border-slate-800 transition"
                    >
                      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-xs">ORDER ID: {order.order_id}</span>
                          <span className={`py-0.5 px-2 rounded-md font-extrabold text-[8px] uppercase tracking-wider border ${
                            order.order_status === "delivered" || order.order_status === "dispatched"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : order.order_status === "cancelled"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                          }`}>
                            {order.order_status}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-extrabold uppercase">
                          Date: {new Date(order.order_date).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-500 text-[8px] uppercase">Purchases Quantity</span>
                          <span className="text-white font-bold">{order.total_qty} Items (Sacks)</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-500 text-[8px] uppercase">Taxable value</span>
                          <span className="text-white font-sans font-bold">₹{order.final_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-500 text-[8px] uppercase">Final invoice Amount</span>
                          <span className="text-gold font-sans font-black">₹{order.invoice_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-500 text-[8px] uppercase">Commercial Payments Status</span>
                          <span className={`py-0.5 px-2 rounded font-extrabold text-[8px] text-center border uppercase tracking-wider ${
                            order.payment_status === "paid"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : order.payment_status === "overdue"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {order.payment_status} (₹{order.payment_received_amount.toLocaleString()} paid)
                          </span>
                        </div>
                      </div>

                      {/* Display delivery specifics */}
                      {(order.awb_number || order.transport_name || order.notes) && (
                        <div className="p-2.5 rounded bg-slate-900/60 border border-slate-900 text-[10px] text-slate-400 flex flex-col gap-1">
                          {order.transport_name && (
                            <div>🚚 Transport Log: <strong>{order.transport_name}</strong> | AWB/LR No: <strong>{order.awb_number || order.lr_number || "Awaiting dispatch"}</strong></div>
                          )}
                          {order.notes && (
                            <div className="italic font-medium">📋 QC Dispatch checklist Note: {order.notes}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 italic text-[11px] font-medium">No order history found for this buyer.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT 3: FINANCIAL LEDGER & PAYMENTS */}
          {activeTab === "finance" && (
            <div className="flex flex-col gap-6">
              
              {/* Payment ledger history */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-850 pb-2 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-gold" /> Commercial B2B Payments History Ledger
                </h4>

                <div className="overflow-x-auto w-full">
                  <table className="w-full border-collapse text-xs text-left">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-850 text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">
                        <th className="p-3">Payment Date</th>
                        <th className="p-3">Amount Receipt</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Transaction Reference</th>
                        <th className="p-3">Invoice context</th>
                        <th className="p-3">Staff author</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {customer.payments && customer.payments.length > 0 ? (
                        customer.payments.map((p: any) => (
                          <tr key={p.payment_id} className="hover:bg-slate-900/10 transition-all font-semibold text-slate-300">
                            <td className="p-3 font-medium">{new Date(p.payment_date).toLocaleDateString()}</td>
                            <td className="p-3 text-emerald-400 font-sans font-black">₹{p.amount.toLocaleString()}</td>
                            <td className="p-3 text-[10px] text-slate-400 font-bold uppercase">{p.payment_method}</td>
                            <td className="p-3 font-mono text-[10px] text-slate-500">{p.transaction_ref || "Advance Deposit"}</td>
                            <td className="p-3 font-mono text-gold text-[10px]">{p.invoice_id || "Unallocated"}</td>
                            <td className="p-3 text-[10px] text-slate-400 font-bold uppercase">{p.created_by}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-500 italic text-[11px] font-medium">No recorded transactions log.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Record manual commercial payment receipt */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-850 pb-2 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-gold" /> Log B2B Commercial payment Deposit receipt
                </h4>

                <form onSubmit={handleAddPayment} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Transaction Amount (INR) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 75000"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Commercial Deposit Method *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 font-bold cursor-pointer"
                    >
                      <option value="BANK_TRANSFER">Bank Wire / IMPS ( Surat Accounts )</option>
                      <option value="UPI">UPI Deposit ( GPay / PhonePe )</option>
                      <option value="CHEQUE">Corporate Cheque Clearance</option>
                      <option value="CASH">Proprietor Cash Handover</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Transaction / Cheque Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. TXN98273641 or CHQ9827"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Order ID / Invoice context</label>
                    <input
                      type="text"
                      placeholder="e.g. 20260526-001 or Advance"
                      value={paymentInvoice}
                      onChange={(e) => setPaymentInvoice(e.target.value)}
                      className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Payment Notes / Bank Details</label>
                    <input
                      type="text"
                      placeholder="Received full clearance. Verified by HDFC bank ledger sync."
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={paymentLoading}
                      className="py-2 px-6 rounded-lg bg-gold text-navy font-extrabold text-xs hover:bg-gold/80 transition"
                    >
                      {paymentLoading ? "Recording Receipt..." : "Record Payment Receipt"}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* TAB CONTENT 4: OPERATIONAL ACTIVITY TIMELINE */}
          {activeTab === "timeline" && (
            <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-850 pb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gold" /> Unified chronological activity Timeline
              </h4>

              <div className="relative pl-6 border-l border-slate-850 ml-4 py-3 space-y-6">
                {customer.timeline && customer.timeline.length > 0 ? (
                  customer.timeline.map((t: any) => (
                    <div key={t.timeline_id} className="relative group">
                      
                      {/* Timeline Node Point */}
                      <span className={`absolute -left-[30px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 border-2 ${
                        t.event_type === "PAYMENT_RECEIVED" 
                          ? "border-emerald-500" 
                          : t.event_type === "SYSTEM_ALERT" 
                          ? "border-blue-500"
                          : t.event_type === "GST_VERIFIED"
                          ? "border-gold"
                          : "border-slate-500"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          t.event_type === "PAYMENT_RECEIVED"
                            ? "bg-emerald-500"
                            : t.event_type === "SYSTEM_ALERT"
                            ? "bg-blue-500"
                            : t.event_type === "GST_VERIFIED"
                            ? "bg-gold"
                            : "bg-slate-500"
                        }`} />
                      </span>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                          <span className="text-white uppercase tracking-wide">{t.title}</span>
                          <span className="text-[8px] text-slate-500 font-extrabold uppercase">
                            {new Date(t.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-400 font-sans font-medium">
                          {t.description}
                        </p>
                        <span className="text-[8px] text-slate-600 font-extrabold uppercase">
                          Operator: {t.operator_name || "System automated"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500 italic text-[11px] font-medium">No timeline activity log logged.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT 5: AI MEMORY BRAIN */}
          {activeTab === "ai" && (
            <div className="flex flex-col gap-6">
              
              {/* AI Memory metrics */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
                
                <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-850 pb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-gold animate-pulse" /> B2B CRM AI Intelligence Memory Brain
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start font-semibold text-xs">
                  
                  {/* Summary */}
                  <div className="md:col-span-12 flex flex-col gap-1.5 p-4 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Dynamic Sourcing Exchange Summary</span>
                    <p className="text-[11px] leading-relaxed text-slate-300 font-sans font-medium whitespace-pre-wrap">
                      {customer.ai_insights?.[0]?.summary || "Conversation summaries will generate automatically as B2B WhatsApp dialogues sync."}
                    </p>
                  </div>

                  {/* Meter of priority */}
                  <div className="md:col-span-6 flex flex-col gap-2 p-4 rounded-xl bg-slate-950 border border-slate-850">
                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase">
                      <span>Buyer Priority Conversion Score</span>
                      <span className="text-gold font-sans font-black text-xs">
                        {customer.ai_insights?.[0]?.priority_score || 50} / 100
                      </span>
                    </div>
                    {/* Visual bar */}
                    <div className="h-2 w-full rounded bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-gold rounded transition-all duration-1000"
                        style={{ width: `${customer.ai_insights?.[0]?.priority_score || 50}%` }}
                      />
                    </div>
                    <span className="text-[8px] text-slate-500 leading-normal font-medium">
                      Automatically calculated based on repeat-frequency, total invoice volume, and active payments punctuality.
                    </span>
                  </div>

                  {/* Delayed prediction */}
                  <div className="md:col-span-6 flex flex-col gap-1.5 p-4 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Commercial payments Delay estimation</span>
                    <span className="text-white text-xs font-bold">
                      {customer.ai_insights?.[0]?.payment_delay_est || "ON TIME (Fast Ledger Settlements)"}
                    </span>
                    <span className="text-[8px] text-slate-500 leading-normal font-medium">
                      Predicts delay chances of maturity days using current outstanding invoices exposure levels.
                    </span>
                  </div>

                  {/* Churn warnings */}
                  <div className="md:col-span-6 flex flex-col gap-1.5 p-4 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">AI Churn Risk assessment</span>
                    <span className="text-xs font-black text-amber-500 uppercase">
                      {customer.ai_insights?.[0]?.risk_detection || "LOW RISK / TRUSTED WHOLESALER"}
                    </span>
                  </div>

                  {/* Preferred Repeat Catalog items */}
                  <div className="md:col-span-6 flex flex-col gap-1.5 p-4 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Preferred Repeat Catalogs items</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(() => {
                        try {
                          const items = JSON.parse(customer.ai_insights?.[0]?.repeat_products || "[]");
                          if (items && items.length > 0) {
                            return items.map((itm: string, idx: number) => (
                              <span
                                key={idx}
                                className="py-0.5 px-2 rounded bg-slate-900 border border-slate-850 text-[9px] text-slate-300 font-bold uppercase"
                              >
                                {itm}
                              </span>
                            ));
                          }
                        } catch (e) {}
                        return <span className="text-[10px] italic text-slate-500 font-medium">No preferences compiled.</span>;
                      })()}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT 6: B2B COMPLIANCE & KYC AUDIT */}
          {activeTab === "compliance" && (
            <div className="flex flex-col gap-6">
              
              {/* Consent and Security Audit Trails */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
                
                <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-855 pb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-gold" /> B2B digital consent &amp; Security Audit Trails
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start font-semibold text-xs text-left">
                  
                  {/* IP Address */}
                  <div className="md:col-span-4 flex flex-col gap-1 p-3.5 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Consent Registered IP</span>
                    <span className="text-white text-xs font-mono font-bold">
                      {buyer?.consent_ip || "127.0.0.1"}
                    </span>
                  </div>

                  {/* Version */}
                  <div className="md:col-span-4 flex flex-col gap-1 p-3.5 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Consent Version Code</span>
                    <span className="text-gold text-xs font-bold font-mono">
                      {buyer?.consent_version || "v2026-06-01"}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="md:col-span-4 flex flex-col gap-1 p-3.5 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Consent Timestamp</span>
                    <span className="text-slate-300 text-xs font-bold">
                      {buyer?.consent_timestamp ? new Date(buyer.consent_timestamp).toLocaleString() : new Date().toLocaleString()}
                    </span>
                  </div>

                  {/* WhatsApp Check */}
                  <div className="md:col-span-6 flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-855">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase">WhatsApp CRM Consent</span>
                      <span className="text-[10px] text-slate-400 font-medium">Agreement for AI assisted catalog dispatches</span>
                    </div>
                    <span className={`py-1 px-3.5 rounded-lg text-[9px] font-black uppercase ${buyer?.whatsapp_consent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/10 text-red-400 border border-red-500/25'}`}>
                      {buyer?.whatsapp_consent ? 'Active ✅' : 'Inactive ❌'}
                    </span>
                  </div>

                  {/* Arbitration Check */}
                  <div className="md:col-span-6 flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-855">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase">Arbitration Acceptance</span>
                      <span className="text-[10px] text-slate-400 font-medium">Mumbai Seat arbitration acceptance (Conciliation Act, 1996)</span>
                    </div>
                    <span className={`py-1 px-3.5 rounded-lg text-[9px] font-black uppercase ${buyer?.arbitration_consent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/10 text-red-400 border border-red-500/25'}`}>
                      {buyer?.arbitration_consent ? 'Accepted ✅' : 'Pending ❌'}
                    </span>
                  </div>

                </div>
              </div>

              {/* Fraud Scoring & KYC Analysis */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
                
                <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-855 pb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-gold" /> B2B Fraud Risk Score &amp; KYC Assessment
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start font-semibold text-xs text-left">
                  
                  {/* Gauge */}
                  <div className="md:col-span-6 flex flex-col gap-2.5 p-4 rounded-xl bg-slate-950 border border-slate-850">
                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase">
                      <span>Dynamic Fraud Risk Score</span>
                      <span className={`font-sans font-black text-xs ${customer.fraud_risk_score > 60 ? 'text-red-400' : customer.fraud_risk_score > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {customer.fraud_risk_score || 15} / 100
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded bg-slate-900 overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded transition-all duration-1000 ${customer.fraud_risk_score > 60 ? 'bg-red-500' : customer.fraud_risk_score > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${customer.fraud_risk_score || 15}%` }}
                      />
                    </div>
                    <span className="text-[8px] text-slate-500 leading-normal font-medium">
                      Calculated on identity checks, PAN/GST validity, billing mismatches, and phone carrier reputation algorithms.
                    </span>
                  </div>

                  {/* Risk analysis text */}
                  <div className="md:col-span-6 flex flex-col gap-1.5 p-4 rounded-xl bg-slate-950 border border-slate-850 h-full justify-between">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Risk Analysis Report</span>
                    <p className="text-[10px] leading-relaxed text-slate-300 font-sans font-medium whitespace-pre-wrap">
                      {customer.fraud_risk_details || "✅ All KYC checks successfully passed. Standard unregistered retail profile matched with secure timestamped logs. Low priority operational verification approved."}
                    </p>
                  </div>

                </div>
              </div>

              {/* Export details */}
              {buyer?.is_export_buyer && (
                <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-855 pb-2 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-gold" /> Cross-Border Sourcing / Export Credentials
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start font-semibold text-xs text-left">
                    
                    {/* Country */}
                    <div className="md:col-span-6 flex flex-col gap-1.5 p-4 rounded-xl bg-slate-950 border border-slate-850">
                      <span className="text-[9px] text-slate-500 font-bold uppercase">Destination Country Port</span>
                      <span className="text-white text-xs font-bold">
                        {buyer?.export_country || "United Arab Emirates"}
                      </span>
                    </div>

                    {/* Import-Export Code */}
                    <div className="md:col-span-6 flex flex-col gap-1.5 p-4 rounded-xl bg-slate-950 border border-slate-850">
                      <span className="text-[9px] text-slate-500 font-bold uppercase">Import-Export Code (IEC) / Tax ID</span>
                      <span className="text-gold text-xs font-bold font-mono">
                        {buyer?.export_iec_code || "N/A"}
                      </span>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
