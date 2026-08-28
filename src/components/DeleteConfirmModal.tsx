import React from 'react';
import { motion } from 'motion/react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { AthleteProfile } from '../types';
import { soundFx } from '../utils/audio';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  athlete: AthleteProfile | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  athlete,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !athlete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md rounded-3xl modal-liquid-glass border border-rose-500/30 p-6 shadow-2xl space-y-5 z-10"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400">
                Ação Irreversível
              </span>
              <h3 className="text-lg font-black text-white leading-tight">
                Excluir Aluno do Time?
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 text-xs">
          <div className="flex items-center gap-3">
            <img
              src={athlete.avatar}
              alt={athlete.name}
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/20"
            />
            <div>
              <h4 className="font-bold text-white text-sm">{athlete.name}</h4>
              <p className="text-slate-400 text-[11px]">
                CPF: {athlete.cpf || 'Não informado'} • {athlete.phone}
              </p>
            </div>
          </div>
          <p className="text-slate-300 text-[11px] pt-2 border-t border-white/10">
            Você está prestes a remover permanentemente o registro clínico, histórico antropométrico e protocolos deste aluno.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              soundFx.playAlert();
              onConfirm();
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirmar Exclusão</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
