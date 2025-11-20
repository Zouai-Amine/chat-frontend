import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastItemProps {
  toast: ToastData;
  onClose: (id: string) => void;
  index: number;
}

const ToastItem = ({ toast, onClose, index }: ToastItemProps) => {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 5000;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 16);

    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [toast.id, duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
    error: <XCircle className="w-5 h-5 flex-shrink-0" />,
    info: <Info className="w-5 h-5 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
  };

  const config = {
    success: {
      bg: "bg-gradient-to-r from-emerald-500/95 to-green-500/95",
      icon: "text-white",
      text: "text-white",
      progress: "bg-white/30",
    },
    error: {
      bg: "bg-gradient-to-r from-rose-500/95 to-red-500/95",
      icon: "text-white",
      text: "text-white",
      progress: "bg-white/30",
    },
    info: {
      bg: "bg-gradient-to-r from-blue-500/95 to-indigo-500/95",
      icon: "text-white",
      text: "text-white",
      progress: "bg-white/30",
    },
    warning: {
      bg: "bg-gradient-to-r from-amber-500/95 to-orange-500/95",
      icon: "text-white",
      text: "text-white",
      progress: "bg-white/30",
    },
  };

  const style = config[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.9, x: "-50%" }}
      animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
      exit={{ opacity: 0, x: "100%", scale: 0.8 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      style={{ top: `${24 + index * 80}px` }}
      className={`fixed left-1/2 z-[100] ${style.bg} backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden min-w-[360px] max-w-md`}
    >
      <div className="flex items-start gap-3 px-5 py-4">
        <div className={style.icon}>{icons[toast.type]}</div>
        <p className={`flex-1 text-sm font-medium leading-relaxed ${style.text}`}>
          {toast.message}
        </p>
        <button
          onClick={() => onClose(toast.id)}
          className="p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
      {/* Progress Bar */}
      <div className="h-1 bg-black/10">
        <motion.div
          className={style.progress}
          initial={{ width: "100%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

export const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
  return (
    <AnimatePresence mode="sync">
      {toasts.map((toast, index) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} index={index} />
      ))}
    </AnimatePresence>
  );
};
