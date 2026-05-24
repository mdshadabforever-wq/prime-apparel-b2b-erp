"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";

export default function WhatsAppWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show widget after 1.5 seconds for premium entry micro-animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Chat Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500 text-white shadow-2xl hover:bg-emerald-600 transition-all duration-300 transform hover:scale-110 active:scale-95 animate-bounce"
          aria-label="Chat with us on WhatsApp"
        >
          <MessageCircle className="w-8 h-8 fill-current" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white items-center justify-center font-bold">1</span>
          </span>
        </button>
      )}

      {/* Floating Chat Box */}
      {isOpen && (
        <div className="w-80 md:w-96 rounded-2xl shadow-2xl border border-emerald-500/20 overflow-hidden bg-slate-900 text-white transform origin-bottom-right transition-all duration-300 scale-100">
          {/* Header */}
          <div className="bg-emerald-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 font-bold text-lg">P</div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-slate-900 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Prime Assistant</h4>
                <p className="text-[11px] text-emerald-100">Typically replies instantly</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-emerald-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conversation Area */}
          <div className="p-4 bg-slate-950 min-h-[120px] flex flex-col justify-end gap-3 text-sm">
            <div className="bg-slate-900 p-3 rounded-2xl rounded-tl-none border border-slate-800 text-slate-300 max-w-[85%]">
              Namaste! 🙏 Ladies ethnic wear wholesale sourcing, QC directly handles from Mumbai. Minimum order 12 pcs.
            </div>
            <div className="bg-slate-900 p-3 rounded-2xl rounded-tl-none border border-slate-800 text-slate-300 max-w-[85%]">
              Aapko kya designs/pricing jaanna hai? Direct message karein!
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 bg-slate-900 flex flex-col gap-2">
            <a
              href="https://wa.me/919999999999?text=Namaste!%20Prime%20Apparel%20Exports%20se%20wholesale%20catalog%20aur%20rates%20ki%20details%20bhejiye."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-center flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              WhatsApp Pe Catalog Maango
            </a>
            <p className="text-[10px] text-center text-slate-500">Wholesale only. Sourced Surat | QC Mumbai</p>
          </div>
        </div>
      )}
    </div>
  );
}
