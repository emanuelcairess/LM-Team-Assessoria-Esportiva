import React from 'react';
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

export interface NavigationDestination {
  id: ModuleType;
  label: string;
  shortLabel: string;
  fullTitle: string;
  hash: string;
  icon: React.FC<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  accentColor: string;
  lightAccentColor: string;
  bgColor: string;
  lightBgColor: string;
  shortcut: string;
  description: string;
  requiresPrescriber?: boolean;
}

export const NAVIGATION_DESTINATIONS: NavigationDestination[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Executivo',
    shortLabel: 'Início',
    fullTitle: 'Início • Dashboard Executivo',
    hash: '#dashboard',
    icon: LayoutDashboard,
    accentColor: '#38bdf8',
    lightAccentColor: '#0284c7',
    bgColor: 'rgba(13, 27, 42, 0.95)',
    lightBgColor: 'rgba(2, 132, 199, 0.12)',
    shortcut: '1',
    description: 'Visão geral, adesão, métricas semanais e agenda'
  },
  {
    id: 'workout',
    label: 'Treinamento & Periodização',
    shortLabel: 'Treino',
    fullTitle: 'Treino • Periodização, Séries & Cargas',
    hash: '#workout',
    icon: Dumbbell,
    accentColor: '#fb923c',
    lightAccentColor: '#ea580c',
    bgColor: 'rgba(191, 54, 12, 0.4)',
    lightBgColor: 'rgba(234, 88, 12, 0.12)',
    shortcut: '4',
    description: 'Divisão de treinos, exercícios, cargas, repetições e cardio'
  },
  {
    id: 'nutrition',
    label: 'Nutrição & Dieta',
    shortLabel: 'Dieta',
    fullTitle: 'Dieta • Plano Alimentar & Macronutrientes',
    hash: '#nutrition',
    icon: Utensils,
    accentColor: '#4ade80',
    lightAccentColor: '#16a34a',
    bgColor: 'rgba(46, 125, 50, 0.4)',
    lightBgColor: 'rgba(22, 163, 74, 0.12)',
    shortcut: '3',
    description: 'Refeições, horários, alimentos, água e substituições'
  },
  {
    id: 'progress',
    label: 'Evolução & Gráficos',
    shortLabel: 'Evolução',
    fullTitle: 'Evolução • Gráficos de Peso & Composição',
    hash: '#progress',
    icon: TrendingUp,
    accentColor: '#f97316',
    lightAccentColor: '#d97706',
    bgColor: 'rgba(230, 81, 0, 0.4)',
    lightBgColor: 'rgba(217, 119, 6, 0.12)',
    shortcut: '7',
    description: 'Histórico biométrico, fotos comparativas e metas'
  },
  {
    id: 'supplements',
    label: 'Suplementação & Fórmulas',
    shortLabel: 'Fórmulas',
    fullTitle: 'Suplementação • Fórmulas & Fitoterápicos',
    hash: '#supplements',
    icon: Pill,
    accentColor: '#c084fc',
    lightAccentColor: '#9333ea',
    bgColor: 'rgba(74, 20, 140, 0.4)',
    lightBgColor: 'rgba(147, 51, 234, 0.12)',
    shortcut: '5',
    description: 'Protocolo de manipulados, dosagens e horários'
  },
  {
    id: 'recipes',
    label: 'Receitas Fit Proteicas',
    shortLabel: 'Receitas',
    fullTitle: 'Receitas Fit • Preparações Saudáveis',
    hash: '#recipes',
    icon: ChefHat,
    accentColor: '#2dd4bf',
    lightAccentColor: '#0d9488',
    bgColor: 'rgba(0, 105, 92, 0.4)',
    lightBgColor: 'rgba(13, 148, 136, 0.12)',
    shortcut: '6',
    description: 'Catálogo de receitas proteicas com macronutrientes calculados'
  },
  {
    id: 'profile',
    label: 'Perfil & Ficha Antropométrica',
    shortLabel: 'Perfil',
    fullTitle: 'Perfil • Ficha Antropométrica & Dados',
    hash: '#profile',
    icon: User,
    accentColor: '#60a5fa',
    lightAccentColor: '#2563eb',
    bgColor: 'rgba(21, 101, 192, 0.4)',
    lightBgColor: 'rgba(37, 99, 235, 0.12)',
    shortcut: '2',
    description: 'Dados pessoais, medidas corporais, dobras e perímetros'
  },
  {
    id: 'coach_admin',
    label: 'Manutenção de Usuários',
    shortLabel: 'Usuários',
    fullTitle: 'Manutenção de Usuários • Alunos, Equipe & Admin',
    hash: '#coach_admin',
    icon: ShieldAlert,
    accentColor: '#818cf8',
    lightAccentColor: '#4f46e5',
    bgColor: 'rgba(49, 46, 129, 0.5)',
    lightBgColor: 'rgba(79, 70, 229, 0.12)',
    shortcut: '8',
    description: 'Manutenção e gestão de usuários (alunos e equipe), permissões, senhas e auditoria',
    requiresPrescriber: true
  }
];

export const VALID_MODULES: ModuleType[] = [
  'dashboard',
  'workout',
  'nutrition',
  'progress',
  'supplements',
  'recipes',
  'profile',
  'coach_admin'
];

/**
 * Mobile Bottom Bar primary items for Athletes (Max 4 visible + "Mais")
 */
export const ATHLETE_PRIMARY_BOTTOM_IDS: ModuleType[] = [
  'dashboard',
  'workout',
  'nutrition',
  'progress'
];

/**
 * Mobile Bottom Bar secondary items in "Mais" for Athletes
 */
export const ATHLETE_MORE_BOTTOM_IDS: ModuleType[] = [
  'profile',
  'supplements',
  'recipes'
];

/**
 * Mobile Bottom Bar primary items for Prescribers/Coaches (Max 4 visible + "Mais")
 */
export const COACH_PRIMARY_BOTTOM_IDS: ModuleType[] = [
  'coach_admin',
  'workout',
  'nutrition',
  'progress'
];

/**
 * Mobile Bottom Bar secondary items in "Mais" for Prescribers/Coaches
 */
export const COACH_MORE_BOTTOM_IDS: ModuleType[] = [
  'dashboard',
  'profile',
  'supplements',
  'recipes'
];

export function getDestinationById(id: ModuleType): NavigationDestination {
  return (
    NAVIGATION_DESTINATIONS.find((d) => d.id === id) ||
    NAVIGATION_DESTINATIONS[0]
  );
}

export function getModuleFromHash(hash: string): ModuleType | null {
  const clean = hash.replace(/^#\/?/, '').trim().toLowerCase();
  const match = NAVIGATION_DESTINATIONS.find(
    (d) => d.id === clean || d.hash === `#${clean}`
  );
  return match ? match.id : null;
}

export function getHashForModule(id: ModuleType): string {
  const item = getDestinationById(id);
  return item.hash;
}

export function getDocumentTitle(id: ModuleType): string {
  const item = getDestinationById(id);
  return `${item.shortLabel} | LM Team - Assessoria Esportiva`;
}
