import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  User,
  Utensils,
  Dumbbell,
  Pill,
  ChefHat,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { ModuleType, UserRole } from '../types';
import { soundFx } from '../utils/audio';

interface LiquidNavbarProps {
  activeModule: ModuleType;
  onSelectModule: (module: ModuleType) => void;
  currentRole: UserRole;
  canAccessAdmin?: boolean;
  theme?: 'light' | 'dark';
}

interface NavItem {
  id: ModuleType;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
  accentColor: string;
  lightAccentColor: string;
  bgColor: string;
  lightBgColor: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Início',
    icon: LayoutDashboard,
    accentColor: '#38bdf8',
    lightAccentColor: '#0284c7',
    bgColor: 'rgba(13, 27, 42, 0.9)',
    lightBgColor: 'rgba(2, 132, 199, 0.15)'
  },
  {
    id: 'profile',
    label: 'Perfil & Ficha',
    shortLabel: 'Perfil',
    icon: User,
    accentColor: '#60a5fa',
    lightAccentColor: '#2563eb',
    bgColor: 'rgba(21, 101, 192, 0.4)',
    lightBgColor: 'rgba(37, 99, 235, 0.15)'
  },
  {
    id: 'nutrition',
    label: 'Nutrição & Dieta',
    shortLabel: 'Dieta',
    icon: Utensils,
    accentColor: '#4ade80',
    lightAccentColor: '#16a34a',
    bgColor: 'rgba(46, 125, 50, 0.4)',
    lightBgColor: 'rgba(22, 163, 74, 0.15)'
  },
  {
    id: 'workout',
    label: 'Treinamento',
    shortLabel: 'Treino',
    icon: Dumbbell,
    accentColor: '#fb923c',
    lightAccentColor: '#ea580c',
    bgColor: 'rgba(191, 54, 12, 0.4)',
    lightBgColor: 'rgba(234, 88, 12, 0.15)'
  },
  {
    id: 'supplements',
    label: 'Suplementos',
    shortLabel: 'Fórmulas',
    icon: Pill,
    accentColor: '#c084fc',
    lightAccentColor: '#9333ea',
    bgColor: 'rgba(74, 20, 140, 0.4)',
    lightBgColor: 'rgba(147, 51, 234, 0.15)'
  },
  {
    id: 'recipes',
    label: 'Receitas Fit',
    shortLabel: 'Receitas',
    icon: ChefHat,
    accentColor: '#2dd4bf',
    lightAccentColor: '#0d9488',
    bgColor: 'rgba(0, 105, 92, 0.4)',
    lightBgColor: 'rgba(13, 148, 136, 0.15)'
  },
  {
    id: 'progress',
    label: 'Evolução',
    shortLabel: 'Evolução',
    icon: TrendingUp,
    accentColor: '#f97316',
    lightAccentColor: '#d97706',
    bgColor: 'rgba(230, 81, 0, 0.4)',
    lightBgColor: 'rgba(217, 119, 6, 0.15)'
  }
];

export const LiquidNavbar: React.FC<LiquidNavbarProps> = ({
  activeModule,
  onSelectModule,
  currentRole,
  canAccessAdmin = false,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';

  return (
    <nav className="lg:hidden fixed bottom-3 sm:bottom-5 inset-x-0 z-40 flex justify-center px-3 pointer-events-none">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto liquid-dock rounded-3xl p-1.5 sm:p-2 border shadow-2xl flex items-center gap-1 sm:gap-1.5 max-w-full overflow-x-auto no-scrollbar"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeModule === item.id;
          const Icon = item.icon;
          const currentAccent = isLight ? item.lightAccentColor : item.accentColor;
          const currentBg = isLight ? item.lightBgColor : item.bgColor;

          return (
            <button
              key={item.id}
              onClick={() => {
                soundFx.playClick();
                onSelectModule(item.id);
              }}
              className={`relative flex flex-col items-center justify-center py-2 px-2.5 sm:px-3.5 rounded-2xl transition-all duration-200 min-w-[50px] sm:min-w-[62px] ${
                isActive
                  ? isLight
                    ? 'text-slate-900 font-bold'
                    : 'text-white font-bold'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Liquid Active Background Pill with Motion */}
              {isActive && (
                <motion.div
                  layoutId="activeLiquidPill"
                  className={`absolute inset-0 rounded-2xl border ${
                    isLight ? 'border-slate-300 shadow-sm' : 'border-white/20 shadow-inner'
                  }`}
                  style={{
                    backgroundColor: currentBg,
                    boxShadow: isLight
                      ? `0 4px 14px ${currentAccent}25`
                      : `0 4px 20px ${currentAccent}30`
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon */}
              <div className="relative z-10">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                  style={{ color: isActive ? currentAccent : undefined }}
                />
              </div>

              {/* Label */}
              <span
                className="relative z-10 text-[10px] font-semibold tracking-tight mt-1 whitespace-nowrap transition-colors"
                style={{ color: isActive ? (isLight ? '#0f172a' : '#ffffff') : undefined }}
              >
                {item.shortLabel}
              </span>

              {/* Active glow dot */}
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

        {/* Extra tab if in coach mode and authorized */}
        {canAccessAdmin && currentRole === 'coach' && (
          <button
            onClick={() => {
              soundFx.playClick();
              onSelectModule('coach_admin');
            }}
            className={`relative flex flex-col items-center justify-center py-2 px-2.5 sm:px-3 rounded-2xl transition-all duration-200 ${
              activeModule === 'coach_admin'
                ? isLight
                  ? 'text-indigo-900 font-bold'
                  : 'text-white font-bold'
                : isLight
                ? 'text-indigo-600 hover:text-indigo-900'
                : 'text-indigo-400 hover:text-indigo-200'
            }`}
          >
            {activeModule === 'coach_admin' && (
              <motion.div
                layoutId="activeLiquidPill"
                className={`absolute inset-0 rounded-2xl ${
                  isLight
                    ? 'bg-indigo-100 border border-indigo-300 shadow-sm'
                    : 'bg-indigo-900/60 border border-indigo-500/40 shadow-inner'
                }`}
              />
            )}
            <ShieldAlert className="w-5 h-5 relative z-10" />
            <span className="relative z-10 text-[10px] font-semibold tracking-tight mt-1">Admin</span>
          </button>
        )}
      </motion.div>
    </nav>
  );
};
