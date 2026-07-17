import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const Modal = ({ isOpen, onClose, children, title }: ModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/25 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-black/5 bg-white/95 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.18)] backdrop-blur-3xl sm:p-12"
          >
            <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 transition-colors hover:text-slate-800">
              <X size={18} strokeWidth={1.5} />
            </button>

            {title && (
              <h3 className="mb-10 text-2xl font-header font-light uppercase tracking-tight text-slate-900">
                {title}
              </h3>
            )}
            <div className="absolute left-0 top-0 h-px w-full bg-linear-to-r from-transparent via-secondary/20 to-transparent" />
            <div className="relative z-10">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;