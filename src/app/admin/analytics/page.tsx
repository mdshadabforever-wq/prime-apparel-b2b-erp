import { db } from "@/lib/db";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Percent,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  Sparkles
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  // Query live database counts for analytics
  const allOrders = await db.salesOrder.findMany({
    include: { buyer: true }
  });

  const totalRevenue = allOrders.reduce((sum, o) => sum + o.final_amount, 0);
  const totalReceived = allOrders.reduce((sum, o) => sum + o.payment_received_amount, 0);
  const totalReceivables = Math.max(0, totalRevenue - totalReceived);
  
  // Calculate average order value
  const avgOrderValue = allOrders.length > 0 ? Number((totalRevenue / allOrders.length).toFixed(2)) : 0;

  // SKU Sourcing and Margin Metrics
  const products = await db.product.findMany();
  const totalSKUs = products.length;
  const avgMargin = products.length > 0
    ? Number((products.reduce((sum, p) => sum + p.margin_percent, 0) / products.length).toFixed(2))
    : 0;

  // Calculate Sourcing Value (Landed Cost * Qty Available)
  const inventoryAssetVal = products.reduce((sum, p) => sum + (p.landed_cost * p.qty_available), 0);

  // Buyer LTV leaderboard
  const buyers = await db.buyer.findMany({
    orderBy: { total_orders_value: "desc" },
    take: 5
  });

  // Calculate Aging of Receivables (simulated ledger dates checks)
  const overdue30 = allOrders
    .filter(o => o.payment_status === "overdue" || (o.payment_status === "pending" && o.payment_terms === "30days"))
    .reduce((sum, o) => sum + (o.invoice_amount - o.payment_received_amount), 0);

  const pending15 = allOrders
    .filter(o => o.payment_status === "pending" && o.payment_terms === "15days")
    .reduce((sum, o) => sum + (o.invoice_amount - o.payment_received_amount), 0);

  const current7 = allOrders
    .filter(o => o.payment_status === "pending" && (o.payment_terms === "7days" || o.payment_terms === "advance"))
    .reduce((sum, o) => sum + (o.invoice_amount - o.payment_received_amount), 0);

  const kpis = [
    { title: "Gross Sourced Inventory Value", val: `₹${inventoryAssetVal.toLocaleString()}`, desc: "Stock assets at landed cost", icon: <Package className="w-5 h-5 text-gold" /> },
    { title: "Average Net Profit Margin", val: `${avgMargin}%`, desc: "Sourcing vs Wholesale Rate", icon: <Percent className="w-5 h-5 text-emerald-400" /> },
    { title: "Active Receivables Ledger", val: `₹${totalReceivables.toLocaleString()}`, desc: "UPI/Bank transfers due", icon: <DollarSign className="w-5 h-5 text-blue-400" /> },
    { title: "Average B2B Order Size", val: `₹${avgOrderValue.toLocaleString()}`, desc: "Consolidated volume", icon: <TrendingUp className="w-5 h-5 text-amber-500" /> }
  ];

  return (
    <div className="flex flex-col gap-8 text-left font-sans text-slate-300">
      {/* Page Header */}
      <div>
        <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Business Intelligence & Analytics Hub</p>
        <p className="text-[11px] text-slate-500 mt-1 leading-normal">
          Real-time analysis of Surat-sourcing assets, wholesale gross profits, client lifetime valuation leaderboards, and payment collection aging models.
        </p>
      </div>

      {/* 1. TOP KPI METRICS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const getKpiTooltip = (title: string) => {
            if (title.includes("Gross Sourced")) return "Total valuation of current warehouse stock calculated at Surat landed sourcing cost.";
            if (title.includes("Average Net Profit")) return "Average profit margin percentage on wholesale price across all catalog SKUs.";
            if (title.includes("Active Receivables")) return "Outstanding balance payments yet to be collected from active buyer ledger accounts.";
            if (title.includes("Average B2B Order")) return "Consolidated average average billing amount per single wholesale purchase order.";
            return "";
          };

          return (
            <Tooltip key={idx} content={getKpiTooltip(kpi.title)} position="top" className="w-full">
              <div
                className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-gold/30 transition-all h-full"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider leading-none">
                    {kpi.title}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800">
                    {kpi.icon}
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">
                    {kpi.val}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">{kpi.desc}</p>
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* 2. CHARTS & LEDGERS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receivables Aging Dashboard */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col gap-5 border border-gold/10">
          <div>
            <h4 className="font-outfit font-extrabold text-white text-sm">Receivables Aging & Collections Schedule</h4>
            <p className="text-[10px] text-slate-500">Aging breakdown of outstanding B2B wholesale credits</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center mt-2">
            <Tooltip content="Dues within standard grace period. Standard UPI/bank transfer collections." position="top" className="w-full">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col h-full">
                <span className="text-[9px] uppercase font-bold text-emerald-400">Current (0-7 Days)</span>
                <span className="text-lg font-black text-white mt-1.5">₹{current7.toLocaleString()}</span>
                <span className="text-[9px] text-slate-500 mt-1">Normal collection cycle</span>
              </div>
            </Tooltip>
            <Tooltip content="Outstanding receivables matching extended B2B credit agreement days." position="top" className="w-full">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col h-full">
                <span className="text-[9px] uppercase font-bold text-amber-500">Matured (8-30 Days)</span>
                <span className="text-lg font-black text-white mt-1.5">₹{pending15.toLocaleString()}</span>
                <span className="text-[9px] text-slate-500 mt-1">Outstanding credit terms</span>
              </div>
            </Tooltip>
            <Tooltip content="High-risk receivables matured past credit limits. Escalate collection immediately!" position="top" className="w-full">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col border-l-2 border-l-red-500 h-full">
                <span className="text-[9px] uppercase font-bold text-red-400">Overdue (30+ Days)</span>
                <span className="text-lg font-black text-red-500 mt-1.5 animate-pulse">₹{overdue30.toLocaleString()}</span>
                <span className="text-[9px] text-red-400 mt-1 font-bold">Escalate immediately</span>
              </div>
            </Tooltip>
          </div>

          {/* SVG Aging visual representation */}
          <div className="flex flex-col gap-2 mt-2 text-xs">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Volume Allocation</span>
            <div className="h-6 w-full rounded-lg overflow-hidden flex bg-slate-950 border border-slate-800">
              <div style={{ width: `${totalReceivables > 0 ? (current7 / totalReceivables) * 100 : 33}%` }} className="bg-emerald-500 h-full hover:opacity-85 transition-opacity" title="Current"></div>
              <div style={{ width: `${totalReceivables > 0 ? (pending15 / totalReceivables) * 100 : 33}%` }} className="bg-amber-500 h-full hover:opacity-85 transition-opacity" title="Pending"></div>
              <div style={{ width: `${totalReceivables > 0 ? (overdue30 / totalReceivables) * 100 : 34}%` }} className="bg-red-500 h-full hover:opacity-85 transition-opacity animate-pulse" title="Overdue"></div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>● Emerald: 0-7 Days</span>
              <span>● Amber: 8-30 Days</span>
              <span>● Red: 30+ Days Matured</span>
            </div>
          </div>
        </div>

        {/* Client Lifetime Value Leaderboard */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-gold/10">
          <div>
            <h4 className="font-outfit font-extrabold text-white text-sm">Client Lifetime Value (LTV)</h4>
            <p className="text-[10px] text-slate-500">Top B2B wholesale buyers by ledger value</p>
          </div>

          <div className="flex flex-col gap-3 my-4">
            {buyers.map((b, idx) => (
              <div key={b.buyer_id} className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center text-[10px] text-gold font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-white leading-normal">{b.business_name}</span>
                    <span className="text-[9px] text-slate-500">{b.full_name} ({b.city})</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-xs text-gold">₹{b.total_orders_value.toLocaleString()}</span>
                  <p className="text-[9px] text-slate-500">{b.total_orders_count} POs</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. SKU MARGINS AUDIT TABLE */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-gold/15">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
          <div>
            <h4 className="font-outfit font-extrabold text-white text-sm">Product SKU Profitability & Landed Margin Audit</h4>
            <p className="text-[10px] text-slate-500">Breakdown of sourcing landed costs versus wholesale pricing schemes</p>
          </div>
          <span className="text-[10px] font-bold text-gold bg-gold/15 py-1 px-2 border border-gold/20 rounded-md uppercase">
            {totalSKUs} active SKUs
          </span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-xs md:text-sm text-left">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="p-4">SKU Code</th>
                <th className="p-4">Design Print</th>
                <th className="p-4 text-right">Landed Cost</th>
                <th className="p-4 text-right">Wholesale price</th>
                <th className="p-4 text-right">Scheme Price (3% Disc)</th>
                <th className="p-4 text-right">Repeat Price (5% Disc)</th>
                <th className="p-4 text-center">Net Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {products.slice(0, 10).map((p) => {
                const marginColor = p.margin_percent >= 30 ? "text-emerald-400" : p.margin_percent >= 15 ? "text-amber-500" : "text-red-400";
                return (
                  <tr key={p.sku_id} className="hover:bg-slate-900/20 transition-all text-xs text-slate-300">
                    <td className="p-4 font-bold text-white uppercase">{p.sku_id}</td>
                    <td className="p-4 font-semibold text-white">{p.design_name}</td>
                    <td className="p-4 text-right">₹{p.landed_cost}</td>
                    <td className="p-4 text-right font-bold text-gold">₹{p.standard_price}</td>
                    <td className="p-4 text-right text-slate-400">₹{p.scheme_price}</td>
                    <td className="p-4 text-right text-slate-400">₹{p.repeat_price}</td>
                    <td className={`p-4 text-center font-black ${marginColor}`}>{p.margin_percent}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
