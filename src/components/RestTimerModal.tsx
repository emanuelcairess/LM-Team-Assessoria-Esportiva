import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Play, Pause, RotateCcw, X, Plus, Minus, Volume2, BellRing } from 'lucide-react';
import { soundFx } from '../utils/audio';

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

  useEffect(() => {
    setTotalTime(initialSeconds);
    setTimeLeft(initialSeconds);
    setIsRunning(true);
    setIsMinimized(false);
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
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      soundFx.playRestComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  if (!isOpen) return null;

  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const setPreset = (sec: number) => {
    soundFx.playClick();
    setTotalTime(sec);
    setTimeLeft(sec);
    setIsRunning(true);
  };

  const adjustTime = (sec: number) => {
    soundFx.playClick();
    setTimeLeft((prev) => {
      const next = Math.max(5, prev + sec);
      if (next > totalTime) setTotalTime(next);
      return next;
    });
  };

  // Minimized floating bubble
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-24 right-4 z-50 flex items-center gap-3 p-3 rounded-2xl liquid-glass border border-orange-500/40 shadow-2xl backdrop-blur-xl cursor-pointer"
        onClick={() => setIsMinimized(false)}
      >
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg className="w-10 h-10 transform -rotate-90">
            <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.15)" strokeWidth="3" fill="transparent" />
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="#BF360C"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={100}
              strokeDashoffset={100 - progressPercent}
              className="transition-all duration-500 ease-linear"
            />
          </svg>
          <Timer className="w-4 h-4 text-orange-400 absolute" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Descanso</p>
          <p className="text-base font-bold text-orange-300 font-mono">{formattedTime}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 rounded-full hover:bg-white/10 text-slate-400"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm rounded-3xl modal-liquid-glass border border-white/15 p-6 shadow-2xl text-center overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-orange-400">
              <Timer className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider font-semibold">Cronômetro de Descanso</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                Minimizar
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Exercise details */}
          <div className="mb-5 bg-white/5 rounded-2xl p-3 border border-white/5">
            <h4 className="text-sm font-bold text-white truncate">{exerciseName}</h4>
            <p className="text-xs text-orange-400/90 font-medium mt-0.5">{setInfo}</p>
          </div>

          {/* Circular Countdown Progress */}
          <div className="relative w-48 h-48 mx-auto my-4 flex items-center justify-center">
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
                stroke="url(#timerGradient)"
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
              <span className={`text-4xl font-black font-mono tracking-tight ${timeLeft === 0 ? 'text-emerald-400 animate-pulse' : 'text-white'}`}>
                {formattedTime}
              </span>
              <span className="text-xs text-slate-400 font-medium mt-1">
                {timeLeft === 0 ? 'Próxima Série!' : isRunning ? 'Recuperando...' : 'Pausado'}
              </span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-2 my-4">
            {[60, 75, 90, 120].map((sec) => (
              <button
                key={sec}
                onClick={() => setPreset(sec)}
                className={`py-2 rounded-xl text-xs font-semibold transition border ${
                  totalTime === sec
                    ? 'bg-orange-600/30 text-orange-300 border-orange-500/50 shadow-inner'
                    : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Quick adjust +/- 10s */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <button
              onClick={() => adjustTime(-10)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10"
            >
              <Minus className="w-3.5 h-3.5" /> 10s
            </button>
            <button
              onClick={() => adjustTime(10)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10"
            >
              <Plus className="w-3.5 h-3.5" /> 10s
            </button>
          </div>

          {/* Action Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                soundFx.playClick();
                setTimeLeft(totalTime);
                setIsRunning(true);
              }}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition"
              title="Reiniciar"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setIsRunning(!isRunning);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm text-white shadow-lg transition ${
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
