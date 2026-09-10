import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SyncService, getEntityKey } from '../syncService';
import * as firestoreModule from 'firebase/firestore';

// Mock Firestore functions
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
    }
  };
}

describe('Sync Contract, Conflict Resolution & Entity Order Tests', () => {
  let mockDb: any;
  let mockStorage: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = { type: 'mockFirestoreInstance' };
    mockStorage = createMockStorage();
    (firestoreModule.setDoc as any).mockResolvedValue(undefined);
    (firestoreModule.deleteDoc as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // SCENARIO 1: Dois suplementos e exclusão de apenas um
  // =========================================================================
  it('deve sincronizar dois suplementos sem usar athleteId como documentId e excluir apenas um quando solicitado', async () => {
    const sync = new SyncService(mockDb, mockStorage as any);
    sync.setOnline(false); // keep in queue first to control sequence

    const sup1 = {
      id: 'sup_creatina',
      name: 'Creatina Creapure',
      dosage: '5g',
      schedule: 'Pós-treino',
      category: 'Força'
    };

    const sup2 = {
      id: 'sup_whey',
      name: 'Whey Protein Isolado',
      dosage: '30g',
      schedule: 'Manhã',
      category: 'Proteína'
    };

    // 1. Enqueue both supplements for athlete 'ath_01'
    sync.enqueueMutation('prescription_supplement', sup1.id, sup1, 'ath_01', 'INSERT', false);
    sync.enqueueMutation('prescription_supplement', sup2.id, sup2, 'ath_01', 'INSERT', false);

    expect(sync.getQueue()).toHaveLength(2);

    // Turn online and flush initial insertions
    sync.setOnline(true);
    const flushInsertRes = await sync.flushPendingQueueToFirestore();

    expect(flushInsertRes.success).toBe(true);
    expect(flushInsertRes.syncedCount).toBe(2);

    // Verify setDoc was called with distinct subcollection document paths, NOT using athleteId as documentId
    const setDocCalls = (firestoreModule.setDoc as any).mock.calls;
    expect(setDocCalls.length).toBe(2);

    const callPaths = setDocCalls.map((c: any) => c[0].path);
    expect(callPaths).toContain('prescriptions/supplements/athletes/ath_01/items/sup_creatina');
    expect(callPaths).toContain('prescriptions/supplements/athletes/ath_01/items/sup_whey');

    // Confirm that neither document path ends with athleteId
    expect(callPaths.every((p: string) => !p.endsWith('/ath_01'))).toBe(true);

    // 2. Now enqueue a DELETE mutation for ONLY ONE supplement ('sup_whey')
    sync.enqueueMutation(
      'prescription_supplement',
      'sup_whey',
      { id: 'sup_whey' },
      'ath_01',
      'DELETE',
      false
    );

    const deleteFlushRes = await sync.flushPendingQueueToFirestore();
    expect(deleteFlushRes.success).toBe(true);

    const deleteCalls = (firestoreModule.deleteDoc as any).mock.calls;
    expect(deleteCalls.length).toBe(1);
    expect(deleteCalls[0][0].path).toBe('prescriptions/supplements/athletes/ath_01/items/sup_whey');

    // Verify queue is empty after successful confirmation
    expect(sync.getQueue()).toHaveLength(0);
  });

  // =========================================================================
  // SCENARIO 2: Duas edições offline para a mesma entidade
  // =========================================================================
  it('deve consolidar duas edições offline para a mesma entidade aplicando a política Last-Write-Wins', async () => {
    const sync = new SyncService(mockDb, mockStorage as any);
    sync.setOnline(false); // Offline mode

    const entityId = 'sup_beta_alanine';

    // First offline edit
    sync.enqueueMutation(
      'prescription_supplement',
      entityId,
      { id: entityId, name: 'Beta Alanina 3g', dosage: '3g' },
      'ath_01',
      'UPDATE',
      false
    );

    expect(sync.getQueue()).toHaveLength(1);

    // Second offline edit on the same entity
    sync.enqueueMutation(
      'prescription_supplement',
      entityId,
      { id: entityId, name: 'Beta Alanina 5g Ultra', dosage: '5g', schedule: 'Pré-treino' },
      'ath_01',
      'UPDATE',
      false
    );

    // Under explicit entity conflict policy, queue holds the merged state without duplicate conflicting writes
    expect(sync.getQueue()).toHaveLength(1);

    const consolidatedItem = sync.getQueue()[0];
    const parsedPayload = JSON.parse(consolidatedItem.payloadJson);

    expect(parsedPayload.name).toBe('Beta Alanina 5g Ultra');
    expect(parsedPayload.dosage).toBe('5g');
    expect(parsedPayload.schedule).toBe('Pré-treino');

    // Reconnecting online triggers flush of the single authoritative payload
    sync.setOnline(true);
    const result = await sync.flushPendingQueueToFirestore();

    expect(result.success).toBe(true);
    expect(result.syncedCount).toBe(1);

    const setDocCalls = (firestoreModule.setDoc as any).mock.calls;
    const lastCall = setDocCalls[setDocCalls.length - 1];
    expect(lastCall[0].path).toBe('prescriptions/supplements/athletes/ath_01/items/sup_beta_alanine');
    expect(lastCall[1].name).toBe('Beta Alanina 5g Ultra');
    expect(lastCall[1].dosage).toBe('5g');
  });

  // =========================================================================
  // SCENARIO 3: Falha antiga seguida de edição mais recente
  // =========================================================================
  it('deve fazer com que uma edição mais recente substitua uma mutação antiga com falha e limpe o backoff delay', async () => {
    const sync = new SyncService(mockDb, mockStorage as any);
    sync.setOnline(true);

    const entityId = 'ath_pedro';

    // 1. Simulate a failed initial mutation that enters exponential backoff
    (firestoreModule.setDoc as any).mockRejectedValueOnce(new Error('IAM Permission Denied or Network Offline'));

    await sync.flushPendingQueueToFirestore(); // ensure clean state

    // Enqueue initial mutation which fails
    sync.enqueueMutation(
      'athlete',
      entityId,
      { id: entityId, name: 'Pedro Antigo', phone: '11999990001' },
      entityId,
      'INSERT',
      false
    );

    // Flush should attempt and fail, recording retryCount and nextRetryAt in the future
    const failedResult = await sync.flushPendingQueueToFirestore();
    expect(failedResult.failedCount).toBe(1);
    expect(sync.getQueue()).toHaveLength(1);

    const failedItem = sync.getQueue()[0];
    expect(failedItem.retryCount).toBe(1);
    expect(failedItem.nextRetryAt).toBeDefined();
    expect(failedItem.nextRetryAt!).toBeGreaterThan(Date.now());
    expect(failedItem.lastError).toBe('IAM Permission Denied or Network Offline');

    // 2. User submits a newer edit for the same entity while backoff is still active
    (firestoreModule.setDoc as any).mockResolvedValue(undefined); // network restored

    sync.enqueueMutation(
      'athlete',
      entityId,
      { id: entityId, name: 'Pedro Atualizado Recente', phone: '11999990002' },
      entityId,
      'UPDATE',
      false // do not autoFlush yet so we can inspect queue
    );

    // Stale failure must be superseded, and backoff cleared
    expect(sync.getQueue()).toHaveLength(1);
    const activeItem = sync.getQueue()[0];
    expect(activeItem.retryCount).toBe(0);
    expect(activeItem.nextRetryAt).toBeUndefined();
    expect(activeItem.lastError).toBeUndefined();

    const parsedData = JSON.parse(activeItem.payloadJson);
    expect(parsedData.name).toBe('Pedro Atualizado Recente');

    // 3. Flush executes immediately without waiting for the old backoff timer
    const flushRes = await sync.flushPendingQueueToFirestore();
    expect(flushRes.success).toBe(true);
    expect(flushRes.syncedCount).toBe(1);
    expect(sync.getQueue()).toHaveLength(0);
  });

  // =========================================================================
  // SCENARIO 4: Retomada automática e processamento de novas pendências
  // =========================================================================
  it('deve processar novas pendências enfileiradas continuamente durante a execução do lote', async () => {
    const sync = new SyncService(mockDb, mockStorage as any);
    sync.setOnline(true);

    let setDocCallCount = 0;
    (firestoreModule.setDoc as any).mockImplementation(async () => {
      setDocCallCount++;
      // While the first item is writing, enqueue a second mutation dynamically
      if (setDocCallCount === 1) {
        sync.enqueueMutation(
          'prescription_nutrition',
          'main-plan',
          { id: 'main-plan', dailyTargetCalories: 2600 },
          'ath_01',
          'UPDATE',
          false
        );
      }
      return undefined;
    });

    // Enqueue initial item
    sync.enqueueMutation(
      'athlete',
      'ath_01',
      { id: 'ath_01', name: 'Atleta Batch 1' },
      'ath_01',
      'UPDATE',
      false
    );

    // Trigger flush
    const finalResult = await sync.flushPendingQueueToFirestore();

    // The flush loop must have picked up the dynamically enqueued mutation and finished it!
    expect(finalResult.syncedCount).toBe(2);
    expect(sync.getQueue()).toHaveLength(0);
    expect(setDocCallCount).toBe(2);
  });

  // =========================================================================
  // SCENARIO 5: Envelope DELETE consistente em handlers
  // =========================================================================
  it('deve extrair e respeitar operation DELETE tanto no envelope payload quanto como argumento', async () => {
    const sync = new SyncService(mockDb, mockStorage as any);
    sync.setOnline(true);

    // Enqueue using payload envelope operation: 'DELETE'
    sync.enqueueMutation(
      'formula_template',
      'tmpl_99',
      { id: 'tmpl_99', operation: 'DELETE' },
      'ath_01',
      'UPDATE',
      false
    );

    const flushRes = await sync.flushPendingQueueToFirestore();
    expect(flushRes.success).toBe(true);

    expect((firestoreModule.deleteDoc as any)).toHaveBeenCalled();
    const lastDeleteCall = (firestoreModule.deleteDoc as any).mock.calls[0];
    expect(lastDeleteCall[0].path).toBe('formula_templates/tmpl_99');
    expect(sync.getQueue()).toHaveLength(0);
  });
});
