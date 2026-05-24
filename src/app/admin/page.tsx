import { db } from "@/lib/db";
import Link from "next/link";
import {
  ShoppingCart,
  TrendingUp,
  Users,
  AlertTriangle,
  FileText,
  DollarSign,
  Package,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  Layers,
  ChevronRight
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardOverview() {
  // Query live database metrics
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayOrders = await db.salesOrder.findMany({
    where: { order_date: { gte: todayStart } }
  });

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.final_amount, 0);
  
  const allOrders = await db.salesOrder.findMany();
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.final_amount, 0);

  const buyersCount = await db.buyer.count({ where: { account_status: "APPROVED" } });
  const pendingBuyers = await db.buyer.count({ where: { account_status: "PENDING" } });

  const hotLeads = await db.lead.count({ where: { score: { gte: 75 } } });
  const lowStockCount = await db.product.count({ where: { status: "low_stock" } });
  const outOfStockCount = await db.product.count({ where: { qty_available: 0 } });
  
  const overduePayments = await db.salesOrder.count({ where: { payment_status: "overdue" } });
  const pendingDispatch = await db.salesOrder.count({ where: { order_status: "confirmed" } });

  const totalProducts = await db.product.count();
  const availableStockCount = Math.max(0, totalProducts - lowStockCount - outOfStockCount);

  // Top lists
  const topBuyers = await db.buyer.findMany({
    take: 5,
    orderBy: { total_orders_value: "desc" },
    select: {
      full_name: true,
      business_name: true,
      city: true,
      total_orders_value: true,
      score: true
    }
  });

  const topProducts = await db.product.findMany({
    take: 5,
    orderBy: { qty_sold_total: "desc" },
    select: {
      sku_id: true,
      design_name: true,
      qty_sold_total: true,
      standard_price: true,
      qty_available: true
    }
  });

  const kpis = [
    { title: "Today's Orders", val: todayOrders.length, desc: "Awaiting packaging dispatches", icon: <ShoppingCart className="w-4 h-4 text-gold" />, link: "/admin/orders" },
    { title: "Today's Revenue", val: `₹${todayRevenue.toLocaleString()}`, desc: "Direct UPI/Bank transfers", icon: <DollarSign className="w-4 h-4 text-emerald-400" />, link: "/admin/orders" },
    { title: "Active Buyers", val: buyersCount, desc: `${pendingBuyers} verification pending`, icon: <Users className="w-4 h-4 text-blue-400" />, link: "/admin/buyers" },
    { title: "CRM Hot Leads", val: hotLeads, desc: "Awaiting onboarding review", icon: <Sparkles className="w-4 h-4 text-amber-500 fill-current" />, link: "/admin/leads" },
    { title: "Low Stock Items", val: lowStockCount, desc: "Less than 10 pieces left", icon: <AlertTriangle className="w-4 h-4 text-red-400" />, link: "/admin/stock" },
    { title: "Outstanding Collections", val: overduePayments, desc: "Matured invoice balances", icon: <FileText className="w-4 h-4 text-red-500" />, link: "/admin/cashflow" },
    { title: "Pending Shipments", val: pendingDispatch, desc: "Locked warehouse reserves", icon: <Package className="w-4 h-4 text-yellow-400" />, link: "/admin/orders" },
    { title: "Gross B2B Revenue", val: `₹${totalRevenue.toLocaleString()}`, desc: "All-time ledger collections", icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, link: "/admin/cashflow" }
  ];

  return (
    <div className="flex flex-col gap-8 text-left font-sans animate-fade-in">
      
      {/* 1. TOP KPI METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Link
            key={idx}
            href={kpi.link}
            className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-gold/30 hover:bg-slate-900/20 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider leading-none">
                {kpi.title}
              </span>
              <div className="w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center border border-white/5 group-hover:border-gold/20 transition-all">
                {kpi.icon}
              </div>
            </div>
            <div className="mt-4">
              <span className="text-lg md:text-2xl font-black text-white tracking-tight leading-none group-hover:text-gold transition-colors">
                {kpi.val}
              </span>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-normal">{kpi.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* 2. OVERVIEW CHARTS ROW (Linear-style SaaS layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Revenue Line Graph */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col gap-5 border border-white/5">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <div>
              <h4 className="font-outfit font-extrabold text-white text-sm">Monthly Revenue Trend</h4>
              <p className="text-[10px] text-slate-500">Sales performance across 2026 operations</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 py-1 px-2 border border-emerald-500/20 rounded-lg uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" /> +18.4% weekly margin
            </div>
          </div>

          {/* Premium Custom SVG Chart */}
          <div className="relative h-60 w-full mt-4 flex items-end">
            <svg className="w-full h-full" viewBox="0 0 600 220" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4af37" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="50" y1="20" x2="550" y2="20" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
              <line x1="50" y1="70" x2="550" y2="70" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
              <line x1="50" y1="120" x2="550" y2="120" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
              <line x1="50" y1="170" x2="550" y2="170" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />

              {/* Chart Line Path */}
              <path
                d="M 50 170 Q 120 155, 190 125 T 330 95 T 470 55 T 550 45"
                fill="none"
                stroke="#d4af37"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Shaded Area Under Line */}
              <path
                d="M 50 170 Q 120 155, 190 125 T 330 95 T 470 55 T 550 45 L 550 180 L 50 180 Z"
                fill="url(#chartGradient)"
              />
              
              {/* Chart Dots */}
              <circle cx="190" cy="125" r="4.5" fill="#d4af37" stroke="#020617" strokeWidth="2.5" />
              <circle cx="330" cy="95" r="4.5" fill="#d4af37" stroke="#020617" strokeWidth="2.5" />
              <circle cx="470" cy="55" r="4.5" fill="#d4af37" stroke="#020617" strokeWidth="2.5" />
              <circle cx="550" cy="45" r="4.5" fill="#d4af37" stroke="#020617" strokeWidth="2.5" />

              {/* Axes Labels */}
              <text x="50" y="200" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">Jan</text>
              <text x="190" y="200" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">Mar</text>
              <text x="330" y="200" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">May</text>
              <text x="470" y="200" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">Jul</text>
              <text x="550" y="200" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">Current</text>
            </svg>
          </div>
        </div>

        {/* Stock Health Summary Donut */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-white/5">
          <div className="pb-2 border-b border-white/5">
            <h4 className="font-outfit font-extrabold text-white text-sm">Stock Allocation Summary</h4>
            <p className="text-[10px] text-slate-500">Warehouse physical inventory allocations</p>
          </div>

          <div className="relative flex items-center justify-center my-6">
            <svg width="140" height="140" viewBox="0 0 36 36" className="transform -rotate-90">
              {/* Available circle (Green) */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="60 40" strokeDashoffset="0" />
              {/* Low stock circle (Yellow) */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="2.8" strokeDasharray="30 70" strokeDashoffset="-60" />
              {/* Out of Stock (Red) */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="10 90" strokeDashoffset="-90" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-white tracking-tight">{totalProducts}</span>
              <span className="text-[7.5px] uppercase tracking-widest font-extrabold text-slate-500 mt-0.5">Total SKU Designs</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 text-xs font-semibold">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-400">Available Stock</span>
              </div>
              <span className="font-bold text-white">{availableStockCount} designs</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-slate-400">Low Stock (&lt;10 pcs)</span>
              </div>
              <span className="font-bold text-amber-500">{lowStockCount} designs</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-slate-400">Out of Stock</span>
              </div>
              <span className="font-bold text-red-500">{outOfStockCount} designs</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LEADERBOARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top selling SKUs */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 border border-white/5">
          <div className="pb-2 border-b border-white/5">
            <h4 className="font-outfit font-extrabold text-white text-sm">Top Performing Designs</h4>
            <p className="text-[10px] text-slate-500">Best selling ethnic SKUs this operational cycle</p>
          </div>

          <div className="flex flex-col gap-2.5">
            {topProducts.map((p, idx) => (
              <div key={p.sku_id} className="flex justify-between items-center py-2 px-3.5 rounded-xl bg-slate-950/40 border border-slate-900/60 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-lg bg-gold/5 flex items-center justify-center text-[10px] text-gold font-bold border border-gold/15">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-xs text-white leading-normal">{p.design_name}</span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">{p.sku_id}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-xs text-emerald-400">+{p.qty_sold_total} pcs sold</span>
                  <p className="text-[9px] text-slate-500">Rate: ₹{p.standard_price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top buyers */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 border border-white/5">
          <div className="pb-2 border-b border-white/5">
            <h4 className="font-outfit font-extrabold text-white text-sm">Client Lifetime Value (LTV)</h4>
            <p className="text-[10px] text-slate-500">Top B2B wholesale retail shop directory values</p>
          </div>

          <div className="flex flex-col gap-2.5">
            {topBuyers.map((b, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 px-3.5 rounded-xl bg-slate-950/40 border border-slate-900/60 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-lg bg-gold/5 flex items-center justify-center text-[10px] text-gold font-bold border border-gold/15">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-xs text-white leading-normal">{b.business_name}</span>
                    <span className="text-[9px] text-slate-500">{b.full_name} ({b.city})</span>
                  </div>
                </div>
                <div className="text-right font-sans">
                  <span className="font-extrabold text-xs text-gold">₹{b.total_orders_value.toLocaleString()}</span>
                  <p className="text-[9px] text-slate-500">Scorecard: {b.score}/100</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
