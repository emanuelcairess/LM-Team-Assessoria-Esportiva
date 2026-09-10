import {
  NutritionPlan,
  WorkoutSplit,
  SupplementItem,
  AnthropometricData
} from '../types';
import {
  ATHLETE_INITIAL_PLANS,
  INITIAL_NUTRITION_PLAN,
  WORKOUT_SPLITS,
  SUPPLEMENT_PROTOCOLS
} from '../data/mockData';
import { syncService } from './syncService';

/**
 * Retorna o identificador único do escopo do usuário autenticado.
 * Garante que dados e check-ins fiquem isolados por usuário e por atleta.
 */
export function getUserScope(
  firebaseUid?: string | null,
  sessionType?: 'athlete' | 'prescriber' | null,
  prescriberId?: string | null,
  athleteId?: string | null
): string {
  if (firebaseUid && firebaseUid.trim()) {
    return `uid_${firebaseUid.trim()}`;
  }
  if (sessionType === 'prescriber' && prescriberId) {
    return `presc_${prescriberId}`;
  }
  if (sessionType === 'athlete' && athleteId) {
    return `ath_${athleteId}`;
  }
  return 'usr_default';
}

/**
 * Retorna a chave de armazenamento isolada por escopo de usuário e por atleta.
 */
export function getAthleteStorageKey(
  domain: 'nutrition' | 'workouts' | 'supplements' | 'checkins',
  userScope: string,
  athleteId: string
): string {
  return `lm_team_${domain}_${userScope}_${athleteId}`;
}

/**
 * Formata um valor de medida antropométrica.
 * Se a medida for nula, indefinida, NaN ou menor/igual a zero, retorna "Não informado".
 */
export function formatMeasurementValue(
  value: number | undefined | null,
  unit: string = 'cm'
): string {
  if (value === undefined || value === null || isNaN(value) || value <= 0) {
    return 'Não informado';
  }
  return `${value} ${unit}`.trim();
}

export interface BmiResult {
  bmi: string | null;
  bmiNumber: number | null;
  classification: string;
  isCalculated: boolean;
}

/**
 * Calcula o IMC sem inferir composição corporal (gordura ou massa magra).
 * Retorna "Não informado" se peso ou estatura estiverem ausentes.
 */
export function calculateBmi(
  weightKg?: number | null,
  heightCm?: number | null
): BmiResult {
  if (
    weightKg === undefined ||
    weightKg === null ||
    isNaN(weightKg) ||
    weightKg <= 0 ||
    heightCm === undefined ||
    heightCm === null ||
    isNaN(heightCm) ||
    heightCm <= 0
  ) {
    return {
      bmi: null,
      bmiNumber: null,
      classification: 'Não informado',
      isCalculated: false
    };
  }

  const heightM = heightCm / 100;
  const bmiNum = Number((weightKg / (heightM * heightM)).toFixed(1));

  // Classificação clínica padronizada pela OMS (relação peso/estatura apenas)
  let classification = 'Eutrofia (Peso adequado)';
  if (bmiNum < 18.5) {
    classification = 'Baixo peso';
  } else if (bmiNum < 25.0) {
    classification = 'Eutrofia (Peso adequado)';
  } else if (bmiNum < 30.0) {
    classification = 'Sobrepeso';
  } else if (bmiNum < 35.0) {
    classification = 'Obesidade Grau I';
  } else if (bmiNum < 40.0) {
    classification = 'Obesidade Grau II';
  } else {
    classification = 'Obesidade Grau III';
  }

  return {
    bmi: bmiNum.toFixed(1),
    bmiNumber: bmiNum,
    classification,
    isCalculated: true
  };
}

/**
 * Calcula a variação (delta) entre duas medições temporais.
 * Se qualquer um dos valores estiver ausente ou inválido, NÃO calcula o indicador
 * e retorna "Não informado".
 */
export function calculateDelta(
  latest?: number | null,
  initial?: number | null,
  unit: string = ''
): string {
  if (
    latest === undefined ||
    latest === null ||
    isNaN(latest) ||
    latest <= 0 ||
    initial === undefined ||
    initial === null ||
    isNaN(initial) ||
    initial <= 0
  ) {
    return 'Não informado';
  }

  const diff = Number((latest - initial).toFixed(1));
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff} ${unit}`.trim();
}

/**
 * Verifica se a avaliação antropométrica possui aprovação válida.
 * APROVADO SOMENTE SE HOUVER PROFISSIONAL E DATA DE VALIDAÇÃO REGISTRADOS.
 */
export function isEvaluationApproved(
  evaluation?: Partial<AnthropometricData> | null
): boolean {
  if (!evaluation) return false;

  const hasProfessional = Boolean(
    evaluation.validatedBy?.name && evaluation.validatedBy.name.trim().length > 0
  );

  const hasValidationDate = Boolean(
    evaluation.validatedAt && evaluation.validatedAt.trim().length > 0
  );

  return hasProfessional && hasValidationDate;
}

export class AthleteDataService {
  /**
   * Carrega o plano nutricional do atleta isolado por escopo de usuário.
   */
  public async loadNutritionPlan(
    userScope: string,
    athleteId: string
  ): Promise<NutritionPlan> {
    const key = getAthleteStorageKey('nutrition', userScope, athleteId);

    // 1. Tenta carregar do cache local isolado
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.meals) && parsed.meals.length > 0) {
          return parsed;
        }
      }
    } catch {}

    // 2. Tenta carregar do Firestore se conectado
    try {
      const cloudPlan = await syncService.loadNutritionPlanFromFirestore(athleteId);
      if (cloudPlan && Array.isArray(cloudPlan.meals) && cloudPlan.meals.length > 0) {
        this.saveNutritionPlan(userScope, athleteId, cloudPlan);
        return cloudPlan;
      }
    } catch {}

    // 3. Fallback para semente de dados específica do atleta (se cadastrado)
    const athleteSeed = ATHLETE_INITIAL_PLANS[athleteId]?.nutritionPlan;
    if (athleteSeed) {
      const initial = JSON.parse(JSON.stringify(athleteSeed));
      this.saveNutritionPlan(userScope, athleteId, initial);
      return initial;
    }

    // Se o atleta não possui plano cadastrado, retorna estrutura vazia sem inventar dados
    const emptyPlan: NutritionPlan = {
      dailyTargetCalories: 0,
      dailyTargetProteinG: 0,
      dailyTargetCarbsG: 0,
      dailyTargetFatG: 0,
      waterIntakeLiters: 0,
      meals: []
    };
    return emptyPlan;
  }

  /**
   * Salva o plano nutricional isolado por escopo de usuário e atleta.
   */
  public saveNutritionPlan(
    userScope: string,
    athleteId: string,
    plan: NutritionPlan
  ): void {
    const key = getAthleteStorageKey('nutrition', userScope, athleteId);
    try {
      localStorage.setItem(key, JSON.stringify(plan));
    } catch {}

    // Enfileira sincronização para Firestore
    syncService.enqueueMutation(
      'prescription_nutrition',
      athleteId,
      plan,
      athleteId,
      'UPDATE'
    );
  }

  /**
   * Carrega os treinos (splits) isolados por escopo de usuário e atleta.
   */
  public async loadWorkoutSplits(
    userScope: string,
    athleteId: string
  ): Promise<WorkoutSplit[]> {
    const key = getAthleteStorageKey('workouts', userScope, athleteId);

    // 1. Tenta carregar do cache local isolado
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    // 2. Tenta carregar do Firestore
    try {
      const cloudSplits = await syncService.loadWorkoutSplitsFromFirestore(athleteId);
      if (cloudSplits && Array.isArray(cloudSplits) && cloudSplits.length > 0) {
        this.saveWorkoutSplits(userScope, athleteId, cloudSplits);
        return cloudSplits;
      }
    } catch {}

    // 3. Fallback para treinos específicos do atleta (se cadastrado)
    const athleteSeed = ATHLETE_INITIAL_PLANS[athleteId]?.workoutSplits;
    if (athleteSeed) {
      const initial = JSON.parse(JSON.stringify(athleteSeed));
      this.saveWorkoutSplits(userScope, athleteId, initial);
      return initial;
    }

    // Se o atleta não possui divisão cadastrada, retorna lista vazia
    return [];
  }

  /**
   * Salva as divisões de treino isoladas por escopo de usuário e atleta.
   */
  public saveWorkoutSplits(
    userScope: string,
    athleteId: string,
    splits: WorkoutSplit[]
  ): void {
    const key = getAthleteStorageKey('workouts', userScope, athleteId);
    try {
      localStorage.setItem(key, JSON.stringify(splits));
    } catch {}

    // Enfileira sincronização para Firestore
    syncService.enqueueMutation(
      'prescription_workout',
      athleteId,
      splits,
      athleteId,
      'UPDATE'
    );
  }

  /**
   * Carrega a prescrição de suplementos isolada por escopo de usuário e atleta.
   */
  public async loadSupplements(
    userScope: string,
    athleteId: string
  ): Promise<SupplementItem[]> {
    const key = getAthleteStorageKey('supplements', userScope, athleteId);

    // 1. Tenta carregar do cache local isolado
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    // 2. Tenta carregar do Firestore
    try {
      const cloudSupplements = await syncService.loadSupplementsFromFirestore(athleteId);
      if (cloudSupplements && Array.isArray(cloudSupplements) && cloudSupplements.length > 0) {
        this.saveSupplements(userScope, athleteId, cloudSupplements);
        return cloudSupplements;
      }
    } catch {}

    // 3. Fallback para suplementação específica do atleta (se cadastrado)
    const athleteSeed = ATHLETE_INITIAL_PLANS[athleteId]?.supplements;
    if (athleteSeed) {
      const initial = JSON.parse(JSON.stringify(athleteSeed));
      this.saveSupplements(userScope, athleteId, initial);
      return initial;
    }

    // Se o atleta não possui suplementação cadastrada, retorna lista vazia
    return [];
  }

  /**
   * Salva os suplementos isolados por escopo de usuário e atleta.
   */
  public saveSupplements(
    userScope: string,
    athleteId: string,
    supplements: SupplementItem[]
  ): void {
    const key = getAthleteStorageKey('supplements', userScope, athleteId);
    try {
      localStorage.setItem(key, JSON.stringify(supplements));
    } catch {}

    // Enfileira sincronização para Firestore
    syncService.enqueueMutation(
      'prescription_supplement',
      athleteId,
      supplements,
      athleteId,
      'UPDATE'
    );
  }
}

export const athleteDataService = new AthleteDataService();

export function loadAthleteNutritionPlan(userScope: string, athleteId: string) {
  return athleteDataService.loadNutritionPlan(userScope, athleteId);
}
export function saveAthleteNutritionPlan(userScope: string, athleteId: string, plan: NutritionPlan) {
  return athleteDataService.saveNutritionPlan(userScope, athleteId, plan);
}
export function loadAthleteWorkoutSplits(userScope: string, athleteId: string) {
  return athleteDataService.loadWorkoutSplits(userScope, athleteId);
}
export function saveAthleteWorkoutSplits(userScope: string, athleteId: string, splits: WorkoutSplit[]) {
  return athleteDataService.saveWorkoutSplits(userScope, athleteId, splits);
}
export function loadAthleteSupplements(userScope: string, athleteId: string) {
  return athleteDataService.loadSupplements(userScope, athleteId);
}
export function saveAthleteSupplements(userScope: string, athleteId: string, supplements: SupplementItem[]) {
  return athleteDataService.saveSupplements(userScope, athleteId, supplements);
}
