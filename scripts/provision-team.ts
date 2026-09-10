/**
 * Explicit and Idempotent Team & Master Admin Provisioning Script
 * 
 * Mandates:
 * 1. Explicit execution only (never run on server startup).
 * 2. Idempotent: safe to run repeatedly without overwriting existing user passwords or custom fields.
 * 3. Never stores passwords in documents or plaintext.
 * 4. Fails explicitly on IAM / network errors with clear diagnostic output.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

// Read config
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config.json in script:', e);
}

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId || process.env.GOOGLE_CLOUD_PROJECT || 'thermal-tune-blcf1'
  });
}

const adminDb = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(firebaseConfig.firestoreDatabaseId)
  : getFirestore();

const adminAuth = getAuth();

export const MASTER_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'emanuelcairess@gmail.com';

export const INITIAL_TEAM_PRESCRIBERS = [
  {
    id: 'coach-1',
    name: 'Emanuel Caires',
    roleType: 'Administrador Geral',
    phone: '(61) 98341-4090',
    birthDate: '1995-04-15',
    email: MASTER_ADMIN_EMAIL,
    isMaster: true,
    isAdmin: true,
    status: 'Ativo',
    crm_crn_cref: 'ADMIN-001'
  },
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
  },
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
  },
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
  },
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
];

export interface ProvisionResult {
  success: boolean;
  adminUid?: string;
  createdAuthUsers: string[];
  existingAuthUsers: string[];
  claimsAssigned: string[];
  documentsSynced: string[];
  errors: string[];
  message: string;
}

/**
 * Idempotent Provisioning Routine
 * Does NOT reset or overwrite existing passwords!
 */
export async function provisionTeam(options?: { targetAdminEmail?: string }): Promise<ProvisionResult> {
  const targetEmail = (options?.targetAdminEmail || MASTER_ADMIN_EMAIL).toLowerCase().trim();
  const result: ProvisionResult = {
    success: true,
    createdAuthUsers: [],
    existingAuthUsers: [],
    claimsAssigned: [],
    documentsSynced: [],
    errors: [],
    message: ''
  };

  console.log(`[PROVISION] Starting explicit idempotent provisioning for: ${targetEmail}`);

  try {
    // 1. Ensure Master Admin in Firebase Auth (WITHOUT resetting password if exists)
    let adminRecord: any;
    try {
      adminRecord = await adminAuth.getUserByEmail(targetEmail);
      result.existingAuthUsers.push(targetEmail);
      console.log(`[PROVISION] Master Admin already exists in Auth (UID: ${adminRecord.uid}). Password preserved.`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        adminRecord = await adminAuth.createUser({
          email: targetEmail,
          emailVerified: true,
          displayName: 'Emanuel Caires (Admin Geral)'
        });
        result.createdAuthUsers.push(targetEmail);
        console.log(`[PROVISION] Created new Auth user for Master Admin (UID: ${adminRecord.uid}).`);
      } else {
        const errorDetails = err?.message || String(err);
        const isIdentityToolkitIssue = errorDetails.includes('identitytoolkit') || errorDetails.includes('PERMISSION_DENIED') || errorDetails.includes('has not been used');
        const diagnosticHelp = isIdentityToolkitIssue
          ? '\n[DIAGNÓSTICO IAM] A API Identity Toolkit (identitytoolkit.googleapis.com) precisa estar habilitada no projeto GCP e a credencial do Service Account deve possuir o papel "Firebase Authentication Admin".'
          : '';
        throw new Error(`IAM/Auth failure looking up admin user: ${errorDetails}.${diagnosticHelp}`);
      }
    }

    const adminUid = adminRecord.uid;
    result.adminUid = adminUid;

    // 2. Set Admin Custom Claims idempotently
    const currentClaims = adminRecord.customClaims || {};
    if (!currentClaims.admin || !currentClaims.isMaster || currentClaims.role !== 'admin') {
      await adminAuth.setCustomUserClaims(adminUid, {
        admin: true,
        isMaster: true,
        role: 'admin'
      });
      result.claimsAssigned.push(targetEmail);
      console.log(`[PROVISION] Assigned Admin Custom Claims to ${adminUid}`);
    } else {
      console.log(`[PROVISION] Admin claims already up-to-date for ${adminUid}`);
    }

    // 3. Sync Firestore documents for Master Admin
    const nowIso = new Date().toISOString();

    await adminDb.collection('admins').doc(adminUid).set({
      uid: adminUid,
      email: targetEmail,
      assignedAt: nowIso,
      isMaster: true
    }, { merge: true });
    result.documentsSynced.push(`admins/${adminUid}`);

    await adminDb.collection('users').doc(adminUid).set({
      id: adminUid,
      email: targetEmail,
      name: 'Emanuel Caires',
      role: 'admin',
      isAdmin: true,
      isMaster: true,
      status: 'Ativo',
      prescriberId: 'coach-1',
      updatedAt: nowIso
    }, { merge: true });
    result.documentsSynced.push(`users/${adminUid}`);

    await adminDb.collection('prescribers').doc('coach-1').set({
      id: 'coach-1',
      name: 'Emanuel Caires',
      email: targetEmail,
      roleType: 'Administrador Geral',
      isAdmin: true,
      isMaster: true,
      status: 'Ativo',
      firebaseUid: adminUid,
      crm_crn_cref: 'ADMIN-001',
      updatedAt: nowIso
    }, { merge: true });
    result.documentsSynced.push('prescribers/coach-1');

    // 4. Provision Team Prescribers in Firestore (without creating dummy passwords)
    for (const p of INITIAL_TEAM_PRESCRIBERS) {
      if (p.id === 'coach-1') continue;

      const prescDocRef = adminDb.collection('prescribers').doc(p.id);
      const existing = await prescDocRef.get();

      if (!existing.exists) {
        await prescDocRef.set({
          ...p,
          updatedAt: nowIso
        });
        result.documentsSynced.push(`prescribers/${p.id}`);
        console.log(`[PROVISION] Seeded prescriber profile ${p.name} (${p.id})`);
      } else {
        // Safe merge only to avoid clobbering modifications
        await prescDocRef.set({
          name: p.name,
          roleType: p.roleType,
          status: existing.data()?.status || p.status,
          updatedAt: nowIso
        }, { merge: true });
        result.documentsSynced.push(`prescribers/${p.id} (merged)`);
      }
    }

    result.message = `Provisionamento idempotente concluído com sucesso. Usuários verificados: ${result.existingAuthUsers.length + result.createdAuthUsers.length}.`;
    console.log(`[PROVISION SUCCESS] ${result.message}`);
    return result;
  } catch (err: any) {
    console.error('[PROVISION ERROR] Explicit failure during provisioning:', err);
    result.success = false;
    result.errors.push(err?.message || String(err));
    result.message = `Falha explícita no provisionamento: ${err?.message || err}`;
    throw err;
  }
}

// Allow direct CLI execution: npx tsx scripts/provision-team.ts
if (process.argv[1] && process.argv[1].endsWith('provision-team.ts')) {
  provisionTeam()
    .then((res) => {
      console.log('Script execution finished successfully:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Script execution failed explicitly:', err);
      process.exit(1);
    });
}
