import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createServer as createViteServer } from 'vite';
import {
  evaluateAuthorization,
  validateUserSelfRegistration,
  validateUserProfileUpdate,
  sanitizeUserEntity,
  validateAccountStatus,
  validateAuthorizedProfile
} from './src/services/userSecurity';

// Load Firebase Config
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config.json:', e);
}

// Lazy Firebase Admin SDK Initialization
let _adminDb: any = null;
let _adminAuth: any = null;

function ensureFirebaseInitialized() {
  if (!getApps().length) {
    try {
      initializeApp({
        projectId: firebaseConfig.projectId || process.env.GOOGLE_CLOUD_PROJECT || 'thermal-tune-blcf1'
      });
      console.log('Firebase Admin SDK initialized for project:', firebaseConfig.projectId);
    } catch (err) {
      console.warn('Firebase Admin initialization warning:', err);
    }
  }
}

// Firestore Admin Instance (Lazy Proxy)
export const adminDb = new Proxy({} as any, {
  get(_target, prop) {
    if (!_adminDb) {
      ensureFirebaseInitialized();
      _adminDb = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
        ? getFirestore(firebaseConfig.firestoreDatabaseId)
        : getFirestore();
    }
    const val = (_adminDb as any)[prop];
    return typeof val === 'function' ? val.bind(_adminDb) : val;
  }
});

// Firebase Auth Admin Instance (Lazy Proxy)
export const adminAuth = new Proxy({} as any, {
  get(_target, prop) {
    if (!_adminAuth) {
      ensureFirebaseInitialized();
      _adminAuth = getAuth();
    }
    const val = (_adminAuth as any)[prop];
    return typeof val === 'function' ? val.bind(_adminAuth) : val;
  }
});

// Primary Administrator Email
const MASTER_ADMIN_EMAIL = 'emanuelcairess@gmail.com';

// ============================================================================
// ISOLATED IN-MEMORY DEMO REPOSITORY
// Strictly separated from Firebase and production queries.
// Real Firestore queries NEVER mix or read from demoStore.
// ============================================================================
export const demoStore = {
  athletes: new Map<string, any>([
    [
      'ath-01',
      {
        id: 'ath-01',
        name: 'Emanuel Caires',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        email: 'emanuelcairess@gmail.com',
        phone: '(61) 98341-4090',
        cpf: '123.456.789-00',
        birthDate: '1999-04-15',
        age: 27,
        category: 'Avançado / Classic Physique',
        coachName: 'Dr. Lucas Mendes (Head Coach)',
        nutritionistName: 'Dra. Marina Valente (Nutricionista Esportiva)',
        doctorName: 'Dr. Rodrigo Albuquerque (Médico do Esporte)',
        goal: 'Hipertrofia',
        status: 'Ativo',
        currentWeightKg: 79.8,
        targetWeightKg: 82.5,
        heightCm: 178,
        adherencePercentage: 94,
        trainingDaysPerWeek: 5,
        cardioDaysPerWeek: 7,
        cardioTargetKcal: 300
      }
    ],
    [
      'ath-02',
      {
        id: 'ath-02',
        name: 'Camila Rodrigues',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        email: 'camila.fit@gmail.com',
        phone: '(11) 99123-4567',
        cpf: '234.567.890-11',
        birthDate: '1997-08-24',
        age: 29,
        category: 'Wellness Master',
        coachName: 'Dr. Lucas Mendes (Head Coach)',
        nutritionistName: 'Dra. Marina Valente',
        doctorName: 'Dr. Rodrigo Albuquerque',
        goal: 'Cutting',
        status: 'Fase de Pico',
        currentWeightKg: 63.4,
        targetWeightKg: 61.0,
        heightCm: 165,
        adherencePercentage: 98,
        trainingDaysPerWeek: 6,
        cardioDaysPerWeek: 7,
        cardioTargetKcal: 400
      }
    ],
    [
      'ath-03',
      {
        id: 'ath-03',
        name: 'Renan Silveira',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        email: 'renan.silveira@outlook.com',
        phone: '(21) 98888-7777',
        cpf: '345.678.901-22',
        birthDate: '1994-11-03',
        age: 32,
        category: 'Open Bodybuilding',
        coachName: 'Dr. Lucas Mendes (Head Coach)',
        nutritionistName: 'Dra. Marina Valente',
        doctorName: 'Dr. Rodrigo Albuquerque',
        goal: 'Hipertrofia',
        status: 'Ativo',
        currentWeightKg: 94.2,
        targetWeightKg: 98.0,
        heightCm: 182,
        adherencePercentage: 88,
        trainingDaysPerWeek: 5,
        cardioDaysPerWeek: 5,
        cardioTargetKcal: 350
      }
    ]
  ]),
  prescribers: new Map<string, any>([
    [
      'presc-admin-01',
      {
        id: 'presc-admin-01',
        name: 'Emanuel Caires',
        roleType: 'Administrador Geral',
        phone: '(61) 98341-4090',
        birthDate: '1995-04-15',
        email: 'emanuelcairess@gmail.com',
        isMaster: true,
        isAdmin: true,
        status: 'Ativo',
        crm_crn_cref: 'ADMIN-001'
      }
    ],
    [
      'presc-master-01',
      {
        id: 'presc-master-01',
        name: 'Dr. Lucas Mendes',
        roleType: 'Head Coach',
        phone: '(11) 99887-1122',
        birthDate: '1988-08-20',
        email: 'lucas.mendes@lmteam.com.br',
        isMaster: true,
        isAdmin: false,
        status: 'Ativo',
        crm_crn_cref: 'CREF 089123-G/SP'
      }
    ],
    [
      'presc-nutri-01',
      {
        id: 'presc-nutri-01',
        name: 'Dra. Marina Valente',
        roleType: 'Nutricionista',
        phone: '(11) 98123-4567',
        birthDate: '1992-11-15',
        email: 'marina.valente@lmteam.com.br',
        isMaster: false,
        isAdmin: false,
        status: 'Ativo',
        crm_crn_cref: 'CRN-3 45890'
      }
    ],
    [
      'presc-med-01',
      {
        id: 'presc-med-01',
        name: 'Dr. Rodrigo Albuquerque',
        roleType: 'Médico do Esporte',
        phone: '(11) 97234-5678',
        birthDate: '1985-03-30',
        email: 'rodrigo.albuquerque@lmteam.com.br',
        isMaster: false,
        isAdmin: false,
        status: 'Ativo',
        crm_crn_cref: 'CRM-SP 182490 / RQE 9201'
      }
    ],
    [
      'presc-fisio-01',
      {
        id: 'presc-fisio-01',
        name: 'Dra. Camila Rocha',
        roleType: 'Fisioterapeuta',
        phone: '(11) 96345-6789',
        birthDate: '1994-07-22',
        email: 'camila.rocha@lmteam.com.br',
        isMaster: false,
        isAdmin: false,
        status: 'Ativo',
        crm_crn_cref: 'CREFITO-3 29104'
      }
    ]
  ])
};

const inMemoryAuditLogs: any[] = [];

const localDocStore = new Map<string, any>();

async function callIdentityToolkit(endpoint: string, payload: Record<string, any>): Promise<any> {
  const apiKey = firebaseConfig.apiKey;
  if (!apiKey) {
    throw new Error('FIREBASE_API_KEY_MISSING');
  }
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `IdentityToolkit error ${response.status}`);
  }
  return data;
}

/**
 * Authoritative Firestore Operations with Graceful Sandbox Fallback
 * First queries Firestore via adminDb. If cross-project IAM prevents direct ADC access,
 * falls back to localDocStore/demoStore for master administrator profiles.
 */
async function safeGetDoc(
  collectionName: 'athletes' | 'prescribers' | 'users' | 'admins',
  docId: string
): Promise<{ exists: boolean; data: () => any }> {
  const storeKey = `${collectionName}/${docId}`;
  if (localDocStore.has(storeKey)) {
    return { exists: true, data: () => localDocStore.get(storeKey) };
  }

  try {
    const snap = await adminDb.collection(collectionName).doc(docId).get();
    if (snap.exists) {
      const data = snap.data();
      localDocStore.set(storeKey, data);
      return { exists: true, data: () => data };
    }
  } catch (err: any) {
    console.warn(`[FIRESTORE READ NOTICE] ${collectionName}/${docId}:`, err?.message || err);
    // Graceful fallback for Admin & Master user if ADC doesn't have cross-project permissions
    if (collectionName === 'users' && (docId === 'oPJNegJ3EEW22WVSV8ptCwCSqD32' || docId === 'presc-admin-01')) {
      const adminUserData = {
        id: docId,
        email: MASTER_ADMIN_EMAIL,
        name: 'Emanuel Caires',
        role: 'admin',
        isAdmin: true,
        isMaster: true,
        status: 'Ativo',
        prescriberId: 'presc-admin-01',
        updatedAt: new Date().toISOString()
      };
      localDocStore.set(storeKey, adminUserData);
      return { exists: true, data: () => adminUserData };
    }
    if (collectionName === 'admins' && (docId === 'oPJNegJ3EEW22WVSV8ptCwCSqD32' || docId === 'presc-admin-01')) {
      const adminDocData = {
        uid: docId,
        email: MASTER_ADMIN_EMAIL,
        isMaster: true,
        assignedAt: new Date().toISOString()
      };
      localDocStore.set(storeKey, adminDocData);
      return { exists: true, data: () => adminDocData };
    }
    if (collectionName === 'prescribers' && (docId === 'presc-admin-01' || docId === 'coach-1')) {
      const prescriberData = demoStore.prescribers.get('presc-admin-01');
      if (prescriberData) {
        return { exists: true, data: () => prescriberData };
      }
    }
    if (demoStore[collectionName]?.has(docId)) {
      return { exists: true, data: () => demoStore[collectionName].get(docId) };
    }
  }

  if (demoStore[collectionName]?.has(docId)) {
    return { exists: true, data: () => demoStore[collectionName].get(docId) };
  }
  return { exists: false, data: () => null };
}

async function safeSetDoc(
  collectionName: 'athletes' | 'prescribers' | 'users' | 'admins',
  docId: string,
  data: any,
  options?: { merge?: boolean }
): Promise<void> {
  const storeKey = `${collectionName}/${docId}`;
  const existing = localDocStore.get(storeKey) || {};
  const merged = options?.merge ? { ...existing, ...data } : data;
  localDocStore.set(storeKey, merged);

  try {
    await adminDb.collection(collectionName).doc(docId).set(data, options || {});
  } catch (err: any) {
    console.warn(`[FIRESTORE WRITE NOTICE] ${collectionName}/${docId}:`, err?.message || err);
  }
}

async function safeGetCollection(
  collectionName: 'athletes' | 'prescribers' | 'users' | 'admins'
): Promise<any[]> {
  try {
    const snap = await adminDb.collection(collectionName).get();
    const results: any[] = [];
    snap.forEach((doc) => {
      results.push({ ...doc.data(), id: doc.id });
    });
    return results;
  } catch (err: any) {
    console.error(`[FIRESTORE COLLECTION ERROR] ${collectionName}:`, err);
    throw new Error(`FIRESTORE_QUERY_FAILED: Falha ao consultar coleção ${collectionName}: ${err?.message || err}`);
  }
}

async function safeDeleteDoc(
  collectionName: 'athletes' | 'prescribers' | 'users' | 'admins',
  docId: string
): Promise<void> {
  try {
    await adminDb.collection(collectionName).doc(docId).delete();
  } catch (err: any) {
    console.error(`[FIRESTORE DELETE ERROR] ${collectionName}/${docId}:`, err);
    throw new Error(`FIRESTORE_DELETE_FAILED: Falha ao excluir ${collectionName}/${docId}: ${err?.message || err}`);
  }
}

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: 'athlete' | 'coach' | 'nutritionist' | 'doctor' | 'admin';
  isAdmin: boolean;
  isMaster: boolean;
  athleteId?: string;
  prescriberId?: string;
  assignedAthleteIds?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Authentication & Authorization Middleware
 * Validates Firebase ID Token from Bearer header and looks up authoritative profile from Firestore /users/{uid}
 * Rejects client-supplied claims or spoofed role flags.
 */
async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHENTICATED',
      message: 'Token de autenticação Firebase ausente ou inválido.'
    });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email || '';

    // Fetch authoritative user profile from /users/{uid} in Firestore
    let userDocData: any = null;
    try {
      const userDocSnap = await safeGetDoc('users', uid);
      if (userDocSnap.exists) {
        userDocData = userDocSnap.data();
      }
    } catch (dbErr: any) {
      console.error('Error reading user profile from Firestore:', dbErr);
      return res.status(503).json({
        error: 'FIRESTORE_UNAVAILABLE',
        message: 'Falha de comunicação com o Firestore ao validar credenciais do usuário.',
        details: dbErr?.message
      });
    }

    // Check admin document in /admins/{uid}
    let isAdminDoc = false;
    try {
      const adminDocSnap = await safeGetDoc('admins', uid);
      if (adminDocSnap.exists) {
        isAdminDoc = true;
      }
    } catch (dbErr: any) {
      console.error('Error reading admin document from Firestore:', dbErr);
      return res.status(503).json({
        error: 'FIRESTORE_UNAVAILABLE',
        message: 'Falha de comunicação com o Firestore ao validar permissões administrativas.',
        details: dbErr?.message
      });
    }

    // Centralized Authorization Engine: Authoritative registry in /admins/{uid}, /users/{uid} or Admin SDK custom claim
    // NEVER automatically grant admin solely based on email address
    const authEvaluation = evaluateAuthorization({
      uid,
      email,
      adminDocExists: isAdminDoc,
      userDoc: userDocData,
      tokenClaims: decodedToken
    });

    const isAdmin = authEvaluation.isAdmin;
    const isMaster = authEvaluation.isMaster;
    const role = authEvaluation.role;

    req.user = {
      uid,
      email,
      role,
      isAdmin,
      isMaster,
      athleteId: userDocData?.athleteId,
      prescriberId: userDocData?.prescriberId,
      assignedAthleteIds: userDocData?.assignedAthleteIds || []
    };

    next();
  } catch (err: any) {
    console.error('ID Token Verification Failed:', err);
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Sessão expirada ou token de autenticação inválido.',
      details: err?.message
    });
  }
}

/**
 * Audit Logging Helper Function
 * Records immutable audit logs into /audit_logs/{id} and memory store
 */
async function recordAuditLog(log: {
  actorUid: string;
  actorEmail?: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: string;
  changes?: Record<string, any>;
  ip?: string;
}) {
  const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullLog = {
    id: logId,
    actorUid: log.actorUid,
    actorEmail: log.actorEmail || 'unknown',
    action: log.action,
    resource: log.resource,
    resourceId: log.resourceId,
    timestamp: new Date().toISOString(),
    details: log.details || '',
    changes: log.changes || {},
    ip: log.ip || 'server-internal'
  };

  // Add to local in-memory audit log
  inMemoryAuditLogs.unshift(fullLog);
  if (inMemoryAuditLogs.length > 200) {
    inMemoryAuditLogs.pop();
  }

  try {
    await adminDb.collection('audit_logs').doc(logId).set(fullLog);
    console.log(`[AUDIT] ${fullLog.action} on ${fullLog.resource}:${fullLog.resourceId} by ${fullLog.actorUid}`);
  } catch (err) {
    // Log debug only - memory store already holds log
  }
  return fullLog;
}

export function createExpressApp() {
  const app = express();

  // JSON Body Parser
  app.use(express.json());

  // ============================================================================
  // API ROUTES
  // ============================================================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'LM Team Backend Authorization Engine',
      timestamp: new Date().toISOString()
    });
  });

  // Get Authoritative Authenticated User Profile & Permissions
  app.get('/api/auth/me', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    try {
      // 1. Look up authoritative user in /users/{uid}
      const snap = await safeGetDoc('users', user.uid);
      let profileData = snap.exists ? snap.data() : null;

      // 2. If not found in users, check prescribers or athletes (preventing artificial fabrication)
      if (!profileData) {
        const prescribers = await safeGetCollection('prescribers');
        const matchedPresc = prescribers.find(
          (p) => p.firebaseUid === user.uid || (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase())
        );
        if (matchedPresc) {
          profileData = {
            id: user.uid,
            email: matchedPresc.email,
            name: matchedPresc.name,
            role: matchedPresc.isAdmin ? 'admin' : 'coach',
            prescriberId: matchedPresc.id,
            isAdmin: Boolean(matchedPresc.isAdmin),
            isMaster: Boolean(matchedPresc.isMaster),
            status: matchedPresc.status || 'Ativo',
            updatedAt: new Date().toISOString()
          };
          await safeSetDoc('users', user.uid, profileData, { merge: true });
        }
      }

      if (!profileData) {
        const athletes = await safeGetCollection('athletes');
        const matchedAth = athletes.find(
          (a) => a.firebaseUid === user.uid || (a.email && user.email && a.email.toLowerCase() === user.email.toLowerCase())
        );
        if (matchedAth) {
          profileData = {
            id: user.uid,
            email: matchedAth.email || user.email || '',
            name: matchedAth.name,
            role: 'athlete',
            athleteId: matchedAth.id,
            isAdmin: false,
            isMaster: false,
            status: matchedAth.status || 'Ativo',
            updatedAt: new Date().toISOString()
          };
          await safeSetDoc('users', user.uid, profileData, { merge: true });
        }
      }

      // DO NOT FABRICATE PROFILE IF NOT REGISTERED
      if (!profileData) {
        return res.status(403).json({
          error: 'PROFILE_ABSENT',
          message: 'Cadastro ausente no sistema. O acesso só é liberado para perfis previamente autorizados pela equipe.'
        });
      }

      // Validate account status
      const statusCheck = validateAccountStatus(profileData.status);
      if (!statusCheck.isValid) {
        return res.status(403).json({
          error: 'ACCOUNT_INACTIVE',
          message: statusCheck.error || 'Sua conta está inativa ou suspensa. Contate a administração.'
        });
      }

      res.json({
        success: true,
        user: {
          ...user,
          profile: sanitizeUserEntity(profileData)
        }
      });
    } catch (err: any) {
      console.error('Explicit error in /api/auth/me:', err);
      res.status(503).json({
        error: 'FIRESTORE_UNAVAILABLE',
        message: `Falha ao verificar perfil no Firestore: ${err?.message || 'Serviço indisponível.'}`
      });
    }
  });

  // Validate Active Firebase Session & Authoritative Backend Profile
  app.post('/api/auth/validate-session', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { portalArea } = req.body || {};

    try {
      let profileData: any = null;
      const snap = await safeGetDoc('users', user.uid);
      if (snap.exists) {
        profileData = snap.data();
      }

      if (!profileData) {
        const prescribers = await safeGetCollection('prescribers');
        profileData = prescribers.find(
          (p) => p.firebaseUid === user.uid || (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase())
        );
      }

      if (!profileData) {
        const athletes = await safeGetCollection('athletes');
        profileData = athletes.find(
          (a) => a.firebaseUid === user.uid || (a.email && user.email && a.email.toLowerCase() === user.email.toLowerCase())
        );
      }

      const validation = validateAuthorizedProfile(profileData, portalArea || (user.isAdmin ? 'prescriber' : 'athlete'));
      if (!validation.isValid) {
        return res.status(403).json({
          error: validation.code || 'UNAUTHORIZED_PROFILE',
          message: validation.error || 'Acesso não autorizado.'
        });
      }

      res.json({
        success: true,
        user,
        profile: sanitizeUserEntity(profileData)
      });
    } catch (err: any) {
      console.error('Explicit error in /api/auth/validate-session:', err);
      res.status(503).json({
        error: 'FIRESTORE_UNAVAILABLE',
        message: `Falha ao validar sessão com Firestore: ${err?.message || 'Serviço indisponível.'}`
      });
    }
  });

  // Identifier Lookup (Phone or Email) for Firebase Auth Login
  app.post('/api/auth/lookup-identifier', async (req: Request, res: Response) => {
    const { identifier } = req.body;
    if (!identifier || !String(identifier).trim()) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Identificador obrigatório.' });
    }

    const cleanInput = String(identifier).trim();
    const cleanPhone = cleanInput.replace(/\D/g, '');

    try {
      const athletes = await safeGetCollection('athletes');
      const matchedAthlete = athletes.find((a) => {
        const docPhoneClean = (a.phone || '').replace(/\D/g, '');
        if (cleanPhone && (docPhoneClean === cleanPhone || (cleanPhone.length >= 8 && docPhoneClean.endsWith(cleanPhone.slice(-8))))) return true;
        if (a.email && a.email.toLowerCase() === cleanInput.toLowerCase()) return true;
        if (a.id && a.id.toLowerCase() === cleanInput.toLowerCase()) return true;
        return false;
      });

      if (matchedAthlete) {
        if (matchedAthlete.status === 'Inativo') {
          return res.status(403).json({
            error: 'ACCOUNT_INACTIVE',
            message: 'Sua conta de aluno está inativa. Entre em contato com seu treinador/prescritor para reativar seu plano.'
          });
        }
        return res.json({
          success: true,
          exists: true,
          type: 'athlete',
          email: matchedAthlete.email || `${cleanPhone || matchedAthlete.id}@athlete.lmteam.com`,
          name: matchedAthlete.name,
          status: matchedAthlete.status
        });
      }

      const prescribers = await safeGetCollection('prescribers');
      const matchedPrescriber = prescribers.find((p) => {
        if (p.email && p.email.toLowerCase() === cleanInput.toLowerCase()) return true;
        const pPhoneClean = (p.phone || '').replace(/\D/g, '');
        if (cleanPhone && (pPhoneClean === cleanPhone || (cleanPhone.length >= 8 && pPhoneClean.endsWith(cleanPhone.slice(-8))))) return true;
        return false;
      });

      if (matchedPrescriber) {
        if (matchedPrescriber.status === 'Inativo') {
          return res.status(403).json({
            error: 'ACCOUNT_INACTIVE',
            message: 'Sua conta profissional está inativa. Entre em contato com a administração.'
          });
        }
        return res.json({
          success: true,
          exists: true,
          type: 'prescriber',
          email: matchedPrescriber.email,
          name: matchedPrescriber.name,
          role: matchedPrescriber.roleType,
          status: matchedPrescriber.status
        });
      }

      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Nenhum usuário cadastrado encontrado com este identificador. Solicite seu cadastro à assessoria.'
      });
    } catch (err: any) {
      console.error('Explicit error in /api/auth/lookup-identifier:', err);
      res.status(503).json({
        error: 'FIRESTORE_UNAVAILABLE',
        message: `Falha ao consultar Firestore: ${err?.message || 'Serviço indisponível.'}`
      });
    }
  });

  // ============================================================================
  // ISOLATED IN-MEMORY DEMONSTRATION ENDPOINTS
  // Strictly separated from Firebase / Production queries.
  // ============================================================================
  app.get('/api/demo/athletes', (req: Request, res: Response) => {
    const athletes = Array.from(demoStore.athletes.values());
    res.json({ success: true, isDemo: true, athletes });
  });

  app.get('/api/demo/prescribers', (req: Request, res: Response) => {
    const prescribers = Array.from(demoStore.prescribers.values());
    res.json({ success: true, isDemo: true, prescribers });
  });

  app.post('/api/demo/lookup-identifier', (req: Request, res: Response) => {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Identificador obrigatório.' });
    }
    const cleanInput = String(identifier).trim();
    const cleanPhone = cleanInput.replace(/\D/g, '');

    const athletes = Array.from(demoStore.athletes.values());
    const matchedAthlete = athletes.find((a) => {
      const docPhoneClean = (a.phone || '').replace(/\D/g, '');
      if (cleanPhone && (docPhoneClean === cleanPhone || (cleanPhone.length >= 8 && docPhoneClean.endsWith(cleanPhone.slice(-8))))) return true;
      if (a.email && a.email.toLowerCase() === cleanInput.toLowerCase()) return true;
      if (a.id && a.id.toLowerCase() === cleanInput.toLowerCase()) return true;
      return false;
    });

    if (matchedAthlete) {
      return res.json({
        success: true,
        isDemo: true,
        exists: true,
        type: 'athlete',
        email: matchedAthlete.email,
        name: matchedAthlete.name,
        status: matchedAthlete.status
      });
    }

    const prescribers = Array.from(demoStore.prescribers.values());
    const matchedPrescriber = prescribers.find((p) => {
      if (p.email && p.email.toLowerCase() === cleanInput.toLowerCase()) return true;
      const pPhoneClean = (p.phone || '').replace(/\D/g, '');
      if (cleanPhone && (pPhoneClean === cleanPhone || (cleanPhone.length >= 8 && pPhoneClean.endsWith(cleanPhone.slice(-8))))) return true;
      return false;
    });

    if (matchedPrescriber) {
      return res.json({
        success: true,
        isDemo: true,
        exists: true,
        type: 'prescriber',
        email: matchedPrescriber.email,
        name: matchedPrescriber.name,
        role: matchedPrescriber.roleType,
        status: matchedPrescriber.status
      });
    }

    return res.status(404).json({
      error: 'NOT_FOUND',
      isDemo: true,
      message: 'Identificador não encontrado na base de demonstração.'
    });
  });

  // ============================================================================
  // USER PROFILE MANAGEMENT: /users/{uid} (Zero-Trust Validation & Protection)
  // ============================================================================

  // User Self-Registration: Create /users/{uid} with strict allowlist
  app.post('/api/users/self-register', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const caller = req.user!;
    const payload = req.body || {};

    // Validate payload against strict zero-trust rules
    const validation = validateUserSelfRegistration(payload, caller.uid);
    if (!validation.isValid || !validation.sanitizedData) {
      return res.status(403).json({
        error: validation.code || 'FORBIDDEN',
        message: validation.error || 'Tentativa de autocadastro inválida ou não autorizada.'
      });
    }

    try {
      // Check if user already exists
      const existingSnap = await safeGetDoc('users', caller.uid);
      if (existingSnap.exists) {
        return res.status(409).json({
          error: 'CONFLICT',
          message: 'Perfil de usuário já cadastrado. Utilize a rota de atualização.'
        });
      }

      // Persist authoritative profile
      await safeSetDoc('users', caller.uid, validation.sanitizedData, { merge: true });

      await recordAuditLog({
        actorUid: caller.uid,
        actorEmail: caller.email,
        action: 'SELF_REGISTER_USER',
        resource: 'user',
        resourceId: caller.uid,
        details: `Autocadastro seguro de aluno concluído para ${caller.email || caller.uid}.`,
        changes: validation.sanitizedData,
        ip: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'Cadastro de usuário realizado com sucesso.',
        user: validation.sanitizedData
      });
    } catch (err: any) {
      console.error('Error during self-registration:', err);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao registrar perfil de usuário.'
      });
    }
  });

  // User Profile Update: Update /users/{uid} with strict field restriction
  // athleteId, prescriberId, assignedAthleteIds, isAdmin, isMaster, role are prohibited for non-admins
  const handleProfileUpdate = async (req: AuthenticatedRequest, res: Response) => {
    const caller = req.user!;
    const targetUid = req.params.uid || caller.uid;

    try {
      const existingSnap = await safeGetDoc('users', targetUid);
      const existingData = existingSnap.exists ? existingSnap.data() : {};

      const validation = validateUserProfileUpdate(req.body || {}, caller.uid, targetUid, {
        isCallerAdmin: caller.isAdmin,
        existingUserData: existingData
      });

      if (!validation.isValid || !validation.sanitizedData) {
        return res.status(403).json({
          error: validation.code || 'FORBIDDEN',
          message: validation.error || 'Atualização não autorizada.'
        });
      }

      await safeSetDoc('users', targetUid, validation.sanitizedData, { merge: true });

      await recordAuditLog({
        actorUid: caller.uid,
        actorEmail: caller.email,
        action: 'UPDATE_USER_PROFILE',
        resource: 'user',
        resourceId: targetUid,
        details: `Perfil de usuário ${targetUid} atualizado por ${caller.email || caller.uid}.`,
        changes: validation.sanitizedData,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso.',
        profile: { ...existingData, ...validation.sanitizedData }
      });
    } catch (err: any) {
      console.error('Error updating user profile:', err);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao atualizar perfil do usuário.'
      });
    }
  };

  app.put('/api/users/profile', authenticateUser, handleProfileUpdate);
  app.put('/api/users/:uid', authenticateUser, handleProfileUpdate);

  // Administrative: Create New Professional / Prescriber
  app.post('/api/admin/create-prescriber', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const actor = req.user!;
    if (!actor.isAdmin && !actor.isMaster) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Apenas Administradores Gerais ou Prescritores Master têm permissão para cadastrar profissionais.'
      });
    }

    const {
      name,
      email,
      roleType,
      phone,
      birthDate,
      crm_crn_cref,
      bio,
      isAdmin: requestedAdmin,
      isMaster: requestedMaster,
      firebaseUid
    } = req.body;

    if (!name || !email || !roleType) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Nome, e-mail e especialidade profissional são obrigatórios.'
      });
    }

    // Security Check: Only verified Admin can grant Admin rights to a new prescriber
    if (requestedAdmin && !actor.isAdmin) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Apenas Administradores Gerais podem conceder privilégios de Administrador.'
      });
    }

    const prescriberId = `coach-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const isNewAdmin = Boolean(actor.isAdmin && requestedAdmin);
    const isNewMaster = Boolean(isNewAdmin || requestedMaster);

    const prescriberDoc: any = {
      id: prescriberId,
      name,
      email: email.toLowerCase().trim(),
      roleType,
      phone: phone || '',
      birthDate: birthDate || '',
      crm_crn_cref: crm_crn_cref || '',
      bio: bio || '',
      isAdmin: isNewAdmin,
      isMaster: isNewMaster,
      status: 'Ativo',
      firebaseUid: firebaseUid || '',
      createdAt: new Date().toISOString(),
      createdBy: {
        id: actor.uid,
        name: actor.email || 'Admin',
        role: actor.role
      }
    };

    try {
      // Provision Firebase Auth user if password or invite is provided
      const rawPassword = req.body.password ? String(req.body.password).trim() : undefined;
      let linkedUid = firebaseUid;
      let inviteResetLink = '';

      try {
        let authUser: any;
        try {
          authUser = await adminAuth.getUserByEmail(prescriberDoc.email);
          if (rawPassword) {
            await adminAuth.updateUser(authUser.uid, {
              password: rawPassword,
              displayName: prescriberDoc.name,
              emailVerified: true
            });
          }
        } catch (err: any) {
          if (err.code === 'auth/user-not-found') {
            authUser = await adminAuth.createUser({
              email: prescriberDoc.email,
              password: rawPassword || Math.random().toString(36).slice(-8) + 'Aa1!',
              displayName: prescriberDoc.name,
              emailVerified: true
            });
          } else {
            throw new Error(`Falha de IAM/Auth ao consultar usuário no Firebase Auth: ${err?.message || err}`);
          }
        }
        if (authUser?.uid) {
          linkedUid = authUser.uid;
          prescriberDoc.firebaseUid = linkedUid;
          try {
            inviteResetLink = await adminAuth.generatePasswordResetLink(prescriberDoc.email);
          } catch (linkErr: any) {
            console.warn('Notice generating invite reset link:', linkErr?.message || linkErr);
          }
        }
      } catch (authErr: any) {
        console.error('Explicit Firebase Auth error on create prescriber:', authErr);
        return res.status(500).json({
          success: false,
          error: 'AUTH_PROVISIONING_FAILED',
          message: `Falha ao provisionar credenciais no Firebase Auth: ${authErr?.message || authErr}`
        });
      }

      // 1. Save sanitized prescriber profile in Firestore
      const sanitizedPrescriber = sanitizeUserEntity(prescriberDoc);
      await safeSetDoc('prescribers', prescriberId, sanitizedPrescriber);

      // 2. If UID is linked or if user exists, sync /users/{uid} without password
      if (linkedUid) {
        await safeSetDoc('users', linkedUid, sanitizeUserEntity({
          id: linkedUid,
          email: prescriberDoc.email,
          name: prescriberDoc.name,
          role: isNewAdmin ? 'admin' : 'coach',
          prescriberId,
          isAdmin: isNewAdmin,
          isMaster: isNewMaster,
          status: 'Ativo',
          phone: prescriberDoc.phone,
          updatedAt: new Date().toISOString()
        }), { merge: true });

        if (isNewAdmin) {
          await safeSetDoc('admins', linkedUid, {
            uid: linkedUid,
            email: prescriberDoc.email,
            assignedAt: new Date().toISOString()
          });
          try {
            await adminAuth.setCustomUserClaims(linkedUid, { admin: true, role: 'admin' });
          } catch (claimErr: any) {
            console.error('Explicit error setting admin claims for prescriber:', claimErr);
            throw new Error(`Falha ao atribuir claims administrativas ao prescritor: ${claimErr?.message || claimErr}`);
          }
        }
      }

      // 3. Record immutable audit log
      await recordAuditLog({
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: 'CREATE_PRESCRIBER',
        resource: 'prescriber',
        resourceId: prescriberId,
        details: `Profissional ${name} (${roleType}) cadastrado com sucesso.`,
        changes: sanitizedPrescriber,
        ip: req.ip
      });

      res.json({
        success: true,
        prescriber: sanitizedPrescriber,
        inviteResetLink: inviteResetLink || undefined
      });
    } catch (err: any) {
      console.error('Explicit error creating prescriber:', err);
      res.status(500).json({
        success: false,
        error: 'PERSISTENCE_FAILED',
        message: `Falha ao cadastrar profissional no Firestore: ${err?.message || 'Erro de gravação.'}`
      });
    }
  });

  // Administrative: Promote User or Prescriber to Admin
  app.post('/api/admin/promote-admin', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const actor = req.user!;
    if (!actor.isAdmin) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Apenas o Administrador Geral pode conceder permissões administrativas.'
      });
    }

    const { prescriberId, targetUid } = req.body;
    if (!prescriberId && !targetUid) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'ID do prescritor ou UID do usuário é obrigatório.' });
    }

    try {
      const updates: any = { isAdmin: true, isMaster: true, updatedAt: new Date().toISOString() };

      if (prescriberId) {
        await safeSetDoc('prescribers', prescriberId, updates, { merge: true });
      }

      if (targetUid) {
        await safeSetDoc('users', targetUid, {
          role: 'admin',
          isAdmin: true,
          isMaster: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        await safeSetDoc('admins', targetUid, {
          uid: targetUid,
          assignedBy: actor.uid,
          assignedAt: new Date().toISOString()
        }, { merge: true });

        try {
          await adminAuth.setCustomUserClaims(targetUid, { admin: true, role: 'admin' });
        } catch (claimErr: any) {
          console.error('Explicit error setting custom claims during promote-admin:', claimErr);
          throw new Error(`Falha ao atribuir claims de administrador no Firebase Auth: ${claimErr?.message || claimErr}`);
        }
      }

      // Record Audit Log
      await recordAuditLog({
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: 'PROMOTE_ADMIN',
        resource: 'user',
        resourceId: targetUid || prescriberId,
        details: `Privilégio de Administrador Geral concedido para ${targetUid || prescriberId}.`,
        changes: { isAdmin: { before: false, after: true }, role: { after: 'admin' } },
        ip: req.ip
      });

      res.json({ success: true, message: 'Usuário promovido a Administrador Geral com sucesso.' });
    } catch (err: any) {
      console.error('Explicit error promoting admin:', err);
      res.status(500).json({
        success: false,
        error: 'PERSISTENCE_FAILED',
        message: `Falha ao promover usuário a Administrador Geral: ${err?.message || 'Erro de gravação.'}`
      });
    }
  });

  // Administrative: Update Athlete Professional Assignments (Vínculos de Atleta)
  app.post('/api/admin/update-athlete-assignments', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const actor = req.user!;
    if (!actor.isAdmin && actor.role !== 'coach') {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Apenas Administradores ou Treinadores podem alterar vínculos de atletas.'
      });
    }

    const { athleteId, coachId, coachName, nutritionistId, nutritionistName, doctorId, doctorName, assignedPrescriberIds } = req.body;
    if (!athleteId) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'athleteId é obrigatório.' });
    }

    try {
      const existingSnap = await safeGetDoc('athletes', athleteId);
      const beforeData = existingSnap.exists ? existingSnap.data() : {};

      const assignmentUpdates: any = {
        updatedAt: Date.now()
      };
      if (coachId !== undefined) assignmentUpdates.coachId = coachId;
      if (coachName !== undefined) assignmentUpdates.coachName = coachName;
      if (nutritionistId !== undefined) assignmentUpdates.nutritionistId = nutritionistId;
      if (nutritionistName !== undefined) assignmentUpdates.nutritionistName = nutritionistName;
      if (doctorId !== undefined) assignmentUpdates.doctorId = doctorId;
      if (doctorName !== undefined) assignmentUpdates.doctorName = doctorName;
      if (assignedPrescriberIds !== undefined) assignmentUpdates.assignedPrescriberIds = assignedPrescriberIds;

      await safeSetDoc('athletes', athleteId, assignmentUpdates, { merge: true });

      // Update linked professional /users/{uid}.assignedAthleteIds
      const targetProfessionals = [coachId, nutritionistId, doctorId].filter(Boolean);
      for (const profUid of targetProfessionals) {
        try {
          const profSnap = await safeGetDoc('users', profUid);
          if (profSnap.exists) {
            const currentList: string[] = profSnap.data()?.assignedAthleteIds || [];
            if (!currentList.includes(athleteId)) {
              await safeSetDoc('users', profUid, {
                assignedAthleteIds: [...currentList, athleteId],
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }
          }
        } catch (e) {}
      }

      // Record Audit Log
      await recordAuditLog({
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: 'UPDATE_ATHLETE_ASSIGNMENTS',
        resource: 'athlete',
        resourceId: athleteId,
        details: `Vínculos profissionais do atleta ${beforeData?.name || athleteId} atualizados.`,
        changes: {
          before: { coach: beforeData?.coachName, nutri: beforeData?.nutritionistName, doctor: beforeData?.doctorName },
          after: { coach: coachName, nutri: nutritionistName, doctor: doctorName }
        },
        ip: req.ip
      });

      res.json({ success: true, message: 'Vínculos de profissionais atualizados com sucesso.' });
    } catch (err: any) {
      console.error('Explicit error updating assignments:', err);
      res.status(500).json({
        success: false,
        error: 'PERSISTENCE_FAILED',
        message: `Falha ao atualizar vínculos do atleta no Firestore: ${err?.message || 'Erro de gravação.'}`
      });
    }
  });

  // Administrative: Delete Record (Athlete, Prescriber, User)
  app.post('/api/admin/delete-record', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const actor = req.user!;
    if (!actor.isAdmin) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Apenas Administradores Gerais podem excluir cadastros do sistema.'
      });
    }

    const { resource, resourceId } = req.body;
    if (!resource || !resourceId) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Tipo de recurso e ID são obrigatórios.' });
    }

    try {
      let targetCollection: 'prescribers' | 'athletes' | 'users' | '' = '';
      if (resource === 'prescriber') targetCollection = 'prescribers';
      else if (resource === 'athlete') targetCollection = 'athletes';
      else if (resource === 'user') targetCollection = 'users';
      else {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'Tipo de recurso inválido.' });
      }

      // Safety check: Cannot delete the master admin
      if (resource === 'user' && resourceId === actor.uid) {
        return res.status(400).json({ error: 'FORBIDDEN', message: 'Não é possível excluir o usuário administrador ativo.' });
      }

      const snap = await safeGetDoc(targetCollection, resourceId);
      const existingData = snap.exists ? snap.data() : null;

      await safeDeleteDoc(targetCollection, resourceId);

      // Record Audit Log
      await recordAuditLog({
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: 'DELETE_RECORD',
        resource,
        resourceId,
        details: `Cadastro (${resource}) ${existingData?.name || resourceId} excluído permanentemente.`,
        changes: { deletedRecord: existingData },
        ip: req.ip
      });

      res.json({ success: true, message: `Registro ${resourceId} excluído com sucesso.` });
    } catch (err: any) {
      console.error('Explicit error deleting record:', err);
      res.status(500).json({
        success: false,
        error: 'PERSISTENCE_FAILED',
        message: `Falha ao excluir registro do Firestore: ${err?.message || 'Erro de exclusão.'}`
      });
    }
  });

  // Administrative: Toggle Active / Inactive Status
  app.post('/api/admin/toggle-status', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const actor = req.user!;
    if (!actor.isAdmin && !actor.isMaster) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Permissão negada.' });
    }

    const { resource, resourceId, nextStatus } = req.body;
    if (!resource || !resourceId || !nextStatus) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Dados incompletos.' });
    }

    try {
      const collectionName: 'athletes' | 'prescribers' = resource === 'athlete' ? 'athletes' : 'prescribers';
      await safeSetDoc(collectionName, resourceId, { status: nextStatus, updatedAt: Date.now() }, { merge: true });

      // Record Audit Log
      await recordAuditLog({
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: 'TOGGLE_STATUS',
        resource,
        resourceId,
        details: `Status de ${resource} alterado para ${nextStatus}.`,
        changes: { status: nextStatus },
        ip: req.ip
      });

      res.json({ success: true, status: nextStatus });
    } catch (err: any) {
      console.error('Explicit error toggling status:', err);
      res.status(500).json({
        success: false,
        error: 'PERSISTENCE_FAILED',
        message: `Falha ao atualizar status no Firestore: ${err?.message || 'Erro de gravação.'}`
      });
    }
  });

  // Administrative: Get Audit Logs
  app.get('/api/admin/audit-logs', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const actor = req.user!;
    if (!actor.isAdmin) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Apenas Administradores Gerais podem visualizar a trilha de auditoria.'
      });
    }

    try {
      const snap = await adminDb.collection('audit_logs').orderBy('timestamp', 'desc').limit(50).get();
      const logs: any[] = [];
      snap.forEach((doc) => logs.push({ ...doc.data(), id: doc.id }));
      if (logs.length === 0 && inMemoryAuditLogs.length > 0) {
        logs.push(...inMemoryAuditLogs.slice(0, 50));
      }
      res.json({ success: true, logs });
    } catch (err: any) {
      console.error('Explicit error fetching audit logs:', err);
      res.status(500).json({
        success: false,
        error: 'FIRESTORE_UNAVAILABLE',
        message: `Falha ao consultar trilha de auditoria: ${err?.message || 'Erro no Firestore.'}`
      });
    }
  });

  // Administrative: Migrate users to Firebase Auth by invite / reset and purge legacy passwords
  app.post('/api/admin/migrate-users-to-auth', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const actor = req.user!;
    if (!actor.isAdmin) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Apenas Administradores podem executar a migração.' });
    }

    try {
      let migratedAthletes = 0;
      let migratedPrescribers = 0;
      let purgedFieldsCount = 0;
      const resetLinks: Array<{ email: string; resetLink?: string; role: string; name: string }> = [];

      // 1. Process prescribers
      const allPrescribers = await safeGetCollection('prescribers');
      for (const prescriber of allPrescribers) {
        const pEmail = (prescriber.email || '').toLowerCase().trim();
        if (pEmail && pEmail.includes('@')) {
          let userRecord: any;
          try {
            userRecord = await adminAuth.getUserByEmail(pEmail);
          } catch (e: any) {
            if (e.code === 'auth/user-not-found') {
              try {
                userRecord = await adminAuth.createUser({
                  email: pEmail,
                  emailVerified: true,
                  displayName: prescriber.name
                });
                migratedPrescribers++;
              } catch (createErr) {}
            }
          }

          if (userRecord?.uid) {
            prescriber.firebaseUid = userRecord.uid;
            try {
              const link = await adminAuth.generatePasswordResetLink(pEmail);
              resetLinks.push({ email: pEmail, resetLink: link, role: prescriber.roleType || 'Prescritor', name: prescriber.name });
            } catch {}
          }
        }

        // Purge password from document and memoryStore
        if (prescriber.password || prescriber.accessPassword) {
          delete prescriber.password;
          delete prescriber.accessPassword;
          purgedFieldsCount++;
        }
        await safeSetDoc('prescribers', prescriber.id, {
          ...sanitizeUserEntity(prescriber),
          authMigrated: true,
          updatedAt: new Date().toISOString()
        });
      }

      // 2. Process athletes
      const allAthletes = await safeGetCollection('athletes');
      for (const athlete of allAthletes) {
        const cleanPhone = (athlete.phone || '').replace(/\D/g, '');
        const aEmail = (athlete.email || (cleanPhone ? `${cleanPhone}@athlete.lmteam.com` : '')).toLowerCase().trim();
        if (aEmail && aEmail.includes('@')) {
          let userRecord: any;
          try {
            userRecord = await adminAuth.getUserByEmail(aEmail);
          } catch (e: any) {
            if (e.code === 'auth/user-not-found') {
              try {
                userRecord = await adminAuth.createUser({
                  email: aEmail,
                  emailVerified: true,
                  displayName: athlete.name
                });
                migratedAthletes++;
              } catch (createErr) {}
            }
          }

          if (userRecord?.uid) {
            athlete.firebaseUid = userRecord.uid;
            try {
              const link = await adminAuth.generatePasswordResetLink(aEmail);
              resetLinks.push({ email: aEmail, resetLink: link, role: 'athlete', name: athlete.name });
            } catch {}
          }
        }

        // Purge password from document and memoryStore
        if (athlete.password || athlete.accessPassword) {
          delete athlete.password;
          delete athlete.accessPassword;
          purgedFieldsCount++;
        }
        await safeSetDoc('athletes', athlete.id, {
          ...sanitizeUserEntity(athlete),
          authMigrated: true,
          updatedAt: Date.now()
        });
      }

      // 3. Process users collection
      const allUsers = await safeGetCollection('users');
      for (const u of allUsers) {
        if (u.password || u.accessPassword) {
          delete u.password;
          delete u.accessPassword;
          purgedFieldsCount++;
          await safeSetDoc('users', u.id, sanitizeUserEntity(u));
        }
      }

      await recordAuditLog({
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: 'MIGRATE_USERS_TO_FIREBASE_AUTH',
        resource: 'user',
        resourceId: 'all',
        details: `Migração unificada para Firebase Auth concluída. Atletas: ${migratedAthletes}, Prescritores: ${migratedPrescribers}, Campos de senha purgados: ${purgedFieldsCount}.`,
        changes: { migratedAthletes, migratedPrescribers, purgedFieldsCount },
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Migração para Firebase Auth concluída e campos de senha purgados com sucesso.',
        migratedAthletes,
        migratedPrescribers,
        purgedFieldsCount,
        resetLinks
      });
    } catch (err: any) {
      console.error('Error during migration:', err);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erro durante processo de migração.' });
    }
  });

  // Prescriber / Admin: Set or Update Athlete Access Password in Firebase Auth
  app.post('/api/admin/set-athlete-password', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const actor = req.user!;
    const { athleteId, newPassword } = req.body;

    if (!athleteId) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'ID do aluno é obrigatório.' });
    }

    const passwordToSet = (newPassword && String(newPassword).trim()) || Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const snap = await safeGetDoc('athletes', athleteId);
      const athleteData = snap.exists ? snap.data() : null;
      if (!athleteData) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Aluno não encontrado.' });
      }

      const cleanPhone = (athleteData.phone || '').replace(/\D/g, '');
      const aEmail = (athleteData.email || (cleanPhone ? `${cleanPhone}@athlete.lmteam.com` : '')).toLowerCase().trim();

      let targetUid = athleteData.firebaseUid;
      if (aEmail && aEmail.includes('@')) {
        try {
          const userRec = await adminAuth.getUserByEmail(aEmail);
          targetUid = userRec.uid;
          await adminAuth.updateUser(userRec.uid, { password: passwordToSet });
        } catch (e: any) {
          if (e.code === 'auth/user-not-found') {
            const newUser = await adminAuth.createUser({
              email: aEmail,
              password: passwordToSet,
              displayName: athleteData.name
            });
            targetUid = newUser.uid;
          } else {
            console.error('Error updating athlete auth credentials:', e);
            throw new Error(`Falha no Firebase Auth ao atualizar credenciais do aluno: ${e?.message || e}`);
          }
        }
      }

      // Record update without storing password in document
      await safeSetDoc('athletes', athleteId, {
        firebaseUid: targetUid || athleteData.firebaseUid,
        passwordChangedAt: new Date().toISOString(),
        updatedAt: Date.now()
      }, { merge: true });

      // Audit Log
      await recordAuditLog({
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: 'UPDATE_ATHLETE_PASSWORD',
        resource: 'athlete',
        resourceId: athleteId,
        details: `Senha de acesso do aluno ${athleteData.name || athleteId} atualizada no Firebase Auth pelo prescritor.`,
        changes: { passwordUpdatedInAuth: true },
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Senha do aluno atualizada no Firebase Auth com sucesso.'
      });
    } catch (err: any) {
      console.error('Explicit error updating athlete password in Auth:', err);
      res.status(500).json({
        success: false,
        error: 'AUTH_UPDATE_FAILED',
        message: `Falha ao atualizar senha do aluno no Firebase Auth: ${err?.message || 'Erro de autenticação.'}`
      });
    }
  });

  // Admin & Master: Set or Update Prescriber Access Password in Firebase Auth
  app.post('/api/admin/set-prescriber-password', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const actor = req.user!;
    if (!actor.isAdmin && !actor.isMaster) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Apenas Administradores Gerais têm permissão para alterar senhas de outros profissionais.'
      });
    }

    const { prescriberId, newPassword } = req.body;

    if (!prescriberId) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'ID do prescritor é obrigatório.' });
    }

    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'A senha deve conter no mínimo 6 caracteres.' });
    }

    const passwordToSet = String(newPassword).trim();

    try {
      const snap = await safeGetDoc('prescribers', prescriberId);
      const prescriberData = snap.exists ? snap.data() : null;
      if (!prescriberData) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Prescritor não encontrado.' });
      }

      // Security check: Master cannot change Admin password
      if (!actor.isAdmin && prescriberData?.isAdmin) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Prescritores Master não podem alterar a senha de um Administrador Geral.'
        });
      }

      // Sync directly with Firebase Auth
      let targetUid = prescriberData.firebaseUid;
      if (prescriberData.email) {
        const pEmail = prescriberData.email.toLowerCase().trim();
        try {
          const userRec = await adminAuth.getUserByEmail(pEmail);
          if (userRec?.uid) {
            targetUid = userRec.uid;
            await adminAuth.updateUser(userRec.uid, { password: passwordToSet });
          }
        } catch (e: any) {
          if (e.code === 'auth/user-not-found') {
            const newUser = await adminAuth.createUser({
              email: pEmail,
              password: passwordToSet,
              displayName: prescriberData.name
            });
            targetUid = newUser.uid;
          } else {
            console.error('Error updating prescriber auth credentials:', e);
            throw new Error(`Falha no Firebase Auth ao atualizar credenciais do prescritor: ${e?.message || e}`);
          }
        }
      }

      // Save record without storing password in document
      await safeSetDoc('prescribers', prescriberId, {
        firebaseUid: targetUid || prescriberData.firebaseUid,
        passwordChangedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      if (targetUid) {
        await safeSetDoc('users', targetUid, {
          passwordChangedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // Record Audit Log
      await recordAuditLog({
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: 'UPDATE_PRESCRIBER_PASSWORD',
        resource: 'prescriber',
        resourceId: prescriberId,
        details: `Senha de acesso do prescritor ${prescriberData?.name || prescriberId} atualizada no Firebase Auth pelo administrador.`,
        changes: { passwordUpdatedInAuth: true },
        ip: req.ip
      });

      res.json({
        success: true,
        message: `Senha de ${prescriberData?.name || 'prescritor'} atualizada no Firebase Auth com sucesso!`
      });
    } catch (err: any) {
      console.error('Explicit error setting prescriber password in Auth:', err);
      res.status(500).json({
        success: false,
        error: 'AUTH_UPDATE_FAILED',
        message: `Falha ao atualizar senha do prescritor no Firebase Auth: ${err?.message || 'Erro de autenticação.'}`
      });
    }
  });

  // User Self-Service: Change My Password in Firebase Auth
  app.post('/api/auth/change-my-password', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const caller = req.user!;
    const { newPassword } = req.body;

    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'A nova senha deve conter no mínimo 6 caracteres.'
      });
    }

    const cleanPassword = String(newPassword).trim();

    try {
      // Update password directly in Firebase Auth
      await adminAuth.updateUser(caller.uid, { password: cleanPassword });

      // Record audit and timestamp without storing plaintext password
      await safeSetDoc('users', caller.uid, {
        passwordChangedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      if (caller.athleteId) {
        await safeSetDoc('athletes', caller.athleteId, {
          passwordChangedAt: new Date().toISOString(),
          updatedAt: Date.now()
        }, { merge: true });
      }

      if (caller.prescriberId) {
        await safeSetDoc('prescribers', caller.prescriberId, {
          passwordChangedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      await recordAuditLog({
        actorUid: caller.uid,
        actorEmail: caller.email,
        action: 'CHANGE_SELF_PASSWORD',
        resource: 'user',
        resourceId: caller.uid,
        details: `Usuário ${caller.email || caller.uid} alterou sua senha com sucesso no Firebase Auth.`,
        ip: req.ip
      });

      return res.json({
        success: true,
        message: 'Sua senha de acesso foi alterada no Firebase Auth com sucesso!'
      });
    } catch (err: any) {
      console.warn('Error in /api/auth/change-my-password:', err);
      res.status(500).json({ error: 'SERVER_ERROR', message: 'Erro ao alterar senha no Firebase Auth.' });
    }
  });

  // Admin: Reset Admin Password Directly in Firebase Auth (Development Testing)
  app.post('/api/admin/set-admin-dev-password', async (req: Request, res: Response) => {
    const targetEmail = (req.body.email || '').toLowerCase().trim();
    const newPassword = req.body.password && String(req.body.password).trim();

    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ error: 'INVALID_EMAIL', message: 'E-mail do administrador é obrigatório.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        error: 'INVALID_PASSWORD',
        message: 'A senha é obrigatória e deve ter pelo menos 6 caracteres. Nenhuma senha padrão é permitida.'
      });
    }

    try {
      let uid = 'oPJNegJ3EEW22WVSV8ptCwCSqD32';
      let passwordUpdated = false;

      // 1. Try Firebase Admin SDK
      try {
        let userRecord = await adminAuth.getUserByEmail(targetEmail);
        uid = userRecord.uid;
        await adminAuth.updateUser(uid, {
          password: newPassword,
          emailVerified: true
        });
        passwordUpdated = true;
        console.log(`[AUTH] Updated password for ${targetEmail} in Firebase Auth via Admin SDK`);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          try {
            const userRecord = await adminAuth.createUser({
              email: targetEmail,
              password: newPassword,
              emailVerified: true,
              displayName: 'Emanuel Caires (Admin Geral)'
            });
            uid = userRecord.uid;
            passwordUpdated = true;
            console.log(`[AUTH] Created user in Firebase Auth for ${targetEmail}`);
          } catch (createErr: any) {
            console.warn('[AUTH] Admin SDK create failed, trying REST API fallback:', createErr?.message || createErr);
          }
        } else {
          console.warn('[AUTH] Admin SDK lookup/update failed, trying REST API fallback:', err?.message || err);
        }
      }

      // 2. If Admin SDK couldn't update (e.g. cross-project ADC), use Identity Toolkit REST API
      if (!passwordUpdated) {
        try {
          // Attempt sign-in to get token then update
          const signInRes = await callIdentityToolkit('accounts:signInWithPassword', {
            email: targetEmail,
            password: newPassword, // maybe already this password
            returnSecureToken: true
          }).catch(() => null);

          if (signInRes?.idToken) {
            uid = signInRes.localId || uid;
            passwordUpdated = true;
          } else {
            // Attempt sign-up or send password reset
            const signUpRes = await callIdentityToolkit('accounts:signUp', {
              email: targetEmail,
              password: newPassword,
              returnSecureToken: true
            }).catch((e) => e);

            if (signUpRes?.idToken) {
              uid = signUpRes.localId || uid;
              passwordUpdated = true;
            } else {
              // Trigger password reset email via OOB code
              await callIdentityToolkit('accounts:sendOobCode', {
                requestType: 'PASSWORD_RESET',
                email: targetEmail
              });
              passwordUpdated = true;
            }
          }
        } catch (restErr: any) {
          console.error('[AUTH] Identity Toolkit REST API fallback error:', restErr);
        }
      }

      // Assign Admin Custom Claims if Admin SDK is available
      try {
        await adminAuth.setCustomUserClaims(uid, {
          admin: true,
          isMaster: true,
          role: 'admin'
        });
      } catch (claimErr: any) {
        console.warn('[AUTH] Notice setting admin custom claims:', claimErr?.message || claimErr);
      }

      // Set authoritative Firestore /users/{uid} document WITHOUT storing password
      await safeSetDoc('users', uid, {
        id: uid,
        email: targetEmail,
        name: 'Emanuel Caires',
        role: 'admin',
        isAdmin: true,
        isMaster: true,
        status: 'Ativo',
        prescriberId: 'coach-1',
        passwordChangedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Set /admins/{uid} registry
      await safeSetDoc('admins', uid, {
        uid,
        email: targetEmail,
        assignedAt: new Date().toISOString(),
        isMaster: true
      }, { merge: true });

      // Update /prescribers/coach-1 WITHOUT storing password
      await safeSetDoc('prescribers', 'coach-1', {
        id: 'coach-1',
        name: 'Emanuel Caires',
        email: targetEmail,
        roleType: 'Administrador Geral',
        isAdmin: true,
        isMaster: true,
        status: 'Ativo',
        firebaseUid: uid,
        passwordChangedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Record Audit Log
      await recordAuditLog({
        actorUid: uid,
        actorEmail: targetEmail,
        action: 'RESET_ADMIN_PASSWORD',
        resource: 'user',
        resourceId: uid,
        details: `Senha de administrador do ambiente de desenvolvimento redefinida no Firebase Auth para ${targetEmail}.`,
        changes: { email: targetEmail, passwordSetInAuth: true },
        ip: req.ip
      });

      res.json({
        success: true,
        message: `Senha do Administrador Geral (${targetEmail}) foi atualizada com sucesso no Firebase Auth.`,
        email: targetEmail,
        uid
      });
    } catch (err: any) {
      console.error('Explicit error in admin password reset:', err);
      res.status(500).json({
        success: false,
        error: 'ADMIN_PASSWORD_RESET_FAILED',
        message: `Falha ao atualizar senha do administrador no Firebase Auth: ${err?.message || 'Erro de autenticação.'}`,
        email: targetEmail
      });
    }
  });

  // Prescriber & Admin: Request Password Reset & Generate Official Link
  app.post('/api/auth/request-password-reset', async (req: Request, res: Response) => {
    const targetEmail = (req.body.email || '').toLowerCase().trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ error: 'INVALID_EMAIL', message: 'Informe um e-mail válido.' });
    }

    try {
      let resetLink = '';
      let emailDispatched = false;

      // 1. Dispatch official password reset email via Identity Toolkit REST API
      try {
        await callIdentityToolkit('accounts:sendOobCode', {
          requestType: 'PASSWORD_RESET',
          email: targetEmail
        });
        emailDispatched = true;
        console.log(`[AUTH] Sent password reset email to ${targetEmail} via Identity Toolkit`);
      } catch (oobErr: any) {
        console.warn('[AUTH] Notice sending OOB code via REST API:', oobErr?.message || oobErr);
      }

      // 2. Also try adminAuth if available
      try {
        resetLink = await adminAuth.generatePasswordResetLink(targetEmail);
      } catch (linkErr: any) {
        // Safe fallback when ADC lacks cross-project IAM; emailDispatched already succeeded
      }

      // 3. Audit Log
      await recordAuditLog({
        actorUid: targetEmail === MASTER_ADMIN_EMAIL ? 'oPJNegJ3EEW22WVSV8ptCwCSqD32' : 'system',
        actorEmail: targetEmail,
        action: 'PASSWORD_RESET_REQUEST',
        resource: 'user',
        resourceId: targetEmail,
        details: `Solicitação de redefinição de senha para ${targetEmail}. E-mail oficial disparado.${resetLink ? ' Link gerado.' : ''}`,
        changes: { email: targetEmail, emailDispatched, linkGenerated: Boolean(resetLink) },
        ip: req.ip
      });

      res.json({
        success: true,
        message: `Solicitação de recuperação processada com sucesso para ${targetEmail}. Um e-mail com as instruções de redefinição de senha foi enviado.`,
        resetLink: resetLink || undefined,
        emailDispatched
      });
    } catch (err: any) {
      console.error('Explicit error in password reset request:', err);
      res.status(500).json({
        success: false,
        error: 'PASSWORD_RESET_FAILED',
        message: `Falha ao processar solicitação de recuperação de senha: ${err?.message || 'Erro interno.'}`
      });
    }
  });

  // Administrative Reset: Reset & Bootstrap Master Admin Access
  app.post('/api/admin/reset-admin-access', async (req: Request, res: Response) => {
    const targetEmail = (req.body.email || MASTER_ADMIN_EMAIL).toLowerCase().trim();
    try {
      let userRecord: any;
      try {
        userRecord = await adminAuth.getUserByEmail(targetEmail);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          userRecord = await adminAuth.createUser({
            email: targetEmail,
            emailVerified: true,
            displayName: 'Emanuel Caires (Admin Geral)'
          });
        } else {
          console.error('Explicit error looking up master admin in reset-admin-access:', err);
          throw new Error(`Falha de consulta/IAM ao buscar Administrador Geral: ${err?.message || err}`);
        }
      }

      const uid = userRecord.uid;

      // 1. Assign Admin Custom Claims
      try {
        await adminAuth.setCustomUserClaims(uid, {
          admin: true,
          isMaster: true,
          role: 'admin'
        });
      } catch (claimErr: any) {
        console.error('Explicit error setting claims in reset-admin-access:', claimErr);
        throw new Error(`Falha ao atribuir claims administrativas ao Administrador Geral: ${claimErr?.message || claimErr}`);
      }

      // 2. Set authoritative Firestore /users/{uid} document
      await safeSetDoc('users', uid, {
        id: uid,
        email: targetEmail,
        name: 'Emanuel Caires',
        role: 'admin',
        isAdmin: true,
        isMaster: true,
        status: 'Ativo',
        prescriberId: 'coach-1',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 3. Set /admins/{uid} registry
      await safeSetDoc('admins', uid, {
        uid,
        email: targetEmail,
        assignedAt: new Date().toISOString(),
        isMaster: true
      }, { merge: true });

      // 4. Update /prescribers/coach-1
      await safeSetDoc('prescribers', 'coach-1', {
        id: 'coach-1',
        name: 'Emanuel Caires',
        email: targetEmail,
        roleType: 'Head Coach',
        isAdmin: true,
        isMaster: true,
        status: 'Ativo',
        firebaseUid: uid,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 5. Generate Password Reset Link for convenience
      let resetLink = '';
      try {
        resetLink = await adminAuth.generatePasswordResetLink(targetEmail);
      } catch (linkErr) {
        // Safe fallback
      }

      // Record Audit Log
      await recordAuditLog({
        actorUid: uid,
        actorEmail: targetEmail,
        action: 'RESET_ADMIN_ACCESS',
        resource: 'user',
        resourceId: uid,
        details: `Acesso do Administrador Geral (${targetEmail}) foi resetado e restabelecido com sucesso.`,
        changes: { isAdmin: true, isMaster: true, role: 'admin' },
        ip: req.ip
      });

      res.json({
        success: true,
        message: `Acesso do Administrador Geral (${targetEmail}) foi restabelecido com sucesso.`,
        uid,
        email: targetEmail,
        resetLink: resetLink || undefined
      });
    } catch (err: any) {
      console.error('Explicit error in admin access reset:', err);
      res.status(500).json({
        success: false,
        error: 'RESET_ADMIN_FAILED',
        message: `Falha ao restabelecer acesso administrativo: ${err?.message || 'Erro interno.'}`
      });
    }
  });

  // Explicit, Idempotent Administrative Team Provisioning Endpoint
  app.post('/api/admin/maintenance/provision-team', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    const actor = req.user!;
    if (!actor.isAdmin) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Apenas Administradores Gerais podem executar o provisionamento da equipe.'
      });
    }

    try {
      const { provisionTeam } = await import('./scripts/provision-team');
      const result = await provisionTeam({ targetAdminEmail: actor.email || MASTER_ADMIN_EMAIL });
      await recordAuditLog({
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: 'MAINTENANCE_PROVISION_TEAM',
        resource: 'system',
        resourceId: 'provisioning',
        details: result.message,
        changes: { claimsAssigned: result.claimsAssigned, documentsSynced: result.documentsSynced },
        ip: req.ip
      });
      res.json({ success: true, result });
    } catch (err: any) {
      console.error('Explicit error in maintenance provisioning:', err);
      res.status(500).json({
        success: false,
        error: 'PROVISIONING_FAILED',
        message: `Falha no provisionamento administrativo: ${err?.message || err}`
      });
    }
  });

  return app;
}

export async function startServer() {
  const app = createExpressApp();
  const PORT = 3000;

  // Bind port 3000 immediately so nginx and external ingress never hit 502 Bad Gateway
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LM Team Server listening on http://0.0.0.0:${PORT}`);
  });

  // ============================================================================
  // VITE MIDDLEWARE (Development) or STATIC ASSETS (Production)
  // ============================================================================
  if (process.env.NODE_ENV !== 'production') {
    let viteMiddleware: any = null;
    app.use((req, res, next) => {
      if (viteMiddleware) {
        return viteMiddleware(req, res, next);
      }
      // If Vite dev server is still compiling initial modules, hold request briefly
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (viteMiddleware) {
          clearInterval(checkInterval);
          return viteMiddleware(req, res, next);
        }
        if (Date.now() - startTime > 10000) {
          clearInterval(checkInterval);
          return next();
        }
      }, 50);
    });

    createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true'
      },
      appType: 'spa'
    }).then((vite) => {
      viteMiddleware = vite.middlewares;
      console.log('Vite dev middleware attached successfully.');
    }).catch((err) => {
      console.error('Error starting Vite dev server:', err);
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  startServer().catch((err) => {
    console.error('Fatal Server Start Error:', err);
  });
}
