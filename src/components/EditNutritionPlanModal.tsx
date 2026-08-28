import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Utensils,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Clock,
  Flame,
  Sparkles,
  Droplets,
  Scale,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  RotateCcw,
  Layers,
  Info,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Calculator,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { NutritionPlan, Meal, FoodItem } from '../types';
import { soundFx } from '../utils/audio';
import { FITNESS_FOOD_DATABASE, StandardFoodItem, computeFoodMacrosFrom100g } from '../data/foodDatabase';

interface EditNutritionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  nutritionPlan: NutritionPlan;
  onSave: (updatedPlan: NutritionPlan) => void;
  athleteWeightKg?: number;
}

const PRESET_PLANS = [
  {
    name: 'Hipertrofia Limpa (Superávit Controlado)',
    desc: 'Foco em ganho máximo de massa magra com mínimo acúmulo de gordura.',
    kcal: 2600,
    protein: 165,
    carbs: 330,
    fat: 70,
    water: 4.0
  },
  {
    name: 'Cutting & Secagem (Déficit Estruturado)',
    desc: 'Preservação de massa magra com alta ingestão proteica e déficit calórico.',
    kcal: 1950,
    protein: 175,
    carbs: 180,
    fat: 55,
    water: 4.5
  },
  {
    name: 'Recomposição Corporal',
    desc: 'Equilíbrio normocalórico para perda de gordura concomitante a ganho muscular.',
    kcal: 2280,
    protein: 160,
    carbs: 260,
    fat: 62,
    water: 4.0
  },
  {
    name: 'Manutenção Atlética',
    desc: 'Estabilidade ponderal com alto rendimento e energia para treinos intensos.',
    kcal: 2450,
    protein: 150,
    carbs: 300,
    fat: 68,
    water: 3.5
  },
  {
    name: 'Low-Carb / Alta Proteína',
    desc: 'Restrição de carboidratos com foco em cetose moderada e queima lipídica.',
    kcal: 2100,
    protein: 170,
    carbs: 60,
    fat: 130,
    water: 4.5
  }
];

export const EditNutritionPlanModal: React.FC<EditNutritionPlanModalProps> = ({
  isOpen,
  onClose,
  nutritionPlan,
  onSave,
  athleteWeightKg = 80
}) => {
  const [activeTab, setActiveTab] = useState<'meals' | 'targets' | 'presets'>('meals');

  // Form State
  const [dailyCalories, setDailyCalories] = useState<number>(nutritionPlan.dailyTargetCalories || 2183);
  const [dailyProtein, setDailyProtein] = useState<number>(nutritionPlan.dailyTargetProteinG || 152);
  const [dailyCarbs, setDailyCarbs] = useState<number>(nutritionPlan.dailyTargetCarbsG || 259);
  const [dailyFat, setDailyFat] = useState<number>(nutritionPlan.dailyTargetFatG || 60);
  const [dailyWater, setDailyWater] = useState<number>(nutritionPlan.waterIntakeLiters || 4.0);
  const [meals, setMeals] = useState<Meal[]>(() => JSON.parse(JSON.stringify(nutritionPlan.meals || [])));

  // Food Sub-Modal / Drawer State
  const [activeMealIdForFood, setActiveMealIdForFood] = useState<string | null>(null);
  const [foodModalMode, setFoodModalMode] = useState<'create' | 'edit'>('create');
  const [foodToEdit, setFoodToEdit] = useState<FoodItem | null>(null);

  // Food Picker Form
  const [foodSearch, setFoodSearch] = useState<string>('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState<string>('todos');
  const [selectedStandardFood, setSelectedStandardFood] = useState<StandardFoodItem | null>(null);

  const [foodFormName, setFoodFormName] = useState<string>('');
  const [foodFormPortion, setFoodFormPortion] = useState<string>('');
  const [foodFormGrams, setFoodFormGrams] = useState<number>(100);
  const [foodFormProtein, setFoodFormProtein] = useState<number>(0);
  const [foodFormCarbs, setFoodFormCarbs] = useState<number>(0);
  const [foodFormFat, setFoodFormFat] = useState<number>(0);
  const [foodFormCalories, setFoodFormCalories] = useState<number>(0);
  const [foodFormCategory, setFoodFormCategory] = useState<FoodItem['category']>('proteina');

  // Expanded meal accordion in modal
  const [expandedMealId, setExpandedMealId] = useState<string | null>(meals[0]?.id || null);

  // Sync state when nutritionPlan prop changes
  useEffect(() => {
    if (isOpen) {
      setDailyCalories(nutritionPlan.dailyTargetCalories);
      setDailyProtein(nutritionPlan.dailyTargetProteinG);
      setDailyCarbs(nutritionPlan.dailyTargetCarbsG);
      setDailyFat(nutritionPlan.dailyTargetFatG);
      setDailyWater(nutritionPlan.waterIntakeLiters);
      setMeals(JSON.parse(JSON.stringify(nutritionPlan.meals || [])));
      if (nutritionPlan.meals.length > 0) {
        setExpandedMealId(nutritionPlan.meals[0].id);
      }
    }
  }, [isOpen, nutritionPlan]);

  if (!isOpen) return null;

  // Calculate live sum of all foods in all meals
  const totalCalculatedKcal = meals.reduce(
    (acc, m) => acc + m.foods.reduce((fAcc, f) => fAcc + (f.caloriesKcal || 0), 0),
    0
  );
  const totalCalculatedP = meals.reduce(
    (acc, m) => acc + m.foods.reduce((fAcc, f) => fAcc + (f.proteinG || 0), 0),
    0
  );
  const totalCalculatedC = meals.reduce(
    (acc, m) => acc + m.foods.reduce((fAcc, f) => fAcc + (f.carbsG || 0), 0),
    0
  );
  const totalCalculatedG = meals.reduce(
    (acc, m) => acc + m.foods.reduce((fAcc, f) => fAcc + (f.fatG || 0), 0),
    0
  );

  // Protein g/kg
  const proteinGPerKg = athleteWeightKg > 0 ? (dailyProtein / athleteWeightKg).toFixed(1) : '2.0';

  // Macro Energy Percentages
  const macroKcalP = dailyProtein * 4;
  const macroKcalC = dailyCarbs * 4;
  const macroKcalG = dailyFat * 9;
  const sumMacroKcal = macroKcalP + macroKcalC + macroKcalG || 1;
  const percentP = Math.round((macroKcalP / sumMacroKcal) * 100);
  const percentC = Math.round((macroKcalC / sumMacroKcal) * 100);
  const percentG = Math.round((macroKcalG / sumMacroKcal) * 100);

  // Helper: Auto-sync Daily Targets from Meal Foods
  const handleAutoSumFromMeals = () => {
    soundFx.playClick();
    setDailyCalories(Math.round(totalCalculatedKcal));
    setDailyProtein(Math.round(totalCalculatedP));
    setDailyCarbs(Math.round(totalCalculatedC));
    setDailyFat(Math.round(totalCalculatedG * 10) / 10);
  };

  // Helper: Apply Preset
  const handleApplyPreset = (preset: (typeof PRESET_PLANS)[0]) => {
    soundFx.playClick();
    setDailyCalories(preset.kcal);
    setDailyProtein(preset.protein);
    setDailyCarbs(preset.carbs);
    setDailyFat(preset.fat);
    setDailyWater(preset.water);
    setActiveTab('targets');
  };

  // Meal Management Handlers
  const handleAddMeal = () => {
    soundFx.playClick();
    const nextNumber = meals.length + 1;
    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      number: nextNumber,
      name: `Refeição ${nextNumber} (${nextNumber === 1 ? 'Café da Manhã' : nextNumber === 2 ? 'Almoço' : nextNumber === 3 ? 'Lanche' : nextNumber === 4 ? 'Jantar' : 'Ceia'})`,
      timeSchedule: nextNumber === 1 ? '08:00' : nextNumber === 2 ? '12:30' : nextNumber === 3 ? '16:30' : nextNumber === 4 ? '20:30' : '23:00',
      targetProteinG: 30,
      targetCarbsG: 40,
      targetFatG: 10,
      targetCaloriesKcal: 370,
      isCompleted: false,
      notes: '',
      foods: []
    };
    const updated = [...meals, newMeal];
    setMeals(updated);
    setExpandedMealId(newMeal.id);
  };

  const handleUpdateMeal = (mealId: string, updates: Partial<Meal>) => {
    setMeals((prev) =>
      prev.map((m) => {
        if (m.id !== mealId) return m;
        const updatedMeal = { ...m, ...updates };
        // If foods changed or requested, recompute targets from foods
        return updatedMeal;
      })
    );
  };

  const handleDeleteMeal = (mealId: string) => {
    soundFx.playClick();
    if (meals.length <= 1) {
      alert('O plano alimentar precisa ter pelo menos 1 refeição cadastrada.');
      return;
    }
    const filtered = meals
      .filter((m) => m.id !== mealId)
      .map((m, idx) => ({ ...m, number: idx + 1 }));
    setMeals(filtered);
  };

  const handleMoveMeal = (index: number, direction: 'up' | 'down') => {
    soundFx.playClick();
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= meals.length) return;
    const reordered = [...meals];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    // Renumber
    const renumbered = reordered.map((m, idx) => ({ ...m, number: idx + 1 }));
    setMeals(renumbered);
  };

  const handleDuplicateMeal = (meal: Meal) => {
    soundFx.playClick();
    const duplicate: Meal = {
      ...meal,
      id: `meal-${Date.now()}`,
      number: meals.length + 1,
      name: `${meal.name} (Cópia)`,
      foods: meal.foods.map((f) => ({ ...f, id: `food-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` }))
    };
    setMeals([...meals, duplicate]);
    setExpandedMealId(duplicate.id);
  };

  // Food Picker / Add / Edit Handlers
  const handleOpenAddFood = (mealId: string) => {
    soundFx.playClick();
    setActiveMealIdForFood(mealId);
    setFoodModalMode('create');
    setFoodToEdit(null);
    setSelectedStandardFood(null);
    setFoodSearch('');
    setFoodCategoryFilter('todos');

    // Default form values
    setFoodFormName('');
    setFoodFormPortion('100g');
    setFoodFormGrams(100);
    setFoodFormProtein(0);
    setFoodFormCarbs(0);
    setFoodFormFat(0);
    setFoodFormCalories(0);
    setFoodFormCategory('proteina');
  };

  const handleOpenEditFood = (mealId: string, food: FoodItem) => {
    soundFx.playClick();
    setActiveMealIdForFood(mealId);
    setFoodModalMode('edit');
    setFoodToEdit(food);
    setSelectedStandardFood(null);
    setFoodSearch('');

    setFoodFormName(food.name);
    setFoodFormPortion(food.portion);
    setFoodFormGrams(food.amountGrams);
    setFoodFormProtein(food.proteinG);
    setFoodFormCarbs(food.carbsG);
    setFoodFormFat(food.fatG);
    setFoodFormCalories(food.caloriesKcal);
    setFoodFormCategory(food.category);
  };

  const handleSelectStandardFood = (food: StandardFoodItem) => {
    soundFx.playClick();
    setSelectedStandardFood(food);
    setFoodFormName(food.name);
    setFoodFormCategory(food.category);
    setFoodFormPortion(food.defaultPortion);
    setFoodFormGrams(food.defaultGrams);

    const macros = computeFoodMacrosFrom100g(food, food.defaultGrams);
    setFoodFormProtein(macros.proteinG);
    setFoodFormCarbs(macros.carbsG);
    setFoodFormFat(macros.fatG);
    setFoodFormCalories(macros.caloriesKcal);
  };

  const handleGramsChange = (newGrams: number) => {
    const safeGrams = Math.max(0, newGrams);
    setFoodFormGrams(safeGrams);
    setFoodFormPortion(`${safeGrams}g`);

    if (selectedStandardFood) {
      const macros = computeFoodMacrosFrom100g(selectedStandardFood, safeGrams);
      setFoodFormProtein(macros.proteinG);
      setFoodFormCarbs(macros.carbsG);
      setFoodFormFat(macros.fatG);
      setFoodFormCalories(macros.caloriesKcal);
    } else {
      // Scale proportionally if original grams were > 0
      if (foodFormGrams > 0) {
        const ratio = safeGrams / foodFormGrams;
        setFoodFormProtein(Math.round(foodFormProtein * ratio * 10) / 10);
        setFoodFormCarbs(Math.round(foodFormCarbs * ratio * 10) / 10);
        setFoodFormFat(Math.round(foodFormFat * ratio * 10) / 10);
        setFoodFormCalories(Math.round(foodFormCalories * ratio));
      }
    }
  };

  const handleRecalculateKcalFromMacros = () => {
    const kcal = Math.round(foodFormProtein * 4 + foodFormCarbs * 4 + foodFormFat * 9);
    setFoodFormCalories(kcal);
  };

  const handleSaveFoodItem = () => {
    if (!activeMealIdForFood) return;
    if (!foodFormName.trim()) {
      alert('Por favor, informe o nome do alimento.');
      return;
    }

    soundFx.playClick();
    const newFood: FoodItem = {
      id: foodToEdit ? foodToEdit.id : `food-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: foodFormName.trim(),
      portion: foodFormPortion.trim() || `${foodFormGrams}g`,
      amountGrams: Number(foodFormGrams) || 0,
      proteinG: Number(foodFormProtein) || 0,
      carbsG: Number(foodFormCarbs) || 0,
      fatG: Number(foodFormFat) || 0,
      caloriesKcal: Number(foodFormCalories) || 0,
      category: foodFormCategory,
      isCompleted: foodToEdit ? foodToEdit.isCompleted : false
    };

    setMeals((prev) =>
      prev.map((meal) => {
        if (meal.id !== activeMealIdForFood) return meal;
        let updatedFoods: FoodItem[];
        if (foodModalMode === 'edit') {
          updatedFoods = meal.foods.map((f) => (f.id === newFood.id ? newFood : f));
        } else {
          updatedFoods = [...meal.foods, newFood];
        }

        // Auto-recalculate target macros for this meal from its food list
        const mealKcal = Math.round(updatedFoods.reduce((acc, f) => acc + f.caloriesKcal, 0));
        const mealP = Math.round(updatedFoods.reduce((acc, f) => acc + f.proteinG, 0) * 10) / 10;
        const mealC = Math.round(updatedFoods.reduce((acc, f) => acc + f.carbsG, 0) * 10) / 10;
        const mealG = Math.round(updatedFoods.reduce((acc, f) => acc + f.fatG, 0) * 10) / 10;

        return {
          ...meal,
          foods: updatedFoods,
          targetCaloriesKcal: mealKcal,
          targetProteinG: mealP,
          targetCarbsG: mealC,
          targetFatG: mealG
        };
      })
    );

    setActiveMealIdForFood(null);
    setFoodToEdit(null);
  };

  const handleDeleteFoodItem = (mealId: string, foodId: string) => {
    soundFx.playClick();
    setMeals((prev) =>
      prev.map((meal) => {
        if (meal.id !== mealId) return meal;
        const updatedFoods = meal.foods.filter((f) => f.id !== foodId);
        const mealKcal = Math.round(updatedFoods.reduce((acc, f) => acc + f.caloriesKcal, 0));
        const mealP = Math.round(updatedFoods.reduce((acc, f) => acc + f.proteinG, 0) * 10) / 10;
        const mealC = Math.round(updatedFoods.reduce((acc, f) => acc + f.carbsG, 0) * 10) / 10;
        const mealG = Math.round(updatedFoods.reduce((acc, f) => acc + f.fatG, 0) * 10) / 10;

        return {
          ...meal,
          foods: updatedFoods,
          targetCaloriesKcal: mealKcal,
          targetProteinG: mealP,
          targetCarbsG: mealC,
          targetFatG: mealG
        };
      })
    );
  };

  // Final Save Handler
  const handleSaveAll = () => {
    soundFx.playClick();
    if (meals.length === 0) {
      alert('O plano alimentar precisa de pelo menos 1 refeição.');
      return;
    }

    const updatedPlan: NutritionPlan = {
      dailyTargetCalories: Number(dailyCalories) || 2000,
      dailyTargetProteinG: Number(dailyProtein) || 150,
      dailyTargetCarbsG: Number(dailyCarbs) || 200,
      dailyTargetFatG: Number(dailyFat) || 50,
      waterIntakeLiters: Number(dailyWater) || 4.0,
      meals
    };

    onSave(updatedPlan);
    onClose();
  };

  // Filter standard food database
  const filteredStandardFoods = FITNESS_FOOD_DATABASE.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(foodSearch.toLowerCase());
    const matchesCategory = foodCategoryFilter === 'todos' || item.category === foodCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl modal-liquid-glass border border-emerald-500/30 shadow-2xl overflow-hidden"
      >
        {/* Header Strip */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Editor de Plano Alimentar
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Alta Performance
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Personalize metas diárias, horários, alimentos e balanço de macronutrientes.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Macro Summary Header Bar */}
        <div className="px-5 py-3 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">Meta:</span>
              <strong className="text-white font-mono">{dailyCalories} kcal</strong>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-blue-300 font-bold">{dailyProtein}g P</span>
              <span className="text-slate-500 text-[10px]">({proteinGPerKg}g/kg)</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-300 font-bold">{dailyCarbs}g C</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-rose-300 font-bold">{dailyFat}g G</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-300 font-bold">{dailyWater}L Água</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Soma dos Alimentos:</span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                Math.abs(totalCalculatedKcal - dailyCalories) < 100
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {Math.round(totalCalculatedKcal)} kcal ({meals.reduce((a, m) => a + m.foods.length, 0)} itens)
            </span>
            <button
              onClick={handleAutoSumFromMeals}
              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 transition flex items-center gap-1"
              title="Ajustar metas diárias para a soma exata dos alimentos"
            >
              <Calculator className="w-3 h-3" />
              <span className="hidden sm:inline">Auto-Ajustar</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-white/10 flex items-center gap-2 bg-slate-900/40 shrink-0">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('meals');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'meals'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Refeições & Alimentos ({meals.length})</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('targets');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'targets'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Metas Diárias & Macros</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('presets');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'presets'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Modelos Prontos</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ======================================================== */}
          {/* TAB 1: MEALS & FOODS ACCORDION */}
          {/* ======================================================== */}
          {activeTab === 'meals' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
                <div>
                  <h4 className="text-sm font-bold text-white">Grade Diária de Refeições</h4>
                  <p className="text-xs text-slate-400">
                    Clique na refeição para expandir alimentos, adicionar itens da tabela ou ajustar horários.
                  </p>
                </div>
                <button
                  onClick={handleAddMeal}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Refeição</span>
                </button>
              </div>

              {meals.map((meal, index) => {
                const isExpanded = expandedMealId === meal.id;
                const mealKcal = Math.round(meal.foods.reduce((acc, f) => acc + (f.caloriesKcal || 0), 0));
                const mealP = Math.round(meal.foods.reduce((acc, f) => acc + (f.proteinG || 0), 0) * 10) / 10;
                const mealC = Math.round(meal.foods.reduce((acc, f) => acc + (f.carbsG || 0), 0) * 10) / 10;
                const mealG = Math.round(meal.foods.reduce((acc, f) => acc + (f.fatG || 0), 0) * 10) / 10;

                return (
                  <div
                    key={meal.id}
                    className="rounded-3xl liquid-glass border border-white/10 bg-slate-900/60 overflow-hidden transition-all duration-200"
                  >
                    {/* Meal Header */}
                    <div
                      onClick={() => setExpandedMealId(isExpanded ? null : meal.id)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveMeal(index, 'up');
                            }}
                            className={`p-1 rounded-md transition ${index === 0 ? 'text-slate-600' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === meals.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveMeal(index, 'down');
                            }}
                            className={`p-1 rounded-md transition ${index === meals.length - 1 ? 'text-slate-600' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600/30 text-emerald-300 border border-emerald-500/30">
                              Refeição {meal.number}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-400 font-mono font-medium">
                              <Clock className="w-3 h-3 text-emerald-400" /> {meal.timeSchedule}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white mt-0.5">{meal.name}</h4>
                        </div>
                      </div>

                      {/* Right: Macro info + Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-right">
                          <span className="text-sm font-black text-white">{mealKcal} kcal</span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span className="text-blue-400">{mealP}g P</span>
                            <span className="text-amber-400">{mealC}g C</span>
                            <span className="text-rose-400">{mealG}g G</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateMeal(meal);
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition"
                            title="Duplicar refeição"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMeal(meal.id);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition"
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

                    {/* Meal Expanded Body */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/10 p-4 sm:p-5 bg-black/20 space-y-4"
                        >
                          {/* Meal Info Edit Inputs */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 text-xs">
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-400">Nome da Refeição</label>
                              <input
                                type="text"
                                value={meal.name}
                                onChange={(e) => handleUpdateMeal(meal.id, { name: e.target.value })}
                                className="w-full mt-1 p-2 rounded-xl bg-black/40 border border-white/10 text-white font-medium focus:border-emerald-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-400">Horário Previsto</label>
                              <input
                                type="time"
                                value={meal.timeSchedule}
                                onChange={(e) => handleUpdateMeal(meal.id, { timeSchedule: e.target.value })}
                                className="w-full mt-1 p-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:border-emerald-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-400">Observação / Orientação</label>
                              <input
                                type="text"
                                value={meal.notes || ''}
                                placeholder="ex: Tomar creatina / 1h30 antes do treino"
                                onChange={(e) => handleUpdateMeal(meal.id, { notes: e.target.value })}
                                className="w-full mt-1 p-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                              />
                            </div>
                          </div>

                          {/* Foods List */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Alimentos Inseridos ({meal.foods.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenAddFood(meal.id)}
                                className="px-3 py-1 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Adicionar Alimento</span>
                              </button>
                            </div>

                            {meal.foods.length === 0 ? (
                              <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center text-xs text-slate-400 space-y-2">
                                <p>Nenhum alimento cadastrado nesta refeição.</p>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddFood(meal.id)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold inline-flex items-center gap-1 shadow"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Adicionar Primeiro Alimento
                                </button>
                              </div>
                            ) : (
                              meal.foods.map((food) => (
                                <div
                                  key={food.id}
                                  className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                        food.category === 'proteina'
                                          ? 'bg-blue-400'
                                          : food.category === 'carboidrato'
                                          ? 'bg-amber-400'
                                          : food.category === 'gordura'
                                          ? 'bg-rose-400'
                                          : 'bg-emerald-400'
                                      }`}
                                    />
                                    <div>
                                      <h5 className="text-xs sm:text-sm font-bold text-white">{food.name}</h5>
                                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                        <Scale className="w-3 h-3 text-emerald-400" />
                                        <span>{food.portion} ({food.amountGrams}g)</span>
                                        <span className="text-slate-500">•</span>
                                        <span className="capitalize text-slate-300">{food.category}</span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                                    <div className="text-right">
                                      <span className="font-extrabold text-white font-mono">{food.caloriesKcal} kcal</span>
                                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                        <span className="text-blue-300">{food.proteinG}g P</span>
                                        <span className="text-amber-300">{food.carbsG}g C</span>
                                        <span className="text-rose-300">{food.fatG}g G</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditFood(meal.id, food)}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition"
                                        title="Editar alimento"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteFoodItem(meal.id, food.id)}
                                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition"
                                        title="Remover alimento"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: DAILY TARGETS & MACROS */}
          {/* ======================================================== */}
          {activeTab === 'targets' && (
            <div className="space-y-6">
              {/* Daily Calories & Water Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl liquid-glass border border-emerald-500/30 bg-emerald-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-emerald-300 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-emerald-400" /> Meta Calórica Total
                    </span>
                    <span className="text-[10px] text-slate-400">Diária</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1000}
                      max={7000}
                      step={50}
                      value={dailyCalories}
                      onChange={(e) => setDailyCalories(Number(e.target.value))}
                      className="w-full text-2xl sm:text-3xl font-black text-emerald-400 bg-black/40 border border-white/10 rounded-2xl p-3 outline-none focus:border-emerald-500"
                    />
                    <span className="text-sm font-bold text-slate-400">kcal/dia</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Soma atual dos alimentos calculados: <strong>{Math.round(totalCalculatedKcal)} kcal</strong>
                  </p>
                </div>

                <div className="p-5 rounded-3xl liquid-glass border border-cyan-500/30 bg-cyan-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-cyan-300 flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-cyan-400" /> Meta de Hidratação
                    </span>
                    <span className="text-[10px] text-slate-400">Recomendado: 40-50ml/kg</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1.5}
                      max={8.0}
                      step={0.1}
                      value={dailyWater}
                      onChange={(e) => setDailyWater(Number(e.target.value))}
                      className="w-full text-2xl sm:text-3xl font-black text-cyan-400 bg-black/40 border border-white/10 rounded-2xl p-3 outline-none focus:border-cyan-500"
                    />
                    <span className="text-sm font-bold text-slate-400">Litros/dia</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Base atleta {athleteWeightKg}kg: {(athleteWeightKg * 0.045).toFixed(1)}L recomendados.
                  </p>
                </div>
              </div>

              {/* 3 Core Macronutrients */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Divisão de Macronutrientes (Gramas / Dia)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Protein */}
                  <div className="p-4 rounded-3xl liquid-glass border border-blue-500/30 bg-blue-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-300">Proteínas (P)</span>
                      <span className="text-[10px] text-blue-400 font-mono">{proteinGPerKg} g/kg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={50}
                        max={400}
                        value={dailyProtein}
                        onChange={(e) => setDailyProtein(Number(e.target.value))}
                        className="w-full text-xl font-black text-blue-400 bg-black/40 border border-white/10 rounded-2xl p-2.5 outline-none focus:border-blue-500 font-mono"
                      />
                      <span className="text-xs font-bold text-slate-400">g</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {dailyProtein * 4} kcal ({percentP}%)
                    </p>
                  </div>

                  {/* Carbs */}
                  <div className="p-4 rounded-3xl liquid-glass border border-amber-500/30 bg-amber-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">Carboidratos (C)</span>
                      <span className="text-[10px] text-amber-400 font-mono">
                        {(dailyCarbs / (athleteWeightKg || 80)).toFixed(1)} g/kg
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={800}
                        value={dailyCarbs}
                        onChange={(e) => setDailyCarbs(Number(e.target.value))}
                        className="w-full text-xl font-black text-amber-400 bg-black/40 border border-white/10 rounded-2xl p-2.5 outline-none focus:border-amber-500 font-mono"
                      />
                      <span className="text-xs font-bold text-slate-400">g</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {dailyCarbs * 4} kcal ({percentC}%)
                    </p>
                  </div>

                  {/* Fat */}
                  <div className="p-4 rounded-3xl liquid-glass border border-rose-500/30 bg-rose-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300">Gorduras (G)</span>
                      <span className="text-[10px] text-rose-400 font-mono">
                        {(dailyFat / (athleteWeightKg || 80)).toFixed(1)} g/kg
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={10}
                        max={250}
                        step={0.5}
                        value={dailyFat}
                        onChange={(e) => setDailyFat(Number(e.target.value))}
                        className="w-full text-xl font-black text-rose-400 bg-black/40 border border-white/10 rounded-2xl p-2.5 outline-none focus:border-rose-500 font-mono"
                      />
                      <span className="text-xs font-bold text-slate-400">g</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {Math.round(dailyFat * 9)} kcal ({percentG}%)
                    </p>
                  </div>
                </div>

                {/* Macro Ratio Proportion Bar */}
                <div className="p-4 rounded-3xl liquid-glass border border-white/10 bg-black/30 space-y-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Distribuição Energética dos Macros</span>
                    <span className="font-mono text-slate-400">
                      Total: {macroKcalP + macroKcalC + Math.round(macroKcalG)} kcal
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden flex">
                    <div className="h-full bg-blue-500" style={{ width: `${percentP}%` }} title={`Proteína: ${percentP}%`} />
                    <div className="h-full bg-amber-500" style={{ width: `${percentC}%` }} title={`Carboidrato: ${percentC}%`} />
                    <div className="h-full bg-rose-500" style={{ width: `${percentG}%` }} title={`Gordura: ${percentG}%`} />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1">
                    <span className="text-blue-400">● {percentP}% Proteína</span>
                    <span className="text-amber-400">● {percentC}% Carboidrato</span>
                    <span className="text-rose-400">● {percentG}% Gordura</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: PRESETS & PROTOCOLS */}
          {/* ======================================================== */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  Selecione um modelo nutricional pronto de alta performance para carregar as metas calóricas ideais.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRESET_PLANS.map((preset) => (
                  <div
                    key={preset.name}
                    className="p-5 rounded-3xl liquid-glass border border-white/10 hover:border-emerald-500/40 bg-slate-900/60 flex flex-col justify-between gap-4 transition group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                          {preset.name}
                        </h4>
                        <span className="text-sm font-black text-emerald-400 font-mono">{preset.kcal} kcal</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{preset.desc}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-black/40 border border-white/5 grid grid-cols-4 gap-2 text-center text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500">PROT</span>
                        <p className="font-bold text-blue-400">{preset.protein}g</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">CARB</span>
                        <p className="font-bold text-amber-400">{preset.carbs}g</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">GORD</span>
                        <p className="font-bold text-rose-400">{preset.fat}g</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">ÁGUA</span>
                        <p className="font-bold text-cyan-400">{preset.water}L</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="w-full py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-bold border border-emerald-500/30 transition shadow"
                    >
                      Aplicar Este Modelo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/60 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/50"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Plano Alimentar</span>
          </button>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* FOOD PICKER & MACRO CALCULATOR SUB-MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {activeMealIdForFood && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl liquid-glass border border-emerald-500/40 bg-slate-900/95 shadow-2xl overflow-hidden"
            >
              {/* Food Sub-Modal Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-emerald-950/30 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      {foodModalMode === 'edit' ? 'Editar Alimento' : 'Adicionar Alimento'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Selecione da tabela ou informe os valores nutricionais
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setActiveMealIdForFood(null);
                  }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sub-modal Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                {/* Search / Select Quick Food from Database */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Buscar Alimento da Tabela Padrão LM Team
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por frango, ovos, arroz, aveia, whey..."
                      value={foodSearch}
                      onChange={(e) => setFoodSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {['todos', 'proteina', 'carboidrato', 'gordura', 'vegetal', 'suplemento'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          soundFx.playClick();
                          setFoodCategoryFilter(cat);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                          foodCategoryFilter === cat
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Standard Foods Suggestions List (Max 6 shown at a time) */}
                  {foodSearch.trim().length > 0 && (
                    <div className="p-2 rounded-2xl bg-black/50 border border-white/10 max-h-48 overflow-y-auto space-y-1">
                      {filteredStandardFoods.length === 0 ? (
                        <p className="text-xs text-slate-400 p-2 text-center">Nenhum alimento encontrado.</p>
                      ) : (
                        filteredStandardFoods.slice(0, 10).map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => handleSelectStandardFood(item)}
                            className="w-full p-2 rounded-xl text-left hover:bg-emerald-600/20 flex items-center justify-between text-xs transition border border-transparent hover:border-emerald-500/30"
                          >
                            <div>
                              <p className="font-bold text-white">{item.name}</p>
                              <p className="text-[10px] text-slate-400">{item.defaultPortion}</p>
                            </div>
                            <span className="text-[11px] font-mono text-emerald-400 font-bold">
                              {item.caloriesPer100g} kcal/100g
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Manual Food Details & Macro Controls */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Nome do Alimento</label>
                      <input
                        type="text"
                        value={foodFormName}
                        placeholder="ex: Peito de Frango Grelhado"
                        onChange={(e) => setFoodFormName(e.target.value)}
                        className="w-full mt-1 p-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-semibold focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Descrição da Porção</label>
                      <input
                        type="text"
                        value={foodFormPortion}
                        placeholder="ex: 150g pesado pronto / 2 fatias"
                        onChange={(e) => setFoodFormPortion(e.target.value)}
                        className="w-full mt-1 p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Grams Slider & Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Quantidade em Gramas (g):</span>
                      <strong className="text-emerald-400 font-mono">{foodFormGrams}g</strong>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={5}
                        max={500}
                        step={5}
                        value={foodFormGrams}
                        onChange={(e) => handleGramsChange(Number(e.target.value))}
                        className="flex-1 accent-emerald-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min={0}
                        max={1500}
                        value={foodFormGrams}
                        onChange={(e) => handleGramsChange(Number(e.target.value))}
                        className="w-20 p-2 rounded-xl bg-black/40 border border-white/10 text-white text-center font-mono text-xs focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Macro Numbers (P, C, G, Kcal) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/20">
                      <label className="text-[10px] text-blue-300 font-bold block">Proteína (g)</label>
                      <input
                        type="number"
                        step={0.1}
                        value={foodFormProtein}
                        onChange={(e) => setFoodFormProtein(Number(e.target.value))}
                        className="w-full mt-1 p-1.5 rounded-lg bg-black/40 border border-white/10 text-blue-300 font-bold outline-none"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/20">
                      <label className="text-[10px] text-amber-300 font-bold block">Carbo (g)</label>
                      <input
                        type="number"
                        step={0.1}
                        value={foodFormCarbs}
                        onChange={(e) => setFoodFormCarbs(Number(e.target.value))}
                        className="w-full mt-1 p-1.5 rounded-lg bg-black/40 border border-white/10 text-amber-300 font-bold outline-none"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/20">
                      <label className="text-[10px] text-rose-300 font-bold block">Gordura (g)</label>
                      <input
                        type="number"
                        step={0.1}
                        value={foodFormFat}
                        onChange={(e) => setFoodFormFat(Number(e.target.value))}
                        className="w-full mt-1 p-1.5 rounded-lg bg-black/40 border border-white/10 text-rose-300 font-bold outline-none"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-emerald-300 font-bold">Calorias</label>
                        <button
                          type="button"
                          onClick={handleRecalculateKcalFromMacros}
                          className="text-[9px] text-emerald-400 hover:underline"
                          title="Recalcular kcal com base em 4P + 4C + 9G"
                        >
                          Auto
                        </button>
                      </div>
                      <input
                        type="number"
                        value={foodFormCalories}
                        onChange={(e) => setFoodFormCalories(Number(e.target.value))}
                        className="w-full mt-1 p-1.5 rounded-lg bg-black/40 border border-white/10 text-emerald-300 font-bold outline-none"
                      />
                    </div>
                  </div>

                  {/* Food Category Selector */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Categoria do Alimento
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs">
                      {[
                        { id: 'proteina', label: 'Proteína', color: 'border-blue-500 text-blue-300 bg-blue-500/10' },
                        { id: 'carboidrato', label: 'Carboidrato', color: 'border-amber-500 text-amber-300 bg-amber-500/10' },
                        { id: 'gordura', label: 'Gordura', color: 'border-rose-500 text-rose-300 bg-rose-500/10' },
                        { id: 'vegetal', label: 'Vegetal', color: 'border-emerald-500 text-emerald-300 bg-emerald-500/10' },
                        { id: 'suplemento', label: 'Suplemento', color: 'border-purple-500 text-purple-300 bg-purple-500/10' }
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setFoodFormCategory(cat.id as FoodItem['category']);
                          }}
                          className={`p-2 rounded-xl border text-center transition font-bold ${
                            foodFormCategory === cat.id ? cat.color : 'border-white/5 bg-black/20 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-modal Footer */}
              <div className="p-4 border-t border-white/10 bg-black/60 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setActiveMealIdForFood(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSaveFoodItem}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
                >
                  <Check className="w-4 h-4" />
                  <span>{foodModalMode === 'edit' ? 'Salvar Alterações' : 'Inserir Alimento'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
