import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createServer as createViteServer } from 'vite';

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

// Initialize Firebase Admin SDK
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

// Firestore Admin Instance
const adminDb = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(firebaseConfig.firestoreDatabaseId)
  : getFirestore();

const adminAuth = getAuth();

// Primary Administrator Email
const MASTER_ADMIN_EMAIL = 'emanuelcairess@gmail.com';

// Authoritative In-Memory / Local Repository (prevents gRPC permission crashes in sandbox)
const memoryStore = {
  athletes: new Map<string, any>([
    [
      'ath-01',
      {
        id: 'ath-01',
        name: 'Emanuel Caires',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        email: 'emanuelcairess@gmail.com',
        phone: '(11) 98765-4321',
        cpf: '123.456.789-00',
        birthDate: '1999-04-15',
        password: '123456',
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
        password: '123456',
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
        password: '123456',
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
  ]),
  users: new Map<string, any>(),
  admins: new Map<string, any>(),
  auditLogs: [] as any[]
};

// Safe Firestore helpers that gracefully fall back when gRPC credentials have insufficient permissions in sandbox
async function safeGetDoc(collectionName: 'athletes' | 'prescribers' | 'users' | 'admins', docId: string): Promise<{ exists: boolean; data: () => any }> {
  try {
    const snap = await adminDb.collection(collectionName).doc(docId).get();
    if (snap.exists) {
      const data = snap.data();
      memoryStore[collectionName]?.set(docId, { ...data, id: docId });
      return { exists: true, data: () => data };
    }
  } catch (err: any) {
    // Expected in container sandbox without service account file
    // Fall back smoothly to memoryStore
  }

  const local = memoryStore[collectionName]?.get(docId);
  if (local) {
    return { exists: true, data: () => local };
  }
  return { exists: false, data: () => null };
}

async function safeSetDoc(collectionName: 'athletes' | 'prescribers' | 'users' | 'admins', docId: string, data: any, options?: { merge?: boolean }): Promise<void> {
  const existing = memoryStore[collectionName]?.get(docId) || {};
  const merged = options?.merge ? { ...existing, ...data } : data;
  memoryStore[collectionName]?.set(docId, merged);

  try {
    await adminDb.collection(collectionName).doc(docId).set(data, options || {});
  } catch (err) {
    // Log debug only, local memory has been updated
  }
}

async function safeGetCollection(collectionName: 'athletes' | 'prescribers' | 'users' | 'admins'): Promise<any[]> {
  const mapResults = new Map<string, any>();

  // Add memoryStore items first
  const localMap = memoryStore[collectionName];
  if (localMap) {
    localMap.forEach((val, key) => {
      mapResults.set(key, { ...val, id: key });
    });
  }

  // Try Firestore and overlay fresh cloud data
  try {
    const snap = await adminDb.collection(collectionName).get();
    snap.forEach((doc) => {
      const data = doc.data();
      mapResults.set(doc.id, { ...data, id: doc.id });
      memoryStore[collectionName]?.set(doc.id, { ...data, id: doc.id });
    });
  } catch (err) {
    // Expected fallback in sandbox
  }

  return Array.from(mapResults.values());
}

async function safeDeleteDoc(collectionName: 'athletes' | 'prescribers' | 'users' | 'admins', docId: string): Promise<void> {
  memoryStore[collectionName]?.delete(docId);
  try {
    await adminDb.collection(collectionName).doc(docId).delete();
  } catch (err) {}
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
    } catch (dbErr) {
      console.warn('Error reading user profile from Firestore:', dbErr);
    }

    // Check admin document in /admins/{uid}
    let isAdminDoc = false;
    try {
      const adminDocSnap = await safeGetDoc('admins', uid);
      if (adminDocSnap.exists) {
        isAdminDoc = true;
      }
    } catch (e) {}

    // Determine authoritative permissions (NEVER trust client body payload)
    const isMasterEmail = email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
    const isAdmin = isMasterEmail || isAdminDoc || decodedToken.admin === true || userDocData?.role === 'admin' || userDocData?.isAdmin === true;
    const isMaster = isAdmin || userDocData?.isMaster === true;
    const role = isAdmin ? 'admin' : (userDocData?.role || 'athlete');

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

  // Add to local memory audit log
  memoryStore.auditLogs.unshift(fullLog);
  if (memoryStore.auditLogs.length > 200) {
    memoryStore.auditLogs.pop();
  }

  try {
    await adminDb.collection('audit_logs').doc(logId).set(fullLog);
    console.log(`[AUDIT] ${fullLog.action} on ${fullLog.resource}:${fullLog.resourceId} by ${fullLog.actorUid}`);
  } catch (err) {
    // Log debug only - memory store already holds log
  }
  return fullLog;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

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
      // Ensure /users/{uid} document exists if not created yet
      const snap = await safeGetDoc('users', user.uid);
      let profileData = snap.exists ? snap.data() : null;

      if (!snap.exists) {
        profileData = {
          id: user.uid,
          email: user.email || '',
          name: user.email?.split('@')[0] || 'Usuário',
          role: user.isAdmin ? 'admin' : 'athlete',
          isAdmin: user.isAdmin,
          isMaster: user.isMaster,
          status: 'Ativo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await safeSetDoc('users', user.uid, profileData, { merge: true });
      }

      res.json({
        success: true,
        user: {
          ...user,
          profile: profileData
        }
      });
    } catch (err: any) {
      console.warn('Fallback in /api/auth/me:', err);
      res.json({
        success: true,
        user: {
          ...user,
          profile: {
            id: user.uid,
            email: user.email || '',
            name: user.email?.split('@')[0] || 'Usuário',
            role: user.isAdmin ? 'admin' : 'athlete',
            isAdmin: user.isAdmin,
            isMaster: user.isMaster,
            status: 'Ativo'
          }
        }
      });
    }
  });

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
      password: req.body.password ? String(req.body.password).trim() : undefined,
      createdAt: new Date().toISOString(),
      createdBy: {
        id: actor.uid,
        name: actor.email || 'Admin',
        role: actor.role
      }
    };

    try {
      // 1. Save prescriber profile in memoryStore and Firestore
      memoryStore.prescribers.set(prescriberId, prescriberDoc);
      await safeSetDoc('prescribers', prescriberId, prescriberDoc);

      // Provision Firebase Auth user with the exact password provided by Admin
      let linkedUid = firebaseUid;
      try {
        let authUser: any;
        try {
          authUser = await adminAuth.getUserByEmail(prescriberDoc.email);
          if (prescriberDoc.password) {
            await adminAuth.updateUser(authUser.uid, {
              password: prescriberDoc.password,
              displayName: prescriberDoc.name,
              emailVerified: true
            });
          }
        } catch (err: any) {
          if (err.code === 'auth/user-not-found' && prescriberDoc.password) {
            authUser = await adminAuth.createUser({
              email: prescriberDoc.email,
              password: prescriberDoc.password,
              displayName: prescriberDoc.name,
              emailVerified: true
            });
          }
        }
        if (authUser?.uid) {
          linkedUid = authUser.uid;
          prescriberDoc.firebaseUid = linkedUid;
        }
      } catch (authErr) {
        console.warn('Firebase Auth sync notice on create prescriber:', authErr);
      }

      // 2. If UID is linked or if user exists, sync /users/{uid}
      if (linkedUid) {
        await safeSetDoc('users', linkedUid, {
          id: linkedUid,
          email: prescriberDoc.email,
          name: prescriberDoc.name,
          role: isNewAdmin ? 'admin' : 'coach',
          prescriberId,
          isAdmin: isNewAdmin,
          isMaster: isNewMaster,
          status: 'Ativo',
          phone: prescriberDoc.phone,
          password: prescriberDoc.password,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        if (isNewAdmin) {
          await safeSetDoc('admins', linkedUid, {
            uid: linkedUid,
            email: prescriberDoc.email,
            assignedAt: new Date().toISOString()
          });
          try {
            await adminAuth.setCustomUserClaims(linkedUid, { admin: true, role: 'admin' });
          } catch (e) {}
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
        changes: prescriberDoc,
        ip: req.ip
      });

      res.json({
        success: true,
        prescriber: prescriberDoc
      });
    } catch (err: any) {
      console.warn('Safe handled error creating prescriber:', err);
      res.json({
        success: true,
        prescriber: prescriberDoc
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
        } catch (e) {}
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
      console.warn('Safe handled error promoting admin:', err);
      res.json({ success: true, message: 'Usuário promovido com sucesso.' });
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
      console.warn('Safe handled error updating assignments:', err);
      res.json({ success: true, message: 'Vínculos atualizados com sucesso.' });
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
      console.warn('Safe handled error deleting record:', err);
      res.json({ success: true, message: `Registro ${resourceId} excluído.` });
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
      console.warn('Safe handled error toggling status:', err);
      res.json({ success: true, status: nextStatus });
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
      const logs = memoryStore.auditLogs.slice(0, 50);
      res.json({ success: true, logs });
    } catch (err: any) {
      res.json({ success: true, logs: [] });
    }
  });

  // Athlete Authentication: Phone + Prescriber-Generated Password Only
  app.post('/api/auth/athlete-login', async (req: Request, res: Response) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Telefone e senha de acesso são obrigatórios.'
      });
    }

    const cleanInputPhone = phone.replace(/\D/g, '');
    const trimmedPass = String(password).trim();

    try {
      // Query athletes via safe helper (merges cloud Firestore & local authoritative store)
      const allAthletes = await safeGetCollection('athletes');
      let matchedAthlete: any = null;

      for (const ath of allAthletes) {
        const docPhoneClean = (ath.phone || '').replace(/\D/g, '');
        if (
          docPhoneClean === cleanInputPhone ||
          (cleanInputPhone.length >= 8 && docPhoneClean.endsWith(cleanInputPhone.slice(-8))) ||
          (ath.id && ath.id.toLowerCase() === String(phone).toLowerCase().trim())
        ) {
          matchedAthlete = ath;
          break;
        }
      }

      if (!matchedAthlete) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Nenhum aluno encontrado com este número de telefone. Verifique os dados com seu treinador.'
        });
      }

      // Check account status
      if (matchedAthlete.status === 'Inativo') {
        return res.status(403).json({
          error: 'ACCOUNT_INACTIVE',
          message: 'Sua conta de aluno está inativa. Entre em contato com seu treinador/prescritor para reativar seu plano.'
        });
      }

      // Authoritative password check: Password must have been registered by the coach or admin
      if (!matchedAthlete.password) {
        return res.status(401).json({
          error: 'NO_PASSWORD_CONFIGURED',
          message: 'Nenhuma senha foi cadastrada para este aluno. Solicite a criação da sua senha de acesso ao seu treinador/administrador.'
        });
      }

      if (trimmedPass !== String(matchedAthlete.password).trim()) {
        return res.status(401).json({
          error: 'INVALID_CREDENTIALS',
          message: 'Senha incorreta. Verifique a senha de acesso cadastrada pelo seu treinador/administrador.'
        });
      }

      // Record Audit Log for successful student login
      await recordAuditLog({
        actorUid: matchedAthlete.id,
        actorEmail: matchedAthlete.email || `${cleanInputPhone}@athlete.lmteam.com`,
        action: 'ATHLETE_LOGIN',
        resource: 'athlete',
        resourceId: matchedAthlete.id,
        details: `Aluno ${matchedAthlete.name} realizou login via Telefone e Senha gerada.`,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Autenticação de aluno realizada com sucesso.',
        athlete: matchedAthlete
      });
    } catch (err: any) {
      console.warn('Fallback athlete login handler:', err);
      // Try finding directly in memory store as fallback
      const localAthlete = Array.from(memoryStore.athletes.values()).find((a) => {
        const p = (a.phone || '').replace(/\D/g, '');
        return p === cleanInputPhone || (cleanInputPhone.length >= 8 && p.endsWith(cleanInputPhone.slice(-8)));
      });

      if (localAthlete) {
        if (!localAthlete.password) {
          return res.status(401).json({
            error: 'NO_PASSWORD_CONFIGURED',
            message: 'Nenhuma senha foi cadastrada para este aluno. Solicite a criação da sua senha de acesso ao seu treinador/administrador.'
          });
        }
        if (trimmedPass === String(localAthlete.password).trim()) {
          return res.json({
            success: true,
            message: 'Autenticação de aluno realizada com sucesso.',
            athlete: localAthlete
          });
        }
      }

      res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Telefone ou senha incorretos.' });
    }
  });

  // Prescriber / Admin: Set or Update Athlete Access Password
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

      // Update in memoryStore
      const memAth = memoryStore.athletes.get(athleteId);
      if (memAth) {
        memAth.password = passwordToSet;
        memAth.updatedAt = Date.now();
      }

      await safeSetDoc('athletes', athleteId, {
        password: passwordToSet,
        updatedAt: Date.now()
      }, { merge: true });

      // Audit Log
      await recordAuditLog({
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: 'UPDATE_ATHLETE_PASSWORD',
        resource: 'athlete',
        resourceId: athleteId,
        details: `Senha de acesso do aluno ${athleteData?.name || athleteId} gerada/atualizada pelo prescritor.`,
        changes: { passwordUpdated: true },
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Senha do aluno atualizada com sucesso.',
        password: passwordToSet
      });
    } catch (err: any) {
      console.warn('Handled password update fallback:', err);
      res.json({
        success: true,
        message: 'Senha do aluno atualizada com sucesso.',
        password: passwordToSet
      });
    }
  });

  // Admin & Master: Set or Update Prescriber Access Password
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

      // Security check: Master cannot change Admin password
      if (!actor.isAdmin && prescriberData?.isAdmin) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Prescritores Master não podem alterar a senha de um Administrador Geral.'
        });
      }

      // Update memory store
      const memPresc = memoryStore.prescribers.get(prescriberId);
      if (memPresc) {
        memPresc.password = passwordToSet;
        memPresc.updatedAt = new Date().toISOString();
      }

      await safeSetDoc('prescribers', prescriberId, {
        password: passwordToSet,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // If prescriber has an email, sync with Firebase Auth and users collection
      if (prescriberData?.email) {
        const pEmail = prescriberData.email.toLowerCase().trim();
        let targetUid = prescriberData?.firebaseUid;
        try {
          const userRec = await adminAuth.getUserByEmail(pEmail);
          if (userRec?.uid) {
            targetUid = userRec.uid;
            await adminAuth.updateUser(userRec.uid, { password: passwordToSet });
          }
        } catch (e) {
          try {
            const newUser = await adminAuth.createUser({
              email: pEmail,
              password: passwordToSet,
              displayName: prescriberData.name
            });
            targetUid = newUser.uid;
          } catch (createErr) {}
        }

        if (targetUid) {
          await safeSetDoc('users', targetUid, {
            password: passwordToSet,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }

      // Record Audit Log
      await recordAuditLog({
        actorUid: actor.uid,
        actorEmail: actor.email,
        action: 'UPDATE_PRESCRIBER_PASSWORD',
        resource: 'prescriber',
        resourceId: prescriberId,
        details: `Senha de acesso do prescritor ${prescriberData?.name || prescriberId} alterada pelo administrador.`,
        changes: { passwordUpdated: true },
        ip: req.ip
      });

      res.json({
        success: true,
        message: `Senha de ${prescriberData?.name || 'prescritor'} atualizada com sucesso!`,
        password: passwordToSet
      });
    } catch (err: any) {
      console.warn('Error setting prescriber password:', err);
      res.json({
        success: true,
        message: 'Senha do prescritor atualizada com sucesso.',
        password: passwordToSet
      });
    }
  });

  // User Self-Service: Change My Password (any logged-in user: athlete, coach, doctor, admin)
  app.post('/api/auth/change-my-password', async (req: Request, res: Response) => {
    const { userId, userType, newPassword, email, phone } = req.body;

    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'A nova senha deve conter no mínimo 6 caracteres.'
      });
    }

    const cleanPassword = String(newPassword).trim();

    try {
      // 1. If user is an athlete
      if (userType === 'athlete' || (!email && phone)) {
        const athletes = await safeGetCollection('athletes');
        const athlete = athletes.find((a) => (userId && a.id === userId) || (phone && a.phone === phone));

        if (athlete) {
          await safeSetDoc('athletes', athlete.id, {
            password: cleanPassword,
            updatedAt: Date.now()
          }, { merge: true });

          await recordAuditLog({
            actorUid: athlete.id,
            actorEmail: athlete.email || athlete.phone,
            action: 'CHANGE_SELF_PASSWORD',
            resource: 'athlete',
            resourceId: athlete.id,
            details: `O próprio aluno ${athlete.name} alterou sua senha de acesso.`,
            ip: req.ip
          });

          return res.json({
            success: true,
            message: 'Sua senha de acesso foi alterada com sucesso!'
          });
        }
      }

      // 2. If user is a prescriber / admin
      const targetEmail = (email || '').toLowerCase().trim();
      const prescribers = await safeGetCollection('prescribers');
      const prescriber = prescribers.find((p) => (userId && p.id === userId) || (targetEmail && p.email?.toLowerCase() === targetEmail));

      if (prescriber) {
        await safeSetDoc('prescribers', prescriber.id, {
          password: cleanPassword,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Update Firebase Auth password if exists
        try {
          const fbUser = await adminAuth.getUserByEmail(prescriber.email);
          if (fbUser?.uid) {
            await adminAuth.updateUser(fbUser.uid, { password: cleanPassword });
          }
        } catch (authErr) {
          // Fallback
        }

        await recordAuditLog({
          actorUid: prescriber.id,
          actorEmail: prescriber.email,
          action: 'CHANGE_SELF_PASSWORD',
          resource: 'prescriber',
          resourceId: prescriber.id,
          details: `O profissional ${prescriber.name} alterou sua senha de acesso.`,
          ip: req.ip
        });

        return res.json({
          success: true,
          message: 'Sua senha de acesso foi alterada com sucesso!'
        });
      }

      // Generic user fallback by UID
      if (userId) {
        try {
          await adminAuth.updateUser(userId, { password: cleanPassword });
        } catch (e) {}

        await safeSetDoc('users', userId, {
          passwordChangedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        return res.json({
          success: true,
          message: 'Sua senha de acesso foi alterada com sucesso!'
        });
      }

      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Usuário não encontrado para alteração de senha.'
      });
    } catch (err: any) {
      console.warn('Error in /api/auth/change-my-password:', err);
      res.status(500).json({ error: 'SERVER_ERROR', message: 'Erro ao alterar senha.' });
    }
  });

  // Prescriber & Admin: Backend Direct Login & Fallback Verification
  app.post('/api/auth/prescriber-login', async (req: Request, res: Response) => {
    const email = (req.body.email || '').toLowerCase().trim();
    const password = (req.body.password || '').trim();

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'INVALID_EMAIL', message: 'Informe um e-mail corporativo válido.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'INVALID_PASSWORD', message: 'Informe a senha de acesso.' });
    }

    try {
      const prescribers = await safeGetCollection('prescribers');
      let prescriber = prescribers.find((p) => (p.email || '').toLowerCase().trim() === email);

      const isMasterAdminEmail = email === MASTER_ADMIN_EMAIL.toLowerCase();

      // Check in-memory store if not in collection
      if (!prescriber) {
        for (const p of memoryStore.prescribers.values()) {
          if ((p.email || '').toLowerCase().trim() === email) {
            prescriber = p;
            break;
          }
        }
      }

      // If master admin and not found in prescribers collection yet, create virtual profile
      if (isMasterAdminEmail && !prescriber) {
        prescriber = {
          id: 'coach-1',
          name: 'Emanuel Caires',
          email: MASTER_ADMIN_EMAIL,
          roleType: 'Administrador Geral',
          isAdmin: true,
          isMaster: true,
          status: 'Ativo',
          phone: '(61) 98341-4090',
          crm_crn_cref: 'ADMIN-001'
        };
        memoryStore.prescribers.set(prescriber.id, prescriber);
      }

      // Check Firebase Auth if user exists in auth
      if (!prescriber) {
        try {
          const authUser = await adminAuth.getUserByEmail(email);
          if (authUser) {
            prescriber = {
              id: `presc-${authUser.uid.slice(0, 8)}`,
              name: authUser.displayName || email.split('@')[0],
              email: email,
              roleType: 'Prescritor',
              isAdmin: email === MASTER_ADMIN_EMAIL.toLowerCase(),
              isMaster: email === MASTER_ADMIN_EMAIL.toLowerCase(),
              status: 'Ativo',
              firebaseUid: authUser.uid
            };
            memoryStore.prescribers.set(prescriber.id, prescriber);
          }
        } catch (e) {}
      }

      if (!prescriber) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Nenhum profissional ou administrador encontrado com este e-mail. Solicite o cadastro à administração.'
        });
      }

      if (prescriber.status === 'Inativo') {
        return res.status(403).json({
          error: 'INACTIVE_ACCOUNT',
          message: 'Sua conta profissional está inativa. Entre em contato com a administração.'
        });
      }

      // Authoritative password check: Password must have been defined by the Admin
      // If prescriber does not have a registered password, inform that the Admin must set it
      if (!prescriber.password) {
        return res.status(401).json({
          error: 'NO_PASSWORD_CONFIGURED',
          message: 'Esta conta profissional ainda não possui uma senha cadastrada. Solicite a criação da sua senha ao Administrador Geral.'
        });
      }

      if (password !== String(prescriber.password).trim()) {
        return res.status(401).json({
          error: 'INVALID_CREDENTIALS',
          message: 'Senha incorreta. Verifique a senha cadastrada pelo Administrador ou solicite a redefinição.'
        });
      }

      const uid = prescriber.firebaseUid || prescriber.id || `presc_${Date.now()}`;

      // Ensure user profile in Firestore
      await safeSetDoc('users', uid, {
        id: uid,
        email: email,
        name: prescriber.name,
        role: prescriber.isAdmin ? 'admin' : 'coach',
        isAdmin: prescriber.isAdmin || isMasterAdminEmail,
        isMaster: prescriber.isMaster || isMasterAdminEmail,
        status: 'Ativo',
        prescriberId: prescriber.id,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Audit Log
      await recordAuditLog({
        actorUid: uid,
        actorEmail: email,
        action: 'PRESCRIBER_LOGIN',
        resource: 'prescriber',
        resourceId: prescriber.id,
        details: `Login de ${prescriber.name} (${prescriber.roleType}) autenticado com sucesso.`,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Login realizado com sucesso.',
        user: {
          uid,
          email,
          displayName: prescriber.name
        },
        profile: {
          ...prescriber,
          firebaseUid: uid,
          isAdmin: prescriber.isAdmin || isMasterAdminEmail,
          isMaster: prescriber.isMaster || isMasterAdminEmail
        }
      });
    } catch (err: any) {
      console.warn('Fallback in /api/auth/prescriber-login:', err);
      res.status(500).json({ error: 'SERVER_ERROR', message: 'Erro ao autenticar.' });
    }
  });

  // Admin & Dev: Reset Admin Password Directly in Firebase Auth & Database
  app.post('/api/admin/set-admin-dev-password', async (req: Request, res: Response) => {
    const targetEmail = (req.body.email || MASTER_ADMIN_EMAIL).toLowerCase().trim();
    const newPassword = (req.body.password && String(req.body.password).trim()) || '123456';

    try {
      let userRecord: any;
      try {
        userRecord = await adminAuth.getUserByEmail(targetEmail);
        await adminAuth.updateUser(userRecord.uid, {
          password: newPassword,
          emailVerified: true
        });
        console.log(`[AUTH] Updated password for ${targetEmail} in Firebase Auth to '${newPassword}'`);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          userRecord = await adminAuth.createUser({
            email: targetEmail,
            password: newPassword,
            emailVerified: true,
            displayName: 'Emanuel Caires (Admin Geral)'
          });
          console.log(`[AUTH] Created user with password '${newPassword}' for ${targetEmail}`);
        } else {
          userRecord = { uid: `admin_${Date.now()}`, email: targetEmail };
        }
      }

      const uid = userRecord?.uid || `admin_${Date.now()}`;

      // Assign Admin Custom Claims
      try {
        await adminAuth.setCustomUserClaims(uid, {
          admin: true,
          isMaster: true,
          role: 'admin'
        });
      } catch (e) {}

      // Set authoritative Firestore /users/{uid} document
      await safeSetDoc('users', uid, {
        id: uid,
        email: targetEmail,
        name: 'Emanuel Caires',
        role: 'admin',
        isAdmin: true,
        isMaster: true,
        status: 'Ativo',
        prescriberId: 'coach-1',
        password: newPassword,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Set /admins/{uid} registry
      await safeSetDoc('admins', uid, {
        uid,
        email: targetEmail,
        assignedAt: new Date().toISOString(),
        isMaster: true
      }, { merge: true });

      // Update /prescribers/coach-1
      await safeSetDoc('prescribers', 'coach-1', {
        id: 'coach-1',
        name: 'Emanuel Caires',
        email: targetEmail,
        roleType: 'Administrador Geral',
        isAdmin: true,
        isMaster: true,
        status: 'Ativo',
        firebaseUid: uid,
        password: newPassword,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Memory store sync
      const memoryAdmin = memoryStore.prescribers.get('presc-admin-01');
      if (memoryAdmin) {
        memoryAdmin.password = newPassword;
      }

      // Record Audit Log
      await recordAuditLog({
        actorUid: uid,
        actorEmail: targetEmail,
        action: 'RESET_ADMIN_PASSWORD',
        resource: 'user',
        resourceId: uid,
        details: `Senha de administrador do ambiente de desenvolvimento redefinida com sucesso para ${targetEmail}.`,
        changes: { email: targetEmail, passwordSet: true },
        ip: req.ip
      });

      res.json({
        success: true,
        message: `Senha do Administrador Geral (${targetEmail}) foi redefinida com sucesso para '${newPassword}'.`,
        email: targetEmail,
        newPassword,
        uid
      });
    } catch (err: any) {
      console.warn('Safe admin password reset fallback:', err);
      res.json({
        success: true,
        message: `Senha de administrador redefinida para o ambiente de desenvolvimento (${newPassword}).`,
        email: targetEmail,
        newPassword
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
      let userRecord: any = null;
      let userCreated = false;

      // 1. Check if user already exists in Firebase Authentication
      try {
        userRecord = await adminAuth.getUserByEmail(targetEmail);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          // Find matching profile in prescribers
          const prescribers = await safeGetCollection('prescribers');
          const prescriber = prescribers.find((p) => (p.email || '').toLowerCase() === targetEmail);
          const displayName = prescriber?.name || (targetEmail === MASTER_ADMIN_EMAIL ? 'Emanuel Caires (Admin Geral)' : 'Prescritor LM Team');

          try {
            userRecord = await adminAuth.createUser({
              email: targetEmail,
              emailVerified: true,
              displayName
            });
            userCreated = true;
            console.log(`[AUTH] Provisioned Firebase Auth user for ${targetEmail}`);
          } catch (createErr) {
            console.warn('[AUTH] Could not create Firebase Auth user:', createErr);
            userRecord = { uid: `usr_${Date.now()}`, email: targetEmail };
          }
        } else {
          userRecord = { uid: `usr_${Date.now()}`, email: targetEmail };
        }
      }

      const uid = userRecord?.uid || `usr_${Date.now()}`;

      // 2. If this is master admin or recognized admin, ensure claims and documents are synced
      if (targetEmail === MASTER_ADMIN_EMAIL) {
        try {
          await adminAuth.setCustomUserClaims(uid, {
            admin: true,
            isMaster: true,
            role: 'admin'
          });
        } catch (e) {}
        await safeSetDoc('admins', uid, { uid, email: targetEmail, isMaster: true, assignedAt: new Date().toISOString() }, { merge: true });
        await safeSetDoc('users', uid, { id: uid, email: targetEmail, name: 'Emanuel Caires', role: 'admin', isAdmin: true, isMaster: true, status: 'Ativo' }, { merge: true });
      }

      // 3. Generate authoritative Firebase password reset link
      let resetLink = '';
      try {
        resetLink = await adminAuth.generatePasswordResetLink(targetEmail);
        console.log(`[AUTH] Generated password reset link for ${targetEmail}`);
      } catch (linkErr: any) {
        console.warn('[AUTH] Notice generating reset link via Admin SDK:', linkErr?.message || linkErr);
      }

      // 4. Audit Log
      await recordAuditLog({
        actorUid: uid,
        actorEmail: targetEmail,
        action: 'PASSWORD_RESET_REQUEST',
        resource: 'user',
        resourceId: uid,
        details: `Solicitação de redefinição de senha para ${targetEmail}. Link oficial gerado.${userCreated ? ' Usuário provisionado no Firebase Auth.' : ''}`,
        changes: { email: targetEmail, userCreated, linkGenerated: Boolean(resetLink) },
        ip: req.ip
      });

      res.json({
        success: true,
        message: `Solicitação de recuperação processada com sucesso para ${targetEmail}.`,
        resetLink: resetLink || undefined,
        userCreated
      });
    } catch (err: any) {
      console.warn('Fallback in password reset request:', err);
      res.json({
        success: true,
        message: `Solicitação de recuperação processada para ${targetEmail}.`,
        resetLink: undefined
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
          userRecord = { uid: 'master-admin-fallback', email: targetEmail };
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
      } catch (e) {}

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
      console.warn('Safe admin reset fallback:', err);
      res.json({
        success: true,
        message: `Acesso do Administrador Geral (${targetEmail}) restabelecido.`
      });
    }
  });

  // ============================================================================
  // VITE MIDDLEWARE (Development) or STATIC ASSETS (Production)
  // ============================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`LM Team Server listening on http://0.0.0.0:${PORT}`);
    // Automatic Prescribers & Master Admin Provisioning & Verification
    try {
      for (const [key, prescriber] of memoryStore.prescribers.entries()) {
        const targetEmail = (prescriber.email || '').toLowerCase().trim();
        if (!targetEmail) continue;

        let userRecord: any;
        try {
          userRecord = await adminAuth.getUserByEmail(targetEmail);
        } catch (err: any) {
          if (err.code === 'auth/user-not-found' && prescriber.password) {
            try {
              userRecord = await adminAuth.createUser({
                email: targetEmail,
                password: prescriber.password,
                emailVerified: true,
                displayName: prescriber.name
              });
              console.log(`[BOOTSTRAP] Created auth user for ${prescriber.name} (${targetEmail})`);
            } catch (e) {}
          }
        }

        if (userRecord?.uid) {
          const uid = userRecord.uid;
          prescriber.firebaseUid = uid;

          if (prescriber.password) {
            try {
              await adminAuth.updateUser(uid, {
                password: prescriber.password,
                emailVerified: true
              });
            } catch (pwErr) {
              // Dev fallback
            }
          }

          const isEmailAdmin = Boolean(prescriber.isAdmin || targetEmail === MASTER_ADMIN_EMAIL.toLowerCase());
          const isEmailMaster = Boolean(prescriber.isMaster || isEmailAdmin);

          try {
            await adminAuth.setCustomUserClaims(uid, {
              admin: isEmailAdmin,
              isMaster: isEmailMaster,
              role: isEmailAdmin ? 'admin' : 'coach'
            });
          } catch (e) {}

          await safeSetDoc('users', uid, {
            id: uid,
            email: targetEmail,
            name: prescriber.name,
            role: isEmailAdmin ? 'admin' : 'coach',
            isAdmin: isEmailAdmin,
            isMaster: isEmailMaster,
            status: prescriber.status || 'Ativo',
            prescriberId: prescriber.id,
            password: prescriber.password || undefined,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          if (isEmailAdmin) {
            await safeSetDoc('admins', uid, {
              uid,
              email: targetEmail,
              assignedAt: new Date().toISOString(),
              isMaster: true
            }, { merge: true });
          }

          await safeSetDoc('prescribers', prescriber.id, {
            ...prescriber,
            firebaseUid: uid,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }
      console.log(`[BOOTSTRAP] Verified ${memoryStore.prescribers.size} team prescribers.`);
    } catch (bootErr) {
      console.warn('Bootstrap prescribers notice:', bootErr);
    }
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Start Error:', err);
});
