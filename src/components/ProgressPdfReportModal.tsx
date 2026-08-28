import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Printer,
  Download,
  X,
  Award,
  Activity,
  Heart,
  ShieldCheck,
  Calendar,
  Camera,
  TrendingUp,
  TrendingDown,
  Scale,
  Sparkles,
  CheckCircle2,
  Share2,
  FileText,
  User,
  Sliders,
  Check
} from 'lucide-react';
import { AthleteProfile, AnthropometricData } from '../types';
import { soundFx } from '../utils/audio';

interface ProgressPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: AthleteProfile;
}

export const ProgressPdfReportModal: React.FC<ProgressPdfReportModalProps> = ({
  isOpen,
  onClose,
  athlete
}) => {
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [includePerimetry, setIncludePerimetry] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [reportPeriod, setReportPeriod] = useState<'all' | 'first_last'>('all');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  if (!isOpen) return null;

  const rawHistory = athlete.measurementsHistory || [];
  
  const defaultMeasurement: AnthropometricData = {
    date: new Date().toISOString().split('T')[0],
    weightKg: athlete.currentWeightKg || 70,
    heightCm: athlete.heightCm || 175,
    bodyFatPercentage: 12,
    muscleMassKg: 35,
    chestCm: 100,
    shouldersCm: 115,
    waistCm: 80,
    abdomenCm: 82,
    rightArmCm: 38,
    leftArmCm: 38,
    rightThighCm: 58,
    leftThighCm: 58,
    calvesCm: 38,
    glutesCm: 98,
    neckCm: 38,
    notes: 'Avaliação física inicial'
  };

  const history: AnthropometricData[] = rawHistory.length > 0 ? rawHistory : [defaultMeasurement];
  const initialData = history[0];
  const latestData = history[history.length - 1];

  const displayedHistory = reportPeriod === 'first_last' && history.length > 2
    ? [initialData, latestData]
    : history;

  // Key Deltas
  const totalWeightDelta = Number((latestData.weightKg - initialData.weightKg).toFixed(1));
  const totalFatDelta = Number((latestData.bodyFatPercentage - initialData.bodyFatPercentage).toFixed(1));
  const totalMuscleDelta = Number((latestData.muscleMassKg - initialData.muscleMassKg).toFixed(1));
  const totalWaistDelta = Number((latestData.waistCm - initialData.waistCm).toFixed(1));
  const totalArmDelta = Number((latestData.rightArmCm - initialData.rightArmCm).toFixed(1));
  const totalChestDelta = Number((latestData.chestCm - initialData.chestCm).toFixed(1));

  // BMI calculations
  const bmi = (latestData.weightKg / Math.pow(latestData.heightCm / 100, 2)).toFixed(1);
  const bmiNumber = parseFloat(bmi);
  let bmiClassification = 'Eutrofia / Densidade Atlética';
  if (bmiNumber < 18.5) bmiClassification = 'Abaixo do peso';
  else if (bmiNumber >= 25 && bmiNumber < 30) bmiClassification = 'Sobrepeso funcional (Hipertrofia)';
  else if (bmiNumber >= 30) bmiClassification = 'Alto volume de massa magra muscular';

  // Evolution photos collection (Fallback with clean fitness stock photos if not provided)
  const defaultPhotos = {
    front: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=700&auto=format&fit=crop&q=80',
    back: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=700&auto=format&fit=crop&q=80',
    side: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=700&auto=format&fit=crop&q=80'
  };

  const handlePrint = () => {
    soundFx.playClick();
    window.print();
  };

  const handleCopySummary = () => {
    soundFx.playClick();
    const summaryText = `*RELATÓRIO DE EVOLUÇÃO LM TEAM*\n` +
      `Atleta: ${athlete.name}\n` +
      `Categoria: ${athlete.category} | Objetivo: ${athlete.goal}\n` +
      `Período: ${new Date(initialData.date).toLocaleDateString('pt-BR')} a ${new Date(latestData.date).toLocaleDateString('pt-BR')}\n` +
      `-----------------------------\n` +
      `• Peso Inicial: ${initialData.weightKg} kg ➔ Atual: ${latestData.weightKg} kg (${totalWeightDelta >= 0 ? '+' : ''}${totalWeightDelta} kg)\n` +
      `• % Gordura: ${initialData.bodyFatPercentage}% ➔ ${latestData.bodyFatPercentage}% (${totalFatDelta}%)\n` +
      `• Massa Magra: ${initialData.muscleMassKg} kg ➔ ${latestData.muscleMassKg} kg (+${totalMuscleDelta} kg)\n` +
      `• Cintura: ${initialData.waistCm} cm ➔ ${latestData.waistCm} cm (${totalWaistDelta} cm)\n` +
      `• Braço D: ${initialData.rightArmCm} cm ➔ ${latestData.rightArmCm} cm (+${totalArmDelta} cm)\n` +
      `• Taxa de Adesão: ${athlete.adherencePercentage}%\n` +
      `-----------------------------\n` +
      `Head Coach: ${athlete.coachName}\n` +
      `Nutricionista: ${athlete.nutritionistName}\n` +
      `Médico: ${athlete.doctorName}`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-5xl rounded-[32px] modal-liquid-glass border border-white/20 p-5 sm:p-8 shadow-2xl my-6 overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Top Control Bar (Hidden when printing) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10 shrink-0 no-print">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-600 text-white">
                    Laudo PDF
                  </span>
                  <span className="text-xs text-orange-300 font-semibold">Histórico de Peso & Fotos de Evolução</span>
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  Relatório Completo de Progressão Física
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Copy Summary */}
              <button
                type="button"
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition border border-white/10"
                title="Copiar resumo textual para WhatsApp"
              >
                {copiedSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-cyan-400" />}
                <span>{copiedSummary ? 'Copiado!' : 'Copiar Resumo'}</span>
              </button>

              {/* Print / Save PDF */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black shadow-lg shadow-orange-950/40 transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Salvar PDF</span>
              </button>

              {/* Close Modal */}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition border border-transparent hover:border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Configuration / Options Strip (Hidden when printing) */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-2xl bg-white/5 border border-white/10 my-3 text-xs shrink-0 no-print">
            <div className="flex items-center gap-2 text-slate-300 font-bold">
              <Sliders className="w-4 h-4 text-orange-400" />
              <span>Opções do Laudo:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Period Selector */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setReportPeriod('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    reportPeriod === 'all' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todas as Avaliações ({history.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportPeriod('first_last')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    reportPeriod === 'first_last' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Início vs Atual (Comparativo)
                </button>
              </div>

              {/* Toggles */}
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={includePhotos}
                  onChange={(e) => setIncludePhotos(e.target.checked)}
                  className="rounded border-white/20 text-orange-600 focus:ring-0"
                />
                <span>Fotos de Evolução</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={includePerimetry}
                  onChange={(e) => setIncludePerimetry(e.target.checked)}
                  className="rounded border-white/20 text-orange-600 focus:ring-0"
                />
                <span>Perimetria</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="rounded border-white/20 text-orange-600 focus:ring-0"
                />
                <span>Parecer Clínico</span>
              </label>
            </div>
          </div>

          {/* ======================================================== */}
          {/* PRINTABLE / SCROLLABLE REPORT CONTENT                    */}
          {/* ======================================================== */}
          <div
            id="printable-progress-report"
            className="flex-1 overflow-y-auto pr-1 space-y-6 text-slate-100 font-sans print:overflow-visible print:p-0"
          >
            {/* Header Document */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/15 shadow-xl relative overflow-hidden print:bg-white print:text-black print:border-slate-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-600 to-yellow-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0 print:bg-orange-600">
                    LM
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white print:text-black">
                      LM TEAM ASSESSORIA ESPORTIVA
                    </h2>
                    <p className="text-xs text-orange-400 font-bold uppercase tracking-wider print:text-orange-600">
                      Laudo Longitudinal de Evolução Corporal & Registro Fotográfico
                    </p>
                    <p className="text-[11px] text-slate-400 print:text-slate-600">
                      Emissão: {new Date().toLocaleDateString('pt-BR')} • Prontuário Oficial: #{athlete.id.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 print:bg-emerald-100 print:text-emerald-800 print:border-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5" /> Protocolo Aprovado
                  </span>
                  <span className="text-[10px] text-slate-400 print:text-slate-600">
                    Período: {new Date(initialData.date).toLocaleDateString('pt-BR')} a {new Date(latestData.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Athlete Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-xs print:border-slate-300 print:text-black">
                <div className="p-2.5 rounded-xl bg-white/5 print:bg-slate-50 border border-white/5 print:border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">Atleta / Aluno</p>
                  <p className="text-sm font-bold text-white print:text-black">{athlete.name}</p>
                  <p className="text-[10px] text-orange-400 font-mono print:text-orange-700">CPF: {athlete.cpf || '123.456.789-00'}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 print:bg-slate-50 border border-white/5 print:border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">Idade / Categoria</p>
                  <p className="text-sm font-bold text-white print:text-black">{athlete.age} anos • {athlete.category}</p>
                  <p className="text-[10px] text-slate-400 print:text-slate-600">Estatura: {latestData.heightCm} cm</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 print:bg-slate-50 border border-white/5 print:border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">Objetivo / Status</p>
                  <p className="text-sm font-bold text-orange-400 print:text-orange-700">{athlete.goal}</p>
                  <p className="text-[10px] text-emerald-400 font-bold print:text-emerald-700">Status: {athlete.status}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 print:bg-slate-50 border border-white/5 print:border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">Adesão & Comitê</p>
                  <p className="text-sm font-bold text-emerald-400 print:text-emerald-800">{athlete.adherencePercentage}% de Adesão</p>
                  <p className="text-[10px] text-slate-400 truncate print:text-slate-600">Coach: {athlete.coachName.split('(')[0]}</p>
                </div>
              </div>
            </div>

            {/* Executive Delta Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center print:bg-white print:border-slate-300 print:text-black">
                <span className="text-[9px] uppercase font-bold text-slate-400 print:text-slate-600">Peso Corporal</span>
                <p className="text-base sm:text-lg font-black text-white mt-0.5 print:text-black">
                  {initialData.weightKg} ➔ {latestData.weightKg} kg
                </p>
                <span className={`text-[11px] font-black ${totalWeightDelta >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-amber-400 print:text-amber-700'}`}>
                  {totalWeightDelta >= 0 ? `+${totalWeightDelta}` : totalWeightDelta} kg
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-emerald-500/20 text-center print:bg-white print:border-slate-300 print:text-black">
                <span className="text-[9px] uppercase font-bold text-slate-400 print:text-slate-600">% Gordura (BF)</span>
                <p className="text-base sm:text-lg font-black text-white mt-0.5 print:text-black">
                  {initialData.bodyFatPercentage}% ➔ {latestData.bodyFatPercentage}%
                </p>
                <span className="text-[11px] font-black text-emerald-400 print:text-emerald-700">
                  {totalFatDelta}%
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-emerald-500/20 text-center print:bg-white print:border-slate-300 print:text-black">
                <span className="text-[9px] uppercase font-bold text-slate-400 print:text-slate-600">Massa Magra</span>
                <p className="text-base sm:text-lg font-black text-white mt-0.5 print:text-black">
                  {initialData.muscleMassKg} ➔ {latestData.muscleMassKg} kg
                </p>
                <span className="text-[11px] font-black text-emerald-400 print:text-emerald-700">
                  +{totalMuscleDelta} kg
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center print:bg-white print:border-slate-300 print:text-black">
                <span className="text-[9px] uppercase font-bold text-slate-400 print:text-slate-600">Cintura</span>
                <p className="text-base sm:text-lg font-black text-white mt-0.5 print:text-black">
                  {initialData.waistCm} ➔ {latestData.waistCm} cm
                </p>
                <span className="text-[11px] font-black text-emerald-400 print:text-emerald-700">
                  {totalWaistDelta} cm
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center print:bg-white print:border-slate-300 print:text-black">
                <span className="text-[9px] uppercase font-bold text-slate-400 print:text-slate-600">Braço Direito</span>
                <p className="text-base sm:text-lg font-black text-white mt-0.5 print:text-black">
                  {initialData.rightArmCm} ➔ {latestData.rightArmCm} cm
                </p>
                <span className="text-[11px] font-black text-emerald-400 print:text-emerald-700">
                  +{totalArmDelta} cm
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center print:bg-white print:border-slate-300 print:text-black">
                <span className="text-[9px] uppercase font-bold text-slate-400 print:text-slate-600">IMC / Densidade</span>
                <p className="text-base sm:text-lg font-black text-amber-400 mt-0.5 print:text-amber-800">
                  {bmi} kg/m²
                </p>
                <span className="text-[10px] text-slate-400 truncate print:text-slate-600">
                  {bmiClassification.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* ======================================================== */}
            {/* SECTION 1: HISTÓRICO DE PESO & REAVALIAÇÕES ORGANIZADO   */}
            {/* ======================================================== */}
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/15 shadow-xl print:bg-white print:border-slate-300 print:text-black">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 print:bg-orange-100 print:text-orange-800">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider print:text-black">
                      1. Histórico Longitudinal de Peso e Composição Corporal
                    </h3>
                    <p className="text-xs text-slate-400 print:text-slate-600">
                      Registro sequencial das pesagens e métricas antropométricas
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-3 py-1 rounded-xl border border-orange-500/20 print:bg-slate-100 print:text-black">
                  Meta Final: {athlete.targetWeightKg} kg
                </span>
              </div>

              {/* Chronological Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 print:border-slate-300">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-white/10 print:bg-slate-100 text-slate-300 print:text-slate-800 uppercase text-[10px] tracking-wider font-bold">
                      <th className="p-3">Data</th>
                      <th className="p-3">Peso</th>
                      <th className="p-3">Variação (Δ)</th>
                      <th className="p-3">% Gordura</th>
                      <th className="p-3">Massa Magra</th>
                      <th className="p-3">Cintura</th>
                      <th className="p-3">Braço D.</th>
                      <th className="p-3">Tórax</th>
                      <th className="p-3">Coxa D.</th>
                      <th className="p-3">Parecer Clínico da Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 print:divide-slate-200">
                    {displayedHistory.map((row, idx) => {
                      const prevRow = idx > 0 ? displayedHistory[idx - 1] : row;
                      const stepDelta = idx > 0 ? Number((row.weightKg - prevRow.weightKg).toFixed(1)) : 0;
                      const isLatest = idx === displayedHistory.length - 1;

                      return (
                        <tr
                          key={idx}
                          className={`transition ${
                            isLatest
                              ? 'bg-orange-500/10 font-medium print:bg-orange-50'
                              : 'hover:bg-white/5 print:hover:bg-transparent'
                          }`}
                        >
                          <td className="p-3 font-bold text-white print:text-black whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-orange-400 print:text-orange-600" />
                              <span>{new Date(row.date).toLocaleDateString('pt-BR')}</span>
                              {isLatest && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-orange-600 text-white">
                                  Atual
                                </span>
                              )}
                              {idx === 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-slate-700 text-slate-200 print:bg-slate-300 print:text-black">
                                  Início
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-black text-white print:text-black text-sm">
                            {row.weightKg} kg
                          </td>
                          <td className="p-3 font-bold whitespace-nowrap">
                            {idx === 0 ? (
                              <span className="text-slate-400 print:text-slate-600">Base</span>
                            ) : (
                              <span className={stepDelta >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-amber-400 print:text-amber-700'}>
                                {stepDelta >= 0 ? `+${stepDelta}` : stepDelta} kg
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-blue-400 print:text-blue-700">
                            {row.bodyFatPercentage}%
                          </td>
                          <td className="p-3 font-bold text-emerald-400 print:text-emerald-700">
                            {row.muscleMassKg} kg
                          </td>
                          <td className="p-3 font-semibold text-emerald-300 print:text-emerald-800">
                            {row.waistCm} cm
                          </td>
                          <td className="p-3 text-slate-300 print:text-slate-700">
                            {row.rightArmCm} cm
                          </td>
                          <td className="p-3 text-slate-300 print:text-slate-700">
                            {row.chestCm} cm
                          </td>
                          <td className="p-3 text-slate-300 print:text-slate-700">
                            {row.rightThighCm} cm
                          </td>
                          <td className="p-3 text-slate-300 print:text-slate-700 text-[11px] max-w-xs">
                            {row.notes || 'Sem observações adicionais'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Weight Progression Timeline Bar */}
              <div className="mt-4 p-3.5 rounded-2xl bg-white/5 print:bg-slate-50 border border-white/10 print:border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-300 print:text-slate-700 mb-2">
                  <span className="font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                    Progressão Ponderal do Ciclo:
                  </span>
                  <span className="font-mono text-[11px]">
                    {initialData.weightKg} kg ➔ {latestData.weightKg} kg (Meta: {athlete.targetWeightKg} kg)
                  </span>
                </div>
                <div className="relative w-full h-3 rounded-full bg-slate-800 print:bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 print:bg-orange-600"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          15,
                          ((latestData.weightKg - initialData.weightKg + 2) /
                            (athlete.targetWeightKg - initialData.weightKg + 2)) *
                            100
                        )
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* SECTION 2: FOTOS DE EVOLUÇÃO ORGANIZADAS POR DATA        */}
            {/* ======================================================== */}
            {includePhotos && (
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/15 shadow-xl space-y-6 print:bg-white print:border-slate-300 print:text-black">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 print:bg-orange-100 print:text-orange-800">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider print:text-black">
                        2. Registro Fotográfico Padronizado & Comparativo Visual
                      </h3>
                      <p className="text-xs text-slate-400 print:text-slate-600">
                        Análise de densidade muscular, simetria e definição por ângulos (Frente, Perfil e Costas)
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">
                    Poses Padronizadas
                  </span>
                </div>

                {/* Direct High-Impact Side-by-Side (Before vs After) */}
                <div className="p-4 rounded-2xl bg-black/40 print:bg-slate-50 border border-white/10 print:border-slate-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-orange-400 uppercase tracking-wide print:text-orange-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Comparativo Direto de Recomposição Corporal (Início vs Atual)</span>
                    </p>
                    <span className="text-[10px] text-slate-400 print:text-slate-600 font-mono">
                      Δ Peso: {totalWeightDelta >= 0 ? `+${totalWeightDelta}` : totalWeightDelta} kg | Δ Gordura: {totalFatDelta}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Before Card */}
                    <div className="rounded-2xl overflow-hidden border border-white/10 print:border-slate-300 bg-slate-950 print:bg-white shadow-lg">
                      <div className="p-2.5 bg-slate-800/80 print:bg-slate-100 flex items-center justify-between border-b border-white/10 print:border-slate-200">
                        <span className="text-xs font-bold text-slate-300 print:text-black">
                          AVALIAÇÃO INICIAL
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 print:text-slate-700">
                          {new Date(initialData.date).toLocaleDateString('pt-BR')} • {initialData.weightKg} kg
                        </span>
                      </div>
                      <div className="relative h-64 sm:h-72 overflow-hidden bg-slate-900">
                        <img
                          src={initialData.photos?.front || defaultPhotos.front}
                          alt="Foto Inicial"
                          className="w-full h-full object-cover object-center"
                          crossOrigin="anonymous"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-xs text-white">
                          <p className="font-bold">Pose Frontal Relaxada / Duplo Bíceps</p>
                          <p className="text-[10px] text-slate-300">BF: {initialData.bodyFatPercentage}% | Cintura: {initialData.waistCm}cm</p>
                        </div>
                      </div>
                    </div>

                    {/* After Card */}
                    <div className="rounded-2xl overflow-hidden border border-orange-500/40 print:border-orange-600 bg-slate-950 print:bg-white shadow-lg">
                      <div className="p-2.5 bg-orange-600/20 print:bg-orange-100 flex items-center justify-between border-b border-orange-500/30 print:border-orange-300">
                        <span className="text-xs font-bold text-orange-300 print:text-orange-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 print:text-emerald-700" />
                          AVALIAÇÃO ATUAL
                        </span>
                        <span className="text-[10px] font-mono font-bold text-orange-300 print:text-orange-800">
                          {new Date(latestData.date).toLocaleDateString('pt-BR')} • {latestData.weightKg} kg
                        </span>
                      </div>
                      <div className="relative h-64 sm:h-72 overflow-hidden bg-slate-900">
                        <img
                          src={latestData.photos?.front || defaultPhotos.back}
                          alt="Foto Atual"
                          className="w-full h-full object-cover object-center"
                          crossOrigin="anonymous"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-xs text-white">
                          <p className="font-bold text-emerald-300">Densidade Muscular Consolidada</p>
                          <p className="text-[10px] text-slate-200">BF: {latestData.bodyFatPercentage}% ({totalFatDelta}%) | Cintura: {latestData.waistCm}cm ({totalWaistDelta}cm)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grouped Chronological Check-ins with 3-Angle Poses (Front, Side, Back) */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-300 print:text-black uppercase tracking-wider">
                    Galeria Longitudinal por Check-in:
                  </p>

                  {displayedHistory.map((checkin, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-4 rounded-2xl bg-white/5 print:bg-slate-50 border border-white/10 print:border-slate-200 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 print:border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-black">
                            {cIdx + 1}
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-white print:text-black">
                              Avaliação de {new Date(checkin.date).toLocaleDateString('pt-BR')}
                            </h4>
                            <p className="text-[10px] text-slate-400 print:text-slate-600">
                              {checkin.notes || 'Registro biométrico padrão'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-white/10 print:bg-slate-200 font-bold text-white print:text-black">
                            Peso: {checkin.weightKg} kg
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 print:bg-blue-100 font-bold text-blue-300 print:text-blue-800">
                            BF: {checkin.bodyFatPercentage}%
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 print:bg-emerald-100 font-bold text-emerald-300 print:text-emerald-800">
                            Massa: {checkin.muscleMassKg} kg
                          </span>
                        </div>
                      </div>

                      {/* 3 Angle Grid: Front, Side, Back */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Front Pose */}
                        <div className="rounded-xl overflow-hidden border border-white/10 print:border-slate-200 bg-slate-950">
                          <div className="relative h-44 overflow-hidden">
                            <img
                              src={checkin.photos?.front || defaultPhotos.front}
                              alt="Frente"
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-black/70 backdrop-blur-sm text-white">
                              Frente
                            </span>
                          </div>
                          <div className="p-2 bg-slate-900 print:bg-white text-[10px] text-slate-300 print:text-slate-700 flex justify-between">
                            <span>Tórax: {checkin.chestCm}cm</span>
                            <span>Braço: {checkin.rightArmCm}cm</span>
                          </div>
                        </div>

                        {/* Side Pose */}
                        <div className="rounded-xl overflow-hidden border border-white/10 print:border-slate-200 bg-slate-950">
                          <div className="relative h-44 overflow-hidden">
                            <img
                              src={checkin.photos?.side || defaultPhotos.side}
                              alt="Perfil Lateral"
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-black/70 backdrop-blur-sm text-white">
                              Perfil Lateral
                            </span>
                          </div>
                          <div className="p-2 bg-slate-900 print:bg-white text-[10px] text-slate-300 print:text-slate-700 flex justify-between">
                            <span>Cintura: {checkin.waistCm}cm</span>
                            <span>Abdômen: {checkin.abdomenCm}cm</span>
                          </div>
                        </div>

                        {/* Back Pose */}
                        <div className="rounded-xl overflow-hidden border border-white/10 print:border-slate-200 bg-slate-950">
                          <div className="relative h-44 overflow-hidden">
                            <img
                              src={checkin.photos?.back || defaultPhotos.back}
                              alt="Costas / Dorsal"
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-black/70 backdrop-blur-sm text-white">
                              Costas / Dorsal
                            </span>
                          </div>
                          <div className="p-2 bg-slate-900 print:bg-white text-[10px] text-slate-300 print:text-slate-700 flex justify-between">
                            <span>Ombros: {checkin.shouldersCm}cm</span>
                            <span>Glúteos: {checkin.glutesCm}cm</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 3: PERIMETRIA ANTROPOMÉTRICA COMPLETA           */}
            {/* ======================================================== */}
            {includePerimetry && (
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/15 shadow-xl print:bg-white print:border-slate-300 print:text-black">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3 print:text-black">
                  3. Perimetria Antropométrica Detalhada (Avaliação Atual)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 print:bg-slate-50 border border-white/10 print:border-slate-200">
                    <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase">Tórax</span>
                    <p className="font-bold text-white print:text-black text-sm">{latestData.chestCm} cm</p>
                    <span className="text-[10px] text-emerald-400">Δ +{totalChestDelta} cm</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 print:bg-slate-50 border border-white/10 print:border-slate-200">
                    <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase">Ombros</span>
                    <p className="font-bold text-white print:text-black text-sm">{latestData.shouldersCm} cm</p>
                    <span className="text-[10px] text-emerald-400">Δ +{(latestData.shouldersCm - initialData.shouldersCm).toFixed(1)} cm</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 print:bg-slate-50 border border-white/10 print:border-slate-200">
                    <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase">Cintura</span>
                    <p className="font-bold text-white print:text-black text-sm">{latestData.waistCm} cm</p>
                    <span className="text-[10px] text-emerald-400">Δ {totalWaistDelta} cm</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 print:bg-slate-50 border border-white/10 print:border-slate-200">
                    <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase">Abdômen</span>
                    <p className="font-bold text-white print:text-black text-sm">{latestData.abdomenCm} cm</p>
                    <span className="text-[10px] text-emerald-400">Δ {(latestData.abdomenCm - initialData.abdomenCm).toFixed(1)} cm</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 print:bg-slate-50 border border-white/10 print:border-slate-200">
                    <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase">Braço Direito / Esq.</span>
                    <p className="font-bold text-white print:text-black text-sm">{latestData.rightArmCm} / {latestData.leftArmCm} cm</p>
                    <span className="text-[10px] text-emerald-400">Δ +{totalArmDelta} cm</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 print:bg-slate-50 border border-white/10 print:border-slate-200">
                    <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase">Coxa Direita / Esq.</span>
                    <p className="font-bold text-white print:text-black text-sm">{latestData.rightThighCm} / {latestData.leftThighCm} cm</p>
                    <span className="text-[10px] text-emerald-400">Δ +{(latestData.rightThighCm - initialData.rightThighCm).toFixed(1)} cm</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 print:bg-slate-50 border border-white/10 print:border-slate-200">
                    <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase">Glúteos</span>
                    <p className="font-bold text-white print:text-black text-sm">{latestData.glutesCm} cm</p>
                    <span className="text-[10px] text-slate-400">Δ +{(latestData.glutesCm - initialData.glutesCm).toFixed(1)} cm</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 print:bg-slate-50 border border-white/10 print:border-slate-200">
                    <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase">Panturrilhas</span>
                    <p className="font-bold text-white print:text-black text-sm">{latestData.calvesCm} cm</p>
                    <span className="text-[10px] text-emerald-400">Δ +{(latestData.calvesCm - initialData.calvesCm).toFixed(1)} cm</span>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 4: PARECER CLÍNICO & CONDUTA TÉCNICA             */}
            {/* ======================================================== */}
            {includeNotes && (
              <div className="p-5 rounded-3xl bg-orange-950/20 border border-orange-500/20 print:bg-slate-50 print:border-slate-300 print:text-black text-xs space-y-2">
                <h3 className="text-xs font-black text-orange-400 uppercase tracking-wider print:text-orange-800">
                  4. Parecer Técnico da Equipe Multidisciplinar
                </h3>
                <p className="text-slate-200 print:text-slate-800 leading-relaxed">
                  O atleta apresenta excelente curva de adesão de <strong>{athlete.adherencePercentage}%</strong>. Notou-se recomposição corporal significativa com ganho líquido de <strong>+{totalMuscleDelta} kg</strong> de massa magra e redução do percentual de gordura em <strong>{totalFatDelta}%</strong>, acompanhada de afinamento da linha de cintura (-{Math.abs(totalWaistDelta)} cm). Recomendada a progressão de cargas no microciclo seguinte e manutenção do protocolo nutricional de suporte.
                </p>
              </div>
            )}

            {/* Official Signatures Section */}
            <div className="pt-6 border-t border-white/15 print:border-slate-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
                <div className="space-y-1">
                  <div className="border-b border-white/20 print:border-slate-400 pb-1 font-bold text-white print:text-black">
                    {athlete.coachName}
                  </div>
                  <p className="text-[10px] text-orange-400 print:text-orange-700 font-semibold">Head Coach & Prescritor Físico</p>
                  <p className="text-[9px] text-slate-400 print:text-slate-600 font-mono">CREF: 089123-G/SP</p>
                </div>

                <div className="space-y-1">
                  <div className="border-b border-white/20 print:border-slate-400 pb-1 font-bold text-white print:text-black">
                    {athlete.nutritionistName}
                  </div>
                  <p className="text-[10px] text-emerald-400 print:text-emerald-700 font-semibold">Nutricionista Esportiva</p>
                  <p className="text-[9px] text-slate-400 print:text-slate-600 font-mono">CRN-3: 45890</p>
                </div>

                <div className="space-y-1">
                  <div className="border-b border-white/20 print:border-slate-400 pb-1 font-bold text-white print:text-black">
                    {athlete.doctorName}
                  </div>
                  <p className="text-[10px] text-blue-400 print:text-blue-700 font-semibold">Médico do Esporte & Fisiologia</p>
                  <p className="text-[9px] text-slate-400 print:text-slate-600 font-mono">CRM-SP: 182490 / RQE 9201</p>
                </div>
              </div>

              <div className="text-center pt-5 text-[9px] text-slate-500 print:text-slate-600">
                Documento emitido digitalmente pela plataforma oficial LM Team Assessoria Esportiva • Todos os direitos reservados.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
