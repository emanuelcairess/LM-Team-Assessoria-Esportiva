export type UserRole = 'athlete' | 'coach' | 'admin';

export type PrescriberRoleType =
  | 'Head Coach'
  | 'Nutricionista'
  | 'Médico do Esporte'
  | 'Fisioterapeuta'
  | 'Preparador Físico'
  | 'Endocrinologista'
  | 'Personal Trainer'
  | 'Administrador Geral';

export interface PrescriberProfile {
  id: string;
  name: string;
  roleType: PrescriberRoleType | string; // Função (Head Coach, Nutricionista, Médico, etc.)
  phone: string; // Telefone: (99) 99999-9999
  birthDate: string; // Data de nascimento: YYYY-MM-DD
  email: string;
  accessPassword?: string;
  avatar?: string;
  isMaster: boolean; // Prescritor Master (pode cadastrar outros prescritores)
  isAdmin?: boolean; // Perfil Administrador Geral
  status: 'Ativo' | 'Inativo';
  crm_crn_cref?: string; // Registro de conselho profissional
  bio?: string;
  createdAt?: string;
  requiresPasswordChange?: boolean; // Se deve forçar alteração de senha no primeiro login
  passwordChangedAt?: string; // Data da última alteração de senha
  createdBy?: {
    id: string;
    name: string;
    role: string;
  };
}

export type ModuleType =
  | 'dashboard'
  | 'profile'
  | 'nutrition'
  | 'workout'
  | 'supplements'
  | 'recipes'
  | 'progress'
  | 'coach_admin';

export interface AnthropometricData {
  date: string;
  weightKg: number;
  heightCm: number;
  bodyFatPercentage: number;
  muscleMassKg: number;
  chestCm: number;
  shouldersCm: number;
  waistCm: number;
  abdomenCm: number;
  rightArmCm: number;
  leftArmCm: number;
  rightThighCm: number;
  leftThighCm: number;
  calvesCm: number;
  glutesCm: number;
  neckCm: number;
  photos?: {
    front?: string;
    back?: string;
    side?: string;
  };
  notes?: string;
}

export interface AthleteProfile {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone?: string; // Formato: (99) 99999-9999
  cpf?: string; // Formato: 999.999.999-99
  birthDate?: string; // Formato: YYYY-MM-DD
  accessPassword?: string; // Senha cadastrada pelo usuário prescritor
  age: number;
  category: string; // e.g. "Avançado / Classic Physique"
  coachName: string;
  nutritionistName: string;
  doctorName: string;
  goal: 'Hipertrofia' | 'Cutting' | 'Manutenção' | 'Recomposição';
  status: 'Ativo' | 'Inativo' | 'Em Avaliação' | 'Fase de Pico';
  currentWeightKg: number;
  targetWeightKg: number;
  heightCm: number;
  adherencePercentage: number;
  measurementsHistory: AnthropometricData[];
  trainingDaysPerWeek: number;
  cardioDaysPerWeek: number;
  cardioTargetKcal: number;
}

export interface FoodItem {
  id: string;
  name: string;
  portion: string;
  amountGrams: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  caloriesKcal: number;
  category: 'proteina' | 'carboidrato' | 'gordura' | 'vegetal' | 'suplemento';
  isCompleted?: boolean;
}

export interface Meal {
  id: string;
  number: number;
  name: string;
  timeSchedule: string;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  targetCaloriesKcal: number;
  foods: FoodItem[];
  isCompleted: boolean;
  notes?: string;
}

export interface NutritionPlan {
  dailyTargetCalories: number;
  dailyTargetProteinG: number;
  dailyTargetCarbsG: number;
  dailyTargetFatG: number;
  waterIntakeLiters: number;
  meals: Meal[];
}

export type TechniqueType =
  | 'Normal'
  | 'Drop set'
  | 'Back-off set'
  | 'Cluster set'
  | 'Rest-pause'
  | 'Warm-up'
  | 'Falha Concêntrica';

export interface LibraryExercise {
  id: string;
  name: string;
  targetMuscle: string;
  subMuscle?: string;
  equipment?: string; // e.g. "Halteres", "Barra", "Polia / Cabo", "Máquina", "Smith", "Peso Corporal"
  defaultRestSeconds: number;
  defaultSetsCount?: number;
  defaultRepsTarget?: string;
  defaultTechnique?: TechniqueType;
  cadence?: string;
  technicalNotes?: string;
  videoDemoUrl?: string;
  tags?: string[];
  isCustom?: boolean;
  createdAt?: string;
  usageCount?: number;
}

export interface ExerciseSet {
  setNumber: number;
  repsTarget: string; // e.g. "8-10" or "12-15"
  weightKgLogged?: number;
  technique: TechniqueType;
  isCompleted: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
}

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: string;
  restSeconds: number; // e.g. 70 to 90s
  sets: ExerciseSet[];
  technicalNotes?: string;
  videoDemoUrl?: string;
  cadence?: string; // e.g. "3010"
}

export interface WorkoutCardioOrientation {
  enabled: boolean;
  type: string; // e.g. "Esteira Inclinada", "Bike Ergométrica", "Escada / Stairmaster", "LISS em Jejum", "HIIT", "Elíptico"
  durationMinutes: number;
  intensity: string; // e.g. "Zona 2 (120-135 BPM)", "Moderada Contínua", "HIIT 15s/45s", "Alta Intensidade"
  targetKcal: number;
  heartRateZone?: string;
  instructions?: string; // Orientação detalhada do treinador para o cardio do dia
  timing?: 'Pós-Treino' | 'Em Jejum (Manhã)' | 'Horário Oposto' | 'Antes do Treino';
  isCompletedToday?: boolean;
}

export type WorkoutSplitCode =
  | 'Treino A'
  | 'Treino B'
  | 'Treino C'
  | 'Treino D'
  | 'Treino E'
  | 'Treino F'
  | 'Treino G'
  | 'Cardio'
  | string;

export interface WorkoutSplit {
  id: string;
  code: WorkoutSplitCode;
  name: string;
  dayOfWeek: string;
  targetMuscleGroups: string[];
  estimatedDurationMinutes: number;
  exercises: Exercise[];
  isCompletedToday?: boolean;
  cardioProtocol?: {
    type: string; // e.g. "Esteira Inclinada / Bike"
    durationMinutes: number;
    intensity: string;
    targetKcal: number;
    heartRateZone: string;
  };
  cardioOrientation?: WorkoutCardioOrientation;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Hipertrofia' | 'Cutting / Definição' | 'Força / Power' | 'FST-7 & Volume' | 'Upper / Lower' | 'Push / Pull / Legs' | 'Cardio & Queima';
  split: WorkoutSplit;
  targetMuscleGroups: string[];
  exercisesCount: number;
  estimatedDurationMinutes: number;
  isOfficial?: boolean;
  createdAt: string;
}

export type SupplementCategory =
  | 'geral'
  | 'intra_treino'
  | 'sono_relaxamento'
  | 'saude_cardiovascular'
  | 'manipulado'
  | 'termogenico_energia'
  | 'articular_colageno'
  | 'digestivo_intestinal';

export interface FormulaComponent {
  id: string;
  name: string;
  amount: string; // e.g. "600mg", "10g", "5.000 UI"
  purpose?: string; // e.g. "Antioxidante / Hepatoprotetor"
}

export interface SupplementItem {
  id: string;
  name: string;
  dosage: string;
  schedule: string;
  category: SupplementCategory;
  benefits: string;
  ingredients?: string[];
  components?: FormulaComponent[];
  isTakenToday: boolean;
  doctorNotes?: string;
  prescribedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplementFormulaTemplate {
  id: string;
  name: string;
  description: string;
  category: SupplementCategory;
  dosage: string;
  schedule: string;
  benefits: string;
  ingredients: string[];
  components?: FormulaComponent[];
  doctorNotes?: string;
  isOfficial?: boolean;
  createdBy?: string;
  createdAt: string;
}

export interface FitRecipe {
  id: string;
  title: string;
  category: 'Doce Proteico' | 'Salgado Fit' | 'Lanche Rápido' | 'Refeição Principal';
  prepTimeMinutes: number;
  difficulty: 'Fácil' | 'Médio' | 'Rápido';
  proteinG: number;
  carbsG: number;
  fatG: number;
  caloriesKcal: number;
  servings: number;
  image: string;
  ingredients: string[];
  instructions: string[];
  tips?: string;
}

export interface FoodSubstitution {
  baseFoodName: string;
  baseAmountG: number;
  baseMacroCategory: 'carboidrato' | 'proteina' | 'gordura';
  options: {
    name: string;
    equivalentGrams: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    observation?: string;
  }[];
}

// ==========================================
// OFFLINE-FIRST & CLOUD SYNC ARCHITECTURE TYPES
// ==========================================

export type SyncState = 'synced' | 'pending_insert' | 'pending_update' | 'pending_delete' | 'sync_error' | 'syncing';

export type SyncEntityDomain = 
  | 'athlete'
  | 'prescriber_profile'
  | 'prescription_workout'
  | 'prescription_nutrition'
  | 'prescription_supplement'
  | 'workout_template'
  | 'formula_template'
  | 'exercise_library'
  | 'checkin_exercise_set'
  | 'checkin_meal'
  | 'checkin_supplement'
  | 'checkin_anthropometric';

export interface PendingSyncItem {
  id: string; // UUID of the sync log
  entityId: string;
  domain: SyncEntityDomain;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payloadJson: string;
  createdAt: number;
  retryCount: number;
  lastErrorMessage?: string;
}

export interface CloudSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingCount: number;
  cloudProvider: 'Supabase' | 'Firestore';
  prescriptionVersion: number;
  checkInSyncQueue: PendingSyncItem[];
}
