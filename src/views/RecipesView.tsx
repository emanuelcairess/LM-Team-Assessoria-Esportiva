import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChefHat,
  Clock,
  Flame,
  Search,
  Sparkles,
  ChevronRight,
  X,
  Scale,
  CheckCircle,
  UtensilsCrossed
} from 'lucide-react';
import { FitRecipe } from '../types';
import { soundFx } from '../utils/audio';

interface RecipesViewProps {
  recipes: FitRecipe[];
}

export const RecipesView: React.FC<RecipesViewProps> = ({ recipes }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [activeRecipe, setActiveRecipe] = useState<FitRecipe | null>(null);

  const categories = [
    { id: 'todos', label: 'Todas as Receitas' },
    { id: 'Doce Proteico', label: 'Doces Proteicos' },
    { id: 'Salgado Fit', label: 'Salgados Fit (AirFryer)' },
    { id: 'Lanche Rápido', label: 'Lanches Rápidos' },
    { id: 'Refeição Principal', label: 'Refeições Principais' }
  ];

  const filteredRecipes = recipes.filter((rec) => {
    const matchCat = selectedCategory === 'todos' || rec.category === selectedCategory;
    const matchQuery =
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.ingredients.some((ing) => ing.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchQuery;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Recipes Header Card (#00695C Emerald / Deep Teal Theme) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl liquid-glass hero-recipes p-6 sm:p-7 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-600 text-white">
                Gastronomia Anabólica
              </span>
              <span className="text-xs text-teal-300 font-semibold">Substituições Aprovadas</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Catálogo de Receitas Fit & Proteicas
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Opções com alta densidade proteica para matar a vontade de doce ou salgado sem furar a dieta
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 w-full md:w-72">
            <Search className="w-4 h-4 text-teal-400 ml-2 shrink-0" />
            <input
              type="text"
              placeholder="Buscar receita ou ingrediente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-full py-1.5"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white mr-2">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Categories Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                soundFx.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition border ${
                isSelected
                  ? 'bg-teal-600 text-white border-teal-400 shadow-xl shadow-teal-950/50'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Recipes Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRecipes.map((recipe, index) => (
          <motion.div
            key={recipe.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => {
              soundFx.playClick();
              setActiveRecipe(recipe);
            }}
            className="group rounded-3xl liquid-glass border border-white/10 hover:border-teal-500/40 shadow-xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Recipe Image with overlay badge */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-teal-300 border border-teal-500/30">
                  {recipe.category}
                </span>
                <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10">
                  <Clock className="w-3 h-3 text-teal-400" /> {recipe.prepTimeMinutes} min
                </span>
              </div>

              {/* Title & Macros */}
              <div className="p-5">
                <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition line-clamp-2">
                  {recipe.title}
                </h3>

                <div className="grid grid-cols-4 gap-2 text-center my-4 py-2.5 px-2 rounded-2xl bg-white/5 border border-white/5 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Calorias</span>
                    <p className="font-extrabold text-white">{recipe.caloriesKcal}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-blue-400">Proteína</span>
                    <p className="font-extrabold text-blue-300">{recipe.proteinG}g</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-amber-400">Carbos</span>
                    <p className="font-extrabold text-amber-300">{recipe.carbsG}g</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-rose-400">Gordura</span>
                    <p className="font-extrabold text-rose-300">{recipe.fatG}g</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  Ingredientes: {recipe.ingredients.slice(0, 3).join(', ')}...
                </p>
              </div>
            </div>

            <div className="px-5 pb-5 pt-0 flex items-center justify-between text-xs font-bold text-teal-400">
              <span>Ver Modo de Preparo</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recipe Modal Detail */}
      <AnimatePresence>
        {activeRecipe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-3xl liquid-glass border border-white/15 p-6 shadow-2xl my-6 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-teal-600/20 text-teal-400 border border-teal-500/30">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-teal-400 tracking-wider">
                      {activeRecipe.category}
                    </span>
                    <h3 className="text-lg font-bold text-white">{activeRecipe.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setActiveRecipe(null)}
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
                {/* Image + Macros Banner */}
                <div className="relative h-52 rounded-2xl overflow-hidden">
                  <img
                    src={activeRecipe.image}
                    alt={activeRecipe.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-around bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 text-xs">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Total Kcal</span>
                      <p className="text-base font-black text-white">{activeRecipe.caloriesKcal}</p>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="text-center">
                      <span className="text-[10px] text-blue-400 uppercase font-bold">Proteínas</span>
                      <p className="text-base font-black text-blue-300">{activeRecipe.proteinG}g</p>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="text-center">
                      <span className="text-[10px] text-amber-400 uppercase font-bold">Carboidratos</span>
                      <p className="text-base font-black text-amber-300">{activeRecipe.carbsG}g</p>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="text-center">
                      <span className="text-[10px] text-rose-400 uppercase font-bold">Gorduras</span>
                      <p className="text-base font-black text-rose-300">{activeRecipe.fatG}g</p>
                    </div>
                  </div>
                </div>

                {/* Ingredients List */}
                <div>
                  <h4 className="text-xs uppercase font-extrabold text-teal-400 tracking-wider mb-2.5 flex items-center gap-1.5">
                    <UtensilsCrossed className="w-4 h-4" /> Ingredientes Necessários:
                  </h4>
                  <div className="space-y-2">
                    {activeRecipe.ingredients.map((ing, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 text-xs text-white"
                      >
                        <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                        <span>{ing}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="text-xs uppercase font-extrabold text-teal-400 tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Modo de Preparo Passo a Passo:
                  </h4>
                  <div className="space-y-2.5">
                    {activeRecipe.instructions.map((step, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3 text-xs text-slate-200"
                      >
                        <span className="w-5 h-5 rounded-full bg-teal-600/30 text-teal-300 border border-teal-500/40 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chef Tip */}
                {activeRecipe.tips && (
                  <div className="p-3.5 rounded-2xl bg-teal-950/30 border border-teal-500/20 text-xs text-slate-300">
                    <span className="text-teal-300 font-bold uppercase tracking-wider text-[10px] block mb-1">Dica do Nutricionista:</span>
                    {activeRecipe.tips}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
