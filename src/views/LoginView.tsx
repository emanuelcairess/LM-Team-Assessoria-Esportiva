import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  User,
  ShieldAlert,
  KeyRound,
  Sun,
  Moon,
  Send,
  HelpCircle,
  X,
  Sparkles,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { AthleteProfile, PrescriberProfile } from '../types';
import { soundFx } from '../utils/audio';
import {
  auth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from '../lib/firebase';
import { adminService } from '../services/adminService';

interface LoginViewProps {
  athletesList: AthleteProfile[];
  prescribersList: PrescriberProfile[];
  onLoginSuccess: (athlete: AthleteProfile, firebaseUid?: string) => void;
  onPrescriberLoginSuccess: (prescriber: PrescriberProfile, firebaseUid?: string) => void;
  onUpdatePrescriberPassword?: (prescriberId: string, newPassword: string) => void;
  onEnterAsCoach?: () => void;
  onOpenInstallApp?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

type PortalArea = 'athlete' | 'prescriber';
type PrescriberAuthMode = 'login' | 'forgot_password';

export const LoginView: React.FC<LoginViewProps> = ({
  athletesList,
  prescribersList,
  onLoginSuccess,
  onPrescriberLoginSuccess,
  onOpenInstallApp,
  theme = 'dark',
  onToggleTheme
}) => {
  // Primary portal area: Aluno vs Prescritor & Admin
  const [portalArea, setPortalArea] = useState<PortalArea>('athlete');

  // Prescriber submode
  const [prescriberAuthMode, setPrescriberAuthMode] = useState<PrescriberAuthMode>('login');

  // Prescriber form fields (Email + Senha)
  const [prescriberEmail, setPrescriberEmail] = useState<string>('');
  const [prescriberPassword, setPrescriberPassword] = useState<string>('');
  const [showPrescriberPassword, setShowPrescriberPassword] = useState<boolean>(false);

  // Athlete form fields (Telefone + Senha do Prescritor)
  const [athletePhone, setAthletePhone] = useState<string>('');
  const [athletePassword, setAthletePassword] = useState<string>('');
  const [showAthletePassword, setShowAthletePassword] = useState<boolean>(false);

  // Status & Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatedResetLink, setGeneratedResetLink] = useState<string | null>(null);
  const [hasCopiedLink, setHasCopiedLink] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Phone number mask: (99) 99999-9999
  const formatPhoneNumber = (value: string): string => {
    const cleanDigits = value.replace(/\D/g, '').slice(0, 11);
    if (cleanDigits.length === 0) return '';
    if (cleanDigits.length <= 2) return `(${cleanDigits}`;
    if (cleanDigits.length <= 7) return `(${cleanDigits.slice(0, 2)}) ${cleanDigits.slice(2)}`;
    return `(${cleanDigits.slice(0, 2)}) ${cleanDigits.slice(2, 7)}-${cleanDigits.slice(7, 11)}`;
  };

  // Helper: Find or map matching prescriber domain profile
  const resolvePrescriberProfile = (email: string, uid: string): PrescriberProfile => {
    const matched = prescribersList.find(
      (p) => p.email.toLowerCase() === email.toLowerCase() || p.firebaseUid === uid
    );
    if (matched) {
      return { ...matched, firebaseUid: uid };
    }
    return {
      id: `presc-${uid.slice(0, 8)}`,
      name: email.split('@')[0],
      roleType: 'Prescritor',
      phone: '',
      birthDate: '1990-01-01',
      email: email,
      firebaseUid: uid,
      isMaster: false,
      isAdmin: email.toLowerCase() === 'emanuelcairess@gmail.com',
      status: 'Ativo'
    };
  };

  // ============================================================================
  // 1. ATLETA: LOGIN EXCLUSIVO VIA TELEFONE + SENHA GERADA PELO PRESCRITOR
  // ============================================================================
  const handleAthleteLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanInputPhone = athletePhone.replace(/\D/g, '');
    if (cleanInputPhone.length < 8) {
      soundFx.playAlert();
      setErrorMessage('Informe um número de telefone com DDD válido no formato (99) 99999-9999.');
      return;
    }

    if (!athletePassword.trim()) {
      soundFx.playAlert();
      setErrorMessage('Informe sua senha de acesso gerada pelo seu treinador/prescritor.');
      return;
    }

    setIsAuthenticating(true);

    try {
      // 1. Attempt authoritative backend athlete authentication
      const res = await adminService.athleteLogin(cleanInputPhone, athletePassword.trim());
      if (res.success && res.athlete) {
        soundFx.playSuccess();
        onLoginSuccess(res.athlete);
        return;
      }

      // If backend explicitly returned an error (e.g. inactive account, wrong password)
      if (res.error && !res.error.includes('conexão') && !res.error.includes('offline')) {
        soundFx.playAlert();
        setErrorMessage(res.error);
        return;
      }

      // 2. Client-side fallback matching against synchronized athletesList
      const matched = athletesList.find((ath) => {
        const athPhoneDigits = (ath.phone || '').replace(/\D/g, '');
        if (athPhoneDigits === cleanInputPhone) return true;
        if (cleanInputPhone.length >= 8 && athPhoneDigits.endsWith(cleanInputPhone.slice(-8))) return true;
        if (ath.id.toLowerCase() === athletePhone.toLowerCase().trim()) return true;
        return false;
      });

      if (!matched) {
        soundFx.playAlert();
        setErrorMessage('Nenhum aluno encontrado com este número de telefone. Solicite seu cadastro ao seu treinador/prescritor.');
        return;
      }

      if (matched.status === 'Inativo') {
        soundFx.playAlert();
        setErrorMessage('Sua conta de aluno está inativa. Entre em contato com seu treinador/prescritor para reativar seu plano.');
        return;
      }

      // Check password registered by coach/admin
      if (!matched.password) {
        soundFx.playAlert();
        setErrorMessage('Nenhuma senha foi cadastrada para este aluno. Solicite a criação da sua senha de acesso ao seu treinador.');
        return;
      }

      if (athletePassword.trim() !== matched.password) {
        soundFx.playAlert();
        setErrorMessage('Senha incorreta. Solicite a senha de acesso ao seu treinador ou nutricionista.');
        return;
      }

      soundFx.playSuccess();
      onLoginSuccess(matched);
    } catch (err: any) {
      soundFx.playAlert();
      setErrorMessage('Erro ao autenticar. Verifique seus dados ou contate seu prescritor.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // ============================================================================
  // 2. PRESCRITOR / ADMIN: LOGIN COM EMAIL E SENHA (FIREBASE AUTH + RESILIENT BACKEND & LOCAL FALLBACK)
  // ============================================================================
  const handlePrescriberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = prescriberEmail.toLowerCase().trim();
    const password = prescriberPassword;

    if (!email || !email.includes('@')) {
      soundFx.playAlert();
      setErrorMessage('Informe um endereço de e-mail corporativo válido.');
      return;
    }

    if (!password) {
      soundFx.playAlert();
      setErrorMessage('Informe a senha de acesso da sua conta.');
      return;
    }

    setIsAuthenticating(true);

    try {
      // 1. Primary Authentication: Official Firebase Authentication Client
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        soundFx.playSuccess();
        const profile = resolvePrescriberProfile(user.email || email, user.uid);
        onPrescriberLoginSuccess(profile, user.uid);
        return;
      } catch (fbErr: any) {
        console.warn('Firebase Auth client sign in note:', fbErr?.code || fbErr?.message);
      }

      // 2. Backend Direct Verification: Synchronized server state & admin-configured passwords
      try {
        const serverAuth = await adminService.prescriberLogin(email, password);
        if (serverAuth.success && serverAuth.profile) {
          soundFx.playSuccess();
          onPrescriberLoginSuccess(serverAuth.profile, serverAuth.uid || serverAuth.profile.id);
          return;
        }

        if (serverAuth.error && !serverAuth.error.includes('conexão') && !serverAuth.error.includes('offline') && !serverAuth.error.includes('servidor')) {
          soundFx.playAlert();
          setErrorMessage(serverAuth.error);
          return;
        }
      } catch (srvErr) {
        console.warn('Backend prescriberLogin note:', srvErr);
      }

      // 3. Resilient Client-side Fallback against synchronized prescribersList
      const matched = prescribersList.find(
        (p) => (p.email || '').toLowerCase().trim() === email
      );

      if (matched) {
        if (matched.status === 'Inativo') {
          soundFx.playAlert();
          setErrorMessage('Sua conta profissional está inativa. Entre em contato com a administração.');
          return;
        }

        if (!matched.password) {
          soundFx.playAlert();
          setErrorMessage('Esta conta profissional ainda não possui senha cadastrada. Solicite a definição da senha ao Administrador Geral.');
          return;
        }

        if (matched.password !== password) {
          soundFx.playAlert();
          setErrorMessage('Senha incorreta. Verifique a senha cadastrada pelo Administrador ou solicite a redefinição.');
          return;
        }

        soundFx.playSuccess();
        onPrescriberLoginSuccess({ ...matched, firebaseUid: matched.firebaseUid || matched.id }, matched.firebaseUid || matched.id);
        return;
      }

      soundFx.playAlert();
      setErrorMessage('Nenhum profissional ou administrador encontrado com este e-mail. Verifique os dados digitados ou solicite o cadastro à administração.');
    } catch (err: any) {
      soundFx.playAlert();
      setErrorMessage('Erro ao autenticar. Verifique seus dados ou utilize a redefinição de senha.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // ============================================================================
  // 3. PRESCRITOR: RECUPERAÇÃO DE SENHA OFICIAL
  // ============================================================================
  const handleCopyResetLink = async () => {
    if (!generatedResetLink) return;
    try {
      await navigator.clipboard.writeText(generatedResetLink);
      setHasCopiedLink(true);
      soundFx.playSuccess();
      setTimeout(() => setHasCopiedLink(false), 3000);
    } catch {
      // ignore
    }
  };

  const handlePrescriberPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMessage(null);
    setSuccessMessage(null);
    setGeneratedResetLink(null);

    const email = prescriberEmail.trim();
    if (!email || !email.includes('@')) {
      soundFx.playAlert();
      setErrorMessage('Informe o e-mail cadastrado para envio do link de recuperação.');
      return;
    }

    setIsAuthenticating(true);
    try {
      const res = await adminService.requestPasswordReset(email);
      if (res.resetLink) {
        setGeneratedResetLink(res.resetLink);
      }
      soundFx.playSuccess();
      setSuccessMessage(
        res.message || 'Se o e-mail estiver cadastrado no sistema, o link para redefinição foi enviado com sucesso.'
      );
    } catch (err) {
      soundFx.playSuccess();
      setSuccessMessage('Solicitação de recuperação processada. Verifique sua caixa de entrada.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-700/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl liquid-glass border border-white/15 p-6 sm:p-8 shadow-2xl relative z-10 bg-slate-950/80 backdrop-blur-xl text-slate-100 space-y-6"
      >
        {/* Top Bar: Brand, Theme Toggle & Help */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-950/50">
              <span className="text-white font-black text-xs tracking-wider">LM</span>
            </div>
            <div>
              <span className="text-xs font-black tracking-tight text-white block">LM TEAM</span>
              <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest block -mt-0.5">
                Consultoria de Alta Performance
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition shrink-0"
                title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 text-cyan-400 shrink-0" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setIsHelpModalOpen(true);
              }}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition shrink-0"
              title="Informações de Acesso"
            >
              <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Header / Subtitle */}
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {portalArea === 'prescriber' ? 'Acesso da Equipe Técnica' : 'Portal do Aluno'}
          </h2>
          <p className="text-xs text-slate-400">
            {portalArea === 'prescriber'
              ? 'Painel restrito para Head Coach, Nutricionistas, Médicos e Administradores.'
              : 'Entre com seu telefone e a senha gerada pelo seu treinador/prescritor.'}
          </p>
        </div>

        {/* Portal Area Switcher (Aluno vs Prescritor/Admin) */}
        <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setPortalArea('athlete');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              portalArea === 'athlete'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Sou Aluno</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setPortalArea('prescriber');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              portalArea === 'prescriber'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-violet-300" />
            <span>Prescritor & Admin</span>
          </button>
        </div>

        {/* Feedback Banners */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-tight">{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span className="leading-tight">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* ATHLETE AUTHENTICATION: TELEFONE + SENHA DO PRESCRITOR   */}
        {/* ======================================================== */}
        {portalArea === 'athlete' && (
          <form onSubmit={handleAthleteLogin} className="space-y-4">
            {/* Telefone / WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Telefone Celular (WhatsApp)</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">ID de Acesso</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4 text-cyan-400/80" />
                </div>
                <input
                  type="tel"
                  value={athletePhone}
                  onChange={(e) => {
                    setAthletePhone(formatPhoneNumber(e.target.value));
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="(11) 98765-4321"
                  maxLength={15}
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-white/15 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white font-mono text-sm tracking-wide transition placeholder:text-slate-500 outline-none"
                />
              </div>
            </div>

            {/* Senha de Acesso Gerada pelo Prescritor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Senha de Acesso</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  Fornecida pelo Prescritor
                </span>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4 text-cyan-400/80" />
                </div>
                <input
                  type={showAthletePassword ? 'text' : 'password'}
                  value={athletePassword}
                  onChange={(e) => {
                    setAthletePassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Senha fornecida pelo treinador"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-900/90 border border-white/15 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white text-sm transition placeholder:text-slate-500 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setShowAthletePassword(!showAthletePassword);
                  }}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
                  title={showAthletePassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showAthletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Explanatory security callout */}
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
              <span>
                O cadastro e senha de acesso são gerados exclusivamente pelo seu treinador ou nutricionista.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-black text-sm tracking-wide shadow-xl shadow-cyan-900/30 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isAuthenticating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validando Acesso do Aluno...</span>
                </>
              ) : (
                <>
                  <span>Entrar na Consultoria</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* PRESCRIBER & ADMIN AUTHENTICATION (EMAIL + FIREBASE AUTH) */}
        {/* ======================================================== */}
        {portalArea === 'prescriber' && (
          <div className="space-y-4">
            {prescriberAuthMode === 'login' ? (
              <form onSubmit={handlePrescriberLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-violet-400" />
                    <span>E-mail Corporativo</span>
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4 text-violet-400/80" />
                    </div>
                    <input
                      type="email"
                      value={prescriberEmail}
                      onChange={(e) => {
                        setPrescriberEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="seu.email@lmteam.com.br"
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-white/15 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 text-white text-sm transition placeholder:text-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-violet-400" />
                      <span>Senha de Acesso Profissional</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setErrorMessage(null);
                        setSuccessMessage(null);
                        setGeneratedResetLink(null);
                        setPrescriberAuthMode('forgot_password');
                      }}
                      className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold transition"
                    >
                      Redefinir senha
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4 text-violet-400/80" />
                    </div>
                    <input
                      type={showPrescriberPassword ? 'text' : 'password'}
                      value={prescriberPassword}
                      onChange={(e) => {
                        setPrescriberPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Senha do Firebase Authentication"
                      required
                      className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-900/90 border border-white/15 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 text-white text-sm transition placeholder:text-slate-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setShowPrescriberPassword(!showPrescriberPassword);
                      }}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
                      title={showPrescriberPassword ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showPrescriberPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:via-indigo-500 hover:to-purple-500 text-white font-black text-sm tracking-wide shadow-xl shadow-violet-950/40 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isAuthenticating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Autenticando Prescritor...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Entrar no Painel Profissional</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePrescriberPasswordReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">E-mail Profissional do Prescritor / Admin</label>
                  <input
                    type="email"
                    value={prescriberEmail}
                    onChange={(e) => {
                      setPrescriberEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="seu.email@lmteam.com.br"
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-white/15 focus:border-violet-400 text-white text-sm outline-none"
                  />
                </div>

                {/* Generated Direct Reset Link Box */}
                {generatedResetLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-2xl bg-violet-950/60 border border-violet-500/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-violet-300 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-violet-400" />
                        <span>Link Direto de Redefinição</span>
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                        Pronto
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      O link oficial de recuperação foi gerado. Caso haja atraso na entrega do e-mail, utilize as opções abaixo:
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCopyResetLink}
                        className="flex-1 py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-violet-950/50"
                      >
                        {hasCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{hasCopiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                      </button>
                      <a
                        href={generatedResetLink}
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

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setGeneratedResetLink(null);
                      setPrescriberAuthMode('login');
                    }}
                    className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthenticating || !prescriberEmail.trim()}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-violet-950/40 flex items-center justify-center gap-2 disabled:opacity-50 transition"
                  >
                    {isAuthenticating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Link de Recuperação</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* PWA Install Button */}
        {onOpenInstallApp && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenInstallApp();
              }}
              className="px-4 py-2 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition shadow-lg shadow-cyan-950/30 flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Instalar Aplicativo no Celular (PWA)</span>
            </button>
          </div>
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>LM Team Consultoria • Acesso Seguro Zero-Trust</span>
        </div>
      </motion.div>

      {/* Help Modal */}
      <AnimatePresence>
        {isHelpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHelpModalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-3xl liquid-glass border border-white/15 p-6 shadow-2xl bg-slate-900/95 text-slate-100 z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-base font-black text-white">Como Funciona o Acesso?</h3>
                </div>
                <button
                  onClick={() => setIsHelpModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
                  <p className="font-bold text-cyan-300">📱 Acesso do Aluno:</p>
                  <p>
                    O acesso do atleta é realizado unicamente com o <strong>Telefone/WhatsApp</strong> e a <strong>Senha gerada pelo seu prescritor</strong> no momento da sua matrícula ou avaliação.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 space-y-1">
                  <p className="font-bold text-violet-300">🛡️ Acesso de Prescritores & Admins:</p>
                  <p>
                    Profissionais e Administradores autenticam-se com <strong>E-mail corporativo</strong> e <strong>Senha oficial</strong> via Firebase Authentication.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition"
              >
                Entendi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
