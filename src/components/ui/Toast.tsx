import { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  duration?: number; // ms
}

export const Toast = ({ message, duration = 3000 }: ToastProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center bg-slate-800/90 text-slate-200 px-4 py-2 rounded-lg shadow-lg animate-fade-in">
      {message}
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);

  const showToast = (msg: string) => {
    const id = Date.now();
    setToast({ message: msg, id });
  };

  const ToastContainer = () =>
    toast ? <Toast key={toast.id} message={toast.message} /> : null;

  return { showToast, ToastContainer };
};
