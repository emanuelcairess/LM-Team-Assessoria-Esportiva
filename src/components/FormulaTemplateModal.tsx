import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Bookmark,
  BookmarkPlus,
  Pill,
  Search,
  Check,
  Trash2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Clock,
  FileCheck,
  Plus,
  Info,
  Edit,
  FolderOpen
} from 'lucide-react';
import { SupplementFormulaTemplate, SupplementItem, SupplementCategory, FormulaComponent } from '../types';
import { soundFx } from '../utils/audio';

interface FormulaTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: SupplementFormulaTemplate[];
  onApplyTemplate: (template: SupplementFormulaTemplate) => void;
  onSaveTemplate: (newTemplate: SupplementFormulaTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  activeSupplement?: SupplementItem | null;
  athleteName: string;
}

const CATEGORY_TABS: { id: string; label: string; icon: string }[] = [
  { id: 'todos', label: 'Todas as Fórmulas', icon: '✨' },
  { id: 'intra_treino', label: 'Intra-Treino', icon: '⚡' },
  { id: 'sono_relaxamento', label: 'Sono & Relax', icon: '🌙' },
  { id: 'saude_cardiovascular', label: 'Cardio & Hepático', icon: '❤️' },
  { id: 'termogenico_energia', label: 'Termogênico', icon: '🔥' },
  { id: 'articular_colageno', label: 'Articular', icon: '🦴' },
  { id: 'digestivo_intestinal', label: 'Digestivo', icon: '🍃' },
  { id: 'personalizados', label: 'Criadas por Mim', icon: '🏷️' }
];

export const FormulaTemplateModal: React.FC<FormulaTemplateModalProps> = ({
  isOpen,
  onClose,
  templates,
  onApplyTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  activeSupplement,
  athleteName
}) => {
  const [viewMode, setViewMode] = useState<'library' | 'create_new'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('todos');
  const [selectedTemplate, setSelectedTemplate] = useState<SupplementFormulaTemplate | null>(null);

  // New Template Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<SupplementCategory>('intra_treino');
  const [newDosage, setNewDosage] = useState('');
  const [newSchedule, setNewSchedule] = useState('');
  const [newBenefits, setNewBenefits] = useState('');
  const [newDoctorNotes, setNewDoctorNotes] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [componentsList, setComponentsList] = useState<FormulaComponent[]>([]);
  const [activeInputName, setActiveInputName] = useState('');
  const [activeInputAmount, setActiveInputAmount] = useState('');

  if (!isOpen) return null;

  const filteredTemplates = templates.filter((tmpl) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      tmpl.name.toLowerCase().includes(query) ||
      tmpl.description.toLowerCase().includes(query) ||
      tmpl.benefits.toLowerCase().includes(query) ||
      tmpl.ingredients.some((ing) => ing.toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (selectedCategoryTab === 'todos') return true;
    if (selectedCategoryTab === 'personalizados') return !tmpl.isOfficial;
    return tmpl.category === selectedCategoryTab;
  });

  const handleApply = (tmpl: SupplementFormulaTemplate) => {
    soundFx.playSuccess();
    onApplyTemplate(tmpl);
    onClose();
  };

  const handleCreateNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDosage.trim()) return;

    const ingredients = componentsList.map((c) =>
      c.amount ? `${c.name}: ${c.amount}` : c.name
    );

    const newTemplate: SupplementFormulaTemplate = {
      id: `tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newName.trim(),
      description: newDescription.trim() || newBenefits.trim(),
      category: newCategory,
      dosage: newDosage.trim(),
      schedule: newSchedule.trim() || 'Conforme orientação médica',
      benefits: newBenefits.trim(),
      doctorNotes: newDoctorNotes.trim(),
      ingredients,
      components: componentsList,
      isOfficial: false,
      createdBy: 'Prescritor LM Team',
      createdAt: new Date().toISOString().split('T')[0]
    };

    soundFx.playRestComplete();
    onSaveTemplate(newTemplate);
    setViewMode('library');
    setSelectedTemplate(newTemplate);
  };

  const handleAddActiveToNew = () => {
    if (!activeInputName.trim()) return;
    soundFx.playClick();
    setComponentsList((prev) => [
      ...prev,
      {
        id: `comp-${Date.now()}`,
        name: activeInputName.trim(),
        amount: activeInputAmount.trim()
      }
    ]);
    setActiveInputName('');
    setActiveInputAmount('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl my-6 rounded-3xl liquid-glass border border-purple-500/30 bg-slate-950/95 shadow-2xl shadow-purple-950/80 overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header Bar */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-950/70 via-slate-900/90 to-indigo-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center shadow-lg shadow-purple-900/40">
              <Bookmark className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500 text-slate-950">
                  Biblioteca Oficial & Magistral
                </span>
                <span className="text-xs text-purple-300 font-semibold">
                  Aluno em foco: <strong className="text-white">{athleteName}</strong>
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Modelos de Fórmulas & Suplementação
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setViewMode('library');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'library'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Biblioteca ({templates.length})</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setViewMode('create_new');
                  if (activeSupplement) {
                    setNewName(`Modelo: ${activeSupplement.name}`);
                    setNewCategory(activeSupplement.category);
                    setNewDosage(activeSupplement.dosage);
                    setNewSchedule(activeSupplement.schedule);
                    setNewBenefits(activeSupplement.benefits);
                    setNewDoctorNotes(activeSupplement.doctorNotes || '');
                    setNewDescription(activeSupplement.benefits);
                    if (activeSupplement.components) {
                      setComponentsList(activeSupplement.components);
                    }
                  }
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'create_new'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Novo Modelo</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: TEMPLATE LIBRARY */}
        {/* ======================================================== */}
        {viewMode === 'library' && (
          <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
            {/* Search and Category Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 w-full sm:w-80">
                <Search className="w-4 h-4 text-purple-400 ml-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar por nome, ativo (ex: NAC, AAKG)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-full py-1"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-white text-xs px-2"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedCategoryTab(tab.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 border ${
                      selectedCategoryTab === tab.id
                        ? 'bg-purple-600 text-white border-purple-400/50 shadow-md'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Templates List Grid & Preview Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {/* Left Column: Template Cards List */}
              <div className="lg:col-span-6 space-y-3">
                {filteredTemplates.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center text-slate-400 space-y-2">
                    <Pill className="w-8 h-8 text-purple-400/50 mx-auto" />
                    <p className="text-sm font-bold text-slate-300">Nenhum modelo de fórmula encontrado</p>
                    <p className="text-xs">Tente ajustar seus termos de busca ou crie uma nova fórmula personalizada.</p>
                  </div>
                ) : (
                  filteredTemplates.map((tmpl) => {
                    const isSelected = selectedTemplate?.id === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => {
                          soundFx.playClick();
                          setSelectedTemplate(tmpl);
                        }}
                        className={`p-4 rounded-3xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-purple-950/50 border-purple-400 ring-2 ring-purple-500/30 shadow-xl'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                {tmpl.category.replace('_', ' ')}
                              </span>
                              {tmpl.isOfficial && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Oficial LM
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-white leading-snug">
                              {tmpl.name}
                            </h4>
                          </div>

                          <span className="text-[11px] text-purple-300 font-semibold shrink-0 bg-white/5 px-2 py-1 rounded-lg">
                            {tmpl.ingredients.length} ativos
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 line-clamp-2">
                          {tmpl.description || tmpl.benefits}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-400" />
                            {tmpl.schedule.split('(')[0]}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApply(tmpl);
                            }}
                            className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center gap-1 text-xs shadow-sm"
                          >
                            <span>Prescrever</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Detailed Template Inspector */}
              <div className="lg:col-span-6 sticky top-0">
                {selectedTemplate ? (
                  <div className="p-5 rounded-3xl liquid-glass border border-purple-500/30 bg-purple-950/30 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-purple-500 text-slate-950">
                            {selectedTemplate.category}
                          </span>
                          <span className="text-xs text-slate-400">
                            Criado por: {selectedTemplate.createdBy || 'LM Team'}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-white mt-1">
                          {selectedTemplate.name}
                        </h4>
                      </div>

                      {!selectedTemplate.isOfficial && (
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            onDeleteTemplate(selectedTemplate.id);
                            setSelectedTemplate(null);
                          }}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 transition"
                          title="Excluir este modelo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-black/40 border border-white/5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Posologia
                        </span>
                        <span className="font-bold text-purple-200">
                          {selectedTemplate.dosage}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Horário
                        </span>
                        <span className="font-bold text-purple-200">
                          {selectedTemplate.schedule}
                        </span>
                      </div>
                    </div>

                    {/* Ingredients / Actives Breakdown */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-white flex items-center justify-between">
                        <span>Fórmula Farmacêutica ({selectedTemplate.ingredients.length} componentes):</span>
                      </span>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {selectedTemplate.ingredients.map((ing, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs text-slate-200"
                          >
                            <span className="font-semibold">{ing.split(':')[0]}</span>
                            <span className="text-purple-300 font-mono font-bold">
                              {ing.split(':')[1] || ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Indications */}
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1 text-xs text-slate-300">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        Indicação Clínica & Benefícios
                      </span>
                      <p>{selectedTemplate.benefits}</p>
                    </div>

                    {/* Doctor Notes */}
                    {selectedTemplate.doctorNotes && (
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-0.5">
                        <span className="font-bold flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-amber-400" />
                          Orientação Médica:
                        </span>
                        <p>{selectedTemplate.doctorNotes}</p>
                      </div>
                    )}

                    {/* Action Apply Button */}
                    <button
                      onClick={() => handleApply(selectedTemplate)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-xs font-black transition shadow-xl shadow-purple-950/70 border border-purple-400/40 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Prescrever esta Fórmula para {athleteName}</span>
                    </button>
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <Bookmark className="w-10 h-10 text-purple-400/40 mb-2" />
                    <p className="text-sm font-bold text-slate-300">Selecione uma fórmula ao lado</p>
                    <p className="text-xs max-w-xs mt-1">
                      Visualize a composição farmacotécnica completa, dosagens e aplique diretamente na ficha do aluno.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: CREATE NEW TEMPLATE */}
        {/* ======================================================== */}
        {viewMode === 'create_new' && (
          <form onSubmit={handleCreateNewTemplate} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
              <p className="text-xs text-purple-200">
                Criar uma fórmula pré-definida permite que você a reutilize rapidamente para múltiplos alunos sem precisar redigitar todos os princípios ativos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-300">Nome do Modelo de Fórmula *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Blend Termogênico Avançado LM"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Categoria</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as SupplementCategory)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                >
                  <option value="geral">Diários / Gerais</option>
                  <option value="intra_treino">Intra-Treino Ergogênico</option>
                  <option value="sono_relaxamento">Fórmula Sono & REM</option>
                  <option value="saude_cardiovascular">Cardiovascular & Hepático</option>
                  <option value="termogenico_energia">Termogênico & Foco</option>
                  <option value="articular_colageno">Articular & Tendíneo</option>
                  <option value="digestivo_intestinal">Digestivo & Microbiota</option>
                  <option value="manipulado">Manipulado Magistral</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Posologia Padrão *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 2 cápsulas ao dia ou 1 sachê em 200ml"
                  value={newDosage}
                  onChange={(e) => setNewDosage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Horário Sugerido</label>
                <input
                  type="text"
                  placeholder="Ex: 08:00 e 20:00 com as refeições"
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Descrição Rápida</label>
                <input
                  type="text"
                  placeholder="Ex: Blend antioxidante de suporte lipídico..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Actives Builder */}
            <div className="p-4 rounded-3xl bg-black/40 border border-purple-500/30 space-y-3">
              <span className="text-xs font-bold text-white flex items-center justify-between">
                <span>Princípios Ativos do Modelo:</span>
                <span className="text-purple-300">{componentsList.length} ativos adicionados</span>
              </span>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ativo (ex: Cafeína Anidra)"
                  value={activeInputName}
                  onChange={(e) => setActiveInputName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
                <input
                  type="text"
                  placeholder="Dose (ex: 200mg)"
                  value={activeInputAmount}
                  onChange={(e) => setActiveInputAmount(e.target.value)}
                  className="w-28 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={handleAddActiveToNew}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Inserir</span>
                </button>
              </div>

              {componentsList.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {componentsList.map((c, i) => (
                    <div
                      key={c.id || i}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-white"
                    >
                      <span className="font-semibold">{c.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-300 font-mono">{c.amount}</span>
                        <button
                          type="button"
                          onClick={() => setComponentsList((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Indicação Clínica & Benefícios</label>
              <textarea
                rows={2}
                placeholder="Ex: Aceleração da termogênese e aumento da taxa de lipólise..."
                value={newBenefits}
                onChange={(e) => setNewBenefits(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('library')}
                className="px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
              >
                Voltar à Biblioteca
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition shadow-lg flex items-center gap-2"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>Salvar Modelo na Biblioteca</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
