import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  SyncService,
  validateFirestorePath,
  resolveFirestorePathForDomain,
  SYNC_DOMAIN_CONFIG,
  STORAGE_QUEUE_KEY
} from '../syncService';
import { SyncEntityDomain, PendingSyncItem } from '../../types';
import * as firestoreModule from 'firebase/firestore';

// Mock Firestore functions
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
    },
    getRawStore: () => store
  };
}

describe('SyncService & Firestore Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (firestoreModule.setDoc as any).mockResolvedValue(undefined);
    (firestoreModule.deleteDoc as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. UNIT TESTS: SCHEMA MAPPING & PATH VALIDATION
  // =========================================================================
  describe('1. Schema Centralizado e Validação de Caminhos', () => {
    it('deve mapear todos os 12 domínios de SyncEntityDomain para caminhos Firestore pares e válidos', () => {
      const allDomains: SyncEntityDomain[] = [
        'athlete',
        'prescriber_profile',
        'workout_template',
        'formula_template',
        'exercise_library',
        'checkin_exercise_set',
        'checkin_meal',
        'checkin_supplement',
        'checkin_anthropometric',
        'prescription_workout',
        'prescription_nutrition',
        'prescription_supplement'
      ];

      for (const domain of allDomains) {
        expect(SYNC_DOMAIN_CONFIG[domain]).toBeDefined();
        const res = resolveFirestorePathForDomain(domain, 'entity_123', 'ath_99', {
          athleteId: 'ath_99'
        });

        expect(res.isValid).toBe(true);
        expect(res.fullPath).toBeDefined();
        expect(res.segments.length).toBeGreaterThan(0);
        // Firestore documents MUST have an even number of segments (col/doc or col/doc/col/doc)
        expect(res.segments.length % 2).toBe(0);
      }
    });

    it('deve mapear caminhos de prescrições oficiais para /prescriptions/{type}/athletes/{athleteId}', () => {
      const workoutRes = resolveFirestorePathForDomain(
        'prescription_workout',
        'ath_01',
        'ath_01',
        { athleteId: 'ath_01' }
      );
      expect(workoutRes.isValid).toBe(true);
      expect(workoutRes.fullPath).toBe('prescriptions/workouts/athletes/ath_01');
      expect(workoutRes.segments).toEqual(['prescriptions', 'workouts', 'athletes', 'ath_01']);
      expect(workoutRes.segments.length).toBe(4);

      const nutritionRes = resolveFirestorePathForDomain(
        'prescription_nutrition',
        'ath_01',
        'ath_01',
        { athleteId: 'ath_01' }
      );
      expect(nutritionRes.isValid).toBe(true);
      expect(nutritionRes.fullPath).toBe('prescriptions/nutrition/athletes/ath_01');
      expect(nutritionRes.segments).toEqual(['prescriptions', 'nutrition', 'athletes', 'ath_01']);
      expect(nutritionRes.segments.length).toBe(4);

      const supplementRes = resolveFirestorePathForDomain(
        'prescription_supplement',
        'ath_01',
        'ath_01',
        { athleteId: 'ath_01' }
      );
      expect(supplementRes.isValid).toBe(true);
      expect(supplementRes.fullPath).toBe('prescriptions/supplements/athletes/ath_01');
      expect(supplementRes.segments).toEqual(['prescriptions', 'supplements', 'athletes', 'ath_01']);
      expect(supplementRes.segments.length).toBe(4);
    });

    it('deve mapear check-ins de séries, refeições e suplementos para subcoleções do atleta', () => {
      const setRes = resolveFirestorePathForDomain(
        'checkin_exercise_set',
        'set_456',
        'ath_01'
      );
      expect(setRes.isValid).toBe(true);
      expect(setRes.fullPath).toBe('athletes/ath_01/exercise_set_checkins/set_456');

      const mealRes = resolveFirestorePathForDomain(
        'checkin_meal',
        'meal_789',
        'ath_01'
      );
      expect(mealRes.isValid).toBe(true);
      expect(mealRes.fullPath).toBe('athletes/ath_01/meal_checkins/meal_789');

      const evalRes = resolveFirestorePathForDomain(
        'checkin_anthropometric',
        'eval_001',
        'ath_01'
      );
      expect(evalRes.isValid).toBe(true);
      expect(evalRes.fullPath).toBe('athletes/ath_01/anthropometric_evaluations/eval_001');
    });

    it('deve rejeitar caminhos inválidos (número ímpar de segmentos, ID com barra, campos vazios)', () => {
      // Empty collection or doc
      expect(validateFirestorePath('', 'doc1').isValid).toBe(false);
      expect(validateFirestorePath('collection', '').isValid).toBe(false);

      // Doc ID containing slashes
      const slashInDoc = validateFirestorePath('athletes', 'sub/path/123');
      expect(slashInDoc.isValid).toBe(false);
      expect(slashInDoc.error).toContain('não pode conter barras');

      // Odd segments
      const oddSegments = validateFirestorePath('athletes/ath_01/checkins/sub', 'item');
      expect(oddSegments.isValid).toBe(false);
      expect(oddSegments.error).toContain('número ímpar');
    });
  });

  // =========================================================================
  // 2. UNIT TESTS: OPERAÇÃO DELETE
  // =========================================================================
  describe('2. Operação DELETE', () => {
    it('deve chamar deleteDoc no Firestore e remover da fila quando confirmado', async () => {
      const mockDb = {} as any;
      const mockStorage = createMockStorage();
      const service = new SyncService(mockDb, mockStorage as any);

      service.enqueueMutation(
        'checkin_exercise_set',
        'set_del_01',
        { test: true },
        'ath_01',
        'DELETE',
        false // Do not auto-flush so we test flushPendingQueueToFirestore explicitly
      );

      expect(service.getStatus().pendingCount).toBe(1);

      // Flush queue
      const result = await service.flushPendingQueueToFirestore();

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(firestoreModule.deleteDoc).toHaveBeenCalledTimes(1);
      expect(firestoreModule.setDoc).not.toHaveBeenCalled();

      // Queue must be empty after confirmation
      expect(service.getStatus().pendingCount).toBe(0);
    });
  });

  // =========================================================================
  // 3. UNIT TESTS: FALHA PARCIAL E BACKOFF EXPONENCIAL
  // =========================================================================
  describe('3. Falha Parcial e Backoff Exponencial', () => {
    it('deve remover apenas itens confirmados e manter itens com falha com retryCount e backoff', async () => {
      const mockDb = {} as any;
      const mockStorage = createMockStorage();
      const service = new SyncService(mockDb, mockStorage as any);

      // Item 1: Supino (vai ter sucesso)
      const item1: PendingSyncItem = {
        id: 'sync_item_1',
        entityId: 'set_success',
        domain: 'checkin_exercise_set',
        operation: 'UPDATE',
        payloadJson: JSON.stringify({ exerciseName: 'Supino', athleteId: 'ath_01' }),
        createdAt: Date.now() - 1000,
        retryCount: 0
      };

      // Item 2: Agachamento (vai falhar no setDoc)
      const item2: PendingSyncItem = {
        id: 'sync_item_2',
        entityId: 'set_fail',
        domain: 'checkin_exercise_set',
        operation: 'UPDATE',
        payloadJson: JSON.stringify({ exerciseName: 'Agachamento', athleteId: 'ath_01' }),
        createdAt: Date.now() - 1000,
        retryCount: 0
      };

      service.setQueueForTesting([item1, item2]);
      expect(service.getStatus().pendingCount).toBe(2);

      // Mock setDoc to succeed for item1 and fail for item2
      (firestoreModule.setDoc as any).mockImplementation(async (docRef: any) => {
        if (docRef.path && docRef.path.includes('set_fail')) {
          throw new Error('Permissão negada / Falha de rede transitória');
        }
        return Promise.resolve();
      });

      const flushResult = await service.flushPendingQueueToFirestore();

      // Results check
      expect(flushResult.success).toBe(false);
      expect(flushResult.syncedCount).toBe(1);
      expect(flushResult.failedCount).toBe(1);
      expect(flushResult.totalAttempted).toBe(2);

      // Queue state
      const status = service.getStatus();
      expect(status.pendingCount).toBe(1);
      expect(status.syncedCount).toBe(1);
      expect(status.errorCount).toBe(1);

      // Verify the surviving item is item2 with updated retry metadata
      const survivingItem = status.checkInSyncQueue[0];
      expect(survivingItem.id).toBe('sync_item_2');
      expect(survivingItem.retryCount).toBe(1);
      expect(survivingItem.lastError).toContain('Permissão negada');
      expect(survivingItem.nextRetryAt).toBeDefined();
      expect(survivingItem.nextRetryAt).toBeGreaterThan(Date.now() - 100);
    });

    it('deve respeitar nextRetryAt em ciclos subsequentes e permitir retry com forceRetry', async () => {
      const mockDb = {} as any;
      const mockStorage = createMockStorage();
      const service = new SyncService(mockDb, mockStorage as any);

      const futureRetryTime = Date.now() + 60000; // 1 minute in the future
      const itemWithBackoff: PendingSyncItem = {
        id: 'sync_delayed',
        entityId: 'set_delayed',
        domain: 'checkin_exercise_set',
        operation: 'UPDATE',
        payloadJson: JSON.stringify({ athleteId: 'ath_01' }),
        createdAt: Date.now(),
        retryCount: 2,
        nextRetryAt: futureRetryTime,
        lastError: 'Simulated previous error'
      };

      service.setQueueForTesting([itemWithBackoff]);

      // Normal flush: should skip item because nextRetryAt is in the future
      const normalFlush = await service.flushPendingQueueToFirestore();
      expect(normalFlush.totalAttempted).toBe(0);
      expect(service.getStatus().pendingCount).toBe(1);

      // Forced retry: should process despite future nextRetryAt
      (firestoreModule.setDoc as any).mockResolvedValue(undefined);
      const forcedFlush = await service.flushPendingQueueToFirestore({ forceRetry: true });
      expect(forcedFlush.syncedCount).toBe(1);
      expect(service.getStatus().pendingCount).toBe(0);
    });
  });

  // =========================================================================
  // 4. UNIT TESTS: RECUPERAÇÃO APÓS RECARGA (PERSISTÊNCIA)
  // =========================================================================
  describe('4. Recuperação Após Recarga (Persistência no localStorage)', () => {
    it('deve persistir fila com erros no localStorage e restaurá-la perfeitamente ao recarregar a classe', async () => {
      const mockDb = {} as any;
      const mockStorage = createMockStorage();
      const initialService = new SyncService(mockDb, mockStorage as any);

      const failedItem: PendingSyncItem = {
        id: 'sync_persisted_01',
        entityId: 'meal_dinner',
        domain: 'checkin_meal',
        operation: 'UPDATE',
        payloadJson: JSON.stringify({ mealName: 'Jantar', calories: 650, athleteId: 'ath_01' }),
        createdAt: Date.now() - 5000,
        retryCount: 3,
        lastError: 'Firestore quota exceeded',
        nextRetryAt: Date.now() + 15000
      };

      initialService.setQueueForTesting([failedItem]);

      // Verify stored in mock storage
      const storedQueueRaw = mockStorage.getItem(STORAGE_QUEUE_KEY);
      expect(storedQueueRaw).not.toBeNull();
      const parsedQueue = JSON.parse(storedQueueRaw!);
      expect(parsedQueue.length).toBe(1);
      expect(parsedQueue[0].id).toBe('sync_persisted_01');
      expect(parsedQueue[0].retryCount).toBe(3);

      // Simulate app restart / page reload by creating a new SyncService instance with the same storage
      const reloadedService = new SyncService(mockDb, mockStorage as any);
      const reloadedStatus = reloadedService.getStatus();

      expect(reloadedStatus.pendingCount).toBe(1);
      expect(reloadedStatus.errorCount).toBe(1);
      const restoredItem = reloadedStatus.checkInSyncQueue[0];
      expect(restoredItem.id).toBe('sync_persisted_01');
      expect(restoredItem.domain).toBe('checkin_meal');
      expect(restoredItem.retryCount).toBe(3);
      expect(restoredItem.lastError).toBe('Firestore quota exceeded');

      // Now simulate network restoration and sync
      (firestoreModule.setDoc as any).mockResolvedValue(undefined);
      const recoveryResult = await reloadedService.flushPendingQueueToFirestore({ forceRetry: true });

      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.syncedCount).toBe(1);
      expect(reloadedService.getStatus().pendingCount).toBe(0);

      // Verify storage is updated to empty queue
      const updatedStorageRaw = mockStorage.getItem(STORAGE_QUEUE_KEY);
      expect(JSON.parse(updatedStorageRaw!)).toEqual([]);
    });
  });
});
