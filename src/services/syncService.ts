import {
  CloudSyncStatus,
  PendingSyncItem,
  SyncEntityDomain,
  PrescriberProfile,
  AthleteProfile,
  LibraryExercise
} from '../types';
import { db } from '../lib/firebase';
import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  Firestore
} from 'firebase/firestore';

export interface PathValidationResult {
  isValid: boolean;
  error?: string;
  fullPath: string;
  collectionPath: string;
  documentId: string;
  segments: string[];
}

export interface DomainPathMapping {
  getCollectionPath: (athleteId: string, payload?: Record<string, any>) => string;
  getDocumentId: (entityId: string, athleteId: string, payload?: Record<string, any>) => string;
  description: string;
}

/**
 * Centralized, typed domain schema for mapping each SyncEntityDomain to a valid Firestore path.
 */
export const SYNC_DOMAIN_CONFIG: Record<SyncEntityDomain, DomainPathMapping> = {
  athlete: {
    getCollectionPath: () => 'athletes',
    getDocumentId: (entityId, athleteId) => entityId || athleteId,
    description: 'Perfil e cadastro do atleta'
  },
  prescriber_profile: {
    getCollectionPath: () => 'prescribers',
    getDocumentId: (entityId) => entityId,
    description: 'Perfil de prescritor / equipe médica e técnica'
  },
  workout_template: {
    getCollectionPath: () => 'workout_templates',
    getDocumentId: (entityId) => entityId,
    description: 'Template oficial de treinamento'
  },
  formula_template: {
    getCollectionPath: () => 'formula_templates',
    getDocumentId: (entityId) => entityId,
    description: 'Template oficial de fórmulas manipuladas'
  },
  exercise_library: {
    getCollectionPath: () => 'exercises',
    getDocumentId: (entityId) => entityId,
    description: 'Banco de dados de exercícios'
  },
  checkin_exercise_set: {
    getCollectionPath: (athleteId) => `athletes/${athleteId}/exercise_set_checkins`,
    getDocumentId: (entityId) => entityId,
    description: 'Check-in de execução de série'
  },
  checkin_meal: {
    getCollectionPath: (athleteId) => `athletes/${athleteId}/meal_checkins`,
    getDocumentId: (entityId) => entityId,
    description: 'Check-in de refeição e dieta'
  },
  checkin_supplement: {
    getCollectionPath: (athleteId) => `athletes/${athleteId}/supplement_checkins`,
    getDocumentId: (entityId) => entityId,
    description: 'Check-in de suplementação e manipulados'
  },
  checkin_anthropometric: {
    getCollectionPath: (athleteId) => `athletes/${athleteId}/anthropometric_evaluations`,
    getDocumentId: (entityId) => entityId,
    description: 'Avaliação antropométrica e fotos'
  },
  prescription_workout: {
    getCollectionPath: () => 'prescriptions/workouts/athletes',
    getDocumentId: (entityId, athleteId) => athleteId || entityId,
    description: 'Prescrição oficial de treinamento do atleta'
  },
  prescription_nutrition: {
    getCollectionPath: () => 'prescriptions/nutrition/athletes',
    getDocumentId: (entityId, athleteId) => athleteId || entityId,
    description: 'Prescrição nutricional oficial do atleta'
  },
  prescription_supplement: {
    getCollectionPath: () => 'prescriptions/supplements/athletes',
    getDocumentId: (entityId, athleteId) => athleteId || entityId,
    description: 'Prescrição oficial de suplementação do atleta'
  }
};

/**
 * Validates any Firestore path before writing.
 * In Firestore, document paths must strictly have an EVEN number of segments (col/doc/col/doc...).
 */
export function validateFirestorePath(
  collectionPath: string,
  documentId: string
): PathValidationResult {
  if (!collectionPath || typeof collectionPath !== 'string') {
    return {
      isValid: false,
      error: 'Caminho de coleção inválido ou ausente.',
      fullPath: '',
      collectionPath: '',
      documentId: '',
      segments: []
    };
  }

  if (!documentId || typeof documentId !== 'string' || documentId.trim() === '') {
    return {
      isValid: false,
      error: 'Document ID inválido ou ausente.',
      fullPath: '',
      collectionPath: '',
      documentId: '',
      segments: []
    };
  }

  const cleanCollection = collectionPath.replace(/^\/+|\/+$/g, '').trim();
  const cleanDocId = documentId.replace(/^\/+|\/+$/g, '').trim();

  if (!cleanCollection || !cleanDocId) {
    return {
      isValid: false,
      error: 'Segmentos de caminho não podem ser vazios.',
      fullPath: '',
      collectionPath: '',
      documentId: '',
      segments: []
    };
  }

  if (cleanDocId.includes('/')) {
    return {
      isValid: false,
      error: `Document ID não pode conter barras: "${cleanDocId}"`,
      fullPath: `${cleanCollection}/${cleanDocId}`,
      collectionPath: cleanCollection,
      documentId: cleanDocId,
      segments: []
    };
  }

  const fullPath = `${cleanCollection}/${cleanDocId}`;
  const segments = fullPath.split('/').filter(Boolean);

  if (segments.length % 2 !== 0) {
    return {
      isValid: false,
      error: `Caminho do documento possui número ímpar de segmentos (${segments.length}): "${fullPath}". Documentos Firestore exigem número par de segmentos.`,
      fullPath,
      collectionPath: cleanCollection,
      documentId: cleanDocId,
      segments
    };
  }

  for (const seg of segments) {
    if (!seg || seg.length > 1500) {
      return {
        isValid: false,
        error: `Segmento de caminho excede o limite de caracteres: "${seg}"`,
        fullPath,
        collectionPath: cleanCollection,
        documentId: cleanDocId,
        segments
      };
    }
  }

  return {
    isValid: true,
    fullPath,
    collectionPath: cleanCollection,
    documentId: cleanDocId,
    segments
  };
}

/**
 * Resolves collection, documentId and fullPath for a given domain and pending item.
 */
export function resolveFirestorePathForDomain(
  domain: SyncEntityDomain,
  entityId: string,
  athleteId: string = 'ath_01',
  payload: Record<string, any> = {}
): PathValidationResult {
  const config = SYNC_DOMAIN_CONFIG[domain];
  if (!config) {
    return {
      isValid: false,
      error: `Domínio de sincronização não mapeado no schema centralizado: "${domain}"`,
      fullPath: '',
      collectionPath: '',
      documentId: '',
      segments: []
    };
  }

  const effectiveAthleteId = payload.athleteId || athleteId || 'ath_01';
  const collectionPath = config.getCollectionPath(effectiveAthleteId, payload);
  const docId = config.getDocumentId(entityId, effectiveAthleteId, payload);

  return validateFirestorePath(collectionPath, docId);
}

export interface FirestoreDocumentPayload {
  collection: string;
  documentId: string;
  fullPath: string;
  athleteId: string;
  domain: SyncEntityDomain;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: Record<string, any>;
  metadata: {
    clientTimestamp: number;
    syncedAt: number;
    syncVersion: number;
    platform: string;
    status: 'SYNCED';
  };
}

export interface SyncItemResult {
  itemId: string;
  domain: SyncEntityDomain;
  entityId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  fullPath: string;
  status: 'CONFIRMED' | 'FAILED' | 'SKIPPED_BACKOFF' | 'INVALID_PATH';
  error?: string;
  syncedAt?: number;
}

export interface SyncFlushResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  totalAttempted: number;
  results: SyncItemResult[];
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  type: 'ONLINE' | 'OFFLINE' | 'SYNC_START' | 'SYNC_SUCCESS' | 'SYNC_ERROR' | 'ENQUEUE' | 'RETRY_SCHEDULED';
  message: string;
  domain?: SyncEntityDomain;
  collection?: string;
  documentId?: string;
  payloadSummary?: string;
  syncedCount?: number;
  errorCount?: number;
}

export type SyncEventListener = (status: CloudSyncStatus, log?: SyncLogEntry) => void;

export const STORAGE_QUEUE_KEY = 'lm_team_checkin_sync_queue_v1';
export const STORAGE_LOGS_KEY = 'lm_team_sync_logs_v1';

export class SyncService {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncPromise: Promise<SyncFlushResult> | null = null;
  private lastSyncedAt: string | null = null;
  private cloudProvider: 'Supabase' | 'Firestore' = 'Firestore';
  private prescriptionVersion: number = 4;
  private queue: PendingSyncItem[] = [];
  private logs: SyncLogEntry[] = [];
  private listeners: Set<SyncEventListener> = new Set();
  private initialized: boolean = false;
  private customDb: Firestore | null = null;
  private customStorage: Storage | null = null;
  private lastSyncedCount: number = 0;

  constructor(customDb?: Firestore | null, customStorage?: Storage | null) {
    if (customDb !== undefined) {
      this.customDb = customDb;
    }
    if (customStorage !== undefined) {
      this.customStorage = customStorage;
    }
    this.loadPersistedState();
    this.initNetworkListeners();
  }

  public setCustomDb(dbInstance: Firestore | null) {
    this.customDb = dbInstance;
  }

  public setCustomStorage(storageInstance: Storage | null) {
    this.customStorage = storageInstance;
    this.loadPersistedState();
  }

  private getEffectiveDb(): Firestore | null {
    return this.customDb !== null ? this.customDb : db;
  }

  private getStorage(): Storage | null {
    if (this.customStorage) return this.customStorage;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
      if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
        return (globalThis as any).localStorage;
      }
    } catch {
      return null;
    }
    return null;
  }

  private initNetworkListeners() {
    if (typeof window === 'undefined' || this.initialized) return;

    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      this.isOnline = navigator.onLine;
    }

    window.addEventListener('online', () => {
      this.handleNetworkChange(true, 'Rede do dispositivo restabelecida (evento nativo online)');
    });

    window.addEventListener('offline', () => {
      this.handleNetworkChange(false, 'Dispositivo desconectado da rede (evento nativo offline)');
    });

    this.initialized = true;
  }

  public loadPersistedState() {
    try {
      const storage = this.getStorage();
      if (storage) {
        const storedQueue = storage.getItem(STORAGE_QUEUE_KEY);
        if (storedQueue) {
          const parsed = JSON.parse(storedQueue);
          if (Array.isArray(parsed)) {
            this.queue = parsed;
          }
        }
        const storedLogs = storage.getItem(STORAGE_LOGS_KEY);
        if (storedLogs) {
          const parsed = JSON.parse(storedLogs);
          if (Array.isArray(parsed)) {
            this.logs = parsed;
          }
        }
      }
    } catch {
      this.queue = [];
      this.logs = [];
    }
  }

  public persistState() {
    try {
      const storage = this.getStorage();
      if (storage) {
        storage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(this.queue));
        storage.setItem(STORAGE_LOGS_KEY, JSON.stringify(this.logs.slice(0, 50)));
      }
    } catch {
      // ignore storage quota or private browsing errors
    }
  }

  public subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(log?: SyncLogEntry) {
    if (log) {
      this.logs = [log, ...this.logs.slice(0, 49)];
    }
    this.persistState();
    const status = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status, log);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  public getStatus(): CloudSyncStatus {
    const errorCount = this.queue.filter((item) => (item.retryCount || 0) > 0).length;

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      pendingCount: this.queue.length,
      syncedCount: this.lastSyncedCount,
      errorCount,
      cloudProvider: this.cloudProvider,
      prescriptionVersion: this.prescriptionVersion,
      checkInSyncQueue: [...this.queue]
    };
  }

  public getLogs(): SyncLogEntry[] {
    return [...this.logs];
  }

  public setCloudProvider(provider: 'Supabase' | 'Firestore') {
    this.cloudProvider = provider;
    this.notify({
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      type: 'SYNC_START',
      message: `Provedor de nuvem alterado para ${provider}.`
    });
  }

  public handleNetworkChange(isOnline: boolean, reason?: string) {
    const previousState = this.isOnline;
    this.isOnline = isOnline;
    const timeStr = new Date().toLocaleTimeString('pt-BR');

    if (!previousState && isOnline) {
      const log: SyncLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: timeStr,
        type: 'ONLINE',
        message: reason || 'Conexão restabelecida. Disparando sincronização com Firestore...'
      };
      this.notify(log);
      this.flushPendingQueueToFirestore();
    } else if (previousState && !isOnline) {
      const log: SyncLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: timeStr,
        type: 'OFFLINE',
        message: reason || 'Modo offline ativado. Mutações serão armazenadas no Room localmente.'
      };
      this.notify(log);
    } else {
      this.notify();
    }
  }

  public setOnline(isOnline: boolean) {
    this.handleNetworkChange(
      isOnline,
      isOnline
        ? 'Modo Online ativado pelo usuário. Iniciando envio de deltas para Firebase Firestore.'
        : 'Modo Offline ativado pelo usuário. Mutações enfileiradas na tabela sync_queue.'
    );
  }

  public enqueueMutation(
    domain: SyncEntityDomain,
    entityId: string,
    payload: any,
    athleteId: string = 'ath_01',
    operation: 'INSERT' | 'UPDATE' | 'DELETE' = 'UPDATE',
    autoFlush: boolean = true
  ): PendingSyncItem {
    const newItem: PendingSyncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entityId,
      domain,
      operation,
      payloadJson: JSON.stringify({ ...payload, athleteId }),
      createdAt: Date.now(),
      retryCount: 0
    };

    this.queue = [newItem, ...this.queue];

    const timeStr = new Date().toLocaleTimeString('pt-BR');
    const log: SyncLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: timeStr,
      type: 'ENQUEUE',
      domain,
      documentId: entityId,
      message: `Mutação salva localmente e adicionada à fila sync_queue (${domain} - ${operation}).`,
      payloadSummary: JSON.stringify(payload).substring(0, 80)
    };

    this.notify(log);

    if (autoFlush && this.isOnline) {
      this.flushPendingQueueToFirestore().catch((err) => {
        console.warn('Auto flush error:', err);
      });
    }

    return newItem;
  }

  /**
   * Maps a pending sync item to a validated FirestoreDocumentPayload
   */
  public mapItemToFirestoreDoc(item: PendingSyncItem): {
    payload?: FirestoreDocumentPayload;
    validation: PathValidationResult;
  } {
    let parsedPayload: Record<string, any> = {};
    try {
      parsedPayload = JSON.parse(item.payloadJson);
    } catch {
      parsedPayload = { raw: item.payloadJson };
    }

    const athleteId = parsedPayload.athleteId || 'ath_01';
    const validation = resolveFirestorePathForDomain(
      item.domain,
      item.entityId || item.id,
      athleteId,
      parsedPayload
    );

    if (!validation.isValid) {
      return { validation };
    }

    const docPayload: FirestoreDocumentPayload = {
      collection: validation.collectionPath,
      documentId: validation.documentId,
      fullPath: validation.fullPath,
      athleteId,
      domain: item.domain,
      operation: item.operation,
      data: parsedPayload,
      metadata: {
        clientTimestamp: item.createdAt,
        syncedAt: Date.now(),
        syncVersion: this.prescriptionVersion,
        platform: 'Android Room 2.6 (Jetpack) / Web Client',
        status: 'SYNCED'
      }
    };

    return { payload: docPayload, validation };
  }

  /**
   * Flushes the pending queue to Firestore with controlled individual confirmation,
   * exponential backoff for failed writes, and exact queue removal of confirmed items only.
   */
  public async flushPendingQueueToFirestore(options?: {
    forceRetry?: boolean;
    useBatch?: boolean;
  }): Promise<SyncFlushResult> {
    if (this.isSyncing && this.syncPromise) {
      return this.syncPromise;
    }

    this.syncPromise = this.performFlush(options);
    try {
      const result = await this.syncPromise;
      return result;
    } finally {
      this.syncPromise = null;
      this.isSyncing = false;
    }
  }

  private async performFlush(options?: {
    forceRetry?: boolean;
    useBatch?: boolean;
  }): Promise<SyncFlushResult> {
    if (!this.isOnline) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        totalAttempted: 0,
        results: []
      };
    }

    if (this.queue.length === 0) {
      const now = new Date();
      this.lastSyncedAt = `Hoje às ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      this.lastSyncedCount = 0;
      this.notify();
      return {
        success: true,
        syncedCount: 0,
        failedCount: 0,
        totalAttempted: 0,
        results: []
      };
    }

    const currentDb = this.getEffectiveDb();
    if (!currentDb) {
      const errorLog: SyncLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        type: 'SYNC_ERROR',
        message: 'Instância do Firestore indisponível. Itens mantidos na fila.'
      };
      this.notify(errorLog);
      return {
        success: false,
        syncedCount: 0,
        failedCount: this.queue.length,
        totalAttempted: 0,
        results: []
      };
    }

    this.isSyncing = true;
    const nowTimestamp = Date.now();
    const timeStr = new Date().toLocaleTimeString('pt-BR');

    // Filter items eligible for sync based on exponential backoff
    const eligibleItems: PendingSyncItem[] = [];
    const skippedItems: PendingSyncItem[] = [];

    for (const item of this.queue) {
      if (
        !options?.forceRetry &&
        item.nextRetryAt &&
        nowTimestamp < item.nextRetryAt
      ) {
        skippedItems.push(item);
      } else {
        eligibleItems.push(item);
      }
    }

    if (eligibleItems.length === 0) {
      this.isSyncing = false;
      this.notify({
        id: `log_${Date.now()}`,
        timestamp: timeStr,
        type: 'SYNC_START',
        message: `Itens na fila aguardando intervalo de backoff exponencial (${skippedItems.length} item(ns)).`
      });
      return {
        success: true,
        syncedCount: 0,
        failedCount: 0,
        totalAttempted: 0,
        results: []
      };
    }

    this.notify({
      id: `log_${Date.now()}`,
      timestamp: timeStr,
      type: 'SYNC_START',
      message: `Iniciando sincronização de ${eligibleItems.length} mutação(ões) com confirmação real no Firestore...`,
      syncedCount: eligibleItems.length
    });

    const confirmedItemIds = new Set<string>();
    const results: SyncItemResult[] = [];
    let syncedCount = 0;
    let failedCount = 0;

    // Controlled individual write execution
    for (const item of eligibleItems) {
      const { payload, validation } = this.mapItemToFirestoreDoc(item);

      if (!validation.isValid || !payload) {
        const errorMsg = validation.error || 'Validação de caminho falhou';
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = errorMsg;
        item.lastErrorMessage = errorMsg;

        const baseDelay = Math.min(1000 * Math.pow(2, item.retryCount), 60000);
        item.nextRetryAt = Date.now() + baseDelay;

        failedCount++;
        results.push({
          itemId: item.id,
          domain: item.domain,
          entityId: item.entityId,
          operation: item.operation,
          fullPath: validation.fullPath,
          status: 'INVALID_PATH',
          error: errorMsg
        });
        continue;
      }

      try {
        const docRef = doc(currentDb, validation.collectionPath, validation.documentId);

        if (item.operation === 'DELETE') {
          await deleteDoc(docRef);
        } else {
          await setDoc(
            docRef,
            {
              ...payload.data,
              _syncMetadata: payload.metadata
            },
            { merge: true }
          );
        }

        // CONFIRMED by Firestore
        confirmedItemIds.add(item.id);
        syncedCount++;
        item.syncedAt = Date.now();

        results.push({
          itemId: item.id,
          domain: item.domain,
          entityId: item.entityId,
          operation: item.operation,
          fullPath: validation.fullPath,
          status: 'CONFIRMED',
          syncedAt: item.syncedAt
        });
      } catch (writeErr: any) {
        const errorMsg = writeErr?.message || String(writeErr);
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = errorMsg;
        item.lastErrorMessage = errorMsg;

        const baseDelay = Math.min(1000 * Math.pow(2, item.retryCount), 60000);
        const jitter = Math.floor(Math.random() * 300);
        item.nextRetryAt = Date.now() + baseDelay + jitter;

        failedCount++;
        results.push({
          itemId: item.id,
          domain: item.domain,
          entityId: item.entityId,
          operation: item.operation,
          fullPath: validation.fullPath,
          status: 'FAILED',
          error: errorMsg
        });
      }
    }

    // REMOVE ONLY CONFIRMED ITEMS FROM QUEUE
    this.queue = this.queue.filter((item) => !confirmedItemIds.has(item.id));
    this.isSyncing = false;
    this.lastSyncedCount = syncedCount;

    if (syncedCount > 0) {
      const now = new Date();
      this.lastSyncedAt = `Hoje às ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }

    if (failedCount === 0 && syncedCount > 0) {
      const successLog: SyncLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        type: 'SYNC_SUCCESS',
        message: `Sincronização 100% confirmada! ${syncedCount} documento(s) gravados com sucesso no Firestore.`,
        syncedCount,
        errorCount: 0
      };
      this.notify(successLog);
    } else if (syncedCount > 0 && failedCount > 0) {
      const partialLog: SyncLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        type: 'SYNC_ERROR',
        message: `Sincronização parcial: ${syncedCount} confirmado(s), ${failedCount} com erro mantido(s) na fila com backoff exponencial.`,
        syncedCount,
        errorCount: failedCount
      };
      this.notify(partialLog);
    } else if (failedCount > 0) {
      const errorLog: SyncLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        type: 'SYNC_ERROR',
        message: `Falha na sincronização de ${failedCount} item(ns). Fila mantida com agendamento de retry exponencial.`,
        syncedCount: 0,
        errorCount: failedCount
      };
      this.notify(errorLog);
    } else {
      this.notify();
    }

    return {
      success: failedCount === 0 && syncedCount > 0,
      syncedCount,
      failedCount,
      totalAttempted: eligibleItems.length,
      results
    };
  }

  /**
   * Load prescribers from Firestore
   */
  public async loadPrescribersFromFirestore(): Promise<PrescriberProfile[]> {
    const currentDb = this.getEffectiveDb();
    if (!currentDb) return [];
    try {
      const snap = await getDocs(collection(currentDb, 'prescribers'));
      const list: PrescriberProfile[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.id) {
          list.push(data as PrescriberProfile);
        }
      });
      return list;
    } catch (err) {
      console.warn('Could not load prescribers from Firestore:', err);
      return [];
    }
  }

  /**
   * Load athletes from Firestore
   */
  public async loadAthletesFromFirestore(): Promise<AthleteProfile[]> {
    const currentDb = this.getEffectiveDb();
    if (!currentDb) return [];
    try {
      const snap = await getDocs(collection(currentDb, 'athletes'));
      const list: AthleteProfile[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.id) {
          list.push(data as AthleteProfile);
        }
      });
      return list;
    } catch (err) {
      console.warn('Could not load athletes from Firestore:', err);
      return [];
    }
  }

  /**
   * Initialize and synchronize all prescribers and athletes with Firestore
   */
  public async initializeAndSyncCredentials(
    defaultPrescribers: PrescriberProfile[],
    defaultAthletes: AthleteProfile[]
  ): Promise<{ prescribers: PrescriberProfile[]; athletes: AthleteProfile[] }> {
    const currentDb = this.getEffectiveDb();
    if (!currentDb) {
      return { prescribers: defaultPrescribers, athletes: defaultAthletes };
    }

    try {
      const firestorePrescribers = await this.loadPrescribersFromFirestore();
      const firestoreAthletes = await this.loadAthletesFromFirestore();

      const prescribersMap = new Map<string, PrescriberProfile>();
      for (const p of defaultPrescribers) {
        prescribersMap.set(p.id, p);
      }
      for (const p of firestorePrescribers) {
        prescribersMap.set(p.id, {
          ...(prescribersMap.get(p.id) || {}),
          ...p
        });
      }

      for (const p of prescribersMap.values()) {
        const existsInFirestore = firestorePrescribers.some((fp) => fp.id === p.id);
        if (!existsInFirestore) {
          try {
            const validation = validateFirestorePath('prescribers', p.id);
            if (validation.isValid) {
              await setDoc(doc(currentDb, 'prescribers', p.id), p, { merge: true });
            }
          } catch (e) {
            console.warn(`Could not seed prescriber ${p.id} to Firestore:`, e);
          }
        }
      }

      const athletesMap = new Map<string, AthleteProfile>();
      for (const a of defaultAthletes) {
        athletesMap.set(a.id, a);
      }
      for (const a of firestoreAthletes) {
        athletesMap.set(a.id, {
          ...(athletesMap.get(a.id) || {}),
          ...a
        });
      }

      for (const a of athletesMap.values()) {
        const existsInFirestore = firestoreAthletes.some((fa) => fa.id === a.id);
        if (!existsInFirestore) {
          try {
            const validation = validateFirestorePath('athletes', a.id);
            if (validation.isValid) {
              await setDoc(doc(currentDb, 'athletes', a.id), a, { merge: true });
            }
          } catch (e) {
            console.warn(`Could not seed athlete ${a.id} to Firestore:`, e);
          }
        }
      }

      return {
        prescribers: Array.from(prescribersMap.values()),
        athletes: Array.from(athletesMap.values())
      };
    } catch (err) {
      console.warn('Error during profiles synchronization:', err);
      return { prescribers: defaultPrescribers, athletes: defaultAthletes };
    }
  }

  /**
   * Load exercises from Firestore library
   */
  public async loadExercisesFromFirestore(): Promise<LibraryExercise[]> {
    const currentDb = this.getEffectiveDb();
    if (!currentDb) return [];
    try {
      const snap = await getDocs(collection(currentDb, 'exercises'));
      const exercises: LibraryExercise[] = [];
      snap.forEach((d) => {
        exercises.push(d.data() as LibraryExercise);
      });
      return exercises;
    } catch (err) {
      console.warn('Could not load exercises from Firestore:', err);
      return [];
    }
  }

  /**
   * Save or update an exercise in the Firestore library
   */
  public async saveExerciseToFirestore(exercise: LibraryExercise): Promise<boolean> {
    const currentDb = this.getEffectiveDb();
    if (!currentDb || !exercise.id) return false;

    const validation = validateFirestorePath('exercises', exercise.id);
    if (!validation.isValid) {
      console.warn('Invalid exercise path:', validation.error);
      return false;
    }

    try {
      await setDoc(doc(currentDb, 'exercises', exercise.id), exercise, { merge: true });
      this.notify({
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        type: 'SYNC_SUCCESS',
        message: `Exercício "${exercise.name}" salvo no Banco de Exercícios do Firestore.`
      });
      return true;
    } catch (err) {
      console.warn('Error saving exercise to Firestore:', err);
      return false;
    }
  }

  /**
   * Delete an exercise from the Firestore library
   */
  public async deleteExerciseFromFirestore(exerciseId: string): Promise<boolean> {
    const currentDb = this.getEffectiveDb();
    if (!currentDb || !exerciseId) return false;

    const validation = validateFirestorePath('exercises', exerciseId);
    if (!validation.isValid) {
      console.warn('Invalid exercise path:', validation.error);
      return false;
    }

    try {
      await deleteDoc(doc(currentDb, 'exercises', exerciseId));
      this.notify({
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        type: 'SYNC_SUCCESS',
        message: `Exercício ID "${exerciseId}" removido do Banco de Exercícios do Firestore.`
      });
      return true;
    } catch (err) {
      console.warn('Error deleting exercise from Firestore:', err);
      return false;
    }
  }

  /**
   * Initialize and synchronize the Exercise Bank on startup
   */
  public async initializeAndSyncExercises(
    defaultExercises: LibraryExercise[]
  ): Promise<LibraryExercise[]> {
    const currentDb = this.getEffectiveDb();
    if (!currentDb) {
      return defaultExercises;
    }

    try {
      const firestoreExercises = await this.loadExercisesFromFirestore();
      const exercisesMap = new Map<string, LibraryExercise>();

      for (const ex of defaultExercises) {
        exercisesMap.set(ex.id, ex);
      }

      for (const ex of firestoreExercises) {
        exercisesMap.set(ex.id, {
          ...(exercisesMap.get(ex.id) || {}),
          ...ex
        });
      }

      for (const ex of exercisesMap.values()) {
        const existsInFirestore = firestoreExercises.some((fe) => fe.id === ex.id);
        if (!existsInFirestore) {
          try {
            const validation = validateFirestorePath('exercises', ex.id);
            if (validation.isValid) {
              await setDoc(doc(currentDb, 'exercises', ex.id), ex, { merge: true });
            }
          } catch (e) {
            console.warn(`Could not seed exercise ${ex.id} to Firestore:`, e);
          }
        }
      }

      return Array.from(exercisesMap.values());
    } catch (err) {
      console.warn('Error during exercise library synchronization:', err);
      return defaultExercises;
    }
  }

  /**
   * Clear the pending queue manually
   */
  public clearQueue() {
    this.queue = [];
    this.notify({
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      type: 'SYNC_START',
      message: 'Fila de sincronização limpa manualmente.'
    });
  }

  /**
   * Utility for testing: set entire queue
   */
  public setQueueForTesting(queue: PendingSyncItem[]) {
    this.queue = [...queue];
    this.persistState();
    this.notify();
  }
}

// Export singleton instance
export const syncService = new SyncService();
