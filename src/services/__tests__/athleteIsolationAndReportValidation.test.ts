import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getUserScope,
  getAthleteStorageKey,
  formatMeasurementValue,
  calculateBmi,
  calculateDelta,
  isEvaluationApproved,
  loadAthleteNutritionPlan,
  saveAthleteNutritionPlan,
  loadAthleteWorkoutSplits,
  saveAthleteWorkoutSplits,
  loadAthleteSupplements,
  saveAthleteSupplements
} from '../athleteDataService';
import { ATHLETE_INITIAL_PLANS } from '../../data/mockData';
import { NutritionPlan, WorkoutSplit, AnthropometricData } from '../../types';

function createMockStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
}

const mockStorage = createMockStorage();
vi.stubGlobal('localStorage', mockStorage);

describe('Isolamento de Planos por Atleta e Usuário Autenticado', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('deve gerar escopos de usuário distintos para usuários autenticados e profissionais', () => {
    const scopeUserA = getUserScope('uid_user_a', 'athlete', null, 'ath_1');
    const scopeUserB = getUserScope('uid_user_b', 'athlete', null, 'ath_1');
    const scopeCoach = getUserScope('uid_coach_1', 'prescriber', 'presc_1', 'ath_1');

    expect(scopeUserA).toBe('uid_uid_user_a');
    expect(scopeUserB).toBe('uid_uid_user_b');
    expect(scopeCoach).toBe('uid_uid_coach_1');
    expect(scopeUserA).not.toBe(scopeUserB);
  });

  it('deve armazenar e isolar planos para dois atletas com conteúdos diferentes', async () => {
    const userScope = 'test_user_session';
    const athlete1Id = 'ath_lucas_1';
    const athlete2Id = 'ath_mariana_2';

    const planAthlete1: NutritionPlan = {
      dailyTargetCalories: 3200,
      dailyTargetProteinG: 220,
      dailyTargetCarbsG: 380,
      dailyTargetFatG: 75,
      waterIntakeLiters: 4.0,
      meals: [
        {
          id: 'meal_1',
          number: 1,
          name: 'Café da Manhã Hipertrofia',
          timeSchedule: '08:00',
          targetCaloriesKcal: 800,
          targetProteinG: 50,
          targetCarbsG: 90,
          targetFatG: 20,
          isCompleted: false,
          foods: []
        }
      ]
    };

    const planAthlete2: NutritionPlan = {
      dailyTargetCalories: 1800,
      dailyTargetProteinG: 140,
      dailyTargetCarbsG: 160,
      dailyTargetFatG: 45,
      waterIntakeLiters: 2.8,
      meals: [
        {
          id: 'meal_2',
          number: 1,
          name: 'Desjejum Cutting',
          timeSchedule: '07:30',
          targetCaloriesKcal: 400,
          targetProteinG: 35,
          targetCarbsG: 40,
          targetFatG: 10,
          isCompleted: false,
          foods: []
        }
      ]
    };

    // Salva planos isolados
    saveAthleteNutritionPlan(userScope, athlete1Id, planAthlete1);
    saveAthleteNutritionPlan(userScope, athlete2Id, planAthlete2);

    // Carrega planos e verifica que os conteúdos são estritamente isolados
    const loadedPlan1 = await loadAthleteNutritionPlan(userScope, athlete1Id);
    const loadedPlan2 = await loadAthleteNutritionPlan(userScope, athlete2Id);

    expect(loadedPlan1.dailyTargetCalories).toBe(3200);
    expect(loadedPlan1.meals[0].name).toBe('Café da Manhã Hipertrofia');

    expect(loadedPlan2.dailyTargetCalories).toBe(1800);
    expect(loadedPlan2.meals[0].name).toBe('Desjejum Cutting');

    // Chaves de armazenamento distintas
    const key1 = getAthleteStorageKey('nutrition', userScope, athlete1Id);
    const key2 = getAthleteStorageKey('nutrition', userScope, athlete2Id);
    expect(key1).not.toBe(key2);
  });

  it('deve isolar divisões de treino (splits) entre atletas diferentes', async () => {
    const userScope = 'test_coach_session';
    const athlete1Id = 'ath_lucas_1';
    const athlete2Id = 'ath_mariana_2';

    const splitsAthlete1: WorkoutSplit[] = [
      {
        id: 'split_a',
        code: 'Treino A',
        name: 'Split A - Peitoral e Tríceps Pesado',
        dayOfWeek: 'Segunda-feira',
        targetMuscleGroups: ['Peitoral', 'Tríceps'],
        estimatedDurationMinutes: 65,
        isCompletedToday: false,
        exercises: []
      }
    ];

    const splitsAthlete2: WorkoutSplit[] = [
      {
        id: 'split_b',
        code: 'Treino A',
        name: 'Split A - Quadríceps e Glúteos',
        dayOfWeek: 'Segunda-feira',
        targetMuscleGroups: ['Quadríceps', 'Glúteos'],
        estimatedDurationMinutes: 55,
        isCompletedToday: true,
        exercises: []
      }
    ];

    saveAthleteWorkoutSplits(userScope, athlete1Id, splitsAthlete1);
    saveAthleteWorkoutSplits(userScope, athlete2Id, splitsAthlete2);

    const loadedSplits1 = await loadAthleteWorkoutSplits(userScope, athlete1Id);
    const loadedSplits2 = await loadAthleteWorkoutSplits(userScope, athlete2Id);

    expect(loadedSplits1[0].name).toBe('Split A - Peitoral e Tríceps Pesado');
    expect(loadedSplits2[0].name).toBe('Split A - Quadríceps e Glúteos');
    expect(loadedSplits1[0].isCompletedToday).toBe(false);
    expect(loadedSplits2[0].isCompletedToday).toBe(true);
  });

  it('deve simular troca de atleta e descartar resposta atrasada (stale response protection)', async () => {
    let currentAthleteId = 'ath_1';
    let activeRequestId = 0;
    let displayedPlan: NutritionPlan | null = null;

    // Função que simula o hook useAthletePlans
    const switchAthlete = async (newAthleteId: string, simulatedDelayMs: number) => {
      const requestId = ++activeRequestId;
      currentAthleteId = newAthleteId;

      // 1. Limpa a visualização anterior imediatamente
      displayedPlan = null;

      // Simula resposta assíncrona da rede/banco
      await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs));

      // 2. Se a requisição ficou atrasada/obsoleta, IGNORA e descarta
      if (requestId !== activeRequestId) {
        return;
      }

      displayedPlan = {
        dailyTargetCalories: newAthleteId === 'ath_2' ? 2400 : 3000,
        dailyTargetProteinG: 200,
        dailyTargetCarbsG: 250,
        dailyTargetFatG: 70,
        waterIntakeLiters: 3.5,
        meals: [
          {
            id: `meal_${newAthleteId}`,
            number: 1,
            name: newAthleteId === 'ath_2' ? 'Plano Mariana' : 'Plano Lucas',
            timeSchedule: '08:00',
            targetCaloriesKcal: newAthleteId === 'ath_2' ? 2400 : 3000,
            targetProteinG: 200,
            targetCarbsG: 250,
            targetFatG: 70,
            isCompleted: false,
            foods: []
          }
        ]
      };
    };

    // Atleta 1 é selecionado com resposta lenta (100ms)
    const promiseAth1 = switchAthlete('ath_1', 100);

    // Quase imediatamente, o usuário clica no Atleta 2 com resposta rápida (20ms)
    const promiseAth2 = switchAthlete('ath_2', 20);

    await Promise.all([promiseAth1, promiseAth2]);

    // O plano final exibido DEVE ser estritamente o do Atleta 2, e NÃO o do Atleta 1 (que terminou depois)
    expect(displayedPlan).not.toBeNull();
    expect(displayedPlan?.dailyTargetCalories).toBe(2400);
    expect(displayedPlan?.meals[0].name).toBe('Plano Mariana');
  });
});

describe('Relatório Físico - Regras de Indicadores, Medidas e Aprovação', () => {
  it('deve formatar medidas ausentes, zero ou indefinidas como "Não informado"', () => {
    expect(formatMeasurementValue(undefined)).toBe('Não informado');
    expect(formatMeasurementValue(null)).toBe('Não informado');
    expect(formatMeasurementValue(NaN)).toBe('Não informado');
    expect(formatMeasurementValue(0)).toBe('Não informado');
    expect(formatMeasurementValue(-5)).toBe('Não informado');
    expect(formatMeasurementValue(85.5, 'cm')).toBe('85.5 cm');
    expect(formatMeasurementValue(78.2, 'kg')).toBe('78.2 kg');
  });

  it('não deve calcular indicadores temporais (delta) com dados ausentes ou zerados', () => {
    // Dados ausentes devem retornar "Não informado"
    expect(calculateDelta(undefined, 80)).toBe('Não informado');
    expect(calculateDelta(85, undefined)).toBe('Não informado');
    expect(calculateDelta(null, null)).toBe('Não informado');
    expect(calculateDelta(0, 80)).toBe('Não informado');
    expect(calculateDelta(80, 0)).toBe('Não informado');

    // Com dados válidos, calcula a variação correta
    expect(calculateDelta(82.5, 80.0, 'kg')).toBe('+2.5 kg');
    expect(calculateDelta(78.0, 80.0, 'kg')).toBe('-2 kg');
    expect(calculateDelta(80.0, 80.0, 'kg')).toBe('+0 kg');
  });

  it('deve calcular IMC sem inferir composição corporal (gordura ou massa magra)', () => {
    // Ausência de peso ou altura
    const missingWeight = calculateBmi(null, 180);
    expect(missingWeight.isCalculated).toBe(false);
    expect(missingWeight.bmi).toBeNull();
    expect(missingWeight.classification).toBe('Não informado');

    const missingHeight = calculateBmi(80, undefined);
    expect(missingHeight.isCalculated).toBe(false);
    expect(missingHeight.classification).toBe('Não informado');

    // Cálculo regular baseado estritamente na relação peso/estatura OMS
    const normalBmi = calculateBmi(75, 178);
    expect(normalBmi.isCalculated).toBe(true);
    expect(normalBmi.bmi).toBe('23.7');
    expect(normalBmi.classification).toBe('Eutrofia (Peso adequado)');

    // Nenhuma inferência de percentual de gordura é gerada pelo IMC
    expect((normalBmi as any).bodyFatPercentage).toBeUndefined();
    expect((normalBmi as any).leanMassKg).toBeUndefined();
  });

  it('deve exigir profissional E data de validação para exibir aprovação técnica', () => {
    // Sem profissional
    expect(isEvaluationApproved({ validatedAt: '2026-09-08' })).toBe(false);

    // Sem data de validação
    expect(
      isEvaluationApproved({
        validatedBy: {
          name: 'Dr. Leonardo Moura',
          crm_crn_cref: 'CRN-3 45892',
          role: 'nutritionist'
        }
      })
    ).toBe(false);

    // Com profissional habilitado e data de validação registrados
    expect(
      isEvaluationApproved({
        validatedBy: {
          name: 'Dr. Leonardo Moura',
          crm_crn_cref: 'CRN-3 45892',
          role: 'nutritionist'
        },
        validatedAt: '2026-09-08'
      })
    ).toBe(true);
  });
});
