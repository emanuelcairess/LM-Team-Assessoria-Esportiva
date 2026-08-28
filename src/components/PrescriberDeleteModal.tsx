import React from 'react';
import { motion } from 'motion/react';
import { Trash2, AlertTriangle, X, ShieldAlert, Crown } from 'lucide-react';
import { PrescriberProfile } from '../types';
import { soundFx } from '../utils/audio';

interface PrescriberDeleteModalProps {
  isOpen: boolean;
  prescriber: PrescriberProfile | null;
  onClose: () => void;
  onConfirm: () => void;
  isCurrentUserAdmin: boolean;
}

export const PrescriberDeleteModal: React.FC<PrescriberDeleteModalProps> = ({
  isOpen,
  prescriber,
  onClose,
  onConfirm,
  isCurrentUserAdmin
}) => {
  if (!isOpen || !prescriber) return null;

  const isTargetAdmin = Boolean(prescriber.isAdmin);
  const isBlocked = isTargetAdmin && !isCurrentUserAdmin;

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
        className={`relative w-full max-w-md rounded-3xl modal-liquid-glass border p-6 shadow-2xl space-y-5 z-10 ${
          isBlocked ? 'border-amber-500/40' : 'border-rose-500/30'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isBlocked
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}
            >
              {isBlocked ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  isBlocked ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {isBlocked ? 'Operação Não Permitida' : 'Ação de Exclusão'}
              </span>
              <h3 className="text-lg font-black text-white leading-tight">
                {isBlocked ? 'Administrador Protegido' : 'Remover Prescritor?'}
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
              src={prescriber.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
              alt={prescriber.name}
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/20"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-white text-sm truncate">{prescriber.name}</h4>
                {prescriber.isAdmin && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                    ADMIN
                  </span>
                )}
                {prescriber.isMaster && !prescriber.isAdmin && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" /> MASTER
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[11px] truncate">
                {prescriber.roleType} • {prescriber.phone}
              </p>
            </div>
          </div>

          {isBlocked ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs mt-2">
              ⚠️ <strong>Regra de Segurança:</strong> Prescritores Master não possuem permissão para excluir ou modificar perfis de Administrador. Apenas outro Administrador pode realizar esta operação.
            </div>
          ) : (
            <p className="text-slate-300 text-[11px] pt-2 border-t border-white/10">
              O prescritor perderá o acesso ao painel de prescrições e gestão de alunos da LM Team Assessoria.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
          >
            {isBlocked ? 'Entendido' : 'Cancelar'}
          </button>
          {!isBlocked && (
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
          )}
        </div>
      </motion.div>
    </div>
  );
};
