import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AthleteProfile,
  NutritionPlan,
  WorkoutSplit,
  WorkoutTemplate,
  SupplementItem,
  PersistenceSyncState,
  CloudSyncStatus
} from '../types';
import {
  INITIAL_ATHLETE,
  OTHER_ATHLETES,
  INITIAL_NUTRITION_PLAN,
  WORKOUT_SPLITS,
  INITIAL_WORKOUT_TEMPLATES,
  SUPPLEMENT_PROTOCOLS
} from '../data/mockData';
import {
  getUserScope,
  loadAthleteNutritionPlan,
  saveAthleteNutritionPlan,
  loadAthleteWorkoutSplits,
  saveAthleteWorkoutSplits,
  loadAthleteSupplements,
  saveAthleteSupplements
} from '../services/athleteDataService';
import { syncService, SyncLogEntry } from '../services/syncService';

interface UseAthletePlansProps {
  firebaseUid?: string | null;
  userSessionType?: 'athlete' | 'prescriber' | null;
  prescriberId?: string | null;
}

export function useAthletePlans({
  firebaseUid,
  userSessionType,
  prescriberId
}: UseAthletePlansProps) {
  const [athletesList, setAthletesList] = useState<AthleteProfile[]>(() => {
    try {
      const saved = localStorage.getItem('lm_team_athletes_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return OTHER_ATHLETES;
  });

  const [currentAthlete, setCurrentAthlete] = useState<AthleteProfile>(() => {
    try {
      const saved = localStorage.getItem('lm_team_athletes_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      }
    } catch {}
    return INITIAL_ATHLETE;
  });

  // Data states
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan>(INITIAL_NUTRITION_PLAN);
  const [workoutSplits, setWorkoutSplits] = useState<WorkoutSplit[]>(WORKOUT_SPLITS);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>(INITIAL_WORKOUT_TEMPLATES);
  const [supplements, setSupplements] = useState<SupplementItem[]>(SUPPLEMENT_PROTOCOLS);
  
  // Loading & State Machine states per domain
  const [isLoadingPlans, setIsLoadingPlans] = useState<boolean>(false);
  
  const [nutritionSyncState, setNutritionSyncState] = useState<PersistenceSyncState>('salvo');
  const [workoutSyncState, setWorkoutSyncState] = useState<PersistenceSyncState>('salvo');
  const [supplementSyncState, setSupplementSyncState] = useState<PersistenceSyncState>('salvo');

  const [lastConfirmedNutrition, setLastConfirmedNutrition] = useState<string | null>(null);
  const [lastConfirmedWorkout, setLastConfirmedWorkout] = useState<string | null>(null);
  const [lastConfirmedSupplements, setLastConfirmedSupplements] = useState<string | null>(null);

  const [nutritionError, setNutritionError] = useState<string | null>(null);
  const [workoutError, setWorkoutError] = useState<string | null>(null);
  const [supplementError, setSupplementError] = useState<string | null>(null);

  // Request sequencing ref: strictly ignores delayed/stale responses
  const activeRequestIdRef = useRef<number>(0);
  const currentAthleteIdRef = useRef<string>(currentAthlete?.id || '');
  currentAthleteIdRef.current = currentAthlete?.id || '';

  // Persist athletesList to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lm_team_athletes_v2', JSON.stringify(athletesList));
    } catch {}
  }, [athletesList]);

  // Load plans when currentAthlete or user session scope changes
  useEffect(() => {
    if (!currentAthlete || !currentAthlete.id) return;

    const athleteId = currentAthlete.id;
    const requestId = ++activeRequestIdRef.current;
    setIsLoadingPlans(true);

    // 1. Limpar o conteúdo anterior imediatamente para não exibir dados de outro atleta
    setNutritionPlan({
      dailyTargetCalories: 0,
      dailyTargetProteinG: 0,
      dailyTargetCarbsG: 0,
      dailyTargetFatG: 0,
      waterIntakeLiters: 0,
      meals: []
    });
    setWorkoutSplits([]);
    setSupplements([]);

    // Set state machine to 'carregando'
    setNutritionSyncState('carregando');
    setWorkoutSyncState('carregando');
    setSupplementSyncState('carregando');
    setNutritionError(null);
    setWorkoutError(null);
    setSupplementError(null);

    const userScope = getUserScope(
      firebaseUid,
      userSessionType,
      prescriberId,
      athleteId
    );

    async function loadDataForAthlete() {
      try {
        const [nutPlan, wSplits, supps] = await Promise.all([
          loadAthleteNutritionPlan(userScope, athleteId),
          loadAthleteWorkoutSplits(userScope, athleteId),
          loadAthleteSupplements(userScope, athleteId)
        ]);

        // Se outro atleta foi selecionado durante o carregamento, DESCARTAR resposta obsoleta
        if (activeRequestIdRef.current !== requestId) {
          return;
        }

        setNutritionPlan(nutPlan);
        setWorkoutSplits(wSplits);
        setSupplements(supps);

        const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // Check each domain's empty/valid state
        if (!nutPlan.meals || nutPlan.meals.length === 0) {
          setNutritionSyncState('sem_dados');
        } else {
          setNutritionSyncState('salvo');
          setLastConfirmedNutrition(nowStr);
        }

        if (!wSplits || wSplits.length === 0) {
          setWorkoutSyncState('sem_dados');
        } else {
          setWorkoutSyncState('salvo');
          setLastConfirmedWorkout(nowStr);
        }

        if (!supps || supps.length === 0) {
          setSupplementSyncState('sem_dados');
        } else {
          setSupplementSyncState('salvo');
          setLastConfirmedSupplements(nowStr);
        }
      } catch (err: any) {
        if (activeRequestIdRef.current === requestId) {
          console.error('Error loading scoped plans for athlete:', err);
          const errorMsg = err?.message || 'Falha ao carregar dados remotos do atleta';
          setNutritionSyncState('falha');
          setWorkoutSyncState('falha');
          setSupplementSyncState('falha');
          setNutritionError(errorMsg);
          setWorkoutError(errorMsg);
          setSupplementError(errorMsg);
        }
      } finally {
        if (activeRequestIdRef.current === requestId) {
          setIsLoadingPlans(false);
        }
      }
    }

    loadDataForAthlete();
  }, [currentAthlete?.id, firebaseUid, userSessionType, prescriberId]);

  // Subscribe to syncService to update state machine based on real confirmation or failure
  useEffect(() => {
    const unsubscribe = syncService.subscribe((status: CloudSyncStatus, log?: SyncLogEntry) => {
      const athleteId = currentAthleteIdRef.current;
      if (!athleteId) return;

      const queue = status.checkInSyncQueue || [];
      const pendingNutrition = queue.filter(
        (q) => q.domain === 'prescription_nutrition' && (q.entityId === athleteId || q.entityId === 'main-plan')
      );
      const pendingWorkout = queue.filter(
        (q) => q.domain === 'prescription_workout' && q.entityId === athleteId
      );
      const pendingSupplements = queue.filter(
        (q) => q.domain === 'prescription_supplement' && q.entityId === athleteId
      );

      const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Handle Nutrition
      if (pendingNutrition.length > 0) {
        const hasFail = pendingNutrition.some((q) => q.lastError || (q.retryCount > 0 && !status.isOnline));
        if (hasFail) {
          const failItem = pendingNutrition.find((q) => q.lastError);
          setNutritionSyncState('falha');
          setNutritionError(failItem?.lastErrorMessage || failItem?.lastError || 'Falha ao sincronizar com o Firestore');
        } else if (status.isSyncing) {
          setNutritionSyncState('aguardando_envio');
        } else {
          setNutritionSyncState('aguardando_envio');
        }
      } else if (log?.domain === 'prescription_nutrition' && log.type === 'SYNC_SUCCESS') {
        // Confirmation confirmed!
        setNutritionSyncState('salvo');
        setLastConfirmedNutrition(nowTime);
        setNutritionError(null);
      } else if (log?.domain === 'prescription_nutrition' && log.type === 'SYNC_ERROR') {
        setNutritionSyncState('falha');
        setNutritionError(log.message || 'Erro na transmissão do plano nutricional');
      }

      // Handle Workout
      if (pendingWorkout.length > 0) {
        const hasFail = pendingWorkout.some((q) => q.lastError || (q.retryCount > 0 && !status.isOnline));
        if (hasFail) {
          const failItem = pendingWorkout.find((q) => q.lastError);
          setWorkoutSyncState('falha');
          setWorkoutError(failItem?.lastErrorMessage || failItem?.lastError || 'Falha ao sincronizar treinos com Firestore');
        } else {
          setWorkoutSyncState('aguardando_envio');
        }
      } else if (log?.domain === 'prescription_workout' && log.type === 'SYNC_SUCCESS') {
        setWorkoutSyncState('salvo');
        setLastConfirmedWorkout(nowTime);
        setWorkoutError(null);
      } else if (log?.domain === 'prescription_workout' && log.type === 'SYNC_ERROR') {
        setWorkoutSyncState('falha');
        setWorkoutError(log.message || 'Erro na transmissão dos treinos');
      }

      // Handle Supplements
      if (pendingSupplements.length > 0) {
        const hasFail = pendingSupplements.some((q) => q.lastError || (q.retryCount > 0 && !status.isOnline));
        if (hasFail) {
          const failItem = pendingSupplements.find((q) => q.lastError);
          setSupplementSyncState('falha');
          setSupplementError(failItem?.lastErrorMessage || failItem?.lastError || 'Falha ao sincronizar suplementação');
        } else {
          setSupplementSyncState('aguardando_envio');
        }
      } else if (log?.domain === 'prescription_supplement' && log.type === 'SYNC_SUCCESS') {
        setSupplementSyncState('salvo');
        setLastConfirmedSupplements(nowTime);
        setSupplementError(null);
      } else if (log?.domain === 'prescription_supplement' && log.type === 'SYNC_ERROR') {
        setSupplementSyncState('falha');
        setSupplementError(log.message || 'Erro na transmissão da suplementação');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Scoped setters with persistence & state machine progression
  const updateNutritionPlan = useCallback(
    async (newPlan: NutritionPlan) => {
      const athleteId = currentAthlete.id;
      // 1. Estado imediatamente vai para alterado_localmente
      setNutritionSyncState('alterado_localmente');
      setNutritionPlan(newPlan);
      setNutritionError(null);

      try {
        const userScope = getUserScope(firebaseUid, userSessionType, prescriberId, athleteId);
        // Persist local and enqueue
        await saveAthleteNutritionPlan(userScope, athleteId, newPlan);
        
        // Se estiver online e fila em execução, transiciona para aguardando_envio
        setNutritionSyncState('aguardando_envio');
        
        // Tenta descarregar a fila com confirmação real
        const result = await syncService.flushPendingQueueToFirestore({ forceRetry: false });
        if (result && result.success) {
          setNutritionSyncState('salvo');
          setLastConfirmedNutrition(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err: any) {
        console.error('Error saving nutrition plan:', err);
        setNutritionSyncState('falha');
        setNutritionError(err?.message || 'Erro ao persistir plano alimentar');
      }
    },
    [currentAthlete.id, firebaseUid, userSessionType, prescriberId]
  );

  const updateWorkoutSplits = useCallback(
    async (newSplits: WorkoutSplit[]) => {
      const athleteId = currentAthlete.id;
      setWorkoutSyncState('alterado_localmente');
      setWorkoutSplits(newSplits);
      setWorkoutError(null);

      try {
        const userScope = getUserScope(firebaseUid, userSessionType, prescriberId, athleteId);
        await saveAthleteWorkoutSplits(userScope, athleteId, newSplits);
        setWorkoutSyncState('aguardando_envio');

        const result = await syncService.flushPendingQueueToFirestore({ forceRetry: false });
        if (result && result.success) {
          setWorkoutSyncState('salvo');
          setLastConfirmedWorkout(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err: any) {
        console.error('Error saving workout splits:', err);
        setWorkoutSyncState('falha');
        setWorkoutError(err?.message || 'Erro ao persistir divisões de treino');
      }
    },
    [currentAthlete.id, firebaseUid, userSessionType, prescriberId]
  );

  const updateSupplements = useCallback(
    async (newSupplements: SupplementItem[]) => {
      const athleteId = currentAthlete.id;
      setSupplementSyncState('alterado_localmente');
      setSupplements(newSupplements);
      setSupplementError(null);

      try {
        const userScope = getUserScope(firebaseUid, userSessionType, prescriberId, athleteId);
        await saveAthleteSupplements(userScope, athleteId, newSupplements);
        setSupplementSyncState('aguardando_envio');

        const result = await syncService.flushPendingQueueToFirestore({ forceRetry: false });
        if (result && result.success) {
          setSupplementSyncState('salvo');
          setLastConfirmedSupplements(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err: any) {
        console.error('Error saving supplements:', err);
        setSupplementSyncState('falha');
        setSupplementError(err?.message || 'Erro ao persistir protocolo de suplementação');
      }
    },
    [currentAthlete.id, firebaseUid, userSessionType, prescriberId]
  );

  // Manual retry handler for visible errors
  const retryDomainSync = useCallback(async (domain: 'nutrition' | 'workout' | 'supplements') => {
    if (domain === 'nutrition') {
      setNutritionError(null);
      setNutritionSyncState('aguardando_envio');
    } else if (domain === 'workout') {
      setWorkoutError(null);
      setWorkoutSyncState('aguardando_envio');
    } else if (domain === 'supplements') {
      setSupplementError(null);
      setSupplementSyncState('aguardando_envio');
    }

    try {
      const result = await syncService.flushPendingQueueToFirestore({ forceRetry: true });
      const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      if (domain === 'nutrition') {
        if (result.success || result.syncedCount > 0) {
          setNutritionSyncState('salvo');
          setLastConfirmedNutrition(nowStr);
        } else if (result.failedCount > 0) {
          setNutritionSyncState('falha');
          setNutritionError('Falha ao reenviar plano nutricional. Servidor indisponível.');
        }
      } else if (domain === 'workout') {
        if (result.success || result.syncedCount > 0) {
          setWorkoutSyncState('salvo');
          setLastConfirmedWorkout(nowStr);
        } else if (result.failedCount > 0) {
          setWorkoutSyncState('falha');
          setWorkoutError('Falha ao reenviar treinos. Servidor indisponível.');
        }
      } else if (domain === 'supplements') {
        if (result.success || result.syncedCount > 0) {
          setSupplementSyncState('salvo');
          setLastConfirmedSupplements(nowStr);
        } else if (result.failedCount > 0) {
          setSupplementSyncState('falha');
          setSupplementError('Falha ao reenviar suplementos. Servidor indisponível.');
        }
      }
    } catch (err: any) {
      if (domain === 'nutrition') {
        setNutritionSyncState('falha');
        setNutritionError(err?.message || 'Falha na recuperação de envio');
      } else if (domain === 'workout') {
        setWorkoutSyncState('falha');
        setWorkoutError(err?.message || 'Falha na recuperação de envio');
      } else if (domain === 'supplements') {
        setSupplementSyncState('falha');
        setSupplementError(err?.message || 'Falha na recuperação de envio');
      }
    }
  }, []);

  return {
    athletesList,
    setAthletesList,
    currentAthlete,
    setCurrentAthlete,
    nutritionPlan,
    setNutritionPlan: updateNutritionPlan,
    workoutSplits,
    setWorkoutSplits: updateWorkoutSplits,
    workoutTemplates,
    setWorkoutTemplates,
    supplements,
    setSupplements: updateSupplements,
    isLoadingPlans,

    // Persistence State Machine properties
    nutritionSyncState,
    workoutSyncState,
    supplementSyncState,
    lastConfirmedNutrition,
    lastConfirmedWorkout,
    lastConfirmedSupplements,
    nutritionError,
    workoutError,
    supplementError,
    retryDomainSync
  };
}
