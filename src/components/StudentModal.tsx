import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserPlus,
  UserCheck,
  X,
  Phone,
  CreditCard,
  Calendar,
  KeyRound,
  ShieldCheck,
  Scale,
  Ruler,
  Target,
  Sparkles,
  AlertCircle,
  Save,
  Check
} from 'lucide-react';
import { AthleteProfile } from '../types';
import { soundFx } from '../utils/audio';
import { ImageUploader } from './ImageUploader';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (athlete: AthleteProfile) => void;
  athleteToEdit?: AthleteProfile | null;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
];

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  athleteToEdit
}) => {
  const isEditing = Boolean(athleteToEdit);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [accessPassword, setAccessPassword] = useState('lmteam2026');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Avançado / Classic Physique');
  const [goal, setGoal] = useState<'Hipertrofia' | 'Cutting' | 'Manutenção' | 'Recomposição'>('Hipertrofia');
  const [status, setStatus] = useState<'Ativo' | 'Inativo' | 'Em Avaliação' | 'Fase de Pico'>('Ativo');
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(75);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(78);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATARS[0]);
  const [trainingDays, setTrainingDays] = useState<number>(5);
  const [cardioDays, setCardioDays] = useState<number>(6);

  // Validation & Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (athleteToEdit) {
      setName(athleteToEdit.name || '');
      setPhone(athleteToEdit.phone || '');
      setCpf(athleteToEdit.cpf || '');
      setBirthDate(athleteToEdit.birthDate || '1998-05-15');
      setAccessPassword(athleteToEdit.accessPassword || 'lmteam2026');
      setEmail(athleteToEdit.email || '');
      setCategory(athleteToEdit.category || 'Avançado / Classic Physique');
      setGoal(athleteToEdit.goal || 'Hipertrofia');
      setStatus(athleteToEdit.status || 'Ativo');
      setCurrentWeightKg(athleteToEdit.currentWeightKg || 75);
      setTargetWeightKg(athleteToEdit.targetWeightKg || 78);
      setHeightCm(athleteToEdit.heightCm || 175);
      setAvatar(athleteToEdit.avatar || DEFAULT_AVATARS[0]);
      setTrainingDays(athleteToEdit.trainingDaysPerWeek || 5);
      setCardioDays(athleteToEdit.cardioDaysPerWeek || 6);
    } else {
      setName('');
      setPhone('(11) 9');
      setCpf('');
      setBirthDate('2000-01-15');
      setAccessPassword('lmteam2026');
      setEmail('');
      setCategory('Avançado / Classic Physique');
      setGoal('Hipertrofia');
      setStatus('Ativo');
      setCurrentWeightKg(76.5);
      setTargetWeightKg(80.0);
      setHeightCm(178);
      setAvatar(DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)]);
      setTrainingDays(5);
      setCardioDays(6);
    }
    setErrorMessage(null);
  }, [athleteToEdit, isOpen]);

  // Mask Helpers
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) {
      setPhone('');
    } else if (digits.length <= 2) {
      setPhone(`(${digits}`);
    } else if (digits.length <= 7) {
      setPhone(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);
    } else {
      setPhone(`(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`);
    }
    if (errorMessage) setErrorMessage(null);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) {
      setCpf(digits);
    } else if (digits.length <= 6) {
      setCpf(`${digits.slice(0, 3)}.${digits.slice(3)}`);
    } else if (digits.length <= 9) {
      setCpf(`${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`);
    } else {
      setCpf(`${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`);
    }
    if (errorMessage) setErrorMessage(null);
  };

  // Calculate age from birthDate
  const calculateAge = (dateStr: string): number => {
    if (!dateStr) return 25;
    const birth = new Date(dateStr);
    if (isNaN(birth.getTime())) return 25;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? age : 18;
  };

  const currentAge = calculateAge(birthDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();

    // Validations
    if (!name.trim()) {
      soundFx.playRestAlert();
      setErrorMessage('Por favor, informe o nome completo do aluno.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      soundFx.playRestAlert();
      setErrorMessage('Por favor, informe um telefone/WhatsApp válido com DDD.');
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      soundFx.playRestAlert();
      setErrorMessage('Por favor, informe o CPF completo com 11 dígitos.');
      return;
    }

    if (!birthDate) {
      soundFx.playRestAlert();
      setErrorMessage('Por favor, selecione a data de nascimento.');
      return;
    }

    const calculatedAge = calculateAge(birthDate);

    const athletePayload: AthleteProfile = {
      id: athleteToEdit?.id || `ath-${Date.now()}`,
      name: name.trim(),
      avatar: avatar || DEFAULT_AVATARS[0],
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@lmteam.com`,
      phone: phone.trim(),
      cpf: cpf.trim(),
      birthDate: birthDate,
      accessPassword: accessPassword.trim() || 'lmteam2026',
      age: calculatedAge,
      category: category,
      coachName: athleteToEdit?.coachName || 'Dr. Lucas Mendes (Head Coach)',
      nutritionistName: athleteToEdit?.nutritionistName || 'Dra. Marina Valente (Nutricionista Esportiva)',
      doctorName: athleteToEdit?.doctorName || 'Dr. Rodrigo Albuquerque (Médico do Esporte)',
      goal: goal,
      status: status,
      currentWeightKg: Number(currentWeightKg) || 75,
      targetWeightKg: Number(targetWeightKg) || 78,
      heightCm: Number(heightCm) || 175,
      adherencePercentage: athleteToEdit?.adherencePercentage || 95,
      measurementsHistory: athleteToEdit?.measurementsHistory || [
        {
          date: new Date().toISOString().split('T')[0],
          weightKg: Number(currentWeightKg) || 75,
          heightCm: Number(heightCm) || 175,
          bodyFatPercentage: 12.5,
          muscleMassKg: 38.0,
          chestCm: 104.0,
          shouldersCm: 120.0,
          waistCm: 80.0,
          abdomenCm: 82.0,
          rightArmCm: 38.5,
          leftArmCm: 38.0,
          rightThighCm: 59.0,
          leftThighCm: 58.5,
          calvesCm: 38.0,
          glutesCm: 98.0,
          neckCm: 38.5,
          notes: 'Cadastro inicial de protocolo e avaliação física.'
        }
      ],
      trainingDaysPerWeek: Number(trainingDays) || 5,
      cardioDaysPerWeek: Number(cardioDays) || 6,
      cardioTargetKcal: athleteToEdit?.cardioTargetKcal || 300
    };

    soundFx.playSuccess();
    onSave(athletePayload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl rounded-3xl modal-liquid-glass border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6 z-10 my-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-900/40">
              {isEditing ? <UserCheck className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                {isEditing ? 'Gestão de Cadastro' : 'Prescritor • Novo Aluno'}
              </span>
              <h3 className="text-xl font-black text-white">
                {isEditing ? 'Editar Dados do Aluno' : 'Cadastrar Novo Aluno'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Selector with Photo Upload */}
          <ImageUploader
            currentImage={avatar}
            onImageSelected={(newAvatar) => setAvatar(newAvatar)}
            presetAvatars={DEFAULT_AVATARS}
            label="Foto de Perfil do Aluno"
            helperText="Envie uma foto do dispositivo (computador ou celular) ou selecione um modelo da equipe."
            size="md"
          />

          {/* Section 1: Dados Pessoais Obrigatórios (Nome, Telefone, CPF, Nascimento) */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Dados Obrigatórios de Identificação</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome Completo */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-200">
                  Nome Completo <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Emanuel Caires Silva"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 focus:border-cyan-400 text-white text-xs placeholder:text-slate-500 outline-none transition"
                />
              </div>

              {/* Telefone / WhatsApp */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-cyan-400" />
                    <span>Telefone / WhatsApp <span className="text-rose-400">*</span></span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ID de Acesso</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(11) 98765-4321"
                  maxLength={15}
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 focus:border-cyan-400 text-white font-mono text-xs placeholder:text-slate-500 outline-none transition"
                />
              </div>

              {/* CPF */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-cyan-400" />
                    <span>CPF do Aluno <span className="text-rose-400">*</span></span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">999.999.999-99</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="123.456.789-00"
                  maxLength={14}
                  value={cpf}
                  onChange={handleCpfChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 focus:border-cyan-400 text-white font-mono text-xs placeholder:text-slate-500 outline-none transition"
                />
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cyan-400" />
                    <span>Data de Nascimento <span className="text-rose-400">*</span></span>
                  </span>
                  <span className="text-[10px] text-cyan-300 font-bold">
                    {currentAge} anos
                  </span>
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => {
                    setBirthDate(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 focus:border-cyan-400 text-white text-xs outline-none transition"
                />
              </div>

              {/* Senha de Acesso do Prescritor */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-indigo-400" />
                    <span>Senha de Acesso do Aluno</span>
                  </span>
                  <span className="text-[10px] text-indigo-300 font-mono">Login</span>
                </label>
                <input
                  type="text"
                  placeholder="lmteam2026"
                  value={accessPassword}
                  onChange={(e) => setAccessPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 focus:border-indigo-400 text-white font-mono text-xs outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Parâmetros Clínicos & Status */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              <span>Parâmetros de Consultoria & Status</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status do Aluno */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200">Status no Time</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:border-indigo-400 outline-none"
                >
                  <option value="Ativo">🟢 Ativo</option>
                  <option value="Inativo">⚪ Inativo (Pausado)</option>
                  <option value="Em Avaliação">🟡 Em Avaliação</option>
                  <option value="Fase de Pico">🟣 Fase de Pico (Pre-contest)</option>
                </select>
              </div>

              {/* Objetivo */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200">Objetivo</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:border-indigo-400 outline-none"
                >
                  <option value="Hipertrofia">Hipertrofia</option>
                  <option value="Cutting">Cutting</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Recomposição">Recomposição</option>
                </select>
              </div>

              {/* Categoria */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200">Categoria / Nível</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:border-indigo-400 outline-none"
                >
                  <option value="Avançado / Classic Physique">Avançado / Classic Physique</option>
                  <option value="Wellness Master">Wellness Master</option>
                  <option value="Open Bodybuilding">Open Bodybuilding</option>
                  <option value="Bikini Fitness">Bikini Fitness</option>
                  <option value="Mens Physique">Mens Physique</option>
                  <option value="Intermediário / Hipertrofia">Intermediário / Hipertrofia</option>
                  <option value="Iniciante / Saúde">Iniciante / Saúde</option>
                </select>
              </div>

              {/* Peso Atual */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                  <Scale className="w-3 h-3 text-slate-400" />
                  <span>Peso Atual (kg)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={currentWeightKg}
                  onChange={(e) => setCurrentWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:border-indigo-400 outline-none font-bold"
                />
              </div>

              {/* Meta de Peso */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                  <Target className="w-3 h-3 text-slate-400" />
                  <span>Meta de Peso (kg)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:border-indigo-400 outline-none font-bold"
                />
              </div>

              {/* Altura */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                  <Ruler className="w-3 h-3 text-slate-400" />
                  <span>Altura (cm)</span>
                </label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:border-indigo-400 outline-none font-bold"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-xl shadow-indigo-950/50 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Aluno no Time'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
