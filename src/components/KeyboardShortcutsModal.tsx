import React from 'react';
import { motion } from 'motion/react';
import { Keyboard, X, Sparkles, Command } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K / ⌘ + K', desc: 'Abrir Paleta de Comandos e Busca Rápida' },
    { key: '1', desc: 'Ir para o Dashboard' },
    { key: '2', desc: 'Ir para o Perfil e Avaliação Física' },
    { key: '3', desc: 'Ir para Nutrição e Dieta' },
    { key: '4', desc: 'Ir para Treinamento' },
    { key: '5', desc: 'Ir para Suplementação' },
    { key: '6', desc: 'Ir para Receitas Proteicas' },
    { key: '7', desc: 'Ir para Evolução e Gráficos' },
    { key: '8', desc: 'Ir para Painel do Treinador (Modo Coach)' },
    { key: 'T', desc: 'Alternar Tema Claro / Escuro' },
    { key: 'P', desc: 'Visualizar Laudo Físico em PDF' },
    { key: '?', desc: 'Abrir esta tela de Atalhos de Teclado' },
    { key: 'Esc', desc: 'Fechar modais abertos' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl modal-liquid-glass border border-white/20 p-6 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-500/40">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Atalhos de Teclado (Web & Tablet)</h3>
              <p className="text-xs text-slate-400">Navegue com velocidade no computador e tablet</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-2"
            >
              <span className="text-xs text-slate-300">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded-lg bg-black/40 border border-white/15 text-[11px] font-mono font-bold text-cyan-300 shrink-0">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Dica: Pressione Ctrl+K a qualquer momento
          </span>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
};
