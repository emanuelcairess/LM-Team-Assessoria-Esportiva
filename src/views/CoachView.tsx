import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Search,
  UserPlus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  TrendingUp,
  Dumbbell,
  Utensils,
  Pill,
  Award,
  ChevronRight,
  Filter,
  Save,
  Check,
  Phone,
  CreditCard,
  Calendar,
  KeyRound,
  MessageSquare,
  Copy,
  Power,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Sparkles,
  UserX,
  HeartPulse,
  Crown,
  Stethoscope,
  Lock,
  ExternalLink,
  Shield,
  UserCheck,
  Camera
} from 'lucide-react';
import {
  AthleteProfile,
  WorkoutSplit,
  NutritionPlan,
  SupplementItem,
  WorkoutTemplate,
  PrescriberProfile
} from '../types';
import { soundFx } from '../utils/audio';
import { StudentModal } from '../components/StudentModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { PrescriberModal } from '../components/PrescriberModal';
import { PrescriberDeleteModal } from '../components/PrescriberDeleteModal';
import { ChangeAvatarModal } from '../components/ChangeAvatarModal';
import { EditNutritionPlanModal } from '../components/EditNutritionPlanModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';

interface CoachViewProps {
  athletesList: AthleteProfile[];
  currentAthlete: AthleteProfile;
  onSelectAthlete: (ath: AthleteProfile) => void;
  onAddAthlete: (athlete: AthleteProfile) => void;
  onUpdateAthlete: (athlete: AthleteProfile) => void;
  onToggleAthleteStatus: (athleteId: string) => void;
  onDeleteAthlete: (athleteId: string) => void;
  workoutSplits: WorkoutSplit[];
  onUpdateWorkoutSplits?: (updated: WorkoutSplit[]) => void;
  nutritionPlan: NutritionPlan;
  onUpdateNutritionPlan?: (updated: NutritionPlan) => void;
  supplements: SupplementItem[];
  templates?: WorkoutTemplate[];
  onNavigateToWorkout?: () => void;
  onNavigateToSupplements?: () => void;
  // Prescribers management
  prescribersList: PrescriberProfile[];
  currentPrescriber: PrescriberProfile;
  onSelectPrescriber: (prescriber: PrescriberProfile) => void;
  onAddPrescriber: (prescriber: PrescriberProfile) => void;
  onUpdatePrescriber: (prescriber: PrescriberProfile) => void;
  onDeletePrescriber: (prescriberId: string) => void;
  onTogglePrescriberStatus: (prescriberId: string) => void;
  onResetPassword?: (
    userId: string,
    newPassword: string,
    requiresChange: boolean,
    userType: 'athlete' | 'prescriber'
  ) => void;
}

export const CoachView: React.FC<CoachViewProps> = ({
  athletesList,
  currentAthlete,
  onSelectAthlete,
  onAddAthlete,
  onUpdateAthlete,
  onToggleAthleteStatus,
  onDeleteAthlete,
  workoutSplits,
  onUpdateWorkoutSplits,
  nutritionPlan,
  onUpdateNutritionPlan,
  supplements,
  templates,
  onNavigateToWorkout,
  onNavigateToSupplements,
  prescribersList,
  currentPrescriber,
  onSelectPrescriber,
  onAddPrescriber,
  onUpdatePrescriber,
  onDeletePrescriber,
  onTogglePrescriberStatus,
  onResetPassword
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string>('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [activeTab, setActiveTab] = useState<'athletes' | 'prescribers' | 'prescriptions'>('athletes');
  const [isEditDietModalOpen, setIsEditDietModalOpen] = useState<boolean>(false);

  // Prescriber filter state
  const [prescriberSearchQuery, setPrescriberSearchQuery] = useState<string>('');
  const [prescriberRoleFilter, setPrescriberRoleFilter] = useState<string>('todos');

  // Modals state for Students
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [athleteToEdit, setAthleteToEdit] = useState<AthleteProfile | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<AthleteProfile | null>(null);

  // Modals state for Prescribers
  const [isPrescriberModalOpen, setIsPrescriberModalOpen] = useState<boolean>(false);
  const [prescriberToEdit, setPrescriberToEdit] = useState<PrescriberProfile | null>(null);
  const [prescriberToDelete, setPrescriberToDelete] = useState<PrescriberProfile | null>(null);
  const [avatarModalPrescriber, setAvatarModalPrescriber] = useState<PrescriberProfile | null>(null);

  // Password Reset Modal State
  const [resetPasswordTarget, setResetPasswordTarget] = useState<{
    id: string;
    name: string;
    phone: string;
    roleLabel: string;
    type: 'athlete' | 'prescriber';
    isAdmin?: boolean;
    isMaster?: boolean;
    currentPassword?: string;
  } | null>(null);

  const isCurrentUserAdmin = Boolean(currentPrescriber.isAdmin);
  const isCurrentUserMaster = Boolean(currentPrescriber.isMaster || currentPrescriber.isAdmin);

  // Filter athletes
  const filteredAthletes = athletesList.filter((ath) => {
    const matchGoal = selectedGoalFilter === 'todos' || ath.goal === selectedGoalFilter;
    const matchStatus =
      selectedStatusFilter === 'todos' ||
      (selectedStatusFilter === 'ativo' && ath.status !== 'Inativo') ||
      (selectedStatusFilter === 'inativo' && ath.status === 'Inativo') ||
      ath.status === selectedStatusFilter;

    const query = searchQuery.toLowerCase().trim();
    const matchQuery =
      !query ||
      ath.name.toLowerCase().includes(query) ||
      ath.category.toLowerCase().includes(query) ||
      (ath.cpf && ath.cpf.includes(query)) ||
      (ath.phone && ath.phone.includes(query));

    return matchGoal && matchStatus && matchQuery;
  });

  // Filter prescribers
  const filteredPrescribers = prescribersList.filter((p) => {
    const matchRole =
      prescriberRoleFilter === 'todos' ||
      (prescriberRoleFilter === 'admin' && p.isAdmin) ||
      (prescriberRoleFilter === 'master' && p.isMaster && !p.isAdmin) ||
      p.roleType.toLowerCase().includes(prescriberRoleFilter.toLowerCase());

    const query = prescriberSearchQuery.toLowerCase().trim();
    const matchQuery =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.roleType.toLowerCase().includes(query) ||
      p.phone.includes(query) ||
      p.email.toLowerCase().includes(query) ||
      (p.crm_crn_cref && p.crm_crn_cref.toLowerCase().includes(query));

    return matchRole && matchQuery;
  });

  const activeAthletesCount = athletesList.filter((a) => a.status !== 'Inativo').length;
  const inactiveAthletesCount = athletesList.filter((a) => a.status === 'Inativo').length;
  const avgAdherence = athletesList.length
    ? Math.round(athletesList.reduce((acc, a) => acc + (a.adherencePercentage || 0), 0) / athletesList.length)
    : 0;

  // Format date helper
  const formatDateBr = (dateStr?: string) => {
    if (!dateStr) return 'Não informada';
    try {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const calculateAge = (bDate?: string) => {
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

  // Student handlers
  const handleOpenNewStudent = () => {
    soundFx.playClick();
    setAthleteToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (ath: AthleteProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick();
    setAthleteToEdit(ath);
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (athlete: AthleteProfile) => {
    if (athleteToEdit) {
      onUpdateAthlete(athlete);
    } else {
      onAddAthlete(athlete);
    }
  };

  const handleOpenDeleteStudent = (ath: AthleteProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick();
    setAthleteToDelete(ath);
  };

  const handleConfirmDeleteStudent = () => {
    if (athleteToDelete) {
      onDeleteAthlete(athleteToDelete.id);
      setAthleteToDelete(null);
    }
  };

  // Prescriber handlers
  const handleOpenNewPrescriber = () => {
    if (!isCurrentUserMaster) {
      soundFx.playRestAlert();
      return;
    }
    soundFx.playClick();
    setPrescriberToEdit(null);
    setIsPrescriberModalOpen(true);
  };

  const handleOpenEditPrescriber = (p: PrescriberProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick();
    // Security check: Master cannot edit Admin
    if (!isCurrentUserAdmin && p.isAdmin) {
      soundFx.playRestAlert();
      return;
    }
    setPrescriberToEdit(p);
    setIsPrescriberModalOpen(true);
  };

  const handleSavePrescriber = (p: PrescriberProfile) => {
    if (prescriberToEdit) {
      onUpdatePrescriber(p);
    } else {
      onAddPrescriber(p);
    }
  };

  const handleOpenDeletePrescriber = (p: PrescriberProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick();
    setPrescriberToDelete(p);
  };

  const handleConfirmDeletePrescriber = () => {
    if (prescriberToDelete) {
      onDeletePrescriber(prescriberToDelete.id);
      setPrescriberToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Coach & Prescriber Mode Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl liquid-glass hero-coach p-6 sm:p-7 shadow-2xl relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div
              onClick={() => {
                soundFx.playClick();
                setAvatarModalPrescriber(currentPrescriber);
              }}
              className="relative group cursor-pointer shrink-0"
              title="Clique para alterar sua foto de perfil"
            >
              <img
                src={currentPrescriber.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                alt={currentPrescriber.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-400/50 group-hover:ring-cyan-400 shadow-xl transition"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-xs">
                <Camera className="w-5 h-5 text-cyan-300" />
                <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Foto</span>
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center border border-white/20">
                {currentPrescriber.isAdmin ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-violet-400" />
                ) : currentPrescriber.isMaster ? (
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                )}
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 ${
                    currentPrescriber.isAdmin
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                      : currentPrescriber.isMaster
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {currentPrescriber.isAdmin ? (
                    <>
                      <ShieldCheck className="w-3 h-3" /> Administrador Geral
                    </>
                  ) : currentPrescriber.isMaster ? (
                    <>
                      <Crown className="w-3 h-3" /> Prescritor Master
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3" /> Prescritor Técnico
                    </>
                  )}
                </span>
                <span className="text-xs text-indigo-300 font-semibold">{currentPrescriber.roleType}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                {currentPrescriber.name}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                {currentPrescriber.isAdmin
                  ? '🛡️ Acesso Pleno de Administrador: você pode cadastrar prescritores, promovê-los a Master e gerenciar toda a equipe.'
                  : currentPrescriber.isMaster
                  ? '⭐ Permissões de Master: você pode cadastrar prescritores e alunos. Perfis de Administrador estão blindados contra alteração.'
                  : '📋 Painel Técnico: prescrição de treinos, dietas e acompanhamento de evolução dos alunos.'}
              </p>
            </div>
          </div>

          {/* Quick Actions & Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenNewStudent}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-400 text-white text-xs font-black shadow-xl shadow-indigo-950/60 transition flex items-center gap-1.5 border border-cyan-400/30"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Novo Aluno</span>
              </button>

              {isCurrentUserMaster && (
                <button
                  onClick={handleOpenNewPrescriber}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white text-xs font-black shadow-xl shadow-purple-950/60 transition flex items-center gap-1.5 border border-purple-400/30"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span>+ Novo Prescritor</span>
                </button>
              )}
            </div>

            {/* Main Tabs */}
            <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/10">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab('athletes');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'athletes'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Alunos ({athletesList.length})</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab('prescribers');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'prescribers'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Equipe & Prescritores ({prescribersList.length})</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab('prescriptions');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'prescriptions'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Prescrições
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total de Alunos</span>
            <p className="text-xl font-black text-white mt-0.5">{athletesList.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Alunos Ativos</span>
            <p className="text-xl font-black text-emerald-300 mt-0.5">{activeAthletesCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/20">
            <span className="text-[10px] uppercase font-bold text-purple-300">Equipe Técnica</span>
            <p className="text-xl font-black text-purple-200 mt-0.5">
              {prescribersList.length} especialistas
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/20">
            <span className="text-[10px] uppercase font-bold text-amber-400">Prescritores Master</span>
            <p className="text-xl font-black text-amber-300 mt-0.5">
              {prescribersList.filter((p) => p.isMaster).length}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* TAB 1: PRESCRIBERS & TEAM MANAGEMENT (ADMIN & MASTER) */}
      {/* ======================================================== */}
      {activeTab === 'prescribers' && (
        <div className="space-y-6">
          {/* Quick Simulation Bar (Switch current logged prescriber to test rules) */}
          <div className="p-4 rounded-3xl liquid-glass border border-white/10 bg-slate-900/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Testar / Alternar Perfil Ativo da Equipe:
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Alterne para testar as regras de permissão em tempo real.
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {prescribersList.map((p) => {
                const isActive = currentPrescriber.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      soundFx.playClick();
                      onSelectPrescriber(p);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold transition ${
                      isActive
                        ? 'bg-indigo-600/40 text-white border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-full object-cover" />
                    <span>{p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}</span>
                    {p.isAdmin && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-violet-500/30 text-violet-300 border border-violet-500/40">
                        ADMIN
                      </span>
                    )}
                    {p.isMaster && !p.isAdmin && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/30 text-amber-300 border border-amber-500/40">
                        MASTER
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Role Filters for Prescribers */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 w-full lg:w-96">
              <Search className="w-4 h-4 text-purple-400 ml-2 shrink-0" />
              <input
                type="text"
                placeholder="Buscar prescritor por nome, função, telefone..."
                value={prescriberSearchQuery}
                onChange={(e) => setPrescriberSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-full py-1"
              />
              {prescriberSearchQuery && (
                <button
                  onClick={() => setPrescriberSearchQuery('')}
                  className="text-slate-400 hover:text-white text-xs px-2"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
                {[
                  { key: 'todos', label: 'Todos' },
                  { key: 'admin', label: '🛡️ Admins' },
                  { key: 'master', label: '👑 Masters' },
                  { key: 'Head Coach', label: 'Head Coach' },
                  { key: 'Nutricionista', label: 'Nutrição' },
                  { key: 'Médico', label: 'Médicos' },
                  { key: 'Fisioterapeuta', label: 'Fisioterapia' }
                ].map((roleFilter) => (
                  <button
                    key={roleFilter.key}
                    onClick={() => {
                      soundFx.playClick();
                      setPrescriberRoleFilter(roleFilter.key);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      prescriberRoleFilter === roleFilter.key
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {roleFilter.label}
                  </button>
                ))}
              </div>

              {isCurrentUserMaster && (
                <button
                  onClick={handleOpenNewPrescriber}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 border border-purple-400/30"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Cadastrar Prescritor</span>
                </button>
              )}
            </div>
          </div>

          {/* Prescribers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPrescribers.map((p) => {
              const isTargetAdmin = Boolean(p.isAdmin);
              const isMasterBlockedFromEditingAdmin = !isCurrentUserAdmin && isTargetAdmin;
              const isSelf = currentPrescriber.id === p.id;
              const age = calculateAge(p.birthDate);

              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-5 rounded-3xl liquid-glass border transition relative overflow-hidden flex flex-col justify-between ${
                    isTargetAdmin
                      ? 'border-violet-500/40 bg-gradient-to-b from-violet-950/20 via-slate-900/60 to-slate-950/80 shadow-lg shadow-violet-950/20'
                      : p.isMaster
                      ? 'border-amber-500/30 bg-gradient-to-b from-amber-950/15 via-slate-900/60 to-slate-950/80 shadow-lg shadow-amber-950/10'
                      : 'border-white/10 bg-slate-900/60 hover:border-white/20'
                  }`}
                >
                  <div>
                    {/* Top row: Badges & Status */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {p.isAdmin ? (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-violet-600/30 text-violet-200 border border-violet-500/50 flex items-center gap-1 shadow-sm">
                            <ShieldCheck className="w-3 h-3 text-violet-300" /> ADMINISTRADOR GERAL
                          </span>
                        ) : p.isMaster ? (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                            <Crown className="w-3 h-3" /> PRESCRITOR MASTER
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                            Prescritor Técnico
                          </span>
                        )}

                        {isMasterBlockedFromEditingAdmin && (
                          <span
                            className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                            title="Prescritores Master não podem editar ou excluir Administradores"
                          >
                            <Lock className="w-2.5 h-2.5" /> Blindado
                          </span>
                        )}
                      </div>

                      {/* Status pill */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          p.status === 'Ativo'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    {/* Prescriber Identification */}
                    <div className="flex items-center gap-3.5 mb-4">
                      <div
                        onClick={() => {
                          if (isMasterBlockedFromEditingAdmin) return;
                          soundFx.playClick();
                          setAvatarModalPrescriber(p);
                        }}
                        className={`relative group shrink-0 ${
                          isMasterBlockedFromEditingAdmin ? 'cursor-default' : 'cursor-pointer'
                        }`}
                        title={
                          isMasterBlockedFromEditingAdmin
                            ? 'Perfil de Administrador Blindado'
                            : 'Clique para alterar foto de perfil'
                        }
                      >
                        <img
                          src={p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                          alt={p.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/15 group-hover:ring-cyan-400 shadow-md transition"
                        />
                        {!isMasterBlockedFromEditingAdmin && (
                          <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-xs">
                            <Camera className="w-4 h-4 text-cyan-300" />
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                            p.status === 'Ativo' ? 'bg-emerald-400' : 'bg-rose-500'
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-black text-white truncate leading-tight">{p.name}</h4>
                        <p className="text-xs font-semibold text-purple-300 truncate mt-0.5">{p.roleType}</p>
                        {p.crm_crn_cref && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.crm_crn_cref}</p>
                        )}
                      </div>
                    </div>

                    {/* Detailed Data: Phone, Birthdate, Age, Email */}
                    <div className="space-y-2 text-xs p-3 rounded-2xl bg-black/40 border border-white/5 mb-4">
                      {/* Phone / WhatsApp */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Telefone:</span>
                        </span>
                        <a
                          href={`https://wa.me/55${p.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-emerald-300 hover:underline flex items-center gap-1"
                        >
                          <span>{p.phone}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                      </div>

                      {/* Birthdate & Age */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          <span>Nascimento:</span>
                        </span>
                        <span className="text-white font-medium">
                          {formatDateBr(p.birthDate)} {age ? `(${age} anos)` : ''}
                        </span>
                      </div>

                      {/* Email */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>E-mail:</span>
                        </span>
                        <span className="text-slate-200 truncate max-w-[150px] font-mono text-[11px]">
                          {p.email}
                        </span>
                      </div>

                      {/* Access / Password Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-violet-400" />
                          <span>Autenticação:</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              p.requiresPasswordChange
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {p.requiresPasswordChange ? '⚠️ 1º Acesso' : '✓ Ativa'}
                          </span>

                          {/* Reset Password Button for Prescribers (Admin or Master) */}
                          {(!isMasterBlockedFromEditingAdmin || isCurrentUserAdmin) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                soundFx.playClick();
                                setResetPasswordTarget({
                                  id: p.id,
                                  name: p.name,
                                  phone: p.phone,
                                  roleLabel: p.roleType,
                                  type: 'prescriber',
                                  isAdmin: p.isAdmin,
                                  isMaster: p.isMaster,
                                  currentPassword: p.accessPassword
                                });
                              }}
                              className="px-2 py-0.5 rounded-md bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 text-[10px] font-bold flex items-center gap-1 transition border border-violet-500/30"
                              title="Redefinir senha de acesso deste prescritor"
                            >
                              <KeyRound className="w-2.5 h-2.5 text-violet-300" />
                              <span>Resetar</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Created By Info */}
                      {p.createdBy && (
                        <div className="pt-1.5 mt-1 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Criado por:</span>
                          <span className="text-slate-300 font-semibold">{p.createdBy.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Bio excerpt if present */}
                    {p.bio && (
                      <p className="text-[11px] text-slate-300 italic line-clamp-2 mb-4 bg-white/5 p-2 rounded-xl border border-white/5">
                        "{p.bio}"
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    {/* Toggle Active Button */}
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        onTogglePrescriberStatus(p.id);
                      }}
                      disabled={isMasterBlockedFromEditingAdmin}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                        isMasterBlockedFromEditingAdmin
                          ? 'opacity-40 cursor-not-allowed bg-white/5 text-slate-500 border-white/5'
                          : p.status === 'Ativo'
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/20'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{p.status === 'Ativo' ? 'Desativar' : 'Ativar'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Edit Button */}
                      <button
                        onClick={(e) => handleOpenEditPrescriber(p, e)}
                        disabled={isMasterBlockedFromEditingAdmin}
                        className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 border ${
                          isMasterBlockedFromEditingAdmin
                            ? 'opacity-40 cursor-not-allowed bg-white/5 text-slate-500 border-white/5'
                            : 'bg-white/5 hover:bg-white/15 text-slate-200 border-white/10'
                        }`}
                        title={
                          isMasterBlockedFromEditingAdmin
                            ? 'Prescritores Master não podem alterar dados de um Administrador'
                            : 'Editar prescritor'
                        }
                      >
                        {isMasterBlockedFromEditingAdmin ? (
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <Edit className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        <span className="hidden sm:inline">Editar</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleOpenDeletePrescriber(p, e)}
                        disabled={isMasterBlockedFromEditingAdmin}
                        className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 border ${
                          isMasterBlockedFromEditingAdmin
                            ? 'opacity-40 cursor-not-allowed bg-white/5 text-slate-500 border-white/5'
                            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/20'
                        }`}
                        title={
                          isMasterBlockedFromEditingAdmin
                            ? 'Prescritores Master não podem excluir um Administrador'
                            : 'Excluir prescritor'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ATHLETES / STUDENTS LIST & MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'athletes' && (
        <div className="space-y-5">
          {/* Search, Status & Goal filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 w-full lg:w-96">
              <Search className="w-4 h-4 text-indigo-400 ml-2 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF, telefone ou categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-full py-1"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-white text-xs px-2"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter by Status */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">Status:</span>
                {[
                  { key: 'todos', label: 'Todos' },
                  { key: 'ativo', label: '🟢 Ativos' },
                  { key: 'inativo', label: '⚪ Inativos' }
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedStatusFilter(st.key);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedStatusFilter === st.key
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Filter by Goal */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {['todos', 'Hipertrofia', 'Cutting', 'Manutenção'].map((goal) => (
                  <button
                    key={goal}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedGoalFilter(goal);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      selectedGoalFilter === goal
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {goal === 'todos' ? 'Todos os Objetivos' : goal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Athletes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAthletes.map((ath) => {
              const isSelected = currentAthlete.id === ath.id;
              const isInactive = ath.status === 'Inativo';

              return (
                <motion.div
                  key={ath.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-5 rounded-3xl liquid-glass border transition relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/30 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                      : isInactive
                      ? 'border-white/5 bg-slate-950/40 opacity-75'
                      : 'border-white/10 bg-slate-900/60 hover:border-indigo-500/40'
                  }`}
                >
                  <div>
                    {/* Header Row: Status, CPF, & Actions */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            ath.status === 'Ativo'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : ath.status === 'Fase de Pico'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {ath.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-slate-300 border border-white/5">
                          {ath.goal}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleOpenEditStudent(ath, e)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition"
                          title="Editar cadastro do aluno"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleOpenDeleteStudent(ath, e)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition"
                          title="Excluir aluno"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Athlete Avatar and Info */}
                    <div className="flex items-center gap-3.5 mb-4">
                      <img
                        src={ath.avatar}
                        alt={ath.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/15 shadow-md"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-black text-white truncate">{ath.name}</h4>
                        <p className="text-xs text-slate-300 truncate">{ath.category}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          CPF: {ath.cpf || 'Não informado'}
                        </p>
                      </div>
                    </div>

                    {/* Quick Data Grid (WhatsApp, BirthDate, Password) */}
                    <div className="space-y-1.5 text-xs p-3 rounded-2xl bg-black/40 border border-white/5 mb-4 font-mono">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 font-sans flex items-center gap-1">
                          <Phone className="w-3 h-3 text-cyan-400" /> WhatsApp:
                        </span>
                        <span className="font-bold">{ath.phone || '(11) 98765-4321'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 font-sans flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-blue-400" /> Nascimento:
                        </span>
                        <span>{formatDateBr(ath.birthDate)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 font-sans flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-amber-400" /> Senha App:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-300 font-bold">••••••</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundFx.playClick();
                              setResetPasswordTarget({
                                id: ath.id,
                                name: ath.name,
                                phone: ath.phone,
                                roleLabel: ath.category || 'Aluno',
                                type: 'athlete',
                                currentPassword: ath.accessPassword
                              });
                            }}
                            className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition border border-amber-500/30"
                            title="Redefinir senha de acesso do aluno"
                          >
                            <KeyRound className="w-2.5 h-2.5" />
                            <span>Resetar</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Adherence & Weight */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-slate-400">Peso Atual / Meta</span>
                        <p className="font-bold text-white mt-0.5">
                          {ath.currentWeightKg} kg <span className="text-slate-400 font-normal">→ {ath.targetWeightKg} kg</span>
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-slate-400">Adesão Prescrita</span>
                        <p className="font-bold text-cyan-400 mt-0.5">{ath.adherencePercentage}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Select or Toggle Status */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        onToggleAthleteStatus(ath.id);
                      }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                        ath.status === 'Ativo'
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/20'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{ath.status === 'Ativo' ? 'Desativar' : 'Ativar Aluno'}</span>
                    </button>

                    <button
                      onClick={() => {
                        soundFx.playClick();
                        onSelectAthlete(ath);
                      }}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      <span>{isSelected ? 'Aluno em Foco' : 'Ver Ficha'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PRESCRIPTIONS & WORKOUT SPLITS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl liquid-glass border border-orange-500/30 bg-orange-950/20">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                Grade Semanal Ativa
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">
                Periodização & Grade de Treinamento
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Aluno em foco: <strong className="text-white">{currentAthlete.name}</strong> •{' '}
                {workoutSplits.length} sessões semanais
              </p>
            </div>

            {onNavigateToWorkout && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  onNavigateToWorkout();
                }}
                className="px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-orange-950/50 shrink-0"
              >
                <Dumbbell className="w-4 h-4" />
                <span>Abrir & Editar Grade no Módulo de Treino →</span>
              </button>
            )}
          </div>

          {/* Workout Days 1-7 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workoutSplits.map((split) => {
              const hasCardio = Boolean(split.cardioOrientation?.enabled || split.cardioProtocol);
              return (
                <div
                  key={split.id}
                  className="p-4 rounded-3xl liquid-glass border border-white/10 bg-slate-900/60 space-y-3 hover:border-orange-500/30 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-lg border border-orange-500/30">
                          {split.code}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {split.dayOfWeek}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100 mt-1 leading-snug">
                        {split.name}
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {split.estimatedDurationMinutes} min
                    </span>
                  </div>

                  {/* Muscle Groups */}
                  <div className="flex flex-wrap gap-1">
                    {split.targetMuscleGroups.map((m) => (
                      <span
                        key={m}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5"
                      >
                        {m}
                      </span>
                    ))}
                  </div>

                  {/* Exercises Count */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-orange-400" />
                      <strong>{split.exercises.length}</strong> exercícios prescritos
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {split.exercises.reduce((acc, e) => acc + e.sets.length, 0)} séries
                    </span>
                  </div>

                  {/* Daily Cardio Badge / Info */}
                  {hasCardio ? (
                    <div className="p-2.5 rounded-xl bg-teal-950/30 border border-teal-500/20 text-xs space-y-1">
                      <div className="flex items-center justify-between text-teal-300 font-bold text-[11px]">
                        <span className="flex items-center gap-1">
                          <HeartPulse className="w-3.5 h-3.5 text-teal-400" />
                          {split.cardioOrientation?.type || split.cardioProtocol?.type}
                        </span>
                        <span>
                          {split.cardioOrientation?.durationMinutes || split.cardioProtocol?.durationMinutes} min
                        </span>
                      </div>
                      <p className="text-[10px] text-teal-200 line-clamp-1 italic">
                        "{split.cardioOrientation?.instructions || split.cardioProtocol?.intensity}"
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-[10px] text-slate-400 text-center">
                      Sem cardio prescrito neste dia (Foco Muscular)
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Diet Plan Summary */}
            <div className="p-5 rounded-3xl liquid-glass border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Utensils className="w-5 h-5" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white">Plano Nutricional</h4>
                </div>
                {onUpdateNutritionPlan && (
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setIsEditDietModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar Dieta</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Meta de <strong>{nutritionPlan.dailyTargetCalories} kcal</strong> e <strong>{nutritionPlan.dailyTargetProteinG}g de proteína</strong>.
              </p>
              <div className="space-y-1.5 text-xs text-slate-200">
                {nutritionPlan.meals.map((m) => (
                  <div key={m.id} className="p-2 rounded-xl bg-white/5 flex justify-between">
                    <span className="font-bold">R{m.number} ({m.timeSchedule})</span>
                    <span className="text-emerald-400 font-bold">{m.targetCaloriesKcal} kcal</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Supplement Protocols Summary */}
            <div className="p-5 rounded-3xl liquid-glass border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-400">
                  <Pill className="w-5 h-5" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white">Protocolos Médicos & Fórmulas</h4>
                </div>
                {onNavigateToSupplements && (
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onNavigateToSupplements();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-bold border border-purple-500/40 transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Gerenciar Fórmulas →</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-300">{supplements.length} fórmulas ativas com acompanhamento laboratorial.</p>
              <div className="space-y-1.5 text-xs text-slate-200">
                {supplements.map((s) => (
                  <div key={s.id} className="p-2 rounded-xl bg-white/5 flex justify-between truncate">
                    <span className="font-bold truncate max-w-[200px]">{s.name}</span>
                    <span className="text-purple-300 text-[11px] shrink-0">{s.schedule.split('(')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Registration / Edit Modal */}
      <AnimatePresence>
        {isStudentModalOpen && (
          <StudentModal
            isOpen={isStudentModalOpen}
            onClose={() => {
              setIsStudentModalOpen(false);
              setAthleteToEdit(null);
            }}
            onSave={handleSaveStudent}
            athleteToEdit={athleteToEdit}
          />
        )}
      </AnimatePresence>

      {/* Student Delete Confirmation Modal */}
      <AnimatePresence>
        {athleteToDelete && (
          <DeleteConfirmModal
            isOpen={Boolean(athleteToDelete)}
            athlete={athleteToDelete}
            onClose={() => setAthleteToDelete(null)}
            onConfirm={handleConfirmDeleteStudent}
          />
        )}
      </AnimatePresence>

      {/* Prescriber Registration / Edit Modal */}
      <AnimatePresence>
        {isPrescriberModalOpen && (
          <PrescriberModal
            isOpen={isPrescriberModalOpen}
            onClose={() => {
              setIsPrescriberModalOpen(false);
              setPrescriberToEdit(null);
            }}
            onSave={handleSavePrescriber}
            prescriberToEdit={prescriberToEdit}
            isCurrentUserAdmin={isCurrentUserAdmin}
            currentUser={currentPrescriber}
          />
        )}
      </AnimatePresence>

      {/* Prescriber Delete Confirmation Modal */}
      <AnimatePresence>
        {prescriberToDelete && (
          <PrescriberDeleteModal
            isOpen={Boolean(prescriberToDelete)}
            prescriber={prescriberToDelete}
            onClose={() => setPrescriberToDelete(null)}
            onConfirm={handleConfirmDeletePrescriber}
            isCurrentUserAdmin={isCurrentUserAdmin}
          />
        )}
      </AnimatePresence>

      {/* Change Avatar Modal for Prescriber / Admin */}
      <ChangeAvatarModal
        isOpen={Boolean(avatarModalPrescriber)}
        onClose={() => setAvatarModalPrescriber(null)}
        title={
          avatarModalPrescriber?.isAdmin
            ? 'Alterar Foto do Administrador'
            : 'Alterar Foto do Prescritor'
        }
        subtitle={
          avatarModalPrescriber
            ? `Atualize a foto de perfil de ${avatarModalPrescriber.name} (${avatarModalPrescriber.roleType})`
            : ''
        }
        currentAvatar={avatarModalPrescriber?.avatar || ''}
        onSaveAvatar={(newAvatarUrl) => {
          if (avatarModalPrescriber) {
            onUpdatePrescriber({
              ...avatarModalPrescriber,
              avatar: newAvatarUrl
            });
            setAvatarModalPrescriber(null);
          }
        }}
      />

      {/* Edit Nutrition Plan Modal for Coach */}
      <AnimatePresence>
        {isEditDietModalOpen && onUpdateNutritionPlan && (
          <EditNutritionPlanModal
            isOpen={isEditDietModalOpen}
            onClose={() => setIsEditDietModalOpen(false)}
            nutritionPlan={nutritionPlan}
            athleteWeightKg={currentAthlete?.currentWeightKg || 80}
            onSave={(updatedPlan) => {
              onUpdateNutritionPlan(updatedPlan);
            }}
          />
        )}
      </AnimatePresence>

      {/* Admin / Master Password Reset Modal */}
      <AnimatePresence>
        {resetPasswordTarget && (
          <ResetPasswordModal
            isOpen={Boolean(resetPasswordTarget)}
            targetUser={resetPasswordTarget}
            currentUser={currentPrescriber}
            onClose={() => setResetPasswordTarget(null)}
            onConfirmReset={(newPassword, requiresChange) => {
              if (onResetPassword && resetPasswordTarget) {
                onResetPassword(
                  resetPasswordTarget.id,
                  newPassword,
                  requiresChange,
                  resetPasswordTarget.type
                );
              }
              setResetPasswordTarget(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
