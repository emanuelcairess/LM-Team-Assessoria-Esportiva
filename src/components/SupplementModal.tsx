import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Pill,
  Sparkles,
  Plus,
  Trash2,
  Clock,
  FileCheck,
  Info,
  Layers,
  HeartPulse,
  Moon,
  Zap,
  Flame,
  ShieldAlert,
  BookmarkPlus,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { SupplementItem, SupplementCategory, FormulaComponent } from '../types';
import { soundFx } from '../utils/audio';

interface SupplementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplement: SupplementItem, saveAsTemplate?: boolean) => void;
  supplementToEdit?: SupplementItem | null;
  prescriberName?: string;
}

const CATEGORY_OPTIONS: { id: SupplementCategory; label: string; icon: string; desc: string }[] = [
  { id: 'geral', label: 'Diários / Gerais', icon: '💊', desc: 'Suplementação básica e diária (Creatina, Ômega 3, Vitaminas)' },
  { id: 'intra_treino', label: 'Intra-Treino Ergogênico', icon: '⚡', desc: 'Soluções de vasodilatação, tamponamento e aminoácidos' },
  { id: 'sono_relaxamento', label: 'Fórmula Sono & REM', icon: '🌙', desc: 'Modulação de neurotransmissores e relaxamento neural' },
  { id: 'saude_cardiovascular', label: 'Cardiovascular & Hepático', icon: '❤️', desc: 'Proteção mitocondrial, endotelial e enzimas hepáticas' },
  { id: 'termogenico_energia', label: 'Termogênico & Foco', icon: '🔥', desc: 'Aceleração metabólica, queima oxidativa e foco dopaminérgico' },
  { id: 'articular_colageno', label: 'Articular & Tendíneo', icon: '🦴', desc: 'Proteção de cartilagens, tendões e regeneração tecidual' },
  { id: 'digestivo_intestinal', label: 'Digestivo & Microbiota', icon: '🍃', desc: 'Enzimas digestivas, probióticos e integridade da mucosa' },
  { id: 'manipulado', label: 'Manipulado Magistral', icon: '🧪', desc: 'Fórmulas personalizadas de alta precisão farmacotécnica' }
];

const POPULAR_ACTIVES_SUGGESTIONS = [
  { name: 'Beta-Alanina', defaultDose: '3.200mg' },
  { name: 'Creatina Creapure', defaultDose: '10g' },
  { name: 'N-Acetilcisteína (NAC)', defaultDose: '600mg' },
  { name: 'Coenzima Q10 (Ubiquinona)', defaultDose: '100mg' },
  { name: 'L-Arginina AAKG', defaultDose: '3.000mg' },
  { name: 'Melatonina Microencapsulada', defaultDose: '0.5mg' },
  { name: 'GABA (Ácido Gama-Aminobutírico)', defaultDose: '500mg' },
  { name: 'Ashwagandha KSM-66', defaultDose: '400mg' },
  { name: '5-HTP (5-Hidroxitriptofano)', defaultDose: '100mg' },
  { name: 'Bisglicinato de Magnésio', defaultDose: '350mg' },
  { name: 'L-Glicina Grau Farmacêutico', defaultDose: '3.000mg' },
  { name: 'Citrus Bergamot Extrato', defaultDose: '500mg' },
  { name: 'Vitamina D3 + K2 MK-7', defaultDose: '5.000 UI + 120mcg' },
  { name: 'Curcumina C3 95% + Piperina', defaultDose: '250mg' },
  { name: 'Colágeno Não Desnaturado Tipo II', defaultDose: '40mg' },
  { name: 'Metilsulfonilmetano (MSM)', defaultDose: '1.000mg' },
  { name: 'Enzimas DigeZyme', defaultDose: '150mg' },
  { name: 'L-Glutamina Fermentada', defaultDose: '5.000mg' }
];

export const SupplementModal: React.FC<SupplementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  supplementToEdit,
  prescriberName = 'Dr. Rodrigo Albuquerque'
}) => {
  const isEditing = Boolean(supplementToEdit);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<SupplementCategory>('geral');
  const [dosage, setDosage] = useState('');
  const [schedule, setSchedule] = useState('');
  const [benefits, setBenefits] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  // Components / Formula Ingredients
  const [componentsList, setComponentsList] = useState<FormulaComponent[]>([]);
  const [newComponentName, setNewComponentName] = useState('');
  const [newComponentAmount, setNewComponentAmount] = useState('');
  const [newComponentPurpose, setNewComponentPurpose] = useState('');
  const [isAddingActiveOpen, setIsAddingActiveOpen] = useState(false);

  // Populate on open / edit
  useEffect(() => {
    if (supplementToEdit) {
      setName(supplementToEdit.name || '');
      setCategory(supplementToEdit.category || 'geral');
      setDosage(supplementToEdit.dosage || '');
      setSchedule(supplementToEdit.schedule || '');
      setBenefits(supplementToEdit.benefits || '');
      setDoctorNotes(supplementToEdit.doctorNotes || '');
      setSaveAsTemplate(false);

      if (supplementToEdit.components && supplementToEdit.components.length > 0) {
        setComponentsList(supplementToEdit.components);
      } else if (supplementToEdit.ingredients && supplementToEdit.ingredients.length > 0) {
        // Parse string array into structured components
        const parsed = supplementToEdit.ingredients.map((ing, idx) => {
          const parts = ing.split(':');
          if (parts.length >= 2) {
            return {
              id: `comp-${idx}-${Date.now()}`,
              name: parts[0].trim(),
              amount: parts.slice(1).join(':').trim(),
              purpose: ''
            };
          }
          return {
            id: `comp-${idx}-${Date.now()}`,
            name: ing.trim(),
            amount: '',
            purpose: ''
          };
        });
        setComponentsList(parsed);
      } else {
        setComponentsList([]);
      }
    } else {
      setName('');
      setCategory('geral');
      setDosage('');
      setSchedule('08:00 (Junto à Refeição 1)');
      setBenefits('');
      setDoctorNotes('');
      setComponentsList([]);
      setSaveAsTemplate(false);
    }
  }, [supplementToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddComponent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newComponentName.trim()) return;

    soundFx.playClick();
    const newComp: FormulaComponent = {
      id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newComponentName.trim(),
      amount: newComponentAmount.trim(),
      purpose: newComponentPurpose.trim()
    };

    setComponentsList((prev) => [...prev, newComp]);
    setNewComponentName('');
    setNewComponentAmount('');
    setNewComponentPurpose('');
  };

  const handleAddQuickActive = (active: { name: string; defaultDose: string }) => {
    soundFx.playClick();
    const exists = componentsList.some(
      (c) => c.name.toLowerCase() === active.name.toLowerCase()
    );
    if (exists) return;

    const newComp: FormulaComponent = {
      id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: active.name,
      amount: active.defaultDose,
      purpose: ''
    };
    setComponentsList((prev) => [...prev, newComp]);
  };

  const handleRemoveComponent = (id: string) => {
    soundFx.playClick();
    setComponentsList((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateComponent = (id: string, field: keyof FormulaComponent, value: string) => {
    setComponentsList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) return;

    soundFx.playRestComplete();

    // Convert components to standard ingredients string representation
    const ingredientsArray = componentsList.map((c) =>
      c.amount ? `${c.name}: ${c.amount}` : c.name
    );

    const updatedItem: SupplementItem = {
      id: supplementToEdit?.id || `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      category,
      dosage: dosage.trim(),
      schedule: schedule.trim() || 'Conforme orientação médica',
      benefits: benefits.trim() || 'Otimização fisiológica e suporte ao desempenho físico e recuperação.',
      doctorNotes: doctorNotes.trim(),
      ingredients: ingredientsArray,
      components: componentsList,
      isTakenToday: supplementToEdit?.isTakenToday ?? false,
      prescribedBy: supplementToEdit?.prescribedBy || prescriberName,
      updatedAt: new Date().toISOString(),
      createdAt: supplementToEdit?.createdAt || new Date().toISOString()
    };

    onSave(updatedItem, saveAsTemplate);
    onClose();
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

      {/* Modal Container (#4A148C Deep Royal Purple Liquid Glass Theme) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-3xl my-8 rounded-3xl liquid-glass border border-purple-500/30 bg-slate-950/95 shadow-2xl shadow-purple-950/80 overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Top Header Bar */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-indigo-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center shadow-lg shadow-purple-900/40">
              <Pill className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500 text-slate-950">
                  Prescrição Magistral
                </span>
                <span className="text-xs text-purple-300 font-semibold">
                  {isEditing ? 'Edição de Protocolo' : 'Nova Fórmula / Suplemento'}
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
                {isEditing ? `Alterar ${supplementToEdit?.name}` : 'Cadastrar Protocolo de Suplementação'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-purple-400" />
                <span>Nome da Fórmula ou Suplemento *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Cocktail Intra-Treino High-Performance ou Creatina Creapure"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400 transition"
              />
            </div>

            {/* Category Selector */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Categoria do Protocolo</span>
                </span>
                <span className="text-[10px] text-purple-300 font-normal">Selecione o grupo funcional</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => {
                        soundFx.playClick();
                        setCategory(cat.id);
                      }}
                      className={`p-3 rounded-2xl text-left border transition flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-300 ring-2 ring-purple-500/40 shadow-lg'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-xs font-black leading-tight">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dosage */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Posologia / Dosagem *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 10g ao dia ou 2 cápsulas ou 1 sachê em 200ml"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400 transition"
              />
            </div>

            {/* Schedule */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Horário / Momento de Ingestão</span>
              </label>
              <input
                type="text"
                placeholder="Ex: 07:30 (Café da manhã) ou 22:30 (30 min antes de deitar)"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400 transition"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* FORMULA COMPONENTS / ACTIVE INGREDIENTS BUILDER */}
          {/* ======================================================== */}
          <div className="p-5 rounded-3xl liquid-glass border border-purple-500/30 bg-purple-950/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Fórmula Farmacêutica
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {componentsList.length} princípio(s) ativo(s)
                  </span>
                </div>
                <h4 className="text-sm font-black text-white mt-0.5">
                  Composição & Princípios Ativos da Fórmula
                </h4>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsAddingActiveOpen(!isAddingActiveOpen);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Ativo</span>
              </button>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Sugestões Rápidas de Ativos (Clique para Inserir):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar p-1">
                {POPULAR_ACTIVES_SUGGESTIONS.map((sug) => {
                  const isAlreadyAdded = componentsList.some(
                    (c) => c.name.toLowerCase() === sug.name.toLowerCase()
                  );
                  return (
                    <button
                      type="button"
                      key={sug.name}
                      disabled={isAlreadyAdded}
                      onClick={() => handleAddQuickActive(sug)}
                      className={`text-[11px] px-2.5 py-1 rounded-xl transition flex items-center gap-1 border ${
                        isAlreadyAdded
                          ? 'bg-white/5 text-slate-500 border-white/5 opacity-50 cursor-not-allowed'
                          : 'bg-white/10 hover:bg-purple-600/30 text-purple-200 border-white/10 hover:border-purple-400/40'
                      }`}
                    >
                      <span>{sug.name}</span>
                      <span className="text-[9px] text-purple-300 font-mono">({sug.defaultDose})</span>
                      {isAlreadyAdded ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Plus className="w-2.5 h-2.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inline Add Component Panel */}
            <AnimatePresence>
              {isAddingActiveOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/40 space-y-3"
                >
                  <p className="text-xs font-bold text-purple-300">Novo Princípio Ativo Personalizado:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nome do Ativo (ex: L-Tirosina)"
                      value={newComponentName}
                      onChange={(e) => setNewComponentName(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                    <input
                      type="text"
                      placeholder="Concentração / Dose (ex: 1.000mg)"
                      value={newComponentAmount}
                      onChange={(e) => setNewComponentAmount(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Mecanismo (opcional)"
                        value={newComponentPurpose}
                        onChange={(e) => setNewComponentPurpose(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddComponent}
                        disabled={!newComponentName.trim()}
                        className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Components List */}
            {componentsList.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-slate-400">
                Nenhum princípio ativo detalhado ainda. Use as sugestões rápidas acima ou adicione componentes manualmente para enriquecer a fórmula magistral.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {componentsList.map((comp, idx) => (
                  <div
                    key={comp.id || idx}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-purple-500/30 transition"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={comp.name}
                        onChange={(e) => handleUpdateComponent(comp.id, 'name', e.target.value)}
                        placeholder="Nome do ativo"
                        className="bg-transparent text-xs font-bold text-white focus:outline-none focus:bg-white/10 px-2 py-1 rounded-lg flex-1 min-w-[120px]"
                      />
                    </div>

                    <div className="flex items-center gap-2 justify-between sm:justify-end">
                      <input
                        type="text"
                        value={comp.amount}
                        onChange={(e) => handleUpdateComponent(comp.id, 'amount', e.target.value)}
                        placeholder="Dose (ex: 500mg)"
                        className="bg-purple-950/40 border border-purple-500/30 text-xs font-mono text-purple-200 px-2.5 py-1 rounded-lg w-28 text-center focus:outline-none focus:border-purple-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(comp.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 transition"
                        title="Excluir ativo da fórmula"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Benefits / Pharmacological Indication */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Indicação Farmacológica & Benefícios Clínicos</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Tamponamento da acidose lútea, vasodilatação endotelial, modulação de cortisol sérico e recuperação neuromuscular."
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400 transition"
            />
          </div>

          {/* Doctor / Clinical Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-purple-400" />
              <span>Orientações Médicas & Advertências de Uso</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Tomar com estômago cheio. Evitar consumo com bebidas alcoólicas. Reavaliação em 60 dias."
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-400 transition"
            />
          </div>

          {/* Save as Template Option */}
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3">
            <input
              type="checkbox"
              id="saveAsTemplate"
              checked={saveAsTemplate}
              onChange={(e) => {
                soundFx.playClick();
                setSaveAsTemplate(e.target.checked);
              }}
              className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-white/20 accent-purple-500"
            />
            <label htmlFor="saveAsTemplate" className="text-xs cursor-pointer select-none space-y-0.5">
              <span className="font-bold text-purple-200 flex items-center gap-1.5">
                <BookmarkPlus className="w-3.5 h-3.5 text-purple-400" />
                Salvar também na Biblioteca de Fórmulas Pré-definidas
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Esta fórmula ficará disponível para ser reutilizada e prescrita para outros alunos da assessoria com 1 clique.
              </p>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition border border-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-xs font-black transition shadow-xl shadow-purple-950/70 border border-purple-400/40 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Salvar Alterações da Fórmula' : 'Prescrever Fórmula / Suplemento'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
