import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  UserCheck,
  ShieldCheck,
  Crown,
  Phone,
  Calendar,
  Mail,
  KeyRound,
  Award,
  Sparkles,
  Check,
  AlertCircle,
  FileText,
  Camera,
  Layers,
  Lock,
  UserPlus,
  HeartPulse,
  Stethoscope,
  Utensils,
  Dumbbell,
  ShieldAlert
} from 'lucide-react';
import { PrescriberProfile, PrescriberRoleType } from '../types';
import { soundFx } from '../utils/audio';
import { ImageUploader } from './ImageUploader';

interface PrescriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prescriber: PrescriberProfile) => void;
  prescriberToEdit?: PrescriberProfile | null;
  isCurrentUserAdmin: boolean;
  currentUser?: PrescriberProfile | null;
}

const DEFAULT_ROLE_OPTIONS: { role: PrescriberRoleType; icon: any; color: string; desc: string }[] = [
  {
    role: 'Head Coach',
    icon: Crown,
    color: 'from-amber-500 to-orange-600',
    desc: 'Gestão geral de periodização e biomecânica'
  },
  {
    role: 'Nutricionista',
    icon: Utensils,
    color: 'from-emerald-500 to-teal-600',
    desc: 'Dietas, macronutrientes e suplementação'
  },
  {
    role: 'Médico do Esporte',
    icon: Stethoscope,
    color: 'from-blue-500 to-indigo-600',
    desc: 'Acompanhamento clínico e fisiologia'
  },
  {
    role: 'Fisioterapeuta',
    icon: HeartPulse,
    color: 'from-purple-500 to-pink-600',
    desc: 'Reabilitação, mobilidade e prevenção'
  },
  {
    role: 'Preparador Físico',
    icon: Dumbbell,
    color: 'from-rose-500 to-red-600',
    desc: 'Condicionamento físico e força'
  },
  {
    role: 'Administrador Geral',
    icon: ShieldCheck,
    color: 'from-violet-600 to-indigo-900',
    desc: 'Acesso pleno ao sistema e gestão executiva'
  }
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594824813689-f772e0b57e79?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80'
];

export const PrescriberModal: React.FC<PrescriberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  prescriberToEdit,
  isCurrentUserAdmin,
  currentUser
}) => {
  const [name, setName] = useState<string>('');
  const [roleType, setRoleType] = useState<string>('Head Coach');
  const [customRole, setCustomRole] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [accessPassword, setAccessPassword] = useState<string>('lmteam2026');
  const [crmCrnCref, setCrmCrnCref] = useState<string>('');
  const [avatar, setAvatar] = useState<string>(PRESET_AVATARS[0]);
  const [isMaster, setIsMaster] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [bio, setBio] = useState<string>('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset or populate fields when modal opens or prescriberToEdit changes
  useEffect(() => {
    if (prescriberToEdit) {
      setName(prescriberToEdit.name || '');
      const isPredefined = DEFAULT_ROLE_OPTIONS.some((r) => r.role === prescriberToEdit.roleType);
      if (isPredefined) {
        setRoleType(prescriberToEdit.roleType);
        setCustomRole('');
      } else {
        setRoleType('Outro');
        setCustomRole(prescriberToEdit.roleType || '');
      }
      setPhone(prescriberToEdit.phone || '');
      setBirthDate(prescriberToEdit.birthDate || '');
      setEmail(prescriberToEdit.email || '');
      setAccessPassword(prescriberToEdit.accessPassword || 'lmteam2026');
      setCrmCrnCref(prescriberToEdit.crm_crn_cref || '');
      setAvatar(prescriberToEdit.avatar || PRESET_AVATARS[0]);
      setIsMaster(!!prescriberToEdit.isMaster);
      setIsAdmin(!!prescriberToEdit.isAdmin);
      setStatus(prescriberToEdit.status || 'Ativo');
      setBio(prescriberToEdit.bio || '');
    } else {
      setName('');
      setRoleType('Head Coach');
      setCustomRole('');
      setPhone('');
      setBirthDate('1990-01-01');
      setEmail('');
      setAccessPassword('lmteam2026');
      setCrmCrnCref('');
      setAvatar(PRESET_AVATARS[1]);
      setIsMaster(false);
      setIsAdmin(false);
      setStatus('Ativo');
      setBio('');
    }
    setFormErrors({});
  }, [prescriberToEdit, isOpen]);

  if (!isOpen) return null;

  // Phone Mask helper (99) 99999-9999
  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    let formatted = '';
    if (digits.length === 0) formatted = '';
    else if (digits.length <= 2) formatted = `(${digits}`;
    else if (digits.length <= 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    else formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    setPhone(formatted);
  };

  // Calculate age from birthdate
  const calculateAge = (bDate: string) => {
    if (!bDate) return null;
    const parts = bDate.split('-');
    if (parts.length !== 3) return null;
    const birth = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 && age < 120 ? age : null;
  };

  const currentAge = calculateAge(birthDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Informe o nome completo do prescritor.';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Informe um telefone/WhatsApp válido com DDD.';
    }
    if (!birthDate) errors.birthDate = 'Informe a data de nascimento.';
    if (!email.trim() || !email.includes('@')) errors.email = 'Informe um e-mail válido.';

    const finalRole = roleType === 'Outro' ? customRole.trim() : roleType;
    if (!finalRole) errors.role = 'Informe a função ou cargo do prescritor.';

    // Security invariant: Master cannot create or edit Admin
    if (!isCurrentUserAdmin && isAdmin) {
      errors.admin = 'Apenas Administradores podem definir ou alterar perfis de Administrador.';
    }

    if (Object.keys(errors).length > 0) {
      soundFx.playAlert();
      setFormErrors(errors);
      return;
    }

    const savedPrescriber: PrescriberProfile = {
      id: prescriberToEdit ? prescriberToEdit.id : `presc-${Date.now()}`,
      name: name.trim(),
      roleType: finalRole,
      phone: phone.trim(),
      birthDate: birthDate,
      email: email.trim().toLowerCase(),
      accessPassword: accessPassword.trim() || 'lmteam2026',
      avatar: avatar,
      isMaster: isAdmin ? true : isMaster, // Admin sempre possui privilégio master
      isAdmin: isCurrentUserAdmin ? isAdmin : (prescriberToEdit?.isAdmin || false),
      status: status,
      crm_crn_cref: crmCrnCref.trim() || undefined,
      bio: bio.trim() || undefined,
      requiresPasswordChange: prescriberToEdit?.requiresPasswordChange,
      passwordChangedAt: prescriberToEdit?.passwordChangedAt,
      createdAt: prescriberToEdit?.createdAt || new Date().toISOString().split('T')[0],
      createdBy: prescriberToEdit?.createdBy || (currentUser ? {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.roleType
      } : undefined)
    };

    soundFx.playSuccess();
    onSave(savedPrescriber);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop with Liquid Glass blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl rounded-3xl modal-liquid-glass border border-white/20 shadow-2xl p-5 sm:p-8 z-10 my-8 max-h-[90vh] overflow-y-auto no-scrollbar"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 p-0.5 shadow-lg shadow-indigo-900/30 flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-indigo-300">
                  {isAdmin ? (
                    <ShieldAlert className="w-6 h-6 text-violet-400" />
                  ) : isMaster ? (
                    <Crown className="w-6 h-6 text-amber-400" />
                  ) : (
                    <UserCheck className="w-6 h-6 text-blue-400" />
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {prescriberToEdit ? 'Editar Perfil de Prescritor' : 'Novo Prescritor / Especialista'}
                  </h3>
                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/40">
                      ADMIN
                    </span>
                  )}
                  {isMaster && !isAdmin && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5" /> MASTER
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isCurrentUserAdmin
                    ? 'Acesso de Administrador: você pode cadastrar e definir Prescritores Masters e Administradores.'
                    : 'Acesso de Prescritor Master: você pode cadastrar outros membros da equipe técnica.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {/* Foto de Perfil com Upload Direto */}
            <ImageUploader
              currentImage={avatar}
              onImageSelected={(newAvatar) => setAvatar(newAvatar)}
              presetAvatars={PRESET_AVATARS}
              label="Foto de Perfil do Prescritor / Admin"
              helperText="Envie uma foto do seu dispositivo (JPG, PNG, WebP) ou escolha um avatar profissional."
              size="md"
            />

            {/* Grid: Nome & Função */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Nome Completo *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Dr. Lucas Mendes"
                    className={`w-full px-4 py-3 rounded-2xl bg-black/40 border text-white font-medium text-sm focus:outline-none focus:border-blue-500 transition ${
                      formErrors.name ? 'border-rose-500' : 'border-white/15'
                    }`}
                  />
                  <UserCheck className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                {formErrors.name && (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.name}
                  </p>
                )}
              </div>

              {/* Função / Especialidade */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Função / Especialidade *
                </label>
                <select
                  value={roleType}
                  onChange={(e) => {
                    soundFx.playClick();
                    setRoleType(e.target.value);
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/15 text-white font-semibold text-sm focus:outline-none focus:border-blue-500 transition"
                >
                  {DEFAULT_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.role} value={opt.role} className="bg-slate-900 text-white">
                      {opt.role}
                    </option>
                  ))}
                  <option value="Outro" className="bg-slate-900 text-white">
                    Outro (Personalizado)
                  </option>
                </select>

                {roleType === 'Outro' && (
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Digite o cargo (ex: Endocrinologista)"
                    className="w-full mt-2 px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>
            </div>

            {/* Grid: Telefone / WhatsApp & Data de Nascimento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Telefone */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Telefone / WhatsApp *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(11) 98765-4321"
                    maxLength={15}
                    className={`w-full px-4 py-3 rounded-2xl bg-black/40 border text-white font-mono font-medium text-sm focus:outline-none focus:border-emerald-500 transition ${
                      formErrors.phone ? 'border-rose-500' : 'border-white/15'
                    }`}
                  />
                  <Phone className="w-4 h-4 text-emerald-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                {formErrors.phone && (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.phone}
                  </p>
                )}
              </div>

              {/* Data de Nascimento */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Data de Nascimento *
                  </label>
                  {currentAge !== null && (
                    <span className="text-[11px] font-bold text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-md border border-blue-500/30">
                      {currentAge} anos
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl bg-black/40 border text-white font-medium text-sm focus:outline-none focus:border-blue-500 transition ${
                      formErrors.birthDate ? 'border-rose-500' : 'border-white/15'
                    }`}
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                {formErrors.birthDate && (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.birthDate}
                  </p>
                )}
              </div>
            </div>

            {/* Grid: E-mail & Senha de Acesso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  E-mail de Acesso *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prescritor@lmteam.com.br"
                    className={`w-full px-4 py-3 rounded-2xl bg-black/40 border text-white font-medium text-sm focus:outline-none focus:border-blue-500 transition ${
                      formErrors.email ? 'border-rose-500' : 'border-white/15'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                {formErrors.email && (
                  <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.email}
                  </p>
                )}
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Senha de Acesso / Chave
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={accessPassword}
                    onChange={(e) => setAccessPassword(e.target.value)}
                    placeholder="lmteam2026"
                    className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                  <KeyRound className="w-4 h-4 text-amber-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Registro de Conselho & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Registro Profissional (CREF / CRN / CRM)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={crmCrnCref}
                    onChange={(e) => setCrmCrnCref(e.target.value)}
                    placeholder="Ex: CREF 089123-G/SP"
                    className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                  <Award className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Status da Conta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setStatus('Ativo');
                    }}
                    className={`py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                      status === 'Ativo'
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-950/40'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setStatus('Inativo');
                    }}
                    className={`py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                      status === 'Inativo'
                        ? 'bg-rose-600/30 text-rose-300 border-rose-500/50 shadow-md shadow-rose-950/40'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Inativo
                  </button>
                </div>
              </div>
            </div>

            {/* SEÇÃO DE PRIVILÉGIOS E HIERARQUIA (MASTER / ADMINISTRADOR) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900/60 border border-indigo-500/30 space-y-4 shadow-inner">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300">
                  Controle de Acessos & Permissões Hierárquicas
                </h4>
              </div>

              {/* Toggle: Prescritor Master */}
              <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-black/30 border border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Definir como Prescritor Master</span>
                    {isMaster && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ATIVADO
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    O Master pode cadastrar e gerenciar outros perfis de prescritores e atletas.
                    <strong className="text-slate-200">
                      {' '}
                      Regra de Segurança: O Master não tem permissão para alterar ou excluir contas de Administradores.
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setIsMaster(!isMaster);
                  }}
                  className={`w-12 h-6 rounded-full transition relative p-0.5 border ${
                    isMaster ? 'bg-amber-600 border-amber-400' : 'bg-white/10 border-white/20'
                  }`}
                >
                  <motion.div
                    animate={{ x: isMaster ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center text-amber-700"
                  >
                    {isMaster && <Check className="w-3 h-3 stroke-[3]" />}
                  </motion.div>
                </button>
              </div>

              {/* Toggle: Administrador Geral (Apenas disponível se o criador for Administrador) */}
              <div
                className={`flex items-start justify-between gap-4 p-3 rounded-xl border ${
                  isCurrentUserAdmin
                    ? 'bg-violet-950/30 border-violet-500/30'
                    : 'bg-black/20 border-white/5 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold text-white">Perfil Administrador Geral</span>
                    {isAdmin && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                        ADMIN MASTER
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {isCurrentUserAdmin
                      ? 'Concede controle absoluto sobre todos os módulos, permissões e contas de outros administradores.'
                      : '🔒 Bloqueado: Apenas Administradores do sistema podem criar ou promover outros Administradores.'}
                  </p>
                </div>

                {isCurrentUserAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      const nextAdmin = !isAdmin;
                      setIsAdmin(nextAdmin);
                      if (nextAdmin) {
                        setIsMaster(true);
                        setRoleType('Administrador Geral');
                      }
                    }}
                    className={`w-12 h-6 rounded-full transition relative p-0.5 border ${
                      isAdmin ? 'bg-violet-600 border-violet-400' : 'bg-white/10 border-white/20'
                    }`}
                  >
                    <motion.div
                      animate={{ x: isAdmin ? 24 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center text-violet-800"
                    >
                      {isAdmin && <Check className="w-3 h-3 stroke-[3]" />}
                    </motion.div>
                  </button>
                ) : (
                  <Lock className="w-4 h-4 text-slate-500 mt-1" />
                )}
              </div>
            </div>

            {/* Bio / Observações */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Resumo Profissional / Biografia (Opcional)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ex: Especialista em hipertrofia e fisiologia metabólica..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/40 border border-white/15 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition border border-white/10"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 hover:from-blue-500 hover:to-violet-600 text-white text-xs font-bold shadow-lg shadow-indigo-900/40 transition flex items-center gap-2 border border-indigo-400/30"
              >
                <Check className="w-4 h-4" />
                <span>{prescriberToEdit ? 'Salvar Alterações' : 'Cadastrar Prescritor'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
