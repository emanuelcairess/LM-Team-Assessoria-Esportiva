import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, X, Activity, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { AthleteProfile, AnthropometricData } from '../types';
import { soundFx } from '../utils/audio';
import {
  formatMeasurementValue,
  calculateBmi,
  isEvaluationApproved
} from '../services/athleteDataService';
import { useAccessibleModal } from '../hooks/useAccessibleModal';

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

  const history = athlete.measurementsHistory || [];
  const rawData: Partial<AnthropometricData> = currentData || history[history.length - 1] || {};

  // Apenas utiliza dados autênticos registrados. Medidas ausentes permanecem undefined e renderizam 'Não informado'.
  const data: Partial<AnthropometricData> = {
    date: rawData.date,
    weightKg: rawData.weightKg,
    heightCm: rawData.heightCm,
    bodyFatPercentage: rawData.bodyFatPercentage,
    muscleMassKg: rawData.muscleMassKg,
    chestCm: rawData.chestCm,
    shouldersCm: rawData.shouldersCm,
    waistCm: rawData.waistCm,
    abdomenCm: rawData.abdomenCm,
    rightArmCm: rawData.rightArmCm,
    leftArmCm: rawData.leftArmCm,
    rightThighCm: rawData.rightThighCm,
    leftThighCm: rawData.leftThighCm,
    calvesCm: rawData.calvesCm,
    glutesCm: rawData.glutesCm,
    neckCm: rawData.neckCm,
    photos: rawData.photos,
    notes: rawData.notes,
    validatedBy: rawData.validatedBy,
    validatedAt: rawData.validatedAt
  };

  // Cálculo de IMC sem inferir composição corporal
  const bmiResult = calculateBmi(data.weightKg, data.heightCm);

  // Validação clínica: aprovação visual permitida estritamente se houver profissional e data registrados
  const isApproved = isEvaluationApproved(data);

  const handlePrint = () => {
    soundFx.playClick();
    window.print();
  };

  const { modalRef } = useAccessibleModal({ isOpen, onClose });

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        role="presentation"
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-report-title"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl rounded-3xl modal-liquid-glass border border-white/20 p-6 md:p-8 shadow-2xl my-8 overflow-hidden focus:outline-none"
        >
          {/* Action Bar (Not shown in print) */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10 no-print">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Activity className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id="pdf-report-title" className="text-lg font-bold text-white">Relatório Clínico & Antropométrico</h3>
                <p className="text-xs text-slate-400">Laudo oficial gerado pela Plataforma LM Team</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/40 transition focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Printer className="w-4 h-4" aria-hidden="true" /> Imprimir / Salvar PDF
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar relatório de laudo físico"
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <X className="w-5 h-5" aria-hidden="true" />
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
                  <p className="text-[11px] text-slate-400">
                    Data de Emissão: {data.date ? new Date(data.date).toLocaleDateString('pt-BR') : 'Não informado'} | ID: {athlete.id.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Status de Validação Profissional - Aprovação visual removida se não houver validação */}
              <div className="text-right">
                {isApproved ? (
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <ShieldCheck className="w-3.5 h-3.5" /> Laudo Validado & Aprovado
                    </span>
                    <p className="text-[10px] text-emerald-400 mt-1">
                      Por {data.validatedBy?.name} ({data.validatedBy?.role || 'Prescritor'}) em {new Date(data.validatedAt!).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> Sem validação profissional
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Registro pendente de validação clínica
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Athlete Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Atleta</p>
                <p className="text-white font-bold text-sm mt-0.5">{athlete.name}</p>
                <p className="text-cyan-400 font-mono text-[10px]">CPF: {athlete.cpf || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Idade / Categoria</p>
                <p className="text-white font-bold text-sm mt-0.5">{athlete.age} anos • {athlete.category}</p>
                <p className="text-slate-400 text-[10px]">Tel: {athlete.phone || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Objetivo Atual</p>
                <p className="text-blue-400 font-bold text-sm mt-0.5">{athlete.goal}</p>
                <p className="text-slate-400 text-[10px]">Status: {athlete.status}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Taxa de Adesão</p>
                <p className="text-emerald-400 font-bold text-sm mt-0.5">{athlete.adherencePercentage}% Registrada</p>
                <p className="text-indigo-300 text-[10px]">Treinador: {athlete.coachName ? athlete.coachName.split('(')[0].trim() : 'Não informado'}</p>
              </div>
            </div>

            {/* Body Comp KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Peso Corporal</span>
                <p className="text-2xl font-black text-white mt-1">
                  {formatMeasurementValue(data.weightKg, 'kg')}
                </p>
                <p className="text-[10px] text-emerald-400 mt-0.5">
                  Meta: {athlete.targetWeightKg ? `${athlete.targetWeightKg} kg` : 'Não informado'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Estatura</span>
                <p className="text-2xl font-black text-white mt-1">
                  {formatMeasurementValue(data.heightCm, 'cm')}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Estatura declarada</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">% Gordura (BF)</span>
                <p className="text-2xl font-black text-blue-400 mt-1">
                  {formatMeasurementValue(data.bodyFatPercentage, '%')}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {data.bodyFatPercentage ? 'Aferição direta' : 'Não informado'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">IMC (Índice de Quetelet)</span>
                <p className="text-2xl font-black text-amber-400 mt-1">
                  {bmiResult.isCalculated ? `${bmiResult.bmi} kg/m²` : 'Não informado'}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5" title="Não infere composição corporal">
                  {bmiResult.classification}
                </p>
              </div>
            </div>

            {/* Circumferences Table */}
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="bg-white/10 px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center justify-between">
                <span>Perimetria Antropométrica (cm)</span>
                <span className="text-[10px] text-slate-400">Valores pontuais (medidas ausentes marcadas como 'Não informado')</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 divide-y md:divide-y-0 divide-x-0 md:divide-x divide-white/10 bg-white/5 text-xs">
                <div className="p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tórax / Peito:</span>
                    <span className="font-bold text-white">{formatMeasurementValue(data.chestCm)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ombros:</span>
                    <span className="font-bold text-white">{formatMeasurementValue(data.shouldersCm)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pescoço:</span>
                    <span className="font-bold text-white">{formatMeasurementValue(data.neckCm)}</span>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cintura:</span>
                    <span className="font-bold text-emerald-400">{formatMeasurementValue(data.waistCm)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Abdômen:</span>
                    <span className="font-bold text-emerald-400">{formatMeasurementValue(data.abdomenCm)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Glúteos:</span>
                    <span className="font-bold text-white">{formatMeasurementValue(data.glutesCm)}</span>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Braço Direito / Esq:</span>
                    <span className="font-bold text-white">
                      {formatMeasurementValue(data.rightArmCm)} / {formatMeasurementValue(data.leftArmCm)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coxa Direita / Esq:</span>
                    <span className="font-bold text-white">
                      {formatMeasurementValue(data.rightThighCm)} / {formatMeasurementValue(data.leftThighCm)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Panturrilhas:</span>
                    <span className="font-bold text-white">{formatMeasurementValue(data.calvesCm)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Observations */}
            {data.notes && (
              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-xs">
                <p className="font-bold text-blue-300 uppercase tracking-wider text-[10px] mb-1">
                  Parecer Técnico da Equipe Multidisciplinar:
                </p>
                <p className="text-slate-300 leading-relaxed">{data.notes}</p>
              </div>
            )}

            {/* Clinical Nota explicativa sobre IMC */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-400">
              <p>
                <strong className="text-slate-300 font-semibold">Nota clínica:</strong> O IMC é um indicador populacional de relação pondero-estatural (peso em relação à altura ao quadrado) e não reflete compartimentos de composição corporal (massa gorda ou massa muscular esquelética). A análise do físico de atletas e alunos baseia-se na perimetria, densidade e bioimpedância/dobras cutâneas.
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 text-center text-[10px]">
              <div>
                <div className="border-b border-white/20 pb-1 mb-1 font-semibold text-slate-200">
                  {athlete.coachName || 'Dr. Lucas Mendes'}
                </div>
                <span className="text-slate-400">Head Coach & Treinador</span>
              </div>
              <div>
                <div className="border-b border-white/20 pb-1 mb-1 font-semibold text-slate-200">
                  {athlete.nutritionistName || 'Dra. Marina Valente'}
                </div>
                <span className="text-slate-400">Nutricionista Esportiva CRN</span>
              </div>
              <div>
                <div className="border-b border-white/20 pb-1 mb-1 font-semibold text-slate-200">
                  {athlete.doctorName || 'Dr. Rodrigo Albuquerque'}
                </div>
                <span className="text-slate-400">Médico do Esporte CRM</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
