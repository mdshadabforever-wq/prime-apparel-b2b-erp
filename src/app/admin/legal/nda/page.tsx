"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, 
  FileSignature, 
  CheckCircle2, 
  Calendar, 
  Terminal, 
  Lock, 
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sparkles
} from "lucide-react";

export default function NdaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signed, setSigned] = useState(false);
  const [ndaDetails, setNdaDetails] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Signature Form States
  const [fullName, setFullName] = useState("");
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Fetch current NDA status
  const checkNdaStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/nda");
      const data = await res.json();
      if (data.signed) {
        setSigned(true);
        setNdaDetails(data.nda);
      }
    } catch (error) {
      console.error("Error checking NDA status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkNdaStatus();
  }, []);

  // Initialize Canvas listeners
  useEffect(() => {
    if (loading || signed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Adjust scale for retina displays
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.strokeStyle = "#F59E0B"; // Gold color
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [loading, signed]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    setErrorMsg("");

    const pos = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    e.preventDefault();
    const pos = getCoordinates(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, 
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim()) {
      setErrorMsg("Please type your full legal name to execute the digital signature.");
      return;
    }

    if (!hasDrawn) {
      setErrorMsg("Please draw your signature in the designated pad area.");
      return;
    }

    if (!agreementChecked) {
      setErrorMsg("You must explicitly check the acknowledgment statement.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/admin/nda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureName: fullName })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign agreement");
      }

      setSigned(true);
      setNdaDetails(data.nda);
      
      // Store in session storage so local gates can easily verify instantly without api roundtrips
      sessionStorage.setItem("prime_nda_signed", "true");
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-300">
        <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <p className="font-outfit text-sm font-semibold tracking-wider uppercase text-slate-400">Loading NDA Security clearance state...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4 px-2 sm:px-6">
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
        <div>
          <span className="text-[10px] text-amber-500 font-extrabold tracking-widest uppercase flex items-center gap-1.5 mb-1.5">
            <Lock className="w-3 h-3" /> Security Gate — Restricted Access
          </span>
          <h1 className="text-2xl sm:text-3xl font-outfit font-black text-white tracking-tight">
            Digital NDA & Security Compliance
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            In compliance with the India Digital Personal Data Protection (DPDP) Act 2023 and CERT-In national cybersecurity regulations, all personnel must execute this agreement to access active ERP data panels.
          </p>
        </div>
        
        {signed && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-1.5 px-3 rounded-full text-xs font-bold font-mono">
            <CheckCircle2 className="w-4 h-4" /> NDA ACTIVE & APPROVED
          </div>
        )}
      </div>

      {signed ? (
        /* SIGNED SUCCESS STATE */
        <div className="bg-slate-900/40 border border-emerald-500/20 backdrop-blur-xl rounded-3xl p-8 text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
          {/* Decorative ambient gradient */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />

          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/5 animate-pulse-glow">
            <FileSignature className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-outfit font-bold text-white mb-2">NDA Signed Successfully</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-8">
            Thank you, your Digital Non-Disclosure and Secure Data Access Agreement has been registered and timestamped in the company compliance registry.
          </p>

          <div className="bg-slate-950/60 rounded-2xl border border-white/5 p-5 text-left mb-8 max-w-md mx-auto">
            <h3 className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-3">Electronic Sign-off Audit Details</h3>
            
            <div className="space-y-2.5 font-mono text-[11px]">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">Signatory:</span>
                <span className="text-slate-200 font-bold">{ndaDetails?.staff_name}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">IP Address:</span>
                <span className="text-slate-300 font-bold">{ndaDetails?.ip_address}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-300">
                  {ndaDetails?.timestamp ? new Date(ndaDetails.timestamp).toLocaleString("en-IN") : "Now"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Policy Scheme:</span>
                <span className="text-amber-500 font-bold">DPDP-CERT-v2026</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push("/admin")}
            className="inline-flex items-center gap-2 bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-white/5"
          >
            Enter ERP Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* NDA READER AND SIGNATURE FORM */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: THE LEGAL DEED */}
          <div className="lg:col-span-7 bg-slate-900/30 border border-white/5 backdrop-blur-xl rounded-3xl p-6 h-[500px] sm:h-[600px] overflow-y-auto flex flex-col gap-6 custom-scrollbar">
            <div>
              <h2 className="text-xs text-amber-500 font-bold tracking-widest uppercase mb-1">Corporate Compliance Policy</h2>
              <h3 className="text-md sm:text-lg font-outfit font-black text-white">
                PRIME APPAREL EXPORTS
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">DOCUMENT REF: PA-NDA-2026-V1</p>
            </div>

            <div className="h-[1px] bg-white/5" />

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-sans text-justify">
              <p className="font-bold text-slate-200">
                Please review this Non-Disclosure and Secure ERP Data Access Policy Agreement. By signing below, you bind yourself to strict professional accountability regarding all data assets of Prime Apparel Exports.
              </p>

              <div>
                <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-wide mb-1">1. Absolute Confidentiality of B2B Directory</h4>
                <p>
                  All client names, WhatsApp numbers, active purchase frequencies, dispatch addresses, transaction ledger histories, credit allowances, and buyer hunting CRM notes represent highly proprietary commercial trade secrets. You are strictly prohibited from copying, photographing, downloading, sharing, or discussing these directories with any external competitor, agent, or third party under any circumstances.
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-wide mb-1">2. Zero-Tolerance Data Scraping Ban</h4>
                <p>
                  Any automated or manual scraping, database exportation, screen recording, screenshotting, or mass-downloading of buyer files or stock ledger inventories without explicit written authorization from the Board of Directors is strictly banned. Violating this will trigger immediate termination of service and civil liability for damages.
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-wide mb-1">3. Cybersecurity & Access Control</h4>
                <p>
                  You agree to secure your credentials. Sharing of passwords, active session tokens, API keys, or logging in on unsecured, public terminals is strictly prohibited. You must immediately lock your terminal screen when leaving your desk, and report any unauthorized access attempts, session hijackings, or potential network threats within <strong>6 hours</strong> in accordance with CERT-In incident protocols.
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-wide mb-1">4. Legal Liability & Prosecutive Action</h4>
                <p>
                  Prime Apparel Exports takes data protection with ultimate seriousness. Any deliberate leakage, sale of buyer information, trade secret exposure, or data breach resulting from gross negligence will lead to:
                </p>
                <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-400">
                  <li>Immediate termination of employment/vendor service with cause.</li>
                  <li>Filing of criminal complaints under Sections 43, 66, and 72 of the India Information Technology (IT) Act, 2000.</li>
                  <li>Prosecution under the Digital Personal Data Protection (DPDP) Act, 2023, where individual operators may face penalty exposures for intentional breaches.</li>
                  <li>Civil lawsuit for damages to recover brand reputation losses.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-wide mb-1">5. Governing Law & Jurisdiction</h4>
                <p>
                  This agreement is governed by the laws of India. Any legal dispute, breach claim, or contractual action arising from this policy shall be subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra.
                </p>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-white/5 text-[9px] text-slate-500 text-center">
              Prime Apparel Exports © 2026. All rights reserved. Registered under B2B Digital Security Regulations.
            </div>
          </div>

          {/* RIGHT: THE SIGNATURE INTERFACE */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* ALERT BOX */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-amber-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5">MANDATORY COMPLIANCE RECORD</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Your signing IP address, browser footprint, and time stamps will be permanently recorded in the immutable compliance audit logs.
                </p>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="bg-slate-900/20 border border-white/5 rounded-3xl p-6 flex flex-col gap-5 relative overflow-hidden">
              <div>
                <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Digital Execution Panel</h3>
                <p className="text-[11px] text-slate-500">Provide legal validation to unlock active CRM metrics.</p>
              </div>

              {/* Legal Name Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Full Legal Name</label>
                <input
                  type="text"
                  placeholder="Type your official full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Draw Pad Canvas */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Draw Signature</label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[9px] text-slate-500 hover:text-white font-mono bg-slate-950 border border-white/5 py-0.5 px-2 rounded-md transition-colors"
                  >
                    Clear Canvas
                  </button>
                </div>
                
                <div className="h-32 bg-slate-950 border border-white/10 rounded-xl relative overflow-hidden group cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full block touch-none"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-600 gap-1">
                      <FileSignature className="w-5 h-5 opacity-40" />
                      <span className="text-[9px] uppercase tracking-widest opacity-60">Draw signature here</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Disclaimer Statement Text */}
              <div className="bg-slate-950/60 rounded-xl border border-white/5 p-3 text-[10px] text-slate-400 leading-normal flex gap-2.5 items-start">
                <input
                  type="checkbox"
                  id="agreement_check"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-white/10 bg-slate-950 accent-amber-500 cursor-pointer"
                />
                <label htmlFor="agreement_check" className="cursor-pointer">
                  I, <strong className="text-slate-200">{fullName || "[Name]"}</strong>, hereby acknowledge that I have read the complete Corporate Data Protection & Access Policy. I accept full personal legal responsibility for preserving B2B trade secrets and certify that my digital signature is legally binding.
                </label>
              </div>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-[10px] flex gap-2 items-center">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !agreementChecked || !fullName.trim() || !hasDrawn}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-white/5 disabled:shadow-none text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/5 hover:shadow-amber-500/10 flex justify-center items-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Validating Signature Logs...
                  </>
                ) : (
                  <>
                    <FileSignature className="w-3.5 h-3.5" />
                    Sign NDA & Access ERP Data
                  </>
                )}
              </button>

            </form>
          </div>

        </div>
      )}

    </div>
  );
}
