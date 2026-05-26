"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GstVerificationModal } from "@/components/ui/GstVerificationModal";
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  FileText,
  MessageCircle,
  ChevronRight,
  TrendingUp,
  X
} from "lucide-react";

export default function AdminBuyersPage() {
  const router = useRouter();
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [leadFilter, setLeadFilter] = useState("all");

  // Selection states
  const [selectedBuyer, setSelectedBuyer] = useState<any | null>(null);
  // GST verification states
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [gstLoading, setGstLoading] = useState(false);
  const [captchaImage, setCaptchaImage] = useState<string | undefined>(undefined);
  const [gstError, setGstError] = useState<string | undefined>(undefined);
  const [gstVerifiedData, setGstVerifiedData] = useState<any>(null);
  const [gstModalOpen, setGstModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"profile" | "credit" | "status" | null>(null);

  // Form states
  const [creditForm, setCreditForm] = useState({ creditLimit: "", creditDays: "", note: "" });
  const [statusForm, setStatusForm] = useState({ status: "APPROVED", note: "" });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBuyers(search);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchBuyers = async (query = "") => {
    setLoading(true);
    try {
      const url = query ? `/api/buyers?q=${encodeURIComponent(query)}` : "/api/buyers";
      const res = await fetch(url);
      const data = await res.json();
      setBuyers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Fetch Buyers Error: ", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuyer) return;

    try {
      const res = await fetch(`/api/buyers/${selectedBuyer.buyer_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "credit_update",
          creditLimit: creditForm.creditLimit,
          creditDays: creditForm.creditDays,
          note: creditForm.note
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Credit update failed.");

      setActiveModal(null);
      setSelectedBuyer(null);
      setCreditForm({ creditLimit: "", creditDays: "", note: "" });
      fetchBuyers();
    } catch (err: any) {
      alert(err.message || "Failed to update credit.");
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuyer) return;

    try {
      const res = await fetch(`/api/buyers/${selectedBuyer.buyer_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "status_update",
          status: statusForm.status,
          note: statusForm.note
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed.");

      setActiveModal(null);
      setSelectedBuyer(null);
      setStatusForm({ status: "APPROVED", note: "" });
      fetchBuyers();
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    }
  };

  const filteredBuyers = buyers.filter((b) => {
    // Backend search has already matched the results comprehensively; keep matches true
    const matchesSearch = true;

    const matchesStatus = statusFilter === "all" || b.account_status === statusFilter;
    const matchesLead = leadFilter === "all" || b.lead_status === leadFilter;

    return matchesSearch && matchesStatus && matchesLead;
  });

  return (
    <div className="flex flex-col gap-6 text-left font-sans text-slate-300 animate-fade-in">
      
      {/* Title */}
      <div>
        <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">B2B Verified Buyers Directory</p>
        <p className="text-[11px] text-slate-500 mt-1 leading-normal">
          Manual shop registrations approvals, buyer lead scores checklists, and custom credit limits tracking logs.
        </p>
      </div>

        {/* GST Verification Toggle */}
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm text-gold">
            <input type="checkbox" data-test-id="gst-toggle" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)} className="form-checkbox h-4 w-4 text-gold bg-navy border-gold" />
            Registered GST Customer
          </label>
          {gstEnabled && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="gstin"
                maxLength={15}
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="GSTIN (15 characters)"
                className="px-3 py-1 rounded bg-navy border border-gold text-gold placeholder-gold/60 focus:outline-none focus:ring-1 focus:ring-gold"
              />
              <button data-test-id="verify-gst-button"
                onClick={async () => {
                  if (!gstNumber) { setGstError("Enter GSTIN first"); return; }
                  setGstLoading(true); setGstError(undefined);
                  try {
                    const res = await fetch('/api/gst/verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ gstin: gstNumber })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Verification failed');
                    if (data.captchaImage) { setCaptchaImage(data.captchaImage); setGstModalOpen(true); }
                    else { setGstVerifiedData(data); }
                  } catch (e: any) { setGstError(e.message); }
                  finally { setGstLoading(false); }
                }}
                disabled={gstLoading}
                className="px-3 py-1 rounded bg-gold text-navy font-medium hover:bg-gold/80 transition"
              >
                {gstLoading ? 'Verifying...' : 'Verify GST'}
              </button>
            </div>
          )}
          {gstError && <span className="text-xs text-red-400">{gstError}</span>}
          {gstVerifiedData && (
            <div className="mt-4 space-y-2" data-test-id="gst-autofill-fields">
              <input type="text" name="legalName" data-test-id="buyer-legal-name" value={gstVerifiedData.legalName || ''} readOnly className="hidden" />
              <input type="text" name="tradeName" data-test-id="buyer-trade-name" value={gstVerifiedData.tradeName || ''} readOnly className="hidden" />
              <input type="text" name="gstStatus" data-test-id="buyer-gst-status" value={gstVerifiedData.status || ''} readOnly className="hidden" />
              <input type="text" name="address" data-test-id="buyer-address" value={gstVerifiedData.address || ''} readOnly className="hidden" />
              <input type="text" name="stateCode" data-test-id="buyer-state-code" value={gstVerifiedData.stateCode || ''} readOnly className="hidden" />
            </div>
          )}
        </div>
        {gstModalOpen && (
          <GstVerificationModal
            open={gstModalOpen}
            onClose={() => setGstModalOpen(false)}
            captchaImage={captchaImage}
            loading={gstLoading}
            error={gstError}
            onSubmitCaptcha={async (captcha) => {
              setGstLoading(true);
              try {
                const res = await fetch('/api/gst/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ gstin: gstNumber, captcha })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Verification failed');
                setGstVerifiedData(data);
                setGstModalOpen(false);
                setCaptchaImage(undefined);
              } catch (e: any) { setGstError(e.message); }
              finally { setGstLoading(false); }
            }}
          />
        )}
      {/* FILTER BAR */}
      <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search buyer shop name, city or proprietor..."
            className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white"
          />
        </div>

        {/* Verification Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-48 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer font-semibold"
        >
          <option value="all">Status: All</option>
          <option value="PENDING">Pending Verifications</option>
          <option value="APPROVED">Approved Active</option>
          <option value="REJECTED">Rejected Requests</option>
          <option value="BLOCKED">Blocked Accounts</option>
        </select>

        {/* Lead scoring bucket filter */}
        <select
          value={leadFilter}
          onChange={(e) => setLeadFilter(e.target.value)}
          className="w-full md:w-48 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer font-semibold"
        >
          <option value="all">Lead Tier: All</option>
          <option value="HOT">HOT Leads (&gt;= 75)</option>
          <option value="WARM">WARM Leads (50-74)</option>
          <option value="COLD">COLD Leads (&lt; 50)</option>
        </select>
      </div>

      {/* BUYERS LIST */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm">Loading buyers profiles...</div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-xs md:text-sm text-left">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-850 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="p-4">Business / Shop</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4">Lead Tier</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Total Purchases</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredBuyers.map((b) => (
                  <tr key={b.buyer_id} className="hover:bg-slate-900/20 transition-all text-xs text-slate-300">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white">{b.business_name}</span>
                        <span className="text-[9px] text-slate-500 font-medium">{b.business_type.replace(/_/g, " ")} | {b.city}, {b.state}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col font-medium">
                        <span className="text-slate-300">{b.full_name}</span>
                        <span className="text-[9px] text-slate-500">+{b.mobile}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-white">{b.score} / 100</td>
                    <td className="p-4">
                      <span className={`py-0.5 px-2 rounded-md font-bold uppercase text-[9px] ${
                        b.lead_status === "HOT"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : b.lead_status === "WARM"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {b.lead_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`py-0.5 px-2 rounded-md font-extrabold uppercase text-[9px] ${
                        b.account_status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : b.account_status === "PENDING"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {b.account_status}
                      </span>
                    </td>
                    <td className="p-4 font-black text-white font-sans">₹{b.total_orders_value.toLocaleString()} <span className="text-[9px] text-slate-500 font-semibold">({b.total_orders_count} POs)</span></td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => router.push(`/admin/buyers/${b.buyer_id}`)}
                        className="py-1 px-2.5 rounded bg-slate-900 border border-slate-800 text-gold hover:border-gold/30 hover:text-white transition-colors font-bold flex items-center gap-1"
                        title="View Full Profile"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBuyer(b);
                          setCreditForm({ creditLimit: String(b.credit_limit), creditDays: String(b.credit_days), note: "" });
                          setActiveModal("credit");
                        }}
                        className="py-1 px-2.5 rounded bg-slate-900 border border-slate-850 hover:border-gold/20 text-gold transition-colors"
                        title="Configure Credit Parameters"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                      </button>
                      {b.account_status === "PENDING" && (
                        <button
                          onClick={() => {
                            setSelectedBuyer(b);
                            setStatusForm({ status: "APPROVED", note: "" });
                            setActiveModal("status");
                          }}
                          className="py-1 px-2.5 rounded bg-white hover:bg-slate-100 text-slate-950 font-bold transition-all text-[11px] flex items-center gap-1 shadow-lg shadow-white/5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-950" /> Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FULL PROFILE VIEW DIALOG MODAL */}
      {activeModal === "profile" && selectedBuyer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/5 rounded-2xl max-w-lg w-full p-6 md:p-8 flex flex-col gap-6 text-left shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans animate-scale-in">
            <h3 className="font-outfit font-extrabold text-white text-base border-b border-slate-800 pb-3 flex items-center gap-2 uppercase tracking-wider">
              <Users className="w-4 h-4 text-gold" /> B2B Buyer Profile Card
            </h3>
            <button
              onClick={() => { setActiveModal(null); setSelectedBuyer(null); }}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content Profile Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 font-bold uppercase text-[9px]">Business Name</span>
                <span className="font-bold text-white">{selectedBuyer.business_name}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 font-bold uppercase text-[9px]">Setup Type</span>
                <span className="font-bold text-white">{selectedBuyer.business_type.replace(/_/g, " ")}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 font-bold uppercase text-[9px]">Registered Contact</span>
                <span className="font-bold text-white">+{selectedBuyer.mobile}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 font-bold uppercase text-[9px]">Email Address</span>
                <span className="font-semibold text-slate-300">{selectedBuyer.email || "Not Provided"}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 font-bold uppercase text-[9px]">City & Pincode</span>
                <span className="font-bold text-white">{selectedBuyer.city} - {selectedBuyer.pincode} ({selectedBuyer.state})</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 font-bold uppercase text-[9px]">GST Number</span>
                <span className="font-bold text-emerald-400">{selectedBuyer.gst_number || "None"}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 font-bold uppercase text-[9px]">Instagram Sourcing page</span>
                <span className="text-blue-400 truncate">{selectedBuyer.instagram_link || "None"}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 font-bold uppercase text-[9px]">Lead scoring points</span>
                <span className="font-black text-gold text-sm">{selectedBuyer.score} / 100 ({selectedBuyer.lead_status} LEAD)</span>
              </div>
              <div className="col-span-2 flex flex-col gap-0.5 border-t border-slate-800/80 pt-3">
                <span className="text-slate-500 font-bold uppercase text-[9px]">Operator Notes Log</span>
                <span className="text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-850 leading-relaxed font-sans font-medium">{selectedBuyer.notes || "No notes logged."}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => { setActiveModal(null); setSelectedBuyer(null); }}
                className="py-2 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs hover:text-white"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURE CREDIT LIMITS MODAL */}
      {activeModal === "credit" && selectedBuyer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreditSubmit} className="bg-slate-900 border border-white/5 rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 text-left shadow-2xl relative font-sans animate-scale-in">
            <h3 className="font-outfit font-extrabold text-white text-base flex items-center gap-2 uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-gold animate-pulse-glow" /> Configure Credit Parameters
            </h3>
            <button
              type="button"
              onClick={() => { setActiveModal(null); setSelectedBuyer(null); }}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-xs text-slate-500 leading-relaxed font-medium">
              📌 Configure credit limits for *${selectedBuyer.business_name}* (current score is ${selectedBuyer.score}/100). Credit allows order creation without upfront payment options.
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Credit Limit Value (INR) *</label>
              <input
                type="number"
                value={creditForm.creditLimit}
                onChange={(e) => setCreditForm((p) => ({ ...p, creditLimit: e.target.value }))}
                placeholder="e.g. 50000"
                className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Allowed Credit Maturity Days *</label>
              <input
                type="number"
                value={creditForm.creditDays}
                onChange={(e) => setCreditForm((p) => ({ ...p, creditDays: e.target.value }))}
                placeholder="e.g. 7 or 15 days"
                className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Log Operator Note</label>
              <input
                type="text"
                value={creditForm.note}
                onChange={(e) => setCreditForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="Approved based on recent GST records..."
                className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setSelectedBuyer(null); }}
                className="py-2 px-4 rounded-xl border border-slate-800 text-slate-400 text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-gold hover:bg-gold-600 text-slate-950 font-bold text-xs"
              >
                Save Credit Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VERIFY / APPROVE STATUS MODAL */}
      {activeModal === "status" && selectedBuyer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleStatusSubmit} className="bg-slate-900 border border-white/5 rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 text-left shadow-2xl relative font-sans animate-scale-in">
            <h3 className="font-outfit font-extrabold text-white text-base flex items-center gap-2 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-gold animate-bounce" /> Approve B2B Buyer Request
            </h3>
            <button
              type="button"
              onClick={() => { setActiveModal(null); setSelectedBuyer(null); }}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-xs text-slate-500 leading-normal font-medium">
              📌 Account approval status will authorize the buyer to log in and unlock wholesale rates. Auto-dispatches credentials instantly to buyer WhatsApp!
            </div>

            <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold">Buyer Shop:</span>
              <span className="font-bold text-white">{selectedBuyer.business_name} ({selectedBuyer.city})</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Verify Verification Action *</label>
              <select
                value={statusForm.status}
                onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))}
                className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 font-semibold"
              >
                <option value="APPROVED">APPROVED (Active Creds)</option>
                <option value="REJECTED">REJECTED (Decline Verification)</option>
                <option value="BLOCKED">BLOCKED (Deactivate access)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Log Verification Note (Optional)</label>
              <input
                type="text"
                value={statusForm.note}
                onChange={(e) => setStatusForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="Shop physical verification checks passed..."
                className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setSelectedBuyer(null); }}
                className="py-2 px-4 rounded-xl border border-slate-800 text-slate-400 text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-gold hover:bg-gold-600 text-slate-950 font-bold text-xs"
              >
                Save Verification Action
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
