"use client";

import { useState, useEffect } from "react";
import {
  Layers,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Calendar,
  X
} from "lucide-react";

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [leadFilter, setLeadFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Selection states
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [activeModal, setActiveModal] = useState<"note" | "status" | null>(null);

  // Form states
  const [noteForm, setNoteForm] = useState({ note: "" });
  const [statusForm, setStatusForm] = useState({ status: "contacted", note: "" });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Fetch Leads Error: ", e);
    } finally {
      setLoading(false);
    }
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      const res = await fetch(`/api/leads/${selectedLead.lead_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: noteForm.note
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update note failed.");

      setActiveModal(null);
      setSelectedLead(null);
      setNoteForm({ note: "" });
      fetchLeads();
    } catch (err: any) {
      alert(err.message || "Failed to add note.");
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      const res = await fetch(`/api/leads/${selectedLead.lead_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusForm.status,
          note: statusForm.note
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update status failed.");

      setActiveModal(null);
      setSelectedLead(null);
      setStatusForm({ status: "contacted", note: "" });
      fetchLeads();
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.mobile.toLowerCase().includes(search.toLowerCase()) ||
      l.city.toLowerCase().includes(search.toLowerCase());

    let matchesLead = true;
    if (leadFilter === "HOT") matchesLead = l.score >= 75;
    else if (leadFilter === "WARM") matchesLead = l.score >= 50 && l.score < 75;
    else if (leadFilter === "COLD") matchesLead = l.score < 50;

    const matchesSource = sourceFilter === "all" || l.source === sourceFilter;

    return matchesSearch && matchesLead && matchesSource;
  });

  // Calculate leads metrics
  const hotCount = leads.filter((l) => l.score >= 75).length;
  const warmCount = leads.filter((l) => l.score >= 50 && l.score < 75).length;
  const coldCount = leads.filter((l) => l.score < 50).length;

  return (
    <div className="flex flex-col gap-6 text-left font-sans text-slate-300">
      {/* Title */}
      <div>
        <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">B2B Leads scoring board</p>
        <p className="text-[11px] text-slate-500 mt-1 leading-normal">
          WhatsApp organic inquiries scoring buckets, organic tracking sources, and customer followups ledger logs.
        </p>
      </div>

      {/* KPI METRICS BLOCK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <span className="text-slate-500 uppercase tracking-widest font-bold text-[9px]">Hot Leads Bucket</span>
            <p className="text-lg font-black text-white mt-1">{hotCount} leads</p>
          </div>
          <Sparkles className="w-8 h-8 text-emerald-400 fill-current opacity-25" />
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <span className="text-slate-500 uppercase tracking-widest font-bold text-[9px]">Warm Leads Bucket</span>
            <p className="text-lg font-black text-white mt-1">{warmCount} leads</p>
          </div>
          <TrendingUp className="w-8 h-8 text-amber-400 opacity-25" />
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-red-500">
          <div>
            <span className="text-slate-500 uppercase tracking-widest font-bold text-[9px]">Cold Leads Nurturing</span>
            <p className="text-lg font-black text-white mt-1">{coldCount} leads</p>
          </div>
          <Layers className="w-8 h-8 text-red-400 opacity-25" />
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="glass-panel p-4 rounded-xl border border-gold/5 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads name, city or mobile number..."
            className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-gold outline-none text-xs text-white"
          />
        </div>

        {/* Lead scoring bucket */}
        <select
          value={leadFilter}
          onChange={(e) => setLeadFilter(e.target.value)}
          className="w-full md:w-48 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer"
        >
          <option value="all">Score: All</option>
          <option value="HOT">HOT Leads (&gt;= 75)</option>
          <option value="WARM">WARM Leads (50-74)</option>
          <option value="COLD">COLD Leads (&lt; 50)</option>
        </select>

        {/* Source Filter */}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="w-full md:w-48 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer"
        >
          <option value="all">Source: All</option>
          <option value="instagram">Instagram Page</option>
          <option value="facebook">Facebook Ads</option>
          <option value="whatsapp">Direct WhatsApp</option>
          <option value="website">Website Form</option>
          <option value="reference">Reference</option>
        </select>
      </div>

      {/* LEADS LIST */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm">Loading lead score sheets...</div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-gold/15">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-xs md:text-sm text-left">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="p-4">Lead Name / City</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Source</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Contact</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredLeads.map((l) => (
                  <tr key={l.lead_id} className="hover:bg-slate-900/20 transition-all text-xs text-slate-300">
                    <td className="p-4 font-bold text-white">
                      <div className="flex flex-col">
                        <span>{l.name}</span>
                        <span className="text-[9px] text-slate-500 uppercase">{l.business_type.replace(/_/g, " ")} | {l.city}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium">+{l.mobile}</td>
                    <td className="p-4 font-semibold text-slate-400 capitalize">{l.source}</td>
                    <td className="p-4 text-center font-bold text-white">
                      <span className={`py-0.5 px-2 rounded font-extrabold ${
                        l.score >= 75 ? "text-emerald-400 bg-emerald-500/10" : l.score >= 50 ? "text-amber-500 bg-amber-500/10" : "text-red-400 bg-red-500/10"
                      }`}>
                        {l.score} pts
                      </span>
                    </td>
                    <td className="p-4 capitalize">{l.status}</td>
                    <td className="p-4 text-slate-500">{new Date(l.last_contact_date).toDateString()}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => { setSelectedLead(l); setStatusForm({ status: l.status, note: "" }); setActiveModal("status"); }}
                        className="py-1 px-2.5 rounded bg-slate-900 border border-slate-800 hover:border-gold/20 text-gold transition-colors font-bold text-xs"
                      >
                        Action Status
                      </button>
                      <button
                        onClick={() => { setSelectedLead(l); setNoteForm({ note: "" }); setActiveModal("note"); }}
                        className="py-1 px-2.5 rounded bg-slate-900 border border-slate-800 hover:text-white transition-colors"
                        title="Add Note"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAD STATUS ACTION MODAL */}
      {activeModal === "status" && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleStatusSubmit} className="bg-slate-900 border border-gold/15 rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 text-left shadow-2xl relative font-sans">
            <h3 className="font-outfit font-extrabold text-white text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-gold animate-bounce" /> Update Lead Action Status
            </h3>
            <button
              type="button"
              onClick={() => { setActiveModal(null); setSelectedLead(null); }}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-xs text-slate-500">
              📌 Adjust follow-up status parameters for *${selectedLead.name}* (score {selectedLead.score}/100). Leads scoring directs CRM categories automatically.
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Update Status *</label>
              <select
                value={statusForm.status}
                onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))}
                className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-gold outline-none text-xs text-slate-300"
              >
                <option value="new">New Inquiry</option>
                <option value="contacted">Contacted via WhatsApp</option>
                <option value="interested">Interested (Sent Catalog)</option>
                <option value="registered">Registered B2B Buyer</option>
                <option value="lost">Lost Lead (Inactive)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Log Operator Note</label>
              <input
                type="text"
                value={statusForm.note}
                onChange={(e) => setStatusForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="Talked on phone, requesting sample pack..."
                className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-gold outline-none text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setSelectedLead(null); }}
                className="py-2 px-4 rounded-xl border border-slate-800 text-slate-400 text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-gold hover:bg-gold-600 text-slate-950 font-bold text-xs"
              >
                Save Action Status
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LEAD LOG NOTE MODAL */}
      {activeModal === "note" && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleNoteSubmit} className="bg-slate-900 border border-gold/15 rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 text-left shadow-2xl relative font-sans">
            <h3 className="font-outfit font-extrabold text-white text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gold" /> Log Lead Notes Feed
            </h3>
            <button
              type="button"
              onClick={() => { setActiveModal(null); setSelectedLead(null); }}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Operator Feed Note *</label>
              <textarea
                value={noteForm.note}
                onChange={(e) => setNoteForm((p) => ({ ...p, note: e.target.value }))}
                rows={4}
                placeholder="Log customer comments, references, preferences..."
                className="py-2.5 px-4 rounded-lg bg-slate-950 border border-slate-800 focus:border-gold outline-none text-xs text-white resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setSelectedLead(null); }}
                className="py-2 px-4 rounded-xl border border-slate-800 text-slate-400 text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-gold hover:bg-gold-600 text-slate-950 font-bold text-xs"
              >
                Log Note Feed
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
