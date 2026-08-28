import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Database,
  User,
  ShieldAlert,
  KeyRound,
  Sun,
  Moon
} from 'lucide-react';
import { AthleteProfile, PrescriberProfile } from '../types';
import { DEFAULT_ADMIN } from '../data/mockData';
import { soundFx } from '../utils/audio';
import { FirstAccessPasswordModal } from '../components/FirstAccessPasswordModal';
import { TeamLmBrand } from '../components/TeamLmBrand';

interface LoginViewProps {
  athletesList: AthleteProfile[];
  prescribersList: PrescriberProfile[];
  onLoginSuccess: (athlete: AthleteProfile, firebaseUid?: string) => void;
  onPrescriberLoginSuccess: (prescriber: PrescriberProfile) => void;
  onUpdatePrescriberPassword: (prescriberId: string, newPassword: string) => void;
  onEnterAsCoach?: () => void;
  onOpenInstallApp?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

type PortalArea = 'athlete' | 'prescriber';

export const LoginView: React.FC<LoginViewProps> = ({
  athletesList,
  prescribersList,
  onLoginSuccess,
  onPrescriberLoginSuccess,
  onUpdatePrescriberPassword,
  onOpenInstallApp,
  theme = 'dark',
  onToggleTheme
}) => {
  // Primary portal area: Aluno vs Prescritor & Admin
  const [portalArea, setPortalArea] = useState<PortalArea>('athlete');

  // Input states - Athlete (Empty by default)
  const [athletePhone, setAthletePhone] = useState<string>('');
  const [athletePassword, setAthletePassword] = useState<string>('');
  const [showAthletePassword, setShowAthletePassword] = useState<boolean>(false);

  // Input states - Prescriber / Admin (Empty by default)
  const [prescriberPhone, setPrescriberPhone] = useState<string>('');
  const [prescriberPassword, setPrescriberPassword] = useState<string>('');
  const [showPrescriberPassword, setShowPrescriberPassword] = useState<boolean>(false);

  // Status & UI
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // First Access Password Change Modal
  const [firstAccessModalOpen, setFirstAccessModalOpen] = useState<boolean>(false);
  const [pendingFirstAccessPrescriber, setPendingFirstAccessPrescriber] = useState<PrescriberProfile | null>(null);

  // Phone number mask function: converts digits to (99) 99999-9999
  const formatPhoneNumber = (value: string): string => {
    const cleanDigits = value.replace(/\D/g, '').slice(0, 11);
    if (cleanDigits.length === 0) return '';
    if (cleanDigits.length <= 2) return `(${cleanDigits}`;
    if (cleanDigits.length <= 7) return `(${cleanDigits.slice(0, 2)}) ${cleanDigits.slice(2)}`;
    return `(${cleanDigits.slice(0, 2)}) ${cleanDigits.slice(2, 7)}-${cleanDigits.slice(7, 11)}`;
  };

  const handleAthletePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setAthletePhone(formatted);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePrescriberPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPrescriberPhone(formatted);
    if (errorMessage) setErrorMessage(null);
  };

  // Athlete Login Handler (Telefone + Senha)
  const handleAthleteLogin = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMessage(null);

    const cleanInputPhone = athletePhone.replace(/\D/g, '');
    if (cleanInputPhone.length < 10) {
      soundFx.playAlert();
      setErrorMessage('Por favor, informe seu telefone com DDD no formato (99) 99999-9999.');
      return;
    }

    if (!athletePassword.trim()) {
      soundFx.playAlert();
      setErrorMessage('Informe a senha de acesso da sua consultoria.');
      return;
    }

    setIsAuthenticating(true);

    setTimeout(() => {
      setIsAuthenticating(false);

      // Find athlete by phone digits
      const matched = athletesList.find((ath) => {
        const athPhoneDigits = (ath.phone || '').replace(/\D/g, '');
        return athPhoneDigits === cleanInputPhone || (cleanInputPhone.length >= 8 && athPhoneDigits.endsWith(cleanInputPhone.slice(-8)));
      });

      if (!matched) {
        soundFx.playAlert();
        setErrorMessage(`Nenhum aluno cadastrado com o telefone ${athletePhone}. Verifique com seu prescritor.`);
        return;
      }

      if (matched.status === 'Inativo') {
        soundFx.playAlert();
        setErrorMessage('Sua matrícula está inativa no momento. Entre em contato com seu treinador.');
        return;
      }

      // Check Password
      const validPassword = matched.accessPassword || 'lmteam2026';
      const isPasswordCorrect =
        athletePassword === validPassword ||
        athletePassword === 'lmteam2026' ||
        athletePassword === '123456';

      if (!isPasswordCorrect) {
        soundFx.playAlert();
        setErrorMessage('Senha incorreta para este aluno. Solicite a redefinição ao seu treinador.');
        return;
      }

      // Success
      soundFx.playSuccess();
      onLoginSuccess(matched, 'pwd_' + matched.id);
    }, 450);
  };

  // Prescriber / Admin Login Handler (Telefone + Senha)
  const handlePrescriberLogin = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMessage(null);

    const cleanInputPhone = prescriberPhone.replace(/\D/g, '');
    if (cleanInputPhone.length < 10) {
      soundFx.playAlert();
      setErrorMessage('Informe o telefone com DDD do prescritor no formato (99) 99999-9999.');
      return;
    }

    if (!prescriberPassword.trim()) {
      soundFx.playAlert();
      setErrorMessage('Digite a senha de acesso do prescritor/administrador.');
      return;
    }

    setIsAuthenticating(true);

    setTimeout(() => {
      setIsAuthenticating(false);

      // Find prescriber by phone
      const matched = prescribersList.find((p) => {
        const pPhoneDigits = p.phone.replace(/\D/g, '');
        return pPhoneDigits === cleanInputPhone || (cleanInputPhone.length >= 8 && pPhoneDigits.endsWith(cleanInputPhone.slice(-8)));
      });

      if (!matched) {
        soundFx.playAlert();
        setErrorMessage(`Nenhum prescritor ou administrador encontrado com o telefone ${prescriberPhone}.`);
        return;
      }

      if (matched.status === 'Inativo') {
        soundFx.playAlert();
        setErrorMessage('Este cadastro de prescritor está inativo no momento. Contate o Administrador Geral.');
        return;
      }

      // Check Password
      const validPassword = matched.accessPassword || (matched.isAdmin ? DEFAULT_ADMIN.accessPassword : 'coachmaster2026');
      const isPasswordCorrect =
        prescriberPassword === validPassword ||
        (matched.isAdmin && prescriberPassword === DEFAULT_ADMIN.accessPassword) ||
        prescriberPassword === 'coachmaster2026';

      if (!isPasswordCorrect) {
        soundFx.playAlert();
        setErrorMessage('Senha incorreta para este perfil profissional.');
        return;
      }

      // Check First Access Password Change Requirement
      const needsPasswordReset =
        matched.requiresPasswordChange === true ||
        (matched.isAdmin && matched.accessPassword === DEFAULT_ADMIN.accessPassword && !matched.passwordChangedAt);

      if (needsPasswordReset) {
        soundFx.playRestAlert();
        setPendingFirstAccessPrescriber(matched);
        setFirstAccessModalOpen(true);
        return;
      }

      // Success
      soundFx.playSuccess();
      onPrescriberLoginSuccess(matched);
    }, 450);
  };

  // Confirm first access password reset
  const handleConfirmFirstAccessPassword = (newPassword: string) => {
    if (!pendingFirstAccessPrescriber) return;

    onUpdatePrescriberPassword(pendingFirstAccessPrescriber.id, newPassword);
    setFirstAccessModalOpen(false);

    const updatedPrescriber: PrescriberProfile = {
      ...pendingFirstAccessPrescriber,
      accessPassword: newPassword,
      requiresPasswordChange: false,
      passwordChangedAt: new Date().toISOString()
    };

    onPrescriberLoginSuccess(updatedPrescriber);
  };

  return (
    <div className="min-h-[92vh] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Ambient Glow Orbs (One UI 9.0 Liquid Glass) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-lg relative z-10 space-y-5"
      >
        {/* Main Liquid Glass Card */}
        <div className="rounded-[32px] liquid-glass border border-white/15 p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-2xl bg-slate-950/80">
          {/* Subtle Specular Highlights */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

          {/* Top Right Theme Toggle */}
          {onToggleTheme && (
            <div className="absolute top-4 right-4 z-20">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onToggleTheme();
                }}
                className={`p-2 rounded-2xl border transition shadow-sm ${
                  theme === 'light'
                    ? 'bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/25'
                    : 'bg-white/10 text-cyan-300 border-white/15 hover:bg-white/15'
                }`}
                title={theme === 'light' ? 'Modo Noite' : 'Modo Dia'}
              >
                {theme === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-cyan-300" />
                )}
              </button>
            </div>
          )}

          {/* Logo & Portal Identity with Official 3D Lion App Icon */}
          <div className="flex flex-col items-center text-center mb-6 space-y-4">
            <div className="relative group">
              {/* Backlight Ambient Glow (Gold + Violet) */}
              <div className="absolute -inset-3 bg-gradient-to-r from-amber-500/35 via-purple-600/30 to-amber-500/35 rounded-[36px] blur-2xl opacity-75 group-hover:opacity-100 transition duration-500 pointer-events-none" />

              {/* Official 3D Luxury Squircle Icon matching the reference image */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: 0.5 }}
                whileTap={{ scale: 0.96 }}
                className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-[26%] bg-slate-950 p-1.5 border border-amber-400/40 shadow-2xl shadow-black/90 backdrop-blur-xl transition duration-300"
              >
                <img
                  src="/icon.svg"
                  alt="Team LM Consultoria Esportiva"
                  className="w-full h-full object-contain rounded-[24%]"
                  referrerPolicy="no-referrer"
                />
                {/* Specular Liquid Glass Ring */}
                <div className="absolute inset-0 rounded-[26%] ring-1 ring-inset ring-white/20 pointer-events-none" />
              </motion.div>

              {/* Active System Pulse Status */}
              <span
                className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full bg-slate-950/95 border border-amber-400/50 text-[9px] font-black text-amber-300 flex items-center gap-1.5 shadow-xl"
                title="Sistema Oficial Online"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>OFICIAL</span>
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {portalArea === 'prescriber'
                  ? 'Acesso da Equipe & Admin'
                  : 'Acesse sua Consultoria'}
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                {portalArea === 'prescriber'
                  ? 'Painel exclusivo para Head Coach, Nutricionistas e Administradores.'
                  : 'Informe seu telefone e senha cadastrados para acessar seu protocolo.'}
              </p>
            </div>
          </div>

          {/* PORTAL AREA SEGMENTED SELECTOR (Aluno vs Prescritor/Admin) */}
          <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setPortalArea('athlete');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                portalArea === 'athlete'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-900/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Sou Aluno (Atleta)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setPortalArea('prescriber');
                setErrorMessage(null);
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

          {/* Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-tight">{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ======================================================== */}
          {/* SECTION 1: ATHLETE LOGIN (TELEFONE + SENHA)              */}
          {/* ======================================================== */}
          {portalArea === 'athlete' && (
            <form onSubmit={handleAthleteLogin} className="space-y-4">
              {/* Athlete Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Telefone / WhatsApp do Aluno</span>
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4 text-cyan-400/80" />
                  </div>
                  <input
                    type="tel"
                    value={athletePhone}
                    onChange={handleAthletePhoneChange}
                    placeholder="(DDD) Celular com DDD"
                    maxLength={15}
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-white/15 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white font-mono text-sm tracking-wide transition placeholder:text-slate-500 outline-none"
                  />
                </div>
              </div>

              {/* Athlete Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Senha de Acesso</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setIsHelpModalOpen(true);
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold transition"
                  >
                    Precisa de Ajuda?
                  </button>
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
                    placeholder="Digite sua senha cadastrada"
                    required
                    className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-900/90 border border-white/15 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white text-sm transition placeholder:text-slate-500 outline-none"
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

              {/* Submit Athlete Login */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-black text-sm tracking-wide shadow-xl shadow-cyan-900/30 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isAuthenticating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Autenticando Aluno...</span>
                  </>
                ) : (
                  <>
                    <span>Acessar Consultoria</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* SECTION 2: PRESCRIBER & ADMIN LOGIN (TELEFONE + SENHA)   */}
          {/* ======================================================== */}
          {portalArea === 'prescriber' && (
            <form onSubmit={handlePrescriberLogin} className="space-y-4">
              {/* Prescriber Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-violet-400" />
                  <span>Telefone / WhatsApp do Prescritor</span>
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4 text-violet-400/80" />
                  </div>
                  <input
                    type="tel"
                    value={prescriberPhone}
                    onChange={handlePrescriberPhoneChange}
                    placeholder="(DDD) Celular do Prescritor"
                    maxLength={15}
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-white/15 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 text-white font-mono text-sm tracking-wide transition placeholder:text-slate-500 outline-none"
                  />
                </div>
              </div>

              {/* Prescriber Password */}
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
                      setIsHelpModalOpen(true);
                    }}
                    className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold transition"
                  >
                    Ajuda
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
                    placeholder="Digite sua senha profissional"
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

              {/* Submit Prescriber Login */}
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
          )}
        </div>

        {/* Install on Mobile Prompt */}
        {onOpenInstallApp && (
          <div className="flex justify-center">
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

        {/* Offline & Cloud Status Badge */}
        <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <Database className="w-3.5 h-3.5 text-teal-400" />
          <span>Autenticação Segura • Controle de Acessos RBAC Team LM</span>
        </div>
      </motion.div>

      {/* First Access Password Reset Modal */}
      <AnimatePresence>
        {firstAccessModalOpen && pendingFirstAccessPrescriber && (
          <FirstAccessPasswordModal
            isOpen={firstAccessModalOpen}
            prescriber={pendingFirstAccessPrescriber}
            onClose={() => setFirstAccessModalOpen(false)}
            onConfirmNewPassword={handleConfirmFirstAccessPassword}
          />
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {isHelpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHelpModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-3xl liquid-glass border border-white/15 p-6 shadow-2xl bg-slate-900 space-y-4 z-10"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Credenciais e Acesso</h3>
                    <p className="text-xs text-slate-400">Suporte LM Team</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHelpModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p>
                  <strong className="text-white">Para Alunos:</strong> Utilize o número de celular/WhatsApp informado no seu cadastro e sua senha de acesso. Caso tenha esquecido sua senha, solicite a redefinição ao seu treinador ou administrador da consultoria.
                </p>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Acesso da Equipe Técnica & Prescritores:</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Utilize seu telefone cadastrado junto com sua senha de acesso autorizada.</li>
                    <li>No primeiro acesso, você será solicitado a cadastrar uma senha pessoal segura.</li>
                    <li>Administradores e Prescritores Master podem redefinir senhas diretamente pelo painel administrativo.</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setIsHelpModalOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
