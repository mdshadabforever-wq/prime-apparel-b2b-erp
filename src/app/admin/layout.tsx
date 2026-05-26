"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
// Use a namespace import to avoid missing vendor chunk errors.
import * as LucideIcons from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
// Destructure needed icons for readability.
const { LayoutDashboard, ShoppingCart, Users, Package, Layers, CircleDollarSign, MessageSquare, Sparkles, LogOut, ChevronRight, ShieldAlert, ArrowLeft, Menu, X, Keyboard } = LucideIcons;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<string>("FOUNDER");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load testing role from local storage if exists
  useEffect(() => {
    const savedRole = localStorage.getItem("prime_admin_test_role");
    if (savedRole) {
      setActiveRole(savedRole);
      document.cookie = `prime_admin_test_role=${savedRole}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  const handleRoleChange = (role: string) => {
    setActiveRole(role);
    localStorage.setItem("prime_admin_test_role", role);
    document.cookie = `prime_admin_test_role=${role}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { name: "Overview", path: "/admin", icon: <LayoutDashboard className="w-4 h-4" />, roles: ["FOUNDER", "ADMIN", "PRICING", "TECHNICAL"], shortcut: "⌥O", tooltip: "View segmented executive analytics and team KPIs." },
    { name: "Sales Orders", path: "/admin/orders", icon: <ShoppingCart className="w-4 h-4" />, roles: ["FOUNDER", "ADMIN", "PURCHASE", "INVENTORY", "SALES", "LOGISTICS", "ACCOUNTS", "FIELD_BOY"], shortcut: "⌥S", tooltip: "Log manual orders, inspect status dispatches, and trigger pro-rata splits." },
    { name: "B2B Buyers", path: "/admin/buyers", icon: <Users className="w-4 h-4" />, roles: ["FOUNDER", "ADMIN", "MARKETING", "SALES"], shortcut: "⌥B", tooltip: "Onboard wholesale retail boutique buyers and configure credit settings." },
    { name: "Stock & SKU", path: "/admin/stock", icon: <Package className="w-4 h-4" />, roles: ["FOUNDER", "ADMIN", "PURCHASE", "INVENTORY", "PRICING", "CONTENT", "LOGISTICS", "TECHNICAL"], shortcut: "⌥P", tooltip: "Procure fabrics, enter warehouse inventory, and review B2B pricing." },
    { name: "Leads Board", path: "/admin/leads", icon: <Layers className="w-4 h-4" />, roles: ["FOUNDER", "ADMIN", "MARKETING", "BUYER_HUNTING", "SALES"], shortcut: "⌥L", tooltip: "CRM pipeline for Cold to Hot leads acquisition campaigns." },
    { name: "Cash Ledger", path: "/admin/cashflow", icon: <CircleDollarSign className="w-4 h-4" />, roles: ["FOUNDER", "ADMIN", "ACCOUNTS"], shortcut: "⌥C", tooltip: "Income, supplier payouts, and daily operational ledger entries." },
    { name: "WhatsApp Sandbox", path: "/admin/whatsapp", icon: <MessageSquare className="w-4 h-4" />, roles: ["FOUNDER", "ADMIN", "CONTENT", "MARKETING", "BUYER_HUNTING", "SALES", "TECHNICAL"], shortcut: "⌥W", tooltip: "Cloud API automation sandbox chatbot simulators." }
  ];

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        const item = navItems.find(n => n.shortcut.endsWith(e.key.toUpperCase()));
        if (item) {
          e.preventDefault();
          router.push(item.path);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const filteredNav = navItems.filter(
    (item) => activeRole === "FOUNDER" || activeRole === "ADMIN" || item.roles.includes(activeRole)
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-full text-slate-300 bg-slate-950 font-sans overflow-hidden relative">
      
      {/* MOBILE HEADER BAR */}
      <header className="md:hidden h-14 border-b border-white/5 bg-slate-900/60 backdrop-blur-md px-4 flex justify-between items-center z-40 shrink-0">
        <Link href="/" className="flex items-center gap-1.5 text-white font-extrabold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-gold" />
          <span>PRIME ERP</span>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </header>

      {/* FLOATING SIDEBAR (Desktop) */}
      <aside className="hidden md:flex w-64 bg-slate-900/40 border-r border-white/5 flex-col justify-between h-full p-4 shrink-0 relative z-30">
        <div className="flex flex-col gap-8">
          {/* Logo block */}
          <div className="p-4 flex flex-col gap-1 border-b border-white/5">
            <Link href="/" className="flex items-center gap-1.5 group text-white font-black text-sm tracking-tight uppercase">
              <Sparkles className="w-4.5 h-4.5 text-gold animate-pulse-glow" />
              <span>PRIME ERP</span>
            </Link>
            <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">Wholesale Operating OS</span>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1">
            {filteredNav.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Tooltip key={item.path} content={item.tooltip} position="right">
                  <Link
                    href={item.path}
                    className={`flex items-center justify-between py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-white text-slate-950 shadow-lg shadow-white/5 font-bold"
                        : "hover:bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[8px] px-1 py-0.5 rounded border font-mono ${
                        isActive ? "border-slate-300 text-slate-900 bg-slate-100" : "border-slate-850 text-slate-600 bg-slate-950/40"
                      }`}>
                        {item.shortcut}
                      </span>
                      <ChevronRight className={`w-3 h-3 transition-transform ${isActive ? "rotate-90 text-slate-950" : "text-slate-700"}`} />
                    </div>
                  </Link>
                </Tooltip>
              );
            })}
          </nav>
        </div>

        {/* Footer actions inside Sidebar */}
        <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
          <Link
            href="/"
            className="flex items-center gap-2 text-[10px] font-bold hover:text-white text-slate-500 py-1.5 px-3 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gold" /> Back to Main Site
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 py-2 px-3 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 border border-red-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* MOBILE MENU OVERLAY SHEET */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-slate-950/95 backdrop-blur-md z-30 flex flex-col justify-between p-6 animate-fade-in font-sans">
          <nav className="flex flex-col gap-2 text-left">
            {filteredNav.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    isActive ? "bg-white text-slate-950 font-bold" : "bg-slate-900/50 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 rounded-xl text-xs font-bold text-slate-400"
            >
              <ArrowLeft className="w-4 h-4 text-gold" /> Main landing page
            </Link>
            <button
              onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
              className="w-full py-3 px-4 rounded-xl border border-red-500/20 text-red-400 text-xs font-bold text-center"
            >
              Logout Session
            </button>
          </div>
        </div>
      )}

      {/* MAIN VIEW SYSTEM CONTAINER */}
      <div className="flex-grow flex flex-col overflow-hidden h-full">
        {/* Header Bar */}
        <header className="h-16 border-b border-white/5 bg-slate-900/20 px-6 flex justify-between items-center shrink-0">
          <h3 className="font-outfit font-extrabold text-white text-sm tracking-tight uppercase">
            {navItems.find((n) => n.path === pathname)?.name || "ERP Workspace"}
          </h3>

          {/* PERMISSIONS SWITCHER */}
          <div className="flex items-center gap-2 bg-slate-900/40 py-1 px-2.5 rounded-xl border border-white/5 max-w-[200px] sm:max-w-none">
            <span className="hidden sm:inline text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              Simulation:
            </span>
            <Tooltip content="Swap between 12 operational branches to simulate full-stack departmental access." position="bottom">
              <select
                value={activeRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="bg-slate-950 border border-slate-850 text-[10px] text-gold font-black rounded-lg py-1 px-2 outline-none cursor-pointer"
              >
                <option value="FOUNDER">Founder Dashboard</option>
                <option value="ADMIN">Admin Dashboard</option>
                <option value="PURCHASE">Purchase Department</option>
                <option value="INVENTORY">QC & Inventory</option>
                <option value="PRICING">Pricing Specialist</option>
                <option value="CONTENT">Content & Catalog</option>
                <option value="MARKETING">Marketing & Socials</option>
                <option value="BUYER_HUNTING">Buyer Hunting CRM</option>
                <option value="SALES">Sales Agent Panel</option>
                <option value="LOGISTICS">Logistics Dispatch</option>
                <option value="ACCOUNTS">Accounts Ledger</option>
                <option value="TECHNICAL">Technical Automation</option>
                <option value="FIELD_BOY">Field Boy Tasklist</option>
              </select>
            </Tooltip>
          </div>
        </header>

        {/* Dynamic Content Frame */}
        <div className="flex-grow overflow-y-auto p-4 md:p-8 bg-slate-950/20 relative">
          {children}
        </div>
      </div>
    </div>
  );
}
