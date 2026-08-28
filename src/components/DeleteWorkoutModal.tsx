import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Trash2, X, Dumbbell } from 'lucide-react';
import { WorkoutSplit } from '../types';
import { soundFx } from '../utils/audio';

interface DeleteWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  split: WorkoutSplit | null;
}

export const DeleteWorkoutModal: React.FC<DeleteWorkoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  split
}) => {
  if (!isOpen || !split) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md rounded-3xl modal-liquid-glass border border-rose-500/30 shadow-2xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/30 text-rose-400 border border-rose-500/40 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black text-white">Excluir Dia de Treino?</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Você está prestes a remover o <strong className="text-rose-400">{split.code} — {split.name}</strong> ({split.dayOfWeek}) com {split.exercises.length} exercícios cadastrados.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
          <Dumbbell className="w-5 h-5 text-orange-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-white">{split.name}</p>
            <p className="text-slate-400 text-[11px]">{split.dayOfWeek} • {split.exercises.length} exercícios</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition border border-white/10"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 flex items-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirmar Exclusão</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
