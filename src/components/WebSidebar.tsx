import React from 'react';
import { motion } from 'motion/react';
import {
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
  ShieldAlert
} from 'lucide-react';
import { ModuleType, UserRole, AthleteProfile, CloudSyncStatus } from '../types';
import { soundFx } from '../utils/audio';
import { NAVIGATION_DESTINATIONS } from '../config/navigation';

interface WebSidebarProps {
  activeModule: ModuleType;
  onSelectModule: (module: ModuleType) => void;
  currentRole: UserRole;
  onRoleToggle?: () => void;
  canSwitchRole?: boolean;
  canAccessAdmin?: boolean;
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

export const WebSidebar: React.FC<WebSidebarProps> = ({
  activeModule,
  onSelectModule,
  currentRole,
  canSwitchRole = false,
  canAccessAdmin = false,
  currentAthlete,
  isCollapsed,
  onToggleCollapse,
  onOpenCommandPalette,
  onOpenReportModal,
  onOpenRoomSchemaModal,
  onOpenKeyboardShortcuts,
  theme,
  onToggleTheme,
  syncStatus,
  onTriggerSync
}) => {
  const isLight = theme === 'light';

  // Check if current user is allowed to access user maintenance / administration
  const isUserAdminOrCoach = canAccessAdmin || currentRole === 'admin' || currentRole === 'coach' || (canSwitchRole && (currentRole === 'coach' || currentRole === 'admin'));

  // Standard modules to display in sidebar (excluding coach_admin which is conditionally shown)
  const sidebarItems = NAVIGATION_DESTINATIONS.filter(
    (d) => !d.requiresPrescriber
  );

  return (
    <aside
      aria-label="Barra lateral de navegação"
      className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen z-30 transition-all duration-300 border-r ${
        isCollapsed ? 'w-20' : 'w-72'
      } ${
        isLight
          ? 'bg-white/90 border-slate-200 shadow-xl shadow-slate-200/40 backdrop-blur-2xl text-slate-800'
          : 'bg-slate-950/80 border-white/10 shadow-2xl backdrop-blur-2xl text-slate-200'
      }`}
    >
      {/* Athlete Profile Snippet */}
      <div
        className={`p-3 border-b ${
          isLight ? 'border-slate-200' : 'border-white/10'
        } ${isCollapsed ? 'flex flex-col items-center gap-2' : 'flex items-center justify-between gap-2'}`}
      >
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            onSelectModule('profile');
          }}
          className={`flex items-center gap-3 p-2 rounded-2xl cursor-pointer transition text-left ${
            isCollapsed ? 'w-full justify-center' : 'flex-1 min-w-0'
          } ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
              : 'bg-white/5 hover:bg-white/10 border border-white/5'
          }`}
          title="Ver perfil e ficha do atleta (Tecla 2)"
        >
          <div className="relative shrink-0">
            <img
              src={currentAthlete.avatar}
              alt=""
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/40"
            />
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950"
              aria-hidden="true"
            />
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p
                className={`text-xs font-bold truncate ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {currentAthlete.name}
              </p>
              <p
                className={`text-[11px] truncate mt-0.5 ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {currentAthlete.category} •{' '}
                <span
                  className={`${
                    isLight ? 'text-emerald-700' : 'text-emerald-400'
                  } font-semibold`}
                >
                  {currentAthlete.goal}
                </span>
              </p>
            </div>
          )}
        </button>

        {/* Collapse toggle button */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            onToggleCollapse();
          }}
          className={`p-2 rounded-xl transition shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
              : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white'
          }`}
          aria-label={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Search / Command Palette Bar */}
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            onOpenCommandPalette();
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl border transition text-xs min-h-[44px] ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 font-medium'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
          }`}
          title="Buscar ou executar comando (Ctrl + K)"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-500" aria-hidden="true" />
            {!isCollapsed && <span>Buscar módulo ou comando...</span>}
          </div>
          {!isCollapsed && (
            <kbd
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono border ${
                isLight
                  ? 'bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Main Navigation Modules */}
      <nav aria-label="Menu principal" className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
        <div className="px-2 py-1">
          {!isCollapsed && (
            <span
              className={`text-[10px] uppercase font-black tracking-wider ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Módulos Principais
            </span>
          )}
        </div>

        {sidebarItems.map((item) => {
          const isActive = activeModule === item.id;
          const Icon = item.icon;
          const accentColor = isLight ? item.lightAccentColor : item.accentColor;
          const bgColor = isLight ? item.lightBgColor : item.bgColor;

          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                soundFx.playClick();
                onSelectModule(item.id);
              }}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-medium transition-all group min-h-[44px] ${
                isActive
                  ? isLight
                    ? 'text-slate-950 font-bold shadow-sm'
                    : 'text-white font-bold shadow-lg'
                  : isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title={`${item.label} (Tecla ${item.shortcut})`}
            >
              {/* Active Pill Background */}
              {isActive && (
                <motion.div
                  layoutId="webSidebarActivePill"
                  className={`absolute inset-0 rounded-2xl border ${
                    isLight ? 'border-slate-300' : 'border-white/20'
                  }`}
                  style={{
                    backgroundColor: bgColor,
                    boxShadow: isLight
                      ? `0 2px 10px ${accentColor}25`
                      : `0 4px 18px ${accentColor}25`
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}

              {/* Icon */}
              <div
                className="relative z-10 w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                style={{
                  color: isActive ? accentColor : undefined
                }}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>

              {/* Label */}
              {!isCollapsed && (
                <span
                  className={`relative z-10 text-xs truncate flex-1 text-left ${
                    isActive
                      ? isLight
                        ? 'text-slate-950 font-bold'
                        : 'text-white font-bold'
                      : isLight
                      ? 'text-slate-800'
                      : 'text-slate-200'
                  }`}
                >
                  {item.label}
                </span>
              )}

              {/* Keyboard shortcut badge */}
              {!isCollapsed && (
                <span
                  className={`relative z-10 px-1.5 py-0.5 rounded text-[10px] font-mono transition-opacity ${
                    isActive
                      ? isLight
                        ? 'bg-slate-200 text-slate-900 font-bold'
                        : 'bg-white/20 text-white'
                      : isLight
                      ? 'text-slate-500 bg-slate-100'
                      : 'text-slate-400 opacity-70 group-hover:opacity-100'
                  }`}
                  aria-label={`Atalho teclado número ${item.shortcut}`}
                >
                  {item.shortcut}
                </span>
              )}
            </button>
          );
        })}

        {/* User Maintenance & Admin View - Visible to Administrators and Prescribers */}
        {isUserAdminOrCoach && (
          <button
            type="button"
            id="sidebar-nav-user-maintenance"
            aria-current={activeModule === 'coach_admin' ? 'page' : undefined}
            onClick={() => {
              soundFx.playClick();
              onSelectModule('coach_admin');
            }}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-medium transition-all group min-h-[44px] ${
              activeModule === 'coach_admin'
                ? isLight
                  ? 'text-indigo-950 font-bold bg-indigo-50 border border-indigo-300 shadow-sm'
                  : 'text-white font-bold bg-indigo-900/60 border border-indigo-500/40 shadow-lg'
                : isLight
                ? 'text-indigo-700 hover:text-indigo-950 hover:bg-indigo-50/50'
                : 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-950/30'
            }`}
            title="Manutenção de Usuários (Alunos & Equipe) (Tecla 8)"
          >
            {activeModule === 'coach_admin' && (
              <motion.div
                layoutId="webSidebarActivePill"
                className={`absolute inset-0 rounded-2xl ${
                  isLight
                    ? 'bg-indigo-100/80 border border-indigo-300'
                    : 'bg-indigo-900/70 border border-indigo-400/40'
                }`}
              />
            )}
            <div className="relative z-10 w-7 h-7 rounded-xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-indigo-500" aria-hidden="true" />
            </div>
            {!isCollapsed && (
              <div className="relative z-10 flex-1 min-w-0 text-left">
                <span className="block text-xs truncate font-bold">
                  Manutenção de Usuários
                </span>
                <span className={`block text-[10px] truncate ${isLight ? 'text-indigo-600' : 'text-indigo-300/80'}`}>
                  {currentRole === 'admin' ? 'Alunos, Equipe & Admin' : 'Alunos & Equipe'}
                </span>
              </div>
            )}
            {!isCollapsed && (
              <span className="relative z-10 px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-400">
                8
              </span>
            )}
          </button>
        )}
      </nav>

      {/* Bottom Controls / Tools */}
      <div
        className={`p-3 border-t ${
          isLight ? 'border-slate-200' : 'border-white/10'
        } space-y-1.5`}
      >
        {/* Sync Status Button */}
        {syncStatus && onTriggerSync && (
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onTriggerSync();
            }}
            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold border transition min-h-[40px] ${
              !syncStatus.isOnline
                ? 'bg-amber-500/15 text-amber-500 border-amber-500/40'
                : syncStatus.pendingCount > 0
                ? 'bg-blue-500/15 text-blue-500 border-blue-500/40'
                : isLight
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}
            title="Sincronização com Nuvem e Room"
          >
            <div className="flex items-center gap-2 min-w-0">
              {syncStatus.isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" aria-hidden="true" />
              ) : !syncStatus.isOnline ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
              )}
              {!isCollapsed && (
                <span className="truncate">
                  {syncStatus.isSyncing ? 'Sincronizando...' : syncStatus.cloudProvider}
                </span>
              )}
            </div>
            {!isCollapsed && syncStatus.pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-400/20 text-amber-500 font-mono">
                {syncStatus.pendingCount}
              </span>
            )}
          </button>
        )}

        {/* Quick Utility Icon Grid */}
        <div className="grid grid-cols-4 gap-1 pt-1">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onOpenReportModal();
            }}
            className={`p-2 rounded-xl flex items-center justify-center transition min-w-[40px] min-h-[40px] ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
            title="Visualizar Laudo Físico em PDF (Tecla P)"
            aria-label="Visualizar Laudo Físico em PDF"
          >
            <FileText className="w-4 h-4 text-blue-500" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onToggleTheme();
            }}
            className={`p-2 rounded-xl flex items-center justify-center transition shrink-0 min-w-[40px] min-h-[40px] ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
            title={theme === 'dark' ? 'Mudar para Modo Claro (Tecla T)' : 'Mudar para Modo Escuro (Tecla T)'}
            aria-label={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
            )}
          </button>

          {onOpenRoomSchemaModal && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenRoomSchemaModal();
              }}
              className={`p-2 rounded-xl flex items-center justify-center transition min-w-[40px] min-h-[40px] ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
              title="Banco Room Local & Sync"
              aria-label="Banco Room Local e Sincronização"
            >
              <Database className="w-4 h-4 text-teal-500" aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onOpenKeyboardShortcuts();
            }}
            className={`p-2 rounded-xl flex items-center justify-center transition min-w-[40px] min-h-[40px] ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
            title="Atalhos de Teclado (Tecla ?)"
            aria-label="Atalhos de Teclado"
          >
            <Keyboard className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};
