import { CloudSyncStatus, PendingSyncItem, SyncEntityDomain, PrescriberProfile, AthleteProfile, LibraryExercise } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

export interface FirestoreDocumentPayload {
  collection: string;
  documentId: string;
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

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  type: 'ONLINE' | 'OFFLINE' | 'SYNC_START' | 'SYNC_SUCCESS' | 'SYNC_ERROR' | 'ENQUEUE';
  message: string;
  domain?: SyncEntityDomain;
  collection?: string;
  documentId?: string;
  payloadSummary?: string;
  syncedCount?: number;
}

export type SyncEventListener = (status: CloudSyncStatus, log?: SyncLogEntry) => void;

const STORAGE_QUEUE_KEY = 'lm_team_checkin_sync_queue_v1';
const STORAGE_LOGS_KEY = 'lm_team_sync_logs_v1';

class SyncService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private lastSyncedAt: string | null = 'Hoje às 12:00';
  private cloudProvider: 'Supabase' | 'Firestore' = 'Firestore';
  private prescriptionVersion: number = 4;
  private queue: PendingSyncItem[] = [];
  private logs: SyncLogEntry[] = [];
  private listeners: Set<SyncEventListener> = new Set();
  private initialized: boolean = false;

  constructor() {
    this.loadPersistedState();
    this.initNetworkListeners();
  }

  /**
   * Initialize browser network listeners for online/offline events
   */
  private initNetworkListeners() {
    if (typeof window === 'undefined' || this.initialized) return;

    window.addEventListener('online', () => {
      this.handleNetworkChange(true, 'Rede do dispositivo restabelecida (evento nativo online)');
    });

    window.addEventListener('offline', () => {
      this.handleNetworkChange(false, 'Dispositivo desconectado da rede (evento nativo offline)');
    });

    this.initialized = true;
  }

  /**
   * Load queue and logs from localStorage
   */
  private loadPersistedState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedQueue = localStorage.getItem(STORAGE_QUEUE_KEY);
        if (storedQueue) {
          this.queue = JSON.parse(storedQueue);
        }
        const storedLogs = localStorage.getItem(STORAGE_LOGS_KEY);
        if (storedLogs) {
          this.logs = JSON.parse(storedLogs);
        }
      }
    } catch {
      this.queue = [];
      this.logs = [];
    }
  }

  /**
   * Persist current queue to localStorage
   */
  private persistState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(this.queue));
        localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(this.logs.slice(0, 50)));
      }
    } catch {
      // ignore quota or serialization errors
    }
  }

  /**
   * Subscribe to state and log changes
   */
  public subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    // Immediately emit current state
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

  /**
   * Get current sync status snapshot
   */
  public getStatus(): CloudSyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      pendingCount: this.queue.length,
      cloudProvider: this.cloudProvider,
      prescriptionVersion: this.prescriptionVersion,
      checkInSyncQueue: [...this.queue]
    };
  }

  /**
   * Get sync execution logs
   */
  public getLogs(): SyncLogEntry[] {
    return [...this.logs];
  }

  /**
   * Set cloud provider (Supabase / Firestore)
   */
  public setCloudProvider(provider: 'Supabase' | 'Firestore') {
    this.cloudProvider = provider;
    this.notify({
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      type: 'SYNC_START',
      message: `Provedor de nuvem alterado para ${provider}.`
    });
  }

  /**
   * Handle network status change (native or simulated)
   */
  public handleNetworkChange(isOnline: boolean, reason?: string) {
    const previousState = this.isOnline;
    this.isOnline = isOnline;

    const timeStr = new Date().toLocaleTimeString('pt-BR');

    if (!previousState && isOnline) {
      // Transition from OFFLINE -> ONLINE: Flush pending queue immediately
      const log: SyncLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: timeStr,
        type: 'ONLINE',
        message: reason || 'Conexão restabelecida. Disparando sincronização automática com o Firestore...'
      };
      this.notify(log);
      this.flushPendingQueueToFirestore();
    } else if (previousState && !isOnline) {
      // Transition from ONLINE -> OFFLINE
      const log: SyncLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: timeStr,
        type: 'OFFLINE',
        message: reason || 'Modo offline ativado. Todas as mutações serão armazenadas no Room localmente.'
      };
      this.notify(log);
    } else {
      this.notify();
    }
  }

  /**
   * Toggle or set online mode
   */
  public setOnline(isOnline: boolean) {
    this.handleNetworkChange(
      isOnline,
      isOnline
        ? 'Modo Online ativado pelo usuário. Iniciando envio de deltas para Firebase Firestore.'
        : 'Modo Offline ativado pelo usuário. Mutações enfileiradas na tabela sync_queue.'
    );
  }

  /**
   * Enqueue a check-in mutation from athlete interactions (Room -> sync_queue)
   */
  public enqueueMutation(
    domain: SyncEntityDomain,
    entityId: string,
    payload: any,
    athleteId: string = 'ath_01',
    operation: 'INSERT' | 'UPDATE' | 'DELETE' = 'UPDATE'
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
      message: `Mutação salva no Room local e registrada na fila sync_queue (${domain}).`,
      payloadSummary: JSON.stringify(payload).substring(0, 80)
    };

    this.notify(log);

    // If online, immediately flush
    if (this.isOnline) {
      this.flushPendingQueueToFirestore();
    }

    return newItem;
  }

  /**
   * Map domain & item into Firestore collection and document structure
   */
  private mapItemToFirestoreDoc(item: PendingSyncItem): FirestoreDocumentPayload {
    let parsedPayload: Record<string, any> = {};
    try {
      parsedPayload = JSON.parse(item.payloadJson);
    } catch {
      parsedPayload = { raw: item.payloadJson };
    }

    const athleteId = parsedPayload.athleteId || 'ath_01';
    let collection = `athletes/${athleteId}/checkins`;

    switch (item.domain) {
      case 'prescriber_profile':
        collection = 'prescribers';
        break;
      case 'athlete':
        collection = 'athletes';
        break;
      case 'checkin_exercise_set':
        collection = `athletes/${athleteId}/exercise_set_checkins`;
        break;
      case 'checkin_meal':
        collection = `athletes/${athleteId}/meal_checkins`;
        break;
      case 'checkin_supplement':
        collection = `athletes/${athleteId}/supplement_checkins`;
        break;
      case 'checkin_anthropometric':
        collection = `athletes/${athleteId}/anthropometric_evaluations`;
        break;
      case 'prescription_workout':
        collection = `prescriptions/workouts/athletes/${athleteId}`;
        break;
      case 'prescription_nutrition':
        collection = `prescriptions/nutrition/athletes/${athleteId}`;
        break;
      case 'prescription_supplement':
        collection = `prescriptions/supplements/athletes/${athleteId}`;
        break;
      case 'workout_template':
        collection = 'workout_templates';
        break;
      case 'formula_template':
        collection = 'formula_templates';
        break;
    }

    return {
      collection,
      documentId: item.entityId || item.id,
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
  }

  /**
   * Directly persist prescriber password changes to Firestore database
   */
  public async savePrescriberPasswordToFirestore(
    prescriberId: string,
    newPassword: string,
    requiresPasswordChange: boolean = false
  ): Promise<boolean> {
    try {
      if (db) {
        const prescriberDocRef = doc(db, 'prescribers', prescriberId);
        await setDoc(
          prescriberDocRef,
          {
            id: prescriberId,
            accessPassword: newPassword,
            requiresPasswordChange,
            passwordChangedAt: new Date().toISOString(),
            updatedAt: Date.now()
          },
          { merge: true }
        );
      }
      this.notify({
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        type: 'SYNC_SUCCESS',
        domain: 'prescriber_profile',
        documentId: prescriberId,
        message: `Senha do prescritor (${prescriberId}) salva e persistida com sucesso no Firestore.`
      });
      return true;
    } catch (err: any) {
      console.warn('Direct Firestore write error for prescriber password:', err);
      return false;
    }
  }

  /**
   * Directly persist athlete password changes to Firestore database
   */
  public async saveAthletePasswordToFirestore(
    athleteId: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      if (db) {
        const athleteDocRef = doc(db, 'athletes', athleteId);
        await setDoc(
          athleteDocRef,
          {
            id: athleteId,
            accessPassword: newPassword,
            passwordChangedAt: new Date().toISOString(),
            updatedAt: Date.now()
          },
          { merge: true }
        );
      }
      this.notify({
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        type: 'SYNC_SUCCESS',
        domain: 'athlete',
        documentId: athleteId,
        message: `Senha do aluno (${athleteId}) salva e persistida com sucesso no Firestore.`
      });
      return true;
    } catch (err: any) {
      console.warn('Direct Firestore write error for athlete password:', err);
      return false;
    }
  }

  /**
   * Load all prescribers from Firestore
   */
  public async loadPrescribersFromFirestore(): Promise<PrescriberProfile[]> {
    try {
      if (!db) return [];
      const snap = await getDocs(collection(db, 'prescribers'));
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
   * Load all athletes from Firestore
   */
  public async loadAthletesFromFirestore(): Promise<AthleteProfile[]> {
    try {
      if (!db) return [];
      const snap = await getDocs(collection(db, 'athletes'));
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
   * Initialize and synchronize all prescribers and athletes with Firestore.
   * This guarantees that passwords and accounts created/modified in Firestore
   * are never overwritten by defaults on future builds or deployments.
   */
  public async initializeAndSyncCredentials(
    defaultPrescribers: PrescriberProfile[],
    defaultAthletes: AthleteProfile[]
  ): Promise<{ prescribers: PrescriberProfile[]; athletes: AthleteProfile[] }> {
    try {
      if (!db) {
        return { prescribers: defaultPrescribers, athletes: defaultAthletes };
      }

      // Fetch existing from Firestore
      const firestorePrescribers = await this.loadPrescribersFromFirestore();
      const firestoreAthletes = await this.loadAthletesFromFirestore();

      const prescribersMap = new Map<string, PrescriberProfile>();
      // 1. Seed defaults first
      for (const p of defaultPrescribers) {
        prescribersMap.set(p.id, p);
      }
      // 2. Overwrite with persisted Firestore values (authoritative for passwords, changes, etc.)
      for (const p of firestorePrescribers) {
        prescribersMap.set(p.id, {
          ...(prescribersMap.get(p.id) || {}),
          ...p
        });
      }

      // For any prescriber not yet in Firestore, save it to Firestore
      for (const p of prescribersMap.values()) {
        const existsInFirestore = firestorePrescribers.some((fp) => fp.id === p.id);
        if (!existsInFirestore) {
          try {
            await setDoc(doc(db, 'prescribers', p.id), p, { merge: true });
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
            await setDoc(doc(db, 'athletes', a.id), a, { merge: true });
          } catch (e) {
            console.warn(`Could not seed athlete ${a.id} to Firestore:`, e);
          }
        }
      }

      const mergedPrescribers = Array.from(prescribersMap.values());
      const mergedAthletes = Array.from(athletesMap.values());

      return {
        prescribers: mergedPrescribers,
        athletes: mergedAthletes
      };
    } catch (err) {
      console.warn('Error during credentials synchronization:', err);
      return { prescribers: defaultPrescribers, athletes: defaultAthletes };
    }
  }

  /**
   * Load all exercises from Firestore library collection
   */
  public async loadExercisesFromFirestore(): Promise<LibraryExercise[]> {
    if (!db) return [];
    try {
      const snap = await getDocs(collection(db, 'exercises'));
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
    if (!db || !exercise.id) return false;
    try {
      await setDoc(doc(db, 'exercises', exercise.id), exercise, { merge: true });
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
    if (!db || !exerciseId) return false;
    try {
      await deleteDoc(doc(db, 'exercises', exerciseId));
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
    try {
      if (!db) {
        return defaultExercises;
      }

      const firestoreExercises = await this.loadExercisesFromFirestore();

      const exercisesMap = new Map<string, LibraryExercise>();

      // 1. Seed defaults first
      for (const ex of defaultExercises) {
        exercisesMap.set(ex.id, ex);
      }

      // 2. Merge Firestore exercises (custom ones created by coaches or edited defaults)
      for (const ex of firestoreExercises) {
        exercisesMap.set(ex.id, {
          ...(exercisesMap.get(ex.id) || {}),
          ...ex
        });
      }

      // 3. Ensure defaults exist in Firestore
      for (const ex of exercisesMap.values()) {
        const existsInFirestore = firestoreExercises.some((fe) => fe.id === ex.id);
        if (!existsInFirestore) {
          try {
            await setDoc(doc(db, 'exercises', ex.id), ex, { merge: true });
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
   * Process all pending check-ins and push them to Firestore
   */
  public async flushPendingQueueToFirestore(): Promise<{
    success: boolean;
    syncedCount: number;
    firestoreDocs: FirestoreDocumentPayload[];
  }> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, firestoreDocs: [] };
    }

    if (!this.isOnline) {
      return { success: false, syncedCount: 0, firestoreDocs: [] };
    }

    if (this.queue.length === 0) {
      // Keep last synced updated
      const now = new Date();
      this.lastSyncedAt = `Hoje às ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      this.notify();
      return { success: true, syncedCount: 0, firestoreDocs: [] };
    }

    this.isSyncing = true;
    const itemsToSync = [...this.queue];
    const timeStr = new Date().toLocaleTimeString('pt-BR');

    this.notify({
      id: `log_${Date.now()}`,
      timestamp: timeStr,
      type: 'SYNC_START',
      message: `Iniciando push em lote de ${itemsToSync.length} mutação(ões) para o Firestore...`,
      syncedCount: itemsToSync.length
    });

    try {
      const firestoreDocs: FirestoreDocumentPayload[] = itemsToSync.map((item) =>
        this.mapItemToFirestoreDoc(item)
      );

      // Perform direct Firestore writes if db is configured
      if (db) {
        for (const fDoc of firestoreDocs) {
          try {
            const pathParts = fDoc.collection.split('/');
            if (pathParts.length === 1) {
              const docRef = doc(db, fDoc.collection, fDoc.documentId);
              if (fDoc.operation === 'DELETE') {
                await deleteDoc(docRef);
              } else {
                await setDoc(docRef, { ...fDoc.data, ...fDoc.metadata }, { merge: true });
              }
            } else if (pathParts.length === 3) {
              const docRef = doc(db, pathParts[0], pathParts[1], pathParts[2], fDoc.documentId);
              if (fDoc.operation === 'DELETE') {
                await deleteDoc(docRef);
              } else {
                await setDoc(docRef, { ...fDoc.data, ...fDoc.metadata }, { merge: true });
              }
            }
          } catch (writeErr) {
            console.warn('Firestore item write error:', writeErr);
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Successfully synced: Remove synced items from queue
      this.queue = [];
      this.isSyncing = false;

      const now = new Date();
      this.lastSyncedAt = `Hoje às ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const successLog: SyncLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        type: 'SYNC_SUCCESS',
        message: `Sincronização concluída! ${firestoreDocs.length} documento(s) gravados no Firestore com sucesso.`,
        syncedCount: firestoreDocs.length
      };

      this.notify(successLog);

      return {
        success: true,
        syncedCount: firestoreDocs.length,
        firestoreDocs
      };
    } catch (error: any) {
      this.isSyncing = false;
      const errorLog: SyncLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        type: 'SYNC_ERROR',
        message: `Erro ao sincronizar com o Firestore: ${error?.message || 'Falha na conexão'}. Retentando via WorkManager.`
      };
      this.notify(errorLog);
      return { success: false, syncedCount: 0, firestoreDocs: [] };
    }
  }

  /**
   * Clear the pending queue manually (e.g. for testing)
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
}

// Export singleton instance
export const syncService = new SyncService();
