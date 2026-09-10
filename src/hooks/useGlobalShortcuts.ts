import { useEffect } from 'react';
import { ModuleType } from '../types';
import { soundFx } from '../utils/audio';

interface UseGlobalShortcutsProps {
  onToggleCommandPalette: () => void;
  onSelectModule: (module: ModuleType) => void;
  onToggleTheme: () => void;
  onOpenPdfReport: () => void;
  onOpenKeyboardShortcuts: () => void;
  onCloseModals: () => void;
  userSessionType?: 'athlete' | 'prescriber' | null;
  currentRole?: string;
}

export function useGlobalShortcuts({
  onToggleCommandPalette,
  onSelectModule,
  onToggleTheme,
  onOpenPdfReport,
  onOpenKeyboardShortcuts,
  onCloseModals,
  userSessionType,
  currentRole
}: UseGlobalShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // ⌘K or Ctrl+K for Command Palette (works even if inside an input)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        soundFx.playClick();
        onToggleCommandPalette();
        return;
      }

      if (isInput) return;

      if (e.key === '1') {
        e.preventDefault();
        soundFx.playClick();
        onSelectModule('dashboard');
      } else if (e.key === '2') {
        e.preventDefault();
        soundFx.playClick();
        onSelectModule('profile');
      } else if (e.key === '3') {
        e.preventDefault();
        soundFx.playClick();
        onSelectModule('nutrition');
      } else if (e.key === '4') {
        e.preventDefault();
        soundFx.playClick();
        onSelectModule('workout');
      } else if (e.key === '5') {
        e.preventDefault();
        soundFx.playClick();
        onSelectModule('supplements');
      } else if (e.key === '6') {
        e.preventDefault();
        soundFx.playClick();
        onSelectModule('recipes');
      } else if (e.key === '7') {
        e.preventDefault();
        soundFx.playClick();
        onSelectModule('progress');
      } else if (e.key === '8' && (userSessionType === 'prescriber' || currentRole === 'admin' || currentRole === 'coach')) {
        e.preventDefault();
        soundFx.playClick();
        onSelectModule('coach_admin');
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        onToggleTheme();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        soundFx.playClick();
        onOpenPdfReport();
      } else if (e.key === '?') {
        e.preventDefault();
        soundFx.playClick();
        onOpenKeyboardShortcuts();
      } else if (e.key === 'Escape') {
        onCloseModals();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onToggleCommandPalette,
    onSelectModule,
    onToggleTheme,
    onOpenPdfReport,
    onOpenKeyboardShortcuts,
    onCloseModals,
    userSessionType,
    currentRole
  ]);
}
