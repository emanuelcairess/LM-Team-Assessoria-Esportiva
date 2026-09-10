import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dumbbell,
  Timer,
  Plus,
  Edit,
  Trash2,
  BookmarkPlus,
  Bookmark,
  HeartPulse,
  Flame,
  Zap,
  Check,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  CheckCircle,
  Moon,
  Coffee,
  BatteryCharging,
  Droplets,
  BedDouble,
  ShieldCheck,
  Activity,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  WorkoutSplit,
  Exercise,
  ExerciseSet,
  TechniqueType,
  WorkoutTemplate,
  LibraryExercise,
  AthleteProfile,
  PersistenceSyncState
} from '../types';
import { soundFx } from '../utils/audio';
import { WorkoutModal } from '../components/WorkoutModal';
import { WorkoutTemplateModal } from '../components/WorkoutTemplateModal';
import { DeleteWorkoutModal } from '../components/DeleteWorkoutModal';
import { ExercisePickerModal } from '../components/ExercisePickerModal';
import { AthletePrescriptionHeader } from '../components/AthletePrescriptionHeader';

interface WorkoutViewProps {
  athlete?: AthleteProfile;
  workoutSplits: WorkoutSplit[];
  onOpenRestTimer: (seconds: number, exerciseName: string, setInfo: string) => void;
  onUpdateSplits: (updated: WorkoutSplit[]) => void;
  templates: WorkoutTemplate[];
  onSaveTemplate: (newTemplate: WorkoutTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  exerciseLibrary?: LibraryExercise[];
  onSaveExerciseToLibrary?: (exercise: LibraryExercise) => void;
  onDeleteExerciseFromLibrary?: (exerciseId: string) => void;
  onToast: (title: string, message: string) => void;
  syncState?: PersistenceSyncState;
  lastConfirmedTime?: string | null;
  errorMessage?: string | null;
  onRetry?: () => void;
  isLoading?: boolean;
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  athlete,
  workoutSplits,
  onOpenRestTimer,
  onUpdateSplits,
  templates,
  onSaveTemplate,
  onDeleteTemplate,
  exerciseLibrary = [],
  onSaveExerciseToLibrary,
  onDeleteExerciseFromLibrary,
  onToast,
  syncState = 'salvo',
  lastConfirmedTime = null,
  errorMessage = null,
  onRetry,
  isLoading = false
}) => {
  const [selectedSplitId, setSelectedSplitId] = useState<string>(
    workoutSplits[0]?.id || ''
  );
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Modal States
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [splitToEdit, setSplitToEdit] = useState<WorkoutSplit | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [splitToDelete, setSplitToDelete] = useState<WorkoutSplit | null>(null);
  const [isExerciseBankModalOpen, setIsExerciseBankModalOpen] = useState(false);

  const activeSplit = workoutSplits.find((s) => s.id === selectedSplitId) || workoutSplits[0];

  // Helper to toggle set completion
  const handleToggleSetCompleted = (exerciseId: string, setNumber: number) => {
    soundFx.playClick();
    if (!activeSplit) return;

    const updated = workoutSplits.map((split) => {
      if (split.id !== activeSplit.id) return split;
      return {
        ...split,
        exercises: split.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.setNumber !== setNumber) return s;
              const newStatus = !s.isCompleted;
              if (newStatus) {
                soundFx.playRestComplete();
              }
              return { ...s, isCompleted: newStatus };
            })
          };
        })
      };
    });
    onUpdateSplits(updated);
  };

  // Helper to update logged weight for a set (supports decimals with . or ,)
  const handleUpdateLoggedWeight = (
    exerciseId: string,
    setNumber: number,
    weightRaw: string | number
  ) => {
    if (!activeSplit) return;
    const cleanStr = String(weightRaw).replace(',', '.');
    const parsed = cleanStr === '' ? 0 : parseFloat(cleanStr);
    const weight = isNaN(parsed) ? 0 : parsed;

    const updated = workoutSplits.map((split) => {
      if (split.id !== activeSplit.id) return split;
      return {
        ...split,
        exercises: split.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.setNumber !== setNumber) return s;
              return { ...s, weightKgLogged: weight };
            })
          };
        })
      };
    });
    onUpdateSplits(updated);
  };

  // Helper to update actual reps performed (without overwriting prescriber's repsTarget)
  const handleUpdateLoggedReps = (
    exerciseId: string,
    setNumber: number,
    reps: string
  ) => {
    if (!activeSplit) return;
    const updated = workoutSplits.map((split) => {
      if (split.id !== activeSplit.id) return split;
      return {
        ...split,
        exercises: split.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.setNumber !== setNumber) return s;
              return { ...s, repsLogged: reps };
            })
          };
        })
      };
    });
    onUpdateSplits(updated);
  };

  // Toggle cardio completed
  const handleToggleCardioCompleted = () => {
    if (!activeSplit || !activeSplit.cardioOrientation) return;
    soundFx.playRestComplete();
    const isNowDone = !activeSplit.cardioOrientation.isCompletedToday;

    const updated = workoutSplits.map((split) => {
      if (split.id !== activeSplit.id) return split;
      return {
        ...split,
        isCompletedToday: isNowDone,
        cardioOrientation: split.cardioOrientation
          ? { ...split.cardioOrientation, isCompletedToday: isNowDone }
          : undefined
      };
    });

    onUpdateSplits(updated);
    if (isNowDone) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#0d9488', '#2dd4bf', '#14b8a6', '#f59e0b']
      });
      onToast('Cardio Concluído!', 'Protocolo cardiovascular do dia registrado com sucesso.');
    }
  };

  // Toggle rest completed (for rest / OFF days)
  const handleToggleRestCompleted = () => {
    if (!activeSplit) return;
    soundFx.playRestComplete();
    const isNowDone = !activeSplit.isCompletedToday;

    const updated = workoutSplits.map((split) => {
      if (split.id !== activeSplit.id) return split;
      return {
        ...split,
        isCompletedToday: isNowDone
      };
    });

    onUpdateSplits(updated);
    if (isNowDone) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#10b981']
      });
      onToast('Descanso Registrado!', 'Protocolo de recuperação e regeneração confirmado para hoje.');
    }
  };

  // Handlers for Add/Edit/Delete Workout Days
  const handleOpenAddSplit = () => {
    soundFx.playClick();
    if (workoutSplits.length >= 7) {
      onToast(
        'Limite de Dias Atingido',
        'A periodização permite de 1 a 7 dias por semana. Exclua um dia para adicionar outro.'
      );
      return;
    }
    setSplitToEdit(null);
    setIsWorkoutModalOpen(true);
  };

  const handleOpenEditSplit = () => {
    soundFx.playClick();
    if (!activeSplit) return;
    setSplitToEdit(activeSplit);
    setIsWorkoutModalOpen(true);
  };

  const handleOpenDeleteSplit = () => {
    soundFx.playClick();
    if (workoutSplits.length <= 1) {
      onToast(
        'Operação Bloqueada',
        'O aluno deve ter no mínimo 1 dia cadastrado na grade semanal.'
      );
      return;
    }
    if (!activeSplit) return;
    setSplitToDelete(activeSplit);
  };

  const handleConfirmDeleteSplit = () => {
    if (!splitToDelete) return;
    const remaining = workoutSplits.filter((s) => s.id !== splitToDelete.id);
    onUpdateSplits(remaining);
    if (remaining.length > 0) {
      setSelectedSplitId(remaining[0].id);
    }
    onToast(
      'Dia Removido',
      `${splitToDelete.code} (${splitToDelete.dayOfWeek}) foi removido da grade semanal.`
    );
    setSplitToDelete(null);
  };

  const handleSaveWorkoutSplit = (savedSplit: WorkoutSplit) => {
    const isExisting = workoutSplits.some((s) => s.id === savedSplit.id);
    let updated: WorkoutSplit[];

    if (isExisting) {
      updated = workoutSplits.map((s) => (s.id === savedSplit.id ? savedSplit : s));
      onToast(
        'Prescrição Atualizada!',
        `${savedSplit.code} (${savedSplit.name}) vinculado a ${savedSplit.dayOfWeek} foi salvo.`
      );
    } else {
      updated = [...workoutSplits, savedSplit];
      onToast(
        'Novo Dia Cadastrado!',
        `${savedSplit.code} (${savedSplit.name}) vinculado a ${savedSplit.dayOfWeek} foi cadastrado.`
      );
    }

    onUpdateSplits(updated);
    setSelectedSplitId(savedSplit.id);
  };

  // Apply template handler
  const handleApplyTemplate = (template: WorkoutTemplate, mode: 'replace' | 'add_new') => {
    if (mode === 'replace' && activeSplit) {
      const replaced: WorkoutSplit = {
        ...template.split,
        id: activeSplit.id,
        code: activeSplit.code,
        dayOfWeek: activeSplit.dayOfWeek
      };
      const updated = workoutSplits.map((s) => (s.id === activeSplit.id ? replaced : s));
      onUpdateSplits(updated);
      onToast('Modelo Aplicado!', `O modelo "${template.name}" foi aplicado ao ${activeSplit.code}.`);
    } else if (mode === 'add_new') {
      if (workoutSplits.length >= 7) {
        onToast(
          'Limite de Dias Atingido',
          'A periodização suporta até 7 dias na semana.'
        );
        return;
      }
      const newSplit: WorkoutSplit = {
        ...template.split,
        id: `w-${Date.now()}`,
        code: `Treino ${String.fromCharCode(65 + workoutSplits.length)}`
      };
      const updated = [...workoutSplits, newSplit];
      onUpdateSplits(updated);
      setSelectedSplitId(newSplit.id);
      onToast('Novo Dia Criado a Partir de Modelo!', `"${template.name}" foi inserido na semana.`);
    }
  };

  // Progress metrics calculation
  const hasActiveCardio = Boolean(activeSplit?.cardioOrientation?.enabled || activeSplit?.cardioProtocol);
  const isRestDay = activeSplit ? activeSplit.exercises.length === 0 && !hasActiveCardio : false;
  const isCardioOnlyDay = activeSplit ? activeSplit.exercises.length === 0 && hasActiveCardio : false;

  const totalSets = activeSplit
    ? activeSplit.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    : 0;
  const completedSets = activeSplit
    ? activeSplit.exercises.reduce(
        (sum, ex) => sum + ex.sets.filter((s) => s.isCompleted).length,
        0
      )
    : 0;

  let workoutProgress = 0;
  if (isRestDay) {
    workoutProgress = activeSplit?.isCompletedToday ? 100 : 0;
  } else if (isCardioOnlyDay) {
    workoutProgress = activeSplit?.cardioOrientation?.isCompletedToday ? 100 : 0;
  } else if (totalSets > 0) {
    workoutProgress = Math.round((completedSets / totalSets) * 100);
  }

  const handleFinishWorkout = () => {
    soundFx.playRestComplete();
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#EA580C', '#ff7043', '#f59e0b', '#10b981', '#06b6d4']
    });
    onToast('Treino Concluído!', 'Parabéns, você finalizou todas as séries prescritas para hoje!');
  };

  if (!activeSplit) {
    return (
      <div className="space-y-6 pb-28">
        {athlete && (
          <AthletePrescriptionHeader
            athlete={athlete}
            title="Prescrição de Treino & Periodização"
            subtitle="Divisões semanais, séries, repetições, cadência e prescrição de cardio."
            syncState={syncState}
            lastConfirmedTime={lastConfirmedTime}
            errorMessage={errorMessage}
            onRetry={onRetry}
            isLoading={isLoading}
          />
        )}
        <div className="p-12 text-center rounded-3xl liquid-glass border border-white/10 space-y-4">
          <Dumbbell className="w-12 h-12 text-orange-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Sem divisões de treino cadastradas</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            O atleta {athlete?.name} não possui nenhum dia cadastrado na grade de treinos semanal.
          </p>
          <button
            disabled={isLoading}
            onClick={handleOpenAddSplit}
            className="px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-orange-950/50"
          >
            + Incluir Primeiro Dia
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Athlete Prescription & Persistence State Machine Header */}
      {athlete && (
        <AthletePrescriptionHeader
          athlete={athlete}
          title="Prescrição de Treino & Periodização"
          subtitle="Divisões semanais, séries, repetições, cadência e prescrição de cardio."
          syncState={syncState}
          lastConfirmedTime={lastConfirmedTime}
          errorMessage={errorMessage}
          onRetry={onRetry}
          isLoading={isLoading}
        />
      )}

      {/* Top Prescriber Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl liquid-glass border border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-xl bg-orange-500/20 text-orange-950 dark:text-orange-300 border border-orange-400/40 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Periodização Semanal: {workoutSplits.length}/7 Dias Prescritos
          </span>
        </div>

        {/* Action Buttons: Add, Edit, Delete, Save Template, Library */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Workout Day (1 to 7) */}
          <button
            onClick={handleOpenAddSplit}
            disabled={workoutSplits.length >= 7}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 border ${
              workoutSplits.length < 7
                ? 'bg-orange-600 hover:bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-950/50'
                : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
            }`}
            title="Incluir novo dia na periodização (máx. 7)"
          >
            <Plus className="w-4 h-4" />
            <span>+ Incluir Dia</span>
          </button>

          {/* Edit Current Day */}
          <button
            onClick={handleOpenEditSplit}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 dark:border-white/10"
            title="Alterar prescrição, exercícios e cardio deste dia"
          >
            <Edit className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
            <span>Alterar Prescrição</span>
          </button>

          {/* Open Template Manager Modal */}
          <button
            onClick={() => {
              soundFx.playClick();
              setIsTemplateModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-amber-100 hover:bg-amber-200 dark:bg-gradient-to-r dark:from-amber-600/30 dark:to-orange-600/30 dark:hover:from-amber-600/50 dark:hover:to-orange-600/50 text-amber-950 dark:text-amber-300 text-xs font-bold transition flex items-center gap-1.5 border border-amber-300 dark:border-amber-500/40 shadow-sm"
            title="Biblioteca de Modelos & Templates Oficiais LM"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Templates</span>
          </button>

          {/* Open Exercise Bank Modal */}
          <button
            onClick={() => {
              soundFx.playClick();
              setIsExerciseBankModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-orange-100 hover:bg-orange-200 dark:bg-gradient-to-r dark:from-orange-600/30 dark:to-rose-600/30 dark:hover:from-orange-600/50 dark:hover:to-rose-600/50 text-orange-950 dark:text-orange-200 text-xs font-bold transition flex items-center gap-1.5 border border-orange-300 dark:border-orange-500/40 shadow-sm"
            title="Banco de Exercícios Cadastrados da Assessoria"
          >
            <BookOpen className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>Banco de Exercícios ({exerciseLibrary.length})</span>
          </button>

          {/* Delete Current Day */}
          {workoutSplits.length > 1 && (
            <button
              onClick={handleOpenDeleteSplit}
              className="p-2 rounded-2xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 transition border border-rose-300 dark:border-rose-500/20"
              title="Excluir este dia da periodização"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Split Navigation Bar (1 to 7 Days with Weekday Bindings) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {workoutSplits.map((split) => {
          const isSelected = selectedSplitId === split.id;
          const hasCardio = Boolean(
            split.cardioOrientation?.enabled || split.cardioProtocol
          );
          const isSplitRest = split.exercises.length === 0 && !hasCardio;
          const isSplitCardioOnly = split.exercises.length === 0 && hasCardio;

          const doneSets = split.exercises.reduce(
            (acc, ex) => acc + ex.sets.filter((s) => s.isCompleted).length,
            0
          );
          const allSets = split.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
          
          let isDayDone = false;
          if (isSplitRest) {
            isDayDone = Boolean(split.isCompletedToday);
          } else if (isSplitCardioOnly) {
            isDayDone = Boolean(split.cardioOrientation?.isCompletedToday);
          } else {
            isDayDone = allSets > 0 && doneSets === allSets;
          }

          return (
            <button
              key={split.id}
              onClick={() => {
                soundFx.playClick();
                setSelectedSplitId(split.id);
              }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                isSelected
                  ? isSplitRest
                    ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white border-blue-300 shadow-xl shadow-blue-950/60 scale-[1.02]'
                    : isSplitCardioOnly
                    ? 'bg-gradient-to-r from-teal-700 to-emerald-700 text-white border-teal-300 shadow-xl shadow-teal-950/60 scale-[1.02]'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-300 shadow-xl shadow-orange-950/60 scale-[1.02]'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/20'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-xl flex items-center justify-center text-[10px] font-black ${
                  isSelected
                    ? isSplitRest
                      ? 'bg-white text-blue-800'
                      : isSplitCardioOnly
                      ? 'bg-white text-teal-800'
                      : 'bg-white text-orange-700'
                    : isDayDone
                    ? 'bg-emerald-500/30 text-emerald-300'
                    : isSplitRest
                    ? 'bg-blue-500/20 text-blue-400'
                    : isSplitCardioOnly
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'bg-orange-500/20 text-orange-400'
                }`}
              >
                {isSplitRest ? (
                  <Moon className="w-3.5 h-3.5" />
                ) : isSplitCardioOnly ? (
                  <HeartPulse className="w-3.5 h-3.5" />
                ) : (
                  split.code.replace('Treino ', '')
                )}
              </div>

              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">
                    {isSplitRest ? 'OFF' : isSplitCardioOnly ? 'Cardio' : split.code}
                  </span>
                  {hasCardio && !isSplitCardioOnly && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-teal-400"
                      title="Cardio prescrito neste dia"
                    />
                  )}
                  {isDayDone && (
                    <CheckCircle className="w-3 h-3 text-emerald-400 inline" />
                  )}
                </div>
                <span className="text-[10px] opacity-75 font-normal block">
                  {split.dayOfWeek.split('-')[0]}
                </span>
              </div>
            </button>
          );
        })}

        {workoutSplits.length < 7 && (
          <button
            onClick={handleOpenAddSplit}
            className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:text-orange-400 bg-white/5 hover:bg-white/10 border border-dashed border-white/15 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Dia {workoutSplits.length + 1}</span>
          </button>
        )}
      </div>

      {/* Empty State when no split exists */}
      {!activeSplit ? (
        <div className="rounded-3xl liquid-glass border border-white/10 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
            <Dumbbell className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-white">Nenhum dia de treino cadastrado</h3>
            <p className="text-xs text-slate-400">
              Esta periodização ainda não possui dias configurados. Adicione um novo dia manualmente ou utilize um dos modelos salvos.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleOpenAddSplit}
              className="px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-orange-950/50"
            >
              <Plus className="w-4 h-4" />
              <span>+ Incluir Primeiro Dia</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setIsTemplateModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-amber-300 font-bold text-xs transition flex items-center gap-2 border border-amber-500/30"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Carregar de Template</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Main Active Workout Header Card */}
          <motion.div
            key={activeSplit.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl liquid-glass hero-workout p-6 sm:p-7 shadow-2xl relative overflow-hidden border ${
              isRestDay
                ? 'border-blue-500/30 bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-slate-950/80'
                : isCardioOnlyDay
                ? 'border-teal-500/30 bg-gradient-to-r from-teal-950/60 via-slate-900/80 to-slate-950/80'
                : 'border-orange-500/30'
            }`}
          >
            <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
              isRestDay ? 'bg-blue-600/15' : isCardioOnlyDay ? 'bg-teal-600/15' : 'bg-orange-600/15'
            }`} />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${
                    isRestDay ? 'bg-blue-600' : isCardioOnlyDay ? 'bg-teal-600' : 'bg-orange-600'
                  }`}>
                    {activeSplit.code || 'Treino'}
                  </span>
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {activeSplit.dayOfWeek || ''}
                  </span>
                  {(activeSplit.estimatedDurationMinutes || 0) > 0 && (
                    <span className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-orange-400" />
                      {activeSplit.estimatedDurationMinutes} min
                    </span>
                  )}
                </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeSplit.name}
            </h2>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-semibold">
                {isRestDay ? 'Foco do Dia:' : 'Músculos Alvo:'}
              </span>
              {activeSplit.targetMuscleGroups.map((m) => (
                <span
                  key={m}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                    isRestDay
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : isCardioOnlyDay
                      ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
                      : 'bg-white/10 text-orange-200'
                  }`}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Workout Completion Gauge */}
          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center px-2">
              <p className="text-[10px] uppercase font-bold text-slate-400">
                {isRestDay ? 'Status do Descanso' : isCardioOnlyDay ? 'Status do Cardio' : 'Progresso do Treino'}
              </p>
              <p className={`text-3xl font-black ${
                isRestDay ? 'text-blue-400' : isCardioOnlyDay ? 'text-teal-400' : 'text-orange-400'
              }`}>
                {workoutProgress}%
              </p>
              <p className="text-[10px] text-slate-400">
                {isRestDay
                  ? activeSplit.isCompletedToday ? 'Descanso Registrado ✓' : 'Pendente de Confirmação'
                  : isCardioOnlyDay
                  ? activeSplit.cardioOrientation?.isCompletedToday ? 'Cardio Cumprido Hoje ✓' : 'Sessão Aeróbia Pendente'
                  : `${completedSets} de ${totalSets} séries feitas`}
              </p>
            </div>

            {workoutProgress === 100 && (
              <button
                onClick={handleFinishWorkout}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Concluído 🎉</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* REST DAY DEDICATED PANEL */}
      {isRestDay && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl liquid-glass border border-blue-500/30 p-6 sm:p-8 space-y-6 bg-gradient-to-br from-blue-950/30 via-slate-900/60 to-slate-950/80 shadow-2xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center shadow-lg shadow-blue-950/50 shrink-0">
                <Moon className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Regeneração Neuromuscular & Anabolismo
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Dia 100% Livre de Treino (OFF Total)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Nenhum estímulo de musculação ou cardio prescrito. O músculo se reconstrói no descanso!
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleRestCompleted}
              className={`px-5 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 border shadow-xl ${
                activeSplit.isCompletedToday
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-950/50'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-blue-950/50'
              }`}
            >
              {activeSplit.isCompletedToday ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Descanso Cumprido Hoje ✓</span>
                </>
              ) : (
                <>
                  <BatteryCharging className="w-4 h-4" />
                  <span>Marcar Descanso como Realizado</span>
                </>
              )}
            </button>
          </div>

          {/* 4 Key Recovery Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
              <div className="flex items-center gap-2 text-blue-400">
                <BedDouble className="w-5 h-5" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">1. Sono Anabólico</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Priorize 7 a 9 horas de sono profundo. É no sono REM que ocorre o pico de GH e o reparo tecidual.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-400">
                <Droplets className="w-5 h-5" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">2. Super Hidratação</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mantenha a meta hídrica diária rigorosamente (~40 a 50ml/kg) para desinflamar articulações.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">3. Dieta 100% On-Plan</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Não pule refeições. Mantenha os macronutrientes prescritos para garantir substrato para a síntese proteica.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400">
                <Coffee className="w-5 h-5" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">4. Zero Sobrecarga</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Evite esforços exaustivos. Deixe tendões, ligamentos e o SNC (Sistema Nervoso Central) recarregarem.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Deseja alterar as diretrizes deste dia?</span>
            </div>
            <button
              onClick={handleOpenEditSplit}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition border border-white/10"
            >
              Editar Configurações do Dia
            </button>
          </div>
        </motion.div>
      )}

      {/* DAILY CARDIO ORIENTATION CARD */}
      {(activeSplit.cardioOrientation?.enabled || activeSplit.cardioProtocol) && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl liquid-glass border transition-all duration-300 p-5 sm:p-6 shadow-2xl relative overflow-hidden ${
            activeSplit.cardioOrientation?.isCompletedToday
              ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-950/50 via-slate-900/80 to-slate-950/90'
              : 'border-teal-500/40 bg-gradient-to-br from-teal-950/40 via-slate-900/70 to-slate-950/85'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-lg ${
                  activeSplit.cardioOrientation?.isCompletedToday
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50'
                    : 'bg-teal-600/30 text-teal-300 border-teal-500/50 shadow-teal-950/50'
                }`}
              >
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {isCardioOnlyDay ? 'Sessão Exclusiva de Cardio' : 'Orientação de Cardio do Dia'}
                  </span>
                  {activeSplit.cardioOrientation?.timing && (
                    <span className="text-xs text-amber-300 font-bold">
                      • {activeSplit.cardioOrientation.timing}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {activeSplit.cardioOrientation?.type || activeSplit.cardioProtocol?.type}
                </h3>
              </div>
            </div>

            {/* Check/Complete Button */}
            <button
              onClick={handleToggleCardioCompleted}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border shadow-lg ${
                activeSplit.cardioOrientation?.isCompletedToday
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-950/50'
                  : 'bg-teal-600 hover:bg-teal-500 text-white border-teal-400 shadow-teal-950/50'
              }`}
            >
              {activeSplit.cardioOrientation?.isCompletedToday ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cardio Concluído Hoje ✓</span>
                </>
              ) : (
                <>
                  <HeartPulse className="w-4 h-4" />
                  <span>Marcar Cardio como Feito</span>
                </>
              )}
            </button>
          </div>

          {/* Cardio Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Duração</span>
              <p className="text-base font-black text-teal-300 mt-0.5">
                {activeSplit.cardioOrientation?.durationMinutes ||
                  activeSplit.cardioProtocol?.durationMinutes}{' '}
                min
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Intensidade / FC</span>
              <p className="text-sm font-bold text-white mt-0.5 truncate">
                {activeSplit.cardioOrientation?.intensity ||
                  activeSplit.cardioProtocol?.intensity ||
                  'Zona 2'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Meta Calórica</span>
              <p className="text-base font-black text-amber-400 mt-0.5">
                ~
                {activeSplit.cardioOrientation?.targetKcal ||
                  activeSplit.cardioProtocol?.targetKcal ||
                  200}{' '}
                kcal
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Momento</span>
              <p className="text-sm font-bold text-indigo-300 mt-0.5">
                {activeSplit.cardioOrientation?.timing || 'Pós-Treino'}
              </p>
            </div>
          </div>

          {/* Specific Coach Instructions */}
          {(activeSplit.cardioOrientation?.instructions || activeSplit.cardioProtocol) && (
            <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-500/20 text-xs text-teal-100 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-teal-300">Instruções Técnicas do Treinador:</span>
                <p className="leading-relaxed">
                  {activeSplit.cardioOrientation?.instructions ||
                    'Manter ritmo constante na esteira ou bike para queima lipídica eficiente.'}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* CARDIO ONLY DAY BANNER NOTE */}
      {isCardioOnlyDay && (
        <div className="p-6 rounded-3xl bg-teal-950/20 border border-teal-500/20 text-center space-y-2">
          <HeartPulse className="w-8 h-8 text-teal-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">Sessão Exclusiva de Aeróbio</h4>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Este dia foi prescrito sem exercícios de musculação com pesos para permitir descanso articular e estímulo aeróbio mitocondrial.
          </p>
        </div>
      )}

      {/* EXERCISES & SETS LIST (Only when there are exercises) */}
      {!isRestDay && !isCardioOnlyDay && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Grade de Exercícios ({activeSplit.exercises.length})
              </h3>
              <p className="text-xs text-slate-400">
                Registre a carga executada e clique na série para marcar como concluída.
              </p>
            </div>

            <button
              onClick={handleOpenEditSplit}
              className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1"
            >
              <Edit className="w-3.5 h-3.5" /> Editar Grade
            </button>
          </div>

          {activeSplit.exercises.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white/5 border border-dashed border-white/10 space-y-3">
              <Dumbbell className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-slate-300">
                Nenhum exercício cadastrado para este dia
              </p>
              <p className="text-xs text-slate-400">
                Clique em "Alterar Prescrição" para cadastrar os exercícios e séries deste dia.
              </p>
              <button
                onClick={handleOpenEditSplit}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold"
              >
                + Adicionar Exercícios
              </button>
            </div>
          ) : (
            activeSplit.exercises.map((exercise, exIdx) => {
              const isExDone = exercise.sets.every((s) => s.isCompleted);

              return (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: exIdx * 0.04 }}
                  className={`rounded-3xl liquid-glass border transition-all duration-200 overflow-hidden ${
                    isExDone
                      ? 'border-emerald-500/40 bg-emerald-950/15'
                      : 'border-white/10 bg-slate-900/60'
                  }`}
                >
                  {/* Exercise Header */}
                  <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-orange-600/30 text-orange-300 flex items-center justify-center text-xs font-black">
                          {exIdx + 1}
                        </span>
                        <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">
                          {exercise.targetMuscle}
                        </span>
                        {exercise.cadence && (
                          <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                            Cadência: {exercise.cadence}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                        {exercise.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onOpenRestTimer(
                            exercise.restSeconds || 60,
                            exercise.name,
                            `${exercise.sets.length} séries`
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-orange-300 text-xs font-bold transition flex items-center gap-1.5 border border-white/10"
                      >
                        <Timer className="w-3.5 h-3.5" />
                        <span>{exercise.restSeconds || 60}s Descanso</span>
                      </button>
                    </div>
                  </div>

                  {/* Technical Notes if any */}
                  {exercise.technicalNotes && (
                    <div className="px-5 py-2.5 bg-orange-950/30 border-b border-white/5 text-xs text-orange-200 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span>{exercise.technicalNotes}</span>
                    </div>
                  )}

                  {/* Sets Section: Responsive Desktop Table and Mobile Cards */}
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Desktop View (Table >= md) */}
                    <div className="hidden md:block space-y-2">
                      <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-slate-400 px-3 py-1">
                        <span className="col-span-2">Série</span>
                        <span className="col-span-2">Meta Prescrita</span>
                        <span className="col-span-3">Reps Realizadas</span>
                        <span className="col-span-2">Carga (kg)</span>
                        <span className="col-span-1 text-center">Técnica</span>
                        <span className="col-span-2 text-right">Ação</span>
                      </div>

                      {exercise.sets.map((set) => (
                        <div
                          key={`desktop-${set.setNumber}`}
                          className={`grid grid-cols-12 items-center p-3 rounded-2xl transition border ${
                            set.isCompleted
                              ? 'bg-emerald-950/30 border-emerald-500/30'
                              : 'bg-black/30 border-white/5 hover:border-white/15'
                          }`}
                        >
                          {/* Set Number */}
                          <div className="col-span-2 flex items-center gap-2">
                            <span
                              className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center ${
                                set.isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white/10 text-slate-200'
                              }`}
                            >
                              {set.setNumber}
                            </span>
                            <span className="text-xs font-bold text-slate-300">
                              Série {set.setNumber}
                            </span>
                          </div>

                          {/* Prescribed Target (Preserved and visually distinct) */}
                          <div className="col-span-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-mono font-bold bg-orange-950/50 text-orange-300 border border-orange-500/30">
                              {set.repsTarget} reps
                            </span>
                          </div>

                          {/* Reps Logged */}
                          <div className="col-span-3">
                            <label htmlFor={`d-reps-${exercise.id}-${set.setNumber}`} className="sr-only">
                              Repetições realizadas da série {set.setNumber}
                            </label>
                            <input
                              id={`d-reps-${exercise.id}-${set.setNumber}`}
                              type="text"
                              inputMode="numeric"
                              value={set.repsLogged ?? ''}
                              onChange={(e) =>
                                handleUpdateLoggedReps(
                                  exercise.id,
                                  set.setNumber,
                                  e.target.value
                                )
                              }
                              placeholder={set.repsTarget}
                              className="w-24 px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white font-bold focus:outline-none focus:border-orange-500"
                            />
                          </div>

                          {/* Weight Logged */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-1.5">
                              <label htmlFor={`d-weight-${exercise.id}-${set.setNumber}`} className="sr-only">
                                Carga em kg da série {set.setNumber}
                              </label>
                              <input
                                id={`d-weight-${exercise.id}-${set.setNumber}`}
                                type="text"
                                inputMode="decimal"
                                value={
                                  set.weightKgLogged !== undefined && set.weightKgLogged !== 0
                                    ? set.weightKgLogged
                                    : ''
                                }
                                onChange={(e) =>
                                  handleUpdateLoggedWeight(
                                    exercise.id,
                                    set.setNumber,
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="w-18 px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs text-amber-300 font-bold focus:outline-none focus:border-orange-500"
                              />
                              <span className="text-xs font-bold text-slate-400">kg</span>
                            </div>
                          </div>

                          {/* Technique Badge */}
                          <div className="col-span-1 text-center">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-orange-300 border border-white/10 whitespace-nowrap">
                              {set.technique}
                            </span>
                          </div>

                          {/* Complete Toggle Button */}
                          <div className="col-span-2 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleSetCompleted(exercise.id, set.setNumber)
                              }
                              className={`px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 text-xs font-bold transition border min-h-[36px] ${
                                set.isCompleted
                                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-950/50'
                                  : 'bg-white/5 hover:bg-white/15 border-white/10 text-slate-300'
                              }`}
                              title={set.isCompleted ? 'Desfazer conclusão da série' : 'Marcar série como realizada'}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{set.isCompleted ? 'Concluída' : 'Pendente'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mobile View (Touch-friendly Cards < md) */}
                    <div className="block md:hidden space-y-3">
                      {exercise.sets.map((set) => (
                        <div
                          key={`mobile-${set.setNumber}`}
                          className={`p-4 rounded-2xl border space-y-3 transition ${
                            set.isCompleted
                              ? 'bg-emerald-950/25 border-emerald-500/35 shadow-sm'
                              : 'bg-black/35 border-white/10'
                          }`}
                        >
                          {/* Card Header: Set Number, Technique and Rest Timer */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center ${
                                  set.isCompleted
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white/10 text-slate-200'
                                }`}
                              >
                                {set.setNumber}
                              </span>
                              <span className="text-sm font-bold text-white">
                                Série {set.setNumber}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-orange-300 border border-white/10">
                                {set.technique}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                onOpenRestTimer(
                                  exercise.restSeconds || 60,
                                  exercise.name,
                                  `Série ${set.setNumber} de ${exercise.sets.length}`
                                )
                              }
                              className="px-2.5 py-1 rounded-xl bg-orange-950/40 border border-orange-500/30 text-orange-300 text-xs font-bold flex items-center gap-1 min-h-[36px]"
                              title="Iniciar cronômetro de descanso"
                            >
                              <Timer className="w-3.5 h-3.5" />
                              <span>{exercise.restSeconds || 60}s</span>
                            </button>
                          </div>

                          {/* Prescribed Target Banner */}
                          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-orange-950/30 border border-orange-500/20 text-xs text-orange-200">
                            <span className="text-[11px] font-semibold text-orange-300/80">Meta do Treinador:</span>
                            <span className="font-bold font-mono text-orange-300 bg-orange-950/60 px-2 py-0.5 rounded-md border border-orange-500/30">
                              {set.repsTarget} reps
                            </span>
                          </div>

                          {/* Dual Inputs: Reps Realizadas + Carga (kg) */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label
                                htmlFor={`m-reps-${exercise.id}-${set.setNumber}`}
                                className="text-[11px] font-bold text-slate-300"
                              >
                                Repetições
                              </label>
                              <input
                                id={`m-reps-${exercise.id}-${set.setNumber}`}
                                type="text"
                                inputMode="numeric"
                                value={set.repsLogged ?? ''}
                                onChange={(e) =>
                                  handleUpdateLoggedReps(
                                    exercise.id,
                                    set.setNumber,
                                    e.target.value
                                  )
                                }
                                placeholder={set.repsTarget}
                                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-sm text-white font-bold focus:outline-none focus:border-orange-500 min-h-[44px]"
                              />
                            </div>

                            <div className="space-y-1">
                              <label
                                htmlFor={`m-weight-${exercise.id}-${set.setNumber}`}
                                className="text-[11px] font-bold text-slate-300"
                              >
                                Carga (kg)
                              </label>
                              <div className="relative">
                                <input
                                  id={`m-weight-${exercise.id}-${set.setNumber}`}
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    set.weightKgLogged !== undefined && set.weightKgLogged !== 0
                                      ? set.weightKgLogged
                                      : ''
                                  }
                                  onChange={(e) =>
                                    handleUpdateLoggedWeight(
                                      exercise.id,
                                      set.setNumber,
                                      e.target.value
                                    )
                                  }
                                  placeholder="0.0"
                                  className="w-full px-3 py-2 pr-8 rounded-xl bg-black/60 border border-white/20 text-sm text-amber-300 font-bold focus:outline-none focus:border-orange-500 min-h-[44px]"
                                />
                                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                                  kg
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Complete / Undo Action Button */}
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleSetCompleted(exercise.id, set.setNumber)
                            }
                            className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition border min-h-[44px] ${
                              set.isCompleted
                                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/40'
                                : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-200'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            <span>
                              {set.isCompleted
                                ? 'Série Concluída ✓ (Toque para desfazer)'
                                : 'Marcar Série como Realizada'}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}
        </>
      )}

      {/* MODALS */}
      {/* Workout Prescriber Modal */}
      {isWorkoutModalOpen && (
        <WorkoutModal
          isOpen={isWorkoutModalOpen}
          onClose={() => {
            setIsWorkoutModalOpen(false);
            setSplitToEdit(null);
          }}
          onSave={handleSaveWorkoutSplit}
          splitToEdit={splitToEdit}
          existingSplitsCount={workoutSplits.length}
          exerciseLibrary={exerciseLibrary}
          onSaveExerciseToLibrary={onSaveExerciseToLibrary}
          onDeleteExerciseFromLibrary={onDeleteExerciseFromLibrary}
          athlete={athlete}
        />
      )}

      {/* Standalone Exercise Bank Browser Modal */}
      {isExerciseBankModalOpen && (
        <ExercisePickerModal
          isOpen={isExerciseBankModalOpen}
          onClose={() => setIsExerciseBankModalOpen(false)}
          exerciseLibrary={exerciseLibrary}
          onSelectExercise={(libEx) => {
            onToast(
              'Exercício Selecionado',
              `"${libEx.name}" está disponível no banco. Abra a prescrição de qualquer dia para inseri-lo.`
            );
            setIsExerciseBankModalOpen(false);
          }}
          onSaveNewToLibrary={(newEx) => {
            if (onSaveExerciseToLibrary) {
              onSaveExerciseToLibrary(newEx);
            }
          }}
          onDeleteFromLibrary={onDeleteExerciseFromLibrary}
        />
      )}

      {/* Workout Template Manager Modal */}
      {isTemplateModalOpen && (
        <WorkoutTemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          templates={templates}
          activeSplit={activeSplit}
          onApplyTemplate={handleApplyTemplate}
          onSaveTemplate={onSaveTemplate}
          onDeleteTemplate={onDeleteTemplate}
          canAddNewSplit={workoutSplits.length < 7}
        />
      )}

      {/* Delete Confirmation Modal */}
      {splitToDelete && (
        <DeleteWorkoutModal
          isOpen={Boolean(splitToDelete)}
          onClose={() => setSplitToDelete(null)}
          onConfirm={handleConfirmDeleteSplit}
          split={splitToDelete}
        />
      )}
    </div>
  );
};
