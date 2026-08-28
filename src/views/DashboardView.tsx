import React from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  Dumbbell,
  Heart,
  Droplets,
  TrendingUp,
  Scale,
  Award,
  ChevronRight,
  Pill,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  Layers,
  Moon,
  HeartPulse
} from 'lucide-react';
import { AthleteProfile, NutritionPlan, WorkoutSplit, SupplementItem, ModuleType, AnthropometricData } from '../types';
import { soundFx } from '../utils/audio';

interface DashboardViewProps {
  athlete: AthleteProfile;
  nutritionPlan: NutritionPlan;
  workoutSplits: WorkoutSplit[];
  supplements: SupplementItem[];
  onNavigate: (module: ModuleType) => void;
  onStartTodayWorkout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  athlete,
  nutritionPlan,
  workoutSplits,
  supplements,
  onNavigate,
  onStartTodayWorkout
}) => {
  const defaultAssessment: AnthropometricData = {
    date: new Date().toISOString().split('T')[0],
    weightKg: athlete.currentWeightKg || 70,
    heightCm: athlete.heightCm || 175,
    bodyFatPercentage: 12,
    muscleMassKg: 35,
    chestCm: 100,
    shouldersCm: 115,
    waistCm: 80,
    abdomenCm: 82,
    rightArmCm: 38,
    leftArmCm: 38,
    rightThighCm: 58,
    leftThighCm: 58,
    calvesCm: 38,
    glutesCm: 98,
    neckCm: 38,
    notes: 'Avaliação inicial'
  };

  const history = athlete.measurementsHistory || [];
  const currentAssessment: AnthropometricData = history[history.length - 1] || defaultAssessment;

  // Calculated macros consumed today
  const consumedCalories = nutritionPlan.meals
    .filter((m) => m.isCompleted)
    .reduce((sum, m) => sum + m.targetCaloriesKcal, 0);

  const consumedProtein = nutritionPlan.meals
    .filter((m) => m.isCompleted)
    .reduce((sum, m) => sum + m.targetProteinG, 0);

  const consumedCarbs = nutritionPlan.meals
    .filter((m) => m.isCompleted)
    .reduce((sum, m) => sum + m.targetCarbsG, 0);

  const consumedFat = nutritionPlan.meals
    .filter((m) => m.isCompleted)
    .reduce((sum, m) => sum + m.targetFatG, 0);

  const caloriesProgress = Math.min(100, Math.round((consumedCalories / nutritionPlan.dailyTargetCalories) * 100));
  const proteinProgress = Math.min(100, Math.round((consumedProtein / nutritionPlan.dailyTargetProteinG) * 100));
  const carbsProgress = Math.min(100, Math.round((consumedCarbs / nutritionPlan.dailyTargetCarbsG) * 100));
  const fatProgress = Math.min(100, Math.round((consumedFat / nutritionPlan.dailyTargetFatG) * 100));

  const todayWorkout = workoutSplits[0]; // Treino A (Upper)
  const completedSuppsCount = supplements.filter((s) => s.isTakenToday).length;

  return (
    <div className="space-y-6 pb-24">
      {/* Executive Hero / Athlete Status Card (Liquid Glass with One UI 9.0 theme) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl liquid-glass hero-dashboard p-6 sm:p-7 shadow-2xl"
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <img
                src={athlete.avatar}
                alt={athlete.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-blue-500/50 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 uppercase shadow-md">
                {athlete.status}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider">
                  {athlete.category}
                </span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{athlete.goal}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                {athlete.name}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Orientação: <strong className="text-slate-800 dark:text-white">{athlete.coachName.split('(')[0]}</strong></span>
                <span>•</span>
                <span>Idade: <strong className="text-slate-800 dark:text-white">{athlete.age} anos</strong></span>
              </p>
            </div>
          </div>

          {/* Adherence & Key Goal Score */}
          <div className="flex items-center gap-3 sm:gap-4 bg-slate-100 dark:bg-white/5 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-white/10">
            <div className="text-center px-2">
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Adesão Total</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{athlete.adherencePercentage}%</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Plano rigoroso</p>
            </div>
            <div className="w-px h-10 bg-slate-300 dark:bg-white/10" />
            <div className="text-center px-2">
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Peso Atual / Meta</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {athlete.currentWeightKg} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {athlete.targetWeightKg}kg</span>
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Fase de Volume Limpo</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid of Main Analytics & Daily Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daily Nutrition & Macros Overview */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-3xl liquid-glass border border-white/10 p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Consumo Calórico & Macros Diários</h3>
                <p className="text-xs text-slate-400">
                  Meta diária de <strong className="text-slate-200">{nutritionPlan.dailyTargetCalories} kcal</strong> calculada
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playClick();
                onNavigate('nutrition');
              }}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group"
            >
              Ver Dieta <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </button>
          </div>

          {/* Calories Big Progress Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="transparent" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#2E7D32"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="transparent"
                    strokeDasharray={163}
                    strokeDashoffset={163 - (163 * caloriesProgress) / 100}
                  />
                </svg>
                <span className="absolute text-xs font-black text-white">{caloriesProgress}%</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Consumido Hoje</span>
                <p className="text-2xl font-black text-white">
                  {consumedCalories} <span className="text-xs font-normal text-slate-400">/ {nutritionPlan.dailyTargetCalories} kcal</span>
                </p>
                <p className="text-xs text-emerald-400 font-medium">
                  {Math.max(0, nutritionPlan.dailyTargetCalories - consumedCalories)} kcal restantes
                </p>
              </div>
            </div>

            {/* Quick meal checklist pill */}
            <div className="flex items-center gap-1.5 bg-black/30 p-2 rounded-xl border border-white/5">
              {nutritionPlan.meals.map((m) => (
                <div
                  key={m.id}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition ${
                    m.isCompleted
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white/10 text-slate-400'
                  }`}
                  title={`${m.name} (${m.timeSchedule}) - ${m.isCompleted ? 'Realizada' : 'Pendente'}`}
                >
                  R{m.number}
                </div>
              ))}
            </div>
          </div>

          {/* 3 Macro Bars (Prot / Carb / Gord) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Protein */}
            <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/20">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-blue-400">Proteínas (2g/kg)</span>
                <span className="font-extrabold text-white">{consumedProtein} / {nutritionPlan.dailyTargetProteinG}g</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${proteinProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 text-right">{proteinProgress}% meta diária</p>
            </div>

            {/* Carbs */}
            <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/20">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-amber-400">Carboidratos</span>
                <span className="font-extrabold text-white">{consumedCarbs} / {nutritionPlan.dailyTargetCarbsG}g</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${carbsProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 text-right">{carbsProgress}% meta diária</p>
            </div>

            {/* Fat */}
            <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/20">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-rose-400">Gorduras Boas</span>
                <span className="font-extrabold text-white">{consumedFat} / {nutritionPlan.dailyTargetFatG}g</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-pink-400 rounded-full transition-all duration-500"
                  style={{ width: `${fatProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 text-right">{fatProgress}% meta diária</p>
            </div>
          </div>
        </motion.div>

        {/* Weekly Training Frequency & Cardio Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-3xl liquid-glass border border-white/10 p-6 shadow-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Frequência Semanal</h3>
                  <p className="text-xs text-slate-400">Musculação & Cardio</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                Split A-E
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-600/30 flex items-center justify-center text-orange-400 font-black text-sm">
                    5x
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Dias de Musculação</h4>
                    <p className="text-[10px] text-slate-400">Seg a Sex (Foco Hipertrofia)</p>
                  </div>
                </div>
                <span className="text-xs font-black text-orange-400">100% no alvo</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-600/30 flex items-center justify-center text-teal-400 font-black text-sm">
                    7x
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Cardio Diário</h4>
                    <p className="text-[10px] text-slate-400">Meta fixa: 300 kcal (Zona 2)</p>
                  </div>
                </div>
                <span className="text-xs font-black text-teal-400">7/7 Dias</span>
              </div>
            </div>
          </div>

          {/* Water Tracker interactive Widget */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between bg-blue-950/20 p-3 rounded-2xl border border-blue-500/20">
            <div className="flex items-center gap-2.5">
              <Droplets className="w-5 h-5 text-cyan-400 animate-pulse" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Hidratação do Dia</p>
                <p className="text-sm font-extrabold text-white">3.2L <span className="text-[10px] text-slate-400">/ 4.0L Meta</span></p>
              </div>
            </div>
            <button
              onClick={() => soundFx.playClick()}
              className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 text-xs font-bold border border-cyan-400/40 transition"
            >
              +300ml
            </button>
          </div>
        </motion.div>
      </div>

      {/* Today's Workout Quick Banner (Interactive Player Launcher / Rest / Cardio) */}
      {(() => {
        const hasCardio = Boolean(todayWorkout?.cardioOrientation?.enabled || todayWorkout?.cardioProtocol);
        const isRest = (todayWorkout?.exercises?.length || 0) === 0 && !hasCardio;
        const isCardioOnly = (todayWorkout?.exercises?.length || 0) === 0 && hasCardio;

        return (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`relative rounded-3xl overflow-hidden liquid-glass border p-6 shadow-2xl ${
              isRest
                ? 'border-blue-500/30 bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-slate-950/80'
                : isCardioOnly
                ? 'border-teal-500/30 bg-gradient-to-r from-teal-950/60 via-slate-900/80 to-slate-950/80'
                : 'border-orange-500/30 bg-gradient-to-r from-orange-950/60 via-slate-900/80 to-slate-950/80'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                    isRest
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-900/50'
                      : isCardioOnly
                      ? 'bg-gradient-to-br from-teal-600 to-emerald-600 shadow-teal-900/50'
                      : 'bg-gradient-to-br from-orange-600 to-amber-600 shadow-orange-900/50'
                  }`}
                >
                  {isRest ? (
                    <Moon className="w-7 h-7" />
                  ) : isCardioOnly ? (
                    <HeartPulse className="w-7 h-7" />
                  ) : (
                    <Dumbbell className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white ${
                        isRest ? 'bg-blue-600' : isCardioOnly ? 'bg-teal-600' : 'bg-orange-600'
                      }`}
                    >
                      {todayWorkout.code}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isRest ? 'text-blue-300' : isCardioOnly ? 'text-teal-300' : 'text-orange-400'
                      }`}
                    >
                      {todayWorkout.dayOfWeek}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                    {todayWorkout.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isRest
                      ? 'Descanso e Regeneração Muscular • 0 séries • Foco Sono & Dieta'
                      : isCardioOnly
                      ? `Cardio Exclusivo • ${todayWorkout.estimatedDurationMinutes} min • Foco Oxidação Lipídica`
                      : `${todayWorkout.exercises.length} Exercícios • Tempo estimado: ${todayWorkout.estimatedDurationMinutes} min • Foco ${todayWorkout.targetMuscleGroups.join(', ')}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onStartTodayWorkout();
                }}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl transition transform active:scale-95 text-white ${
                  isRest
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-950/50'
                    : isCardioOnly
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-teal-950/50'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-950/50'
                }`}
              >
                <span>{isRest ? 'Ver Detalhes do Descanso' : isCardioOnly ? 'Ver Protocolo de Cardio' : 'Iniciar Player de Treino'}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        );
      })()}

      {/* Grid of Key Anthropometric Measurements & Protocols */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Key Measurements Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-3xl liquid-glass border border-white/10 p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Resumo de Medidas-Chave</h3>
                <p className="text-xs text-slate-400">Última avaliação: {new Date(currentAssessment.date).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <button
              onClick={() => {
                soundFx.playClick();
                onNavigate('profile');
              }}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Ficha Completa <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Tórax</span>
              <p className="text-lg font-black text-white mt-0.5">{currentAssessment.chestCm} cm</p>
              <span className="text-[9px] text-emerald-400 font-semibold">+3.5 cm ganho</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Ombros</span>
              <p className="text-lg font-black text-white mt-0.5">{currentAssessment.shouldersCm} cm</p>
              <span className="text-[9px] text-emerald-400 font-semibold">+4.5 cm delta</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Braço Dir.</span>
              <p className="text-lg font-black text-white mt-0.5">{currentAssessment.rightArmCm} cm</p>
              <span className="text-[9px] text-emerald-400 font-semibold">+1.7 cm ganho</span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-center">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Cintura</span>
              <p className="text-lg font-black text-white mt-0.5">{currentAssessment.waistCm} cm</p>
              <span className="text-[9px] text-emerald-400 font-semibold">-2.5 cm redução</span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-center">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Abdômen</span>
              <p className="text-lg font-black text-white mt-0.5">{currentAssessment.abdomenCm} cm</p>
              <span className="text-[9px] text-emerald-400 font-semibold">-2.5 cm redução</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Coxa Dir.</span>
              <p className="text-lg font-black text-white mt-0.5">{currentAssessment.rightThighCm} cm</p>
              <span className="text-[9px] text-emerald-400 font-semibold">+2.6 cm ganho</span>
            </div>
          </div>
        </motion.div>

        {/* Supplement & Clinical Reminders */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl liquid-glass border border-white/10 p-6 shadow-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Protocolos & Suplementação</h3>
                  <p className="text-xs text-slate-400">
                    {completedSuppsCount} de {supplements.length} itens tomados hoje
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  soundFx.playClick();
                  onNavigate('supplements');
                }}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                Ver Todos <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {supplements.slice(0, 3).map((sup) => (
                <div
                  key={sup.id}
                  className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        sup.isTakenToday ? 'bg-purple-500 text-black' : 'border border-slate-500 text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[200px]">{sup.name}</h4>
                      <p className="text-[10px] text-purple-300 font-medium">{sup.schedule.split('(')[0]}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">{sup.dosage.split('(')[0]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 text-[11px] text-purple-300">
              <Sparkles className="w-3.5 h-3.5" /> Próximo: Cocktail Intra-Treino (17:45)
            </span>
            <button
              onClick={() => {
                soundFx.playClick();
                onNavigate('recipes');
              }}
              className="text-teal-400 hover:text-teal-300 font-bold"
            >
              Receitas Fit ↗
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
