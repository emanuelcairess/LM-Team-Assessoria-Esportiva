import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Sparkles,
  Bookmark,
  BookmarkPlus,
  Dumbbell,
  HeartPulse,
  Clock,
  Flame,
  Search,
  Check,
  Trash2,
  Layers,
  ArrowRight,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';
import { WorkoutSplit, WorkoutTemplate } from '../types';
import { soundFx } from '../utils/audio';

interface WorkoutTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: WorkoutTemplate[];
  activeSplit?: WorkoutSplit;
  onApplyTemplate: (template: WorkoutTemplate, mode: 'replace' | 'add_new') => void;
  onSaveTemplate: (newTemplate: WorkoutTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  canAddNewSplit: boolean;
}

export const WorkoutTemplateModal: React.FC<WorkoutTemplateModalProps> = ({
  isOpen,
  onClose,
  templates,
  activeSplit,
  onApplyTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  canAddNewSplit
}) => {
  const [viewMode, setViewMode] = useState<'library' | 'save_current'>(
    activeSplit ? 'library' : 'library'
  );

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);

  // Save current workout state
  const [templateName, setTemplateName] = useState(
    activeSplit ? `Modelo: ${activeSplit.name}` : ''
  );
  const [templateCategory, setTemplateCategory] = useState('Hipertrofia');
  const [templateDescription, setTemplateDescription] = useState(
    activeSplit ? `Divisão periodizada focada em ${activeSplit.targetMuscleGroups.join(', ')}.` : ''
  );

  const categories = ['Todos', 'Hipertrofia', 'Push / Pull / Legs', 'FST-7 & Volume', 'Cardio & Queima', 'Personalizados'];

  const filteredTemplates = templates.filter((tmpl) => {
    const matchesSearch =
      tmpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.targetMuscleGroups.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tmpl.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === 'Todos') return true;
    if (selectedCategory === 'Personalizados') return !tmpl.isOfficial;
    return tmpl.category === selectedCategory;
  });

  const handleSaveAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSplit || !templateName.trim()) return;

    const newTemplate: WorkoutTemplate = {
      id: `tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: templateName.trim(),
      description: templateDescription.trim(),
      category: templateCategory,
      exercisesCount: activeSplit.exercises.length,
      estimatedDurationMinutes: activeSplit.estimatedDurationMinutes,
      targetMuscleGroups: activeSplit.targetMuscleGroups,
      isOfficial: false,
      createdAt: new Date().toISOString().split('T')[0],
      split: {
        ...activeSplit,
        id: `split-copy-${Date.now()}`
      }
    };

    soundFx.playRestComplete();
    onSaveTemplate(newTemplate);
    setViewMode('library');
    setSelectedTemplate(newTemplate);
  };

  const handleSelectTemplate = (t: WorkoutTemplate) => {
    soundFx.playClick();
    setSelectedTemplate(t);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl modal-liquid-glass border border-orange-500/30 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-600/30 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-950/40">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Banco de Treinos Prescritor
                </span>
                <span className="text-xs text-slate-400">
                  {templates.length} Modelos Disponíveis
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Modelos de Treino & Cardio Reutilizáveis
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSplit && (
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setViewMode('library');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    viewMode === 'library'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Biblioteca
                </button>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setViewMode('save_current');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    viewMode === 'save_current'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  Salvar Atual
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VIEW 1: LIBRARY */}
        {viewMode === 'library' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Column: Template List */}
            <div className="w-full md:w-1/2 p-5 border-b md:border-b-0 md:border-r border-white/10 flex flex-col overflow-y-auto space-y-4">
              {/* Search & Category Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por músculo ou nome do modelo..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedCategory(cat);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition border ${
                        selectedCategory === cat
                          ? 'bg-amber-600 text-white border-amber-400'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Cards List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {filteredTemplates.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white/5 border border-dashed border-white/10 text-slate-400 text-xs">
                    Nenhum modelo encontrado para este filtro.
                  </div>
                ) : (
                  filteredTemplates.map((tmpl) => {
                    const isSelected = selectedTemplate?.id === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => handleSelectTemplate(tmpl)}
                        className={`p-3.5 rounded-2xl cursor-pointer transition border ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/40'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              {tmpl.isOfficial ? (
                                <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Oficial LM
                                </span>
                              ) : (
                                <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  Coach Custom
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {tmpl.category}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white leading-tight">
                              {tmpl.name}
                            </h4>
                          </div>

                          {!tmpl.isOfficial && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                soundFx.playClick();
                                onDeleteTemplate(tmpl.id);
                                if (selectedTemplate?.id === tmpl.id) {
                                  setSelectedTemplate(null);
                                }
                              }}
                              className="p-1.5 rounded-xl bg-rose-950/30 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition"
                              title="Excluir Modelo Salvo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 mt-1.5">
                          {tmpl.description}
                        </p>

                        <div className="flex items-center gap-3 mt-2.5 text-[11px] text-slate-300">
                          <span className="flex items-center gap-1">
                            <Dumbbell className="w-3 h-3 text-orange-400" />
                            {tmpl.exercisesCount} exercícios
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-400" />
                            {tmpl.estimatedDurationMinutes} min
                          </span>
                          {tmpl.split.cardioOrientation?.enabled && (
                            <span className="flex items-center gap-1 text-teal-300 font-semibold">
                              <HeartPulse className="w-3 h-3 text-teal-400" />
                              Cardio incluso
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Template Preview & Action */}
            <div className="w-full md:w-1/2 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto bg-black/20">
              {selectedTemplate ? (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        Prévia do Modelo
                      </span>
                      <span className="text-xs text-slate-400">
                        • {selectedTemplate.split.dayOfWeek}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white">{selectedTemplate.name}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {selectedTemplate.description}
                    </p>
                  </div>

                  {/* Muscle Groups */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                      Grupos Musculares Trabalhados
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTemplate.targetMuscleGroups.map((m) => (
                        <span
                          key={m}
                          className="px-2.5 py-1 rounded-xl bg-orange-600/20 text-orange-300 border border-orange-500/30 text-xs font-bold"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Cardio Orientation Preview */}
                  {selectedTemplate.split.cardioOrientation?.enabled && (
                    <div className="p-3.5 rounded-2xl bg-teal-950/30 border border-teal-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                        <HeartPulse className="w-4 h-4 text-teal-400" />
                        <span>Orientação de Cardio Integrada</span>
                      </div>
                      <p className="text-xs text-slate-200">
                        <strong>{selectedTemplate.split.cardioOrientation.type}</strong> •{' '}
                        {selectedTemplate.split.cardioOrientation.durationMinutes} min •{' '}
                        {selectedTemplate.split.cardioOrientation.intensity} (
                        {selectedTemplate.split.cardioOrientation.timing})
                      </p>
                      <p className="text-[11px] text-teal-200 italic">
                        "{selectedTemplate.split.cardioOrientation.instructions}"
                      </p>
                    </div>
                  )}

                  {/* Exercises Mini-list */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Lista de Exercícios ({selectedTemplate.split.exercises.length})
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {selectedTemplate.split.exercises.map((ex, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-lg bg-orange-600/30 text-orange-300 font-bold text-[10px] flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-white">{ex.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {ex.sets.length} séries • {ex.targetMuscle}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-white/10 space-y-2">
                    {activeSplit && (
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playRestComplete();
                          onApplyTemplate(selectedTemplate, 'replace');
                          onClose();
                        }}
                        className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50"
                      >
                        <Check className="w-4 h-4" />
                        <span>Substituir no Treino Atual ({activeSplit.code})</span>
                      </button>
                    )}

                    {canAddNewSplit && (
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playRestComplete();
                          onApplyTemplate(selectedTemplate, 'add_new');
                          onClose();
                        }}
                        className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition flex items-center justify-center gap-2 border border-white/10"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>Adicionar como Novo Dia na Semana</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <Bookmark className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="font-bold text-sm text-slate-300">Nenhum modelo selecionado</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Selecione um modelo na lista ao lado para ver a grade completa de exercícios e aplicá-lo ao aluno.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: SAVE CURRENT WORKOUT AS TEMPLATE */}
        {viewMode === 'save_current' && activeSplit && (
          <form onSubmit={handleSaveAsTemplate} className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white">Reaproveitamento de Prescrição:</p>
                <p>
                  Salve o <strong>{activeSplit.code} ({activeSplit.name})</strong> com todos os seus {activeSplit.exercises.length} exercícios, cargas base e orientação de cardio para aplicar em qualquer outro aluno com 1 clique!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Nome do Modelo *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ex: Upper Body Power & Densidade 2026"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Categoria *
                </label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl bg-black/40 border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="Hipertrofia">Hipertrofia</option>
                  <option value="Push / Pull / Legs">Push / Pull / Legs</option>
                  <option value="FST-7 & Volume">FST-7 & Volume</option>
                  <option value="Cardio & Queima">Cardio & Queima</option>
                  <option value="Força & Potência">Força & Potência</option>
                  <option value="Reabilitação & Core">Reabilitação & Core</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Descrição / Notas da Estratégia
              </label>
              <textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={3}
                placeholder="Ex: Ideal para alunos intermediários a avançados buscando quebra de platô no peitoral..."
                className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMode('library')}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold"
              >
                Voltar à Biblioteca
              </button>

              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-xl shadow-amber-950/50 flex items-center gap-2"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>Salvar na Minha Biblioteca de Modelos</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
