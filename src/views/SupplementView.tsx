import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Pill,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Shield,
  Moon,
  Zap,
  HeartPulse,
  BellRing,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Plus,
  Edit,
  Trash2,
  BookmarkPlus,
  Bookmark,
  Layers,
  Flame,
  ShieldCheck,
  Search,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SupplementItem, SupplementFormulaTemplate, SupplementCategory } from '../types';
import { soundFx } from '../utils/audio';
import { SupplementModal } from '../components/SupplementModal';
import { FormulaTemplateModal } from '../components/FormulaTemplateModal';
import { DeleteSupplementModal } from '../components/DeleteSupplementModal';

interface SupplementViewProps {
  supplements: SupplementItem[];
  onToggleSupplementTaken: (supplementId: string) => void;
  onSimulateAlarm: (title: string, message: string) => void;
  canManageSupplements?: boolean;
  onAddSupplement?: (newSup: SupplementItem, saveAsTemplate?: boolean) => void;
  onUpdateSupplement?: (updatedSup: SupplementItem, saveAsTemplate?: boolean) => void;
  onDeleteSupplement?: (supplementId: string) => void;
  formulaTemplates?: SupplementFormulaTemplate[];
  onApplyFormulaTemplate?: (template: SupplementFormulaTemplate) => void;
  onSaveFormulaTemplate?: (template: SupplementFormulaTemplate) => void;
  onDeleteFormulaTemplate?: (templateId: string) => void;
  athleteName?: string;
  prescriberName?: string;
}

export const SupplementView: React.FC<SupplementViewProps> = ({
  supplements,
  onToggleSupplementTaken,
  onSimulateAlarm,
  canManageSupplements = true,
  onAddSupplement,
  onUpdateSupplement,
  onDeleteSupplement,
  formulaTemplates = [],
  onApplyFormulaTemplate,
  onSaveFormulaTemplate,
  onDeleteFormulaTemplate,
  athleteName = 'Atleta',
  prescriberName = 'Prescritor Técnico'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(supplements[0]?.id || null);

  // Modals state
  const [isSupplementModalOpen, setIsSupplementModalOpen] = useState(false);
  const [supplementToEdit, setSupplementToEdit] = useState<SupplementItem | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [supplementToDelete, setSupplementToDelete] = useState<SupplementItem | null>(null);

  const categories = [
    { id: 'todos', label: 'Todos os Protocolos', icon: '✨' },
    { id: 'intra_treino', label: 'Intra-Treino', icon: '⚡' },
    { id: 'sono_relaxamento', label: 'Sono & REM', icon: '🌙' },
    { id: 'saude_cardiovascular', label: 'Cardio & Hepático', icon: '❤️' },
    { id: 'termogenico_energia', label: 'Termogênicos', icon: '🔥' },
    { id: 'articular_colageno', label: 'Articular', icon: '🦴' },
    { id: 'digestivo_intestinal', label: 'Digestivo', icon: '🍃' },
    { id: 'geral', label: 'Diários & Gerais', icon: '💊' },
    { id: 'manipulado', label: 'Manipulados', icon: '🧪' }
  ];

  const filteredSupplements = supplements.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.dosage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.benefits.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.ingredients || []).some((ing) => ing.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedCategory === 'todos') return true;
    return s.category === selectedCategory;
  });

  const takenCount = supplements.filter((s) => s.isTakenToday).length;

  const handleToggle = (sup: SupplementItem) => {
    soundFx.playClick();
    if (!sup.isTakenToday) {
      confetti({
        particleCount: 45,
        spread: 55,
        origin: { y: 0.8 },
        colors: ['#4A148C', '#9333ea', '#c084fc', '#e879f9', '#ffffff']
      });
    }
    onToggleSupplementTaken(sup.id);
  };

  const handleOpenAddModal = () => {
    soundFx.playClick();
    setSupplementToEdit(null);
    setIsSupplementModalOpen(true);
  };

  const handleOpenEditModal = (sup: SupplementItem, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick();
    setSupplementToEdit(sup);
    setIsSupplementModalOpen(true);
  };

  const handleOpenDeleteModal = (sup: SupplementItem, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick();
    setSupplementToDelete(sup);
  };

  const handleSaveSupplement = (savedSup: SupplementItem, saveAsTemplateFlag?: boolean) => {
    if (supplementToEdit) {
      onUpdateSupplement?.(savedSup, saveAsTemplateFlag);
    } else {
      onAddSupplement?.(savedSup, saveAsTemplateFlag);
    }
  };

  const handleConfirmDelete = () => {
    if (supplementToDelete) {
      onDeleteSupplement?.(supplementToDelete.id);
      setSupplementToDelete(null);
    }
  };

  const handleQuickSaveAsTemplate = (sup: SupplementItem, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playRestComplete();
    const newTemplate: SupplementFormulaTemplate = {
      id: `tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `Modelo: ${sup.name}`,
      description: sup.benefits,
      category: sup.category,
      dosage: sup.dosage,
      schedule: sup.schedule,
      benefits: sup.benefits,
      ingredients: sup.ingredients || [],
      components: sup.components,
      doctorNotes: sup.doctorNotes,
      isOfficial: false,
      createdBy: prescriberName,
      createdAt: new Date().toISOString().split('T')[0]
    };
    onSaveFormulaTemplate?.(newTemplate);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'intra_treino':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'sono_relaxamento':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      case 'saude_cardiovascular':
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case 'termogenico_energia':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'articular_colageno':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'digestivo_intestinal':
        return <Layers className="w-4 h-4 text-teal-400" />;
      default:
        return <Pill className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* ======================================================== */}
      {/* HERO BANNER (#4A148C Deep Royal Purple & Liquid Glass) */}
      {/* ======================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl liquid-glass hero-supplements p-6 sm:p-7 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-sm">
                Prescrição Médica & Magistral
              </span>
              <span className="text-xs text-purple-300 font-semibold">
                Fórmulas, Fitoterápicos & Manipulados
              </span>
              {athleteName && (
                <span className="text-xs text-slate-300">
                  • Aluno: <strong className="text-white">{athleteName}</strong>
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Protocolos de Suplementação & Longevidade
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Fórmulas farmacêuticas personalizadas para proteção de órgãos nobres, vasodilatação periférica endotelial e modulação neuroquímica do sono REM.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Taken counter pill */}
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="text-center px-2">
                <p className="text-[9px] uppercase font-black tracking-wider text-slate-400">Tomados Hoje</p>
                <p className="text-2xl font-black text-purple-400">{takenCount} / {supplements.length}</p>
              </div>
              <div className="w-px h-9 bg-white/10" />
              <button
                onClick={() => {
                  soundFx.playClick();
                  onSimulateAlarm(
                    'Lembrete LM Team: Protocolo de Manipulados',
                    'Horário de ingerir suas fórmulas ergogênicas e protetores celulares prescritos.'
                  );
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-bold border border-purple-400/30 transition shadow-sm"
              >
                <BellRing className="w-3.5 h-3.5 text-purple-300" />
                <span>Testar Alarme</span>
              </button>
            </div>

            {/* Prescriber & Admin Action Controls */}
            {canManageSupplements && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setIsTemplateModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-purple-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-purple-400/30 shadow-md backdrop-blur-xs"
                >
                  <Bookmark className="w-3.5 h-3.5 text-purple-300" />
                  <span>Modelos de Fórmulas</span>
                </button>

                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-xs font-black shadow-xl shadow-purple-950/60 transition flex items-center gap-1.5 border border-purple-400/40"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Nova Fórmula</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* SEARCH AND CATEGORY FILTER BAR */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 w-full md:w-80">
          <Search className="w-4 h-4 text-purple-400 ml-2 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por fórmula ou ativo (ex: Beta-Alanina)..."
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

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedCategory(cat.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-950/50'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* PROTOCOLS LIST */}
      {/* ======================================================== */}
      {filteredSupplements.length === 0 ? (
        <div className="p-12 rounded-3xl liquid-glass border border-dashed border-white/15 text-center text-slate-400 space-y-3">
          <Pill className="w-12 h-12 text-purple-400/40 mx-auto" />
          <h3 className="text-base font-bold text-white">Nenhum protocolo encontrado</h3>
          <p className="text-xs max-w-md mx-auto text-slate-400">
            Não foram encontradas fórmulas de suplementação para o filtro selecionado. Use o botão "+ Nova Fórmula" ou aplique um modelo pré-definido da biblioteca.
          </p>
          {canManageSupplements && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-purple-200 text-xs font-bold transition flex items-center gap-1.5 border border-purple-400/30"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Abrir Biblioteca de Modelos</span>
              </button>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Prescrever Nova Fórmula</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSupplements.map((sup, index) => {
            const isExpanded = expandedId === sup.id;

            return (
              <motion.div
                key={sup.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`rounded-3xl liquid-glass border transition-all duration-200 overflow-hidden ${
                  sup.isTakenToday
                    ? 'border-purple-500/40 bg-purple-950/20 shadow-lg'
                    : 'border-white/10 hover:border-purple-500/30 bg-slate-900/40'
                }`}
              >
                {/* Header Card */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : sup.id)}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    {/* Checkbox toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(sup);
                      }}
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all mt-0.5 sm:mt-0 shrink-0 ${
                        sup.isTakenToday
                          ? 'bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/30'
                          : 'bg-white/5 hover:bg-white/15 text-slate-400 border border-white/10'
                      }`}
                      title={sup.isTakenToday ? 'Desmarcar check-in' : 'Marcar como tomado'}
                    >
                      {sup.isTakenToday ? (
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="p-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1 text-[11px] font-bold text-slate-300">
                          {getCategoryIcon(sup.category)}
                          <span className="capitalize">{sup.category.replace('_', ' ')}</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs text-purple-300 font-semibold">
                          <Clock className="w-3.5 h-3.5" /> {sup.schedule}
                        </span>
                        {sup.isTakenToday && (
                          <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                            ✓ Tomado Hoje
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-white mt-1 truncate">
                        {sup.name}
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Posologia: <strong className="text-purple-200">{sup.dosage}</strong>
                        {sup.ingredients && sup.ingredients.length > 0 && (
                          <span className="text-slate-400 ml-2">
                            • {sup.ingredients.length} componentes magistrais
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    {/* Prescriber & Admin Action Tools */}
                    {canManageSupplements && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleQuickSaveAsTemplate(sup, e)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-purple-600/30 text-purple-300 border border-white/10 hover:border-purple-400/40 transition"
                          title="Salvar como Modelo Pré-definido na Biblioteca"
                        >
                          <BookmarkPlus className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => handleOpenEditModal(sup, e)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 transition"
                          title="Editar Fórmula / Componentes"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => handleOpenDeleteModal(sup, e)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 transition"
                          title="Excluir Fórmula"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Alarm notification test */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFx.playClick();
                        onSimulateAlarm(
                          `Lembrete LM Team: ${sup.name}`,
                          `Horário prescrito: ${sup.schedule}. Posologia: ${sup.dosage}`
                        );
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 transition"
                      title="Configurar Notificação / Testar Alarme"
                    >
                      <BellRing className="w-4 h-4 text-purple-300" />
                    </button>

                    <button className="p-1 text-slate-400 hover:text-white transition">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Protocol Detailed Formulation & Benefits */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10 px-5 sm:px-6 py-5 bg-black/30 space-y-4"
                    >
                      {/* Pharmacological Indication */}
                      <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/25 text-xs">
                        <p className="text-purple-300 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          Indicação & Mecanismo Farmacológico:
                        </p>
                        <p className="text-slate-200 leading-relaxed">{sup.benefits}</p>
                      </div>

                      {/* Formula Actives Grid */}
                      {sup.ingredients && sup.ingredients.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs uppercase font-extrabold text-slate-300 tracking-wider flex items-center gap-1.5">
                              <FileCheck className="w-4 h-4 text-purple-400" />
                              Composição & Princípios Ativos ({sup.ingredients.length}):
                            </p>
                            {canManageSupplements && (
                              <button
                                onClick={(e) => handleOpenEditModal(sup, e)}
                                className="text-[11px] text-purple-300 hover:text-purple-200 font-bold flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Editar componentes</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {sup.ingredients.map((ing, i) => {
                              const parts = ing.split(':');
                              const activeName = parts[0]?.trim();
                              const dose = parts.slice(1).join(':')?.trim();

                              return (
                                <div
                                  key={i}
                                  className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs flex items-center justify-between gap-2 hover:border-purple-500/30 transition"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                    <span className="font-semibold text-white truncate">{activeName}</span>
                                  </div>
                                  {dose && (
                                    <span className="text-purple-300 font-mono font-bold text-[11px] shrink-0 bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-500/30">
                                      {dose}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Doctor Clinical Notes */}
                      {sup.doctorNotes && (
                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white block mb-0.5">Orientações Médicas / Clínicas:</span>
                            <span className="text-slate-300">{sup.doctorNotes}</span>
                          </div>
                        </div>
                      )}

                      {/* Prescriber Stamp */}
                      {sup.prescribedBy && (
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                          <span>Prescrito por: <strong className="text-purple-300">{sup.prescribedBy}</strong></span>
                          <span>LM Team Medical Intelligence</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isSupplementModalOpen && (
          <SupplementModal
            isOpen={isSupplementModalOpen}
            onClose={() => {
              setIsSupplementModalOpen(false);
              setSupplementToEdit(null);
            }}
            onSave={handleSaveSupplement}
            supplementToEdit={supplementToEdit}
            prescriberName={prescriberName}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTemplateModalOpen && (
          <FormulaTemplateModal
            isOpen={isTemplateModalOpen}
            onClose={() => setIsTemplateModalOpen(false)}
            templates={formulaTemplates}
            onApplyTemplate={(tmpl) => onApplyFormulaTemplate?.(tmpl)}
            onSaveTemplate={(tmpl) => onSaveFormulaTemplate?.(tmpl)}
            onDeleteTemplate={(tmplId) => onDeleteFormulaTemplate?.(tmplId)}
            activeSupplement={supplementToEdit}
            athleteName={athleteName}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {supplementToDelete && (
          <DeleteSupplementModal
            isOpen={Boolean(supplementToDelete)}
            onClose={() => setSupplementToDelete(null)}
            onConfirm={handleConfirmDelete}
            supplement={supplementToDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
