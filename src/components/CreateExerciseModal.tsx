import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Dumbbell,
  Sparkles,
  Save,
  Clock,
  Layers,
  Info,
  Check,
  Tag,
  Flame,
  Activity
} from 'lucide-react';
import { LibraryExercise, TechniqueType } from '../types';
import { soundFx } from '../utils/audio';

interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: LibraryExercise) => void;
  initialExercise?: Partial<LibraryExercise> | null;
}

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
  'Cardiovascular'
];

const EQUIPMENT_OPTIONS = [
  'Halteres',
  'Barra',
  'Polia / Cabo',
  'Máquina',
  'Smith',
  'Peso Corporal',
  'Kettlebell',
  'Elástico / Band'
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

export const CreateExerciseModal: React.FC<CreateExerciseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialExercise
}) => {
  const [name, setName] = useState<string>(initialExercise?.name || '');
  const [targetMuscle, setTargetMuscle] = useState<string>(
    initialExercise?.targetMuscle || 'Peitoral'
  );
  const [subMuscle, setSubMuscle] = useState<string>(initialExercise?.subMuscle || '');
  const [equipment, setEquipment] = useState<string>(
    initialExercise?.equipment || 'Halteres'
  );
  const [defaultRestSeconds, setDefaultRestSeconds] = useState<number>(
    initialExercise?.defaultRestSeconds || 75
  );
  const [defaultSetsCount, setDefaultSetsCount] = useState<number>(
    initialExercise?.defaultSetsCount || 3
  );
  const [defaultRepsTarget, setDefaultRepsTarget] = useState<string>(
    initialExercise?.defaultRepsTarget || '8-10'
  );
  const [defaultTechnique, setDefaultTechnique] = useState<TechniqueType>(
    initialExercise?.defaultTechnique || 'Normal'
  );
  const [cadence, setCadence] = useState<string>(initialExercise?.cadence || '2011');
  const [technicalNotes, setTechnicalNotes] = useState<string>(
    initialExercise?.technicalNotes || ''
  );
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>(
    initialExercise?.tags || ['Hipertrofia']
  );

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const cleanTag = tagInput.trim();
    if (!tags.includes(cleanTag)) {
      setTags((prev) => [...prev, cleanTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    soundFx.playSuccess();
    const newEx: LibraryExercise = {
      id: initialExercise?.id || `lib-custom-${Date.now()}`,
      name: name.trim(),
      targetMuscle,
      subMuscle: subMuscle.trim() || undefined,
      equipment,
      defaultRestSeconds: Number(defaultRestSeconds) || 60,
      defaultSetsCount: Number(defaultSetsCount) || 3,
      defaultRepsTarget: defaultRepsTarget.trim() || '8-10',
      defaultTechnique,
      cadence: cadence.trim() || undefined,
      technicalNotes: technicalNotes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      isCustom: true,
      createdAt: initialExercise?.createdAt || new Date().toISOString().split('T')[0],
      usageCount: initialExercise?.usageCount || 1
    };

    onSave(newEx);
    onClose();
  };

  return (
    <div
      id="create-exercise-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        id="create-exercise-modal-card"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-xl rounded-3xl liquid-glass border border-orange-500/30 bg-slate-900/95 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/30 border border-orange-500/40 text-orange-400 flex items-center justify-center shadow-md">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                Banco de Exercícios da Assessoria
              </span>
              <h2 className="text-base font-black text-white">
                {initialExercise?.id ? 'Editar Exercício do Banco' : 'Novo Exercício para a Biblioteca'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Nome do Exercício *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Supino Reto com Halteres no Banco Plano"
              className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Muscle Group */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Grupo Muscular Principal *
              </label>
              <select
                value={targetMuscle}
                onChange={(e) => setTargetMuscle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-black/40 border border-white/15 text-white text-xs font-bold focus:outline-none focus:border-orange-500"
              >
                {MUSCLE_OPTIONS.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-Muscle / Focus */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Foco / Feixe Específico (Opcional)
              </label>
              <input
                type="text"
                value={subMuscle}
                onChange={(e) => setSubMuscle(e.target.value)}
                placeholder="Ex: Peitoral Superior, Feixes Claviculares"
                className="w-full px-3 py-2.5 rounded-2xl bg-black/40 border border-white/15 text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Equipment */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Equipamento / Aparelho *
              </label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-black/40 border border-white/15 text-white text-xs font-bold focus:outline-none focus:border-orange-500"
              >
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <option key={eq} value={eq} className="bg-slate-900 text-white">
                    {eq}
                  </option>
                ))}
              </select>
            </div>

            {/* Default Rest */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Descanso Padrão (segundos)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={defaultRestSeconds}
                  onChange={(e) => setDefaultRestSeconds(Number(e.target.value) || 60)}
                  min={15}
                  max={300}
                  step={15}
                  className="w-full px-3 py-2.5 rounded-2xl bg-black/40 border border-white/15 text-white text-xs font-bold focus:outline-none focus:border-orange-500 pr-9"
                />
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Standard Sets & Reps Defaults */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Séries Padrão
              </label>
              <input
                type="number"
                value={defaultSetsCount}
                onChange={(e) => setDefaultSetsCount(Number(e.target.value) || 3)}
                min={1}
                max={10}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Faixa de Reps
              </label>
              <input
                type="text"
                value={defaultRepsTarget}
                onChange={(e) => setDefaultRepsTarget(e.target.value)}
                placeholder="Ex: 8-10 ou 10-12"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Cadência / Tempo
              </label>
              <input
                type="text"
                value={cadence}
                onChange={(e) => setCadence(e.target.value)}
                placeholder="Ex: 3010 ou 2011"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Technical Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Orientações Técnicas / Dicas de Execução do Treinador
            </label>
            <textarea
              rows={2}
              value={technicalNotes}
              onChange={(e) => setTechnicalNotes(e.target.value)}
              placeholder="Ex: Posição dos cotovelos a 45°, pico de contração de 1s e descida em 3 segundos controlados."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-black/40 border border-white/15 text-white text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Tags / Marcadores (Opcional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Ex: Hipertrofia, Pré-Exaustão, Composto..."
                className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
              >
                + Tag
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[11px] font-bold flex items-center gap-1.5"
                >
                  <Tag className="w-3 h-3" />
                  {t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-orange-400 hover:text-white ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-950/50 transition"
            >
              <Save className="w-4 h-4" />
              <span>Salvar no Banco de Exercícios</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
