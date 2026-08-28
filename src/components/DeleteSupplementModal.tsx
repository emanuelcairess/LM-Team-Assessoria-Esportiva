import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Trash2, X, Pill } from 'lucide-react';
import { SupplementItem } from '../types';
import { soundFx } from '../utils/audio';

interface DeleteSupplementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  supplement: SupplementItem | null;
}

export const DeleteSupplementModal: React.FC<DeleteSupplementModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  supplement
}) => {
  if (!isOpen || !supplement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md rounded-3xl liquid-glass border border-rose-500/40 bg-slate-950/95 shadow-2xl shadow-rose-950/70 p-6 overflow-hidden z-10 space-y-5"
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-black text-white">Excluir Protocolo de Suplementação?</h3>
          <p className="text-xs text-slate-300 mt-1">
            Tem certeza de que deseja remover esta fórmula da prescrição clínica do atleta?
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-white">{supplement.name}</span>
          </div>
          <p className="text-[11px] text-slate-400 pl-6">
            {supplement.dosage} • {supplement.schedule}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition border border-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              onConfirm();
            }}
            className="px-5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-950/60"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirmar Exclusão</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
