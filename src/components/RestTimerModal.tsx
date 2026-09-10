import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  X,
  Plus,
  Minus,
  Volume2,
  BellRing,
  Bell,
  BellOff,
  CheckCircle2
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { useAccessibleModal } from '../hooks/useAccessibleModal';

interface RestTimerProps {
  isOpen: boolean;
  onClose: () => void;
  initialSeconds?: number;
  exerciseName?: string;
  setInfo?: string;
}

export const RestTimerModal: React.FC<RestTimerProps> = ({
  isOpen,
  onClose,
  initialSeconds = 90,
  exerciseName = 'Supino Inclinado',
  setInfo = 'Série 2 de 4'
}) => {
  const [totalTime, setTotalTime] = useState<number>(initialSeconds);
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isAlarmActive, setIsAlarmActive] = useState<boolean>(soundFx.isAlarmSoundEnabled());
  const [justCompleted, setJustCompleted] = useState<boolean>(false);

  useEffect(() => {
    setTotalTime(initialSeconds);
    setTimeLeft(initialSeconds);
    setIsRunning(true);
    setIsMinimized(false);
    setJustCompleted(false);
  }, [initialSeconds, isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 4 && prev > 1) {
            soundFx.playTick(700);
          } else if (prev === 1) {
            soundFx.playRestComplete();
            setJustCompleted(true);
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setJustCompleted(true);
      soundFx.playRestComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const { modalRef } = useAccessibleModal({ isOpen: isOpen && !isMinimized, onClose });

  if (!isOpen) return null;

  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const toggleAlarm = () => {
    const next = !isAlarmActive;
    soundFx.setAlarmSoundEnabled(next);
    setIsAlarmActive(next);
    if (next) soundFx.playTick(800);
  };

  const setPreset = (sec: number) => {
    soundFx.playClick();
    setTotalTime(sec);
    setTimeLeft(sec);
    setIsRunning(true);
    setJustCompleted(false);
  };

  const adjustTime = (sec: number) => {
    soundFx.playClick();
    setTimeLeft((prev) => {
      const next = Math.max(5, prev + sec);
      if (next > totalTime) setTotalTime(next);
      return next;
    });
    setJustCompleted(false);
  };

  // Minimized floating bubble
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`fixed bottom-24 right-4 z-50 flex items-center gap-3 p-3 rounded-2xl liquid-glass shadow-2xl backdrop-blur-xl cursor-pointer border ${
          timeLeft === 0
            ? 'border-emerald-500 bg-emerald-950/80 ring-2 ring-emerald-400 animate-pulse'
            : 'border-orange-500/40'
        }`}
        onClick={() => setIsMinimized(false)}
        role="button"
        tabIndex={0}
        aria-label="Expandir cronômetro de descanso"
      >
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg className="w-10 h-10 transform -rotate-90">
            <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.15)" strokeWidth="3" fill="transparent" />
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke={timeLeft === 0 ? '#10b981' : '#BF360C'}
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={100}
              strokeDashoffset={100 - progressPercent}
              className="transition-all duration-500 ease-linear"
            />
          </svg>
          <Timer className={`w-4 h-4 absolute ${timeLeft === 0 ? 'text-emerald-400' : 'text-orange-400'}`} />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">
            {timeLeft === 0 ? 'Descanso Finalizado!' : 'Descanso'}
          </p>
          <p className={`text-base font-bold font-mono ${timeLeft === 0 ? 'text-emerald-300' : 'text-orange-300'}`}>
            {formattedTime}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Fechar cronômetro"
          className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        role="presentation"
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rest-timer-title"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full max-w-sm rounded-3xl modal-liquid-glass p-6 shadow-2xl text-center overflow-hidden focus:outline-none border transition-colors ${
            timeLeft === 0
              ? 'border-emerald-500/80 shadow-emerald-950/50'
              : 'border-white/15'
          }`}
        >
          {/* Ambient Glow */}
          <div
            className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-colors ${
              timeLeft === 0 ? 'bg-emerald-600/30' : 'bg-orange-600/20'
            }`}
          />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-orange-400">
              <Timer className="w-5 h-5" aria-hidden="true" />
              <span id="rest-timer-title" className="text-xs uppercase tracking-wider font-semibold">
                Cronômetro de Descanso
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Sound / Visual Alarm Toggle */}
              <button
                type="button"
                onClick={toggleAlarm}
                className={`p-1.5 rounded-xl border transition flex items-center gap-1 text-[11px] font-bold ${
                  isAlarmActive
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
                title={isAlarmActive ? 'Alarme sonoro ativado' : 'Alarme sonoro desativado (apenas visual e vibração)'}
                aria-label={isAlarmActive ? 'Desativar alarme sonoro' : 'Ativar alarme sonoro'}
              >
                {isAlarmActive ? (
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <BellOff className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="hidden sm:inline">{isAlarmActive ? 'Som On' : 'Silencioso'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                Minimizar
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar cronômetro de descanso"
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Exercise details */}
          <div className="mb-4 bg-white/5 rounded-2xl p-3 border border-white/5">
            <h4 className="text-sm font-bold text-white truncate">{exerciseName}</h4>
            <p className="text-xs text-orange-400/90 font-medium mt-0.5">{setInfo}</p>
          </div>

          {/* Prominent Visual Completion Banner when time hits zero */}
          {timeLeft === 0 && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-3 p-2.5 rounded-xl bg-emerald-500/25 border border-emerald-400/60 text-emerald-300 flex items-center justify-center gap-2 text-xs font-bold animate-bounce"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tempo esgotado! Inicie a próxima série.</span>
            </motion.div>
          )}

          {/* Circular Countdown Progress */}
          <div className="relative w-48 h-48 mx-auto my-3 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="82"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="96"
                cy="96"
                r="82"
                stroke={timeLeft === 0 ? '#10b981' : 'url(#timerGradient)'}
                strokeWidth="8"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={515}
                strokeDashoffset={515 - (515 * progressPercent) / 100}
                className="transition-all duration-300 ease-linear"
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#BF360C" />
                  <stop offset="100%" stopColor="#FF7043" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute flex flex-col items-center justify-center">
              <span
                className={`text-4xl font-black font-mono tracking-tight ${
                  timeLeft === 0 ? 'text-emerald-400 scale-110' : 'text-white'
                }`}
              >
                {formattedTime}
              </span>
              <span className="text-xs text-slate-400 font-medium mt-1">
                {timeLeft === 0 ? 'Próxima Série!' : isRunning ? 'Recuperando...' : 'Pausado'}
              </span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-2 my-3">
            {[45, 60, 90, 120].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setPreset(sec)}
                className={`py-2 rounded-xl text-xs font-semibold transition border min-h-[38px] ${
                  totalTime === sec
                    ? 'bg-orange-600/30 text-orange-300 border-orange-500/50 shadow-inner font-bold'
                    : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Quick adjust +/- 10s */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => adjustTime(-10)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 min-h-[36px]"
            >
              <Minus className="w-3.5 h-3.5" /> 10s
            </button>
            <button
              type="button"
              onClick={() => adjustTime(10)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" /> 10s
            </button>
          </div>

          {/* Action Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setTimeLeft(totalTime);
                setIsRunning(true);
                setJustCompleted(false);
              }}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Reiniciar tempo"
              aria-label="Reiniciar tempo"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setIsRunning(!isRunning);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm text-white shadow-lg transition min-h-[44px] ${
                isRunning
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" /> Pausar Descanso
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" /> Iniciar Descanso
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

