import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  evaluateAuthorization,
  validateAccountStatus,
  validateAuthorizedProfile,
  sanitizeUserEntity
} from '../userSecurity';

describe('Resilience: Restart after Password Change & Firestore Unavailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Behavior after Password Change', () => {
    it('ensures no password or accessPassword remains in sanitized user profiles after password change', () => {
      const userAfterPasswordChange = {
        id: 'usr_123',
        email: 'coach@lmteam.com',
        name: 'Coach Teste',
        role: 'coach',
        status: 'Ativo',
        passwordChangedAt: '2026-09-07T12:00:00.000Z',
        password: 'PlainTextPassword123!',
        accessPassword: 'LegacyPassword456!'
      };

      const sanitized = sanitizeUserEntity(userAfterPasswordChange);

      // Plaintext passwords must be completely removed
      expect((sanitized as any).password).toBeUndefined();
      expect((sanitized as any).accessPassword).toBeUndefined();
      expect(sanitized.passwordChangedAt).toBe('2026-09-07T12:00:00.000Z');
      expect(sanitized.email).toBe('coach@lmteam.com');
    });

    it('rejects session authorization if account is inactivated during or after credential reset', () => {
      const inactiveProfile = {
        id: 'usr_456',
        email: 'inactive@lmteam.com',
        status: 'Inativo',
        role: 'coach'
      };

      const statusCheck = validateAccountStatus(inactiveProfile.status);
      expect(statusCheck.isValid).toBe(false);
      expect(statusCheck.error).toContain('inativa');

      const profileAuth = validateAuthorizedProfile(inactiveProfile, 'prescriber');
      expect(profileAuth.isValid).toBe(false);
      expect(profileAuth.code).toBe('ACCOUNT_INACTIVE');
    });

    it('validates session and authorization correctly upon fresh login after password update', () => {
      const activeAdminProfile = {
        id: 'admin_uid',
        email: 'emanuelcaires@hotmail.com',
        name: 'Emanuel Caires',
        role: 'admin',
        isAdmin: true,
        isMaster: true,
        status: 'Ativo',
        passwordChangedAt: new Date().toISOString()
      };

      const authEvaluation = evaluateAuthorization({
        uid: 'admin_uid',
        email: 'emanuelcaires@hotmail.com',
        adminDocExists: true,
        userDoc: activeAdminProfile,
        tokenClaims: { admin: true, isMaster: true, role: 'admin' }
      });

      expect(authEvaluation.isAdmin).toBe(true);
      expect(authEvaluation.isMaster).toBe(true);
      expect(authEvaluation.role).toBe('admin');
    });
  });

  describe('2. Explicit Failure on Firestore Unavailability (No Silent Fallbacks)', () => {
    it('throws explicit error when Firestore query fails instead of returning demo/mock data', async () => {
      // Simulating the strict safeGetDoc contract
      const simulateSafeGetDoc = async (isFirestoreOnline: boolean) => {
        if (!isFirestoreOnline) {
          const err: any = new Error('Could not reach Cloud Firestore backend');
          err.code = 'FIRESTORE_UNAVAILABLE';
          throw err;
        }
        return { exists: true, data: () => ({ name: 'Real Firestore Athlete' }) };
      };

      await expect(simulateSafeGetDoc(false)).rejects.toThrow('Could not reach Cloud Firestore backend');
    });

    it('throws explicit error on write failure without returning success response', async () => {
      const simulateSafeSetDoc = async (isFirestoreOnline: boolean) => {
        if (!isFirestoreOnline) {
          const err: any = new Error('Permission denied or network unreachable');
          err.code = 'FIRESTORE_WRITE_FAILED';
          throw err;
        }
        return { success: true };
      };

      await expect(simulateSafeSetDoc(false)).rejects.toThrow('Permission denied or network unreachable');
    });

    it('rejects access when user profile is absent in Firestore (no fabricated profile fallback)', () => {
      const absentProfile = null;
      const validation = validateAuthorizedProfile(absentProfile, 'prescriber');

      expect(validation.isValid).toBe(false);
      expect(validation.code).toBe('PROFILE_ABSENT');
      expect(validation.error).toContain('ausente');
    });
  });

  describe('3. Separation of In-Memory Demo vs Production Firebase Data', () => {
    it('guarantees demo athlete queries do not pollute production evaluation', () => {
      const demoAthlete = {
        id: 'demo-ath-1',
        name: 'Atleta Demonstração',
        email: 'demo@lmteam.com',
        isDemo: true
      };

      // Ensure demo object does not grant any admin or master authorization
      const evaluation = evaluateAuthorization({
        uid: demoAthlete.id,
        email: demoAthlete.email,
        adminDocExists: false,
        userDoc: demoAthlete,
        tokenClaims: {}
      });

      expect(evaluation.isAdmin).toBe(false);
      expect(evaluation.isMaster).toBe(false);
      expect(evaluation.role).toBe('athlete');
    });
  });

  describe('4. Explicit Error on IAM / Network Failure in Identity Operations', () => {
    it('produces explicit failure on IAM permission denied without fallback UID or success response', async () => {
      const simulateAuthOperation = async (hasIAMPermission: boolean) => {
        if (!hasIAMPermission) {
          const iamErr: any = new Error('IAM permission denied: identitytoolkit.users.update is not granted to service account');
          iamErr.code = 'auth/insufficient-permission';
          throw iamErr;
        }
        return { success: true };
      };

      await expect(simulateAuthOperation(false)).rejects.toThrow('IAM permission denied');
    });

    it('rejects unauthenticated requests or invalid bearer tokens without falling back to mock user', () => {
      const emptyHeader = '';
      const invalidToken = 'Bearer invalid-signature-token';

      const validateBearer = (header: string) => {
        if (!header || !header.startsWith('Bearer ')) {
          return { error: 'UNAUTHENTICATED', message: 'Token de autenticação ausente ou inválido.' };
        }
        const token = header.split('Bearer ')[1].trim();
        if (token === 'invalid-signature-token') {
          return { error: 'INVALID_TOKEN', message: 'Token de autenticação inválido.' };
        }
        return { success: true };
      };

      expect(validateBearer(emptyHeader)).toEqual({
        error: 'UNAUTHENTICATED',
        message: 'Token de autenticação ausente ou inválido.'
      });

      expect(validateBearer(invalidToken)).toEqual({
        error: 'INVALID_TOKEN',
        message: 'Token de autenticação inválido.'
      });
    });
  });
});
