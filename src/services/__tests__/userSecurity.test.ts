import { describe, it, expect } from 'vitest';
import {
  validateUserSelfRegistration,
  validateUserProfileUpdate,
  evaluateAuthorization,
  ALLOWED_SELF_REGISTRATION_FIELDS,
  FORBIDDEN_SELF_REGISTRATION_FIELDS,
  ALLOWED_SELF_UPDATE_FIELDS,
  FORBIDDEN_SELF_UPDATE_FIELDS
} from '../userSecurity';

describe('Segurança Zero-Trust: Criação e Atualização de /users/{uid}', () => {
  const MOCK_ATHLETE_UID = 'user_athlete_01';
  const MOCK_TARGET_ATHLETE_ID = 'ath-99';

  describe('1. Autocadastro de Usuário (validateUserSelfRegistration)', () => {
    it('DEVE NEGAR autocadastro com role="athlete" e isAdmin=true (prevenção de escalação)', () => {
      const maliciousPayload = {
        id: MOCK_ATHLETE_UID,
        email: 'malicioso@teste.com',
        name: 'Aluno Malicioso',
        role: 'athlete',
        isAdmin: true,
        status: 'Ativo'
      };

      const result = validateUserSelfRegistration(maliciousPayload, MOCK_ATHLETE_UID);
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('PRIVILEGE_ESCALATION');
      expect(result.error).toContain('isAdmin');
    });

    it('DEVE NEGAR autocadastro com isMaster=true', () => {
      const maliciousPayload = {
        id: MOCK_ATHLETE_UID,
        email: 'malicioso2@teste.com',
        name: 'Aluno Malicioso 2',
        role: 'athlete',
        isMaster: true,
        status: 'Ativo'
      };

      const result = validateUserSelfRegistration(maliciousPayload, MOCK_ATHLETE_UID);
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('PRIVILEGE_ESCALATION');
      expect(result.error).toContain('isMaster');
    });

    it('DEVE NEGAR falsificação de prescriberId no autocadastro', () => {
      const maliciousPayload = {
        id: MOCK_ATHLETE_UID,
        email: 'falso_prescritor@teste.com',
        name: 'Falso Treinador',
        role: 'athlete',
        prescriberId: 'coach-1',
        status: 'Ativo'
      };

      const result = validateUserSelfRegistration(maliciousPayload, MOCK_ATHLETE_UID);
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('FORBIDDEN_LINK');
      expect(result.error).toContain('prescriberId');
    });

    it('DEVE NEGAR fornecimento de athleteId arbitrário no autocadastro', () => {
      const maliciousPayload = {
        id: MOCK_ATHLETE_UID,
        email: 'invasor@teste.com',
        name: 'Invasor de Conta',
        role: 'athlete',
        athleteId: MOCK_TARGET_ATHLETE_ID,
        status: 'Ativo'
      };

      const result = validateUserSelfRegistration(maliciousPayload, MOCK_ATHLETE_UID);
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('FORBIDDEN_LINK');
      expect(result.error).toContain('athleteId');
    });

    it('DEVE NEGAR fornecimento de assignedAthleteIds no autocadastro', () => {
      const maliciousPayload = {
        id: MOCK_ATHLETE_UID,
        email: 'invasor2@teste.com',
        name: 'Invasor de Alunos',
        role: 'athlete',
        assignedAthleteIds: ['ath-01', 'ath-02'],
        status: 'Ativo'
      };

      const result = validateUserSelfRegistration(maliciousPayload, MOCK_ATHLETE_UID);
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('FORBIDDEN_LINK');
      expect(result.error).toContain('assignedAthleteIds');
    });

    it('DEVE NEGAR campos não permitidos fora da lista explícita', () => {
      const payloadWithUnknownField = {
        id: MOCK_ATHLETE_UID,
        email: 'aluno@teste.com',
        name: 'Aluno Teste',
        role: 'athlete',
        unauthorizedCustomField: 'dangerous_value',
        status: 'Ativo'
      };

      const result = validateUserSelfRegistration(payloadWithUnknownField, MOCK_ATHLETE_UID);
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('FORBIDDEN_FIELD');
      expect(result.error).toContain('unauthorizedCustomField');
    });

    it('DEVE NEGAR papéis diferentes de athlete no autocadastro (ex: coach ou admin)', () => {
      const payloadAdmin = {
        id: MOCK_ATHLETE_UID,
        email: 'aluno@teste.com',
        name: 'Tentando Ser Admin',
        role: 'admin',
        status: 'Ativo'
      };

      const result = validateUserSelfRegistration(payloadAdmin, MOCK_ATHLETE_UID);
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('INVALID_ROLE');
    });

    it('DEVE PERMITIR autocadastro com campos cadastrais válidos da lista explícita', () => {
      const validPayload = {
        id: MOCK_ATHLETE_UID,
        email: 'aluno.legitimo@teste.com',
        name: 'Carlos Oliveira',
        role: 'athlete',
        phone: '(11) 98888-7777',
        avatar: 'https://images.unsplash.com/photo-1534528741775',
        birthDate: '1995-05-20',
        cpf: '123.456.789-00',
        bio: 'Atleta amador focado em hipertrofia',
        gender: 'Masculino',
        status: 'Ativo'
      };

      const result = validateUserSelfRegistration(validPayload, MOCK_ATHLETE_UID);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toBeDefined();
      expect(result.sanitizedData?.id).toBe(MOCK_ATHLETE_UID);
      expect(result.sanitizedData?.role).toBe('athlete');
      expect(result.sanitizedData?.isAdmin).toBeUndefined();
      expect(result.sanitizedData?.athleteId).toBeUndefined();
      expect(result.sanitizedData?.prescriberId).toBeUndefined();
    });
  });

  describe('2. Atualização de Perfil de Usuário (validateUserProfileUpdate)', () => {
    const existingUserData = {
      id: MOCK_ATHLETE_UID,
      email: 'atleta@teste.com',
      name: 'Carlos Silva',
      role: 'athlete',
      athleteId: 'ath-01',
      prescriberId: 'coach-1',
      status: 'Ativo',
      isAdmin: false
    };

    it('DEVE NEGAR alteração de athleteId para outra pessoa pelo próprio usuário', () => {
      const maliciousUpdate = {
        athleteId: 'ath-02-outro-atleta'
      };

      const result = validateUserProfileUpdate(
        maliciousUpdate,
        MOCK_ATHLETE_UID,
        MOCK_ATHLETE_UID,
        { isCallerAdmin: false, existingUserData }
      );

      expect(result.isValid).toBe(false);
      expect(result.code).toBe('FORBIDDEN_LINK');
      expect(result.error).toContain('athleteId');
    });

    it('DEVE NEGAR alteração de prescriberId pelo próprio usuário', () => {
      const maliciousUpdate = {
        prescriberId: 'coach-hacker'
      };

      const result = validateUserProfileUpdate(
        maliciousUpdate,
        MOCK_ATHLETE_UID,
        MOCK_ATHLETE_UID,
        { isCallerAdmin: false, existingUserData }
      );

      expect(result.isValid).toBe(false);
      expect(result.code).toBe('FORBIDDEN_LINK');
      expect(result.error).toContain('prescriberId');
    });

    it('DEVE NEGAR injeção de isAdmin ou alteração de role via update', () => {
      const maliciousUpdate1 = { isAdmin: true };
      const result1 = validateUserProfileUpdate(
        maliciousUpdate1,
        MOCK_ATHLETE_UID,
        MOCK_ATHLETE_UID,
        { isCallerAdmin: false, existingUserData }
      );
      expect(result1.isValid).toBe(false);
      expect(result1.code).toBe('PRIVILEGE_ESCALATION');

      const maliciousUpdate2 = { role: 'admin' };
      const result2 = validateUserProfileUpdate(
        maliciousUpdate2,
        MOCK_ATHLETE_UID,
        MOCK_ATHLETE_UID,
        { isCallerAdmin: false, existingUserData }
      );
      expect(result2.isValid).toBe(false);
      expect(result2.code).toBe('PRIVILEGE_ESCALATION');
    });

    it('DEVE NEGAR atualização no perfil de outro usuário por não-administrador', () => {
      const updateOther = { name: 'Nome Invasor' };
      const result = validateUserProfileUpdate(
        updateOther,
        MOCK_ATHLETE_UID,
        'outro_usuario_uid',
        { isCallerAdmin: false, existingUserData }
      );

      expect(result.isValid).toBe(false);
      expect(result.code).toBe('UNAUTHORIZED');
    });

    it('DEVE PERMITIR que o próprio usuário atualize campos cadastrais permitidos', () => {
      const validUpdate = {
        name: 'Carlos Silva Atualizado',
        phone: '(11) 97777-6666',
        avatar: 'https://newavatar.com/photo.jpg',
        bio: 'Nova bio atualizada'
      };

      const result = validateUserProfileUpdate(
        validUpdate,
        MOCK_ATHLETE_UID,
        MOCK_ATHLETE_UID,
        { isCallerAdmin: false, existingUserData }
      );

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData?.name).toBe('Carlos Silva Atualizado');
      expect(result.sanitizedData?.phone).toBe('(11) 97777-6666');
      expect(result.sanitizedData?.athleteId).toBeUndefined();
    });

    it('DEVE PERMITIR que Administrador atualize qualquer campo e atribuições', () => {
      const adminUpdate = {
        role: 'coach',
        isAdmin: true,
        athleteId: 'ath-02',
        prescriberId: 'coach-2',
        assignedAthleteIds: ['ath-01', 'ath-02']
      };

      const result = validateUserProfileUpdate(
        adminUpdate,
        'admin_master_uid',
        MOCK_ATHLETE_UID,
        { isCallerAdmin: true, existingUserData }
      );

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData?.athleteId).toBe('ath-02');
      expect(result.sanitizedData?.role).toBe('coach');
    });
  });

  describe('3. Avaliação Centralizada de Autorização (evaluateAuthorization)', () => {
    it('NÃO DEVE conceder privilégio de administrador apenas por e-mail (Zero-Trust)', () => {
      const authResult = evaluateAuthorization({
        uid: 'fake_admin_uid',
        email: 'emanuelcairess@gmail.com',
        adminDocExists: false,
        userDoc: { role: 'athlete', isAdmin: false }
      });

      expect(authResult.isAdmin).toBe(false);
      expect(authResult.isMaster).toBe(false);
      expect(authResult.role).toBe('athlete');
    });

    it('DEVE conceder privilégio de administrador quando registrado oficialmente em /admins/{uid}', () => {
      const authResult = evaluateAuthorization({
        uid: 'legit_admin_uid',
        email: 'admin.oficial@lmteam.com',
        adminDocExists: true,
        userDoc: { role: 'admin', isAdmin: true, isMaster: true }
      });

      expect(authResult.isAdmin).toBe(true);
      expect(authResult.isMaster).toBe(true);
      expect(authResult.role).toBe('admin');
    });
  });

  describe('4. Listas Explícitas de Campos (Sanity Check)', () => {
    it('athleteId NÃO deve constar na lista de campos editáveis pelo próprio usuário', () => {
      expect((ALLOWED_SELF_UPDATE_FIELDS as readonly string[]).includes('athleteId')).toBe(false);
      expect((FORBIDDEN_SELF_UPDATE_FIELDS as readonly string[]).includes('athleteId')).toBe(true);
    });

    it('Campos de privilégio devem constar como estritamente proibidos no autocadastro', () => {
      for (const field of FORBIDDEN_SELF_REGISTRATION_FIELDS) {
        expect((ALLOWED_SELF_REGISTRATION_FIELDS as readonly string[]).includes(field)).toBe(false);
      }
    });
  });
});
