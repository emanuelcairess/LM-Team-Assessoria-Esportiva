import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, Download, X, Award, Activity, Heart, ShieldCheck } from 'lucide-react';
import { AthleteProfile, AnthropometricData } from '../types';
import { soundFx } from '../utils/audio';

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: AthleteProfile;
  currentData?: AnthropometricData;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  isOpen,
  onClose,
  athlete,
  currentData
}) => {
  if (!isOpen) return null;

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

  const history = athlete.measurementsHistory || [];
  const data: AnthropometricData = currentData || history[history.length - 1] || defaultMeasurement;
  const bmi = (data.weightKg / Math.pow(data.heightCm / 100, 2)).toFixed(1);
  const bmiNumber = parseFloat(bmi);

  let bmiClassification = 'Eutrofia / Normal';
  if (bmiNumber < 18.5) bmiClassification = 'Abaixo do peso';
  else if (bmiNumber >= 25 && bmiNumber < 30) bmiClassification = 'Sobrepeso (Alto volume muscular)';
  else if (bmiNumber >= 30) bmiClassification = 'Alta densidade de massa magra';

  const handlePrint = () => {
    soundFx.playClick();
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl rounded-3xl modal-liquid-glass border border-white/20 p-6 md:p-8 shadow-2xl my-8 overflow-hidden"
        >
          {/* Action Bar (Not shown in print) */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10 no-print">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Relatório Clínico & Antropométrico</h3>
                <p className="text-xs text-slate-400">Laudo oficial gerado pela Plataforma LM Team</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/40 transition"
              >
                <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Report Document */}
          <div className="pt-6 space-y-6 text-slate-100 font-sans" id="printable-report">
            {/* Header Document */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-800/60 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-md">
                  LM
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-white">LM TEAM ASSESSORIA ESPORTIVA</h2>
                  <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase">
                    Protocolo Integrado de Alta Performance
                  </p>
                  <p className="text-[11px] text-slate-400">Data de Emissão: {new Date(data.date).toLocaleDateString('pt-BR')} | ID: {athlete.id.toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> Laudo Aprovado
                </span>
              </div>
            </div>

            {/* Athlete Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Atleta</p>
                <p className="text-white font-bold text-sm mt-0.5">{athlete.name}</p>
                <p className="text-cyan-400 font-mono text-[10px]">CPF: {athlete.cpf || '123.456.789-00'}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Idade / Categoria</p>
                <p className="text-white font-bold text-sm mt-0.5">{athlete.age} anos • {athlete.category}</p>
                <p className="text-slate-400 text-[10px]">Tel: {athlete.phone || 'Cadastrado'}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Objetivo Atual</p>
                <p className="text-blue-400 font-bold text-sm mt-0.5">{athlete.goal}</p>
                <p className="text-slate-400 text-[10px]">Status: {athlete.status}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Taxa de Adesão</p>
                <p className="text-emerald-400 font-bold text-sm mt-0.5">{athlete.adherencePercentage}% Excelente</p>
                <p className="text-indigo-300 text-[10px]">Treinador: {athlete.coachName.split('(')[0]}</p>
              </div>
            </div>

            {/* Body Comp KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Peso Corporal</span>
                <p className="text-2xl font-black text-white mt-1">{data.weightKg} <span className="text-xs font-normal text-slate-400">kg</span></p>
                <p className="text-[10px] text-emerald-400 mt-0.5">Meta: {athlete.targetWeightKg} kg</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Estatura</span>
                <p className="text-2xl font-black text-white mt-1">{data.heightCm} <span className="text-xs font-normal text-slate-400">cm</span></p>
                <p className="text-[10px] text-slate-400 mt-0.5">Envergadura normal</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">% Gordura (BF)</span>
                <p className="text-2xl font-black text-blue-400 mt-1">{data.bodyFatPercentage}%</p>
                <p className="text-[10px] text-emerald-400 mt-0.5">Definição atlética</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">IMC Calculado</span>
                <p className="text-2xl font-black text-amber-400 mt-1">{bmi}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{bmiClassification}</p>
              </div>
            </div>

            {/* Circumferences Table */}
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="bg-white/10 px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center justify-between">
                <span>Perimetria Antropométrica Completa (cm)</span>
                <span className="text-[10px] text-slate-400">Precisão com fita métrica metálica</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 divide-y md:divide-y-0 divide-x-0 md:divide-x divide-white/10 bg-white/5 text-xs">
                <div className="p-3 space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">Tórax / Peito:</span> <span className="font-bold text-white">{data.chestCm} cm</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Ombros (Deltoides):</span> <span className="font-bold text-white">{data.shouldersCm} cm</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Pescoço:</span> <span className="font-bold text-white">{data.neckCm} cm</span></div>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">Cintura:</span> <span className="font-bold text-emerald-400">{data.waistCm} cm</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Abdômen (Umbilical):</span> <span className="font-bold text-emerald-400">{data.abdomenCm} cm</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Glúteos:</span> <span className="font-bold text-white">{data.glutesCm} cm</span></div>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">Braço Direito / Esq:</span> <span className="font-bold text-white">{data.rightArmCm} / {data.leftArmCm} cm</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Coxa Direita / Esq:</span> <span className="font-bold text-white">{data.rightThighCm} / {data.leftThighCm} cm</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Panturrilhas:</span> <span className="font-bold text-white">{data.calvesCm} cm</span></div>
                </div>
              </div>
            </div>

            {/* Clinical Observations */}
            {data.notes && (
              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-xs">
                <p className="font-bold text-blue-300 uppercase tracking-wider text-[10px] mb-1">Parecer Técnico da Equipe Multidisciplinar:</p>
                <p className="text-slate-300 leading-relaxed">{data.notes}</p>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 text-center text-[10px]">
              <div>
                <div className="border-b border-white/20 pb-1 mb-1 font-semibold text-slate-200">{athlete.coachName}</div>
                <span className="text-slate-400">Head Coach & Treinador</span>
              </div>
              <div>
                <div className="border-b border-white/20 pb-1 mb-1 font-semibold text-slate-200">{athlete.nutritionistName}</div>
                <span className="text-slate-400">Nutricionista Esportiva CRN</span>
              </div>
              <div>
                <div className="border-b border-white/20 pb-1 mb-1 font-semibold text-slate-200">{athlete.doctorName}</div>
                <span className="text-slate-400">Médico do Esporte CRM</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
