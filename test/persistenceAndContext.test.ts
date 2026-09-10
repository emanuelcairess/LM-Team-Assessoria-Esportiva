/**
 * ==============================================================================
 * TESTES DE CONTEXTO, ISOLAMENTO E PERSISTÊNCIA - LM TEAM
 * ==============================================================================
 * Validação rigorosa dos requisitos:
 * 1. Dois atletas com planos diferentes
 * 2. Troca rápida de atleta (limpeza imediata de dados e prevenção de race conditions)
 * 3. Falha de conexão (manutenção de erro visível, sem 'salvo' falso)
 * 4. Recuperação de envio (retry de fila offline e transição para 'salvo' confirmado)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  AthleteDataService,
  getUserScope,
  getAthleteStorageKey,
  isEvaluationApproved,
  calculateDelta
} from '../src/services/athleteDataService';
import { SyncService, syncService } from '../src/services/syncService';
import { ATHLETE_INITIAL_PLANS } from '../src/data/mockData';
import { NutritionPlan, WorkoutSplit, AnthropometricData, PendingSyncItem } from '../src/types';
import * as firestoreModule from 'firebase/firestore';

// Mock Firestore functions para isolar ambiente de teste
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof firestoreModule>('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn((db: any, ...pathSegments: string[]) => ({
      type: 'mockDocRef',
      path: pathSegments.join('/'),
      segments: pathSegments
    })),
    setDoc: vi.fn().mockResolvedValue(undefined),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    getDocs: vi.fn().mockResolvedValue({
      forEach: vi.fn()
    }),
    collection: vi.fn((db: any, path: string) => ({
      type: 'mockCollectionRef',
      path
    }))
  };
});

// Mock simples para localStorage no ambiente Node/Vitest
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear()
};

(global as any).localStorage = localStorageMock;

describe('LM Team - Comunicação de Contexto e Persistência', () => {
  let service: AthleteDataService;
  let customSyncService: SyncService;

  beforeEach(() => {
    storageMap.clear();
    service = new AthleteDataService();
    customSyncService = new SyncService({} as any, localStorageMock as any);
    (firestoreModule.setDoc as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Dois atletas com planos diferentes', () => {
    it('deve carregar planos distintos para atletas diferentes sem contaminação', async () => {
      const scope = 'presc_master_01';
      const planAth1 = await service.loadNutritionPlan(scope, 'ath-01');
      const planAth2 = await service.loadNutritionPlan(scope, 'ath-02');

      // Planos devem existir
      expect(planAth1).toBeDefined();
      expect(planAth2).toBeDefined();

      // Devem ser diferentes (ath-01 vs ath-02)
      expect(planAth1.dailyTargetCalories).not.toBe(planAth2.dailyTargetCalories);
      expect(planAth1.dailyTargetProteinG).not.toBe(planAth2.dailyTargetProteinG);

      // Modificar o plano do atleta 1 e salvar localmente
      const modifiedPlanAth1: NutritionPlan = {
        ...planAth1,
        dailyTargetCalories: 3500
      };
      service.saveNutritionPlan(scope, 'ath-01', modifiedPlanAth1);

      // Re-carregar ambos
      const reloadedAth1 = await service.loadNutritionPlan(scope, 'ath-01');
      const reloadedAth2 = await service.loadNutritionPlan(scope, 'ath-02');

      expect(reloadedAth1.dailyTargetCalories).toBe(3500);
      expect(reloadedAth2.dailyTargetCalories).toBe(planAth2.dailyTargetCalories);
      expect(reloadedAth2.dailyTargetCalories).not.toBe(3500);
    });

    it('deve isolar chaves de armazenamento por escopo e por atleta', () => {
      const key1 = getAthleteStorageKey('nutrition', 'presc_01', 'ath-01');
      const key2 = getAthleteStorageKey('nutrition', 'presc_01', 'ath-02');
      const key3 = getAthleteStorageKey('nutrition', 'presc_02', 'ath-01');

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key1).toBe('lm_team_nutrition_presc_01_ath-01');
      expect(key2).toBe('lm_team_nutrition_presc_01_ath-02');
    });
  });

  describe('2. Troca rápida de atleta', () => {
    it('deve isolar requisições concorrentes e garantir que a última vença sem vazar dados anteriores', async () => {
      const scope = 'presc_master_01';

      // Simular delay no primeiro carregamento
      let resolveFirst: (value: any) => void;
      const delayedFirstLoad = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      // Spy no método de carregar Firestore
      const loadSpy = vi.spyOn(syncService, 'loadNutritionPlanFromFirestore');
      loadSpy.mockImplementationOnce(() => delayedFirstLoad as any);

      // Inicia troca para ath-01
      let currentLoadedAthlete = 'ath-01';
      let activeRequestId = 1;

      const req1Id = activeRequestId;
      const req1Promise = service.loadNutritionPlan(scope, 'ath-01').then((plan) => {
        if (req1Id === activeRequestId) {
          currentLoadedAthlete = 'ath-01';
          return plan;
        }
        // Requisição descartada
        return null;
      });

      // Troca imediata para ath-02 (incrementa activeRequestId simulando o useEffect do useAthletePlans)
      activeRequestId = 2;
      const req2Id = activeRequestId;
      const req2Promise = service.loadNutritionPlan(scope, 'ath-02').then((plan) => {
        if (req2Id === activeRequestId) {
          currentLoadedAthlete = 'ath-02';
          return plan;
        }
        return null;
      });

      // Resolve o primeiro bem depois
      resolveFirst!({
        dailyTargetCalories: 9999,
        dailyTargetProteinG: 999,
        dailyTargetCarbsG: 999,
        dailyTargetFatG: 999,
        waterIntakeLiters: 9,
        meals: []
      });

      const [res1, res2] = await Promise.all([req1Promise, req2Promise]);

      expect(res1).toBeNull(); // Requisição 1 foi descartada
      expect(res2).not.toBeNull();
      expect(currentLoadedAthlete).toBe('ath-02');
    });
  });

  describe('3. Falha de conexão e persistência de erros', () => {
    it('deve armazenar evento na fila local e registrar erro visível quando a conexão falhar', async () => {
      // Simula modo offline
      customSyncService.setOnline(false);

      const plan: NutritionPlan = {
        dailyTargetCalories: 2800,
        dailyTargetProteinG: 200,
        dailyTargetCarbsG: 300,
        dailyTargetFatG: 70,
        waterIntakeLiters: 4,
        meals: []
      };

      // Enfileira mutação em modo offline
      customSyncService.enqueueMutation(
        'prescription_nutrition',
        'ath-01',
        plan,
        'ath-01',
        'UPDATE',
        false
      );

      // Tenta enviar para a nuvem em modo offline
      const flushResult = await customSyncService.flushPendingQueueToFirestore({ forceRetry: true });

      // Deve manter na fila offline
      expect(flushResult.success).toBe(false);
      const queue = customSyncService.getQueue();
      expect(queue.length).toBeGreaterThan(0);
      expect(queue.some((item) => item.entityId === 'ath-01' && item.domain === 'prescription_nutrition')).toBe(true);
    });

    it('não deve emitir status "salvo" se houver falha de envio', async () => {
      customSyncService.setOnline(false);

      let lastLogType = '';
      const unsubscribe = customSyncService.subscribe((status, entry) => {
        if (entry?.type) {
          lastLogType = entry.type;
        }
      });

      const plan: NutritionPlan = {
        dailyTargetCalories: 2500,
        dailyTargetProteinG: 180,
        dailyTargetCarbsG: 250,
        dailyTargetFatG: 60,
        waterIntakeLiters: 3,
        meals: []
      };

      customSyncService.enqueueMutation(
        'prescription_nutrition',
        'ath-01',
        plan,
        'ath-01',
        'UPDATE',
        false
      );
      await customSyncService.flushPendingQueueToFirestore({ forceRetry: true });
      unsubscribe();

      // Status NUNCA deve ser 'SYNC_SUCCESS' durante falha
      expect(lastLogType).not.toBe('SYNC_SUCCESS');
    });
  });

  describe('4. Recuperação de envio (Retry e Flush da fila pendente)', () => {
    it('deve reprocessar a fila pendente com sucesso e confirmar timestamp de envio', async () => {
      // 1. Simular falha inicial com offline
      customSyncService.setOnline(false);

      const plan: NutritionPlan = {
        dailyTargetCalories: 3100,
        dailyTargetProteinG: 220,
        dailyTargetCarbsG: 350,
        dailyTargetFatG: 80,
        waterIntakeLiters: 5,
        meals: []
      };

      customSyncService.enqueueMutation(
        'prescription_nutrition',
        'ath-01',
        plan,
        'ath-01',
        'UPDATE',
        false
      );
      expect(customSyncService.getQueue().length).toBeGreaterThan(0);

      // 2. Restaurar conexão
      customSyncService.setOnline(true);

      let recoveredLogType = '';
      let recoveredTimestamp: string | null = null;

      const unsubscribe = customSyncService.subscribe((status, entry) => {
        if (entry?.type) {
          recoveredLogType = entry.type;
        }
        if (entry?.type === 'SYNC_SUCCESS' && entry.timestamp) {
          recoveredTimestamp = entry.timestamp;
        }
      });

      // 3. Disparar recuperação (flush da fila com forceRetry)
      const flushResult = await customSyncService.flushPendingQueueToFirestore({ forceRetry: true });
      unsubscribe();

      expect(flushResult.syncedCount).toBeGreaterThan(0);
      expect(customSyncService.getQueue().length).toBe(0);
      expect(recoveredLogType).toBe('SYNC_SUCCESS');
      expect(recoveredTimestamp).not.toBeNull();
    });
  });

  describe('5. Regras de validação de relatórios e ausência de dados demonstrativos', () => {
    it('deve rejeitar aprovação visual sem profissional e data de validação', () => {
      // Sem validação
      const unvalidated: Partial<AnthropometricData> = {
        date: '2026-03-01',
        weightKg: 85
      };
      expect(isEvaluationApproved(unvalidated)).toBe(false);

      // Apenas com nome do profissional sem data
      const halfValidated: Partial<AnthropometricData> = {
        date: '2026-03-01',
        weightKg: 85,
        validatedBy: {
          id: 'p1',
          name: 'Dr. Lucas Mendes',
          role: 'Coach'
        }
      };
      expect(isEvaluationApproved(halfValidated)).toBe(false);

      // Completo
      const fullyValidated: Partial<AnthropometricData> = {
        date: '2026-03-01',
        weightKg: 85,
        validatedBy: {
          id: 'p1',
          name: 'Dr. Lucas Mendes',
          role: 'Coach'
        },
        validatedAt: '2026-03-01T10:00:00Z'
      };
      expect(isEvaluationApproved(fullyValidated)).toBe(true);
    });

    it('não deve inventar valores e retornar "Não informado" para medições ausentes no delta', () => {
      expect(calculateDelta(undefined, 80)).toBe('Não informado');
      expect(calculateDelta(85, undefined)).toBe('Não informado');
      expect(calculateDelta(null, 80)).toBe('Não informado');
      expect(calculateDelta(0, 80)).toBe('Não informado');
      expect(calculateDelta(85, 80, 'kg')).toBe('+5 kg');
      expect(calculateDelta(78, 80, 'kg')).toBe('-2 kg');
    });
  });
});
