import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Activity,
  FileText,
  Plus,
  Scale,
  Calendar,
  Award,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Save,
  X,
  Shield,
  Stethoscope,
  Phone,
  KeyRound,
  CreditCard,
  LogOut,
  Camera
} from 'lucide-react';
import { AthleteProfile, AnthropometricData } from '../types';
import { soundFx } from '../utils/audio';
import { ChangeAvatarModal } from '../components/ChangeAvatarModal';

interface ProfileViewProps {
  athlete: AthleteProfile;
  onOpenReportModal: () => void;
  onSaveNewAssessment: (newAssessment: AnthropometricData) => void;
  onUpdateAvatar?: (newAvatarUrl: string) => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  athlete,
  onOpenReportModal,
  onSaveNewAssessment,
  onUpdateAvatar,
  onLogout
}) => {
  const history = athlete.measurementsHistory || [];
  const [selectedEvaluationIndex, setSelectedEvaluationIndex] = useState<number>(
    Math.max(0, history.length - 1)
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isChangeAvatarOpen, setIsChangeAvatarOpen] = useState<boolean>(false);

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

  const currentData: AnthropometricData = history[selectedEvaluationIndex] || history[history.length - 1] || defaultMeasurement;
  const previousData = selectedEvaluationIndex > 0 ? history[selectedEvaluationIndex - 1] : null;

  // BMI calculations
  const bmi = (currentData.weightKg / Math.pow(currentData.heightCm / 100, 2)).toFixed(1);
  const bmiNum = parseFloat(bmi);

  let bmiClassification = 'Normal (Massa Magra Atlética)';
  if (bmiNum < 18.5) bmiClassification = 'Abaixo do peso';
  else if (bmiNum >= 25 && bmiNum < 29.9) bmiClassification = 'Sobrepeso Ponderal (Alto Índice Muscular)';
  else if (bmiNum >= 30) bmiClassification = 'Densidade Muscular Avançada';

  // New assessment form state
  const [newForm, setNewForm] = useState<Partial<AnthropometricData>>({
    date: new Date().toISOString().split('T')[0],
    weightKg: athlete.currentWeightKg,
    heightCm: athlete.heightCm,
    bodyFatPercentage: 9.5,
    muscleMassKg: 41.0,
    chestCm: 112.5,
    shouldersCm: 129.0,
    waistCm: 77.5,
    abdomenCm: 80.0,
    rightArmCm: 41.8,
    leftArmCm: 41.5,
    rightThighCm: 63.0,
    leftThighCm: 62.8,
    calvesCm: 40.5,
    glutesCm: 101.5,
    neckCm: 39.5,
    notes: 'Excelente resposta muscular com aumento de volume de braços e redução de cintura.'
  });

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    if (newForm.weightKg && newForm.heightCm) {
      onSaveNewAssessment(newForm as AnthropometricData);
      setIsAddModalOpen(false);
      setSelectedEvaluationIndex(athlete.measurementsHistory.length);
    }
  };

  const getDelta = (curr: number, prev: number | undefined) => {
    if (prev === undefined) return null;
    const diff = Number((curr - prev).toFixed(1));
    if (diff === 0) return { val: '0', isPositive: null };
    return {
      val: diff > 0 ? `+${diff}` : `${diff}`,
      isPositive: diff > 0
    };
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Profile Header Card (#1565C0 Cobalt Blue Theme) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl liquid-glass hero-profile p-6 sm:p-7 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              onClick={() => {
                soundFx.playClick();
                setIsChangeAvatarOpen(true);
              }}
              className="relative group cursor-pointer shrink-0"
              title="Clique para alterar foto de perfil"
            >
              <img
                src={athlete.avatar}
                alt={athlete.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-blue-400 group-hover:ring-cyan-300 shadow-xl transition"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-xs">
                <Camera className="w-5 h-5 text-cyan-300" />
                <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Alterar</span>
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 p-1 rounded-lg bg-blue-600 border border-white/20 text-white shadow-md">
                <Camera className="w-3 h-3" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white">
                  {athlete.category}
                </span>
                <span className="text-xs text-blue-300 font-semibold">{athlete.goal}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                {athlete.name}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {athlete.email} • {athlete.age} Anos • Status: <span className="text-emerald-400 font-bold">{athlete.status}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[11px]">
                  <CreditCard className="w-3 h-3 text-cyan-400" />
                  <span>CPF: {athlete.cpf || '123.456.789-00'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[11px]">
                  <Phone className="w-3 h-3 text-cyan-400" />
                  <span>ID / Tel: {athlete.phone || '(11) 98765-4321'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-[11px]">
                  <KeyRound className="w-3 h-3 text-blue-400" />
                  <span>Senha Prescritor: {athlete.accessPassword || 'lmteam2026'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons: New evaluation, PDF Report & Logout */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                soundFx.playClick();
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 shadow-lg transition"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" /> Nova Reavaliação
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenReportModal();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xl shadow-blue-950/50 transition"
            >
              <FileText className="w-3.5 h-3.5" /> Laudo PDF
            </button>
            {onLogout && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  onLogout();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30 transition"
                title="Sair da conta e voltar ao login"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>
        </div>

        {/* Clinical Multidisciplinary Team Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
            <Shield className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Head Coach</p>
              <p className="text-white font-bold truncate">{athlete.coachName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
            <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Nutrição Esportiva</p>
              <p className="text-white font-bold truncate">{athlete.nutritionistName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
            <Stethoscope className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Medicina do Esporte</p>
              <p className="text-white font-bold truncate">{athlete.doctorName}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Date History Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
          Histórico de Avaliações:
        </span>
        {athlete.measurementsHistory.map((hist, index) => {
          const isSelected = selectedEvaluationIndex === index;
          return (
            <button
              key={index}
              onClick={() => {
                soundFx.playClick();
                setSelectedEvaluationIndex(index);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-900/40'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(hist.date).toLocaleDateString('pt-BR')}</span>
              {index === athlete.measurementsHistory.length - 1 && (
                <span className="px-1.5 py-0.2 rounded bg-white/20 text-[9px] font-black uppercase">Atual</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Top Body Composition Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-3xl liquid-glass border border-white/10"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="uppercase font-bold text-[10px]">Peso Corporal</span>
            <Scale className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {currentData.weightKg} <span className="text-xs font-normal text-slate-400">kg</span>
          </p>
          {previousData && (
            <div className="flex items-center gap-1 text-[11px] font-bold mt-1">
              {currentData.weightKg > previousData.weightKg ? (
                <span className="text-emerald-400 flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{(currentData.weightKg - previousData.weightKg).toFixed(1)} kg
                </span>
              ) : (
                <span className="text-amber-400 flex items-center">
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {(currentData.weightKg - previousData.weightKg).toFixed(1)} kg
                </span>
              )}
              <span className="text-slate-500 font-normal">vs anterior</span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-3xl liquid-glass border border-white/10"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="uppercase font-bold text-[10px]">Estatura</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {currentData.heightCm} <span className="text-xs font-normal text-slate-400">cm</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">1.78m aferido</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-3xl liquid-glass border border-white/10"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="uppercase font-bold text-[10px]">% Gordura (BF)</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400">
            {currentData.bodyFatPercentage}%
          </p>
          <p className="text-[11px] text-emerald-400/90 font-semibold mt-1">Nível Competitivo</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-3xl liquid-glass border border-white/10"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="uppercase font-bold text-[10px]">IMC Automático</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400">
            {bmi}
          </p>
          <p className="text-[10px] text-slate-400 truncate mt-1">{bmiClassification}</p>
        </motion.div>
      </div>

      {/* Comprehensive Circumference Measurement Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl liquid-glass border border-white/10 p-6 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Perimetria & Circunferências Corporais (cm)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Medidas aferidas em repouso conforme protocolo ISAK com fita metálica
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            Data: {new Date(currentData.date).toLocaleDateString('pt-BR')}
          </span>
        </div>

        {/* Circumference Table Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Upper Body Column */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5">
            <h4 className="text-xs uppercase font-extrabold text-blue-400 tracking-wider">Tronco & Ombros</h4>
            
            <div className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
              <span className="text-slate-300">Tórax / Peitoral:</span>
              <div className="text-right">
                <span className="font-extrabold text-white">{currentData.chestCm} cm</span>
                {previousData && (
                  <span className="text-[10px] ml-2 text-emerald-400 font-bold">
                    {getDelta(currentData.chestCm, previousData.chestCm)?.val} cm
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
              <span className="text-slate-300">Ombros (Cintura Escapular):</span>
              <div className="text-right">
                <span className="font-extrabold text-white">{currentData.shouldersCm} cm</span>
                {previousData && (
                  <span className="text-[10px] ml-2 text-emerald-400 font-bold">
                    {getDelta(currentData.shouldersCm, previousData.shouldersCm)?.val} cm
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-300">Pescoço:</span>
              <div className="text-right">
                <span className="font-extrabold text-white">{currentData.neckCm} cm</span>
                {previousData && (
                  <span className="text-[10px] ml-2 text-slate-400 font-bold">
                    {getDelta(currentData.neckCm, previousData.neckCm)?.val} cm
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Core & Waist Column */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5">
            <h4 className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">Cintura & Abdômen</h4>
            
            <div className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
              <span className="text-slate-300">Cintura (Menor Perímetro):</span>
              <div className="text-right">
                <span className="font-extrabold text-emerald-400">{currentData.waistCm} cm</span>
                {previousData && (
                  <span className="text-[10px] ml-2 text-emerald-400 font-bold">
                    {getDelta(currentData.waistCm, previousData.waistCm)?.val} cm
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
              <span className="text-slate-300">Abdômen (Cicatriz Umbilical):</span>
              <div className="text-right">
                <span className="font-extrabold text-emerald-400">{currentData.abdomenCm} cm</span>
                {previousData && (
                  <span className="text-[10px] ml-2 text-emerald-400 font-bold">
                    {getDelta(currentData.abdomenCm, previousData.abdomenCm)?.val} cm
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-300">Glúteos / Quadril:</span>
              <div className="text-right">
                <span className="font-extrabold text-white">{currentData.glutesCm} cm</span>
                {previousData && (
                  <span className="text-[10px] ml-2 text-blue-400 font-bold">
                    {getDelta(currentData.glutesCm, previousData.glutesCm)?.val} cm
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Limbs (Arms & Legs) Column */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5">
            <h4 className="text-xs uppercase font-extrabold text-purple-400 tracking-wider">Membros (Braços & Pernas)</h4>
            
            <div className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
              <span className="text-slate-300">Braço Direito / Esquerdo:</span>
              <div className="text-right">
                <span className="font-extrabold text-white">{currentData.rightArmCm} / {currentData.leftArmCm} cm</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
              <span className="text-slate-300">Coxa Direita / Esquerda:</span>
              <div className="text-right">
                <span className="font-extrabold text-white">{currentData.rightThighCm} / {currentData.leftThighCm} cm</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-300">Panturrilhas:</span>
              <div className="text-right">
                <span className="font-extrabold text-white">{currentData.calvesCm} cm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical notes box */}
        {currentData.notes && (
          <div className="mt-5 p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-xs">
            <p className="text-blue-300 font-bold uppercase tracking-wider text-[10px] mb-1">Notas da Avaliação:</p>
            <p className="text-slate-300 leading-relaxed">{currentData.notes}</p>
          </div>
        )}
      </motion.div>

      {/* Add Assessment Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-3xl liquid-glass border border-white/15 p-6 shadow-2xl my-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Scale className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">Cadastrar Nova Reavaliação Física</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4 pt-4 max-h-[75vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Data da Avaliação</label>
                    <input
                      type="date"
                      value={newForm.date}
                      onChange={(e) => setNewForm({ ...newForm, date: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newForm.weightKg}
                      onChange={(e) => setNewForm({ ...newForm, weightKg: parseFloat(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">% Gordura (BF)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newForm.bodyFatPercentage}
                      onChange={(e) => setNewForm({ ...newForm, bodyFatPercentage: parseFloat(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs font-bold text-blue-400 uppercase mb-2">Circunferências (cm)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400">Tórax / Peito</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newForm.chestCm}
                        onChange={(e) => setNewForm({ ...newForm, chestCm: parseFloat(e.target.value) })}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Ombros</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newForm.shouldersCm}
                        onChange={(e) => setNewForm({ ...newForm, shouldersCm: parseFloat(e.target.value) })}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Cintura</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newForm.waistCm}
                        onChange={(e) => setNewForm({ ...newForm, waistCm: parseFloat(e.target.value) })}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Abdômen</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newForm.abdomenCm}
                        onChange={(e) => setNewForm({ ...newForm, abdomenCm: parseFloat(e.target.value) })}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Braço Direito</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newForm.rightArmCm}
                        onChange={(e) => setNewForm({ ...newForm, rightArmCm: parseFloat(e.target.value) })}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Coxa Direita</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newForm.rightThighCm}
                        onChange={(e) => setNewForm({ ...newForm, rightThighCm: parseFloat(e.target.value) })}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Observações Clínicas</label>
                  <textarea
                    rows={2}
                    value={newForm.notes}
                    onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg"
                  >
                    <Save className="w-4 h-4" /> Salvar Avaliação
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Avatar Modal for Student */}
      <ChangeAvatarModal
        isOpen={isChangeAvatarOpen}
        onClose={() => setIsChangeAvatarOpen(false)}
        title="Alterar Foto de Perfil do Aluno"
        subtitle={`Atualize a foto de perfil de ${athlete.name} com arquivo do seu dispositivo ou câmera.`}
        currentAvatar={athlete.avatar}
        onSaveAvatar={(newAvatarUrl) => {
          if (onUpdateAvatar) {
            onUpdateAvatar(newAvatarUrl);
          }
        }}
      />
    </div>
  );
};
