"use client";
 
import { useState, useEffect } from "react";
// Use namespace import for icons to avoid missing chunks.
import * as LucideIcons from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
const { ShoppingCart, Truck, DollarSign, FileText, Plus, X, Search, Filter, CheckCircle, AlertTriangle, Clock, Sparkles } = LucideIcons;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [activeModal, setActiveModal] = useState<"dispatch" | "payment" | "invoice" | "create" | null>(null);

  // Form Inputs
  const [dispatchForm, setDispatchForm] = useState({ transportName: "", lrNumber: "", expectedDeliveryDate: "" });
  const [paymentForm, setPaymentForm] = useState({ amountReceived: "", paymentStatus: "paid" });
  
  // Manual Create Order Form Inputs
  const [createForm, setCreateForm] = useState({
    buyerId: "",
    paymentTerms: "advance",
    notes: "",
    depositAmount: "", // initial partial deposit
    items: [] as Array<{ skuId: string; qty: number; price: number }>
  });

  const [createItemInput, setCreateItemInput] = useState({ skuId: "", qty: 12 });
  const [buyerSearchQuery, setBuyerSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, paymentFilter, dateFilter, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build filter parameters for backend-side query optimization
      const queryParams = new URLSearchParams({
        search: search.trim(),
        statusFilter,
        paymentFilter,
        dateFilter,
        startDate,
        endDate
      });

      // 1. Fetch Orders (filtered on standard Neon database level)
      const resOrders = await fetch(`/api/orders?${queryParams.toString()}`);
      const dataOrders = await resOrders.json();
      setOrders(Array.isArray(dataOrders) ? dataOrders : []);

      // 2. Fetch Buyers for manual create order (query only once on mount to optimize)
      if (buyers.length === 0) {
        const resBuyers = await fetch("/api/buyers");
        const dataBuyers = await resBuyers.json();
        setBuyers(Array.isArray(dataBuyers) ? dataBuyers : []);
      }

      // 3. Fetch Products for manual item adds (query only once on mount to optimize)
      if (products.length === 0) {
        const resProducts = await fetch("/api/products");
        const dataProducts = await resProducts.json();
        setProducts(Array.isArray(dataProducts) ? dataProducts : []);
      }
    } catch (e) {
      setError("Failed to fetch database records.");
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const res = await fetch(`/api/orders/${selectedOrder.order_id}/dispatch`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dispatchForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dispatch failed.");

      // Success
      setActiveModal(null);
      setSelectedOrder(null);
      setDispatchForm({ transportName: "", lrNumber: "", expectedDeliveryDate: "" });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Dispatch failed.");
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const res = await fetch(`/api/orders/${selectedOrder.order_id}/payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentForm,
          staffName: "Amit Sharma" // Simulated logged in sales user
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment recording failed.");

      setActiveModal(null);
      setSelectedOrder(null);
      setPaymentForm({ amountReceived: "", paymentStatus: "paid" });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Payment logging failed.");
    }
  };

  const addManualItem = () => {
    if (!createItemInput.skuId || createItemInput.qty <= 0) return;
    const selectedProd = products.find((p) => p.sku_id === createItemInput.skuId);
    if (!selectedProd) return;

    // Use standard price for matching quantity count
    const price = selectedProd.standard_price;

    setCreateForm((prev) => {
      const existing = prev.items.find((i) => i.skuId === createItemInput.skuId);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.skuId === createItemInput.skuId ? { ...i, qty: i.qty + createItemInput.qty } : i
          )
        };
      }
      return {
        ...prev,
        items: [...prev.items, { skuId: createItemInput.skuId, qty: createItemInput.qty, price }]
      };
    });

    setCreateItemInput({ skuId: "", qty: 12 });
  };

  const removeManualItem = (skuId: string) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.skuId !== skuId)
    }));
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.buyerId || createForm.items.length === 0) {
      alert("Zaroori inputs (Buyer, items) complete karein.");
      return;
    }

    // Calculate total to check for E-Way Bill threshold of 50,000 INR
    const subtotal = createForm.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalQty = createForm.items.reduce((sum, item) => sum + item.qty, 0);
    let discountPercent = 0;
    if (totalQty >= 50) discountPercent = 5;
    else if (totalQty >= 25) discountPercent = 3;
    const volumeDiscount = Math.round((subtotal * discountPercent) / 100);

    const isPrepaid = createForm.paymentTerms === "advance" || createForm.paymentTerms === "partial";
    const prepaidDiscount = isPrepaid ? Math.round(subtotal * 0.02) : 0;

    const isCod = createForm.paymentTerms === "cod";
    const codCharges = isCod ? Math.round(subtotal * 0.02) : 0;

    const courierCharges = totalQty * 20;
    const packagingCharges = 150;

    const taxableAmount = subtotal - volumeDiscount - prepaidDiscount + codCharges + courierCharges + packagingCharges;
    const gstAmount = Math.round(taxableAmount * 0.05);
    const invoiceAmount = taxableAmount + gstAmount;

    if (invoiceAmount > 50000) {
      alert("Alert: E-Way Bill Mandatory!");
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          depositAmount: Number(createForm.depositAmount) || 0,
          createdBy: "Amit Sharma" // Staff signature
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create sales order.");

      // Success
      setActiveModal(null);
      setBuyerSearchQuery("");
      setCreateForm({ buyerId: "", paymentTerms: "advance", notes: "", depositAmount: "", items: [] });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Manual order creation failed.");
    }
  };

  // Real-time manual checkout pricing estimator
  const estSubtotal = createForm.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const estQty = createForm.items.reduce((sum, item) => sum + item.qty, 0);
  let estDiscountPercent = 0;
  if (estQty >= 50) estDiscountPercent = 5;
  else if (estQty >= 25) estDiscountPercent = 3;
  const estVolumeDiscount = Math.round((estSubtotal * estDiscountPercent) / 100);

  const estIsPrepaid = createForm.paymentTerms === "advance" || createForm.paymentTerms === "partial";
  const estPrepaidDiscount = estIsPrepaid ? Math.round(estSubtotal * 0.02) : 0;

  const estIsCod = createForm.paymentTerms === "cod";
  const estCodCharges = estIsCod ? Math.round(estSubtotal * 0.02) : 0;

  const estCourierCharges = estQty * 20;
  const estPackagingCharges = estQty > 0 ? 150 : 0;

  const estTaxableAmount = estSubtotal - estVolumeDiscount - estPrepaidDiscount + estCodCharges + estCourierCharges + estPackagingCharges;
  const estGstAmount = Math.round(estTaxableAmount * 0.05);
  const estInvoiceAmount = estTaxableAmount + estGstAmount;

  // Filter dynamic listings (now fully executed server-side on Neon database level)
  const filteredOrders = orders;

  return (
    <div className="flex flex-col gap-6 text-left font-sans text-slate-300 animate-fade-in">
      {/* Title & Action Panel */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-2 border-b border-white/5">
        <div>
          <span className="text-[10px] text-gold font-bold tracking-wider uppercase bg-gold/10 px-2.5 py-1 rounded-full border border-gold/15">
            Logistics & Ledger
          </span>
          <h2 className="text-2xl font-outfit font-extrabold text-white tracking-tight mt-2">
            Order Management Ledger
          </h2>
          <p className="text-[11px] text-slate-500 mt-1 leading-normal max-w-xl">
            B2B dispatch logistics checks, payments receivable tracking, and dynamic credit limit locks.
          </p>
        </div>
        
        <Tooltip content="Manually draft a B2B sales order, select payment terms, and reserve warehouse inventory." position="bottom">
          <button
            onClick={() => setActiveModal("create")}
            className="flex items-center gap-2 py-2.5 px-5 bg-gold hover:bg-gold-600 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-gold/15 transition-all text-xs active:scale-95 w-full lg:w-auto justify-center"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" /> Add Order (Manual)
          </button>
        </Tooltip>
      </div>

      {/* KPI METRICS BARS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tooltip content="Cumulative B2B purchase orders generated this period." position="top" className="w-full">
          <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-gold/20 transition-all duration-300 h-full">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Sales POs</p>
              <p className="text-2xl font-outfit font-extrabold text-white mt-1">{orders.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-gold group-hover:scale-110 transition-transform duration-300">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
        </Tooltip>

        <Tooltip content="Aggregate billing amount across confirmed, packed, and shipped orders." position="top" className="w-full">
          <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300 h-full">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gross Booked Revenue</p>
              <p className="text-2xl font-outfit font-extrabold text-emerald-400 mt-1">
                ₹{orders.filter(o => o.order_status !== "cancelled").reduce((acc, o) => acc + (o.invoice_amount || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Tooltip>

        <Tooltip content="Orders currently in packed or dispatched status transit." position="top" className="w-full">
          <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-blue-500/20 transition-all duration-300 h-full">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Shipments</p>
              <p className="text-2xl font-outfit font-extrabold text-blue-400 mt-1">
                {orders.filter(o => o.order_status === "dispatched" || o.order_status === "packed").length} dispatches
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <Truck className="w-5 h-5" />
            </div>
          </div>
        </Tooltip>

        <Tooltip content="Total receivable dues pending across unpaid and partial credit invoices." position="top" className="w-full">
          <div className="glass-panel p-4 rounded-xl border border-red-500/10 flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-red-500/20 transition-all duration-300 bg-red-950/5 h-full">
            <div>
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Outstanding Collection</p>
              <p className="text-2xl font-outfit font-extrabold text-red-400 mt-1">
                ₹{orders.filter(o => o.payment_status !== "paid" && o.order_status !== "cancelled").reduce((acc, o) => acc + ((o.invoice_amount || 0) - (o.payment_received_amount || 0)), 0).toLocaleString()}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-red-400 group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-5 h-5 text-red-400 animate-pulse" />
            </div>
          </div>
        </Tooltip>
      </div>

      {/* FILTERS PANEL */}
      <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order ID, shop or buyer name..."
            className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white placeholder-slate-600 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-48 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer font-medium transition-colors"
        >
          <option value="all">Order Status: All</option>
          <option value="confirmed">Confirmed</option>
          <option value="packed">Packed</option>
          <option value="dispatched">Dispatched</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Payment Filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="w-full md:w-48 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer font-medium transition-colors"
        >
          <option value="all">Payment: All</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>

        {/* Date Filter Dropdown */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full md:w-48 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer font-medium transition-colors"
        >
          <option value="all">Date Range: All</option>
          <option value="today">Today (Day-wise)</option>
          <option value="week">Last 7 Days (Week-wise)</option>
          <option value="custom">Custom Date Range</option>
        </select>
      </div>

      {/* CUSTOM DATE PICKER FIELDS */}
      {dateFilter === "custom" && (
        <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row gap-4 items-center animate-fade-in -mt-2">
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider pl-1">Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer font-semibold"
            />
          </div>
          
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider pl-1">End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 cursor-pointer font-semibold"
            />
          </div>
          
          <button
            type="button"
            onClick={() => { setStartDate(""); setEndDate(""); setDateFilter("all"); }}
            className="py-2.5 px-4 rounded-xl border border-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/5 transition-colors self-end mt-2 sm:mt-0"
          >
            Clear Date Range
          </button>
        </div>
      )}

      {/* ORDERS LIST TABLE */}
      {loading ? (
        <div className="glass-panel p-20 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
          <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Database records loading...</span>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-xs md:text-sm text-left">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-850 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="p-4 pl-6">Order ID</th>
                  <th className="p-4">Buyer Shop</th>
                  <th className="p-4">Items / Qty</th>
                  <th className="p-4">Invoice Amount</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredOrders.map((o) => {
                  // Dynamic row color coding based on status matrices
                  let rowBorderColor = "border-l-transparent";
                  if (o.order_status === "delivered" && o.payment_status === "paid") {
                    rowBorderColor = "border-l-2 border-l-emerald-500";
                  } else if (o.order_status === "confirmed" && o.payment_status === "paid") {
                    rowBorderColor = "border-l-2 border-l-amber-500";
                  } else if (o.order_status === "dispatched" && o.payment_status === "pending") {
                    rowBorderColor = "border-l-2 border-l-purple-500";
                  } else if (o.payment_status === "overdue") {
                    rowBorderColor = "border-l-2 border-l-red-500";
                  }

                  return (
                    <tr key={o.order_id} className={`hover:bg-slate-900/20 ${rowBorderColor} transition-colors text-xs text-slate-300 group`}>
                      <td className="p-4 pl-6 font-bold text-white font-outfit tracking-wide">{o.order_id}</td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white group-hover:text-gold transition-colors">{o.buyer.business_name}</span>
                          <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
                            {o.buyer.full_name} ({o.buyer.city})
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-slate-300">{o.items.length} designs ({o.total_qty} pcs)</span>
                      </td>
                      <td className="p-4 font-black text-white text-sm">₹{o.invoice_amount.toLocaleString()}</td>
                      <td className="p-4">
                        <Tooltip content={
                          o.payment_status === "paid"
                            ? "Full payment received and settled in the books."
                            : o.payment_status === "partial"
                            ? "Partial deposit received. Pending remaining balance settlement."
                            : o.payment_status === "overdue"
                            ? "Payment is overdue past the agreed buyer credit days limit!"
                            : "Payment is pending invoice maturity date."
                        } position="top">
                          <span className={`py-1 px-2.5 rounded-md font-bold uppercase text-[9px] tracking-wider ${
                            o.payment_status === "paid"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : o.payment_status === "partial"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : o.payment_status === "overdue"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {o.payment_status}
                          </span>
                        </Tooltip>
                      </td>
                      <td className="p-4">
                        <Tooltip content={
                          o.order_status === "delivered"
                            ? "Shipment successfully delivered and confirmed at the buyer's destination."
                            : o.order_status === "confirmed"
                            ? "Sales order confirmed. Items reserved in active inventory."
                            : o.order_status === "packed"
                            ? "Order packed, barcoded, and waiting in dispatch warehouse area."
                            : o.order_status === "dispatched"
                            ? "Shipped. Consignment handed over to transport carrier."
                            : "Order cancelled. Ledger entries and inventory allocations reverted."
                        } position="top">
                          <span className={`py-1 px-2.5 rounded-md font-extrabold uppercase text-[9px] tracking-wider ${
                            o.order_status === "delivered"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : o.order_status === "confirmed"
                              ? "bg-gold/15 text-gold border border-gold/25"
                              : o.order_status === "packed"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : o.order_status === "dispatched"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {o.order_status}
                          </span>
                        </Tooltip>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <Tooltip content="Generate and print the GST-compliant B2B invoice PDF for this order." position="left">
                            <button
                              onClick={() => { window.open(`/api/orders/${o.order_id}/invoice`, "_blank"); }}
                              className="p-1.5 rounded-lg bg-slate-950 border border-white/5 hover:border-gold hover:text-gold text-slate-400 transition-all active:scale-90"
                              title="Generate Invoice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                          
                          {(o.order_status === "confirmed" || o.order_status === "packed") && (
                            <Tooltip content="Split B2B order into multiple smaller invoice shipments to match transport carrier limits." position="left">
                              <button
                                onClick={async () => {
                                  const parts = prompt("Enter number of split invoices (2-10):", "2");
                                  if (!parts) return;
                                  const num = Number(parts);
                                  if (isNaN(num) || num < 2 || num > 10) {
                                    alert("Please enter a valid number between 2 and 10.");
                                    return;
                                  }
                                  if (confirm(`Are you sure you want to split this order into ${parts} invoices? This will maintain inventory/accounting and create parent-child mapping.`)) {
                                    try {
                                      const res = await fetch(`/api/orders/${o.order_id}/split`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ parts: num, staffName: "Amit Sharma" })
                                      });
                                      const data = await res.json();
                                      if (!res.ok) throw new Error(data.error || "Failed to split order.");
                                      alert(data.message || "Order split successfully.");
                                      fetchData();
                                    } catch (err: any) {
                                      alert(err.message || "Split failed.");
                                    }
                                  }
                                }}
                                className="py-1 px-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white font-extrabold transition-all text-[10px] uppercase tracking-wider active:scale-95"
                              >
                                Split
                              </button>
                            </Tooltip>
                          )}

                          {o.order_status === "confirmed" && (
                            <Tooltip content="Mark order status as packed and ready for logistics carrier booking." position="left">
                              <button
                                onClick={async () => {
                                  if (confirm("Mark order as Packed & Ready for carrier booking?")) {
                                    const res = await fetch(`/api/orders/${o.order_id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ orderStatus: "packed" })
                                    });
                                    if (res.ok) fetchData();
                                    else alert("Failed to update status.");
                                  }
                                }}
                                className="py-1 px-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white font-extrabold transition-all text-[10px] uppercase tracking-wider active:scale-95"
                              >
                                Pack
                              </button>
                            </Tooltip>
                          )}
                          
                          {o.order_status === "packed" && (
                            <Tooltip content="Record transport receipt details (Lorry Receipt / LR) and set dispatched status." position="left">
                              <button
                                onClick={() => { setSelectedOrder(o); setActiveModal("dispatch"); }}
                                className="py-1 px-2.5 rounded-lg bg-gold/10 border border-gold/20 text-gold hover:bg-gold hover:text-slate-950 font-extrabold transition-all text-[10px] uppercase tracking-wider flex items-center gap-1 active:scale-95"
                              >
                                <Truck className="w-3 h-3" /> Dispatch
                              </button>
                            </Tooltip>
                          )}
                          
                          {o.order_status === "dispatched" && (
                            <Tooltip content="Confirm that the shipment parcel has reached the buyer's retail shop successfully." position="left">
                              <button
                                onClick={async () => {
                                  if (confirm("Confirm that parcel was Delivered to buyer shop?")) {
                                    const res = await fetch(`/api/orders/${o.order_id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ orderStatus: "delivered" })
                                    });
                                    if (res.ok) fetchData();
                                    else alert("Failed to update status.");
                                  }
                                }}
                                className="py-1 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white font-extrabold transition-all text-[10px] uppercase tracking-wider flex items-center gap-1 active:scale-95"
                              >
                                Deliver
                              </button>
                            </Tooltip>
                          )}
                          
                          {o.payment_status !== "paid" && (
                            <Tooltip content="Record manual or bank payment received towards this sales ledger invoice." position="left">
                              <button
                                onClick={() => { setSelectedOrder(o); setActiveModal("payment"); }}
                                className="py-1 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white font-extrabold transition-all text-[10px] uppercase tracking-wider flex items-center gap-1 active:scale-95"
                              >
                                <DollarSign className="w-3 h-3" /> Pay
                              </button>
                            </Tooltip>
                          )}
                          
                          {o.order_status !== "delivered" && o.order_status !== "cancelled" && (
                            <Tooltip content="Cancel B2B Sales Order and automatically revert reserved physical inventory to stock." position="left">
                              <button
                                onClick={async () => {
                                  if (confirm("Are you absolutely sure you want to CANCEL this B2B Sales Order? All reserved/dispatched stock will revert!")) {
                                    const res = await fetch(`/api/orders/${o.order_id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ orderStatus: "cancelled" })
                                    });
                                    if (res.ok) fetchData();
                                    else alert("Failed to cancel order.");
                                  }
                                }}
                                className="py-1 px-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white font-bold transition-all text-[10px] uppercase tracking-wider active:scale-95"
                              >
                                Cancel
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DISPATCH INPUT MODAL (GLASS SHEET) */}
      {activeModal === "dispatch" && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleDispatchSubmit}
            className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 text-left shadow-2xl relative glass-panel-glow"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-outfit font-extrabold text-white text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-gold animate-bounce" /> Confirm Shipment Cargo
              </h3>
              <button
                type="button"
                onClick={() => { setActiveModal(null); setSelectedOrder(null); }}
                className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-white/5 leading-relaxed font-semibold">
              📌 Dispatch confirm karne se database inventory sets subtract ho jaayenge aur buyer and internal teams ko instant WhatsApp LR tracking codes alert automatic system update kar dega.
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Transport Carrier Name *</label>
              <input
                type="text"
                value={dispatchForm.transportName}
                onChange={(e) => setDispatchForm((p) => ({ ...p, transportName: e.target.value }))}
                placeholder="e.g. V-Trans Logistics, Safe Express"
                className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all placeholder-slate-700"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Lorry Receipt (LR) Consignment Number *</label>
              <input
                type="text"
                value={dispatchForm.lrNumber}
                onChange={(e) => setDispatchForm((p) => ({ ...p, lrNumber: e.target.value }))}
                placeholder="e.g. LR-90823746"
                className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all placeholder-slate-700"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Expected Delivery Date</label>
              <input
                type="date"
                value={dispatchForm.expectedDeliveryDate}
                onChange={(e) => setDispatchForm((p) => ({ ...p, expectedDeliveryDate: e.target.value }))}
                className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 font-semibold cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setSelectedOrder(null); }}
                className="py-2.5 px-4 rounded-xl border border-white/5 text-slate-400 text-xs hover:text-white hover:bg-white/5 transition-all font-semibold active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-gold hover:bg-gold-600 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-gold/15 active:scale-95"
              >
                Confirm Dispatch Stock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RECORD PAYMENT MODAL (GLASS SHEET) */}
      {activeModal === "payment" && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handlePaymentSubmit}
            className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 text-left shadow-2xl relative glass-panel-glow"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-outfit font-extrabold text-white text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gold animate-bounce" /> Receive Payment Transaction
              </h3>
              <button
                type="button"
                onClick={() => { setActiveModal(null); setSelectedOrder(null); }}
                className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-white/5 leading-relaxed font-semibold">
              📌 Payment receive update karne se dynamic internal Ledger record compute ho jayega aur auto cash flow register entry execute hogi.
            </div>

            <div className="flex justify-between p-3.5 rounded-xl bg-slate-950 border border-white/5 text-xs shadow-inner">
              <span className="text-slate-500 font-bold uppercase tracking-wider">Total Invoice Value:</span>
              <span className="font-black text-white text-sm font-outfit">₹{selectedOrder.invoice_amount.toLocaleString()}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Amount Received (INR) *</label>
              <input
                type="number"
                value={paymentForm.amountReceived}
                onChange={(e) => setPaymentForm((p) => ({ ...p, amountReceived: e.target.value }))}
                placeholder={`Est Total: ₹${selectedOrder.invoice_amount - selectedOrder.payment_received_amount}`}
                className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all placeholder-slate-700"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Update Payment Status *</label>
              <select
                value={paymentForm.paymentStatus}
                onChange={(e) => setPaymentForm((p) => ({ ...p, paymentStatus: e.target.value }))}
                className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 font-semibold cursor-pointer"
              >
                <option value="paid">Paid (Fully Closed)</option>
                <option value="partial">Partial Payment</option>
                <option value="pending">Pending balance</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setSelectedOrder(null); }}
                className="py-2.5 px-4 rounded-xl border border-white/5 text-slate-400 text-xs hover:text-white hover:bg-white/5 transition-all font-semibold active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-gold hover:bg-gold-600 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-gold/15 active:scale-95"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MOCK PRINTABLE B2B INVOICE MODAL (MUSEUM BRONZE DETAILS) */}
      {activeModal === "invoice" && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white text-slate-900 rounded-2xl max-w-xl w-full p-6 md:p-8 flex flex-col gap-5 text-left shadow-2xl relative font-mono text-xs max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setActiveModal(null); setSelectedOrder(null); }}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg w-8 h-8 flex items-center justify-center font-sans font-bold hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Printable Frame */}
            <div className="border border-slate-300 p-4 rounded-xl flex flex-col gap-4">
              <div className="text-center pb-3 border-b border-slate-300 flex flex-col">
                <span className="font-sans font-black text-lg tracking-wider text-slate-950 uppercase">PRIME APPAREL EXPORTS LTD</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Ladies Ethnic Wear B2B Wholesale Manufacturers</span>
                <span className="text-[9px] text-slate-400 mt-2">Cargo Center: Bandra Link Road, Mumbai | Surat Sourcing Mills</span>
                <span className="text-[9px] text-slate-400 font-bold">GSTIN: 27BBBBB9999A1Z2</span>
              </div>

              <div className="flex justify-between border-b border-slate-300 pb-3 text-[10px]">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[8px]">INVOICE TO:</span>
                  <span className="font-bold text-slate-950 text-xs">{selectedOrder.buyer.business_name}</span>
                  <span>{selectedOrder.buyer.full_name} ({selectedOrder.buyer.mobile})</span>
                  <span>{selectedOrder.buyer.city}, {selectedOrder.buyer.state}</span>
                </div>
                <div className="flex flex-col text-right gap-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[8px]">INVOICE DETAILS:</span>
                  <span className="font-bold text-slate-950">Invoice ID: #{selectedOrder.order_id}</span>
                  <span>Date: {new Date(selectedOrder.order_date).toDateString()}</span>
                  <span className="font-bold uppercase text-slate-950">Terms: {selectedOrder.payment_terms.toUpperCase()}</span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="grid grid-cols-5 font-bold border-b border-slate-300 pb-1 text-slate-600 uppercase text-[9px] tracking-wider">
                  <span className="col-span-2">SKU Details</span>
                  <span className="text-center">Rate</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Total</span>
                </div>
                <div className="divide-y divide-slate-100 mt-2">
                  {selectedOrder.items.map((it: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-5 py-2 font-semibold">
                      <span className="col-span-2 font-bold text-slate-950">{it.skuId}</span>
                      <span className="text-center">₹{it.price}</span>
                      <span className="text-center">{it.qty} pcs</span>
                      <span className="text-right font-black text-slate-950">₹{it.price * it.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summaries */}
              <div className="border-t border-slate-300 pt-3 flex flex-col gap-1 text-right max-w-xs ml-auto font-semibold">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Subtotal:</span>
                  <span>₹{selectedOrder.subtotal_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Bulk Scheme Discount:</span>
                  <span>-₹{selectedOrder.discount_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST Taxes (5%):</span>
                  <span>+₹{selectedOrder.gst_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-2 text-xs font-black text-slate-950">
                  <span>Invoice Total:</span>
                  <span>₹{selectedOrder.invoice_amount.toLocaleString()}</span>
                </div>
                {selectedOrder.payment_received_amount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold text-[10px] mt-1">
                    <span>Payment Received:</span>
                    <span>-₹{selectedOrder.payment_received_amount.toLocaleString()}</span>
                  </div>
                )}
                {selectedOrder.invoice_amount - selectedOrder.payment_received_amount > 0 && (
                  <div className="flex justify-between text-red-600 border-t border-dashed border-slate-200 pt-1.5 font-bold text-xs mt-1">
                    <span>Pending Balance Due:</span>
                    <span>₹{(selectedOrder.invoice_amount - selectedOrder.payment_received_amount).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* T & C */}
              <div className="text-[9px] text-slate-400 leading-normal border-t border-slate-200 pt-3 italic font-semibold">
                👉 Declaration: Sourced Surat points, Strict Mumbai QC double-checked dispatches. Defect claims accepted with unpack proof within 48h. B2B Wholesale strictly advance/credit limits terms.
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold font-sans text-center transition-all text-xs active:scale-95"
            >
              Print Digital Copy
            </button>
          </div>
        </div>
      )}

      {/* MANUAL CREATE SALES ORDER MODAL (SaaS WIZARD) */}
      {activeModal === "create" && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleCreateOrderSubmit}
            className="bg-slate-900 border border-white/10 rounded-2xl max-w-xl w-full p-6 flex flex-col gap-5 text-left shadow-2xl relative max-h-[90vh] overflow-y-auto glass-panel-glow"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-outfit font-extrabold text-white text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gold animate-bounce" /> Create B2B Sales Order
              </h3>
              <button
                type="button"
                onClick={() => { setActiveModal(null); setBuyerSearchQuery(""); }}
                className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buyer Select */}
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Search & Filter Buyers</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={buyerSearchQuery}
                  onChange={(e) => setBuyerSearchQuery(e.target.value)}
                  placeholder="Type Shop Name, Mobile, Email, or Instagram handle..."
                  className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all placeholder-slate-700"
                />
              </div>

              {/* Autocomplete Popup Suggestions */}
              {buyerSearchQuery.trim() !== "" && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 backdrop-blur-md">
                  {buyers
                    .filter((b) => {
                      const query = buyerSearchQuery.toLowerCase();
                      return (
                        b.business_name.toLowerCase().includes(query) ||
                        b.full_name.toLowerCase().includes(query) ||
                        b.mobile.toLowerCase().includes(query) ||
                        (b.email && b.email.toLowerCase().includes(query)) ||
                        (b.instagram_link && b.instagram_link.toLowerCase().includes(query))
                      );
                    })
                    .map((b) => (
                      <button
                        key={b.buyer_id}
                        type="button"
                        onClick={() => {
                          setCreateForm((p) => ({ ...p, buyerId: String(b.buyer_id) }));
                          setBuyerSearchQuery(""); // Close popup on selection
                        }}
                        className="w-full text-left py-2 px-3 hover:bg-gold/10 hover:text-gold text-xs transition-colors rounded-lg flex flex-col gap-0.5"
                      >
                        <span className="font-bold text-white">{b.business_name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {b.full_name} • {b.mobile} • {b.city}
                        </span>
                      </button>
                    ))}
                  {buyers.filter((b) => {
                    const query = buyerSearchQuery.toLowerCase();
                    return (
                      b.business_name.toLowerCase().includes(query) ||
                      b.full_name.toLowerCase().includes(query) ||
                      b.mobile.toLowerCase().includes(query) ||
                      (b.email && b.email.toLowerCase().includes(query)) ||
                      (b.instagram_link && b.instagram_link.toLowerCase().includes(query))
                    );
                  }).length === 0 && (
                    <span className="text-[10px] text-slate-500 py-3 text-center font-semibold">
                      No matching B2B buyers found
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Select Approved B2B Buyer *</label>
              <select
                value={createForm.buyerId}
                onChange={(e) => setCreateForm((p) => ({ ...p, buyerId: e.target.value }))}
                className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 font-semibold cursor-pointer"
                required
              >
                <option value="">-- Choose Buyer Shop --</option>
                {buyers.map((b) => (
                  <option key={b.buyer_id} value={b.buyer_id}>
                    {b.business_name} ({b.full_name} - {b.city})
                  </option>
                ))}
              </select>
            </div>

            {/* SKU and MOQ quantity add sub-panel */}
            <div className="bg-slate-950 p-4 rounded-xl border border-white/5 flex flex-col gap-4 shadow-inner">
              <span className="text-[9px] text-gold font-bold uppercase tracking-widest bg-gold/10 px-2 py-0.5 rounded border border-gold/15 w-fit">
                Add Order Items Packs (MOQ 12)
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Choose SKU Design *</label>
                  <select
                    value={createItemInput.skuId}
                    onChange={(e) => setCreateItemInput((p) => ({ ...p, skuId: e.target.value }))}
                    className="py-2 px-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-gold text-xs text-slate-300 font-semibold cursor-pointer"
                  >
                    <option value="">-- Select SKU --</option>
                    {products.map((p) => (
                      <option key={p.sku_id} value={p.sku_id}>
                        {p.sku_id} - {p.design_name} (₹{p.standard_price})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Quantity (MOQ 12) *</label>
                  <input
                    type="number"
                    value={createItemInput.qty}
                    onChange={(e) => setCreateItemInput((p) => ({ ...p, qty: Number(e.target.value) }))}
                    placeholder="Pieces count"
                    step={12}
                    min={12}
                    className="py-2 px-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-gold text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={addManualItem}
                  className="py-2.5 px-4 rounded-xl bg-gold hover:bg-gold-600 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-gold/10 active:scale-95"
                >
                  Add Pack
                </button>
              </div>

              {/* Items added table summary */}
              {createForm.items.length > 0 && (
                <div className="border-t border-slate-850 pt-3 mt-1 flex flex-col gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Items Selected:</span>
                  <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {createForm.items.map((it) => (
                      <div key={it.skuId} className="flex justify-between items-center bg-slate-900/60 border border-white/5 p-2 px-3 rounded-lg text-xs hover:border-white/10 transition-colors">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-white uppercase font-outfit">{it.skuId}</span>
                          <span className="text-[9px] text-slate-500 font-semibold mt-0.5">Pieces Count: {it.qty}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-gold">₹{(it.price * it.qty).toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => removeManualItem(it.skuId)}
                            className="text-red-400 hover:text-red-300 font-extrabold text-[10px] uppercase tracking-wider bg-red-500/10 p-1 px-2 rounded hover:bg-red-500/20 active:scale-95"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live estimated transparent B2B wholesale settlement breakdown */}
            {createForm.items.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-xl border border-white/5 flex flex-col gap-2 shadow-inner text-xs font-semibold text-slate-400">
                <span className="text-[10px] text-gold font-bold uppercase tracking-wider">Live Checkout Settlement Estimate</span>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Product Subtotal ({estQty} pcs):</span>
                  <span className="text-white">₹{estSubtotal.toLocaleString()}</span>
                </div>
                {estVolumeDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Bulk Scheme Discount ({estDiscountPercent}%):</span>
                    <span>-₹{estVolumeDiscount.toLocaleString()}</span>
                  </div>
                )}
                {estPrepaidDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Prepaid Discount (2%):</span>
                    <span>-₹{estPrepaidDiscount.toLocaleString()}</span>
                  </div>
                )}
                {estCodCharges > 0 && (
                  <div className="flex justify-between text-amber-500">
                    <span>COD Collection Charges (2%):</span>
                    <span>+₹{estCodCharges.toLocaleString()}</span>
                  </div>
                )}
                {estCourierCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Courier / Freight Charges:</span>
                    <span className="text-white">+₹{estCourierCharges.toLocaleString()}</span>
                  </div>
                )}
                {estPackagingCharges > 0 && (
                  <div className="flex justify-between">
                    <span>QC Sack Packaging Charge:</span>
                    <span className="text-white">+₹{estPackagingCharges.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] font-bold text-slate-300 border-t border-white/5 pt-1.5">
                  <span>Taxable Value:</span>
                  <span>₹{estTaxableAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Garments GST (5%):</span>
                  <span className="text-white">+₹{estGstAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white border-t border-white/10 pt-1.5 animate-pulse">
                  <span>Final Estimate:</span>
                  <span className="text-gold">₹{estInvoiceAmount.toLocaleString()}</span>
                </div>
                {estIsPrepaid && (
                  <span className="text-[9px] text-emerald-400 mt-1 font-bold">
                    🎉 You save ₹{(estPrepaidDiscount + Math.round(estSubtotal * 0.02)).toLocaleString()} on this order by choosing Prepaid payment terms!
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Payment Terms Option *</label>
                <select
                  value={createForm.paymentTerms}
                  onChange={(e) => setCreateForm((p) => ({ ...p, paymentTerms: e.target.value }))}
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-slate-300 font-semibold cursor-pointer"
                >
                  <option value="advance">Full Payment (Advance - Paid)</option>
                  <option value="partial">Partial Payment (Deposit)</option>
                  <option value="cod">Cash on Delivery (COD)</option>
                  <option value="7days">7 Days Credit Terms</option>
                  <option value="15days">15 Days Credit Terms</option>
                  <option value="30days">30 Days Credit Terms</option>
                </select>

                {createForm.paymentTerms !== "advance" && (
                  <div className="flex flex-col gap-1 mt-2 animate-fade-in">
                    <label className="text-[10px] text-gold font-bold uppercase tracking-wider">
                      {createForm.paymentTerms === "partial"
                        ? "Advance Deposit Paid (INR) *"
                        : "Optional Deposit / Paid Amount (INR)"}
                    </label>
                    <input
                      type="number"
                      value={createForm.depositAmount}
                      onChange={(e) => setCreateForm((p) => ({ ...p, depositAmount: e.target.value }))}
                      placeholder={createForm.paymentTerms === "partial" ? "e.g. 5000" : "Optional (e.g. 2000)"}
                      className="py-2 px-2.5 rounded-xl bg-slate-950 border border-gold/30 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all placeholder-slate-700"
                      required={createForm.paymentTerms === "partial"}
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Optional Operator Notes</label>
                <input
                  type="text"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Checked sizing, priority transport..."
                  className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-gold outline-none text-xs text-white focus:ring-2 focus:ring-gold/10 transition-all placeholder-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => { setActiveModal(null); setBuyerSearchQuery(""); }}
                className="py-2.5 px-4 rounded-xl border border-white/5 text-slate-400 text-xs hover:text-white hover:bg-white/5 transition-all font-semibold active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-gold hover:bg-gold-600 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-gold/15 active:scale-95"
              >
                Create Sales Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
