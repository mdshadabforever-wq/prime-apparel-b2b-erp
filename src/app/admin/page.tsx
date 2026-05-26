import { db } from "@/lib/db";
import Link from "next/link";
import { cookies } from "next/headers";
import { Tooltip } from "@/components/ui/Tooltip";
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
  ChevronRight,
  Activity,
  ClipboardList,
  Eye,
  Camera,
  Share2,
  PhoneCall,
  Truck,
  Settings,
  MapPin,
  CheckCircle,
  Clock,
  Briefcase,
  MessageSquare
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardOverview() {
  const cookieStore = cookies();
  const activeRole = cookieStore.get("prime_admin_test_role")?.value || "FOUNDER";

  // -------------------------------------------------------------------------
  // A. FETCH CORE SYSTEM DATA (FOR KPIS & LOGS)
  // -------------------------------------------------------------------------
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
  const totalProducts = await db.product.count();

  const overduePayments = await db.salesOrder.count({ where: { payment_status: "overdue" } });
  const pendingDispatch = await db.salesOrder.count({ where: { order_status: "confirmed" } });

  // Load role-specific notifications from DB
  const roleNotifications = await db.notification.findMany({
    where: { for_role: activeRole },
    orderBy: { created_at: "desc" },
    take: 5
  });

  // Load recent audit logs
  const auditLogs = await db.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 4
  });

  // -------------------------------------------------------------------------
  // B. DYNAMIC OVERVIEWS AND KPIS DEFINITIONS BY DEPARTMENTS (12 ROLES)
  // -------------------------------------------------------------------------
  let departmentTitle = "Founder & Executive Dashboard";
  let departmentSub = "Prime Apparel B2B Global Garment Distribution OS";
  let kpis = [];
  let tasks = [];
  let actions = [];

  switch (activeRole) {
    case "PURCHASE":
      departmentTitle = "Sourcing & Purchase Department";
      departmentSub = "Mill procurement and raw supply chains";
      kpis = [
        { title: "Active Suppliers", val: 2, desc: "Surat and Jaipur cluster mills", icon: <Users className="w-4 h-4 text-emerald-400" /> },
        { title: "Total Catalog Designs", val: totalProducts, desc: "Ready ethnic SKUs in database", icon: <Package className="w-4 h-4 text-gold" /> },
        { title: "Low Stock Alert Items", val: lowStockCount, desc: "Pending procurement orders", icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
        { title: "Landed cost Avg", val: "₹290", desc: "Purchase cost + freight + overhead", icon: <DollarSign className="w-4 h-4 text-blue-400" /> }
      ];
      tasks = [
        "Verify standard Rayon kurti rates with Surat Fabrics",
        "Negotiate written terms agreement with Arihant Suits",
        "Log purchase order for PA-25-SS-002 low stock fulfillment"
      ];
      actions = [
        { name: "Create Purchase Order", path: "/admin/stock" },
        { name: "Manage Supplier List", path: "/admin/stock" }
      ];
      break;

    case "INVENTORY":
      departmentTitle = "QC & Warehouse Inventory Dashboard";
      departmentSub = "Physical stock logs, grading, and reserves checks";
      kpis = [
        { title: "Low Stock Items", val: lowStockCount, desc: "Re-order boundaries crossed", icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
        { title: "Out of Stock", val: outOfStockCount, desc: "Zero active pieces available", icon: <AlertTriangle className="w-4 h-4 text-red-500 font-bold" /> },
        { title: "Total In Stock", val: totalProducts - outOfStockCount, desc: "Ready to reserve designs", icon: <Package className="w-4 h-4 text-emerald-400" /> },
        { title: "Pending QC Checks", val: "1 Batch", desc: "Awaiting physical review", icon: <CheckCircle className="w-4 h-4 text-yellow-400" /> }
      ];
      tasks = [
        "Inspect Meera Jaipuri Rayon kurti stitching batch",
        "Perform rack count audit for Indigo Gharara set",
        "Log damaged QC pieces inside warehouse notes"
      ];
      actions = [
        { name: "Inspect SKU Stock Levels", path: "/admin/stock" },
        { name: "Run QC Audit Log", path: "/admin/stock" }
      ];
      break;

    case "PRICING":
      departmentTitle = "Pricing Control Department";
      departmentSub = "Costing analysis, margin optimization, and price locks";
      kpis = [
        { title: "Avg Margin Percent", val: "28.1%", desc: "Direct manufacturing markup", icon: <TrendingUp className="w-4 h-4 text-emerald-400" /> },
        { title: "Scheme Pricing active", val: "All SKUs", desc: "Wholesale tier discounts", icon: <DollarSign className="w-4 h-4 text-gold" /> },
        { title: "Lowest Priced SKU", val: "₹290", desc: "Summer Floral Cotton A-Line", icon: <Package className="w-4 h-4 text-blue-400" /> },
        { title: "Highest Priced SKU", val: "₹550", desc: "Maharani Georgette Anarkali", icon: <Sparkles className="w-4 h-4 text-amber-500" /> }
      ];
      tasks = [
        "Audit Meera Jaipuri Rayon landed cost markup (28.57%)",
        "Set special volume scheme price rules for 50+ bulk buyers",
        "Check freight surcharge impacts on daily kurti sets margins"
      ];
      actions = [
        { name: "Manage SKU Prices", path: "/admin/stock" },
        { name: "Margin Analytics", path: "/admin" }
      ];
      break;

    case "CONTENT":
      departmentTitle = "Content & Catalog Department";
      departmentSub = "Media production, image uploads, and description edits";
      kpis = [
        { title: "Photographed SKUs", val: "100%", desc: "Images uploaded in DB catalog", icon: <Camera className="w-4 h-4 text-blue-400" /> },
        { title: "Video Previews", val: "1 SKU", desc: "W3C standard mp4 attached", icon: <Eye className="w-4 h-4 text-gold" /> },
        { title: "Catalog Status", val: "Active", desc: "Guest price locks unlocked", icon: <Sparkles className="w-4 h-4 text-emerald-400" /> },
        { title: "Pending Uploads", val: "0 SKUs", desc: "Zero photo/video backlog", icon: <Package className="w-4 h-4 text-slate-500" /> }
      ];
      tasks = [
        "Record 15-second opening-unboxing preview for Maharani suit set",
        "Write optimized premium cotton cambric description tags",
        "Review photo upload file compression sizes for Vercel loading speed"
      ];
      actions = [
        { name: "Upload Photo/Video Assets", path: "/admin/stock" },
        { name: "WhatsApp Sandbox Simulator", path: "/admin/whatsapp" }
      ];
      break;

    case "MARKETING":
      departmentTitle = "Marketing & Campaigns Dashboard";
      departmentSub = "Social listings, campaign performance, and buyer outreach";
      kpis = [
        { title: "Campaign Reach", val: "15k B2B Hubs", desc: "Instagram and Facebook channels", icon: <Share2 className="w-4 h-4 text-blue-400" /> },
        { title: "Hot CRM Leads", val: hotLeads, desc: "Onboarding leads registered", icon: <Sparkles className="w-4 h-4 text-amber-400 fill-current" /> },
        { title: "Connected Channels", val: "WhatsApp Cloud", desc: "Autoreply FAQ systems active", icon: <MessageSquare className="w-4 h-4 text-emerald-400" /> },
        { title: "B2B Active Buyers", val: buyersCount, desc: "Approved retail shop lifetime directory", icon: <Users className="w-4 h-4 text-gold" /> }
      ];
      tasks = [
        "Analyze Instagram ad lead conversion scores (Targeting > 75)",
        "Schedule bulk WhatsApp announcement for Maharani Festive Suit stock",
        "Setup Facebook Pixel retargeting for unregistered catalog guest users"
      ];
      actions = [
        { name: "Manage CRM Leads Board", path: "/admin/leads" },
        { name: "Configure B2B Ad Campaign", path: "/admin/whatsapp" }
      ];
      break;

    case "BUYER_HUNTING":
      departmentTitle = "Buyer Hunting CRM Panel";
      departmentSub = "Cold leads acquisition, scraping, and initial scoring";
      kpis = [
        { title: "Acquisition Target", val: "50 Leads/week", desc: "Wholesale buyer scraping", icon: <Briefcase className="w-4 h-4 text-blue-400" /> },
        { title: "CRM Hot Leads", val: hotLeads, desc: "Calculated lead score > 75", icon: <Sparkles className="w-4 h-4 text-gold fill-current" /> },
        { title: "Pending Onboarding", val: pendingBuyers, desc: "Unverified lead registrations", icon: <Clock className="w-4 h-4 text-yellow-400" /> },
        { title: "Active Scrapes", val: "Delhi/Mumbai", desc: "Local directory market boards", icon: <Layers className="w-4 h-4 text-slate-500" /> }
      ];
      tasks = [
        "Initiate outreach phone call with Karan Boutique (Score 65)",
        "Scrape Lajpat Nagar market retail listings for ethnic boutiques",
        "Verify lead scorecard metrics and location validation bounds"
      ];
      actions = [
        { name: "Capture New Lead", path: "/admin/leads" },
        { name: "WhatsApp Lead Chatroom", path: "/admin/whatsapp" }
      ];
      break;

    case "SALES":
      departmentTitle = "Sales & Follow-Up Agent Workspace";
      departmentSub = "B2B orders processing, buyer relations, and CRM outreach";
      kpis = [
        { title: "Today's Orders", val: todayOrders.length, desc: "Manual logged + B2B Checkout", icon: <ShoppingCart className="w-4 h-4 text-gold" /> },
        { title: "Active Approved Buyers", val: buyersCount, desc: "B2B retail shops directory", icon: <Users className="w-4 h-4 text-blue-400" /> },
        { title: "Hot Onboarding Leads", val: hotLeads, desc: "Awaiting B2B registrations", icon: <Sparkles className="w-4 h-4 text-amber-500 fill-current" /> },
        { title: "Total Orders logged", val: allOrders.length, desc: "All-time Sales Orders ledger", icon: <ClipboardList className="w-4 h-4 text-emerald-400" /> }
      ];
      tasks = [
        "Review Ramesh Sharma Kurtis lead scorecard validation metrics",
        "Log manual order for buyer checkout request",
        "Approve Sneha Boutique checkout terms checkbox agreement overrides"
      ];
      actions = [
        { name: "Add Order (Manual)", path: "/admin/orders" },
        { name: "View Leads Board", path: "/admin/leads" }
      ];
      break;

    case "LOGISTICS":
      departmentTitle = "Logistics & Dispatch Board";
      departmentSub = "AWB shipping generation, transport bookings, and webhook dispatches";
      kpis = [
        { title: "Pending Dispatches", val: pendingDispatch, desc: "Awaiting transport booking AWB", icon: <Package className="w-4 h-4 text-yellow-400" /> },
        { title: "Active Shipments", val: "1 In-Transit", desc: "V-Trans Logistics parcel", icon: <Truck className="w-4 h-4 text-blue-400" /> },
        { title: "Delivered Proof (POD)", val: "1 Consignment", desc: "Shiprocket digital signature synced", icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
        { title: "Total Dispatched", val: "1 order", desc: "All-time warehouse dispatches", icon: <ClipboardList className="w-4 h-4 text-slate-500" /> }
      ];
      tasks = [
        "Generate AWB shipment tracking number for confirmed packaging",
        "Scan and enter Lorry Receipt (LR) number for V-Trans carrier",
        "Trigger simulation webhook to verify automatic POD confirmation"
      ];
      actions = [
        { name: "Inspect Sales Orders", path: "/admin/orders" },
        { name: "Review Product Stock Reserves", path: "/admin/stock" }
      ];
      break;

    case "ACCOUNTS":
      departmentTitle = "Accounts Ledger Panel";
      departmentSub = "Cash flows, pro-rata invoice splits, and outstanding credit locks";
      kpis = [
        { title: "Today's Ledger Income", val: `₹${todayRevenue.toLocaleString()}`, desc: "Direct invoice cash receipts", icon: <DollarSign className="w-4 h-4 text-emerald-400" /> },
        { title: "Total B2B Revenue", val: `₹${totalRevenue.toLocaleString()}`, desc: "Lifetime cash collections", icon: <TrendingUp className="w-4 h-4 text-emerald-500" /> },
        { title: "Overdue Collections", val: overduePayments, desc: "Active credit locking threshold warning", icon: <FileText className="w-4 h-4 text-red-500" /> },
        { title: "Buyer Credit Limits", val: "₹50,000 max", desc: "Sneha Garments limits", icon: <Users className="w-4 h-4 text-blue-400" /> }
      ];
      tasks = [
        "Audit pro-rata split divisions (9, 8, 8 pieces) for remainder logic",
        "Re-trigger overdue collections cron maturation script check",
        "Log manual expenses for freight cost per piece values"
      ];
      actions = [
        { name: "Log Cashflow Ledger Entry", path: "/admin/cashflow" },
        { name: "Print GST Tax Invoice", path: "/admin/orders" }
      ];
      break;

    case "TECHNICAL":
      departmentTitle = "Technical Automation Panel";
      departmentSub = "System health, API webhooks logs, and server performance";
      kpis = [
        { title: "Database Engine", val: "PostgreSQL Ready", desc: "Verified parallel schema compiles", icon: <Settings className="w-4 h-4 text-blue-400" /> },
        { title: "Server Status", val: "Healthy", desc: "Vercel + Next.js Edge runtime", icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
        { title: "Active Cron Checks", val: "1 Active", desc: "Overdue collections checking", icon: <Clock className="w-4 h-4 text-gold" /> },
        { title: "API webhooks", val: "Shiprocket Sandbox", desc: "Mock payload tracking listeners", icon: <Activity className="w-4 h-4 text-amber-500" /> }
      ];
      tasks = [
        "Verify PostgreSQL transaction port connection pooling",
        "Audit relational cascading deletes during database sanitization",
        "Test manual route protection override redirection rules"
      ];
      actions = [
        { name: "Run Health Checklist", path: "/admin/whatsapp" },
        { name: "Verify SKU Schema", path: "/admin/stock" }
      ];
      break;

    case "FIELD_BOY":
      departmentTitle = "Field Boy Portal Dashboard";
      departmentSub = "Local client visits, physical deliveries, and cash collection checklists";
      kpis = [
        { title: "Pending Deliveries", val: "0 Tasks", desc: "No active dispatch task assignments", icon: <MapPin className="w-4 h-4 text-red-400" /> },
        { title: "Pending Visits", val: "0 Shops", desc: "Zero boutique scheduled checks", icon: <Users className="w-4 h-4 text-yellow-400" /> },
        { title: "Completed Checks", val: "2 Tasks", desc: "Seeded local task allocations", icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
        { title: "CoD Collections logged", val: "₹0", desc: "Awaiting cargo delivery receipt", icon: <DollarSign className="w-4 h-4 text-slate-500" /> }
      ];
      tasks = [
        "Visit local boutique area shop to confirm physical premises",
        "Deliver invoice printed sheet copy to Bandra Cargo Hub consignee",
        "Collect CoD cash balance from completed local shipments"
      ];
      actions = [
        { name: "View Active Deliveries List", path: "/admin/orders" },
        { name: "Back to Main Site", path: "/" }
      ];
      break;

    default: // FOUNDER / ADMIN
      departmentTitle = "Founder & Executive Dashboard";
      departmentSub = "Prime Apparel B2B Global Garment Distribution OS";
      kpis = [
        { title: "Today's Orders", val: todayOrders.length, desc: "Awaiting packaging dispatches", icon: <ShoppingCart className="w-4 h-4 text-gold" />, link: "/admin/orders" },
        { title: "Today's Revenue", val: `₹${todayRevenue.toLocaleString()}`, desc: "Direct UPI/Bank transfers", icon: <DollarSign className="w-4 h-4 text-emerald-400" />, link: "/admin/orders" },
        { title: "Active Buyers", val: buyersCount, desc: `${pendingBuyers} verification pending`, icon: <Users className="w-4 h-4 text-blue-400" />, link: "/admin/buyers" },
        { title: "CRM Hot Leads", val: hotLeads, desc: "Awaiting onboarding review", icon: <Sparkles className="w-4 h-4 text-amber-500 fill-current" />, link: "/admin/leads" },
        { title: "Low Stock Items", val: lowStockCount, desc: "Less than 10 pieces left", icon: <AlertTriangle className="w-4 h-4 text-red-400" />, link: "/admin/stock" },
        { title: "Outstanding Collections", val: overduePayments, desc: "Matured invoice balances", icon: <FileText className="w-4 h-4 text-red-500" />, link: "/admin/cashflow" },
        { title: "Pending Shipments", val: pendingDispatch, desc: "Locked warehouse reserves", icon: <Package className="w-4 h-4 text-yellow-400" />, link: "/admin/orders" },
        { title: "Gross B2B Revenue", val: `₹${totalRevenue.toLocaleString()}`, desc: "All-time ledger collections", icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, link: "/admin/cashflow" }
      ];
      tasks = [
        "Review pro-rata pro-div parameters for remainder inventory allocations",
        "Enforce strict credit-lock triggers for mature overdue buyer accounts",
        "Monitor Shiprocket tracking webhooks status and signature sync logs"
      ];
      actions = [
        { name: "Create Sales Order (Manual)", path: "/admin/orders" },
        { name: "Add B2B Buyer Profile", path: "/admin/buyers" }
      ];
  }

  return (
    <div className="flex flex-col gap-8 text-left font-sans animate-fade-in">
      
      {/* HEADER CORNER NOTICE */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-r from-gold/5 via-transparent to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9px] font-black uppercase text-gold tracking-widest leading-none bg-gold/10 py-1 px-2.5 rounded-full border border-gold/20">
            {activeRole} PANEL ACTIVE
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mt-2.5">
            {departmentTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{departmentSub}</p>
        </div>
        <div className="flex items-center gap-2">
          {actions.map((act) => {
            const getActionTooltip = (name: string) => {
              const n = name.toLowerCase();
              if (n.includes("purchase order")) return "Generate new procurement requests for fabric mills.";
              if (n.includes("supplier")) return "View verified direct Surat and Jaipur textile mill profiles.";
              if (n.includes("inspect sku") || n.includes("stock levels")) return "Check physical warehouse bins, grading, and reserved stocks.";
              if (n.includes("qc audit")) return "Log fabric quality parameters and check for stitching defects.";
              if (n.includes("sku prices") || n.includes("manage sku")) return "Recalculate cost sheets and set standard, scheme, and repeat rates.";
              if (n.includes("margin")) return "Compare direct factory landed cost markups and profit margins.";
              if (n.includes("photo/video") || n.includes("media")) return "Upload model catalog photoshoots and unboxing preview clips.";
              if (n.includes("whatsapp sandbox") || n.includes("lead chatroom")) return "Open chatbot simulation panels and test FAQ responses.";
              if (n.includes("crm leads") || n.includes("leads board")) return "View and qualify warm buyers scored by business profiling.";
              if (n.includes("ad campaign") || n.includes("campaign")) return "Track marketing reach and broadcast announcements via WhatsApp.";
              if (n.includes("capture new") || n.includes("create lead")) return "Manually enter cold market directories and retail listings.";
              if (n.includes("manual") || n.includes("sales order")) return "Log bulk phone call orders with automatic inventory reservations.";
              if (n.includes("cashflow") || n.includes("ledger")) return "Record cash disbursements, transport freight, rent, or sales income.";
              if (n.includes("invoice")) return "Open fallback printable B2B Tax invoice splits or B2C masks.";
              if (n.includes("health")) return "Audit database connection pooling and Shiprocket logistics health.";
              if (n.includes("deliveries") || n.includes("field boy")) return "Inspect cargo packages ready for local field agent delivery.";
              return "Open specific department operational workspace window.";
            };

            return (
              <Tooltip key={act.name} content={getActionTooltip(act.name)} position="bottom">
                <Link
                  href={act.path}
                  className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white border border-white/5 hover:border-gold/30 transition-all shadow-md active:scale-95"
                >
                  {act.name}
                </Link>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* 1. TOP KPI METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const getKpiTooltip = (title: string, desc: string) => {
            const lowTitle = title.toLowerCase();
            if (lowTitle.includes("today's orders") || lowTitle.includes("open orders")) {
              return "Orders logged today from B2B buyer checkouts or logged manually by staff.";
            }
            if (lowTitle.includes("today's revenue") || lowTitle.includes("today's ledger income")) {
              return "Direct payments received via UPI, bank transfers, or CoD collections today.";
            }
            if (lowTitle.includes("active buyers") || lowTitle.includes("active approved buyers")) {
              return "Wholesale retail boutique buyers in active credit standing and approved by Founder.";
            }
            if (lowTitle.includes("crm hot leads") || lowTitle.includes("hot onboarding leads")) {
              return "High-intent buyer quality score above 75/100, based on business profiling.";
            }
            if (lowTitle.includes("low stock")) {
              return "Product inventory counts which have fallen below our safety buffer limit (< 10 pieces).";
            }
            if (lowTitle.includes("outstanding") || lowTitle.includes("overdue")) {
              return "Unpaid mature invoice balances past their due dates, triggering credit locks.";
            }
            if (lowTitle.includes("pending shipments") || lowTitle.includes("pending dispatches")) {
              return "Confirmed sales orders packaged and awaiting logistics carrier booking dispatches.";
            }
            if (lowTitle.includes("gross b2b revenue") || lowTitle.includes("total b2b revenue")) {
              return "All-time accumulated ledger payments cleared from B2B wholesale transactions.";
            }
            if (lowTitle.includes("active suppliers")) {
              return "Verified manufacturing mills direct from Surat and Jaipur garment clusters.";
            }
            if (lowTitle.includes("total catalog designs")) {
              return "Unique SKU design models active in our B2B catalog directory.";
            }
            if (lowTitle.includes("landed cost avg")) {
              return "Average factory purchase cost plus freight and packaging overhead per piece.";
            }
            if (lowTitle.includes("out of stock")) {
              return "Products with zero physical inventory left in our warehouse.";
            }
            if (lowTitle.includes("avg margin percent")) {
              return "Targeted markup margin percentage calculated between landed cost and standard B2B rate.";
            }
            if (lowTitle.includes("campaign reach")) {
              return "Estimated social media impressions and reach across targeted boutique buyers.";
            }
            if (lowTitle.includes("delivered proof") || lowTitle.includes("completed checks")) {
              return "Consignment delivery confirmation slips with digital buyer signature logs.";
            }
            return desc || "Operational branch metric tracking real-time ERP business parameters.";
          };

          return (
            <Tooltip key={idx} content={getKpiTooltip(kpi.title, kpi.desc)} position="top">
              <div
                className="glass-panel p-5 rounded-2xl flex flex-col justify-between border border-white/5 hover:border-gold/20 transition-all relative overflow-hidden group h-full"
              >
                <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider leading-none">
                    {kpi.title}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center border border-white/5">
                    {kpi.icon}
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-lg md:text-2xl font-black text-white tracking-tight leading-none group-hover:text-gold transition-colors">
                    {kpi.val}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-normal">{kpi.desc}</p>
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* 2. DYNAMIC WORKSPACE BODY ROWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Segmented Notifications & Tasks */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Targeted Handoff Notifications Hub */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
            <div className="pb-2 border-b border-white/5 flex justify-between items-center">
              <div>
                <h4 className="font-outfit font-extrabold text-white text-sm">Inter-Department Tasks & Alerts</h4>
                <p className="text-[10px] text-slate-500">Live operational alerts routed for your role</p>
              </div>
              <span className="text-[9px] bg-gold/10 text-gold font-bold py-0.5 px-2 rounded-full border border-gold/25">
                {roleNotifications.length} Alert{roleNotifications.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {roleNotifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 font-semibold border border-dashed border-white/5 rounded-xl">
                  ✨ No active alert dispatches in your inbox queue.
                </div>
              ) : (
                roleNotifications.map((notif) => (
                  <div
                    key={notif.notification_id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-900/60 hover:border-gold/10 transition-colors text-left"
                  >
                    <div className="w-5 h-5 rounded-lg bg-gold/5 border border-gold/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-gold" />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-grow">
                      <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-slate-500">
                        <span className="uppercase tracking-wider font-extrabold text-gold">{notif.type.replace("_", " ")}</span>
                        <span>{new Date(notif.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Department Pending Tasklist */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
            <div className="pb-2 border-b border-white/5">
              <h4 className="font-outfit font-extrabold text-white text-sm">Action Item Checklist</h4>
              <p className="text-[10px] text-slate-500">Pending tasks required to complete operational handoffs</p>
            </div>
            
            <div className="flex flex-col gap-2.5">
              {tasks.map((task, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-950/40 border border-slate-900/60 hover:border-white/5 transition-colors text-left"
                >
                  <div className="w-5.5 h-5.5 rounded-lg bg-slate-900 flex items-center justify-center font-bold text-xs text-gold border border-white/5 shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-xs font-semibold text-slate-300 leading-normal">
                    {task}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Recent System Logs & Actions */}
        <div className="flex flex-col gap-6">
          
          {/* Unified Activity Log Trail */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-4 flex-grow">
            <div className="pb-2 border-b border-white/5 flex justify-between items-center">
              <div>
                <h4 className="font-outfit font-extrabold text-white text-sm">Audit Activity logs</h4>
                <p className="text-[10px] text-slate-500">System-wide operational actions tracker</p>
              </div>
              <Activity className="w-4 h-4 text-gold shrink-0 animate-pulse" />
            </div>

            <div className="flex flex-col gap-3 relative pl-4 border-l border-white/5 ml-2 py-1 flex-grow">
              {auditLogs.map((log) => (
                <div key={log.log_id} className="relative group text-left">
                  {/* Pin Dot indicator */}
                  <span className="absolute -left-[20px] top-1.5 w-2 h-2 rounded-full bg-gold border border-slate-950 shadow-md group-hover:bg-white transition-colors"></span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wide">
                      {log.action.replace("WORKFLOW_", "").replace("_STAGE_CHANGE", " UPDATE")}
                    </span>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      {log.description.length > 80 ? log.description.slice(0, 80) + "..." : log.description}
                    </p>
                    <span className="text-[8px] text-slate-600 font-mono mt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString()} | Operator: {log.user_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
