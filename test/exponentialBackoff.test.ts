/**
 * ==============================================================================
 * SUÍTE DE TESTES UNITÁRIOS E DE INTEGRAÇÃO DO SISTEMA DE BACKOFF EXPONENCIAL
 * LM TEAM ASSESSORIA ESPORTIVA - FIRESTORE SYNC RESILIENCE
 * ==============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  classifySyncError,
  calculateExponentialBackoffDelay,
  executeWithExponentialBackoff,
  SyncService,
  STORAGE_QUEUE_KEY
} from '../src/services/syncService';
import { PendingSyncItem } from '../src/types';
import * as firestoreModule from 'firebase/firestore';

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof firestoreModule>('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn((db: any, ...pathSegments: string[]) => ({
      type: 'mockDocRef',
      path: pathSegments.join('/'),
      collectionPath: pathSegments.slice(0, -1).join('/'),
      documentId: pathSegments[pathSegments.length - 1],
      segments: pathSegments
    })),
    setDoc: vi.fn().mockResolvedValue(undefined),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    getDocs: vi.fn().mockResolvedValue({ forEach: vi.fn() }),
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
    }
  };
}

describe('Sistema de Backoff Exponencial para Resiliência do Firestore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Classificação de Erros do Firestore (classifySyncError)', () => {
    it('deve classificar erros de limites de taxa (Rate Limits e Cotas) como RATE_LIMIT', () => {
      expect(classifySyncError({ code: 'resource-exhausted', message: 'Quota exceeded for namespace' })).toBe('RATE_LIMIT');
      expect(classifySyncError({ status: 429, message: 'Too Many Requests' })).toBe('RATE_LIMIT');
      expect(classifySyncError(new Error('Rate limit exceeded on document write operations'))).toBe('RATE_LIMIT');
      expect(classifySyncError({ message: 'Resource exhausted on project thermal-tune-blcf1' })).toBe('RATE_LIMIT');
    });

    it('deve classificar erros de permissão de acesso como PERMISSION', () => {
      expect(classifySyncError({ code: 'permission-denied', message: 'Missing or insufficient permissions.' })).toBe('PERMISSION');
      expect(classifySyncError({ status: 403, message: 'Acesso negado às regras de segurança' })).toBe('PERMISSION');
      expect(classifySyncError(new Error('FirebaseError: Missing or insufficient permissions.'))).toBe('PERMISSION');
      expect(classifySyncError({ code: 'unauthorized', message: 'User unauthorized' })).toBe('PERMISSION');
    });

    it('deve classificar erros temporários de rede ou timeout como TRANSIENT', () => {
      expect(classifySyncError({ code: 'unavailable', message: 'The service is currently unavailable' })).toBe('TRANSIENT');
      expect(classifySyncError({ code: 'deadline-exceeded', message: 'Request deadline exceeded' })).toBe('TRANSIENT');
      expect(classifySyncError(new Error('Failed to fetch from backend connection timeout'))).toBe('TRANSIENT');
      expect(classifySyncError(null)).toBe('TRANSIENT');
    });

    it('deve classificar argumentos inválidos como FATAL para evitar retries inúteis', () => {
      expect(classifySyncError({ code: 'invalid-argument', message: 'Document path is malformed' })).toBe('FATAL');
    });
  });

  describe('2. Cálculo do Intervalo de Backoff Exponencial (calculateExponentialBackoffDelay)', () => {
    it('deve aplicar crescimento exponencial para erros de RATE_LIMIT com piso e teto seguros', () => {
      const delay1 = calculateExponentialBackoffDelay(1, 'RATE_LIMIT', { jitterMs: 0 });
      const delay2 = calculateExponentialBackoffDelay(2, 'RATE_LIMIT', { jitterMs: 0 });
      const delay3 = calculateExponentialBackoffDelay(3, 'RATE_LIMIT', { jitterMs: 0 });
      const delayCap = calculateExponentialBackoffDelay(10, 'RATE_LIMIT', { jitterMs: 0, maxDelayMs: 60000 });

      expect(delay1).toBe(2000); // 2000 * 2^0
      expect(delay2).toBe(4000); // 2000 * 2^1
      expect(delay3).toBe(8000); // 2000 * 2^2
      expect(delayCap).toBe(60000); // Capped at maxDelay
    });

    it('deve aplicar teto maior para PERMISSION para permitir tempo hábil de renovação de token', () => {
      const delay1 = calculateExponentialBackoffDelay(1, 'PERMISSION', { jitterMs: 0 });
      const delay4 = calculateExponentialBackoffDelay(4, 'PERMISSION', { jitterMs: 0 });
      const delayCapped = calculateExponentialBackoffDelay(10, 'PERMISSION', { jitterMs: 0 });

      expect(delay1).toBe(2000);
      expect(delay4).toBe(16000); // 2000 * 2^3
      expect(delayCapped).toBe(90000); // Max ceiling for permissions is 90s
    });

    it('deve adicionar jitter aleatório positivo para evitar sincronização em bando (thundering herd)', () => {
      const delayWithJitter1 = calculateExponentialBackoffDelay(1, 'TRANSIENT', { jitterMs: 250 });
      const delayWithJitter2 = calculateExponentialBackoffDelay(1, 'TRANSIENT', { jitterMs: 250 });

      expect(delayWithJitter1).toBeGreaterThanOrEqual(1000);
      expect(delayWithJitter1).toBeLessThanOrEqual(1250);
      expect(delayWithJitter2).toBeGreaterThanOrEqual(1000);
      expect(delayWithJitter2).toBeLessThanOrEqual(1250);
    });
  });

  describe('3. Executor Assíncrono com Backoff Exponencial (executeWithExponentialBackoff)', () => {
    it('deve retornar resultado imediatamente quando a operação tiver sucesso na primeira tentativa', async () => {
      const mockOp = vi.fn().mockResolvedValue('dados_salvos');
      const result = await executeWithExponentialBackoff(mockOp, { maxRetries: 3 });

      expect(result).toBe('dados_salvos');
      expect(mockOp).toHaveBeenCalledTimes(1);
    });

    it('deve tentar novamente e ter sucesso em caso de erro transitório ou rate limit', async () => {
      const mockOp = vi
        .fn()
        .mockRejectedValueOnce({ code: 'resource-exhausted', message: 'Quota exceeded' })
        .mockResolvedValueOnce('sucesso_apos_recuo');

      const onRetry = vi.fn();
      const result = await executeWithExponentialBackoff(mockOp, {
        maxRetries: 3,
        baseDelayMs: 10,
        jitterMs: 0,
        onRetry
      });

      expect(result).toBe('sucesso_apos_recuo');
      expect(mockOp).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Number), expect.any(Object), 'RATE_LIMIT');
    });

    it('deve interromper imediatamente e lançar erro caso ocorra um erro FATAL', async () => {
      const fatalError = { code: 'invalid-argument', message: 'ID malformado' };
      const mockOp = vi.fn().mockRejectedValue(fatalError);

      await expect(
        executeWithExponentialBackoff(mockOp, { maxRetries: 3, baseDelayMs: 10 })
      ).rejects.toEqual(fatalError);

      expect(mockOp).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. Resiliência de Fila com Backoff Exponencial em Lotes (performFlushBatch)', () => {
    it('deve agendar retry exponencial e pausar lote prematuramente se encontrar Rate Limit no Firestore', async () => {
      const mockDb = { type: 'mockDb' } as any;
      const mockStorage = createMockStorage();
      const service = new SyncService(mockDb, mockStorage as any);

      // Duas mutações pendentes
      const item1: PendingSyncItem = {
        id: 'sync_rl_1',
        entityId: 'sup_creatina',
        domain: 'prescription_supplement',
        operation: 'UPDATE',
        payloadJson: JSON.stringify({ name: 'Creatina', athleteId: 'ath_01' }),
        createdAt: 1000,
        retryCount: 0
      };

      const item2: PendingSyncItem = {
        id: 'sync_rl_2',
        entityId: 'sup_whey',
        domain: 'prescription_supplement',
        operation: 'UPDATE',
        payloadJson: JSON.stringify({ name: 'Whey', athleteId: 'ath_01' }),
        createdAt: 2000,
        retryCount: 0
      };

      service.setQueueForTesting([item1, item2]);

      // Simula erro de RATE_LIMIT na primeira escrita
      (firestoreModule.setDoc as any).mockRejectedValueOnce({
        code: 'resource-exhausted',
        message: 'Quota exceeded'
      });

      const flushResult = await service.flushPendingQueueToFirestore();

      expect(flushResult.success).toBe(false);
      expect(flushResult.failedCount).toBe(1);

      // O item 1 deve ter retryCount incrementado e nextRetryAt com backoff de rate limit
      const remainingQueue = service.getStatus().checkInSyncQueue;
      expect(remainingQueue.length).toBe(2);

      const failedItem = remainingQueue.find((i) => i.id === 'sync_rl_1');
      expect(failedItem).toBeDefined();
      expect(failedItem?.retryCount).toBe(1);
      expect(failedItem?.nextRetryAt).toBeGreaterThan(Date.now() + 1500); // Base é 2000ms

      // O item 2 não deve ter sido tentado no mesmo lote devido à pausa de segurança contra sobrecarga
      const secondItem = remainingQueue.find((i) => i.id === 'sync_rl_2');
      expect(secondItem?.retryCount).toBe(0);
    });

    it('deve calcular backoff estendido para erros de permissão após o carregamento inicial', async () => {
      const mockDb = { type: 'mockDb' } as any;
      const mockStorage = createMockStorage();
      const service = new SyncService(mockDb, mockStorage as any);

      const itemPerm: PendingSyncItem = {
        id: 'sync_perm_1',
        entityId: 'ex_supino',
        domain: 'checkin_exercise_set',
        operation: 'UPDATE',
        payloadJson: JSON.stringify({ exerciseName: 'Supino Reto', athleteId: 'ath_01' }),
        createdAt: 1000,
        retryCount: 1
      };

      service.setQueueForTesting([itemPerm]);

      // Simula erro de permissão do Firestore
      (firestoreModule.setDoc as any).mockRejectedValueOnce({
        code: 'permission-denied',
        message: 'Missing or insufficient permissions.'
      });

      const flushResult = await service.flushPendingQueueToFirestore();

      expect(flushResult.success).toBe(false);
      const remainingQueue = service.getStatus().checkInSyncQueue;
      const failedItem = remainingQueue[0];

      expect(failedItem.retryCount).toBe(2);
      expect(failedItem.lastError).toContain('Missing or insufficient permissions');
      // Para retryCount = 2 em PERMISSION: 2000 * 2^1 = 4000ms + jitter
      expect(failedItem.nextRetryAt).toBeGreaterThan(Date.now() + 3500);
    });
  });
});
