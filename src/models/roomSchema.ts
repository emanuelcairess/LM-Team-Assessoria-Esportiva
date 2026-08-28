/**
 * LM TEAM ATHLETE & CLINICAL COACH PLATFORM
 * Offline-First Cloud Sync Architecture (Jetpack Room + Supabase / Firestore)
 * 
 * Pattern: Local-First Single Source of Truth (SSOT) + Delta Mutation Queue + Server Authority for Prescriptions
 */

export interface RoomEntityMetadata {
  id: string;
  tableName: string;
  moduleName: string;
  description: string;
  primaryKey: string;
  foreignKeys: string[];
  indices: string[];
  kotlinEntityCode: string;
  kotlinDaoCode: string;
  sqlDdl: string;
}

export const ROOM_ENTITIES_DATA: RoomEntityMetadata[] = [
  // 0. MODULE: OFFLINE-FIRST SYNC ENGINE & MUTATION QUEUE
  {
    id: 'sync_queue_entity',
    tableName: 'sync_queue',
    moduleName: '0. Offline-First Sync Queue & State',
    description: 'Fila de mutações offline para check-ins do atleta (séries, refeições, suplementos, bioimpedância). Armazena payloads atômicos para sync em lote via WorkManager.',
    primaryKey: 'id (UUID)',
    foreignKeys: ['athlete_id -> athletes(id) [CASCADE]'],
    indices: ['athlete_id', 'domain', 'status', 'created_at'],
    kotlinEntityCode: `package com.lmteam.data.local.entities

import androidx.room.*

enum class SyncStatus {
    SYNCED,
    PENDING_INSERT,
    PENDING_UPDATE,
    PENDING_DELETE,
    SYNC_ERROR
}

enum class SyncDomain {
    PRESCRIPTION_WORKOUT,
    PRESCRIPTION_NUTRITION,
    PRESCRIPTION_SUPPLEMENT,
    CHECKIN_EXERCISE_SET,
    CHECKIN_MEAL,
    CHECKIN_SUPPLEMENT,
    CHECKIN_ANTHROPOMETRIC
}

@Entity(
    tableName = "sync_queue",
    foreignKeys = [
        ForeignKey(
            entity = AthleteEntity::class,
            parentColumns = ["id"],
            childColumns = ["athlete_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["athlete_id"]),
        Index(value = ["domain"]),
        Index(value = ["status"]),
        Index(value = ["created_at"])
    ]
)
data class SyncQueueEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String, // UUID v4
    
    @ColumnInfo(name = "athlete_id")
    val athleteId: String,
    
    @ColumnInfo(name = "entity_id")
    val entityId: String, // ID do registro original no Room
    
    @ColumnInfo(name = "domain")
    val domain: SyncDomain,
    
    @ColumnInfo(name = "operation")
    val operation: String, // "INSERT", "UPDATE", "DELETE"
    
    @ColumnInfo(name = "payload_json")
    val payloadJson: String, // Serialized JSON DTO
    
    @ColumnInfo(name = "status")
    val status: SyncStatus = SyncStatus.PENDING_INSERT,
    
    @ColumnInfo(name = "retry_count")
    val retryCount: Int = 0,
    
    @ColumnInfo(name = "last_error_message")
    val lastErrorMessage: String? = null,
    
    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),
    
    @ColumnInfo(name = "synced_at")
    val syncedAt: Long? = null
)`,
    kotlinDaoCode: `package com.lmteam.data.local.dao

import androidx.room.*
import com.lmteam.data.local.entities.SyncDomain
import com.lmteam.data.local.entities.SyncQueueEntity
import com.lmteam.data.local.entities.SyncStatus
import kotlinx.coroutines.flow.Flow

@Dao
interface SyncQueueDao {
    @Query("SELECT * FROM sync_queue WHERE status != 'SYNCED' ORDER BY created_at ASC")
    fun getPendingMutationsFlow(): Flow<List<SyncQueueEntity>>

    @Query("SELECT * FROM sync_queue WHERE status != 'SYNCED' ORDER BY created_at ASC LIMIT :batchSize")
    suspend fun getNextPendingBatch(batchSize: Int = 50): List<SyncQueueEntity>

    @Query("SELECT COUNT(*) FROM sync_queue WHERE status != 'SYNCED'")
    fun getPendingCountFlow(): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun enqueueMutation(mutation: SyncQueueEntity)

    @Query("UPDATE sync_queue SET status = :status, synced_at = :syncedAt WHERE id = :id")
    suspend fun markSynced(id: String, status: SyncStatus = SyncStatus.SYNCED, syncedAt: Long = System.currentTimeMillis())

    @Query("UPDATE sync_queue SET status = 'SYNC_ERROR', retry_count = retry_count + 1, last_error_message = :error WHERE id = :id")
    suspend fun markError(id: String, error: String)

    @Query("DELETE FROM sync_queue WHERE status = 'SYNCED' AND synced_at < :olderThanTimestamp")
    suspend fun purgeSyncedLogs(olderThanTimestamp: Long)
}`,
    sqlDdl: `CREATE TABLE IF NOT EXISTS \`sync_queue\` (
  \`id\` TEXT NOT NULL PRIMARY KEY,
  \`athlete_id\` TEXT NOT NULL,
  \`entity_id\` TEXT NOT NULL,
  \`domain\` TEXT NOT NULL,
  \`operation\` TEXT NOT NULL,
  \`payload_json\` TEXT NOT NULL,
  \`status\` TEXT NOT NULL DEFAULT 'PENDING_INSERT',
  \`retry_count\` INTEGER NOT NULL DEFAULT 0,
  \`last_error_message\` TEXT,
  \`created_at\` INTEGER NOT NULL,
  \`synced_at\` INTEGER,
  FOREIGN KEY(\`athlete_id\`) REFERENCES \`athletes\`(\`id\`) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS \`index_sync_queue_status\` ON \`sync_queue\`(\`status\`);
CREATE INDEX IF NOT EXISTS \`index_sync_queue_domain\` ON \`sync_queue\`(\`domain\`);`
  },

  // 1. MODULE: ATHLETES & COACH USERS
  {
    id: 'athlete_entity',
    tableName: 'athletes',
    moduleName: '1. Atleta & Coach Hierarchy',
    description: 'Armazena cadastros principais de atletas, metadados de categoria, vinculação de treinador e metas corporais.',
    primaryKey: 'id (String UUID)',
    foreignKeys: ['coach_id -> coaches(id) [SET NULL]'],
    indices: ['coach_id', 'email', 'category', 'status'],
    kotlinEntityCode: `package com.lmteam.data.local.entities

import androidx.room.*

@Entity(
    tableName = "athletes",
    foreignKeys = [
        ForeignKey(
            entity = CoachEntity::class,
            parentColumns = ["id"],
            childColumns = ["coach_id"],
            onDelete = ForeignKey.SET_NULL
        )
    ],
    indices = [
        Index(value = ["email"], unique = true),
        Index(value = ["coach_id"]),
        Index(value = ["category"]),
        Index(value = ["status"])
    ]
)
data class AthleteEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String, // UUID v4
    
    @ColumnInfo(name = "coach_id")
    val coachId: String?,
    
    @ColumnInfo(name = "name")
    val name: String,
    
    @ColumnInfo(name = "avatar_url")
    val avatarUrl: String,
    
    @ColumnInfo(name = "email")
    val email: String,
    
    @ColumnInfo(name = "age")
    val age: Int,
    
    @ColumnInfo(name = "category")
    val category: String, // "Avançado / Classic Physique", "Wellness", etc.
    
    @ColumnInfo(name = "coach_name")
    val coachName: String,
    
    @ColumnInfo(name = "nutritionist_name")
    val nutritionistName: String,
    
    @ColumnInfo(name = "doctor_name")
    val doctorName: String,
    
    @ColumnInfo(name = "goal")
    val goal: String, // "Hipertrofia", "Cutting", "Manutenção", "Recomposição"
    
    @ColumnInfo(name = "status")
    val status: String, // "Ativo", "Em Avaliação", "Fase de Pico"
    
    @ColumnInfo(name = "current_weight_kg")
    val currentWeightKg: Double,
    
    @ColumnInfo(name = "target_weight_kg")
    val targetWeightKg: Double,
    
    @ColumnInfo(name = "height_cm")
    val heightCm: Double,
    
    @ColumnInfo(name = "adherence_percentage")
    val adherencePercentage: Int,
    
    @ColumnInfo(name = "training_days_per_week")
    val trainingDaysPerWeek: Int = 5,
    
    @ColumnInfo(name = "cardio_days_per_week")
    val cardioDaysPerWeek: Int = 6,
    
    @ColumnInfo(name = "cardio_target_kcal")
    val cardioTargetKcal: Int = 450,
    
    // Sync Metadata Columns
    @ColumnInfo(name = "sync_status")
    val syncStatus: SyncStatus = SyncStatus.SYNCED,
    
    @ColumnInfo(name = "server_version")
    val serverVersion: Long = 1L,
    
    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),
    
    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis()
)`,
    kotlinDaoCode: `package com.lmteam.data.local.dao

import androidx.room.*
import com.lmteam.data.local.entities.AthleteEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface AthleteDao {
    @Query("SELECT * FROM athletes WHERE id = :id LIMIT 1")
    fun getAthleteById(id: String): Flow<AthleteEntity?>

    @Query("SELECT * FROM athletes ORDER BY name ASC")
    fun getAllAthletes(): Flow<List<AthleteEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAthlete(athlete: AthleteEntity)

    @Update
    suspend fun updateAthlete(athlete: AthleteEntity)
}`,
    sqlDdl: `CREATE TABLE IF NOT EXISTS \`athletes\` (
  \`id\` TEXT NOT NULL PRIMARY KEY,
  \`coach_id\` TEXT,
  \`name\` TEXT NOT NULL,
  \`avatar_url\` TEXT NOT NULL,
  \`email\` TEXT NOT NULL UNIQUE,
  \`age\` INTEGER NOT NULL,
  \`category\` TEXT NOT NULL,
  \`coach_name\` TEXT NOT NULL,
  \`nutritionist_name\` TEXT NOT NULL,
  \`doctor_name\` TEXT NOT NULL,
  \`goal\` TEXT NOT NULL,
  \`status\` TEXT NOT NULL,
  \`current_weight_kg\` REAL NOT NULL,
  \`target_weight_kg\` REAL NOT NULL,
  \`height_cm\` REAL NOT NULL,
  \`adherence_percentage\` INTEGER NOT NULL,
  \`training_days_per_week\` INTEGER NOT NULL DEFAULT 5,
  \`cardio_days_per_week\` INTEGER NOT NULL DEFAULT 6,
  \`cardio_target_kcal\` INTEGER NOT NULL DEFAULT 450,
  \`sync_status\` TEXT NOT NULL DEFAULT 'SYNCED',
  \`server_version\` INTEGER NOT NULL DEFAULT 1,
  \`created_at\` INTEGER NOT NULL,
  \`updated_at\` INTEGER NOT NULL
);`
  },

  // 2. MODULE: PRESCRIPTION REPOSITORY (COACH AUTHORITY)
  {
    id: 'prescription_sync_repository',
    tableName: 'prescriptions (Cloud -> Room)',
    moduleName: '2. Prescription Repository (Coach -> Cloud -> Room)',
    description: 'Padrão Repository com SSOT no Room e autoridade remota do Coach/Médico. Sincroniza fichas de treino, planos alimentares e manipulados clínicos.',
    primaryKey: 'N/A (Repository & Flow Architecture)',
    foreignKeys: ['Supabase / Firestore REST & WebSockets -> Room Local Cache'],
    indices: ['last_sync_timestamp', 'server_version'],
    kotlinEntityCode: `package com.lmteam.data.repository

import com.lmteam.data.local.dao.*
import com.lmteam.data.local.entities.*
import com.lmteam.data.remote.SupabaseApiService
import com.lmteam.data.remote.dto.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

sealed class Resource<out T> {
    data class Success<out T>(val data: T) : Resource<T>()
    data class Loading<out T>(val cachedData: T? = null) : Resource<T>()
    data class Error(val message: String, val throwable: Throwable? = null) : Resource<Nothing>()
}

@Singleton
class PrescriptionSyncRepository @Inject constructor(
    private val workoutDao: WorkoutDao,
    private val nutritionDao: NutritionDao,
    private val supplementDao: SupplementDao,
    private val supabaseApi: SupabaseApiService
) {
    /**
     * Sincroniza prescrição de treino feita pelo Coach no Supabase/Firestore com o cache Room local.
     * Estratégia: Offline-First. Emite o cache local imediatamente e baixa a versão remota mais recente.
     */
    fun syncWorkoutPrescription(athleteId: String): Flow<Resource<List<WorkoutSplitWithExercisesAndSets>>> = flow {
        // 1. Emite dados locais primeiro (Immediate Room cache emission)
        val initialCache = workoutDao.getWorkoutSplitsForAthleteSync(athleteId)
        emit(Resource.Loading(initialCache))

        try {
            // 2. Consulta a versão remota no Supabase / Firestore
            val remotePrescription = supabaseApi.getPrescribedWorkouts(athleteId)
            
            // 3. Persiste no Room atomicamente dentro de uma transação SQLite
            withContext(Dispatchers.IO) {
                workoutDao.updatePrescriptionsTransaction(
                    splits = remotePrescription.splits.map { it.toEntity(SyncStatus.SYNCED) },
                    exercises = remotePrescription.exercises.map { it.toEntity(SyncStatus.SYNCED) },
                    sets = remotePrescription.sets.map { it.toEntity(SyncStatus.SYNCED) }
                )
            }
            
            // 4. Emite sucesso atualizado do Room
            val updatedData = workoutDao.getWorkoutSplitsForAthleteSync(athleteId)
            emit(Resource.Success(updatedData))
        } catch (e: Exception) {
            // Se offline, continua exibindo o cache do Room sem quebrar
            emit(Resource.Error("Offline: exibindo prescrição em cache local.", e))
        }
    }.flowOn(Dispatchers.IO)

    /**
     * Sincroniza plano nutricional prescrito pelo nutricionista.
     */
    suspend fun syncNutritionPlan(athleteId: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val remotePlan = supabaseApi.getActiveNutritionPlan(athleteId)
            nutritionDao.insertNutritionPlan(remotePlan.plan.toEntity())
            nutritionDao.insertMeals(remotePlan.meals.map { it.toEntity() })
            nutritionDao.insertFoods(remotePlan.foods.map { it.toEntity() })
        }
    }
}`,
    kotlinDaoCode: `package com.lmteam.data.local.dao

import androidx.room.*
import com.lmteam.data.local.entities.*
import com.lmteam.data.local.relations.WorkoutSplitWithExercisesAndSets

@Dao
abstract class WorkoutDao {
    @Transaction
    @Query("SELECT * FROM workout_splits WHERE athlete_id = :athleteId")
    abstract suspend fun getWorkoutSplitsForAthleteSync(athleteId: String): List<WorkoutSplitWithExercisesAndSets>

    @Transaction
    open suspend fun updatePrescriptionsTransaction(
        splits: List<WorkoutSplitEntity>,
        exercises: List<ExerciseEntity>,
        sets: List<ExerciseSetEntity>
    ) {
        insertSplits(splits)
        insertExercises(exercises)
        insertSets(sets)
    }

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    abstract suspend fun insertSplits(splits: List<WorkoutSplitEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    abstract suspend fun insertExercises(exercises: List<ExerciseEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    abstract suspend fun insertSets(sets: List<ExerciseSetEntity>)
}`,
    sqlDdl: `-- Supabase Remote Schema for Prescriptions (PostgreSQL)
CREATE TABLE IF NOT EXISTS public.prescriptions_workout (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.coaches(id),
    title TEXT NOT NULL,
    version BIGINT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policy: Coach can manage, Athlete can read
ALTER TABLE public.prescriptions_workout ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athletes can view own prescriptions" ON public.prescriptions_workout
    FOR SELECT USING (auth.uid() = athlete_id OR auth.uid() = coach_id);`
  },

  // 3. MODULE: CHECK-IN REPOSITORY (ATHLETE EXECUTION & DELTA QUEUE)
  {
    id: 'checkin_sync_repository',
    tableName: 'checkins (Room -> Cloud Queue)',
    moduleName: '3. Check-In Repository (Athlete -> Room -> Cloud)',
    description: 'Armazena execuções em tempo real no Room (feedback instantâneo 0ms) e enfileira mutações delta na sync_queue para push em nuvem.',
    primaryKey: 'id (UUID)',
    foreignKeys: ['Room Local Mutations -> SyncQueueDao -> WorkManager / Supabase'],
    indices: ['entity_id', 'status', 'created_at'],
    kotlinEntityCode: `package com.lmteam.data.repository

import com.google.gson.Gson
import com.lmteam.data.local.dao.*
import com.lmteam.data.local.entities.*
import com.lmteam.data.remote.SupabaseApiService
import com.lmteam.data.remote.dto.SetExecutionCheckInDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CheckInSyncRepository @Inject constructor(
    private val workoutDao: WorkoutDao,
    private val nutritionDao: NutritionDao,
    private val supplementDao: SupplementDao,
    private val syncQueueDao: SyncQueueDao,
    private val supabaseApi: SupabaseApiService,
    private val gson: Gson
) {
    /**
     * Check-in de execução de série pelo aluno (Carga, RPE, Concluído).
     * 1. Salva no Room com status PENDING_UPDATE (UI atualiza imediatamente).
     * 2. Cria item na fila de sincronização (sync_queue).
     * 3. Tenta envio online imediato; se falhar, o WorkManager sincroniza em segundo plano.
     */
    suspend fun logExerciseSetExecution(
        athleteId: String,
        setId: String,
        weightKg: Double?,
        rpe: Double?,
        isCompleted: Boolean
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            // 1. Atualização Otimista no Room Local
            workoutDao.updateSetExecution(
                setId = setId,
                weightKg = weightKg,
                rpe = rpe,
                isCompleted = isCompleted,
                syncStatus = SyncStatus.PENDING_UPDATE
            )

            // 2. Enfileira na Sync Queue
            val payload = SetExecutionCheckInDto(
                setId = setId,
                athleteId = athleteId,
                weightKg = weightKg,
                rpe = rpe,
                isCompleted = isCompleted,
                timestamp = System.currentTimeMillis()
            )

            val queueItem = SyncQueueEntity(
                id = UUID.randomUUID().toString(),
                athleteId = athleteId,
                entityId = setId,
                domain = SyncDomain.CHECKIN_EXERCISE_SET,
                operation = "UPDATE",
                payloadJson = gson.toJson(payload),
                status = SyncStatus.PENDING_UPDATE
            )
            syncQueueDao.enqueueMutation(queueItem)

            // 3. Tentativa de Flush Imediato (se houver conexão ativa)
            try {
                supabaseApi.pushSetCheckIn(payload)
                syncQueueDao.markSynced(queueItem.id)
                workoutDao.markSetSynced(setId)
            } catch (e: Exception) {
                // Offline: permanece na fila do Room para o WorkManager
            }
        }
    }

    /**
     * Check-in de refeição concluída pelo atleta
     */
    suspend fun checkInMeal(athleteId: String, mealId: String, completed: Boolean) = withContext(Dispatchers.IO) {
        nutritionDao.setMealCompleted(mealId, completed)
        val queueItem = SyncQueueEntity(
            id = UUID.randomUUID().toString(),
            athleteId = athleteId,
            entityId = mealId,
            domain = SyncDomain.CHECKIN_MEAL,
            operation = "UPDATE",
            payloadJson = gson.toJson(mapOf("mealId" to mealId, "isCompleted" to completed)),
            status = SyncStatus.PENDING_UPDATE
        )
        syncQueueDao.enqueueMutation(queueItem)
    }
}`,
    kotlinDaoCode: `package com.lmteam.data.local.dao

import androidx.room.*
import com.lmteam.data.local.entities.SyncStatus

@Dao
interface WorkoutCheckInDao {
    @Query("UPDATE exercise_sets SET is_completed = :isCompleted, weight_kg_logged = :weightKg, rpe = :rpe, sync_status = :syncStatus WHERE id = :setId")
    suspend fun updateSetExecution(
        setId: String,
        weightKg: Double?,
        rpe: Double?,
        isCompleted: Boolean,
        syncStatus: SyncStatus
    )

    @Query("UPDATE exercise_sets SET sync_status = 'SYNCED' WHERE id = :setId")
    suspend fun markSetSynced(setId: String)
}`,
    sqlDdl: `-- Supabase Remote Table for Athlete Check-ins (PostgreSQL)
CREATE TABLE IF NOT EXISTS public.athlete_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    domain TEXT NOT NULL, -- 'workout_set', 'meal', 'supplement', 'biometrics'
    entity_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkins_athlete_time ON public.athlete_checkins (athlete_id, created_at DESC);`
  },

  // 4. MODULE: WORKMANAGER & BACKGROUND SYNC WORKER
  {
    id: 'sync_workmanager',
    tableName: 'workmanager_sync_worker',
    moduleName: '4. WorkManager & Retry Engine',
    description: 'Worker periódico e reativo disparado por eventos de conectividade (NetworkType.CONNECTED). Processa lotes de mutação da sync_queue com backoff exponencial.',
    primaryKey: 'N/A (Android WorkManager Service)',
    foreignKeys: ['Android OS JobScheduler -> SyncWorker -> Supabase / Firestore API'],
    indices: ['Constraints: NetworkType.CONNECTED, BatteryNotLow'],
    kotlinEntityCode: `package com.lmteam.data.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.*
import com.google.gson.Gson
import com.lmteam.data.local.dao.SyncQueueDao
import com.lmteam.data.local.entities.SyncDomain
import com.lmteam.data.local.entities.SyncStatus
import com.lmteam.data.remote.SupabaseApiService
import com.lmteam.data.remote.dto.SetExecutionCheckInDto
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.util.concurrent.TimeUnit

@HiltWorker
class CloudSyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val syncQueueDao: SyncQueueDao,
    private val supabaseApi: SupabaseApiService,
    private val gson: Gson
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val pendingBatch = syncQueueDao.getNextPendingBatch(batchSize = 50)
        if (pendingBatch.isEmpty()) return Result.success()

        var hasFailures = false

        for (item in pendingBatch) {
            try {
                when (item.domain) {
                    SyncDomain.CHECKIN_EXERCISE_SET -> {
                        val dto = gson.fromJson(item.payloadJson, SetExecutionCheckInDto::class.java)
                        supabaseApi.pushSetCheckIn(dto)
                    }
                    SyncDomain.CHECKIN_MEAL -> {
                        supabaseApi.pushMealCheckIn(item.entityId, item.payloadJson)
                    }
                    SyncDomain.CHECKIN_SUPPLEMENT -> {
                        supabaseApi.pushSupplementCheckIn(item.entityId, item.payloadJson)
                    }
                    SyncDomain.CHECKIN_ANTHROPOMETRIC -> {
                        supabaseApi.pushAssessmentCheckIn(item.payloadJson)
                    }
                    else -> Unit
                }
                syncQueueDao.markSynced(item.id)
            } catch (e: Exception) {
                syncQueueDao.markError(item.id, e.localizedMessage ?: "Erro de rede desconhecido")
                hasFailures = true
            }
        }

        return if (hasFailures) Result.retry() else Result.success()
    }

    companion object {
        const val WORK_NAME = "LMTeamCloudSyncWorker"

        fun schedulePeriodicSync(workManager: WorkManager) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val syncRequest = PeriodicWorkRequestBuilder<CloudSyncWorker>(15, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                .build()

            workManager.enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                syncRequest
            )
        }

        fun triggerImmediateSync(workManager: WorkManager) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val oneTimeRequest = OneTimeWorkRequestBuilder<CloudSyncWorker>()
                .setConstraints(constraints)
                .build()

            workManager.enqueue(oneTimeRequest)
        }
    }
}`,
    kotlinDaoCode: `package com.lmteam.data.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

class NetworkMonitor(context: Context) {
    private val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    val isOnlineFlow: Flow<Boolean> = callbackFlow {
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                trySend(true)
            }
            override fun onLost(network: Network) {
                trySend(false)
            }
        }

        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        connectivityManager.registerNetworkCallback(request, callback)
        
        awaitClose {
            connectivityManager.unregisterNetworkCallback(callback)
        }
    }
}`,
    sqlDdl: `-- Configurações de indexação para sincronização em alta velocidade
CREATE INDEX IF NOT EXISTS idx_sync_queue_lookup ON \`sync_queue\`(\`status\`, \`created_at\`);`
  },

  // 5. MODULE: ANTHROPOMETRIC MEASUREMENTS & BIOMETRICS
  {
    id: 'anthropometric_assessment_entity',
    tableName: 'anthropometric_assessments',
    moduleName: '5. Antropometria & Bioimpedância',
    description: 'Histórico biométrico longitudinal: circunferências corporais, percentual de gordura (BF%), massa magra, peso e fotos de evolução.',
    primaryKey: 'id (String UUID)',
    foreignKeys: ['athlete_id -> athletes(id) [CASCADE]'],
    indices: ['athlete_id', 'assessment_date'],
    kotlinEntityCode: `package com.lmteam.data.local.entities

import androidx.room.*

@Entity(
    tableName = "anthropometric_assessments",
    foreignKeys = [
        ForeignKey(
            entity = AthleteEntity::class,
            parentColumns = ["id"],
            childColumns = ["athlete_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["athlete_id"]),
        Index(value = ["assessment_date"])
    ]
)
data class AnthropometricAssessmentEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String, // UUID
    
    @ColumnInfo(name = "athlete_id")
    val athleteId: String,
    
    @ColumnInfo(name = "assessment_date")
    val assessmentDate: String, // "YYYY-MM-DD"
    
    @ColumnInfo(name = "weight_kg")
    val weightKg: Double,
    
    @ColumnInfo(name = "height_cm")
    val heightCm: Double,
    
    @ColumnInfo(name = "body_fat_percentage")
    val bodyFatPercentage: Double,
    
    @ColumnInfo(name = "muscle_mass_kg")
    val muscleMassKg: Double,
    
    @ColumnInfo(name = "chest_cm")
    val chestCm: Double,
    
    @ColumnInfo(name = "shoulders_cm")
    val shouldersCm: Double,
    
    @ColumnInfo(name = "waist_cm")
    val waistCm: Double,
    
    @ColumnInfo(name = "abdomen_cm")
    val abdomenCm: Double,
    
    @ColumnInfo(name = "right_arm_cm")
    val rightArmCm: Double,
    
    @ColumnInfo(name = "left_arm_cm")
    val leftArmCm: Double,
    
    @ColumnInfo(name = "right_thigh_cm")
    val rightThighCm: Double,
    
    @ColumnInfo(name = "left_thigh_cm")
    val leftThighCm: Double,
    
    @ColumnInfo(name = "calves_cm")
    val calvesCm: Double,
    
    @ColumnInfo(name = "glutes_cm")
    val glutesCm: Double,
    
    @ColumnInfo(name = "neck_cm")
    val neckCm: Double,
    
    @ColumnInfo(name = "photo_front_url")
    val photoFrontUrl: String? = null,
    
    @ColumnInfo(name = "photo_back_url")
    val photoBackUrl: String? = null,
    
    @ColumnInfo(name = "photo_side_url")
    val photoSideUrl: String? = null,
    
    @ColumnInfo(name = "clinical_notes")
    val clinicalNotes: String? = null,
    
    @ColumnInfo(name = "sync_status")
    val syncStatus: SyncStatus = SyncStatus.SYNCED,
    
    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis()
)`,
    kotlinDaoCode: `package com.lmteam.data.local.dao

import androidx.room.*
import com.lmteam.data.local.entities.AnthropometricAssessmentEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface AnthropometricAssessmentDao {
    @Query("SELECT * FROM anthropometric_assessments WHERE athlete_id = :athleteId ORDER BY assessment_date ASC")
    fun getAssessmentsByAthlete(athleteId: String): Flow<List<AnthropometricAssessmentEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAssessment(assessment: AnthropometricAssessmentEntity)
}`,
    sqlDdl: `CREATE TABLE IF NOT EXISTS \`anthropometric_assessments\` (
  \`id\` TEXT NOT NULL PRIMARY KEY,
  \`athlete_id\` TEXT NOT NULL,
  \`assessment_date\` TEXT NOT NULL,
  \`weight_kg\` REAL NOT NULL,
  \`height_cm\` REAL NOT NULL,
  \`body_fat_percentage\` REAL NOT NULL,
  \`muscle_mass_kg\` REAL NOT NULL,
  \`chest_cm\` REAL NOT NULL,
  \`shoulders_cm\` REAL NOT NULL,
  \`waist_cm\` REAL NOT NULL,
  \`abdomen_cm\` REAL NOT NULL,
  \`right_arm_cm\` REAL NOT NULL,
  \`left_arm_cm\` REAL NOT NULL,
  \`right_thigh_cm\` REAL NOT NULL,
  \`left_thigh_cm\` REAL NOT NULL,
  \`calves_cm\` REAL NOT NULL,
  \`glutes_cm\` REAL NOT NULL,
  \`neck_cm\` REAL NOT NULL,
  \`photo_front_url\` TEXT,
  \`photo_back_url\` TEXT,
  \`photo_side_url\` TEXT,
  \`clinical_notes\` TEXT,
  \`sync_status\` TEXT NOT NULL DEFAULT 'SYNCED',
  \`created_at\` INTEGER NOT NULL,
  FOREIGN KEY(\`athlete_id\`) REFERENCES \`athletes\`(\`id\`) ON DELETE CASCADE
);`
  },

  // 6. MODULE: NUTRITION PLANS & MEALS & FOODS
  {
    id: 'nutrition_entities',
    tableName: 'nutrition_plans, meals, food_items',
    moduleName: '6. Nutrição, Refeições & Alimentos',
    description: 'Hierarquia de plano alimentar: metas de calorias/macros diários, refeições agendadas e alimentos pesados em gramas.',
    primaryKey: 'id (String UUID)',
    foreignKeys: [
      'nutrition_plans.athlete_id -> athletes(id) [CASCADE]',
      'meals.nutrition_plan_id -> nutrition_plans(id) [CASCADE]',
      'food_items.meal_id -> meals(id) [CASCADE]'
    ],
    indices: ['athlete_id', 'nutrition_plan_id', 'meal_id'],
    kotlinEntityCode: `package com.lmteam.data.local.entities

import androidx.room.*

@Entity(
    tableName = "nutrition_plans",
    foreignKeys = [
        ForeignKey(
            entity = AthleteEntity::class,
            parentColumns = ["id"],
            childColumns = ["athlete_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["athlete_id"])]
)
data class NutritionPlanEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,
    
    @ColumnInfo(name = "athlete_id")
    val athleteId: String,
    
    @ColumnInfo(name = "daily_target_calories")
    val dailyTargetCalories: Int,
    
    @ColumnInfo(name = "daily_target_protein_g")
    val dailyTargetProteinG: Int,
    
    @ColumnInfo(name = "daily_target_carbs_g")
    val dailyTargetCarbsG: Int,
    
    @ColumnInfo(name = "daily_target_fat_g")
    val dailyTargetFatG: Int,
    
    @ColumnInfo(name = "water_intake_liters")
    val waterIntakeLiters: Double = 4.5,
    
    @ColumnInfo(name = "is_active")
    val isActive: Boolean = true,
    
    @ColumnInfo(name = "sync_status")
    val syncStatus: SyncStatus = SyncStatus.SYNCED,
    
    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "meals",
    foreignKeys = [
        ForeignKey(
            entity = NutritionPlanEntity::class,
            parentColumns = ["id"],
            childColumns = ["nutrition_plan_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["nutrition_plan_id"])]
)
data class MealEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,
    
    @ColumnInfo(name = "nutrition_plan_id")
    val nutritionPlanId: String,
    
    @ColumnInfo(name = "meal_number")
    val mealNumber: Int,
    
    @ColumnInfo(name = "name")
    val name: String,
    
    @ColumnInfo(name = "time_schedule")
    val timeSchedule: String,
    
    @ColumnInfo(name = "target_protein_g")
    val targetProteinG: Int,
    
    @ColumnInfo(name = "target_carbs_g")
    val targetCarbsG: Int,
    
    @ColumnInfo(name = "target_fat_g")
    val targetFatG: Int,
    
    @ColumnInfo(name = "target_calories_kcal")
    val targetCaloriesKcal: Int,
    
    @ColumnInfo(name = "is_completed")
    val isCompleted: Boolean = false,
    
    @ColumnInfo(name = "sync_status")
    val syncStatus: SyncStatus = SyncStatus.SYNCED,
    
    @ColumnInfo(name = "notes")
    val notes: String? = null
)

@Entity(
    tableName = "food_items",
    foreignKeys = [
        ForeignKey(
            entity = MealEntity::class,
            parentColumns = ["id"],
            childColumns = ["meal_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["meal_id"])]
)
data class FoodItemEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,
    
    @ColumnInfo(name = "meal_id")
    val mealId: String,
    
    @ColumnInfo(name = "name")
    val name: String,
    
    @ColumnInfo(name = "portion_description")
    val portionDescription: String,
    
    @ColumnInfo(name = "amount_grams")
    val amountGrams: Double,
    
    @ColumnInfo(name = "protein_g")
    val proteinG: Double,
    
    @ColumnInfo(name = "carbs_g")
    val carbsG: Double,
    
    @ColumnInfo(name = "fat_g")
    val fatG: Double,
    
    @ColumnInfo(name = "calories_kcal")
    val caloriesKcal: Double,
    
    @ColumnInfo(name = "category")
    val category: String,
    
    @ColumnInfo(name = "is_consumed")
    val isConsumed: Boolean = false,
    
    @ColumnInfo(name = "sync_status")
    val syncStatus: SyncStatus = SyncStatus.SYNCED
)`,
    kotlinDaoCode: `package com.lmteam.data.local.dao

import androidx.room.*
import com.lmteam.data.local.entities.*
import com.lmteam.data.local.relations.NutritionPlanWithMeals
import kotlinx.coroutines.flow.Flow

@Dao
interface NutritionDao {
    @Transaction
    @Query("SELECT * FROM nutrition_plans WHERE athlete_id = :athleteId AND is_active = 1 LIMIT 1")
    fun getActiveNutritionPlanWithMeals(athleteId: String): Flow<NutritionPlanWithMeals?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNutritionPlan(plan: NutritionPlanEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMeals(meals: List<MealEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFoods(foods: List<FoodItemEntity>)

    @Query("UPDATE meals SET is_completed = :completed WHERE id = :mealId")
    suspend fun setMealCompleted(mealId: String, completed: Boolean)
}`,
    sqlDdl: `CREATE TABLE IF NOT EXISTS \`nutrition_plans\` (
  \`id\` TEXT NOT NULL PRIMARY KEY,
  \`athlete_id\` TEXT NOT NULL,
  \`daily_target_calories\` INTEGER NOT NULL,
  \`daily_target_protein_g\` INTEGER NOT NULL,
  \`daily_target_carbs_g\` INTEGER NOT NULL,
  \`daily_target_fat_g\` INTEGER NOT NULL,
  \`water_intake_liters\` REAL NOT NULL DEFAULT 4.5,
  \`is_active\` INTEGER NOT NULL DEFAULT 1,
  \`sync_status\` TEXT NOT NULL DEFAULT 'SYNCED',
  \`created_at\` INTEGER NOT NULL,
  FOREIGN KEY(\`athlete_id\`) REFERENCES \`athletes\`(\`id\`) ON DELETE CASCADE
);`
  },

  // 7. MODULE: WORKOUT SPLITS, EXERCISES, SETS & TECHNIQUES
  {
    id: 'workout_entities',
    tableName: 'workout_splits, exercises, exercise_sets',
    moduleName: '7. Treino, Séries, Técnicas & RPE',
    description: 'Divisão de treino periodizado (A/B/C/D/E), exercícios com ordem, técnicas avançadas (Drop set, Rest-pause), RPE e tempos de descanso.',
    primaryKey: 'id (String UUID)',
    foreignKeys: [
      'workout_splits.athlete_id -> athletes(id) [CASCADE]',
      'exercises.workout_split_id -> workout_splits(id) [CASCADE]',
      'exercise_sets.exercise_id -> exercises(id) [CASCADE]'
    ],
    indices: ['athlete_id', 'workout_split_id', 'exercise_id'],
    kotlinEntityCode: `package com.lmteam.data.local.entities

import androidx.room.*

@Entity(
    tableName = "workout_splits",
    foreignKeys = [
        ForeignKey(
            entity = AthleteEntity::class,
            parentColumns = ["id"],
            childColumns = ["athlete_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["athlete_id"])]
)
data class WorkoutSplitEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,
    
    @ColumnInfo(name = "athlete_id")
    val athleteId: String,
    
    @ColumnInfo(name = "code")
    val code: String, // "Treino A", "Treino B", etc.
    
    @ColumnInfo(name = "name")
    val name: String,
    
    @ColumnInfo(name = "day_of_week")
    val dayOfWeek: String,
    
    @ColumnInfo(name = "target_muscle_groups")
    val targetMuscleGroups: String,
    
    @ColumnInfo(name = "estimated_duration_minutes")
    val estimatedDurationMinutes: Int = 65,
    
    @ColumnInfo(name = "is_completed_today")
    val isCompletedToday: Boolean = false,
    
    @ColumnInfo(name = "cardio_type")
    val cardioType: String? = "Esteira Inclinada",
    
    @ColumnInfo(name = "cardio_duration_minutes")
    val cardioDurationMinutes: Int? = 35,
    
    @ColumnInfo(name = "cardio_target_kcal")
    val cardioTargetKcal: Int? = 300,
    
    @ColumnInfo(name = "sync_status")
    val syncStatus: SyncStatus = SyncStatus.SYNCED
)

@Entity(
    tableName = "exercises",
    foreignKeys = [
        ForeignKey(
            entity = WorkoutSplitEntity::class,
            parentColumns = ["id"],
            childColumns = ["workout_split_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["workout_split_id"])]
)
data class ExerciseEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,
    
    @ColumnInfo(name = "workout_split_id")
    val workoutSplitId: String,
    
    @ColumnInfo(name = "name")
    val name: String,
    
    @ColumnInfo(name = "target_muscle")
    val targetMuscle: String,
    
    @ColumnInfo(name = "rest_seconds")
    val restSeconds: Int = 90,
    
    @ColumnInfo(name = "technical_notes")
    val technicalNotes: String? = null,
    
    @ColumnInfo(name = "video_demo_url")
    val videoDemoUrl: String? = null,
    
    @ColumnInfo(name = "cadence")
    val cadence: String? = "3010",
    
    @ColumnInfo(name = "order_index")
    val orderIndex: Int = 0,
    
    @ColumnInfo(name = "sync_status")
    val syncStatus: SyncStatus = SyncStatus.SYNCED
)

@Entity(
    tableName = "exercise_sets",
    foreignKeys = [
        ForeignKey(
            entity = ExerciseEntity::class,
            parentColumns = ["id"],
            childColumns = ["exercise_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["exercise_id"])]
)
data class ExerciseSetEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,
    
    @ColumnInfo(name = "exercise_id")
    val exerciseId: String,
    
    @ColumnInfo(name = "set_number")
    val setNumber: Int,
    
    @ColumnInfo(name = "reps_target")
    val repsTarget: String,
    
    @ColumnInfo(name = "weight_kg_logged")
    val weightKgLogged: Double? = null,
    
    @ColumnInfo(name = "technique")
    val technique: String = "Normal",
    
    @ColumnInfo(name = "is_completed")
    val isCompleted: Boolean = false,
    
    @ColumnInfo(name = "rpe")
    val rpe: Double? = null,
    
    @ColumnInfo(name = "sync_status")
    val syncStatus: SyncStatus = SyncStatus.SYNCED
)`,
    kotlinDaoCode: `package com.lmteam.data.local.dao

import androidx.room.*
import com.lmteam.data.local.entities.*
import com.lmteam.data.local.relations.WorkoutSplitWithExercisesAndSets
import kotlinx.coroutines.flow.Flow

@Dao
interface WorkoutDao {
    @Transaction
    @Query("SELECT * FROM workout_splits WHERE athlete_id = :athleteId")
    fun getWorkoutSplitsForAthlete(athleteId: String): Flow<List<WorkoutSplitWithExercisesAndSets>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSplits(splits: List<WorkoutSplitEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExercises(exercises: List<ExerciseEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSets(sets: List<ExerciseSetEntity>)
}`,
    sqlDdl: `CREATE TABLE IF NOT EXISTS \`workout_splits\` (
  \`id\` TEXT NOT NULL PRIMARY KEY,
  \`athlete_id\` TEXT NOT NULL,
  \`code\` TEXT NOT NULL,
  \`name\` TEXT NOT NULL,
  \`day_of_week\` TEXT NOT NULL,
  \`target_muscle_groups\` TEXT NOT NULL,
  \`estimated_duration_minutes\` INTEGER NOT NULL DEFAULT 65,
  \`is_completed_today\` INTEGER NOT NULL DEFAULT 0,
  \`cardio_type\` TEXT,
  \`cardio_duration_minutes\` INTEGER,
  \`cardio_target_kcal\` INTEGER,
  \`sync_status\` TEXT NOT NULL DEFAULT 'SYNCED',
  FOREIGN KEY(\`athlete_id\`) REFERENCES \`athletes\`(\`id\`) ON DELETE CASCADE
);`
  },

  // 8. MODULE: SUPPLEMENTATION & CLINICAL MANIPULATED FORMULAS
  {
    id: 'supplement_entity',
    tableName: 'supplements',
    moduleName: '8. Suplementação & Manipulados',
    description: 'Protocolos de suplementos, manipulados clínicos, intra-treino, dosagens miligramadas e controle de ingestão diária.',
    primaryKey: 'id (String UUID)',
    foreignKeys: ['athlete_id -> athletes(id) [CASCADE]'],
    indices: ['athlete_id', 'category', 'schedule_time'],
    kotlinEntityCode: `package com.lmteam.data.local.entities

import androidx.room.*

@Entity(
    tableName = "supplements",
    foreignKeys = [
        ForeignKey(
            entity = AthleteEntity::class,
            parentColumns = ["id"],
            childColumns = ["athlete_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["athlete_id"]),
        Index(value = ["category"]),
        Index(value = ["schedule_time"])
    ]
)
data class SupplementEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,
    
    @ColumnInfo(name = "athlete_id")
    val athleteId: String,
    
    @ColumnInfo(name = "name")
    val name: String,
    
    @ColumnInfo(name = "dosage")
    val dosage: String,
    
    @ColumnInfo(name = "schedule_time")
    val scheduleTime: String,
    
    @ColumnInfo(name = "category")
    val category: String,
    
    @ColumnInfo(name = "benefits")
    val benefits: String,
    
    @ColumnInfo(name = "ingredients_json")
    val ingredientsJson: String? = null,
    
    @ColumnInfo(name = "is_taken_today")
    val isTakenToday: Boolean = false,
    
    @ColumnInfo(name = "sync_status")
    val syncStatus: SyncStatus = SyncStatus.SYNCED,
    
    @ColumnInfo(name = "doctor_notes")
    val doctorNotes: String? = null
)`,
    kotlinDaoCode: `package com.lmteam.data.local.dao

import androidx.room.*
import com.lmteam.data.local.entities.SupplementEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SupplementDao {
    @Query("SELECT * FROM supplements WHERE athlete_id = :athleteId ORDER BY schedule_time ASC")
    fun getSupplementsForAthlete(athleteId: String): Flow<List<SupplementEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSupplements(supplements: List<SupplementEntity>)

    @Query("UPDATE supplements SET is_taken_today = :isTaken WHERE id = :supplementId")
    suspend fun toggleSupplementTaken(supplementId: String, isTaken: Boolean)
}`,
    sqlDdl: `CREATE TABLE IF NOT EXISTS \`supplements\` (
  \`id\` TEXT NOT NULL PRIMARY KEY,
  \`athlete_id\` TEXT NOT NULL,
  \`name\` TEXT NOT NULL,
  \`dosage\` TEXT NOT NULL,
  \`schedule_time\` TEXT NOT NULL,
  \`category\` TEXT NOT NULL,
  \`benefits\` TEXT NOT NULL,
  \`ingredients_json\` TEXT,
  \`is_taken_today\` INTEGER NOT NULL DEFAULT 0,
  \`sync_status\` TEXT NOT NULL DEFAULT 'SYNCED',
  \`doctor_notes\` TEXT,
  FOREIGN KEY(\`athlete_id\`) REFERENCES \`athletes\`(\`id\`) ON DELETE CASCADE
);`
  },

  // 9. MODULE: ROOM RELATIONS & DATABASE WRAPPER
  {
    id: 'room_relations_and_db',
    tableName: 'app_database & relations',
    moduleName: '9. Relacionamentos & AppDatabase',
    description: 'Data Classes com @Relation (@Embedded), TypeConverters para Kotlin Serialization e a classe central AppDatabase Room.',
    primaryKey: 'N/A (Database Core)',
    foreignKeys: ['Relacionamentos 1:N e N:N entre tabelas'],
    indices: ['Foreign Keys otimizadas com indexação'],
    kotlinEntityCode: `package com.lmteam.data.local.db

import androidx.room.*
import com.lmteam.data.local.dao.*
import com.lmteam.data.local.entities.*
import com.lmteam.data.local.converters.*

// Relacionamentos 1:N
data class AthleteWithAssessments(
    @Embedded val athlete: AthleteEntity,
    @Relation(parentColumn = "id", entityColumn = "athlete_id")
    val assessments: List<AnthropometricAssessmentEntity>
)

data class NutritionPlanWithMeals(
    @Embedded val plan: NutritionPlanEntity,
    @Relation(parentColumn = "id", entityColumn = "nutrition_plan_id")
    val meals: List<MealEntity>
)

data class WorkoutSplitWithExercisesAndSets(
    @Embedded val split: WorkoutSplitEntity,
    @Relation(entity = ExerciseEntity::class, parentColumn = "id", entityColumn = "workout_split_id")
    val exercises: List<ExerciseWithSets>
)

data class ExerciseWithSets(
    @Embedded val exercise: ExerciseEntity,
    @Relation(parentColumn = "id", entityColumn = "exercise_id")
    val sets: List<ExerciseSetEntity>
)

// Master Database
@Database(
    entities = [
        AthleteEntity::class,
        SyncQueueEntity::class,
        AnthropometricAssessmentEntity::class,
        NutritionPlanEntity::class,
        MealEntity::class,
        FoodItemEntity::class,
        WorkoutSplitEntity::class,
        ExerciseEntity::class,
        ExerciseSetEntity::class,
        SupplementEntity::class
    ],
    version = 2,
    exportSchema = true
)
@TypeConverters(RoomConverters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun syncQueueDao(): SyncQueueDao
    abstract fun athleteDao(): AthleteDao
    abstract fun anthropometricDao(): AnthropometricAssessmentDao
    abstract fun nutritionDao(): NutritionDao
    abstract fun workoutDao(): WorkoutDao
    abstract fun supplementDao(): SupplementDao

    companion object {
        const val DATABASE_NAME = "lm_team_offline_first.db"
    }
}`,
    kotlinDaoCode: `package com.lmteam.data.local.converters

import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class RoomConverters {
    private val gson = Gson()

    @TypeConverter
    fun fromStringList(value: List<String>?): String? = value?.let { gson.toJson(it) }

    @TypeConverter
    fun toStringList(value: String?): List<String>? {
        if (value == null) return emptyList()
        val listType = object : TypeToken<List<String>>() {}.type
        return gson.fromJson(value, listType)
    }
}`,
    sqlDdl: `-- Master Schema for LM Team Offline-First SQLite / Room
PRAGMA foreign_keys = ON;`
  }
];
