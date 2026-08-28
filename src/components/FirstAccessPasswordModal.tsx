import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Crown
} from 'lucide-react';
import { PrescriberProfile } from '../types';
import { soundFx } from '../utils/audio';

interface FirstAccessPasswordModalProps {
  isOpen: boolean;
  prescriber: PrescriberProfile | null;
  onClose: () => void;
  onConfirmNewPassword: (newPassword: string) => void;
}

export const FirstAccessPasswordModal: React.FC<FirstAccessPasswordModalProps> = ({
  isOpen,
  prescriber,
  onClose,
  onConfirmNewPassword
}) => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !prescriber) return null;

  // Calculate password strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Muito Fraca', color: 'bg-slate-700', text: 'text-slate-500' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) || /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score === 1) return { score: 1, label: 'Fraca', color: 'bg-rose-500', text: 'text-rose-400' };
    if (score === 2) return { score: 2, label: 'Regular', color: 'bg-amber-500', text: 'text-amber-400' };
    if (score === 3) return { score: 3, label: 'Boa', color: 'bg-blue-500', text: 'text-blue-400' };
    return { score: 4, label: 'Excelente', color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const strength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      soundFx.playAlert();
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword.toLowerCase() === 'lmteam') {
      soundFx.playAlert();
      setErrorMessage('A nova senha não pode ser a senha temporária inicial ("lmteam"). Defina uma senha exclusiva.');
      return;
    }

    if (newPassword !== confirmPassword) {
      soundFx.playAlert();
      setErrorMessage('A confirmação de senha não coincide com a nova senha digitada.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      soundFx.playSuccess();
      setIsSubmitting(false);
      onConfirmNewPassword(newPassword);
    }, 500);
  };

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
        className="relative w-full max-w-lg rounded-3xl modal-liquid-glass border border-violet-500/40 p-6 sm:p-8 shadow-2xl space-y-6 z-10"
      >
        {/* Header with security badge */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-0.5 shadow-lg shadow-violet-900/40 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-violet-300">
              <KeyRound className="w-6 h-6" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/40 flex items-center gap-1">
                {prescriber.isAdmin ? (
                  <>
                    <ShieldAlert className="w-3 h-3 text-violet-400" />
                    <span>Primeiro Acesso • Administrador</span>
                  </>
                ) : prescriber.isMaster ? (
                  <>
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>Primeiro Acesso • Master</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    <span>Primeiro Acesso • Prescritor</span>
                  </>
                )}
              </span>
            </div>
            <h3 className="text-xl font-black text-white leading-tight">
              Redefinição de Senha Obrigatória
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Por segurança, defina uma nova senha pessoal definitiva para o seu cadastro antes de acessar o sistema.
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3.5">
          <img
            src={prescriber.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
            alt={prescriber.name}
            className="w-11 h-11 rounded-xl object-cover ring-2 ring-violet-500/40 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white truncate">{prescriber.name}</h4>
              <span className="text-[10px] text-violet-300 font-semibold px-2 py-0.2 rounded bg-violet-500/20">
                {prescriber.roleType}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              WhatsApp / ID: {prescriber.phone} • {prescriber.email}
            </p>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-violet-400" />
                <span>Nova Senha de Acesso</span>
              </span>
              <span className={`text-[11px] font-bold ${strength.text}`}>
                Força: {strength.label}
              </span>
            </label>

            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Mínimo 6 caracteres"
                required
                autoFocus
                className="w-full px-4 pr-11 py-3 rounded-2xl bg-slate-900/90 border border-white/15 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 text-white text-sm transition placeholder:text-slate-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength meter bar */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    strength.score >= step ? strength.color : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Confirmar Nova Senha</span>
              </span>
              {confirmPassword.length > 0 && (
                <span
                  className={`text-[10px] font-bold ${
                    passwordsMatch ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {passwordsMatch ? '✓ Senhas coincidem' : '✗ Não coincidem'}
                </span>
              )}
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Repita a nova senha"
                required
                className={`w-full px-4 pr-11 py-3 rounded-2xl bg-slate-900/90 border text-white text-sm transition placeholder:text-slate-500 outline-none ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? 'border-emerald-500/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20'
                      : 'border-rose-500/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-white/15 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Security hints */}
          <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/20 text-[11px] text-violet-200 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span>Regras de Proteção de Conta:</span>
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[10px]">
              <li>Mínimo de 6 dígitos ou caracteres.</li>
              <li>Recomendado mesclar números e letras.</li>
              <li>Esta senha será usada nos seus próximos logins da LM Team.</li>
            </ul>
          </div>

          {/* Submit button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || newPassword.length < 6 || !passwordsMatch}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-xs tracking-wide shadow-xl shadow-violet-950/60 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando Senha...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Nova Senha e Conectar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
