import React from 'react';

interface CenteredModalProps {
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  children: React.ReactNode;
}

export const CenteredModal: React.FC<CenteredModalProps> = ({
  title = 'Information',
  onConfirm,
  onCancel,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  children,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onCancel}></div>
      <div className="bg-slate-900 border border-white/5 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 animate-scale-up font-sans">
        <header className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
          <h2 className="text-sm font-black text-white tracking-wider uppercase flex items-center gap-2">{title}</h2>
          <button onClick={onCancel} className="text-slate-500 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
        <footer className="flex justify-end gap-2.5 p-4 border-t border-white/5 bg-slate-950/20">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-xl text-xs font-black shadow-lg">
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CenteredModal;
