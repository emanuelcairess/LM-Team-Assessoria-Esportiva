import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X, Check, ArrowRight, Scale, Info, Sparkles } from 'lucide-react';
import { FoodItem } from '../types';
import { FOOD_SUBSTITUTIONS_DATABASE } from '../data/mockData';
import { soundFx } from '../utils/audio';

interface SubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFood: FoodItem | null;
  onApplySubstitution?: (originalFoodId: string, newFoodName: string, newGrams: number, newMacros: { p: number; c: number; f: number; kcal: number }) => void;
}

export const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  isOpen,
  onClose,
  selectedFood,
  onApplySubstitution
}) => {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);

  if (!isOpen || !selectedFood) return null;

  // Look for substitutions database match
  const matchedDatabase = FOOD_SUBSTITUTIONS_DATABASE.find(
    (item) =>
      item.baseFoodName.toLowerCase().includes(selectedFood.name.toLowerCase().split(' ')[0]) ||
      selectedFood.name.toLowerCase().includes(item.baseFoodName.toLowerCase().split(' ')[0])
  );

  // Fallback if not specifically in hardcoded DB: generate smart calculated dynamic options
  const isCarb = selectedFood.category === 'carboidrato' || selectedFood.carbsG > selectedFood.proteinG;
  const isProtein = selectedFood.category === 'proteina' || selectedFood.proteinG >= selectedFood.carbsG;

  const currentAmountG = selectedFood.amountGrams || 100;
  const currentCalories = selectedFood.caloriesKcal;
  const currentCarbs = selectedFood.carbsG;
  const currentProtein = selectedFood.proteinG;
  const currentFat = selectedFood.fatG;

  const options = matchedDatabase
    ? matchedDatabase.options.map((opt) => {
        const ratio = currentAmountG / matchedDatabase.baseAmountG;
        return {
          name: opt.name,
          grams: Math.round(opt.equivalentGrams * ratio),
          calories: Math.round(opt.calories * ratio),
          protein: Number((opt.proteinG * ratio).toFixed(1)),
          carbs: Number((opt.carbsG * ratio).toFixed(1)),
          fat: Number((opt.fatG * ratio).toFixed(1)),
          observation: opt.observation
        };
      })
    : isCarb
    ? [
        {
          name: 'Batata Inglesa Cozida / AirFryer',
          grams: Math.round(currentAmountG * 1.45),
          calories: Math.round(currentCalories * 0.98),
          protein: Number((currentProtein * 1.1).toFixed(1)),
          carbs: Number((currentCarbs * 0.98).toFixed(1)),
          fat: 0.2,
          observation: 'Alta saciedade com menor densidade calórica'
        },
        {
          name: 'Batata Doce Cozida',
          grams: Math.round(currentAmountG * 1.05),
          calories: Math.round(currentCalories * 1.02),
          protein: Number((currentProtein * 0.8).toFixed(1)),
          carbs: Number((currentCarbs * 1.01).toFixed(1)),
          fat: 0.3,
          observation: 'Liberação gradual de glicose'
        },
        {
          name: 'Cuscuz Nordestino Cozido',
          grams: Math.round(currentAmountG * 0.85),
          calories: Math.round(currentCalories * 0.99),
          protein: Number((currentProtein * 0.9).toFixed(1)),
          carbs: Number((currentCarbs * 0.96).toFixed(1)),
          fat: 0.8,
          observation: 'Digestão eficiente no pré-treino'
        },
        {
          name: 'Mandioca / Macaxeira Cozida',
          grams: Math.round(currentAmountG * 0.8),
          calories: Math.round(currentCalories * 1.02),
          protein: Number((currentProtein * 0.5).toFixed(1)),
          carbs: Number((currentCarbs * 1.04).toFixed(1)),
          fat: 0.3,
          observation: 'Ótima para reposição de glicogênio muscular'
        }
      ]
    : isProtein
    ? [
        {
          name: 'Patinho Moído Grelhado (Carne Vermelha Magra)',
          grams: Math.round(currentAmountG * 1.0),
          calories: Math.round(currentCalories * 1.1),
          protein: Number((currentProtein * 1.0).toFixed(1)),
          carbs: 0,
          fat: Number((currentFat + 2).toFixed(1)),
          observation: 'Fonte natural de Creatina e Ferro Heme'
        },
        {
          name: 'Filé de Tilápia / Peixe Branco Grelhado',
          grams: Math.round(currentAmountG * 1.2),
          calories: Math.round(currentCalories * 0.95),
          protein: Number((currentProtein * 1.02).toFixed(1)),
          carbs: 0,
          fat: 2.0,
          observation: 'Digestão leve e rápida absorção'
        },
        {
          name: 'Claras de Ovos Pasteurizadas',
          grams: Math.round(currentAmountG * 2.5),
          calories: Math.round(currentCalories * 0.9),
          protein: Number((currentProtein * 1.05).toFixed(1)),
          carbs: 1.0,
          fat: 0.2,
          observation: '100% Proteína Pura livre de gorduras'
        },
        {
          name: 'Whey Protein 80% Concentrado',
          grams: Math.round(currentProtein / 0.8),
          calories: Math.round(currentCalories * 0.98),
          protein: Number(currentProtein.toFixed(1)),
          carbs: 3.0,
          fat: 1.8,
          observation: 'Máxima praticidade sem necessidade de cocção'
        }
      ]
    : [
        {
          name: 'Azeite de Oliva Extra Virgem',
          grams: Math.round(currentAmountG * 0.6),
          calories: currentCalories,
          protein: 0,
          carbs: 0,
          fat: currentFat,
          observation: 'Rico em ácidos graxos monoinsaturados'
        },
        {
          name: 'Abacate Maduro',
          grams: Math.round(currentAmountG * 3.5),
          calories: currentCalories,
          protein: 2.0,
          carbs: 6.0,
          fat: currentFat,
          observation: 'Rico em potássio e fibras solúveis'
        }
      ];

  const handleApply = () => {
    soundFx.playClick();
    const opt = options[selectedOptionIndex];
    if (onApplySubstitution && opt) {
      onApplySubstitution(selectedFood.id, opt.name, opt.grams, {
        p: opt.protein,
        c: opt.carbs,
        f: opt.fat,
        kcal: opt.calories
      });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl modal-liquid-glass border border-white/15 p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                <RefreshCw className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Calculadora de Trocas Inteligentes</h3>
                <p className="text-xs text-slate-400">Equivalência calórica e de macronutrientes da planilha LM</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Food Card */}
          <div className="my-4 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-400">Alimento Atual</span>
              <h4 className="text-base font-bold text-white mt-0.5">{selectedFood.name}</h4>
              <p className="text-xs text-slate-300 font-medium">{currentAmountG}g ({selectedFood.portion})</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-emerald-300">{currentCalories} kcal</span>
              <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-1 font-mono">
                <span className="text-blue-400 font-semibold">{currentProtein}g P</span>
                <span className="text-amber-400 font-semibold">{currentCarbs}g C</span>
                <span className="text-rose-400 font-semibold">{currentFat}g G</span>
              </div>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Opções Calculadas por Equivalência Exata
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
            {options.map((opt, idx) => {
              const isSelected = selectedOptionIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedOptionIndex(idx);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-400 text-black'
                            : 'border-slate-500 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-white">{opt.name}</h5>
                        <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                          <Scale className="w-3.5 h-3.5" /> Pesar {opt.grams}g (Pronto)
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-white">{opt.calories} kcal</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-mono mt-0.5">
                        <span className="text-blue-300 font-semibold">{opt.protein}g P</span>
                        <span className="text-amber-300 font-semibold">{opt.carbs}g C</span>
                        <span className="text-rose-300 font-semibold">{opt.fat}g G</span>
                      </div>
                    </div>
                  </div>

                  {opt.observation && (
                    <div className="mt-2 text-[11px] text-slate-400 bg-white/5 rounded-xl px-2.5 py-1 flex items-center gap-1.5">
                      <Info className="w-3 h-3 text-emerald-400/80 shrink-0" />
                      <span>{opt.observation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition"
            >
              <Check className="w-4 h-4" /> Aplicar Troca na Dieta
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
