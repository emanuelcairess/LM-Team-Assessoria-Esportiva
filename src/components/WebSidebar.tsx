import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  User,
  Utensils,
  Dumbbell,
  Pill,
  ChefHat,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Search,
  FileText,
  Sun,
  Moon,
  Database,
  Cloud,
  WifiOff,
  RefreshCw,
  Keyboard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Command
} from 'lucide-react';
import { ModuleType, UserRole, AthleteProfile, CloudSyncStatus } from '../types';
import { soundFx } from '../utils/audio';
import { TeamLmBrand } from './TeamLmBrand';

interface WebSidebarProps {
  activeModule: ModuleType;
  onSelectModule: (module: ModuleType) => void;
  currentRole: UserRole;
  onRoleToggle?: () => void;
  canSwitchRole?: boolean;
  currentAthlete: AthleteProfile;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCommandPalette: () => void;
  onOpenReportModal: () => void;
  onOpenRoomSchemaModal?: () => void;
  onOpenBrandAssetsModal?: () => void;
  onOpenKeyboardShortcuts: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  syncStatus?: CloudSyncStatus;
  onTriggerSync?: () => void;
  onLogout?: () => void;
}

interface NavItem {
  id: ModuleType;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
  accentColor: string;
  bgColor: string;
  shortcut: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Executivo',
    shortLabel: 'Início',
    icon: LayoutDashboard,
    accentColor: '#38bdf8',
    bgColor: 'rgba(13, 27, 42, 0.95)',
    shortcut: '1'
  },
  {
    id: 'profile',
    label: 'Perfil & Avaliação Física',
    shortLabel: 'Perfil',
    icon: User,
    accentColor: '#60a5fa',
    bgColor: 'rgba(21, 101, 192, 0.4)',
    shortcut: '2'
  },
  {
    id: 'nutrition',
    label: 'Nutrição & Dieta',
    shortLabel: 'Dieta',
    icon: Utensils,
    accentColor: '#4ade80',
    bgColor: 'rgba(46, 125, 50, 0.4)',
    shortcut: '3'
  },
  {
    id: 'workout',
    label: 'Treinamento & Cardio',
    shortLabel: 'Treino',
    icon: Dumbbell,
    accentColor: '#fb923c',
    bgColor: 'rgba(191, 54, 12, 0.4)',
    shortcut: '4'
  },
  {
    id: 'supplements',
    label: 'Suplementação',
    shortLabel: 'Fórmulas',
    icon: Pill,
    accentColor: '#c084fc',
    bgColor: 'rgba(74, 20, 140, 0.4)',
    shortcut: '5'
  },
  {
    id: 'recipes',
    label: 'Receitas Fit Proteicas',
    shortLabel: 'Receitas',
    icon: ChefHat,
    accentColor: '#2dd4bf',
    bgColor: 'rgba(0, 105, 92, 0.4)',
    shortcut: '6'
  },
  {
    id: 'progress',
    label: 'Evolução & Gráficos',
    shortLabel: 'Evolução',
    icon: TrendingUp,
    accentColor: '#f97316',
    bgColor: 'rgba(230, 81, 0, 0.4)',
    shortcut: '7'
  }
];

export const WebSidebar: React.FC<WebSidebarProps> = ({
  activeModule,
  onSelectModule,
  currentRole,
  onRoleToggle,
  canSwitchRole = false,
  currentAthlete,
  isCollapsed,
  onToggleCollapse,
  onOpenCommandPalette,
  onOpenReportModal,
  onOpenRoomSchemaModal,
  onOpenBrandAssetsModal,
  onOpenKeyboardShortcuts,
  theme,
  onToggleTheme,
  syncStatus,
  onTriggerSync,
  onLogout
}) => {
  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen z-30 transition-all duration-300 border-r ${
        isCollapsed ? 'w-20' : 'w-72'
      } ${
        theme === 'light'
          ? 'bg-white/85 border-slate-200/90 shadow-xl shadow-slate-200/40 backdrop-blur-2xl text-slate-800'
          : 'bg-slate-950/80 border-white/10 shadow-2xl backdrop-blur-2xl text-slate-200'
      }`}
    >
      {/* Brand Header */}
      <div className={`p-4 border-b ${theme === 'light' ? 'border-slate-200' : 'border-white/10'} flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3 min-w-0">
          <div
            onClick={() => {
              soundFx.playClick();
              if (onOpenBrandAssetsModal) {
                onOpenBrandAssetsModal();
              } else {
                onSelectModule('dashboard');
              }
            }}
            className="cursor-pointer shrink-0"
            title="Design System & Assets Oficiais LM Team"
          >
            <TeamLmBrand size="sm" showText={false} animated />
          </div>

          {!isCollapsed && (
            <div
              className="min-w-0 cursor-pointer"
              onClick={() => {
                soundFx.playClick();
                if (onOpenBrandAssetsModal) {
                  onOpenBrandAssetsModal();
                } else {
                  onSelectModule('dashboard');
                }
              }}
              title="Design System & Assets Oficiais LM Team"
            >
              <h2 className={`text-sm font-black tracking-tight flex items-center gap-1.5 leading-none ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 font-black">
                  TEAM LM
                </span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-purple-900/60 text-purple-300 border border-purple-500/30">
                  PRO
                </span>
              </h2>
              <p className={`text-[10px] font-bold tracking-widest uppercase truncate mt-0.5 ${
                theme === 'light' ? 'text-amber-700' : 'text-amber-400/90'
              }`}>
                CONSULTORIA
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={() => {
            soundFx.playClick();
            onToggleCollapse();
          }}
          className={`p-1.5 rounded-xl transition ${
            theme === 'light'
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
              : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white'
          }`}
          title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Athlete Profile Snippet */}
      <div className={`p-3 border-b ${theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
        <div
          onClick={() => {
            soundFx.playClick();
            onSelectModule('profile');
          }}
          className={`flex items-center gap-3 p-2 rounded-2xl cursor-pointer transition ${
            theme === 'light' ? 'bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200/80' : 'bg-white/5 hover:bg-white/10'
          }`}
          title="Ver perfil do atleta"
        >
          <div className="relative shrink-0">
            <img
              src={currentAthlete.avatar}
              alt={currentAthlete.name}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/40"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className={`text-xs font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {currentAthlete.name}
                </p>
              </div>
              <p className={`text-[10px] truncate mt-0.5 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                {currentAthlete.category} • <span className={`${theme === 'light' ? 'text-emerald-700' : 'text-emerald-400'} font-semibold`}>{currentAthlete.goal}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Search / Command Palette Bar */}
      <div className="px-3 pt-3">
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenCommandPalette();
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl border transition text-xs ${
            theme === 'light'
              ? 'bg-slate-100/90 hover:bg-slate-200/90 border-slate-300/80 text-slate-700 font-medium'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white'
          }`}
          title="Buscar ou executar comando (Ctrl + K)"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-500" />
            {!isCollapsed && <span>Buscar módulo ou atleta...</span>}
          </div>
          {!isCollapsed && (
            <kbd className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono border ${
              theme === 'light'
                ? 'bg-slate-200/80 text-slate-700 border-slate-300'
                : 'bg-white/10 text-slate-400 border-white/10'
            }`}>
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Main Navigation Modules */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
        <div className="px-2 py-1">
          {!isCollapsed && (
            <span className={`text-[10px] uppercase font-black tracking-wider ${
              theme === 'light' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Navegação Principal
            </span>
          )}
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = activeModule === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                soundFx.playClick();
                onSelectModule(item.id);
              }}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-medium transition-all group ${
                isActive
                  ? theme === 'light'
                    ? 'text-slate-900 font-bold shadow-md'
                    : 'text-white font-bold shadow-lg'
                  : theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
              title={item.label}
            >
              {/* Active Pill Background */}
              {isActive && (
                <motion.div
                  layoutId="webSidebarActivePill"
                  className={`absolute inset-0 rounded-2xl border ${
                    theme === 'light' ? 'border-slate-300' : 'border-white/20'
                  }`}
                  style={{
                    backgroundColor: theme === 'light' ? 'rgba(241, 245, 249, 0.95)' : item.bgColor,
                    boxShadow: theme === 'light' ? `0 4px 14px ${item.accentColor}25` : `0 4px 20px ${item.accentColor}25`
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}

              {/* Icon */}
              <div
                className="relative z-10 w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                style={{
                  color: isActive ? item.accentColor : undefined
                }}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Label */}
              {!isCollapsed && (
                <span className={`relative z-10 text-xs truncate flex-1 text-left ${
                  isActive
                    ? theme === 'light'
                      ? 'text-slate-900 font-bold'
                      : 'text-white font-bold'
                    : theme === 'light'
                    ? 'text-slate-700'
                    : 'text-slate-300'
                }`}>
                  {item.label}
                </span>
              )}

              {/* Keyboard shortcut badge */}
              {!isCollapsed && (
                <span
                  className={`relative z-10 px-1.5 py-0.5 rounded text-[10px] font-mono transition-opacity ${
                    isActive
                      ? theme === 'light'
                        ? 'bg-slate-200 text-slate-800 font-bold'
                        : 'bg-white/20 text-white'
                      : theme === 'light'
                      ? 'text-slate-500 bg-slate-100'
                      : 'text-slate-500 opacity-60 group-hover:opacity-100'
                  }`}
                >
                  {item.shortcut}
                </span>
              )}
            </button>
          );
        })}

        {/* Coach Admin View - Only for Prescribers/Admins */}
        {canSwitchRole && currentRole === 'coach' && (
          <button
            onClick={() => {
              soundFx.playClick();
              onSelectModule('coach_admin');
            }}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-medium transition-all group ${
              activeModule === 'coach_admin'
                ? 'text-white font-bold bg-indigo-900/60 border border-indigo-500/40 shadow-lg'
                : 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-950/30'
            }`}
            title="Painel Clínico & Gestão de Atletas"
          >
            {activeModule === 'coach_admin' && (
              <motion.div
                layoutId="webSidebarActivePill"
                className="absolute inset-0 rounded-2xl bg-indigo-900/70 border border-indigo-400/40"
              />
            )}
            <div className="relative z-10 w-7 h-7 rounded-xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
            </div>
            {!isCollapsed && (
              <span className="relative z-10 text-xs truncate flex-1 text-left font-bold text-white">
                Painel do Treinador
              </span>
            )}
            {!isCollapsed && (
              <span className="relative z-10 px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">
                8
              </span>
            )}
          </button>
        )}
      </div>

      {/* Bottom Controls / Tools */}
      <div className={`p-3 border-t ${theme === 'light' ? 'border-slate-200' : 'border-white/10'} space-y-1.5`}>
        {/* Sync Status Button */}
        {syncStatus && onTriggerSync && (
          <button
            onClick={() => {
              soundFx.playClick();
              onTriggerSync();
            }}
            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold border transition ${
              !syncStatus.isOnline
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : syncStatus.pendingCount > 0
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}
            title="Sincronização com Nuvem e Room"
          >
            <div className="flex items-center gap-2 min-w-0">
              {syncStatus.isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
              ) : !syncStatus.isOnline ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              {!isCollapsed && (
                <span className="truncate">
                  {syncStatus.isSyncing ? 'Sincronizando...' : syncStatus.cloudProvider}
                </span>
              )}
            </div>
            {!isCollapsed && syncStatus.pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-400/20 text-amber-300 font-mono">
                {syncStatus.pendingCount}
              </span>
            )}
          </button>
        )}

        {/* Quick Utility Icon Grid */}
        <div className="grid grid-cols-4 gap-1 pt-1">
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenReportModal();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition"
            title="Visualizar Laudo Físico em PDF (P)"
          >
            <FileText className="w-4 h-4 text-blue-400" />
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              onToggleTheme();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition"
            title={theme === 'dark' ? 'Mudar para Modo Claro (T)' : 'Mudar para Modo Escuro (T)'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-cyan-500" />
            )}
          </button>

          {onOpenRoomSchemaModal && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenRoomSchemaModal();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition"
              title="Banco Room Local & Sync"
            >
              <Database className="w-4 h-4 text-teal-400" />
            </button>
          )}

          <button
            onClick={() => {
              soundFx.playClick();
              onOpenKeyboardShortcuts();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition"
            title="Atalhos de Teclado (?)"
          >
            <Keyboard className="w-4 h-4 text-indigo-400" />
          </button>
        </div>
      </div>
    </aside>
  );
};
