import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  UserCheck,
  Flame,
  FileText,
  Bell,
  ChevronDown,
  User,
  Activity,
  Layers,
  Sparkles,
  Database,
  Cloud,
  CloudOff,
  RefreshCw,
  Wifi,
  WifiOff,
  LogOut,
  Smartphone,
  Download,
  Sun,
  Moon,
  MoreHorizontal,
  Search,
  Keyboard,
  X
} from 'lucide-react';
import { AthleteProfile, UserRole, ModuleType, CloudSyncStatus } from '../types';
import { soundFx } from '../utils/audio';
import { TeamLmBrand } from './TeamLmBrand';

interface HeaderProps {
  currentRole: UserRole;
  onRoleToggle?: () => void;
  canSwitchRole?: boolean;
  canSwitchAthlete?: boolean;
  activeModule: ModuleType;
  currentAthlete: AthleteProfile;
  athletesList: AthleteProfile[];
  onSelectAthlete: (athlete: AthleteProfile) => void;
  onOpenReportModal: () => void;
  onOpenRoomSchemaModal?: () => void;
  onOpenInstallAppModal?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenKeyboardShortcuts?: () => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  syncStatus?: CloudSyncStatus;
  onTriggerSync?: () => void;
  onToggleOnlineMode?: () => void;
  onLogout?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

const MODULE_TITLES: Record<ModuleType, { title: string; subtitle: string; color: string }> = {
  dashboard: {
    title: 'Dashboard Executivo',
    subtitle: 'Visão Geral & Performance Diária',
    color: '#0D1B2A'
  },
  profile: {
    title: 'Perfil & Avaliação Física',
    subtitle: 'Ficha Antropométrica e Biometria',
    color: '#1565C0'
  },
  nutrition: {
    title: 'Nutrição & Macronutrientes',
    subtitle: 'Plano Alimentar e Trocas Inteligentes',
    color: '#2E7D32'
  },
  workout: {
    title: 'Treinamento & Cardio',
    subtitle: 'Divisões A/B/C/D/E e Cronômetro de Séries',
    color: '#BF360C'
  },
  supplements: {
    title: 'Suplementação & Fórmulas',
    subtitle: 'Manipulados, Intra-Treino e Fitoterapia',
    color: '#4A148C'
  },
  recipes: {
    title: 'Receitas Fit Proteicas',
    subtitle: 'Catálogo Culinário Anabólico',
    color: '#00695C'
  },
  progress: {
    title: 'Evolução & Progresso',
    subtitle: 'Gráficos Temporais e Comparativo Visual',
    color: '#E65100'
  },
  coach_admin: {
    title: 'Painel Clínico & Treinador',
    subtitle: 'Gestão de Atletas e Prescrições',
    color: '#1e293b'
  }
};

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleToggle,
  canSwitchRole = false,
  canSwitchAthlete = false,
  activeModule,
  currentAthlete,
  athletesList,
  onSelectAthlete,
  onOpenReportModal,
  onOpenRoomSchemaModal,
  onOpenInstallAppModal,
  onOpenCommandPalette,
  onOpenKeyboardShortcuts,
  unreadNotificationsCount,
  onOpenNotifications,
  syncStatus,
  onTriggerSync,
  onToggleOnlineMode,
  onLogout,
  theme = 'dark',
  onToggleTheme
}) => {
  const [showAthleteDropdown, setShowAthleteDropdown] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const moduleInfo = MODULE_TITLES[activeModule] || MODULE_TITLES.dashboard;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-slate-950/75 border-b border-white/10 px-3 sm:px-6 py-2.5 sm:py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Identity & Current Screen Context */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className="relative group cursor-pointer shrink-0 lg:hidden"
            onClick={() => soundFx.playClick()}
            title="Team LM Consultoria Esportiva"
          >
            <TeamLmBrand size="sm" showText={false} animated />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-sm" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight leading-none truncate">
                {moduleInfo.title}
              </h1>
              <span className="hidden md:inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-white/10 text-slate-300 border border-white/10 shrink-0">
                LM TEAM
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[140px] sm:max-w-[220px] md:max-w-xs mt-0.5">
              {moduleInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Desktop Quick Command Search Trigger */}
        {onOpenCommandPalette && (
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenCommandPalette();
            }}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs transition max-w-xs flex-1 mx-4"
            title="Abrir busca rápida (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span className="truncate flex-1 text-left">Buscar atletas, módulos, ações...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-400 border border-white/10">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Right Controls: Theme Toggle, Athlete Selector, Role Pill, Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Day / Night Theme Switcher */}
          {onToggleTheme && (
            <button
              onClick={() => {
                soundFx.playClick();
                onToggleTheme();
              }}
              className={`p-2 rounded-2xl border transition shadow-sm ${
                theme === 'light'
                  ? 'bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/25'
                  : 'bg-white/10 text-cyan-300 border-white/15 hover:bg-white/15 hover:text-cyan-200'
              }`}
              title={theme === 'light' ? 'Mudar para Modo Noite (Dark)' : 'Mudar para Modo Dia (Light)'}
            >
              {theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500 animate-in spin-in-90 duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-300 animate-in spin-in-90 duration-300" />
              )}
            </button>
          )}

          {/* Desktop-only action buttons to prevent overflow on mobile */}
          {/* Cloud Sync Status & Offline-First Pill (Desktop) */}
          {syncStatus && onTriggerSync && (
            <button
              onClick={() => {
                soundFx.playClick();
                onTriggerSync();
              }}
              className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-xs font-semibold border transition shadow ${
                !syncStatus.isOnline
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                  : syncStatus.pendingCount > 0
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
              title={
                !syncStatus.isOnline
                  ? 'Modo Offline: Check-ins salvos no Room local. Clique para sincronizar.'
                  : syncStatus.pendingCount > 0
                  ? `${syncStatus.pendingCount} mutações pendentes na sync_queue. Clique para sincronizar.`
                  : `Online (${syncStatus.cloudProvider}): Room e Nuvem sincronizados.`
              }
            >
              {syncStatus.isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              ) : !syncStatus.isOnline ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>
                {syncStatus.isSyncing
                  ? 'Sincronizando...'
                  : !syncStatus.isOnline
                  ? 'Offline (Room)'
                  : syncStatus.pendingCount > 0
                  ? `${syncStatus.pendingCount} na Fila`
                  : syncStatus.cloudProvider}
              </span>
              {syncStatus.pendingCount > 0 && !syncStatus.isSyncing && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          )}

          {/* Room Database Architecture Button (Large screens only) */}
          {onOpenRoomSchemaModal && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenRoomSchemaModal();
              }}
              className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 text-xs font-semibold text-teal-300 border border-teal-500/30 transition shadow"
              title="Estrutura de Dados & Room Entities"
            >
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>Room & Sync</span>
            </button>
          )}

          {/* Install App on Phone Button (Medium/Large Screens) */}
          {onOpenInstallAppModal && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenInstallAppModal();
              }}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-semibold text-cyan-300 border border-cyan-500/30 transition shadow shadow-cyan-950/20"
              title="Instalar aplicativo no celular (PWA)"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Instalar</span>
            </button>
          )}

          {/* Quick PDF Report button (Large Screens) */}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenReportModal();
            }}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 transition"
            title="Visualizar laudo físico"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden xl:inline">Laudo PDF</span>
          </button>

          {/* Notifications Simulator */}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenNotifications();
            }}
            className="relative p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
            title="Lembretes e Avisos"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center shadow-lg">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* User Role Indicator Badge (Informational only - switching roles requires re-login) */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl text-xs font-bold shadow-md border shrink-0 ${
              currentRole === 'coach'
                ? 'bg-gradient-to-r from-indigo-700/80 to-purple-800/80 text-white border-indigo-500/40 shadow-indigo-900/30'
                : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30 shadow-emerald-950/20'
            }`}
            title={currentRole === 'coach' ? 'Sessão Profissional (Treinador/Admin)' : 'Sessão do Aluno'}
          >
            {currentRole === 'coach' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                <span>Painel Profissional</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Portal do Aluno</span>
              </>
            )}
          </div>

          {/* Athlete Profile / Selector Chip */}
          <div className="relative">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowAthleteDropdown(!showAthleteDropdown);
                setShowQuickMenu(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2.5 py-1 rounded-2xl liquid-glass border border-white/10 hover:border-white/20 transition group"
              title={canSwitchAthlete ? "Trocar atleta ou ver perfil" : "Ver perfil do aluno"}
            >
              <img
                src={currentAthlete.avatar}
                alt={currentAthlete.name}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-1 ring-cyan-400/40 shrink-0"
              />
              <span className="hidden sm:inline text-xs font-bold text-white max-w-[80px] lg:max-w-[120px] truncate">
                {currentAthlete.name.split(' ')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition shrink-0" />
            </button>

            {/* Athlete Dropdown */}
            {showAthleteDropdown && (
              <div className="absolute right-0 mt-2 w-72 rounded-3xl liquid-glass border border-white/15 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 bg-slate-900/95">
                {canSwitchAthlete ? (
                  <>
                    <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Atletas Cadastrados</p>
                      <span className="text-[10px] font-mono text-cyan-400">ID = WhatsApp</span>
                    </div>
                    <div className="py-1 space-y-1 max-h-60 overflow-y-auto">
                      {athletesList.map((ath) => (
                        <button
                          key={ath.id}
                          onClick={() => {
                            soundFx.playClick();
                            onSelectAthlete(ath);
                            setShowAthleteDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition ${
                            currentAthlete.id === ath.id
                              ? 'bg-blue-600/30 text-white border border-blue-500/40'
                              : 'hover:bg-white/5 text-slate-300'
                          }`}
                        >
                          <img src={ath.avatar} alt={ath.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{ath.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{ath.phone || '(11) 98765-4321'}</p>
                          </div>
                          {currentAthlete.id === ath.id && (
                            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-2 space-y-3">
                    <div className="flex items-center gap-3 pb-2 border-b border-white/10">
                      <img
                        src={currentAthlete.avatar}
                        alt={currentAthlete.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-400/40"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{currentAthlete.name}</p>
                        <p className="text-[10px] text-cyan-400 font-mono truncate">{currentAthlete.phone || 'Aluno Team LM'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{currentAthlete.category} • {currentAthlete.goal}</p>
                      </div>
                    </div>
                  </div>
                )}

                {onLogout && (
                  <div className="pt-2 mt-1 border-t border-white/10">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setShowAthleteDropdown(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Overflow Menu ("...") for Mobile & Tablet */}
          <div className="relative">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowQuickMenu(!showQuickMenu);
                setShowAthleteDropdown(false);
              }}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
              title="Mais opções"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Quick Actions Dropdown */}
            {showQuickMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-3xl liquid-glass border border-white/15 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 bg-slate-900/95 space-y-1">
                <div className="px-3 py-1.5 border-b border-white/10">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ações Rápidas</p>
                </div>

                {onOpenKeyboardShortcuts && (
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setShowQuickMenu(false);
                      onOpenKeyboardShortcuts();
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs font-semibold text-indigo-300 hover:bg-white/5 transition"
                  >
                    <Keyboard className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Atalhos de Teclado (?)</span>
                  </button>
                )}

                {onOpenInstallAppModal && (
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setShowQuickMenu(false);
                      onOpenInstallAppModal();
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs font-semibold text-cyan-300 hover:bg-white/5 transition"
                  >
                    <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Instalar no Celular (PWA)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    soundFx.playClick();
                    setShowQuickMenu(false);
                    onOpenReportModal();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-white/5 transition"
                >
                  <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Visualizar Laudo PDF</span>
                </button>

                {onOpenRoomSchemaModal && (
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setShowQuickMenu(false);
                      onOpenRoomSchemaModal();
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs font-semibold text-teal-300 hover:bg-white/5 transition"
                  >
                    <Database className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Room & Sync Database</span>
                  </button>
                )}

                {syncStatus && onTriggerSync && (
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setShowQuickMenu(false);
                      onTriggerSync();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      {syncStatus.isOnline ? (
                        <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span>{syncStatus.isOnline ? 'Sincronizar Nuvem' : 'Modo Offline (Room)'}</span>
                    </div>
                    {syncStatus.pendingCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {syncStatus.pendingCount}
                      </span>
                    )}
                  </button>
                )}

                {onLogout && (
                  <div className="pt-1.5 mt-1 border-t border-white/10">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setShowQuickMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs font-bold text-rose-300 hover:bg-rose-500/10 transition"
                    >
                      <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
