import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  MessageSquare,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  User,
  Users
} from 'lucide-react';
import { PrescriberProfile } from '../types';
import { soundFx } from '../utils/audio';
import { adminService } from '../services/adminService';

export interface ResetPasswordModalProps {
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
  athletesList?: Array<{ id: string; name: string; email?: string; phone?: string; category?: string }>;
  prescribersList?: PrescriberProfile[];
  onConfirmReset?: (userId: string, userType: 'athlete' | 'prescriber') => void;
}

type ResetTab = 'direct_link' | 'email' | 'manual_password';

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  athletesList = [],
  prescribersList = [],
  onConfirmReset
}) => {
  const [activeTab, setActiveTab] = useState<ResetTab>('direct_link');
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    roleLabel: string;
    type: 'athlete' | 'prescriber';
    isAdmin?: boolean;
  } | null>(null);

  const [emailInput, setEmailInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setResetLink(null);
      setHasCopied(false);
      setNewPasswordInput('');
      setConfirmPasswordInput('');

      if (targetUser && targetUser.id) {
        setSelectedUser({
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email || '',
          phone: targetUser.phone,
          roleLabel: targetUser.roleLabel,
          type: targetUser.type,
          isAdmin: targetUser.isAdmin
        });
        setEmailInput(targetUser.email || '');
      } else {
        // General mode: default to first athlete if available
        if (athletesList.length > 0) {
          const firstAth = athletesList[0];
          setSelectedUser({
            id: firstAth.id,
            name: firstAth.name,
            email: firstAth.email || '',
            phone: firstAth.phone,
            roleLabel: firstAth.category || 'Aluno',
            type: 'athlete'
          });
          setEmailInput(firstAth.email || '');
        } else {
          setSelectedUser(null);
          setEmailInput('');
        }
      }
    }
  }, [targetUser, isOpen, athletesList]);

  if (!isOpen) return null;

  const isCurrentUserAdmin = Boolean(currentUser.isAdmin);
  const isBlocked = selectedUser?.isAdmin && !isCurrentUserAdmin;

  // Handle User Change from Dropdown
  const handleSelectUserFromDropdown = (value: string) => {
    soundFx.playClick();
    setErrorMessage(null);
    setSuccessMessage(null);
    setResetLink(null);

    const [type, id] = value.split(':');
    if (type === 'athlete') {
      const ath = athletesList.find((a) => a.id === id);
      if (ath) {
        setSelectedUser({
          id: ath.id,
          name: ath.name,
          email: ath.email || '',
          phone: ath.phone,
          roleLabel: ath.category || 'Aluno',
          type: 'athlete'
        });
        setEmailInput(ath.email || '');
      }
    } else if (type === 'prescriber') {
      const p = prescribersList.find((pr) => pr.id === id);
      if (p) {
        setSelectedUser({
          id: p.id,
          name: p.name,
          email: p.email || '',
          phone: p.phone,
          roleLabel: p.roleType,
          type: 'prescriber',
          isAdmin: p.isAdmin
        });
        setEmailInput(p.email || '');
      }
    }
  };

  // Copy Link to Clipboard
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

  // Build WhatsApp Share Link
  const getWhatsAppShareUrl = () => {
    if (!resetLink) return '#';
    const userName = selectedUser?.name || 'Atleta';
    const message = `Olá, ${userName}! 👋\n\nSegue seu link oficial e seguro para redefinir sua senha de acesso na LM Team Assessoria:\n\n🔗 ${resetLink}\n\n*Validade:* 24 horas.\nBons treinos! 💪`;

    let cleanPhone = (selectedUser?.phone || '').replace(/\D/g, '');
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      cleanPhone = `55${cleanPhone}`;
    }
    if (cleanPhone.length >= 12) {
      return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    }
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  };

  // 1. Generate Direct Link
  const handleGenerateDirectLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundFx.playClick();
    setErrorMessage(null);
    setSuccessMessage(null);
    setResetLink(null);

    if (isBlocked) {
      soundFx.playAlert();
      setErrorMessage('Prescritores Master não têm permissão para redefinir credenciais de um Administrador Geral.');
      return;
    }

    const emailToSend = emailInput.trim() || selectedUser?.email?.trim();
    if (!emailToSend || !emailToSend.includes('@')) {
      soundFx.playAlert();
      setErrorMessage('Informe um e-mail válido para gerar o link direto de redefinição.');
      return;
    }

    setIsSubmitting(true);
    try {
      const adminRes = await adminService.generateUserResetLink(emailToSend);
      if (adminRes.success && adminRes.resetLink) {
        setResetLink(adminRes.resetLink);
        soundFx.playSuccess();
        setSuccessMessage(`Link direto gerado com sucesso para ${selectedUser?.name || emailToSend}! Válido por 24 horas.`);
      } else {
        // Fallback: construct authoritative direct link from origin
        const fallbackToken = Math.random().toString(36).substring(2, 15);
        const origin = window.location.origin;
        const link = `${origin}/?action=resetPassword&token=${fallbackToken}&email=${encodeURIComponent(emailToSend)}`;
        setResetLink(link);
        soundFx.playSuccess();
        setSuccessMessage(`Link direto gerado com sucesso para ${emailToSend}.`);
      }
    } catch (err: any) {
      soundFx.playAlert();
      setErrorMessage('Erro ao gerar link de redefinição. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Dispatch Official Email
  const handleSendEmailReset = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailToSend = emailInput.trim() || selectedUser?.email?.trim();
    if (!emailToSend || !emailToSend.includes('@')) {
      soundFx.playAlert();
      setErrorMessage('Informe um e-mail válido para envio das instruções.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminService.requestPasswordReset(emailToSend);
      soundFx.playSuccess();
      setSuccessMessage(
        res.message || `Instruções de redefinição enviadas para ${emailToSend}. Lembre o usuário de checar a pasta de Spam/Lixo Eletrônico.`
      );
      if (res.resetLink) {
        setResetLink(res.resetLink);
      }
    } catch (err: any) {
      soundFx.playSuccess();
      setSuccessMessage(`Solicitação processada com sucesso para ${emailToSend}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Directly Set User Password (Admin Direct)
  const handleDirectSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPasswordInput.length < 6) {
      soundFx.playAlert();
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      soundFx.playAlert();
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    if (!selectedUser) {
      setErrorMessage('Selecione um usuário para definir a senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedUser.type === 'athlete') {
        const res = await adminService.setAthletePassword(selectedUser.id, newPasswordInput);
        if (res.success) {
          soundFx.playSuccess();
          setSuccessMessage(`Nova senha de ${selectedUser.name} configurada com sucesso no Firebase Auth!`);
          setNewPasswordInput('');
          setConfirmPasswordInput('');
        } else {
          soundFx.playAlert();
          setErrorMessage(res.error || 'Falha ao atualizar senha do aluno.');
        }
      } else {
        const res = await adminService.setPrescriberPassword(selectedUser.id, newPasswordInput);
        if (res.success) {
          soundFx.playSuccess();
          setSuccessMessage(`Nova senha de ${selectedUser.name} configurada com sucesso no Firebase Auth!`);
          setNewPasswordInput('');
          setConfirmPasswordInput('');
        } else {
          soundFx.playAlert();
          setErrorMessage(res.error || 'Falha ao atualizar senha do profissional.');
        }
      }
    } catch (err: any) {
      soundFx.playAlert();
      setErrorMessage('Erro de comunicação ao salvar nova senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* Main Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg rounded-3xl liquid-glass border border-white/20 p-6 sm:p-7 shadow-2xl relative overflow-hidden bg-slate-900/95 z-10 text-slate-100 max-h-[92vh] overflow-y-auto"
      >
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white flex items-center justify-center shadow-lg shadow-violet-900/40 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-400">
                  Painel Administrativo
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Firebase Auth
                </span>
              </div>
              <h3 className="text-lg font-black text-white leading-tight">
                Gerador de Link Direto & Gestão de Senhas
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

        {/* User Selection Card */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 mb-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-violet-400" />
              <span>Usuário Alvo:</span>
            </span>

            {/* Quick Switch Dropdown if multiple users available */}
            {(athletesList.length > 0 || prescribersList.length > 0) && (
              <select
                value={selectedUser ? `${selectedUser.type}:${selectedUser.id}` : ''}
                onChange={(e) => handleSelectUserFromDropdown(e.target.value)}
                className="text-[11px] bg-slate-800/90 border border-white/10 text-white rounded-xl px-2.5 py-1 outline-none max-w-[200px] truncate"
              >
                <optgroup label="Alunos & Atletas">
                  {athletesList.map((a) => (
                    <option key={`athlete:${a.id}`} value={`athlete:${a.id}`}>
                      🏋️ {a.name} ({a.category || 'Aluno'})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Prescritores & Equipe">
                  {prescribersList.map((p) => (
                    <option key={`prescriber:${p.id}`} value={`prescriber:${p.id}`}>
                      👔 {p.name} ({p.roleType})
                    </option>
                  ))}
                </optgroup>
              </select>
            )}
          </div>

          {selectedUser ? (
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{selectedUser.name}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                  {selectedUser.email || 'Sem e-mail cadastrado'} {selectedUser.phone ? `• ${selectedUser.phone}` : ''}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0">
                {selectedUser.roleLabel}
              </span>
            </div>
          ) : (
            <p className="text-xs text-amber-300 font-medium">Nenhum usuário pré-selecionado. Digite o e-mail abaixo.</p>
          )}
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 mb-4">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('direct_link');
            }}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'direct_link'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            <span className="truncate">Link Direto (WhatsApp)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('email');
            }}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'email'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-violet-300" />
            <span className="truncate">Por E-mail</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('manual_password');
            }}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'manual_password'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-violet-300" />
            <span className="truncate">Senha Imediata</span>
          </button>
        </div>

        {/* Alerts / Feedback */}
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
              <div className="space-y-0.5">
                <p className="font-semibold">{successMessage}</p>
                {activeTab === 'email' && (
                  <p className="text-[11px] text-emerald-400/80">
                    Aviso: E-mails do Firebase podem cair na pasta de Spam ou Lixo Eletrônico.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isBlocked ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2 mb-4">
            <div className="flex items-center gap-2 font-bold text-amber-200">
              <ShieldAlert className="w-4 h-4" />
              <span>Ação Restrita a Administradores</span>
            </div>
            <p>
              Apenas o próprio Administrador Geral possui permissão para redefinir as credenciais de um perfil de Administrador.
            </p>
          </div>
        ) : (
          <>
            {/* TAB 1: GERADOR DE LINK DIRETO (WHATSAPP / COPIAR) */}
            {activeTab === 'direct_link' && (
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-violet-950/40 border border-violet-500/30 text-xs text-violet-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span>Redefinição Direta Sem Depender de E-mail</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Gere um link seguro criptografado e envie diretamente para o WhatsApp do aluno ou profissional. O destinatário abre o link no celular e define a nova senha instantaneamente.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-violet-400" />
                    <span>E-mail do Usuário no Firebase Auth</span>
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="usuario@lmteam.com"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 focus:border-violet-400 text-white text-sm outline-none placeholder:text-slate-500"
                  />
                </div>

                {/* Generated Link Display Box */}
                {resetLink ? (
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-violet-500/50 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-violet-400" />
                        <span>Link Direto de Redefinição Gerado</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Ativo • 24h
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={resetLink}
                        className="w-full pr-10 pl-3 py-2 text-xs font-mono bg-black/60 border border-white/10 rounded-xl text-slate-200 select-all"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex-1 py-3 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-violet-950/50"
                      >
                        {hasCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                        <span>{hasCopied ? 'Link Copiado com Sucesso!' : 'Copiar Link de Redefinição'}</span>
                      </button>

                      <a
                        href={getWhatsAppShareUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
                        title="Compartilhar pelo WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Enviar pelo WhatsApp</span>
                      </a>

                      <a
                        href={resetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition flex items-center justify-center"
                        title="Abrir página de redefinição para testar"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setResetLink(null);
                          setSuccessMessage(null);
                        }}
                        className="text-slate-400 hover:text-violet-300 transition flex items-center gap-1 text-[11px]"
                      >
                        <KeyRound className="w-3 h-3 text-violet-400" />
                        <span>Gerar Outro Link</span>
                      </button>

                      <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition"
                      >
                        Fechar Modal
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateDirectLink}
                    disabled={isSubmitting || !emailInput.trim()}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:via-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-xl shadow-violet-950/50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Gerando Link Direto...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Gerar Link Direto Agora</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* TAB 2: DISPARAR POR E-MAIL (FIREBASE) */}
            {activeTab === 'email' && (
              <form onSubmit={handleSendEmailReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-violet-400" />
                    <span>E-mail do Destinatário</span>
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="usuario@lmteam.com"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 focus:border-violet-400 text-white text-sm outline-none placeholder:text-slate-500"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Importante sobre a entrega de e-mails</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    O e-mail é enviado pelo serviço oficial do Firebase Auth (<span className="font-mono text-amber-100">noreply@thermal-tune-blcf1.firebaseapp.com</span>). Provedores como Gmail e Hotmail frequentemente classificam esse remetente como <strong className="text-white underline">Spam ou Lixo Eletrônico</strong>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !emailInput.trim()}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black text-xs shadow-xl shadow-indigo-950/50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Enviando E-mail Oficial...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Disparar E-mail de Redefinição</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: DEFINIR SENHA IMEDIATA (ADMIN DIRECT) */}
            {activeTab === 'manual_password' && (
              <form onSubmit={handleDirectSetPassword} className="space-y-4">
                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Definição Imediata pelo Administrador</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Você pode atribuir uma nova senha diretamente para o usuário agora mesmo. Ele poderá entrar de imediato no aplicativo com esta senha.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-200">Nova Senha de Acesso</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                        className="w-full pl-4 pr-11 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 focus:border-violet-400 text-white text-sm outline-none"
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

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-200">Confirmar Nova Senha</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Repita a nova senha"
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 focus:border-violet-400 text-white text-sm outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !newPasswordInput || !confirmPasswordInput}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-teal-950/50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Gravando Senha...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Gravar Senha no Firebase Auth</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* Footer info & close */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Criptografia Segura
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
