"use client";

import { useState, useEffect } from "react";
import {
  CircleDollarSign,
  Plus,
  X,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export default function AdminCashFlowPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Selection states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ type: "income", category: "order_payment", amount: "", description: "" });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cashflow");
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Fetch CashFlow Error: ", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cashflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          createdBy: "Pooja Patel" // Simulated Accounts Staff
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add ledger entry.");

      setIsAddOpen(false);
      setAddForm({ type: "income", category: "order_payment", amount: "", description: "" });
      fetchLogs();
    } catch (err: any) {
      alert(err.message || "Failed to add cashflow entry.");
    }
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSearch = l.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || l.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate totals
  const totalIncome = logs.filter((l) => l.type === "income").reduce((s, i) => s + i.amount, 0);
  const totalExpense = logs.filter((l) => l.type === "expense").reduce((s, i) => s + i.amount, 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="flex flex-col gap-6 text-left font-sans text-slate-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Cash Flow Ledger & Receivables</p>
          <p className="text-[11px] text-slate-500 mt-1 leading-normal">
            Pan-India buyer payments receivables aging models, daily income records, and business overheads ledger.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 py-2.5 px-5 bg-gold hover:bg-gold-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-gold/10 transition-all text-xs"
        >
          <Plus className="w-4 h-4 text-slate-950" /> Add Transaction Ledger
        </button>
      </div>

      {/* RECEIVABLES AGING & BALANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border-l-4 border-l-gold">
          <span className="text-slate-500 uppercase tracking-widest font-bold text-[9px]">Net Cash Position</span>
          <span className={`text-xl font-black mt-2 tracking-tight ${netBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            ₹{netBalance.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500 mt-1">Income - Overheads</span>
        </div>
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <span className="text-slate-500 uppercase tracking-widest font-bold text-[9px]">Receivables (0-7 Days)</span>
          <span className="text-xl font-black text-white mt-2 tracking-tight">₹18,375</span>
          <span className="text-[9px] text-slate-500 mt-1">Sneha Garments</span>
        </div>
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <span className="text-slate-500 uppercase tracking-widest font-bold text-[9px]">Receivables (7-30 Days)</span>
          <span className="text-xl font-black text-white mt-2 tracking-tight">₹34,500</span>
          <span className="text-[9px] text-slate-500 mt-1">Pending buyer credit terms</span>
        </div>
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <span className="text-slate-500 uppercase tracking-widest font-bold text-[9px]">Receivables (30+ Overdue)</span>
          <span className="text-xl font-black text-red-500 mt-2 tracking-tight animate-pulse">₹0</span>
          <span className="text-[9px] text-red-400 mt-1 font-bold">Excellent credit collections</span>
        </div>
      </div>

      {/* LEDGER BAR SUMMARIES */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-8 border border-gold/10">
        <div className="flex-grow flex flex-col gap-3 justify-center text-left">
          <h4 className="font-outfit font-extrabold text-white text-sm">Income vs Expenses Analysis</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm">
            Wholesale operational profit margin tracks. Sourcing costs Surat POs form standard Expenses ledger blocks, website PO orders verify Income flow.
          </p>
          <div className="flex gap-4 mt-2">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-slate-500">Gross Income</span>
              <span className="text-md font-bold text-emerald-400">₹{totalIncome.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-slate-500">Gross Expense</span>
              <span className="text-md font-bold text-red-400">₹{totalExpense.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* SVG Ledger Chart */}
        <div className="flex-shrink-0 w-full md:w-64 h-36 flex items-end justify-center gap-6 pb-2 border-b border-slate-800">
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 rounded-t-lg bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center justify-center text-emerald-400 text-[10px] font-bold"
              style={{ height: `${totalIncome > 0 ? 100 : 10}px` }}
            >
              <ArrowUpRight className="w-4 h-4 shrink-0" />
            </div>
            <span className="text-[10px] text-slate-500">Incomes</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 rounded-t-lg bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 transition-all flex items-center justify-center text-red-400 text-[10px] font-bold"
              style={{ height: `${totalExpense > 0 ? (totalExpense / Math.max(1, totalIncome)) * 100 : 10}px` }}
            >
              <ArrowDownRight className="w-4 h-4 shrink-0" />
            </div>
            <span className="text-[10px] text-slate-500">Overheads</span>
          </div>
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
            placeholder="Search cash entries details description..."
            className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-gold outline-none text-xs text-white"
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full md:w-48 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer"
        >
          <option value="all">Type: All</option>
          <option value="income">Income Only</option>
          <option value="expense">Expense Only</option>
        </select>
      </div>

      {/* LEDGER TRANSACTION LIST */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm">Loading ledger details...</div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-gold/15">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-xs md:text-sm text-left">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4">Entry Type</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Transaction Description</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-right">Staff Sign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredLogs.map((l) => (
                  <tr key={l.entry_id} className="hover:bg-slate-900/20 transition-all text-xs text-slate-300">
                    <td className="p-4 text-slate-500">{new Date(l.date).toDateString()}</td>
                    <td className="p-4">
                      <span className={`py-0.5 px-2 rounded font-extrabold uppercase text-[9px] ${
                        l.type === "income" ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-red-400 bg-red-500/10 border border-red-500/20"
                      }`}>
                        {l.type === "income" ? "INCOME" : "EXPENSE"}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-400 uppercase">{l.category.replace(/_/g, " ")}</td>
                    <td className="p-4 font-medium text-slate-300">{l.description}</td>
                    <td className={`p-4 text-right font-black ${l.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                      {l.type === "income" ? "+" : "-"} ₹{l.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-slate-500">{l.created_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD TRANSACTION LEDGER MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddSubmit} className="bg-slate-900 border border-gold/15 rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 text-left shadow-2xl relative font-sans">
            <h3 className="font-outfit font-extrabold text-white text-lg flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-gold" /> Add Manual Ledger Transaction
            </h3>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Transaction Type *</label>
                <select
                  value={addForm.type}
                  onChange={(e) => setAddForm((p) => ({ ...p, type: e.target.value }))}
                  className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-gold outline-none text-xs text-slate-300"
                >
                  <option value="income">INCOME (Cash Inflow)</option>
                  <option value="expense">EXPENSE (Outflow / Overheads)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Category *</label>
                <select
                  value={addForm.category}
                  onChange={(e) => setAddForm((p) => ({ ...p, category: e.target.value }))}
                  className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-gold outline-none text-xs text-slate-300"
                >
                  <option value="order_payment">Order Invoice Payment</option>
                  <option value="purchase_cost">Surat Purchase Cost</option>
                  <option value="freight">Logistics / Freight Charges</option>
                  <option value="salary">Staff Salary / Compensation</option>
                  <option value="rent">Office / Warehouse Rent</option>
                  <option value="marketing">Promo / Marketing / Ads</option>
                  <option value="misc">Other Overheads</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Amount (INR) *</label>
              <input
                type="number"
                value={addForm.amount}
                onChange={(e) => setAddForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="e.g. 15000"
                className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-gold outline-none text-xs text-white"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Ledger Entry Description *</label>
              <input
                type="text"
                value={addForm.description}
                onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="e.g. Freight logistics invoice clear for Ring Road PO 102"
                className="py-2.5 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-gold outline-none text-xs text-white"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="py-2 px-4 rounded-xl border border-slate-800 text-slate-400 text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-gold hover:bg-gold-600 text-slate-950 font-bold text-xs"
              >
                Add Transaction Entry
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
