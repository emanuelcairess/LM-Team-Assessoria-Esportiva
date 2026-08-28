import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  LayoutDashboard,
  User,
  Utensils,
  Dumbbell,
  Pill,
  ChefHat,
  TrendingUp,
  ShieldAlert,
  FileText,
  Sun,
  Moon,
  Database,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Command,
  X
} from 'lucide-react';
import { ModuleType, UserRole, AthleteProfile } from '../types';
import { soundFx } from '../utils/audio';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (module: ModuleType) => void;
  athletesList: AthleteProfile[];
  onSelectAthlete: (athlete: AthleteProfile) => void;
  currentRole: UserRole;
  onRoleToggle?: () => void;
  canSwitchRole?: boolean;
  canSwitchAthlete?: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenReportModal: () => void;
  onOpenRoomSchemaModal: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectModule,
  athletesList,
  onSelectAthlete,
  currentRole,
  onRoleToggle,
  canSwitchRole = false,
  canSwitchAthlete = false,
  theme,
  onToggleTheme,
  onOpenReportModal,
  onOpenRoomSchemaModal
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build searchable items
  const navigationItems = [
    {
      id: 'nav-dashboard',
      type: 'module' as const,
      label: 'Dashboard Executivo',
      category: 'Módulos',
      shortcut: '1',
      icon: LayoutDashboard,
      color: '#38bdf8',
      action: () => onSelectModule('dashboard')
    },
    {
      id: 'nav-profile',
      type: 'module' as const,
      label: 'Perfil & Avaliação Física (Antropometria)',
      category: 'Módulos',
      shortcut: '2',
      icon: User,
      color: '#60a5fa',
      action: () => onSelectModule('profile')
    },
    {
      id: 'nav-nutrition',
      type: 'module' as const,
      label: 'Nutrição & Plano Alimentar (Dieta)',
      category: 'Módulos',
      shortcut: '3',
      icon: Utensils,
      color: '#4ade80',
      action: () => onSelectModule('nutrition')
    },
    {
      id: 'nav-workout',
      type: 'module' as const,
      label: 'Treinamento & Cardio (Séries e Cargas)',
      category: 'Módulos',
      shortcut: '4',
      icon: Dumbbell,
      color: '#fb923c',
      action: () => onSelectModule('workout')
    },
    {
      id: 'nav-supplements',
      type: 'module' as const,
      label: 'Suplementação & Manipulados',
      category: 'Módulos',
      shortcut: '5',
      icon: Pill,
      color: '#c084fc',
      action: () => onSelectModule('supplements')
    },
    {
      id: 'nav-recipes',
      type: 'module' as const,
      label: 'Catálogo de Receitas Fit Proteicas',
      category: 'Módulos',
      shortcut: '6',
      icon: ChefHat,
      color: '#2dd4bf',
      action: () => onSelectModule('recipes')
    },
    {
      id: 'nav-progress',
      type: 'module' as const,
      label: 'Evolução & Gráficos Temporais',
      category: 'Módulos',
      shortcut: '7',
      icon: TrendingUp,
      color: '#f97316',
      action: () => onSelectModule('progress')
    },
    ...(canSwitchRole && currentRole === 'coach'
      ? [
          {
            id: 'nav-coach',
            type: 'module' as const,
            label: 'Painel Clínico do Treinador / Prescritor',
            category: 'Módulos',
            shortcut: '8',
            icon: ShieldAlert,
            color: '#818cf8',
            action: () => onSelectModule('coach_admin')
          }
        ]
      : [])
  ];

  const quickActions = [
    {
      id: 'act-pdf',
      type: 'action' as const,
      label: 'Visualizar Laudo Físico em PDF',
      category: 'Ações Rápidas',
      shortcut: 'P',
      icon: FileText,
      color: '#3b82f6',
      action: onOpenReportModal
    },
    {
      id: 'act-theme',
      type: 'action' as const,
      label: theme === 'dark' ? 'Alternar para Modo Claro (Light)' : 'Alternar para Modo Escuro (Dark)',
      category: 'Ações Rápidas',
      shortcut: 'T',
      icon: theme === 'dark' ? Sun : Moon,
      color: '#f59e0b',
      action: onToggleTheme
    },
    {
      id: 'act-room',
      type: 'action' as const,
      label: 'Estrutura do Banco Local Room & Nuvem',
      category: 'Ações Rápidas',
      shortcut: 'D',
      icon: Database,
      color: '#14b8a6',
      action: onOpenRoomSchemaModal
    }
  ];

  const athleteActions = canSwitchAthlete
    ? athletesList.map((ath) => ({
        id: `ath-${ath.id}`,
        type: 'athlete' as const,
        label: `${ath.name} (${ath.category} - ${ath.goal})`,
        category: 'Atletas',
        shortcut: '',
        icon: User,
        color: '#06b6d4',
        action: () => onSelectAthlete(ath)
      }))
    : [];

  const allItems = [...navigationItems, ...quickActions, ...athleteActions];

  const filteredItems = allItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        soundFx.playClick();
        filteredItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        className="w-full max-w-2xl rounded-3xl modal-liquid-glass border border-white/20 shadow-2xl overflow-hidden"
      >
        {/* Search Bar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar módulo, atleta ou comando... (ou use as setas ↑ ↓)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-slate-400 outline-none border-none ring-0"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded-lg bg-white/10 text-[10px] font-mono text-slate-300 border border-white/10">
              ESC para fechar
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhum resultado encontrado para &quot;{query}&quot;.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundFx.playClick();
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all ${
                    isSelected
                      ? 'bg-blue-600/30 text-white border border-blue-500/40 shadow-md'
                      : 'text-slate-300 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
                      style={{ backgroundColor: `${item.color}20`, color: item.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold truncate text-white">{item.label}</p>
                      <span className="text-[10px] text-slate-400 font-medium">{item.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.shortcut && (
                      <span className="px-2 py-0.5 rounded-lg bg-white/10 text-[10px] font-mono text-slate-300 border border-white/10">
                        {item.shortcut}
                      </span>
                    )}
                    {isSelected && <ArrowRight className="w-4 h-4 text-blue-400 animate-pulse" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-3 bg-black/30 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-4">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono text-[10px]">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono text-[10px]">↓</kbd> Navegar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono text-[10px]">↵</kbd> Executar
            </span>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono">LM Team Web Command Palette</span>
        </div>
      </motion.div>
    </div>
  );
};
