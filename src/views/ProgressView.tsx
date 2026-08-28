import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Scale,
  Camera,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Image,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer,
  Download
} from 'lucide-react';
import { AthleteProfile, AnthropometricData } from '../types';
import { soundFx } from '../utils/audio';
import { ProgressPdfReportModal } from '../components/ProgressPdfReportModal';

interface ProgressViewProps {
  athlete: AthleteProfile;
  onOpenReportModal?: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ athlete, onOpenReportModal }) => {
  const [isProgressPdfOpen, setIsProgressPdfOpen] = useState<boolean>(false);
  const history = athlete.measurementsHistory || [];
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
    notes: 'Avaliação inicial'
  };

  const initialData = history[0] || defaultMeasurement;
  const latestData = history[history.length - 1] || initialData;

  const weightDelta = Number((latestData.weightKg - initialData.weightKg).toFixed(1));
  const fatDelta = Number((latestData.bodyFatPercentage - initialData.bodyFatPercentage).toFixed(1));
  const muscleDelta = Number((latestData.muscleMassKg - initialData.muscleMassKg).toFixed(1));
  const waistDelta = Number((latestData.waistCm - initialData.waistCm).toFixed(1));
  const armDelta = Number((latestData.rightArmCm - initialData.rightArmCm).toFixed(1));
  const chestDelta = Number((latestData.chestCm - initialData.chestCm).toFixed(1));

  // Interactive Before / After Slider Position (0 to 100)
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'slider' | 'side_by_side'>('slider');

  // Photo comparison assets
  const beforePhoto = initialData.photos?.front || 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80';
  const afterPhoto = latestData.photos?.front || 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80';

  const handleOpenPdf = () => {
    soundFx.playClick();
    setIsProgressPdfOpen(true);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Progress Header Card (#E65100 Vibrant Amber Orange Theme) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl liquid-glass hero-progress p-6 sm:p-7 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-600 text-white">
                Análise Longitudinal
              </span>
              <span className="text-xs text-orange-300 font-semibold">Trimestre Atual</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Evolução Física & Comparativo Temporal
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Progressão biométrica de {new Date(initialData.date).toLocaleDateString('pt-BR')} até {new Date(latestData.date).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Main PDF Generation Button */}
            <button
              type="button"
              onClick={handleOpenPdf}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black shadow-xl shadow-orange-950/40 border border-orange-400/40 transition active:scale-95 group"
            >
              <FileText className="w-4 h-4 text-orange-200 group-hover:scale-110 transition" />
              <span>Gerar Relatório PDF</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            </button>

            <div className="flex items-center gap-3 bg-white/5 p-2.5 sm:p-3 rounded-2xl border border-white/10">
              <div className="text-center px-2">
                <p className="text-[9px] uppercase font-bold text-slate-400">Ganho Massa</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400">+{muscleDelta} kg</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center px-2">
                <p className="text-[9px] uppercase font-bold text-slate-400">Redução BF</p>
                <p className="text-xl sm:text-2xl font-black text-amber-400">{fatDelta}%</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delta KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl liquid-glass border border-white/10 text-center"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">Peso Total</span>
          <p className="text-lg font-black text-white mt-0.5">{latestData.weightKg} kg</p>
          <span className="text-[11px] font-bold text-emerald-400">+{weightDelta} kg</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-3.5 rounded-2xl liquid-glass border border-emerald-500/20 text-center"
        >
          <span className="text-[10px] uppercase font-bold text-emerald-400">Cintura</span>
          <p className="text-lg font-black text-white mt-0.5">{latestData.waistCm} cm</p>
          <span className="text-[11px] font-bold text-emerald-400">{waistDelta} cm</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-3.5 rounded-2xl liquid-glass border border-white/10 text-center"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">Braço Dir.</span>
          <p className="text-lg font-black text-white mt-0.5">{latestData.rightArmCm} cm</p>
          <span className="text-[11px] font-bold text-emerald-400">+{armDelta} cm</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-3.5 rounded-2xl liquid-glass border border-white/10 text-center"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">Tórax</span>
          <p className="text-lg font-black text-white mt-0.5">{latestData.chestCm} cm</p>
          <span className="text-[11px] font-bold text-emerald-400">+{chestDelta} cm</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-3.5 rounded-2xl liquid-glass border border-white/10 text-center"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">Coxa Dir.</span>
          <p className="text-lg font-black text-white mt-0.5">{latestData.rightThighCm} cm</p>
          <span className="text-[11px] font-bold text-emerald-400">+{(latestData.rightThighCm - initialData.rightThighCm).toFixed(1)} cm</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-3.5 rounded-2xl liquid-glass border border-white/10 text-center"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">% Gordura</span>
          <p className="text-lg font-black text-emerald-400 mt-0.5">{latestData.bodyFatPercentage}%</p>
          <span className="text-[11px] font-bold text-emerald-400">{fatDelta}%</span>
        </motion.div>
      </div>

      {/* Visual Photo Comparison (Interactive Split Slider or Side-by-Side) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl liquid-glass border border-white/15 p-6 shadow-2xl overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Comparativo Fotográfico Padronizado</h3>
              <p className="text-xs text-slate-400">Avaliação postural e densidade muscular (Antes & Depois)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Quick PDF Action */}
            <button
              type="button"
              onClick={handleOpenPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30 text-xs font-bold transition"
              title="Gerar laudo em PDF com fotos"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Exportar PDF com Fotos</span>
            </button>

            {/* Toggle mode: Slider vs Side-by-side */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setViewMode('slider');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  viewMode === 'slider'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Slider Interativo
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setViewMode('side_by_side');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  viewMode === 'side_by_side'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Lado a Lado
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Viewer */}
        {viewMode === 'slider' ? (
          <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden select-none border border-white/10 shadow-2xl bg-slate-950">
            {/* After Image (Full background) */}
            <img
              src={afterPhoto}
              alt="Depois"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-black bg-black/70 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
              ATUAL (Ago/2026 - 79.8kg)
            </span>

            {/* Before Image (Clipped by slider) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={beforePhoto}
                alt="Antes"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: '100%', minWidth: '100%' }}
              />
              <span className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-black bg-black/70 backdrop-blur-md text-slate-300 border border-white/20">
                INÍCIO (Jun/2026 - 77.2kg)
              </span>
            </div>

            {/* Vertical Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize z-20 flex items-center justify-center"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-orange-600 text-white shadow-2xl border-2 border-white flex items-center justify-center -ml-3.5">
                <ChevronLeft className="w-3.5 h-3.5 -mr-1" />
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Invisible Range Input for touch/mouse drag */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 h-80 bg-slate-950">
              <img src={beforePhoto} alt="Início" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                <span className="text-[10px] font-bold uppercase text-slate-400">Avaliação Inicial</span>
                <h4 className="text-base font-black text-white">15/06/2026 (77.2 kg • 11.2% BF)</h4>
                <p className="text-xs text-slate-300">Cintura: 80.5cm • Braço: 39.8cm</p>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 h-80 bg-slate-950 shadow-xl shadow-emerald-950/20">
              <img src={afterPhoto} alt="Atual" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                <span className="text-[10px] font-bold uppercase text-emerald-400">Avaliação Atual</span>
                <h4 className="text-base font-black text-emerald-300">20/08/2026 (79.8 kg • 9.8% BF)</h4>
                <p className="text-xs text-slate-200">Cintura: 78.0cm (-2.5cm) • Braço: 41.5cm (+1.7cm)</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Temporal Evaluation History Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl liquid-glass border border-white/10 p-6 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Histórico Temporal Detalhado</h3>
              <p className="text-xs text-slate-400">Comparativo das 3 últimas reavaliações do ciclo</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenPdf}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-orange-300 border border-orange-500/20 text-xs font-bold transition self-start sm:self-auto"
          >
            <Printer className="w-4 h-4 text-orange-400" />
            <span>Imprimir Histórico em PDF</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-bold">Data</th>
                <th className="pb-3 font-bold">Peso</th>
                <th className="pb-3 font-bold">% BF</th>
                <th className="pb-3 font-bold">Massa Magra</th>
                <th className="pb-3 font-bold">Tórax</th>
                <th className="pb-3 font-bold">Ombros</th>
                <th className="pb-3 font-bold">Cintura</th>
                <th className="pb-3 font-bold">Braço D.</th>
                <th className="pb-3 font-bold">Coxa D.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition">
                  <td className="py-3 font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    {new Date(row.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 font-extrabold text-white">{row.weightKg} kg</td>
                  <td className="py-3 font-bold text-blue-400">{row.bodyFatPercentage}%</td>
                  <td className="py-3 font-bold text-emerald-400">{row.muscleMassKg} kg</td>
                  <td className="py-3 text-slate-300">{row.chestCm} cm</td>
                  <td className="py-3 text-slate-300">{row.shouldersCm} cm</td>
                  <td className="py-3 font-bold text-emerald-300">{row.waistCm} cm</td>
                  <td className="py-3 text-slate-300">{row.rightArmCm} cm</td>
                  <td className="py-3 text-slate-300">{row.rightThighCm} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Progress & Evolution PDF Report Modal */}
      <ProgressPdfReportModal
        isOpen={isProgressPdfOpen}
        onClose={() => setIsProgressPdfOpen(false)}
        athlete={athlete}
      />
    </div>
  );
};
