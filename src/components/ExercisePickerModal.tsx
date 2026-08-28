import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  Dumbbell,
  Clock,
  Layers,
  Sparkles,
  Plus,
  Check,
  Tag,
  Info,
  Filter,
  Trash2,
  Edit,
  ArrowRight,
  Flame
} from 'lucide-react';
import { LibraryExercise, Exercise } from '../types';
import { soundFx } from '../utils/audio';
import { CreateExerciseModal } from './CreateExerciseModal';

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseLibrary: LibraryExercise[];
  onSelectExercise: (libEx: LibraryExercise) => void;
  onSaveNewToLibrary: (libEx: LibraryExercise) => void;
  onDeleteFromLibrary?: (exerciseId: string) => void;
  preselectedMuscle?: string;
}

const MUSCLE_FILTER_CHIPS = [
  'Todos',
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
  'Antebraço'
];

export const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
  isOpen,
  onClose,
  exerciseLibrary,
  onSelectExercise,
  onSaveNewToLibrary,
  onDeleteFromLibrary,
  preselectedMuscle
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>(
    preselectedMuscle && MUSCLE_FILTER_CHIPS.includes(preselectedMuscle)
      ? preselectedMuscle
      : 'Todos'
  );
  const [selectedEquipment, setSelectedEquipment] = useState<string>('todos');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<LibraryExercise | null>(null);

  const filteredExercises = useMemo(() => {
    return exerciseLibrary.filter((ex) => {
      const matchMuscle =
        selectedMuscle === 'Todos' ||
        ex.targetMuscle.toLowerCase().includes(selectedMuscle.toLowerCase()) ||
        (ex.subMuscle && ex.subMuscle.toLowerCase().includes(selectedMuscle.toLowerCase()));

      const matchEquipment =
        selectedEquipment === 'todos' ||
        (ex.equipment && ex.equipment.toLowerCase() === selectedEquipment.toLowerCase());

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.targetMuscle.toLowerCase().includes(q) ||
        (ex.subMuscle && ex.subMuscle.toLowerCase().includes(q)) ||
        (ex.equipment && ex.equipment.toLowerCase().includes(q)) ||
        (ex.tags && ex.tags.some((t) => t.toLowerCase().includes(q))) ||
        (ex.technicalNotes && ex.technicalNotes.toLowerCase().includes(q));

      return matchMuscle && matchEquipment && matchSearch;
    });
  }, [exerciseLibrary, selectedMuscle, selectedEquipment, searchQuery]);

  if (!isOpen) return null;

  const handlePick = (ex: LibraryExercise) => {
    soundFx.playClick();
    onSelectExercise(ex);
    onClose();
  };

  return (
    <div
      id="exercise-picker-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        id="exercise-picker-modal-card"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-4xl rounded-3xl liquid-glass border border-orange-500/30 bg-slate-900/95 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-black/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-600/30 border border-orange-500/40 text-orange-400 flex items-center justify-center shadow-lg">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                  Banco de Exercícios da Assessoria
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                  {exerciseLibrary.length} cadastrados
                </span>
              </div>
              <h2 className="text-lg font-black text-white">
                Biblioteca de Exercícios & Prescrição Ágil
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setExerciseToEdit(null);
                setIsCreateModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-950/40 transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Exercício</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-black/20 space-y-3 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-orange-400 absolute left-4 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, músculo, aparelho, técnica ou nota técnica (ex: Supino, Barra, 3010)..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-white placeholder-slate-400 text-xs font-bold focus:outline-none focus:border-orange-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white text-xs"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Muscle Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {MUSCLE_FILTER_CHIPS.map((muscle) => {
              const isSelected = selectedMuscle === muscle;
              return (
                <button
                  key={muscle}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedMuscle(muscle);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                    isSelected
                      ? 'bg-orange-600 text-white border-orange-400 shadow-md shadow-orange-950/40'
                      : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {muscle}
                </button>
              );
            })}
          </div>
        </div>

        {/* Exercises List Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-white/5 border border-dashed border-white/10 space-y-3">
              <Dumbbell className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-slate-300">
                Nenhum exercício encontrado com esses filtros
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Você pode cadastrar esse exercício agora mesmo no banco de dados para utilizá-lo nesta e em todas as prescrições futuras.
              </p>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setExerciseToEdit({
                    id: '',
                    name: searchQuery.trim() || '',
                    targetMuscle: selectedMuscle !== 'Todos' ? selectedMuscle : 'Peitoral',
                    defaultRestSeconds: 75,
                    defaultSetsCount: 3,
                    defaultRepsTarget: '8-10'
                  });
                  setIsCreateModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-orange-600 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-orange-950/50"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar "{searchQuery || 'Novo Exercício'}" no Banco</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/40 transition group flex flex-col justify-between space-y-3 relative overflow-hidden"
                >
                  <div>
                    {/* Header: Target muscle & Equipment */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 text-[10px] font-bold border border-orange-500/30">
                          {ex.targetMuscle}
                        </span>
                        {ex.equipment && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 text-[10px] font-mono border border-white/5">
                            {ex.equipment}
                          </span>
                        )}
                        {ex.isCustom && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                            Customizado
                          </span>
                        )}
                      </div>

                      {/* Rest Time */}
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-400" />
                        {ex.defaultRestSeconds}s
                      </span>
                    </div>

                    {/* Exercise Name */}
                    <h3 className="text-sm font-black text-white group-hover:text-orange-300 transition leading-snug">
                      {ex.name}
                    </h3>
                    {ex.subMuscle && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{ex.subMuscle}</p>
                    )}

                    {/* Technical Notes snippet */}
                    {ex.technicalNotes && (
                      <p className="text-xs text-slate-300 mt-2 p-2 rounded-xl bg-black/30 border border-white/5 italic line-clamp-2">
                        "{ex.technicalNotes}"
                      </p>
                    )}

                    {/* Meta: Sets & Cadence */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2 font-mono">
                      <span>
                        Séries sugeridas: <strong className="text-white">{ex.defaultSetsCount || 3}x</strong> ({ex.defaultRepsTarget || '8-10'})
                      </span>
                      {ex.cadence && (
                        <span>
                          Cadência: <strong className="text-amber-300">{ex.cadence}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playClick();
                          setExerciseToEdit(ex);
                          setIsCreateModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white text-xs transition"
                        title="Editar dados no banco"
                      >
                        <Edit className="w-3 h-3" />
                      </button>

                      {ex.isCustom && onDeleteFromLibrary && (
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            onDeleteFromLibrary(ex.id);
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition"
                          title="Remover do banco"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePick(ex)}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-950/40 transition"
                    >
                      <span>Inserir no Treino</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            Exibindo <strong>{filteredExercises.length}</strong> exercício(s)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition"
          >
            Fechar
          </button>
        </div>
      </motion.div>

      {/* Create / Edit Exercise Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateExerciseModal
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setExerciseToEdit(null);
            }}
            initialExercise={exerciseToEdit}
            onSave={(newEx) => {
              onSaveNewToLibrary(newEx);
              setIsCreateModalOpen(false);
              setExerciseToEdit(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
