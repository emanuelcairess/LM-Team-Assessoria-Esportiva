import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TeamLmBrand } from './TeamLmBrand';
import { Sparkles, ShieldCheck, Wifi, Activity } from 'lucide-react';

interface SplashScreenProps {
  isLoading: boolean;
  onFinish?: () => void;
  title?: string;
  subtitle?: string;
  theme?: 'dark' | 'light';
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isLoading,
  onFinish,
  title = 'TEAM LM CONSULTORIA',
  subtitle = 'Assessoria Esportiva & Performance Humana',
  theme = 'dark'
}) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Inicializando protocolo de alta performance...');

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) {
          clearInterval(interval);
          return 92;
        }
        if (prev > 30 && prev < 60) {
          setStatusText('Sincronizando protocolos de treino e nutrição...');
        } else if (prev >= 60) {
          setStatusText('Carregando biometria e painel clínico...');
        }
        return prev + Math.floor(Math.random() * 12) + 6;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden"
          style={{
            background:
              theme === 'light'
                ? 'radial-gradient(circle at 50% 30%, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)'
                : 'radial-gradient(circle at 50% 30%, #171d2c 0%, #0c101a 50%, #05070d 100%)'
          }}
        >
          {/* Ambient Liquid Glow Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Status Capsule (One UI 9.0 dynamic bar) */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass border border-white/15 text-xs font-semibold backdrop-blur-xl shadow-lg"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className={theme === 'light' ? 'text-slate-800' : 'text-slate-200'}>
              LM Engine v3.0 • One UI 9.0 Liquid Glass
            </span>
          </motion.div>

          {/* Center Brand Identity (Lion + 3D LM Emblem) */}
          <div className="flex flex-col items-center text-center my-auto space-y-6 max-w-sm">
            {/* Animated Glow Halo behind Lion */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500/30 via-purple-600/20 to-transparent rounded-[32%] blur-xl animate-pulse" />
              <TeamLmBrand size="hero" showText={false} animated />
            </motion.div>

            {/* Typography */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="space-y-1.5"
            >
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
                {title}
              </h1>
              <p className={`text-xs font-semibold tracking-wider uppercase ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-400'
              }`}>
                {subtitle}
              </p>
            </motion.div>

            {/* High-Precision Progress Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-64 sm:w-72 space-y-2.5 pt-2"
            >
              <div className="w-full h-2 rounded-full bg-white/10 p-0.5 overflow-hidden border border-white/10 backdrop-blur-md">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-purple-500 shadow-sm"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.3 }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-medium">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                  {statusText}
                </span>
                <span className="font-bold text-amber-400 font-mono">{progress}%</span>
              </div>
            </motion.div>
          </div>

          {/* Bottom Security & Platform Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Ambiente Seguro Criptografado
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              Sincronização Offline-First
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
