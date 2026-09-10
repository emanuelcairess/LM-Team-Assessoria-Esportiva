import { describe, it, expect } from 'vitest';
import {
  validatePrescriptionAccess,
  validateAthleteListQuery,
  UserSecurityContext,
  AthleteRelationshipContext
} from '../userSecurity';

describe('Prescription Security & Link Authorization Unit Tests', () => {
  const linkedAthlete: AthleteRelationshipContext = {
    id: 'athlete_123',
    coachId: 'coach_lucas',
    nutritionistId: 'nutri_camila',
    doctorId: 'doctor_rodrigo',
    assignedPrescriberIds: ['coach_lucas', 'nutri_camila']
  };

  const unlinkedAthlete: AthleteRelationshipContext = {
    id: 'athlete_999',
    coachId: 'coach_other',
    nutritionistId: 'nutri_other',
    doctorId: 'doctor_other',
    assignedPrescriberIds: ['coach_other']
  };

  const coachUser: UserSecurityContext = {
    uid: 'coach_lucas',
    role: 'coach',
    assignedAthleteIds: ['athlete_123']
  };

  const unlinkedCoachUser: UserSecurityContext = {
    uid: 'coach_stranger',
    role: 'coach',
    assignedAthleteIds: ['other_athlete']
  };

  const nutriUser: UserSecurityContext = {
    uid: 'nutri_camila',
    role: 'nutritionist',
    assignedAthleteIds: ['athlete_123']
  };

  const doctorUser: UserSecurityContext = {
    uid: 'doctor_rodrigo',
    role: 'doctor',
    assignedAthleteIds: ['athlete_123']
  };

  const athleteOwnerUser: UserSecurityContext = {
    uid: 'athlete_123',
    role: 'athlete',
    athleteId: 'athlete_123'
  };

  const otherAthleteUser: UserSecurityContext = {
    uid: 'athlete_different',
    role: 'athlete',
    athleteId: 'athlete_different'
  };

  const adminUser: UserSecurityContext = {
    uid: 'admin_master',
    role: 'admin',
    isAdmin: true
  };

  describe('1. Autorização por Modalidade de Prescrição (Workouts, Nutrition, Supplements)', () => {
    it('Coach vinculado PODE ler e prescrever treinos (workouts) para o atleta vinculado', () => {
      const readResult = validatePrescriptionAccess({
        user: coachUser,
        modality: 'workouts',
        athlete: linkedAthlete,
        isWrite: false
      });
      expect(readResult.isValid).toBe(true);

      const writeResult = validatePrescriptionAccess({
        user: coachUser,
        modality: 'workouts',
        athlete: linkedAthlete,
        isWrite: true
      });
      expect(writeResult.isValid).toBe(true);
    });

    it('Coach vinculado NÃO PODE prescrever nutrição (nutrition) para o atleta', () => {
      const result = validatePrescriptionAccess({
        user: coachUser,
        modality: 'nutrition',
        athlete: linkedAthlete,
        isWrite: true
      });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('UNAUTHORIZED');
      expect(result.error).toContain('nutrition');
    });

    it('Coach vinculado NÃO PODE prescrever suplementos para o atleta', () => {
      const result = validatePrescriptionAccess({
        user: coachUser,
        modality: 'supplements',
        athlete: linkedAthlete,
        isWrite: true
      });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('UNAUTHORIZED');
      expect(result.error).toContain('supplements');
    });

    it('Nutricionista vinculada PODE ler e prescrever nutrição (nutrition)', () => {
      const writeResult = validatePrescriptionAccess({
        user: nutriUser,
        modality: 'nutrition',
        athlete: linkedAthlete,
        isWrite: true
      });
      expect(writeResult.isValid).toBe(true);
    });

    it('Nutricionista vinculada NÃO PODE prescrever treinos (workouts)', () => {
      const writeResult = validatePrescriptionAccess({
        user: nutriUser,
        modality: 'workouts',
        athlete: linkedAthlete,
        isWrite: true
      });
      expect(writeResult.isValid).toBe(false);
      expect(writeResult.code).toBe('UNAUTHORIZED');
      expect(writeResult.error).toContain('workouts');
    });

    it('Médico e Nutricionista vinculados PODEM prescrever suplementos/manipulados', () => {
      const docResult = validatePrescriptionAccess({
        user: doctorUser,
        modality: 'supplements',
        athlete: linkedAthlete,
        isWrite: true
      });
      expect(docResult.isValid).toBe(true);

      const nutriResult = validatePrescriptionAccess({
        user: nutriUser,
        modality: 'supplements',
        athlete: linkedAthlete,
        isWrite: true
      });
      expect(nutriResult.isValid).toBe(true);
    });
  });

  describe('2. Isolamento de Profissional NÃO Vinculado', () => {
    it('Profissional sem vínculo NÃO PODE ler prescrições de outro atleta', () => {
      const result = validatePrescriptionAccess({
        user: unlinkedCoachUser,
        modality: 'workouts',
        athlete: linkedAthlete,
        isWrite: false
      });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('FORBIDDEN_LINK');
      expect(result.error).toContain('não vinculado');
    });

    it('Profissional sem vínculo NÃO PODE modificar prescrições de outro atleta', () => {
      const result = validatePrescriptionAccess({
        user: unlinkedCoachUser,
        modality: 'workouts',
        athlete: linkedAthlete,
        isWrite: true
      });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('FORBIDDEN_LINK');
    });
  });

  describe('3. Restrições do Atleta (Somente Leitura e Isolamento entre Atletas)', () => {
    it('Atleta dono PODE ler suas próprias prescrições', () => {
      const result = validatePrescriptionAccess({
        user: athleteOwnerUser,
        modality: 'workouts',
        athlete: linkedAthlete,
        isWrite: false
      });
      expect(result.isValid).toBe(true);
    });

    it('Atleta dono NÃO PODE modificar suas prescrições oficiais (apenas leitura)', () => {
      const result = validatePrescriptionAccess({
        user: athleteOwnerUser,
        modality: 'workouts',
        athlete: linkedAthlete,
        isWrite: true
      });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('PRIVILEGE_ESCALATION');
      expect(result.error).toContain('SOMENTE-LEITURA');
    });

    it('Atleta NÃO PODE ler prescrições de outro atleta', () => {
      const result = validatePrescriptionAccess({
        user: otherAthleteUser,
        modality: 'workouts',
        athlete: linkedAthlete,
        isWrite: false
      });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('UNAUTHORIZED');
    });
  });

  describe('4. Administrador com Acesso Pleno', () => {
    it('Admin PODE ler e modificar qualquer modalidade para qualquer atleta', () => {
      for (const modality of ['workouts', 'nutrition', 'supplements'] as const) {
        const result = validatePrescriptionAccess({
          user: adminUser,
          modality,
          athlete: unlinkedAthlete,
          isWrite: true
        });
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('5. Restrição de Consultas de Listagem de Atletas (/athletes)', () => {
    it('Admin PODE realizar consulta ampla em /athletes sem filtros', () => {
      const result = validateAthleteListQuery({
        user: adminUser
      });
      expect(result.isValid).toBe(true);
    });

    it('Profissional NÃO PODE realizar consulta ampla sem filtro de vínculo', () => {
      const result = validateAthleteListQuery({
        user: coachUser
      });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('UNAUTHORIZED');
      expect(result.error).toContain('Consultas amplas a /athletes são restritas');
    });

    it('Coach PODE consultar com filtro de vínculo pelo seu próprio coachId', () => {
      const result = validateAthleteListQuery({
        user: coachUser,
        queryFilter: {
          field: 'coachId',
          operator: '==',
          value: 'coach_lucas'
        }
      });
      expect(result.isValid).toBe(true);
    });

    it('Coach PODE consultar com filtro assignedPrescriberIds contendo seu UID', () => {
      const result = validateAthleteListQuery({
        user: coachUser,
        queryFilter: {
          field: 'assignedPrescriberIds',
          operator: 'array-contains',
          value: 'coach_lucas'
        }
      });
      expect(result.isValid).toBe(true);
    });

    it('Coach NÃO PODE consultar com filtro de coachId pertencente a outro profissional', () => {
      const result = validateAthleteListQuery({
        user: coachUser,
        queryFilter: {
          field: 'coachId',
          operator: '==',
          value: 'coach_different_uid'
        }
      });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('FORBIDDEN_LINK');
    });

    it('Atleta só PODE consultar seu próprio ID', () => {
      const ownResult = validateAthleteListQuery({
        user: athleteOwnerUser,
        queryFilter: {
          field: 'id',
          operator: '==',
          value: 'athlete_123'
        }
      });
      expect(ownResult.isValid).toBe(true);

      const otherResult = validateAthleteListQuery({
        user: athleteOwnerUser,
        queryFilter: {
          field: 'id',
          operator: '==',
          value: 'athlete_someone_else'
        }
      });
      expect(otherResult.isValid).toBe(false);
      expect(otherResult.code).toBe('UNAUTHORIZED');
    });
  });
});
