import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  User,
  Pill,
  ChefHat,
  FileText,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Keyboard,
  ShieldAlert,
  ChevronRight,
  Check
} from 'lucide-react';
import { ModuleType, UserRole } from '../types';
import { soundFx } from '../utils/audio';
import {
  getDestinationById,
  ATHLETE_PRIMARY_BOTTOM_IDS,
  ATHLETE_MORE_BOTTOM_IDS,
  COACH_PRIMARY_BOTTOM_IDS,
  COACH_MORE_BOTTOM_IDS
} from '../config/navigation';

interface LiquidNavbarProps {
  activeModule: ModuleType;
  onSelectModule: (module: ModuleType) => void;
  currentRole: UserRole;
  canAccessAdmin?: boolean;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenReportModal?: () => void;
  onOpenKeyboardShortcuts?: () => void;
}

export const LiquidNavbar: React.FC<LiquidNavbarProps> = ({
  activeModule,
  onSelectModule,
  currentRole,
  canAccessAdmin = false,
  theme = 'dark',
  onToggleTheme,
  onOpenReportModal,
  onOpenKeyboardShortcuts
}) => {
  const isLight = theme === 'light';
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [uiSounds, setUiSounds] = useState<boolean>(soundFx.isUiSoundEnabled());
  const [alarmSound, setAlarmSound] = useState<boolean>(soundFx.isAlarmSoundEnabled());
  const moreSheetRef = useRef<HTMLDivElement>(null);

  // Close "Mais" sheet on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMoreOpen) {
        setIsMoreOpen(false);
      }
    };
    if (isMoreOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMoreOpen]);

  const isCoach = currentRole === 'coach' || currentRole === 'admin' || canAccessAdmin;
  const primaryIds = isCoach ? COACH_PRIMARY_BOTTOM_IDS : ATHLETE_PRIMARY_BOTTOM_IDS;
  const moreIds = isCoach ? COACH_MORE_BOTTOM_IDS : ATHLETE_MORE_BOTTOM_IDS;

  const isCurrentInMore = moreIds.includes(activeModule);
  const activeInMoreItem = isCurrentInMore ? getDestinationById(activeModule) : null;

  const toggleUiSound = () => {
    const next = !uiSounds;
    soundFx.setUiSoundEnabled(next);
    setUiSounds(next);
    if (next) soundFx.playClick();
  };

  const toggleAlarmSound = () => {
    const next = !alarmSound;
    soundFx.setAlarmSoundEnabled(next);
    setAlarmSound(next);
    if (next) soundFx.playTick();
  };

  return (
    <>
      {/* Bottom Floating Navigation Dock - Exactly 5 items, no horizontal scroll */}
      <nav
        aria-label="Navegação principal móvel"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom,12px)] pt-1 px-3 pointer-events-none flex justify-center"
      >
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-auto w-full max-w-md liquid-dock rounded-3xl p-1 border shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-0.5 mb-2"
        >
          {primaryIds.map((id) => {
            const item = getDestinationById(id);
            const isActive = activeModule === item.id;
            const Icon = item.icon;
            const currentAccent = isLight ? item.lightAccentColor : item.accentColor;
            const currentBg = isLight ? item.lightBgColor : item.bgColor;

            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                onClick={() => {
                  soundFx.playClick();
                  setIsMoreOpen(false);
                  onSelectModule(item.id);
                }}
                className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-150 min-h-[48px] touch-manipulation select-none ${
                  isActive
                    ? isLight
                      ? 'text-slate-950 font-black'
                      : 'text-white font-black'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 active:scale-95'
                    : 'text-slate-400 hover:text-slate-200 active:scale-95'
                }`}
              >
                {/* Active Liquid Pill shape + background */}
                {isActive && (
                  <motion.div
                    layoutId="activeLiquidPill"
                    className={`absolute inset-0 rounded-2xl border ${
                      isLight ? 'border-slate-300 shadow-sm' : 'border-white/20 shadow-inner'
                    }`}
                    style={{
                      backgroundColor: currentBg,
                      boxShadow: isLight
                        ? `0 2px 10px ${currentAccent}25`
                        : `0 2px 14px ${currentAccent}30`
                    }}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}

                {/* Icon */}
                <div className="relative z-10 flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-150 ${
                      isActive ? 'scale-110' : ''
                    }`}
                    aria-hidden="true"
                    style={{ color: isActive ? currentAccent : undefined }}
                  />
                </div>

                {/* Text Label */}
                <span
                  className="relative z-10 text-[11px] font-bold tracking-tight mt-0.5 leading-none whitespace-nowrap transition-colors"
                  style={{
                    color: isActive ? (isLight ? '#0f172a' : '#ffffff') : undefined
                  }}
                >
                  {item.shortLabel}
                </span>

                {/* Active indicator dot */}
                {isActive && (
                  <motion.span
                    layoutId="activeDot"
                    className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: currentAccent }}
                  />
                )}
              </button>
            );
          })}

          {/* 5th Item: "Mais" Button */}
          <button
            type="button"
            aria-current={isCurrentInMore ? 'page' : undefined}
            aria-expanded={isMoreOpen}
            aria-haspopup="dialog"
            aria-label={
              isCurrentInMore && activeInMoreItem
                ? `Mais opções, ativo: ${activeInMoreItem.shortLabel}`
                : 'Mais opções de navegação'
            }
            onClick={() => {
              soundFx.playClick();
              setIsMoreOpen((prev) => !prev);
            }}
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-150 min-h-[48px] touch-manipulation select-none ${
              isCurrentInMore || isMoreOpen
                ? isLight
                  ? 'text-slate-950 font-black'
                  : 'text-white font-black'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 active:scale-95'
                : 'text-slate-400 hover:text-slate-200 active:scale-95'
            }`}
          >
            {(isCurrentInMore || isMoreOpen) && (
              <motion.div
                layoutId={isCurrentInMore ? 'activeLiquidPill' : undefined}
                className={`absolute inset-0 rounded-2xl border ${
                  isLight
                    ? 'border-indigo-300 bg-indigo-50/80 shadow-sm'
                    : 'border-indigo-500/30 bg-indigo-950/60 shadow-inner'
                }`}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}

            <div className="relative z-10 flex items-center justify-center">
              {isMoreOpen ? (
                <X className="w-5 h-5 text-indigo-400" aria-hidden="true" />
              ) : (
                <Menu
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isCurrentInMore ? 'scale-110 text-indigo-400' : ''
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>

            <span
              className="relative z-10 text-[11px] font-bold tracking-tight mt-0.5 leading-none whitespace-nowrap truncate max-w-[64px]"
              style={{
                color: isCurrentInMore || isMoreOpen ? (isLight ? '#0f172a' : '#ffffff') : undefined
              }}
            >
              {isCurrentInMore && activeInMoreItem ? activeInMoreItem.shortLabel : 'Mais'}
            </span>

            {/* Context Badge if active inside More */}
            {isCurrentInMore && (
              <span className="absolute -top-1 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-950" />
            )}
          </button>
        </motion.div>
      </nav>

      {/* Accessible "Mais" Bottom Sheet Drawer */}
      <AnimatePresence>
        {isMoreOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
            role="presentation"
            onClick={() => setIsMoreOpen(false)}
          >
            <motion.div
              ref={moreSheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="more-sheet-title"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-x modal-liquid-glass p-5 pb-10 shadow-2xl space-y-5 focus:outline-none"
            >
              {/* Drag Handle & Header */}
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-1 rounded-full bg-slate-400/40" />
                <div className="w-full flex items-center justify-between">
                  <div>
                    <h3
                      id="more-sheet-title"
                      className={`text-base font-bold ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      Mais Módulos & Ferramentas
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Selecione um destino ou altere preferências
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMoreOpen(false)}
                    aria-label="Fechar menu mais opções"
                    className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Explicit Access to Modules in "Mais" */}
              <div className="space-y-2">
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Módulos Adicionais
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {moreIds.map((id) => {
                    const item = getDestinationById(id);
                    const isActive = activeModule === item.id;
                    const Icon = item.icon;
                    const accent = isLight ? item.lightAccentColor : item.accentColor;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => {
                          soundFx.playClick();
                          setIsMoreOpen(false);
                          onSelectModule(item.id);
                        }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition min-h-[48px] ${
                          isActive
                            ? isLight
                              ? 'bg-slate-100 border-indigo-400 shadow-sm text-slate-900'
                              : 'bg-indigo-950/40 border-indigo-500/50 shadow-md text-white'
                            : isLight
                            ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: `${accent}20`,
                              borderColor: `${accent}40`,
                              color: accent
                            }}
                          >
                            <Icon className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <div>
                            <p className="text-sm font-bold leading-tight">{item.label}</p>
                            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} mt-0.5`}>
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Ativo
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tools & Preferences Section */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Preferências & Ferramentas
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Toggle Theme */}
                  {onToggleTheme && (
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        onToggleTheme();
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition min-h-[48px] ${
                        isLight
                          ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {theme === 'dark' ? (
                          <Sun className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Moon className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="text-xs font-semibold">Tema Visual</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400">
                        {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
                      </span>
                    </button>
                  )}

                  {/* PDF Report */}
                  {onOpenReportModal && (
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setIsMoreOpen(false);
                        onOpenReportModal();
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition min-h-[48px] ${
                        isLight
                          ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-semibold">Laudo Físico</span>
                      </div>
                      <span className="text-xs font-bold text-blue-400">Gerar PDF</span>
                    </button>
                  )}

                  {/* UI Sounds Independent Preference */}
                  <button
                    type="button"
                    onClick={toggleUiSound}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition min-h-[48px] ${
                      isLight
                        ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {uiSounds ? (
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-xs font-semibold">Sons de Interface</span>
                    </div>
                    <span className={`text-xs font-bold ${uiSounds ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {uiSounds ? 'Ligado' : 'Desligado'}
                    </span>
                  </button>

                  {/* Rest Alarm Independent Preference */}
                  <button
                    type="button"
                    onClick={toggleAlarmSound}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition min-h-[48px] ${
                      isLight
                        ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {alarmSound ? (
                        <Bell className="w-4 h-4 text-amber-400" />
                      ) : (
                        <BellOff className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-xs font-semibold">Alarme de Descanso</span>
                    </div>
                    <span className={`text-xs font-bold ${alarmSound ? 'text-amber-400' : 'text-slate-400'}`}>
                      {alarmSound ? 'Ativo' : 'Silencioso'}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
