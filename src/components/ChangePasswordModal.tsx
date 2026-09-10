import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Dice5,
  Lock,
  Loader2
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { adminService } from '../services/adminService';
import { useAccessibleModal } from '../hooks/useAccessibleModal';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    roleType?: string;
    avatar?: string;
  } | null;
  userType?: 'athlete' | 'prescriber' | 'admin';
  onSuccess?: (newPassword: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userType = 'athlete',
  onSuccess
}) => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-700', text: 'text-slate-500' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Muito Fraca', color: 'bg-rose-500', text: 'text-rose-400' };
    if (score === 2) return { score: 2, label: 'Razoável', color: 'bg-amber-500', text: 'text-amber-400' };
    if (score === 3 || score === 4) return { score: 3, label: 'Boa', color: 'bg-cyan-500', text: 'text-cyan-400' };
    return { score: 4, label: 'Excelente', color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const strength = getPasswordStrength(newPassword);

  const generateRandomPassword = () => {
    soundFx.playClick();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(res);
    setConfirmPassword(res);
    setShowNewPassword(true);
    setShowConfirmPassword(true);
    setErrorMessage(null);
  };

  const handleClose = () => {
    soundFx.playClick();
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPass) {
      soundFx.playAlert();
      setErrorMessage('Informe a nova senha.');
      return;
    }

    if (cleanPass.length < 6) {
      soundFx.playAlert();
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      soundFx.playAlert();
      setErrorMessage('A confirmação de senha não confere com a nova senha.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await adminService.changeMyPassword({
        newPassword: cleanPass,
        userId: currentUser?.id,
        userType: userType as 'athlete' | 'prescriber' | 'admin',
        email: currentUser?.email,
        phone: currentUser?.phone
      });

      if (res.success) {
        soundFx.playSuccess();
        setSuccessMessage('Sua senha foi alterada com sucesso!');
        if (onSuccess) {
          onSuccess(cleanPass);
        }
        setTimeout(() => {
          handleClose();
        }, 1800);
      } else {
        soundFx.playAlert();
        setErrorMessage(res.message || 'Não foi possível alterar a senha. Tente novamente.');
      }
    } catch (err: any) {
      soundFx.playAlert();
      setErrorMessage(err.message || 'Erro inesperado ao processar solicitação.');
    } finally {
      setIsLoading(false);
    }
  };

  const { modalRef } = useAccessibleModal({ isOpen, onClose: handleClose });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" role="presentation">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-title"
          tabIndex={-1}
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-white/20 shadow-2xl p-6 sm:p-7 z-10 my-8 overflow-hidden focus:outline-none"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
                <KeyRound className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <h3 id="change-password-title" className="text-base font-black text-white">Alterar Minha Senha</h3>
                <p className="text-xs text-slate-400">Atualize sua credencial de acesso seguro</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar modal de alteração de senha"
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Preview */}
          {currentUser && (
            <div className="mt-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name || 'Usuário'}
                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/15"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 flex items-center justify-center text-indigo-300 font-bold text-sm">
                  {(currentUser.name || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{currentUser.name || 'Usuário Logado'}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  {currentUser.email || currentUser.phone || 'Acesso Direto'}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                {currentUser.roleType || (userType === 'athlete' ? 'Aluno' : 'Prescritor')}
              </span>
            </div>
          )}

          {/* Messages */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Nova Senha <span className="text-rose-400">*</span></span>
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
                  title="Gerar senha aleatória segura"
                >
                  <Dice5 className="w-3 h-3" />
                  <span>Gerar Senha</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-amber-400 text-white font-mono text-xs outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition"
                  title={showNewPassword ? 'Ocultar' : 'Exibir'}
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Password strength bar */}
              {newPassword && (
                <div className="space-y-1 pt-1">
                  <div className="grid grid-cols-4 gap-1">
                    <div className={`h-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-white/10'}`} />
                    <div className={`h-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-white/10'}`} />
                    <div className={`h-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-white/10'}`} />
                    <div className={`h-1 rounded-full ${strength.score >= 4 ? strength.color : 'bg-white/10'}`} />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Força da senha:</span>
                    <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Confirmar Nova Senha <span className="text-rose-400">*</span></span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-black/40 border text-white font-mono text-xs outline-none transition ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'border-rose-500'
                      : 'border-white/15 focus:border-emerald-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition"
                  title={showConfirmPassword ? 'Ocultar' : 'Exibir'}
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[10px] text-rose-400">As senhas não coincidem.</p>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold transition shadow-lg shadow-amber-500/25 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Salvar Nova Senha</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
