import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Dumbbell,
  Plus,
  Trash2,
  HeartPulse,
  Flame,
  Clock,
  Sparkles,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  Check,
  Calendar,
  Compass,
  AlertCircle,
  Moon,
  Coffee,
  Activity,
  CheckCircle2,
  BookmarkPlus,
  BookOpen,
  Search
} from 'lucide-react';
import { WorkoutSplit, Exercise, ExerciseSet, TechniqueType, WorkoutCardioOrientation, LibraryExercise } from '../types';
import { soundFx } from '../utils/audio';
import { ExercisePickerModal } from './ExercisePickerModal';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (split: WorkoutSplit) => void;
  splitToEdit?: WorkoutSplit | null;
  existingSplitsCount: number;
  exerciseLibrary?: LibraryExercise[];
  onSaveExerciseToLibrary?: (exercise: LibraryExercise) => void;
  onDeleteExerciseFromLibrary?: (exerciseId: string) => void;
}

const DAYS_OF_WEEK = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];

const SPLIT_CODES = [
  'Treino A',
  'Treino B',
  'Treino C',
  'Treino D',
  'Treino E',
  'Treino F',
  'Treino G',
  'Cardio',
  'OFF',
  'Descanso'
];

const MUSCLE_OPTIONS = [
  'Peitoral',
  'Dorsal',
  'Quadríceps',
  'Deltoides',
  'Tríceps',
  'Bíceps',
  'Posteriores de Coxa',
  'Glúteos',
  'Panturrilhas',
  'Abdômen',
  'Trapézio',
  'Antebraço',
  'Lombar',
  'Cardiovascular',
  'Descanso / Recuperação',
  'Recuperação Ativa'
];

const TECHNIQUES: TechniqueType[] = [
  'Normal',
  'Drop set',
  'Back-off set',
  'Cluster set',
  'Rest-pause',
  'Warm-up',
  'Falha Concêntrica'
];

const CARDIO_TYPES = [
  'Esteira Inclinada',
  'Bike Ergométrica / Spinning',
  'Escada (StairMaster)',
  'LISS em Jejum',
  'HIIT na Esteira / AirBike',
  'Elíptico / Transport',
  'Caminhada ao Ar Livre',
  'Remo Seco / Ergômetro'
];

const TIMING_OPTIONS = [
  'Pós-Treino',
  'Em Jejum (Manhã)',
  'Horário Oposto',
  'Antes do Treino',
  'Sessão Exclusiva (Dia Todo)'
];

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  isOpen,
  onClose,
  onSave,
  splitToEdit,
  existingSplitsCount,
  exerciseLibrary = [],
  onSaveExerciseToLibrary,
  onDeleteExerciseFromLibrary
}) => {
  const isEditing = Boolean(splitToEdit);

  // Exercise Bank & Picker States
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [pickerTargetIndex, setPickerTargetIndex] = useState<number | null>(null);
  const [focusedExIndex, setFocusedExIndex] = useState<number | null>(null);
  const [saveToLibraryFlags, setSaveToLibraryFlags] = useState<{ [exId: string]: boolean }>({});
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  // Determine initial day type
  const getInitialDayType = (): 'workout' | 'cardio_only' | 'rest_day' => {
    if (!splitToEdit) return 'workout';
    const exCount = splitToEdit.exercises?.length || 0;
    const hasCardio = Boolean(splitToEdit.cardioOrientation?.enabled || splitToEdit.cardioProtocol);
    if (exCount === 0 && hasCardio) return 'cardio_only';
    if (exCount === 0 && !hasCardio) return 'rest_day';
    return 'workout';
  };

  const [dayType, setDayType] = useState<'workout' | 'cardio_only' | 'rest_day'>(getInitialDayType);

  // Form State
  const [code, setCode] = useState<string>(
    splitToEdit?.code || `Treino ${String.fromCharCode(65 + Math.min(existingSplitsCount, 6))}`
  );
  const [name, setName] = useState<string>(splitToEdit?.name || '');
  const [dayOfWeek, setDayOfWeek] = useState<string>(
    splitToEdit?.dayOfWeek || DAYS_OF_WEEK[Math.min(existingSplitsCount, 6)]
  );
  const [targetMuscles, setTargetMuscles] = useState<string[]>(
    splitToEdit?.targetMuscleGroups || ['Peitoral', 'Tríceps']
  );
  const [durationMinutes, setDurationMinutes] = useState<number | string>(
    splitToEdit?.estimatedDurationMinutes ?? 60
  );

  // Cardio Orientation State
  const [cardioEnabled, setCardioEnabled] = useState<boolean>(
    splitToEdit?.cardioOrientation?.enabled ?? Boolean(splitToEdit?.cardioProtocol)
  );
  const [cardioType, setCardioType] = useState<string>(
    splitToEdit?.cardioOrientation?.type || splitToEdit?.cardioProtocol?.type || 'Esteira Inclinada'
  );
  const [cardioDuration, setCardioDuration] = useState<number | string>(
    splitToEdit?.cardioOrientation?.durationMinutes ?? splitToEdit?.cardioProtocol?.durationMinutes ?? 25
  );
  const [cardioIntensity, setCardioIntensity] = useState<string>(
    splitToEdit?.cardioOrientation?.intensity || splitToEdit?.cardioProtocol?.intensity || 'Zona 2 (120 - 135 BPM)'
  );
  const [cardioTargetKcal, setCardioTargetKcal] = useState<number | string>(
    splitToEdit?.cardioOrientation?.targetKcal ?? splitToEdit?.cardioProtocol?.targetKcal ?? 200
  );
  const [cardioTiming, setCardioTiming] = useState<string>(
    splitToEdit?.cardioOrientation?.timing || 'Pós-Treino'
  );
  const [cardioInstructions, setCardioInstructions] = useState<string>(
    splitToEdit?.cardioOrientation?.instructions ||
      'Realizar imediatamente após o treino. Manter ritmo constante para oxidação lipídica e preservação mitocondrial.'
  );

  // Exercises State
  const [exercises, setExercises] = useState<Exercise[]>(
    splitToEdit?.exercises
      ? JSON.parse(JSON.stringify(splitToEdit.exercises))
      : [
          {
            id: `ex-${Date.now()}-1`,
            name: 'Supino Inclinado com Halteres',
            targetMuscle: 'Peitoral',
            restSeconds: 90,
            cadence: '3010',
            technicalNotes: 'Banco a 30°. Amplitude máxima sem perder adução escapular.',
            sets: [
              { setNumber: 1, repsTarget: '12-15', weightKgLogged: 24, technique: 'Warm-up', isCompleted: false },
              { setNumber: 2, repsTarget: '8-10', weightKgLogged: 32, technique: 'Normal', isCompleted: false },
              { setNumber: 3, repsTarget: '8-10', weightKgLogged: 36, technique: 'Normal', isCompleted: false },
              { setNumber: 4, repsTarget: '8 + Drop', weightKgLogged: 36, technique: 'Drop set', isCompleted: false }
            ]
          }
        ]
  );

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'details' | 'exercises' | 'cardio'>('details');

  // Handle Switch Day Type Presets
  const handleSelectDayType = (type: 'workout' | 'cardio_only' | 'rest_day') => {
    soundFx.playClick();
    setDayType(type);

    if (type === 'cardio_only') {
      setExercises([]);
      setCardioEnabled(true);
      setTargetMuscles(['Cardiovascular']);
      if (!isEditing || code.startsWith('Treino') || code === 'OFF' || code === 'Descanso') {
        setCode('Cardio');
      }
      if (!name || name.includes('Treino') || name.includes('Descanso') || name.includes('OFF')) {
        setName('Sessão Exclusiva de Cardiovascular');
      }
      setDurationMinutes(40);
      setCardioDuration(40);
      setCardioTiming('Sessão Exclusiva (Dia Todo)');
      setCardioInstructions(
        'Sessão cardiovascular exclusiva para oxidação lipídica e integridade mitocondrial. Manter hidratação constante.'
      );
      setActiveTab('cardio');
    } else if (type === 'rest_day') {
      setExercises([]);
      setCardioEnabled(false);
      setTargetMuscles(['Descanso / Recuperação']);
      setCode('OFF');
      if (!name || name.includes('Treino') || name.includes('Cardio')) {
        setName('Descanso Total (OFF Regenerativo)');
      }
      setDurationMinutes(0);
      setCardioDuration(0);
      setActiveTab('details');
    } else {
      // workout
      if (exercises.length === 0) {
        setExercises([
          {
            id: `ex-${Date.now()}-1`,
            name: 'Supino Inclinado com Halteres',
            targetMuscle: 'Peitoral',
            restSeconds: 90,
            cadence: '3010',
            technicalNotes: 'Banco a 30°. Amplitude máxima sem perder adução escapular.',
            sets: [
              { setNumber: 1, repsTarget: '12-15', weightKgLogged: 24, technique: 'Warm-up', isCompleted: false },
              { setNumber: 2, repsTarget: '8-10', weightKgLogged: 32, technique: 'Normal', isCompleted: false },
              { setNumber: 3, repsTarget: '8-10', weightKgLogged: 36, technique: 'Normal', isCompleted: false }
            ]
          }
        ]);
      }
      setTargetMuscles(['Peitoral', 'Tríceps']);
      if (code === 'OFF' || code === 'Descanso' || code === 'Cardio') {
        setCode(`Treino ${String.fromCharCode(65 + Math.min(existingSplitsCount, 6))}`);
      }
      if (!name || name.includes('Descanso') || name.includes('Cardio')) {
        setName('Upper Body (Peitoral & Deltoides)');
      }
      setDurationMinutes(60);
    }
  };

  const handleToggleMuscle = (muscle: string) => {
    soundFx.playClick();
    setTargetMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  // Add Exercise from Library
  const handleSelectFromLibrary = (libEx: LibraryExercise, targetIndex?: number | null) => {
    soundFx.playSuccess();
    setDayType('workout');

    const populatedSets: ExerciseSet[] = Array.from({
      length: libEx.defaultSetsCount || 3
    }).map((_, i) => ({
      setNumber: i + 1,
      repsTarget: libEx.defaultRepsTarget || '8-10',
      weightKgLogged: 20,
      technique: libEx.defaultTechnique || 'Normal',
      isCompleted: false
    }));

    if (targetIndex !== null && targetIndex !== undefined && exercises[targetIndex]) {
      setExercises((prev) =>
        prev.map((ex, i) =>
          i === targetIndex
            ? {
                ...ex,
                name: libEx.name,
                targetMuscle: libEx.targetMuscle,
                restSeconds: libEx.defaultRestSeconds || 75,
                cadence: libEx.cadence || '2011',
                technicalNotes: libEx.technicalNotes || '',
                sets: populatedSets
              }
            : ex
        )
      );
    } else {
      const newEx: Exercise = {
        id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: libEx.name,
        targetMuscle: libEx.targetMuscle,
        restSeconds: libEx.defaultRestSeconds || 75,
        cadence: libEx.cadence || '2011',
        technicalNotes: libEx.technicalNotes || '',
        sets: populatedSets
      };
      setExercises((prev) => [...prev, newEx]);
    }
  };

  // Add Exercise
  const handleAddExercise = () => {
    soundFx.playClick();
    setDayType('workout');
    const newEx: Exercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      targetMuscle: targetMuscles[0] || 'Geral',
      restSeconds: 75,
      cadence: '2011',
      technicalNotes: '',
      sets: [
        { setNumber: 1, repsTarget: '10-12', weightKgLogged: 20, technique: 'Normal', isCompleted: false },
        { setNumber: 2, repsTarget: '8-10', weightKgLogged: 25, technique: 'Normal', isCompleted: false },
        { setNumber: 3, repsTarget: '8-10', weightKgLogged: 30, technique: 'Normal', isCompleted: false }
      ]
    };
    setExercises((prev) => [...prev, newEx]);
  };

  // Remove Exercise
  const handleRemoveExercise = (index: number) => {
    soundFx.playClick();
    setExercises((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        if (cardioEnabled) setDayType('cardio_only');
        else setDayType('rest_day');
      }
      return updated;
    });
  };

  // Update Exercise Field
  const handleUpdateExercise = (index: number, field: keyof Exercise, value: any) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  // Add Set to Exercise
  const handleAddSet = (exIndex: number) => {
    soundFx.playClick();
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIndex) return ex;
        const nextSetNum = ex.sets.length + 1;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: ExerciseSet = {
          setNumber: nextSetNum,
          repsTarget: lastSet?.repsTarget || '8-10',
          weightKgLogged: lastSet?.weightKgLogged || 20,
          technique: 'Normal',
          isCompleted: false
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  };

  // Remove Set from Exercise
  const handleRemoveSet = (exIndex: number, setNum: number) => {
    soundFx.playClick();
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIndex) return ex;
        const filtered = ex.sets.filter((s) => s.setNumber !== setNum);
        const renumbered = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
        return { ...ex, sets: renumbered };
      })
    );
  };

  // Update Set Field
  const handleUpdateSet = (
    exIndex: number,
    setNum: number,
    field: keyof ExerciseSet,
    value: any
  ) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIndex) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.setNumber === setNum ? { ...s, [field]: value } : s))
        };
      })
    );
  };

  // Save full split
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalName = name.trim();
    if (!finalName) {
      if (dayType === 'rest_day' || code === 'OFF' || code === 'Descanso') {
        finalName = 'Descanso Total (OFF Regenerativo)';
      } else if (dayType === 'cardio_only' || code === 'Cardio') {
        finalName = 'Sessão Exclusiva de Cardiovascular';
      } else {
        finalName = `${code} (${dayOfWeek})`;
      }
    }

    const parsedCardioDuration =
      typeof cardioDuration === 'number'
        ? cardioDuration
        : cardioDuration === ''
        ? 0
        : parseInt(cardioDuration, 10) || 0;

    const parsedTargetKcal =
      typeof cardioTargetKcal === 'number'
        ? cardioTargetKcal
        : cardioTargetKcal === ''
        ? 0
        : parseInt(cardioTargetKcal, 10) || 0;

    const parsedWorkoutDuration =
      typeof durationMinutes === 'number'
        ? durationMinutes
        : durationMinutes === ''
        ? (dayType === 'rest_day' ? 0 : 60)
        : parseInt(durationMinutes, 10) || (dayType === 'rest_day' ? 0 : 60);

    const isCardioActive = dayType === 'cardio_only' ? true : dayType === 'rest_day' ? false : cardioEnabled;

    const cardioOrientation: WorkoutCardioOrientation = {
      enabled: isCardioActive,
      type: cardioType,
      durationMinutes: parsedCardioDuration,
      intensity: cardioIntensity,
      targetKcal: parsedTargetKcal,
      timing: (cardioTiming as any) || 'Pós-Treino',
      instructions: cardioInstructions,
      isCompletedToday: splitToEdit?.cardioOrientation?.isCompletedToday || false
    };

    // Calculate target muscle groups
    let finalTargetMuscles = targetMuscles;
    if (dayType === 'rest_day' || (exercises.length === 0 && !isCardioActive)) {
      finalTargetMuscles = ['Descanso / Recuperação'];
    } else if (dayType === 'cardio_only' || (exercises.length === 0 && isCardioActive)) {
      finalTargetMuscles = ['Cardiovascular'];
    } else if (finalTargetMuscles.length === 0) {
      finalTargetMuscles = ['Geral'];
    }

    const finalSplit: WorkoutSplit = {
      id: splitToEdit?.id || `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: code,
      name: finalName,
      dayOfWeek: dayOfWeek,
      targetMuscleGroups: finalTargetMuscles,
      estimatedDurationMinutes: dayType === 'rest_day' ? 0 : dayType === 'cardio_only' ? parsedCardioDuration : parsedWorkoutDuration,
      exercises: dayType === 'rest_day' || dayType === 'cardio_only' ? [] : exercises,
      isCompletedToday: splitToEdit?.isCompletedToday || false,
      cardioOrientation: cardioOrientation,
      cardioProtocol: isCardioActive
        ? {
            type: cardioType,
            durationMinutes: parsedCardioDuration,
            intensity: cardioIntensity,
            targetKcal: parsedTargetKcal,
            heartRateZone: cardioIntensity
          }
        : undefined
    };

    // Automatically save newly registered exercises to the Exercise Bank if flagged
    if (onSaveExerciseToLibrary && exerciseLibrary && dayType === 'workout') {
      exercises.forEach((ex) => {
        const cleanName = ex.name.trim();
        if (cleanName.length >= 2) {
          const exists = exerciseLibrary.some(
            (lib) => lib.name.toLowerCase() === cleanName.toLowerCase()
          );
          const shouldSave = saveToLibraryFlags[ex.id] ?? true;
          if (!exists && shouldSave) {
            const newLibEx: LibraryExercise = {
              id: `lib-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: cleanName,
              targetMuscle: ex.targetMuscle || 'Geral',
              defaultRestSeconds: ex.restSeconds || 75,
              defaultSetsCount: ex.sets.length || 3,
              defaultRepsTarget: ex.sets[0]?.repsTarget || '8-10',
              defaultTechnique: ex.sets[0]?.technique || 'Normal',
              cadence: ex.cadence || '2011',
              technicalNotes: ex.technicalNotes || undefined,
              isCustom: true,
              createdAt: new Date().toISOString().split('T')[0],
              usageCount: 1
            };
            onSaveExerciseToLibrary(newLibEx);
          }
        }
      });
    }

    soundFx.playRestComplete();
    onSave(finalSplit);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl modal-liquid-glass border border-orange-500/30 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg border ${
              dayType === 'rest_day'
                ? 'bg-blue-600/30 text-blue-400 border-blue-500/40 shadow-blue-950/40'
                : dayType === 'cardio_only'
                ? 'bg-teal-600/30 text-teal-400 border-teal-500/40 shadow-teal-950/40'
                : 'bg-orange-600/30 text-orange-400 border-orange-500/40 shadow-orange-950/40'
            }`}>
              {dayType === 'rest_day' ? (
                <Moon className="w-6 h-6" />
              ) : dayType === 'cardio_only' ? (
                <HeartPulse className="w-6 h-6" />
              ) : (
                <Dumbbell className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                  dayType === 'rest_day'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : dayType === 'cardio_only'
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                    : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                }`}>
                  {isEditing ? 'Alterar Prescrição do Dia' : 'Incluir Novo Dia na Periodização'}
                </span>
                <span className="text-xs text-slate-400">
                  {existingSplitsCount}/7 Dias Cadastrados
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {isEditing ? `Editar ${splitToEdit?.code}` : 'Configuração de Treino, Cardio ou Descanso'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DAY TYPE SELECTOR (MUSCULAÇÃO vs CARDIO EXCLUSIVO vs DESCANSO TOTAL) */}
        <div className="px-5 sm:px-6 pt-4 pb-2 bg-black/40 border-b border-white/5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Tipo de Prescrição para este Dia:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleSelectDayType('workout')}
              className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                dayType === 'workout'
                  ? 'bg-orange-600/25 border-orange-400 text-white shadow-md shadow-orange-950/40 ring-1 ring-orange-500/50'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${dayType === 'workout' ? 'bg-orange-600 text-white' : 'bg-white/10 text-orange-400'}`}>
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black">Musculação</div>
                <div className="text-[10px] text-slate-400">Com exercícios & cardio opcional</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDayType('cardio_only')}
              className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                dayType === 'cardio_only'
                  ? 'bg-teal-600/25 border-teal-400 text-white shadow-md shadow-teal-950/40 ring-1 ring-teal-500/50'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${dayType === 'cardio_only' ? 'bg-teal-600 text-white' : 'bg-white/10 text-teal-400'}`}>
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black">Cardio Exclusivo</div>
                <div className="text-[10px] text-teal-300">Apenas aeróbio (0 musculação)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDayType('rest_day')}
              className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                dayType === 'rest_day'
                  ? 'bg-blue-600/25 border-blue-400 text-white shadow-md shadow-blue-950/40 ring-1 ring-blue-500/50'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${dayType === 'rest_day' ? 'bg-blue-600 text-white' : 'bg-white/10 text-blue-400'}`}>
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black">Descanso Total (OFF)</div>
                <div className="text-[10px] text-blue-300">Sem treino & sem cardio (Recuperação)</div>
              </div>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 pb-2 border-b border-white/10 bg-black/20 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('details');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 border shrink-0 ${
              activeTab === 'details'
                ? 'bg-orange-600 text-white border-orange-400 shadow-md shadow-orange-950/50'
                : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>1. Informações & Dia</span>
          </button>

          {dayType !== 'rest_day' && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setActiveTab('exercises');
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 border shrink-0 ${
                activeTab === 'exercises'
                  ? 'bg-orange-600 text-white border-orange-400 shadow-md shadow-orange-950/50'
                  : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>2. Exercícios & Séries ({exercises.length})</span>
            </button>
          )}

          {dayType !== 'rest_day' && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setActiveTab('cardio');
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 border shrink-0 ${
                activeTab === 'cardio'
                  ? 'bg-teal-600 text-white border-teal-400 shadow-md shadow-teal-950/50'
                  : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5 text-teal-400" />
              <span>3. Cardio do Dia {(cardioEnabled || dayType === 'cardio_only') ? '✓' : ''}</span>
            </button>
          )}
        </div>

        {/* Form Body with Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: DETAILS & DAY OF WEEK */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Day Type Summary Alert Banner */}
              {dayType === 'rest_day' && (
                <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-3">
                  <Moon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-200 space-y-1">
                    <p className="font-bold text-blue-300">Dia de Descanso Total (OFF) Selecionado</p>
                    <p>
                      Este dia será salvo na periodização semanal como <strong>descanso total e regeneração neuromuscular</strong> (sem séries de musculação e sem cardio obrigatório). O aluno acompanhará orientações de sono anabólico e hidratação.
                    </p>
                  </div>
                </div>
              )}

              {dayType === 'cardio_only' && (
                <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 flex items-start gap-3">
                  <HeartPulse className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-200 space-y-1">
                    <p className="font-bold text-teal-300">Dia Exclusivo de Cardiovascular</p>
                    <p>
                      Este dia será focado <strong>100% na sessão aeróbia / cardiovascular</strong> (sem exercícios de musculação com pesos). Configure os parâmetros de duração, intensidade e meta na aba <strong>"3. Cardio do Dia"</strong> ou salve diretamente.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Code (Treino A, B, C... Cardio, OFF) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Código do Dia *
                  </label>
                  <select
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-black/40 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-orange-500"
                  >
                    {SPLIT_CODES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day of Week Binding */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Dia da Semana Vinculado *
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-black/40 border border-orange-500/40 text-orange-300 font-bold text-sm focus:outline-none focus:border-orange-500"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estimated Duration */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    {dayType === 'rest_day' ? 'Duração (OFF)' : 'Duração Estimada (min) *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={durationMinutes}
                      disabled={dayType === 'rest_day'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setDurationMinutes('');
                        } else {
                          const num = parseInt(val, 10);
                          setDurationMinutes(isNaN(num) ? '' : num);
                        }
                      }}
                      min={0}
                      max={300}
                      placeholder={dayType === 'rest_day' ? '0' : 'Ex: 60'}
                      className={`w-full px-3.5 py-3 rounded-2xl bg-black/40 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-orange-500 pr-10 ${
                        dayType === 'rest_day' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Workout / Day Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Nome / Objetivo do Dia *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    dayType === 'rest_day'
                      ? 'Ex: Descanso Total (OFF Regenerativo)'
                      : dayType === 'cardio_only'
                      ? 'Ex: Sessão Exclusiva de Cardiovascular (Esteira / Bike)'
                      : 'Ex: Upper Body (Peitoral & Deltoides)'
                  }
                  className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Target Muscles (Chips Multi-Select) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Grupos Musculares Alvo / Foco do Dia
                </label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_OPTIONS.map((m) => {
                    const isSelected = targetMuscles.includes(m);
                    return (
                      <button
                        type="button"
                        key={m}
                        onClick={() => handleToggleMuscle(m)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                          isSelected
                            ? 'bg-orange-600/30 text-orange-300 border-orange-500/60 shadow-sm'
                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Guidance Box */}
              <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-500/20 flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-white">Flexibilidade Total de Prescrição Semanal:</p>
                  <p>
                    A periodização aceita dias de <strong>musculação</strong>, dias <strong>exclusivos de cardiovascular</strong> ou dias de <strong>descanso total (OFF)</strong>. Salve a qualquer momento usando o botão no rodapé.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXERCISES & SETS */}
          {activeTab === 'exercises' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Grade de Exercícios & Séries</h3>
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/30">
                      {exerciseLibrary.length} no Banco
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Selecione da biblioteca da assessoria para inclusão ágil ou cadastre novos exercícios.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setPickerTargetIndex(null);
                      setIsPickerOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-950/50 transition"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Banco de Exercícios</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddExercise}
                    className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-white/10 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Em Branco</span>
                  </button>
                </div>
              </div>

              {/* Toast Feedback */}
              {toastFeedback && (
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{toastFeedback}</span>
                </div>
              )}

              {exercises.length === 0 ? (
                <div className="p-8 text-center rounded-3xl bg-white/5 border border-dashed border-white/10 space-y-3">
                  <Dumbbell className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">
                    {dayType === 'cardio_only'
                      ? 'Dia configurado para Cardiovascular Exclusivo (0 exercícios)'
                      : dayType === 'rest_day'
                      ? 'Dia configurado para Descanso Total (0 exercícios)'
                      : 'Nenhum exercício incluído ainda'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {dayType === 'cardio_only'
                      ? 'Se deseja transformar este dia em musculação, adicione da biblioteca da assessoria.'
                      : 'Abra o Banco de Exercícios para prescrever em poucos cliques ou crie um em branco.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setPickerTargetIndex(null);
                        setIsPickerOpen(true);
                      }}
                      className="px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-950/50"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Selecionar no Banco de Exercícios</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddExercise}
                      className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                    >
                      + Incluir em Branco
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {exercises.map((ex, exIdx) => {
                    const cleanName = ex.name.trim();
                    const matchingLib = cleanName
                      ? exerciseLibrary.filter((lib) =>
                          lib.name.toLowerCase().includes(cleanName.toLowerCase()) ||
                          lib.targetMuscle.toLowerCase().includes(cleanName.toLowerCase())
                        ).slice(0, 4)
                      : [];

                    const exactMatch = cleanName
                      ? exerciseLibrary.find(
                          (lib) => lib.name.toLowerCase() === cleanName.toLowerCase()
                        )
                      : null;

                    const isNewExercise = cleanName.length >= 3 && !exactMatch;
                    const shouldSaveToLibrary = saveToLibraryFlags[ex.id] ?? true;

                    return (
                      <div
                        key={ex.id}
                        className="p-4 sm:p-5 rounded-3xl bg-white/5 border border-white/10 space-y-4 relative"
                      >
                        {/* Exercise Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-white/10">
                          <div className="flex-1 space-y-2 relative">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-xl bg-orange-600/40 text-orange-300 font-black text-xs flex items-center justify-center shrink-0">
                                {exIdx + 1}
                              </span>
                              <div className="relative flex-1">
                                <input
                                  type="text"
                                  value={ex.name}
                                  onFocus={() => setFocusedExIndex(exIdx)}
                                  onChange={(e) => handleUpdateExercise(exIdx, 'name', e.target.value)}
                                  placeholder="Digite o nome do exercício (ex: Supino Inclinado)..."
                                  className="w-full px-3 py-2 pr-9 rounded-xl bg-black/40 border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-orange-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundFx.playClick();
                                    setPickerTargetIndex(exIdx);
                                    setIsPickerOpen(true);
                                  }}
                                  className="absolute right-2 top-2 p-1 rounded-lg bg-orange-600/30 hover:bg-orange-600/60 text-orange-300 text-xs transition"
                                  title="Buscar no Banco de Exercícios"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Autocomplete Dropdown suggestions */}
                            {focusedExIndex === exIdx && matchingLib.length > 0 && !exactMatch && (
                              <div className="p-2 rounded-2xl bg-slate-900/95 border border-orange-500/40 shadow-xl space-y-1 z-30">
                                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                                  <span>Sugestões do Banco de Exercícios ({matchingLib.length}):</span>
                                  <button
                                    type="button"
                                    onClick={() => setFocusedExIndex(null)}
                                    className="text-slate-400 hover:text-white"
                                  >
                                    Fechar
                                  </button>
                                </div>
                                {matchingLib.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-orange-950/40 border border-white/5 hover:border-orange-500/30 transition text-xs cursor-pointer"
                                    onClick={() => {
                                      handleSelectFromLibrary(item, exIdx);
                                      setFocusedExIndex(null);
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Dumbbell className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                      <div>
                                        <p className="font-bold text-white">{item.name}</p>
                                        <span className="text-[10px] text-orange-300 font-mono">
                                          {item.targetMuscle} • {item.defaultRestSeconds}s descanso
                                          {item.cadence ? ` • ${item.cadence}` : ''}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="px-2 py-1 rounded-lg bg-orange-600 text-white text-[10px] font-bold whitespace-nowrap">
                                      Usar Dados
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Prompt for New Exercise: Save to Exercise Bank */}
                            {isNewExercise && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex items-center gap-2 text-amber-200">
                                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                                  <div>
                                    <p className="font-bold text-white text-[11px]">
                                      Exercício Novo Detectado!
                                    </p>
                                    <p className="text-[11px] text-amber-300/90">
                                      "{cleanName}" ainda não consta no Banco da Assessoria.
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-200 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={shouldSaveToLibrary}
                                      onChange={(e) =>
                                        setSaveToLibraryFlags((prev) => ({
                                          ...prev,
                                          [ex.id]: e.target.checked
                                        }))
                                      }
                                      className="rounded text-orange-500 focus:ring-orange-500"
                                    />
                                    <span>Salvar no Banco</span>
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      soundFx.playSuccess();
                                      if (onSaveExerciseToLibrary) {
                                        const newLibEx: LibraryExercise = {
                                          id: `lib-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                                          name: cleanName,
                                          targetMuscle: ex.targetMuscle || 'Geral',
                                          defaultRestSeconds: ex.restSeconds || 75,
                                          defaultSetsCount: ex.sets.length || 3,
                                          defaultRepsTarget: ex.sets[0]?.repsTarget || '8-10',
                                          defaultTechnique: ex.sets[0]?.technique || 'Normal',
                                          cadence: ex.cadence || '2011',
                                          technicalNotes: ex.technicalNotes || undefined,
                                          isCustom: true,
                                          createdAt: new Date().toISOString().split('T')[0],
                                          usageCount: 1
                                        };
                                        onSaveExerciseToLibrary(newLibEx);
                                        setToastFeedback(`Exercício "${cleanName}" salvo no Banco da Assessoria!`);
                                        setTimeout(() => setToastFeedback(null), 4000);
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm"
                                  >
                                    <BookmarkPlus className="w-3 h-3" />
                                    <span>Salvar Agora</span>
                                  </button>
                                </div>
                              </motion.div>
                            )}

                            {/* Exact match indicator */}
                            {exactMatch && (
                              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold px-1">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Exercício validado no Banco da Assessoria</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={ex.targetMuscle}
                              onChange={(e) => handleUpdateExercise(exIdx, 'targetMuscle', e.target.value)}
                              className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 focus:outline-none"
                            >
                              {MUSCLE_OPTIONS.map((m) => (
                                <option key={m} value={m} className="bg-slate-900 text-white">
                                  {m}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleRemoveExercise(exIdx)}
                              className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-500/20"
                              title="Remover exercício"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Technical Fields: Rest, Cadence, Notes */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                              Descanso entre séries (seg)
                            </label>
                            <input
                              type="number"
                              value={ex.restSeconds}
                              onChange={(e) =>
                                handleUpdateExercise(exIdx, 'restSeconds', parseInt(e.target.value, 10) || 60)
                              }
                              min={15}
                              max={300}
                              step={15}
                              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                              Cadência / Tempo (ex: 3010)
                            </label>
                            <input
                              type="text"
                              value={ex.cadence || ''}
                              onChange={(e) => handleUpdateExercise(exIdx, 'cadence', e.target.value)}
                              placeholder="Ex: 3010 ou 2011"
                              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                              Nota Técnica / Posição
                            </label>
                            <input
                              type="text"
                              value={ex.technicalNotes || ''}
                              onChange={(e) => handleUpdateExercise(exIdx, 'technicalNotes', e.target.value)}
                              placeholder="Ex: Banco a 30°, pico de contração"
                              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                            />
                          </div>
                        </div>

                        {/* Sets Table */}
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                              Séries Prescritas ({ex.sets.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddSet(exIdx)}
                              className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> + Adicionar Série
                            </button>
                          </div>

                          <div className="space-y-2">
                            {ex.sets.map((set) => (
                              <div
                                key={set.setNumber}
                                className="flex items-center gap-2 p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs"
                              >
                                <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold flex items-center justify-center text-[10px]">
                                  S{set.setNumber}
                                </span>

                                <div className="flex-1 grid grid-cols-3 gap-2">
                                  <div>
                                    <input
                                      type="text"
                                      value={set.repsTarget}
                                      onChange={(e) =>
                                        handleUpdateSet(exIdx, set.setNumber, 'repsTarget', e.target.value)
                                      }
                                      placeholder="Reps (ex: 10-12)"
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-bold"
                                    />
                                  </div>

                                  <div>
                                    <input
                                      type="number"
                                      value={set.weightKgLogged || ''}
                                      onChange={(e) =>
                                        handleUpdateSet(
                                          exIdx,
                                          set.setNumber,
                                          'weightKgLogged',
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      placeholder="Carga (kg)"
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-bold"
                                    />
                                  </div>

                                  <div>
                                    <select
                                      value={set.technique}
                                      onChange={(e) =>
                                        handleUpdateSet(exIdx, set.setNumber, 'technique', e.target.value as TechniqueType)
                                      }
                                      className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-orange-300 font-bold"
                                    >
                                      {TECHNIQUES.map((t) => (
                                        <option key={t} value={t} className="bg-slate-900 text-white">
                                          {t}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {ex.sets.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSet(exIdx, set.setNumber)}
                                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CARDIO PROTOCOL */}
          {activeTab === 'cardio' && (
            <div className="space-y-6">
              {/* Toggle Cardio */}
              <div className="p-4 sm:p-5 rounded-3xl bg-teal-950/30 border border-teal-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-teal-600/30 text-teal-300 border border-teal-500/40">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Prescrição de Cardio para este Dia</h3>
                    <p className="text-xs text-slate-300">
                      {dayType === 'cardio_only'
                        ? 'Sessão cardiovascular exclusiva ativada'
                        : 'Ative se o aluno deve realizar aeróbio antes, pós-treino ou em horário oposto.'}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cardioEnabled || dayType === 'cardio_only'}
                    onChange={(e) => {
                      soundFx.playClick();
                      setCardioEnabled(e.target.checked);
                      if (!e.target.checked && dayType === 'cardio_only') {
                        setDayType('rest_day');
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {(cardioEnabled || dayType === 'cardio_only') ? (
                <div className="space-y-4 p-5 rounded-3xl bg-white/5 border border-teal-500/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tipo de Cardio */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Modalidade de Exercício Aeróbio *
                      </label>
                      <select
                        value={cardioType}
                        onChange={(e) => setCardioType(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-2xl bg-black/40 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-teal-500"
                      >
                        {CARDIO_TYPES.map((t) => (
                          <option key={t} value={t} className="bg-slate-900 text-white">
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Momento */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Momento da Execução *
                      </label>
                      <select
                        value={cardioTiming}
                        onChange={(e) => setCardioTiming(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-2xl bg-black/40 border border-white/15 text-teal-300 font-bold text-sm focus:outline-none focus:border-teal-500"
                      >
                        {TIMING_OPTIONS.map((t) => (
                          <option key={t} value={t} className="bg-slate-900 text-white">
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Duração Minutos */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Duração do Cardio (minutos) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={cardioDuration}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setCardioDuration('');
                            } else {
                              const num = parseInt(val, 10);
                              setCardioDuration(isNaN(num) ? '' : num);
                            }
                          }}
                          min={0}
                          max={300}
                          placeholder="Ex: 30"
                          className="w-full px-3.5 py-3 rounded-2xl bg-black/40 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-teal-500 pr-12"
                        />
                        <span className="text-xs text-slate-400 font-bold absolute right-3.5 top-3.5 pointer-events-none">
                          min
                        </span>
                      </div>
                      {/* Presets rápidos */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {[15, 20, 25, 30, 40, 45, 60].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => {
                              soundFx.playClick();
                              setCardioDuration(mins);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition border ${
                              Number(cardioDuration) === mins
                                ? 'bg-teal-600 text-white border-teal-400 shadow-md shadow-teal-950/40'
                                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Meta Calórica */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Meta Calórica Estimada
                        </label>
                        <span className="text-[10px] text-amber-300 font-bold">
                          {cardioTargetKcal !== '' ? `~${cardioTargetKcal} kcal` : 'Opcional'}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={cardioTargetKcal}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setCardioTargetKcal('');
                            } else {
                              const num = parseInt(val, 10);
                              setCardioTargetKcal(isNaN(num) ? '' : num);
                            }
                          }}
                          min={0}
                          max={2000}
                          placeholder="Ex: 200"
                          className="w-full px-3.5 py-3 rounded-2xl bg-black/40 border border-white/15 text-amber-300 font-bold text-sm focus:outline-none focus:border-teal-500 pr-12"
                        />
                        <span className="text-xs text-slate-400 font-bold absolute right-3.5 top-3.5 pointer-events-none">
                          kcal
                        </span>
                      </div>
                      {/* Presets rápidos de kcal */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {[150, 200, 250, 300, 400, 500].map((kcal) => (
                          <button
                            key={kcal}
                            type="button"
                            onClick={() => {
                              soundFx.playClick();
                              setCardioTargetKcal(kcal);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition border ${
                              Number(cardioTargetKcal) === kcal
                                ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-950/40'
                                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                            }`}
                          >
                            {kcal} kcal
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Intensidade / Zona de FC */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Intensidade / Faixa de Frequência Cardíaca (BPM)
                    </label>
                    <input
                      type="text"
                      value={cardioIntensity}
                      onChange={(e) => setCardioIntensity(e.target.value)}
                      placeholder="Ex: Zona 2 (120 a 135 BPM) - Moderada Contínua"
                      className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* Instruções Detalhadas */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Orientação Específica do Treinador para o Cardio deste Dia *
                    </label>
                    <textarea
                      value={cardioInstructions}
                      onChange={(e) => setCardioInstructions(e.target.value)}
                      rows={3}
                      placeholder="Ex: Manter inclinação de 8% e velocidade 5.4 km/h sem segurar no painel para forçar estabilidade do core..."
                      className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-teal-500 leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-3xl bg-white/5 border border-dashed border-white/10 text-slate-400 text-xs">
                  Nenhum cardio prescrito para este dia. O atleta terá foco exclusivo na musculação e recuperação.
                </div>
              )}
            </div>
          )}

          {/* Footer Actions (ALWAYS SUBMITTABLE FROM ANY TAB) */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition border border-white/10"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== 'details' && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    if (activeTab === 'cardio') setActiveTab('exercises');
                    else if (activeTab === 'exercises') setActiveTab('details');
                  }}
                  className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold transition"
                >
                  ← Voltar Etapa
                </button>
              )}

              {activeTab === 'details' && dayType === 'workout' && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab('exercises');
                  }}
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-orange-300 text-xs font-bold transition border border-white/10"
                >
                  Avançar p/ Exercícios →
                </button>
              )}

              {/* PRIMARY SUBMIT BUTTON - Always visible & active */}
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold transition shadow-xl shadow-orange-950/50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isEditing
                    ? 'Salvar Prescrição do Dia'
                    : dayType === 'rest_day'
                    ? 'Confirmar Dia de Descanso (OFF)'
                    : dayType === 'cardio_only'
                    ? 'Confirmar Dia de Cardio Exclusivo'
                    : 'Confirmar & Incluir Treino'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Exercise Picker Modal */}
      {isPickerOpen && (
        <ExercisePickerModal
          isOpen={isPickerOpen}
          onClose={() => {
            setIsPickerOpen(false);
            setPickerTargetIndex(null);
          }}
          exerciseLibrary={exerciseLibrary}
          onSelectExercise={(libEx) => {
            handleSelectFromLibrary(libEx, pickerTargetIndex);
            setIsPickerOpen(false);
            setPickerTargetIndex(null);
          }}
          onSaveNewToLibrary={(newEx) => {
            if (onSaveExerciseToLibrary) {
              onSaveExerciseToLibrary(newEx);
            }
          }}
          onDeleteFromLibrary={onDeleteExerciseFromLibrary}
        />
      )}
    </div>
  );
};
