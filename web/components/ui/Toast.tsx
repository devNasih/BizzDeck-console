"use client";

import { useEffect } from "react";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";

type ToastProps = {
  message: string;
  onClose: () => void;
  duration?: number;
  type?: "success" | "error";
};

export function Toast({ message, onClose, duration = 4000, type = "error" }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div
      className={`fixed right-5 top-5 z-[200] flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
        isSuccess
          ? "border-emerald-500/20 bg-emerald-950/85 text-emerald-200"
          : "border-red-500/20 bg-red-950/85 text-red-200"
      }`}
      role="alert"
    >
      {isSuccess ? (
        <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
      ) : (
        <AlertCircle size={18} className="shrink-0 text-red-400" />
      )}
      <div className="flex-1 font-medium leading-tight">{message}</div>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className={`shrink-0 rounded-lg p-1 transition duration-200 hover:bg-white/10 ${
          isSuccess ? "text-emerald-400/70 hover:text-white" : "text-red-400/70 hover:text-white"
        }`}
      >
        <X size={14} />
      </button>
    </div>
  );
}
