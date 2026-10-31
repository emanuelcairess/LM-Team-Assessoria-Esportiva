import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { adminService } from '../services/adminService';

interface DirectPasswordResetModalProps {
  token: string;
  email: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const DirectPasswordResetModal: React.FC<DirectPasswordResetModalProps> = ({
  token,
  email,
  onSuccess,
  onClose
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      soundFx.playAlert();
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      soundFx.playAlert();
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminService.resetPasswordWithToken(token, email, newPassword);
      if (res.success) {
        soundFx.playSuccess();
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2200);
      } else {
        soundFx.playAlert();
        setErrorMessage(res.error || 'Falha ao redefinir senha. O link pode ter expirado.');
      }
    } catch (err: any) {
      soundFx.playAlert();
      setErrorMessage('Erro de conexão ao redefinir senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl liquid-glass border border-white/20 p-6 sm:p-7 shadow-2xl relative overflow-hidden bg-slate-900/95 text-slate-100"
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-950/50">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-400">
              LM Team Assessoria
            </span>
            <h3 className="text-lg font-black text-white">Criar Nova Senha</h3>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border border-white/10 mb-5">
          <p className="text-[11px] text-slate-400">Redefinindo acesso para:</p>
          <p className="text-sm font-bold text-white font-mono mt-0.5">{email}</p>
        </div>

        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 mb-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-sm text-white">Senha alterada com sucesso!</p>
                <p className="text-[11px] text-emerald-300/90 mt-0.5">
                  Redirecionando você para a tela de login...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isSuccess && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-violet-400" />
                <span>Nova Senha</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  autoFocus
                  className="w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-950/80 border border-white/15 focus:border-violet-400 text-white text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">Confirmar Nova Senha</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita sua nova senha"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-white/15 focus:border-violet-400 text-white text-sm outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newPassword || !confirmPassword}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-violet-950/50 flex items-center justify-center gap-2 disabled:opacity-50 transition"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Salvando Nova Senha...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirmar Nova Senha</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
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
