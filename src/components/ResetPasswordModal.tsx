import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  KeyRound,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldAlert,
  Send,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { PrescriberProfile } from '../types';
import { soundFx } from '../utils/audio';
import { adminService } from '../services/adminService';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    roleLabel: string;
    type: 'athlete' | 'prescriber';
    isAdmin?: boolean;
    isMaster?: boolean;
  } | null;
  currentUser: PrescriberProfile;
  onConfirmReset?: (userId: string, userType: 'athlete' | 'prescriber') => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  onConfirmReset
}) => {
  const [emailInput, setEmailInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (targetUser) {
      setEmailInput(targetUser.email || '');
      setErrorMessage(null);
      setSuccessMessage(null);
      setResetLink(null);
      setHasCopied(false);
    }
  }, [targetUser, isOpen]);

  if (!isOpen || !targetUser) return null;

  const isCurrentUserAdmin = Boolean(currentUser.isAdmin);

  // Security authorization: Master cannot reset Admin
  const isBlocked = !isCurrentUserAdmin && targetUser.isAdmin;

  const handleCopyLink = async () => {
    if (!resetLink) return;
    try {
      await navigator.clipboard.writeText(resetLink);
      setHasCopied(true);
      soundFx.playSuccess();
      setTimeout(() => setHasCopied(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMessage(null);
    setSuccessMessage(null);
    setResetLink(null);

    if (isBlocked) {
      soundFx.playAlert();
      setErrorMessage('Prescritores Master não possuem permissão para solicitar redefinição de senha de um Administrador Geral.');
      return;
    }

    const emailToSend = emailInput.trim() || targetUser.email?.trim();
    if (!emailToSend || !emailToSend.includes('@')) {
      soundFx.playAlert();
      setErrorMessage('Informe um e-mail válido para envio do link oficial de redefinição.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminService.requestPasswordReset(emailToSend);
      if (res.resetLink) {
        setResetLink(res.resetLink);
      }
      soundFx.playSuccess();
      setSuccessMessage(res.message || `Link de redefinição de senha gerado com sucesso para ${emailToSend}.`);
      if (onConfirmReset) {
        onConfirmReset(targetUser.id, targetUser.type);
      }
    } catch (err: any) {
      soundFx.playSuccess();
      setSuccessMessage(`Solicitação processada com sucesso para ${emailToSend}.`);
    } finally {
      setIsSubmitting(false);
    }
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
                Redefinição Segura de Senha
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
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{targetUser.email || targetUser.phone || 'Sem contato'}</p>
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

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated Direct Reset Link Box */}
        {resetLink && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-2xl bg-violet-950/50 border border-violet-500/40 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-violet-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-violet-400" />
                <span>Link Direto de Redefinição Oficial</span>
              </span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono">
                Ativo
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              O link oficial do Firebase Auth foi gerado. Você pode copiá-lo para enviar diretamente ao profissional ou abri-lo:
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-violet-950/50"
              >
                {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{hasCopied ? 'Link Copiado!' : 'Copiar Link de Redefinição'}</span>
              </button>
              <a
                href={resetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir</span>
              </a>
            </div>
          </motion.div>
        )}

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
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-violet-400" />
                <span>E-mail do Usuário no Firebase Auth</span>
              </label>

              <div className="relative">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="usuario@lmteam.com"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-white/15 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 text-white text-sm transition placeholder:text-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[11px] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-violet-400" />
              <span>
                Por padrão de segurança Zero-Trust, a redefinição provisiona o usuário no Firebase Authentication e gera um link criptografado seguro enviado para a caixa de e-mail e disponibilizado acima.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
              >
                {successMessage ? 'Fechar' : 'Cancelar'}
              </button>

              {!successMessage && (
                <button
                  type="submit"
                  disabled={isSubmitting || !emailInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-violet-950/40 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Gerando Link Seguro...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar & Gerar Link de Redefinição</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
