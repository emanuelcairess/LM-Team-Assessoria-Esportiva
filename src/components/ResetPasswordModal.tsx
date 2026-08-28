import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  X,
  User,
  ShieldAlert,
  Crown,
  Phone
} from 'lucide-react';
import { AthleteProfile, PrescriberProfile } from '../types';
import { soundFx } from '../utils/audio';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: string;
    name: string;
    phone?: string;
    roleLabel: string;
    type: 'athlete' | 'prescriber';
    isAdmin?: boolean;
    isMaster?: boolean;
    currentPassword?: string;
  } | null;
  currentUser: PrescriberProfile;
  onConfirmReset: (userId: string, newPassword: string, requiresChange: boolean, userType: 'athlete' | 'prescriber') => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  onConfirmReset
}) => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !targetUser) return null;

  const isCurrentUserAdmin = Boolean(currentUser.isAdmin);
  const isCurrentUserMaster = Boolean(currentUser.isMaster || currentUser.isAdmin);

  // Security authorization: Master cannot reset Admin
  const isBlocked = !isCurrentUserAdmin && targetUser.isAdmin;

  const generateRandomPassword = () => {
    soundFx.playClick();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const prefix = targetUser.type === 'athlete' ? 'Aluno' : 'LM';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += Math.floor(Math.random() * 10).toString();
    }
    const special = '!#@'[Math.floor(Math.random() * 3)];
    const generated = `${prefix}${randomPart}${special}`;
    setNewPassword(generated);
    setErrorMessage(null);
  };

  const handleCopyPassword = () => {
    if (!newPassword) return;
    soundFx.playClick();
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMessage(null);

    if (isBlocked) {
      soundFx.playAlert();
      setErrorMessage('Prescritores Master não possuem permissão para redefinir a senha de um Administrador Geral.');
      return;
    }

    if (!newPassword.trim() || newPassword.length < 5) {
      soundFx.playAlert();
      setErrorMessage('A nova senha deve ter no mínimo 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      soundFx.playSuccess();
      setIsSubmitting(false);
      onConfirmReset(targetUser.id, newPassword.trim(), requiresPasswordChange, targetUser.type);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md rounded-3xl liquid-glass border border-white/20 p-6 sm:p-7 shadow-2xl relative overflow-hidden bg-slate-900/95 z-10 text-slate-100"
      >
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-600/15 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-900/40 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-violet-400">
                {isCurrentUserAdmin ? 'Administrador Geral' : 'Prescritor Master'}
              </span>
              <h3 className="text-lg font-black text-white leading-tight">
                Resetar Senha de Acesso
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target User Info Card */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-medium">Usuário Selecionado:</p>
            <p className="text-sm font-bold text-white truncate">{targetUser.name}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{targetUser.phone || 'Sem telefone registrado'}</p>
          </div>
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0">
            {targetUser.roleLabel}
          </span>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {isBlocked ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-200">
              <ShieldAlert className="w-4 h-4" />
              <span>Ação Restrita</span>
            </div>
            <p>
              Apenas o próprio Administrador Geral ou outro Administrador possui permissão para redefinir as credenciais de um perfil com status de Administrador.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-violet-400" />
                  <span>Nova Senha de Acesso</span>
                </label>

                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[11px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Gerar Senha Segura</span>
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4 text-violet-400/80" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Digite ou gere uma nova senha"
                  required
                  className="w-full pl-10 pr-20 py-3 rounded-2xl bg-slate-950/80 border border-white/15 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 text-white font-mono text-sm tracking-wide transition placeholder:text-slate-500 outline-none"
                />

                <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                  {newPassword && (
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                      title="Copiar senha"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setShowPassword(!showPassword);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Checkbox: Exigir alteração no primeiro login */}
            {targetUser.type === 'prescriber' && (
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition">
                <input
                  type="checkbox"
                  checked={requiresPasswordChange}
                  onChange={(e) => setRequiresPasswordChange(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-white/20 text-violet-600 focus:ring-violet-500 focus:ring-offset-slate-900"
                />
                <div className="text-xs text-slate-300 leading-tight">
                  <span className="font-bold text-white block">Exigir troca obrigatória de senha</span>
                  <span className="text-[11px] text-slate-400">
                    O prescritor será obrigado a criar uma nova senha pessoal no próximo login.
                  </span>
                </div>
              </label>
            )}

            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[11px] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-violet-400" />
              <span>
                Esta alteração é persistida diretamente no Firebase Firestore e no armazenamento local seguro da equipe.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !newPassword.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-950/40 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmar e Salvar no Banco</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
