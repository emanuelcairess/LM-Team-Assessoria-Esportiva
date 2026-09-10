/**
 * ==============================================================================
 * SUÍTE DE TESTES DE REGRAS DE SEGURANÇA FIRESTORE (@firebase/rules-unit-testing)
 * LM TEAM ASSESSORIA ESPORTIVA & MÉDICA
 * ==============================================================================
 */

import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'demo-lmteam';
const ADMIN_EMAIL = 'emanuelcairess@gmail.com';

const emulatorHostEnv = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const [host, portStr] = emulatorHostEnv.split(':');
const port = parseInt(portStr || '8080', 10);

describe('LM Team - Testes de Regras de Segurança do Firestore (Zero-Trust RBAC)', () => {
  beforeAll(async () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    if (!fs.existsSync(rulesPath)) {
      throw new Error(`Arquivo firestore.rules não encontrado em: ${rulesPath}`);
    }
    const rules = fs.readFileSync(rulesPath, 'utf8');

    try {
      testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
          rules,
          host,
          port
        }
      });
    } catch (err: any) {
      // FALHAR OBRIGATORIAMENTE quando o emulator obrigatório não iniciar
      throw new Error(
        `[Emulator Obrigatório] Falha crítica ao inicializar o Firestore Emulator em ${host}:${port}.\n` +
        `A suíte de regras de segurança do Firestore exige o emulador ativo em ambiente isolado (demo).\n` +
        `Certifique-se de executar via: firebase emulators:exec --project ${PROJECT_ID} "vitest run test/firestore.rules.test.ts"\n` +
        `Erro original: ${err?.message || err}`
      );
    }
  });

  afterAll(async () => {
    if (testEnv) {
      try {
        await testEnv.cleanup();
      } catch {
        // cleanup error
      }
    }
  });

  beforeEach(async () => {
    if (!testEnv) {
      throw new Error(
        'RulesTestEnvironment não inicializado. O emulator obrigatório do Firestore deve estar em execução.'
      );
    }
    await testEnv.clearFirestore();

    // Configurar dados de base com contexto de administrador (bypassa regras para seed)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      // 1. Criar Perfil de Administrador
      await db.doc(`users/admin_uid`).set({
        id: 'admin_uid',
        email: ADMIN_EMAIL,
        name: 'Administrador Geral',
        role: 'admin',
        status: 'Ativo'
      });
      await db.doc(`admins/admin_uid`).set({
        id: 'admin_uid',
        email: ADMIN_EMAIL,
        role: 'admin'
      });

      // 2. Criar Coach 1 (com Atleta 1 vinculado)
      await db.doc(`users/coach_1_uid`).set({
        id: 'coach_1_uid',
        email: 'coach1@lmteam.com',
        name: 'Head Coach Lucas',
        role: 'coach',
        assignedAthleteIds: ['athlete_1_uid'],
        status: 'Ativo'
      });
      await db.doc(`prescribers/coach_1_uid`).set({
        id: 'coach_1_uid',
        name: 'Head Coach Lucas',
        roleType: 'Head Coach',
        email: 'coach1@lmteam.com',
        isMaster: false,
        status: 'Ativo'
      });

      // 3. Criar Coach 2 (sem Atleta 1 vinculado)
      await db.doc(`users/coach_2_uid`).set({
        id: 'coach_2_uid',
        email: 'coach2@lmteam.com',
        name: 'Coach Bruno',
        role: 'coach',
        assignedAthleteIds: ['athlete_2_uid'],
        status: 'Ativo'
      });

      // 4. Criar Atleta 1
      await db.doc(`users/athlete_1_uid`).set({
        id: 'athlete_1_uid',
        email: 'atleta1@gmail.com',
        name: 'Marcos Silva',
        role: 'athlete',
        athleteId: 'athlete_1_uid',
        status: 'Ativo'
      });
      await db.doc(`athletes/athlete_1_uid`).set({
        id: 'athlete_1_uid',
        name: 'Marcos Silva',
        email: 'atleta1@gmail.com',
        coachId: 'coach_1_uid',
        nutritionistId: 'nutri_1_uid',
        status: 'Ativo',
        currentWeightKg: 84.5
      });

      // 4b. Criar Nutricionista 1 (com Atleta 1 vinculado)
      await db.doc(`users/nutri_1_uid`).set({
        id: 'nutri_1_uid',
        email: 'nutri1@lmteam.com',
        name: 'Dra. Camila Nutri',
        role: 'nutritionist',
        assignedAthleteIds: ['athlete_1_uid'],
        status: 'Ativo'
      });
      await db.doc(`prescribers/nutri_1_uid`).set({
        id: 'nutri_1_uid',
        name: 'Dra. Camila Nutri',
        roleType: 'Nutricionista Esportiva',
        email: 'nutri1@lmteam.com',
        isMaster: false,
        status: 'Ativo'
      });

      // 5. Criar Atleta 2
      await db.doc(`users/athlete_2_uid`).set({
        id: 'athlete_2_uid',
        email: 'atleta2@gmail.com',
        name: 'Gabriel Costa',
        role: 'athlete',
        athleteId: 'athlete_2_uid',
        status: 'Ativo'
      });
      await db.doc(`athletes/athlete_2_uid`).set({
        id: 'athlete_2_uid',
        name: 'Gabriel Costa',
        email: 'atleta2@gmail.com',
        coachId: 'coach_2_uid',
        status: 'Ativo',
        currentWeightKg: 91.0
      });

      // 6. Criar Exercício no Banco Oficial
      await db.doc(`exercises/ex_supino_reto`).set({
        id: 'ex_supino_reto',
        name: 'Supino Reto com Barra',
        targetMuscle: 'Peitoral',
        defaultRestSeconds: 90
      });
    });
  });

  // ============================================================================
  // PILAR 1: AUTENTICAÇÃO OBRIGATÓRIA (ZERO-TRUST UNATHENTICATED GATES)
  // ============================================================================
  describe('1. Bloqueio de Usuários Anônimos / Não Autenticados', () => {
    it('Deve rejeitar leitura anônima de qualquer coleção (/users, /athletes, /prescriptions)', async () => {
      const unauthedDb = testEnv.unauthenticatedContext().firestore();

      await assertFails(unauthedDb.doc('users/athlete_1_uid').get());
      await assertFails(unauthedDb.doc('athletes/athlete_1_uid').get());
      await assertFails(unauthedDb.doc('prescriptions/workouts/athletes/athlete_1_uid').get());
      await assertFails(unauthedDb.doc('exercises/ex_supino_reto').get());
    });

    it('Deve rejeitar escrita anônima em qualquer documento', async () => {
      const unauthedDb = testEnv.unauthenticatedContext().firestore();

      await assertFails(
        unauthedDb.doc('athletes/hacker_uid').set({ name: 'Hacker', role: 'admin' })
      );
      await assertFails(
        unauthedDb.doc('exercises/hacker_ex').set({ name: 'Ex Malicioso', targetMuscle: 'Peitoral' })
      );
    });
  });

  // ============================================================================
  // PILAR 2: CONTROLE DE PERFIS (/users/{uid}) & ANTI-PRIVILEGE ESCALATION
  // ============================================================================
  describe('2. Gerenciamento de Perfis de Usuário & Prevenção de Escalação', () => {
    it('Usuário comum deve poder criar apenas seu próprio perfil com role="athlete"', async () => {
      const newUserDb = testEnv.authenticatedContext('new_user_123', { email: 'new@gmail.com' }).firestore();

      await assertSucceeds(
        newUserDb.doc('users/new_user_123').set({
          id: 'new_user_123',
          email: 'new@gmail.com',
          name: 'Novo Aluno',
          role: 'athlete',
          status: 'Ativo'
        })
      );
    });

    it('DIRTY DOZEN #1: Usuário comum NÃO pode se autorregistrar como admin ou coach', async () => {
      const hackerDb = testEnv.authenticatedContext('hacker_uid', { email: 'hacker@evil.com' }).firestore();

      // Tentativa de criar perfil com role admin
      await assertFails(
        hackerDb.doc('users/hacker_uid').set({
          id: 'hacker_uid',
          email: 'hacker@evil.com',
          name: 'Hacker Admin',
          role: 'admin',
          status: 'Ativo'
        })
      );

      // Tentativa de criar perfil com role coach
      await assertFails(
        hackerDb.doc('users/hacker_uid').set({
          id: 'hacker_uid',
          email: 'hacker@evil.com',
          name: 'Hacker Coach',
          role: 'coach',
          status: 'Ativo'
        })
      );
    });

    it('DIRTY DOZEN #2: Atleta autenticado NÃO pode elevar seu role via update', async () => {
      const athleteDb = testEnv.authenticatedContext('athlete_1_uid', { email: 'atleta1@gmail.com' }).firestore();

      // Tentativa de alterar role para admin
      await assertFails(
        athleteDb.doc('users/athlete_1_uid').update({
          role: 'admin'
        })
      );

      // Tentativa de injetar isAdmin: true
      await assertFails(
        athleteDb.doc('users/athlete_1_uid').update({
          isAdmin: true
        })
      );
    });

    it('Autocadastro role=athlete com isAdmin=true DEVE SER NEGADO antes de qualquer persistência', async () => {
      const hackerDb = testEnv.authenticatedContext('hacker_athlete_uid', { email: 'hacker_athlete@gmail.com' }).firestore();

      await assertFails(
        hackerDb.doc('users/hacker_athlete_uid').set({
          id: 'hacker_athlete_uid',
          email: 'hacker_athlete@gmail.com',
          name: 'Atleta Malicioso',
          role: 'athlete',
          isAdmin: true,
          status: 'Ativo'
        })
      );
    });

    it('Autocadastro com falsificação de prescriberId DEVE SER NEGADO', async () => {
      const hackerDb = testEnv.authenticatedContext('hacker_presc_uid', { email: 'hacker_presc@gmail.com' }).firestore();

      await assertFails(
        hackerDb.doc('users/hacker_presc_uid').set({
          id: 'hacker_presc_uid',
          email: 'hacker_presc@gmail.com',
          name: 'Atleta Falso Prescritor',
          role: 'athlete',
          prescriberId: 'coach_1_uid',
          status: 'Ativo'
        })
      );
    });

    it('Autocadastro com falsificação de athleteId ou assignedAthleteIds DEVE SER NEGADO', async () => {
      const hackerDb = testEnv.authenticatedContext('hacker_links_uid', { email: 'hacker_links@gmail.com' }).firestore();

      // Proíbe fornecimento de athleteId arbitrário no cadastro
      await assertFails(
        hackerDb.doc('users/hacker_links_uid').set({
          id: 'hacker_links_uid',
          email: 'hacker_links@gmail.com',
          name: 'Atleta Invasor',
          role: 'athlete',
          athleteId: 'athlete_2_uid',
          status: 'Ativo'
        })
      );

      // Proíbe fornecimento de assignedAthleteIds
      await assertFails(
        hackerDb.doc('users/hacker_links_uid').set({
          id: 'hacker_links_uid',
          email: 'hacker_links@gmail.com',
          name: 'Atleta Invasor 2',
          role: 'athlete',
          assignedAthleteIds: ['athlete_1_uid', 'athlete_2_uid'],
          status: 'Ativo'
        })
      );
    });

    it('Atleta autenticado NÃO pode alterar seu athleteId para outra pessoa via update', async () => {
      const athleteDb = testEnv.authenticatedContext('athlete_1_uid', { email: 'atleta1@gmail.com' }).firestore();

      // Tentativa de alterar athleteId para sequestrar os dados de athlete_2_uid
      await assertFails(
        athleteDb.doc('users/athlete_1_uid').update({
          athleteId: 'athlete_2_uid'
        })
      );

      // Tentativa de injetar prescriberId via update
      await assertFails(
        athleteDb.doc('users/athlete_1_uid').update({
          prescriberId: 'coach_1_uid'
        })
      );
    });

    it('Usuário com e-mail do admin sem doc oficial em admins/ ou users/ NÃO possui acesso de administrador', async () => {
      // Usuário autenticado com o e-mail emanuelcairess@gmail.com mas com UID diferente sem doc em admins
      const impostorDb = testEnv.authenticatedContext('fake_admin_uid', { email: 'emanuelcairess@gmail.com' }).firestore();

      // Não pode listar todos os usuários da coleção /users
      await assertFails(impostorDb.collection('users').get());
      // Não pode ler dados de outro atleta
      await assertFails(impostorDb.doc('athletes/athlete_1_uid').get());
    });

    it('Atleta pode atualizar apenas campos permitidos de seu próprio perfil (nome, telefone, bio, avatar)', async () => {
      const athleteDb = testEnv.authenticatedContext('athlete_1_uid', { email: 'atleta1@gmail.com' }).firestore();

      await assertSucceeds(
        athleteDb.doc('users/athlete_1_uid').update({
          name: 'Marcos Silva Atualizado',
          phone: '(11) 99999-8888',
          avatar: 'https://avatar.com/new.jpg'
        })
      );
    });

    it('Administrador pode criar ou alterar qualquer perfil e role', async () => {
      const adminDb = testEnv.authenticatedContext('admin_uid', { email: ADMIN_EMAIL }).firestore();

      await assertSucceeds(
        adminDb.doc('users/coach_new_uid').set({
          id: 'coach_new_uid',
          email: 'coach_novo@lmteam.com',
          name: 'Novo Coach Oficial',
          role: 'coach',
          status: 'Ativo'
        })
      );
    });
  });

  // ============================================================================
  // PILAR 3: ISOLAMENTO DE DADOS DO ATLETA (/athletes/{athleteId})
  // ============================================================================
  describe('3. Isolamento e Proteção de Dados de Saúde do Atleta', () => {
    it('Atleta 1 pode ler e atualizar suas próprias métricas em /athletes/athlete_1_uid', async () => {
      const athleteDb = testEnv.authenticatedContext('athlete_1_uid', { email: 'atleta1@gmail.com' }).firestore();

      // Leitura permitida
      await assertSucceeds(athleteDb.doc('athletes/athlete_1_uid').get());

      // Atualização de peso permitida
      await assertSucceeds(
        athleteDb.doc('athletes/athlete_1_uid').update({
          currentWeightKg: 85.0
        })
      );
    });

    it('DIRTY DOZEN #3: Atleta 1 NÃO pode ler nem alterar dados do Atleta 2', async () => {
      const athlete1Db = testEnv.authenticatedContext('athlete_1_uid', { email: 'atleta1@gmail.com' }).firestore();

      await assertFails(athlete1Db.doc('athletes/athlete_2_uid').get());
      await assertFails(
        athlete1Db.doc('athletes/athlete_2_uid').update({
          currentWeightKg: 50.0
        })
      );
    });

    it('DIRTY DOZEN #10: Atleta 1 NÃO pode alterar ou criar check-ins para Atleta 2', async () => {
      const athlete1Db = testEnv.authenticatedContext('athlete_1_uid', { email: 'atleta1@gmail.com' }).firestore();

      await assertFails(
        athlete1Db.doc('athletes/athlete_2_uid/exercise_set_checkins/set_malicioso').set({
          id: 'set_malicioso',
          athleteId: 'athlete_2_uid',
          isCompleted: true
        })
      );
    });

    it('Atleta 1 pode criar e ler seus próprios check-ins', async () => {
      const athlete1Db = testEnv.authenticatedContext('athlete_1_uid', { email: 'atleta1@gmail.com' }).firestore();

      await assertSucceeds(
        athlete1Db.doc('athletes/athlete_1_uid/exercise_set_checkins/set_01').set({
          id: 'set_01',
          athleteId: 'athlete_1_uid',
          weightKgLogged: 100,
          isCompleted: true
        })
      );

      await assertSucceeds(
        athlete1Db.doc('athletes/athlete_1_uid/exercise_set_checkins/set_01').get()
      );
    });
  });

  // ============================================================================
  // PILAR 4: ACESSO DE PROFISSIONAIS BASEADO EM VÍNCULO (ABAC)
  // ============================================================================
  describe('4. Acesso Restrito por Vínculo de Atleta (Coach/Nutricionista/Médico)', () => {
    it('Coach 1 (vinculado ao Atleta 1) PODE ler dados e criar prescrições para Atleta 1', async () => {
      const coach1Db = testEnv.authenticatedContext('coach_1_uid', { email: 'coach1@lmteam.com' }).firestore();

      // Pode ler perfil do Atleta 1
      await assertSucceeds(coach1Db.doc('athletes/athlete_1_uid').get());

      // Pode criar prescrição de treino para Atleta 1
      await assertSucceeds(
        coach1Db.doc('prescriptions/workouts/athletes/athlete_1_uid').set({
          athleteId: 'athlete_1_uid',
          prescribedBy: 'coach_1_uid',
          splitName: 'Treino A - Peitoral & Tríceps'
        })
      );
    });

    it('DIRTY DOZEN #5: Coach 2 (NÃO vinculado ao Atleta 1) NÃO PODE ler dados de Atleta 1', async () => {
      const coach2Db = testEnv.authenticatedContext('coach_2_uid', { email: 'coach2@lmteam.com' }).firestore();

      // Leitura negada
      await assertFails(coach2Db.doc('athletes/athlete_1_uid').get());

      // Escrita de prescrição negada
      await assertFails(
        coach2Db.doc('prescriptions/workouts/athletes/athlete_1_uid').set({
          athleteId: 'athlete_1_uid',
          prescribedBy: 'coach_2_uid'
        })
      );
    });

    it('DIRTY DOZEN #4: Atleta 1 PODE ler sua prescrição, mas NÃO PODE modificá-la', async () => {
      // Cria prescrição primeiro via coach
      const coach1Db = testEnv.authenticatedContext('coach_1_uid', { email: 'coach1@lmteam.com' }).firestore();
      await coach1Db.doc('prescriptions/workouts/athletes/athlete_1_uid').set({
        athleteId: 'athlete_1_uid',
        splitName: 'Treino A'
      });

      const athlete1Db = testEnv.authenticatedContext('athlete_1_uid', { email: 'atleta1@gmail.com' }).firestore();

      // Atleta lê com sucesso
      await assertSucceeds(
        athlete1Db.doc('prescriptions/workouts/athletes/athlete_1_uid').get()
      );

      // Atleta tenta alterar a prescrição oficial: DEVE FALHAR
      await assertFails(
        athlete1Db.doc('prescriptions/workouts/athletes/athlete_1_uid').update({
          splitName: 'Treino Hackeado'
        })
      );
    });

    it('MODALIDADE: Coach NÃO PODE prescrever nutrição e Nutricionista NÃO PODE prescrever treino', async () => {
      const coach1Db = testEnv.authenticatedContext('coach_1_uid', { email: 'coach1@lmteam.com' }).firestore();
      const nutri1Db = testEnv.authenticatedContext('nutri_1_uid', { email: 'nutri1@lmteam.com' }).firestore();

      // Coach 1 tenta prescrever dieta (nutrition): DEVE FALHAR (somente coach para workouts)
      await assertFails(
        coach1Db.doc('prescriptions/nutrition/athletes/athlete_1_uid').set({
          athleteId: 'athlete_1_uid',
          calories: 2500,
          prescribedBy: 'coach_1_uid'
        })
      );

      // Nutri 1 PODE prescrever dieta (nutrition)
      await assertSucceeds(
        nutri1Db.doc('prescriptions/nutrition/athletes/athlete_1_uid').set({
          athleteId: 'athlete_1_uid',
          calories: 2500,
          prescribedBy: 'nutri_1_uid'
        })
      );

      // Nutri 1 tenta prescrever treino (workouts): DEVE FALHAR (somente coach para workouts)
      await assertFails(
        nutri1Db.doc('prescriptions/workouts/athletes/athlete_1_uid').set({
          athleteId: 'athlete_1_uid',
          splitName: 'Treino B',
          prescribedBy: 'nutri_1_uid'
        })
      );
    });

    it('LISTAGEM & ISOLAMENTO: Profissional não vinculado NÃO PODE listar prescrições nem atletas de outro vínculo', async () => {
      const coach1Db = testEnv.authenticatedContext('coach_1_uid', { email: 'coach1@lmteam.com' }).firestore();
      const coach2Db = testEnv.authenticatedContext('coach_2_uid', { email: 'coach2@lmteam.com' }).firestore();

      // Coach 1 pode listar suas prescrições para Atleta 1
      await assertSucceeds(
        coach1Db.collection('prescriptions/workouts/athletes/athlete_1_uid/splits').get()
      );

      // Coach 2 (não vinculado a Atleta 1) NÃO PODE listar subcoleções ou prescrições de Atleta 1
      await assertFails(
        coach2Db.collection('prescriptions/workouts/athletes/athlete_1_uid/splits').get()
      );

      // Coach 2 NÃO PODE acessar prescrições por nenhum caminho coincidente ou wildcard amplo
      await assertFails(
        coach2Db.doc('prescriptions/arbitrary_path/athletes/athlete_1_uid').get()
      );
      await assertFails(
        coach2Db.collection('prescriptions').get()
      );

      // Listagem de atletas: Coach 1 pode consultar com filtro de vínculo (coachId == 'coach_1_uid')
      await assertSucceeds(
        coach1Db.collection('athletes').where('coachId', '==', 'coach_1_uid').get()
      );

      // Coach 2 NÃO PODE consultar atletas com filtro de outro profissional (coachId == 'coach_1_uid')
      await assertFails(
        coach2Db.collection('athletes').where('coachId', '==', 'coach_1_uid').get()
      );
    });
  });

  // ============================================================================
  // PILAR 5: GOVERNANÇA DE PROFISSIONAIS E BANCO DE EXERCÍCIOS
  // ============================================================================
  describe('5. Governança de Prescritores e Catálogo de Exercícios', () => {
    it('DIRTY DOZEN #6: Coach NÃO pode criar novos prescritores em /prescribers', async () => {
      const coach1Db = testEnv.authenticatedContext('coach_1_uid', { email: 'coach1@lmteam.com' }).firestore();

      await assertFails(
        coach1Db.doc('prescribers/doc_novo').set({
          id: 'doc_novo',
          name: 'Dr. Ilegal',
          roleType: 'Médico do Esporte',
          status: 'Ativo'
        })
      );
    });

    it('Admin PODE criar e excluir prescritores em /prescribers', async () => {
      const adminDb = testEnv.authenticatedContext('admin_uid', { email: ADMIN_EMAIL }).firestore();

      await assertSucceeds(
        adminDb.doc('prescribers/doc_novo').set({
          id: 'doc_novo',
          name: 'Dr. Lucas Médico',
          roleType: 'Médico do Esporte',
          email: 'medico@lmteam.com',
          status: 'Ativo'
        })
      );

      await assertSucceeds(adminDb.doc('prescribers/doc_novo').delete());
    });

    it('Coach e Admin podem cadastrar novos exercícios no Banco Oficial', async () => {
      const coach1Db = testEnv.authenticatedContext('coach_1_uid', { email: 'coach1@lmteam.com' }).firestore();

      await assertSucceeds(
        coach1Db.doc('exercises/ex_novo_leg_press').set({
          id: 'ex_novo_leg_press',
          name: 'Leg Press 45',
          targetMuscle: 'Quadríceps',
          defaultRestSeconds: 90
        })
      );
    });

    it('DIRTY DOZEN #9: Atleta NÃO pode excluir exercícios do Banco Oficial', async () => {
      const athlete1Db = testEnv.authenticatedContext('athlete_1_uid', { email: 'atleta1@gmail.com' }).firestore();

      await assertFails(athlete1Db.doc('exercises/ex_supino_reto').delete());
    });
  });
});
