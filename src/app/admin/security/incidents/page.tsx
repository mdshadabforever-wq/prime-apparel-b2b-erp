"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ShieldAlert, 
  Printer, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal, 
  Eye, 
  Clock, 
  Layers, 
  PlusCircle, 
  FileText,
  Flame,
  Send,
  RefreshCw,
  Search,
  BookOpen
} from "lucide-react";

interface Incident {
  id: string;
  timestamp: string;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affectedSystem: string;
  reporter: string;
  description: string;
  status: "CONTAINED" | "INVESTIGATING" | "REPORTED_TO_CERT";
  ipAddress: string;
}

export default function SecurityIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "INC-2026-0042",
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
      category: "Unauthorized API Access",
      severity: "HIGH",
      affectedSystem: "/api/crm/customers/[id]",
      reporter: "Automated WAF Guard",
      description: "Multiple attempts detected to access customer lists from unauthenticated mobile carrier network without session cookie authorization keys.",
      status: "CONTAINED",
      ipAddress: "103.88.22.141"
    },
    {
      id: "INC-2026-0039",
      timestamp: new Date(Date.now() - 3600000 * 28).toISOString(), // 28 hours ago
      category: "Brute-force Blocked",
      severity: "MEDIUM",
      affectedSystem: "/api/auth/login",
      reporter: "Auth Rate Limiter",
      description: "More than 15 sequential failed login attempts detected on staff mobile index (9198256XXXX) inside a 3-minute window. Account locked automatically.",
      status: "CONTAINED",
      ipAddress: "157.44.89.12"
    },
    {
      id: "INC-2026-0031",
      timestamp: new Date(Date.now() - 3600000 * 96).toISOString(), // 4 days ago
      category: "SQL Injection Probe",
      severity: "CRITICAL",
      affectedSystem: "/api/products search parameter",
      reporter: "Prisma Schema Shield",
      description: "WAF intercepted single-quote SQL escape signature query string. Blocked threat actor IP, compiled telemetry logs automatically.",
      status: "REPORTED_TO_CERT",
      ipAddress: "45.128.90.3"
    }
  ]);

  const [activeTab, setActiveTab] = useState<"incidents" | "sop">("incidents");
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Incident Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("API_LEAK");
  const [newSeverity, setNewSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [newSystem, setNewSystem] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newReporter, setNewReporter] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Print references
  const printFrameRef = useRef<HTMLDivElement | null>(null);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription || !newReporter) return;

    setSubmitting(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 1200));

    const item: Incident = {
      id: `INC-2026-0${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      category: newCategory.replace("_", " "),
      severity: newSeverity,
      affectedSystem: newSystem || "ERP Base Network",
      reporter: newReporter,
      description: newDescription,
      status: "INVESTIGATING",
      ipAddress: "127.0.0.1" // Local execution
    };

    setIncidents([item, ...incidents]);
    setSubmitting(false);
    setSubmitSuccess(true);

    // Reset Form
    setNewTitle("");
    setNewSystem("");
    setNewDescription("");
    setNewReporter("");

    setTimeout(() => {
      setSubmitSuccess(false);
      setShowAddForm(false);
    }, 2000);
  };

  const handlePrintSop = () => {
    const printContent = printFrameRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>PRIME APPAREL EXPORTS — CYBERSECURITY INCIDENT SOP</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 40px; color: #000; line-height: 1.6; }
            h1 { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; font-size: 22px; }
            h2 { border-bottom: 1px solid #000; padding-bottom: 5px; font-size: 16px; margin-top: 30px; text-transform: uppercase; }
            .meta { margin-bottom: 30px; font-size: 11px; text-align: right; }
            .section { margin-bottom: 20px; }
            .highlight { background-color: #eee; padding: 10px; border-left: 5px solid #000; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 11px; }
            th { background-color: #f2f2f2; }
            .checklist { list-style-type: none; padding-left: 0; }
            .checklist li { margin-bottom: 10px; }
            .checklist li::before { content: "[ ] "; font-weight: bold; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body onload="window.print();window.close();">
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredIncidents = incidents.filter(
    (inc) =>
      inc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.affectedSystem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const severityColor = (sev: string) => {
    switch (sev) {
      case "CRITICAL": return "text-red-500 bg-red-500/10 border-red-500/30";
      case "HIGH": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "MEDIUM": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      default: return "text-slate-400 bg-slate-400/10 border-white/5";
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "CONTAINED": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "INVESTIGATING": return "text-sky-400 border-sky-500/30 bg-sky-500/10 animate-pulse";
      default: return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-2 px-1 sm:px-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6 mb-8">
        <div>
          <span className="text-[10px] text-red-500 font-extrabold tracking-widest uppercase flex items-center gap-1.5 mb-1.5 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" /> CERT-IN & DPDP DIGITAL COMPLIANCE
          </span>
          <h1 className="text-2xl sm:text-3xl font-outfit font-black text-white tracking-tight">
            Cybersecurity Incident Log
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Audit logging threat signatures, unauthorized API vectors, and printing containment checklists.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("incidents")}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              activeTab === "incidents"
                ? "bg-white text-slate-950 border-white"
                : "bg-slate-900/40 text-slate-400 border-white/5 hover:text-white"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> Active Logs
          </button>
          <button
            onClick={() => setActiveTab("sop")}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              activeTab === "sop"
                ? "bg-white text-slate-950 border-white"
                : "bg-slate-900/40 text-slate-400 border-white/5 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Containment SOP
          </button>
        </div>
      </div>

      {activeTab === "incidents" ? (
        /* INCIDENTS FEED TAB */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT FEED: LIST */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-900/20 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter security events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none transition-colors"
                />
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="w-full sm:w-auto py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Report New Event
              </button>
            </div>

            {/* Event Form Drawer */}
            {showAddForm && (
              <form onSubmit={handleCreateIncident} className="bg-slate-900/40 border border-red-500/20 rounded-3xl p-6 relative overflow-hidden animate-fade-in space-y-4">
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/5 rounded-full filter blur-3xl pointer-events-none" />
                
                <div>
                  <h3 className="text-xs text-red-500 font-extrabold uppercase tracking-wider mb-0.5">Log Cybersecurity Incident</h3>
                  <p className="text-[11px] text-slate-500">Record threat containment vectors under B2B cybersecurity policies.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Event Title</label>
                    <input
                      type="text"
                      placeholder="e.g. CSRF Leak, API Abuse"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reporter Identity</label>
                    <input
                      type="text"
                      placeholder="Your name or automation bot"
                      value={newReporter}
                      onChange={(e) => setNewReporter(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none cursor-pointer"
                    >
                      <option value="API_LEAK">API Data Leakage Attempt</option>
                      <option value="RATE_LIMIT_EXCEEDED">Auth Lockout Probe</option>
                      <option value="INJECTION_ATTACK">SQL/NoSQL Code Injection</option>
                      <option value="SESSION_HIJACK">Session Tampering Probe</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Severity Level</label>
                    <select
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(e.target.value as any)}
                      className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none cursor-pointer"
                    >
                      <option value="LOW">Low Severity</option>
                      <option value="MEDIUM">Medium Severity</option>
                      <option value="HIGH">High Severity</option>
                      <option value="CRITICAL">CRITICAL SEVERITY (CERT-In Mandate)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Affected Route / System Component</label>
                    <input
                      type="text"
                      placeholder="e.g. /api/auth/register or database query lock"
                      value={newSystem}
                      onChange={(e) => setNewSystem(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Detailed Threat Description</label>
                    <textarea
                      placeholder="Provide full description of access payloads, blocked logs, containment measures..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white h-20 focus:border-red-500 focus:outline-none transition-colors resize-none"
                      required
                    />
                  </div>
                </div>

                {submitSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3 text-[10px] flex gap-2 items-center">
                    <CheckCircle2 className="w-4 h-4 animate-bounce" />
                    <span>Incident successfully logged to compliance registry! Refreshing feed.</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="py-2 px-4 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-colors bg-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2 px-5 bg-red-600 hover:bg-red-700 disabled:bg-slate-900 disabled:text-slate-600 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Logging...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Commit Incident Log
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* FEED ITEMS */}
            <div className="space-y-4">
              {filteredIncidents.length === 0 ? (
                <div className="bg-slate-900/10 border border-white/5 rounded-3xl p-8 text-center text-slate-500">
                  <Eye className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs">No cybersecurity incidents matching active filter.</p>
                </div>
              ) : (
                filteredIncidents.map((inc) => (
                  <div key={inc.id} className="bg-slate-900/20 border border-white/5 rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden backdrop-blur-sm group hover:border-red-500/10 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-mono font-bold tracking-tight">{inc.id}</span>
                        <div className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${severityColor(inc.severity)}`}>
                          {inc.severity} Severity
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          {new Date(inc.timestamp).toLocaleString("en-IN")}
                        </span>
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${statusBadge(inc.status)}`}>
                          {inc.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    <div className="h-[1px] bg-white/5" />

                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-white font-outfit">{inc.category}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">{inc.description}</p>
                    </div>

                    <div className="bg-slate-950/40 rounded-xl border border-white/5 p-3 flex flex-wrap gap-4 text-[10px] text-slate-500 font-mono">
                      <div>
                        <span className="text-slate-600">Affected Node:</span>{" "}
                        <span className="text-slate-300 font-bold">{inc.affectedSystem}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Reporter:</span>{" "}
                        <span className="text-slate-300">{inc.reporter}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Source Threat IP:</span>{" "}
                        <span className="text-red-400 font-bold">{inc.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* RIGHT SIDEBAR: ADVISORIES */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Live Security Monitor Card */}
            <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden flex flex-col gap-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full filter blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-xs text-slate-300 font-bold uppercase tracking-wider">System Monitor Guard</h3>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Security systems are performing live scans on all Prisma API database operations, cookies sessions signatures, and JWT payload configurations.
              </p>

              <div className="space-y-2 text-[10px] font-mono">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-500">Database Status:</span>
                  <span className="text-emerald-400 font-bold">SECURED (Postgres)</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-500">Session Expiry Gate:</span>
                  <span className="text-emerald-400 font-bold">ACTIVE (24-Hour)</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-500">DPDP Consent Version:</span>
                  <span className="text-slate-300 font-bold">v2026-06-01</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CERT-In API Sync:</span>
                  <span className="text-amber-500 font-bold">PENDING (Manual Check)</span>
                </div>
              </div>
            </div>

            {/* Quick SOP Printable Reference Card */}
            <div className="bg-gradient-to-br from-amber-500/5 to-red-500/5 border border-amber-500/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col gap-4">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/5">
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-1">Critical 6-Hour Alert</h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  In compliance with the India Computer Emergency Response Team (CERT-In) guidelines, any severe database security incident, active ransomware signature, or SQL breach MUST be reported within <strong>6 hours</strong>.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("sop")}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/5 flex justify-center items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4 text-amber-500" /> Read Containment Checklist
              </button>
            </div>

          </div>

        </div>
      ) : (
        /* STANDARD COMPLIANCE SOP TAB */
        <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
          {/* Ambient light glow decorative */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full filter blur-3xl pointer-events-none" />

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6 mb-6">
            <div>
              <h2 className="text-xs text-amber-500 font-bold tracking-widest uppercase mb-1">Standard Operating Procedure</h2>
              <h3 className="text-md sm:text-lg font-outfit font-black text-white">CERT-In & DPDP Cyber Incident Management</h3>
            </div>
            
            <button
              onClick={handlePrintSop}
              className="py-2.5 px-5 bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-white/5"
            >
              <Printer className="w-4 h-4" /> Print Containment SOP Sheet
            </button>
          </div>

          {/* PRINT ELEMENT CONTROLLER CONTAINER */}
          <div ref={printFrameRef} className="space-y-6 text-xs text-slate-300 leading-relaxed font-sans max-w-4xl">
            
            <div className="highlight border-l-4 border-amber-500 bg-amber-500/5 p-4 rounded-xl text-slate-300">
              <strong>MANDATORY DIRECTIVE:</strong> Under CERT-In cyber-incident mandate, all system administrators must trigger these containment controls immediately upon identifying unauthorized access, malicious queries attempts, or data breaches.
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white font-outfit uppercase tracking-wider text-amber-500">1. Stage 1: Identification & Logging</h4>
              <p>
                Document the threat actor footprint. Verify SQL parameter exploits, sessions hijacking attempts, or unauthenticated database API dumps.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li>Check backend application console or cloud telemetry logs.</li>
                <li>Record source IP addresses, browser user-agents, and exact API parameters query.</li>
                <li>Verify database engine DLL locks or server access failures.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white font-outfit uppercase tracking-wider text-amber-500">2. Stage 2: Rapid Containment Checklist</h4>
              <p>
                Implement rapid containment blocks. Do NOT perform code deployments before isolating active threat environments.
              </p>
              
              {/* PRINT CHECKLIST MOCK */}
              <div className="bg-slate-950/60 rounded-2xl border border-white/5 p-5 space-y-3 text-[11px] font-mono text-slate-400">
                <div className="flex gap-3 items-start border-b border-white/5 pb-2">
                  <input type="checkbox" id="c1" className="mt-0.5 pointer-events-none" />
                  <label htmlFor="c1"><strong className="text-slate-300">[1] Block Threat Source IP:</strong> Apply firewall or WAF filter blocks to block the malicious source IP address immediately.</label>
                </div>
                <div className="flex gap-3 items-start border-b border-white/5 pb-2">
                  <input type="checkbox" id="c2" className="mt-0.5 pointer-events-none" />
                  <label htmlFor="c2"><strong className="text-slate-300">[2] Kill Active User Sessions:</strong> Flush session stores or update the `UserSession` table set `is_active = false` to force absolute re-authentication.</label>
                </div>
                <div className="flex gap-3 items-start border-b border-white/5 pb-2">
                  <input type="checkbox" id="c3" className="mt-0.5 pointer-events-none" />
                  <label htmlFor="c3"><strong className="text-slate-300">[3] Backup Database Logs:</strong> Execute full static SQLite/Neon Postgres backup files before restarting process instances.</label>
                </div>
                <div className="flex gap-3 items-start">
                  <input type="checkbox" id="c4" className="mt-0.5 pointer-events-none" />
                  <label htmlFor="c4"><strong className="text-slate-300">[4] Reset Access Secrets:</strong> Revoke and regenerate active JWT_SECRET and databases access tokens across production environment variables.</label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white font-outfit uppercase tracking-wider text-amber-500">3. Stage 3: Mandatory CERT-In Incident Reporting</h4>
              <p>
                Under statutory rules, critical data leaks must be reported immediately using the national CERT-In reporting portal or emailing <strong>incident@cert-in.org.in</strong> within the strict 6-hour window.
              </p>
              
              <table className="min-w-full text-slate-400 font-mono text-[10px] mt-2">
                <thead>
                  <tr className="border-b border-white/10 text-slate-300 text-left">
                    <th className="py-2 pr-4 font-bold uppercase">Required Information Field</th>
                    <th className="py-2 font-bold uppercase">Incident Reporting Detail Format</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4 font-bold text-slate-300">1. System Type Affected</td>
                    <td className="py-2">B2B Next.js ERP Onboarding & CRM Pipeline</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4 font-bold text-slate-300">2. Type of Attack</td>
                    <td className="py-2">Unauthorized API access / SQL injection probe / Session hijacking</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4 font-bold text-slate-300">3. Compromised IP Addresses</td>
                    <td className="py-2">Log threat actors IP details compiled from WAF telemetry logs</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-bold text-slate-300">4. Recovery Timeline</td>
                    <td className="py-2">Immediate IP containment, DB session flush completed within 30 minutes</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
