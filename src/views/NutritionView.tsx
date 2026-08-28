import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Utensils,
  Flame,
  CheckCircle2,
  Circle,
  RefreshCw,
  Clock,
  Plus,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Droplets,
  Scale,
  Edit3,
  Trash2,
  Edit2,
  Sliders,
  Calculator,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { NutritionPlan, Meal, FoodItem } from '../types';
import { soundFx } from '../utils/audio';
import { EditNutritionPlanModal } from '../components/EditNutritionPlanModal';

interface NutritionViewProps {
  nutritionPlan: NutritionPlan;
  onToggleMealCompleted: (mealId: string) => void;
  onOpenSubstitution: (food: FoodItem) => void;
  onUpdateNutritionPlan?: (updated: NutritionPlan) => void;
  athleteWeightKg?: number;
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  nutritionPlan,
  onToggleMealCompleted,
  onOpenSubstitution,
  onUpdateNutritionPlan,
  athleteWeightKg = 80
}) => {
  const [expandedMealId, setExpandedMealId] = useState<string | null>(
    nutritionPlan.meals[0]?.id || 'meal-1'
  );
  const [waterDrunkMl, setWaterDrunkMl] = useState<number>(3200);

  // Edit Nutrition Plan Modal State
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState<boolean>(false);

  // Quick Inline Meal Delete state
  const [mealToDeleteId, setMealToDeleteId] = useState<string | null>(null);

  // Compute live consumption
  const completedMeals = nutritionPlan.meals.filter((m) => m.isCompleted);
  const totalCaloriesDone = completedMeals.reduce((acc, m) => acc + (m.targetCaloriesKcal || 0), 0);
  const totalProteinDone = Math.round(completedMeals.reduce((acc, m) => acc + (m.targetProteinG || 0), 0) * 10) / 10;
  const totalCarbsDone = Math.round(completedMeals.reduce((acc, m) => acc + (m.targetCarbsG || 0), 0) * 10) / 10;
  const totalFatDone = Math.round(completedMeals.reduce((acc, m) => acc + (m.targetFatG || 0), 0) * 10) / 10;

  const calPercent = Math.min(
    100,
    Math.round((totalCaloriesDone / (nutritionPlan.dailyTargetCalories || 2000)) * 100)
  );

  const handleMealToggle = (meal: Meal) => {
    soundFx.playClick();
    if (!meal.isCompleted) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#2E7D32', '#4ade80', '#10b981', '#ffffff']
      });
    }
    onToggleMealCompleted(meal.id);
  };

  const addWater = (amount: number) => {
    soundFx.playClick();
    setWaterDrunkMl((prev) => Math.min(8000, prev + amount));
  };

  const resetWater = () => {
    soundFx.playClick();
    setWaterDrunkMl(0);
  };

  // Quick In-place Quick Add Meal
  const handleQuickAddMeal = () => {
    if (!onUpdateNutritionPlan) return;
    soundFx.playClick();
    const nextNum = nutritionPlan.meals.length + 1;
    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      number: nextNum,
      name: `Refeição ${nextNum} (${nextNum === 1 ? 'Café da Manhã' : nextNum === 2 ? 'Almoço' : nextNum === 3 ? 'Lanche da Tarde' : nextNum === 4 ? 'Jantar' : 'Ceia'})`,
      timeSchedule: nextNum === 1 ? '07:30' : nextNum === 2 ? '12:30' : nextNum === 3 ? '16:30' : nextNum === 4 ? '20:30' : '23:00',
      targetProteinG: 30,
      targetCarbsG: 40,
      targetFatG: 10,
      targetCaloriesKcal: 370,
      isCompleted: false,
      notes: '',
      foods: []
    };

    const updatedMeals = [...nutritionPlan.meals, newMeal];
    const updatedPlan: NutritionPlan = {
      ...nutritionPlan,
      meals: updatedMeals
    };
    onUpdateNutritionPlan(updatedPlan);
    setExpandedMealId(newMeal.id);
  };

  // Quick In-place Delete Meal
  const handleConfirmDeleteMeal = (mealId: string) => {
    if (!onUpdateNutritionPlan) return;
    soundFx.playClick();
    if (nutritionPlan.meals.length <= 1) {
      alert('O plano alimentar precisa ter pelo menos 1 refeição cadastrada.');
      setMealToDeleteId(null);
      return;
    }
    const updatedMeals = nutritionPlan.meals
      .filter((m) => m.id !== mealId)
      .map((m, idx) => ({ ...m, number: idx + 1 }));

    const updatedPlan: NutritionPlan = {
      ...nutritionPlan,
      meals: updatedMeals
    };
    onUpdateNutritionPlan(updatedPlan);
    setMealToDeleteId(null);
  };

  // Quick In-place Food Delete from a Meal
  const handleQuickDeleteFood = (mealId: string, foodId: string) => {
    if (!onUpdateNutritionPlan) return;
    soundFx.playClick();
    const updatedMeals = nutritionPlan.meals.map((meal) => {
      if (meal.id !== mealId) return meal;
      const updatedFoods = meal.foods.filter((f) => f.id !== foodId);
      const mealKcal = Math.round(updatedFoods.reduce((acc, f) => acc + (f.caloriesKcal || 0), 0));
      const mealP = Math.round(updatedFoods.reduce((acc, f) => acc + (f.proteinG || 0), 0) * 10) / 10;
      const mealC = Math.round(updatedFoods.reduce((acc, f) => acc + (f.carbsG || 0), 0) * 10) / 10;
      const mealG = Math.round(updatedFoods.reduce((acc, f) => acc + (f.fatG || 0), 0) * 10) / 10;
      return {
        ...meal,
        foods: updatedFoods,
        targetCaloriesKcal: mealKcal,
        targetProteinG: mealP,
        targetCarbsG: mealC,
        targetFatG: mealG
      };
    });

    onUpdateNutritionPlan({
      ...nutritionPlan,
      meals: updatedMeals
    });
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Nutrition Header Card (#2E7D32 Forest Green Theme) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl liquid-glass hero-nutrition p-6 sm:p-7 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                Fase Ativa
              </span>
              <span className="text-xs text-emerald-300 font-semibold">Planejamento Individualizado</span>
              <span className="text-[11px] text-slate-400 font-mono">
                • {nutritionPlan.meals.length} refeições estruturadas
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Planejamento Nutricional de Alta Performance
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Divisão equilibrada de macronutrientes com cálculo de calorias e controle de adesão diária em tempo real.
            </p>
          </div>

          {/* Quick Action Buttons & Daily Stats Counter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Live Stats Box */}
            <div className="flex items-center justify-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 shrink-0">
              <div className="text-center px-2">
                <p className="text-[10px] uppercase font-bold text-slate-400">Meta Diária</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  {nutritionPlan.dailyTargetCalories}
                </p>
                <p className="text-[9px] text-slate-400">kcal calculadas</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center px-2">
                <p className="text-[10px] uppercase font-bold text-slate-400">Status de Hoje</p>
                <p className="text-xl sm:text-2xl font-black text-white font-mono">
                  {completedMeals.length} / {nutritionPlan.meals.length}
                </p>
                <p className="text-[9px] text-emerald-400 font-medium">Refeições Concluídas</p>
              </div>
            </div>

            {/* Primary Action: Open Edit Diet Plan Modal */}
            <button
              onClick={() => {
                soundFx.playClick();
                setIsEditPlanModalOpen(true);
              }}
              className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 hover:scale-[1.02] active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>Editar Plano Alimentar</span>
            </button>
          </div>
        </div>

        {/* Daily Macros Target vs Consumed progress */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Calorias</span>
              <span className="font-bold text-emerald-400 font-mono">
                {totalCaloriesDone} / {nutritionPlan.dailyTargetCalories} kcal
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${calPercent}%` }} />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Proteínas</span>
              <span className="font-bold text-blue-400 font-mono">
                {totalProteinDone} / {nutritionPlan.dailyTargetProteinG}g
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${Math.min(100, (totalProteinDone / (nutritionPlan.dailyTargetProteinG || 1)) * 100)}%`
                }}
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Carboidratos</span>
              <span className="font-bold text-amber-400 font-mono">
                {totalCarbsDone} / {nutritionPlan.dailyTargetCarbsG}g
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{
                  width: `${Math.min(100, (totalCarbsDone / (nutritionPlan.dailyTargetCarbsG || 1)) * 100)}%`
                }}
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Gorduras</span>
              <span className="font-bold text-rose-400 font-mono">
                {totalFatDone} / {nutritionPlan.dailyTargetFatG}g
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full"
                style={{
                  width: `${Math.min(100, (totalFatDone / (nutritionPlan.dailyTargetFatG || 1)) * 100)}%`
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Water Intake Quick Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-3xl liquid-glass border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-950/80"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-600/30 text-cyan-400 border border-cyan-500/40 shadow-md shadow-cyan-950/40">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Meta de Hidratação Diária</h4>
            <p className="text-xs text-cyan-300 font-mono">
              Registrado: <strong>{(waterDrunkMl / 1000).toFixed(1)}L</strong> de{' '}
              <strong>{nutritionPlan.waterIntakeLiters || 4.0}L</strong> (
              {Math.round(
                (waterDrunkMl / ((nutritionPlan.waterIntakeLiters || 4.0) * 1000)) * 100
              )}
              %)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => addWater(250)}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition"
          >
            +250ml
          </button>
          <button
            onClick={() => addWater(500)}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition"
          >
            +500ml
          </button>
          <button
            onClick={() => addWater(1000)}
            className="px-3 py-1.5 rounded-xl bg-cyan-600/40 hover:bg-cyan-600/60 text-white text-xs font-bold border border-cyan-400/40 transition shadow-lg"
          >
            +1.0L Garrafa
          </button>
          {waterDrunkMl > 0 && (
            <button
              onClick={resetWater}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition text-xs"
              title="Zerar registro de água"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Meals Header with Quick Add Meal Button */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
            Refeições Prescritas ({nutritionPlan.meals.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickAddMeal}
            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Refeição</span>
          </button>
        </div>
      </div>

      {/* Meals List (Refeições 1 a N) */}
      <div className="space-y-4">
        {nutritionPlan.meals.map((meal, index) => {
          const isExpanded = expandedMealId === meal.id;

          return (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`rounded-3xl liquid-glass border transition-all duration-200 overflow-hidden ${
                meal.isCompleted
                  ? 'border-emerald-500/40 bg-emerald-950/15'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Meal Header Strip */}
              <div
                onClick={() => setExpandedMealId(isExpanded ? null : meal.id)}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  {/* Mark meal done button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMealToggle(meal);
                    }}
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                      meal.isCompleted
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                        : 'bg-white/5 hover:bg-white/15 text-slate-400 border border-white/10'
                    }`}
                    title={meal.isCompleted ? 'Marcar como não realizada' : 'Marcar refeição realizada'}
                  >
                    {meal.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600/30 text-emerald-300 border border-emerald-500/30">
                        Refeição {meal.number}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400 font-medium font-mono">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" /> {meal.timeSchedule}
                      </span>
                      {meal.isCompleted && (
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          • Consumida
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                      {meal.name}
                    </h3>
                  </div>
                </div>

                {/* Macro Pills, Quick Actions & Expand Icon */}
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-right">
                    <span className="text-base font-black text-white font-mono">
                      {meal.targetCaloriesKcal} kcal
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono mt-0.5">
                      <span className="text-blue-400 font-semibold">{meal.targetProteinG}g P</span>
                      <span className="text-amber-400 font-semibold">{meal.targetCarbsG}g C</span>
                      <span className="text-rose-400 font-semibold">{meal.targetFatG}g G</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFx.playClick();
                        setIsEditPlanModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition"
                      title="Editar esta refeição no editor completo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMealToDeleteId(meal.id);
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                      title="Excluir refeição"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="p-1 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Meal Food Items & Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10 px-5 sm:px-6 py-4 bg-black/20 space-y-4"
                  >
                    {/* Clinical notes for the meal */}
                    {meal.notes && (
                      <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-slate-300">{meal.notes}</span>
                      </div>
                    )}

                    {/* Foods List */}
                    <div className="space-y-2.5">
                      {meal.foods.length === 0 ? (
                        <div className="p-5 rounded-2xl border border-dashed border-white/10 text-center text-xs text-slate-400 space-y-2">
                          <p>Nenhum alimento cadastrado nesta refeição.</p>
                          <button
                            onClick={() => {
                              soundFx.playClick();
                              setIsEditPlanModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold inline-flex items-center gap-1 shadow"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar Alimentos
                          </button>
                        </div>
                      ) : (
                        meal.foods.map((food) => (
                          <div
                            key={food.id}
                            className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                          >
                            <div className="flex items-start sm:items-center gap-3">
                              <div
                                className={`w-2.5 h-2.5 rounded-full mt-1.5 sm:mt-0 shrink-0 ${
                                  food.category === 'proteina'
                                    ? 'bg-blue-400'
                                    : food.category === 'carboidrato'
                                    ? 'bg-amber-400'
                                    : food.category === 'gordura'
                                    ? 'bg-rose-400'
                                    : food.category === 'suplemento'
                                    ? 'bg-purple-400'
                                    : 'bg-emerald-400'
                                }`}
                              />
                              <div>
                                <h4 className="text-sm font-bold text-white">{food.name}</h4>
                                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <Scale className="w-3 h-3 text-emerald-400" />
                                  <span>{food.portion} ({food.amountGrams}g)</span>
                                  <span className="text-slate-500">•</span>
                                  <span className="capitalize text-slate-300">{food.category}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2.5">
                              <div className="text-left sm:text-right text-xs">
                                <span className="font-extrabold text-white font-mono">
                                  {food.caloriesKcal} kcal
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                                  <span className="text-blue-300">{food.proteinG}g P</span>
                                  <span className="text-amber-300">{food.carbsG}g C</span>
                                  <span className="text-rose-300">{food.fatG}g G</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {/* Smart food substitution launcher */}
                                <button
                                  onClick={() => {
                                    soundFx.playClick();
                                    onOpenSubstitution(food);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition shadow-sm"
                                  title="Calcular substituição inteligente para este alimento"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Substituir</span>
                                </button>

                                {/* Quick Delete food item */}
                                <button
                                  onClick={() => handleQuickDeleteFood(meal.id, food.id)}
                                  className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 transition"
                                  title="Remover este alimento da refeição"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Meal Bottom Actions */}
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={() => {
                          soundFx.playClick();
                          setIsEditPlanModalOpen(true);
                        }}
                        className="text-xs text-emerald-300 hover:text-emerald-200 font-bold flex items-center gap-1 py-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Alimento a esta Refeição</span>
                      </button>

                      <button
                        onClick={() => {
                          soundFx.playClick();
                          setIsEditPlanModalOpen(true);
                        }}
                        className="text-xs text-slate-400 hover:text-white font-medium flex items-center gap-1 py-1"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Editar no Painel Geral</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Delete Meal Confirmation Modal */}
      <AnimatePresence>
        {mealToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-3xl liquid-glass border border-rose-500/30 bg-slate-950/90 shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Excluir Refeição</h3>
              <p className="text-xs text-slate-300">
                Tem certeza que deseja excluir esta refeição e todos os seus alimentos do plano alimentar?
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setMealToDeleteId(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleConfirmDeleteMeal(mealToDeleteId)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-950/50"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Edit Nutrition Plan Modal */}
      <AnimatePresence>
        {isEditPlanModalOpen && (
          <EditNutritionPlanModal
            isOpen={isEditPlanModalOpen}
            onClose={() => setIsEditPlanModalOpen(false)}
            nutritionPlan={nutritionPlan}
            athleteWeightKg={athleteWeightKg}
            onSave={(updatedPlan) => {
              if (onUpdateNutritionPlan) {
                onUpdateNutritionPlan(updatedPlan);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
