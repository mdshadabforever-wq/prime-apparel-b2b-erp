import { useState } from "react";
import { X } from "lucide-react";

interface GstVerificationModalProps {
  open: boolean;
  onClose: () => void;
  captchaImage?: string; // base64 data URI
  onSubmitCaptcha: (captcha: string) => void;
  loading: boolean;
  error?: string;
}

export function GstVerificationModal({
  open,
  onClose,
  captchaImage,
  onSubmitCaptcha,
  loading,
  error,
}: GstVerificationModalProps) {
  const [captcha, setCaptcha] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitCaptcha(captcha.trim());
    setCaptcha("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans text-left" data-test-id="gst-captcha-modal">
      {/* Overlay Backdrop */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card Content */}
      <div
        className="bg-slate-900 border border-gold/20 relative z-10 max-w-md w-full rounded-2xl p-6 text-gold shadow-2xl animate-scale-in"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="flex justify-between items-center border-b border-gold/20 pb-3 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">CAPTCHA Verification Required</h2>
          <button onClick={onClose} className="p-1 hover:bg-gold/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-8 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent" />
            <span className="text-[10px] text-slate-500 font-extrabold uppercase">Validating with official portal...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              ⚠️ Official GST search requires captcha entry. Solve the challenge below:
            </p>
            {captchaImage && (
              <div className="flex justify-center bg-white p-2.5 rounded-lg border border-gold/30">
                <img src={captchaImage} alt="CAPTCHA" className="max-h-[60px]" />
              </div>
            )}
            <input
              type="text"
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value)}
              placeholder="Enter 6-character captcha"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-gold placeholder-gold/40 focus:outline-none focus:border-gold text-xs font-semibold uppercase tracking-wider"
              required
            />
            {error && <p className="text-xs text-red-400 font-bold">{error}</p>}
            
            <div className="flex justify-end space-x-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 text-xs font-semibold rounded-lg hover:text-white transition"
              >
                Cancel
              </button>
              <button data-test-id="captcha-submit-button"
                type="submit"
                className="px-4 py-2 bg-gold text-navy font-bold text-xs rounded-lg hover:bg-gold/80 transition"
              >
                Submit Captcha
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
