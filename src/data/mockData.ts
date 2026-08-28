import {
  AthleteProfile,
  NutritionPlan,
  WorkoutSplit,
  WorkoutTemplate,
  SupplementItem,
  SupplementFormulaTemplate,
  FitRecipe,
  FoodSubstitution,
  PrescriberProfile
} from '../types';

export const DEFAULT_ADMIN: PrescriberProfile = {
  id: 'presc-admin-01',
  name: 'Emanuel Caires',
  roleType: 'Administrador Geral',
  phone: '(61) 98341-4090',
  birthDate: '1995-04-15',
  email: 'emanuelcairess@gmail.com',
  accessPassword: 'lmteam',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  isMaster: true,
  isAdmin: true,
  status: 'Ativo',
  crm_crn_cref: 'ADMIN-001',
  bio: 'Administrador Geral da LM Team Assessoria. Gestão executiva de prescritores, protocolos e segurança.',
  createdAt: '2026-01-01',
  requiresPasswordChange: true
};

export const INITIAL_PRESCRIBERS: PrescriberProfile[] = [
  DEFAULT_ADMIN,
  {
    id: 'presc-master-01',
    name: 'Dr. Lucas Mendes',
    roleType: 'Head Coach',
    phone: '(11) 99887-1122',
    birthDate: '1988-08-20',
    email: 'lucas.mendes@lmteam.com.br',
    accessPassword: 'coachmaster2026',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
    isMaster: true,
    isAdmin: false,
    status: 'Ativo',
    crm_crn_cref: 'CREF 089123-G/SP',
    bio: 'Prescritor Master & Head Coach. Especialista em biomecânica aplicada e periodização de alta performance.',
    createdAt: '2026-01-10',
    createdBy: {
      id: 'presc-admin-01',
      name: 'Emanuel Caires',
      role: 'Administrador Geral'
    }
  },
  {
    id: 'presc-nutri-01',
    name: 'Dra. Marina Valente',
    roleType: 'Nutricionista',
    phone: '(11) 98123-4567',
    birthDate: '1992-11-15',
    email: 'marina.valente@lmteam.com.br',
    accessPassword: 'nutriteam2026',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    isMaster: false,
    isAdmin: false,
    status: 'Ativo',
    crm_crn_cref: 'CRN-3 45890',
    bio: 'Nutricionista Esportiva e Clínica Funcional. Estratégias metabólicas para recomposição corporal e ganho de massa.',
    createdAt: '2026-02-01',
    createdBy: {
      id: 'presc-master-01',
      name: 'Dr. Lucas Mendes',
      role: 'Head Coach'
    }
  },
  {
    id: 'presc-med-01',
    name: 'Dr. Rodrigo Albuquerque',
    roleType: 'Médico do Esporte',
    phone: '(11) 97234-5678',
    birthDate: '1985-03-30',
    email: 'rodrigo.albuquerque@lmteam.com.br',
    accessPassword: 'medteam2026',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    isMaster: false,
    isAdmin: false,
    status: 'Ativo',
    crm_crn_cref: 'CRM-SP 182490 / RQE 9201',
    bio: 'Médico do Esporte e Fisiologia do Exercício. Acompanhamento hormonal, exames bioquímicos e saúde metabólica.',
    createdAt: '2026-02-15',
    createdBy: {
      id: 'presc-admin-01',
      name: 'Emanuel Caires',
      role: 'Administrador Geral'
    }
  },
  {
    id: 'presc-fisio-01',
    name: 'Dra. Camila Rocha',
    roleType: 'Fisioterapeuta',
    phone: '(11) 96345-6789',
    birthDate: '1994-07-22',
    email: 'camila.rocha@lmteam.com.br',
    accessPassword: 'fisioteam2026',
    avatar: 'https://images.unsplash.com/photo-1594824813689-f772e0b57e79?w=400&auto=format&fit=crop&q=80',
    isMaster: false,
    isAdmin: false,
    status: 'Ativo',
    crm_crn_cref: 'CREFITO-3 29104',
    bio: 'Fisioterapeuta Esportiva. Prevenção de lesões, mobilidade articular e recuperação neuromuscular acelerada.',
    createdAt: '2026-03-01',
    createdBy: {
      id: 'presc-master-01',
      name: 'Dr. Lucas Mendes',
      role: 'Head Coach'
    }
  }
];

export const INITIAL_ATHLETE: AthleteProfile = {
  id: 'ath-01',
  name: 'Emanuel Caires',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  email: 'emanuelcairess@gmail.com',
  phone: '(11) 98765-4321',
  cpf: '123.456.789-00',
  birthDate: '1999-04-15',
  accessPassword: 'lmteam2026',
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
  cardioTargetKcal: 300,
  measurementsHistory: [
    {
      date: '2026-06-15',
      weightKg: 77.2,
      heightCm: 178,
      bodyFatPercentage: 11.2,
      muscleMassKg: 38.6,
      chestCm: 108.5,
      shouldersCm: 124.0,
      waistCm: 80.5,
      abdomenCm: 83.0,
      rightArmCm: 39.8,
      leftArmCm: 39.5,
      rightThighCm: 60.2,
      leftThighCm: 59.8,
      calvesCm: 39.0,
      glutesCm: 99.0,
      neckCm: 39.0,
      photos: {
        front: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
        side: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
        back: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80'
      },
      notes: 'Início da fase preparatória de ganho limpo de massa.'
    },
    {
      date: '2026-07-20',
      weightKg: 78.6,
      heightCm: 178,
      bodyFatPercentage: 10.5,
      muscleMassKg: 39.7,
      chestCm: 110.2,
      shouldersCm: 126.0,
      waistCm: 79.0,
      abdomenCm: 81.8,
      rightArmCm: 40.7,
      leftArmCm: 40.4,
      rightThighCm: 61.5,
      leftThighCm: 61.2,
      calvesCm: 39.5,
      glutesCm: 100.2,
      neckCm: 39.2,
      photos: {
        front: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
        side: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
        back: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80'
      },
      notes: 'Boa resposta ao ajuste de carboidratos intra e pós treino.'
    },
    {
      date: '2026-08-20',
      weightKg: 79.8,
      heightCm: 178,
      bodyFatPercentage: 9.8,
      muscleMassKg: 40.8,
      chestCm: 112.0,
      shouldersCm: 128.5,
      waistCm: 78.0,
      abdomenCm: 80.5,
      rightArmCm: 41.5,
      leftArmCm: 41.2,
      rightThighCm: 62.8,
      leftThighCm: 62.4,
      calvesCm: 40.2,
      glutesCm: 101.5,
      neckCm: 39.5,
      photos: {
        front: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
        back: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
        side: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80'
      },
      notes: 'Avaliação atual: Cintura reduziu e braços/peito expandiram com excelente densidade.'
    }
  ]
};

export const OTHER_ATHLETES: AthleteProfile[] = [
  INITIAL_ATHLETE,
  {
    id: 'ath-02',
    name: 'Camila Rodrigues',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    email: 'camila.fit@gmail.com',
    phone: '(11) 99123-4567',
    cpf: '234.567.890-11',
    birthDate: '1997-08-24',
    accessPassword: 'lmteam2026',
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
    cardioTargetKcal: 400,
    measurementsHistory: [
      {
        date: '2026-06-10',
        weightKg: 66.5,
        heightCm: 165,
        bodyFatPercentage: 16.5,
        muscleMassKg: 28.5,
        chestCm: 90.0,
        shouldersCm: 104.0,
        waistCm: 68.0,
        abdomenCm: 71.5,
        rightArmCm: 30.5,
        leftArmCm: 30.2,
        rightThighCm: 61.5,
        leftThighCm: 61.2,
        calvesCm: 37.0,
        glutesCm: 104.5,
        neckCm: 32.5,
        notes: 'Início do protocolo de pre-contest wellness.'
      },
      {
        date: '2026-07-15',
        weightKg: 64.8,
        heightCm: 165,
        bodyFatPercentage: 14.8,
        muscleMassKg: 28.9,
        chestCm: 89.0,
        shouldersCm: 105.2,
        waistCm: 66.0,
        abdomenCm: 69.0,
        rightArmCm: 31.0,
        leftArmCm: 30.8,
        rightThighCm: 62.0,
        leftThighCm: 61.8,
        calvesCm: 37.2,
        glutesCm: 105.0,
        neckCm: 32.5,
        notes: 'Ótima resposta de densidade de glúteos e definição abdominal.'
      },
      {
        date: '2026-08-18',
        weightKg: 63.4,
        heightCm: 165,
        bodyFatPercentage: 13.2,
        muscleMassKg: 29.2,
        chestCm: 88.5,
        shouldersCm: 106.0,
        waistCm: 64.5,
        abdomenCm: 67.0,
        rightArmCm: 31.2,
        leftArmCm: 31.0,
        rightThighCm: 62.4,
        leftThighCm: 62.1,
        calvesCm: 37.5,
        glutesCm: 105.5,
        neckCm: 32.5,
        photos: {
          front: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
          back: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
          side: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80'
        },
        notes: 'Cintura afinada para 64.5cm e manutenção total do volume de membros inferiores.'
      }
    ]
  },
  {
    id: 'ath-03',
    name: 'Renan Silveira',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    email: 'renan.silveira@outlook.com',
    phone: '(21) 98888-7777',
    cpf: '345.678.901-22',
    birthDate: '1994-11-03',
    accessPassword: 'lmteam2026',
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
    cardioTargetKcal: 350,
    measurementsHistory: [
      {
        date: '2026-06-01',
        weightKg: 91.0,
        heightCm: 182,
        bodyFatPercentage: 12.0,
        muscleMassKg: 46.5,
        chestCm: 118.0,
        shouldersCm: 134.0,
        waistCm: 86.0,
        abdomenCm: 89.0,
        rightArmCm: 44.0,
        leftArmCm: 43.8,
        rightThighCm: 67.0,
        leftThighCm: 66.5,
        calvesCm: 42.0,
        glutesCm: 106.0,
        neckCm: 42.0,
        notes: 'Início da fase de hipertrofia pesada.'
      },
      {
        date: '2026-07-05',
        weightKg: 92.8,
        heightCm: 182,
        bodyFatPercentage: 12.2,
        muscleMassKg: 47.8,
        chestCm: 120.0,
        shouldersCm: 136.5,
        waistCm: 86.5,
        abdomenCm: 89.5,
        rightArmCm: 44.8,
        leftArmCm: 44.5,
        rightThighCm: 68.2,
        leftThighCm: 67.8,
        calvesCm: 42.5,
        glutesCm: 107.0,
        neckCm: 42.5,
        notes: 'Progressão de cargas consistente nos compostos.'
      },
      {
        date: '2026-08-10',
        weightKg: 94.2,
        heightCm: 182,
        bodyFatPercentage: 12.1,
        muscleMassKg: 49.0,
        chestCm: 122.5,
        shouldersCm: 138.0,
        waistCm: 87.0,
        abdomenCm: 90.0,
        rightArmCm: 45.6,
        leftArmCm: 45.3,
        rightThighCm: 69.5,
        leftThighCm: 69.0,
        calvesCm: 43.0,
        glutesCm: 108.0,
        neckCm: 43.0,
        photos: {
          front: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
          back: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
          side: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80'
        },
        notes: 'Ganho sólido de mais de 2.5kg de massa magra nos últimos 60 dias.'
      }
    ]
  }
];

export const INITIAL_NUTRITION_PLAN: NutritionPlan = {
  dailyTargetCalories: 2183,
  dailyTargetProteinG: 152, // 2.0 g/kg (base 79.8kg)
  dailyTargetCarbsG: 259,
  dailyTargetFatG: 59.9,
  waterIntakeLiters: 4.0,
  meals: [
    {
      id: 'meal-1',
      number: 1,
      name: 'Refeição 1 (Café da Manhã)',
      timeSchedule: '07:30',
      targetProteinG: 33.0,
      targetCarbsG: 53.0,
      targetFatG: 19.5,
      targetCaloriesKcal: 519.5,
      isCompleted: true,
      notes: 'Tomar Creatina 10g junto a esta refeição.',
      foods: [
        {
          id: 'f1-1',
          name: 'Ovos Inteiros Mexidos',
          portion: '3 unidades (150g)',
          amountGrams: 150,
          proteinG: 18.0,
          carbsG: 1.5,
          fatG: 15.0,
          caloriesKcal: 213,
          category: 'proteina',
          isCompleted: true
        },
        {
          id: 'f1-2',
          name: 'Peito de Frango Desfiado',
          portion: '50g',
          amountGrams: 50,
          proteinG: 15.0,
          carbsG: 0.0,
          fatG: 1.5,
          caloriesKcal: 75,
          category: 'proteina',
          isCompleted: true
        },
        {
          id: 'f1-3',
          name: 'Pão de Forma Integral (ou Cuscuz 120g)',
          portion: '2 fatias (50g)',
          amountGrams: 50,
          proteinG: 4.5,
          carbsG: 24.0,
          fatG: 1.5,
          caloriesKcal: 125,
          category: 'carboidrato',
          isCompleted: true
        },
        {
          id: 'f1-4',
          name: 'Mamão Papaia Fresco',
          portion: '150g',
          amountGrams: 150,
          proteinG: 1.0,
          carbsG: 16.0,
          fatG: 0.2,
          caloriesKcal: 68,
          category: 'carboidrato',
          isCompleted: true
        },
        {
          id: 'f1-5',
          name: 'Azeite de Oliva Extra Virgem',
          portion: '1 colher de chá (5g)',
          amountGrams: 5,
          proteinG: 0.0,
          carbsG: 0.0,
          fatG: 5.0,
          caloriesKcal: 45,
          category: 'gordura',
          isCompleted: true
        }
      ]
    },
    {
      id: 'meal-2',
      number: 2,
      name: 'Refeição 2 (Almoço)',
      timeSchedule: '12:30',
      targetProteinG: 36.5,
      targetCarbsG: 44.0,
      targetFatG: 5.7,
      targetCaloriesKcal: 373.3,
      isCompleted: true,
      notes: 'Salada de folhas verdes, pepino e tomate à vontade.',
      foods: [
        {
          id: 'f2-1',
          name: 'Peito de Frango Grelhado',
          portion: '120g pesado pronto',
          amountGrams: 120,
          proteinG: 34.0,
          carbsG: 0.0,
          fatG: 3.5,
          caloriesKcal: 170,
          category: 'proteina',
          isCompleted: true
        },
        {
          id: 'f2-2',
          name: 'Arroz Branco Cozido',
          portion: '150g',
          amountGrams: 150,
          proteinG: 3.5,
          carbsG: 42.0,
          fatG: 0.5,
          caloriesKcal: 185,
          category: 'carboidrato',
          isCompleted: true
        },
        {
          id: 'f2-3',
          name: 'Feijão Carioca Cozido (Caldo ralo)',
          portion: '60g',
          amountGrams: 60,
          proteinG: 3.0,
          carbsG: 9.0,
          fatG: 0.4,
          caloriesKcal: 52,
          category: 'carboidrato',
          isCompleted: true
        },
        {
          id: 'f2-4',
          name: 'Mix de Folhas Verdes & Legumes Cozidos',
          portion: 'Livre',
          amountGrams: 100,
          proteinG: 1.5,
          carbsG: 3.0,
          fatG: 0.2,
          caloriesKcal: 20,
          category: 'vegetal',
          isCompleted: true
        }
      ]
    },
    {
      id: 'meal-3',
      number: 3,
      name: 'Refeição 3 (Lanche da Tarde / Pré-Treino)',
      timeSchedule: '16:30',
      targetProteinG: 46.0,
      targetCarbsG: 118.0,
      targetFatG: 29.0,
      targetCaloriesKcal: 917.0,
      isCompleted: false,
      notes: 'Consumir 1h30 antes do início do treinamento de força.',
      foods: [
        {
          id: 'f3-1',
          name: 'Aveia em Flocos Finos',
          portion: '60g',
          amountGrams: 60,
          proteinG: 8.5,
          carbsG: 40.0,
          fatG: 4.5,
          caloriesKcal: 235,
          category: 'carboidrato',
          isCompleted: false
        },
        {
          id: 'f3-2',
          name: 'Banana Prata Fatiada',
          portion: '2 unidades médias (160g)',
          amountGrams: 160,
          proteinG: 2.0,
          carbsG: 42.0,
          fatG: 0.4,
          caloriesKcal: 175,
          category: 'carboidrato',
          isCompleted: false
        },
        {
          id: 'f3-3',
          name: 'Whey Protein Concentrado 80%',
          portion: '1.5 dosador (45g)',
          amountGrams: 45,
          proteinG: 36.0,
          carbsG: 3.5,
          fatG: 2.5,
          caloriesKcal: 180,
          category: 'suplemento',
          isCompleted: false
        },
        {
          id: 'f3-4',
          name: 'Iogurte Natural Desnatado',
          portion: '1 pote (160g)',
          amountGrams: 160,
          proteinG: 6.5,
          carbsG: 9.0,
          fatG: 0.0,
          caloriesKcal: 65,
          category: 'proteina',
          isCompleted: false
        },
        {
          id: 'f3-5',
          name: 'Pasta de Amendoim Integral',
          portion: '30g (1 colher de sopa cheia)',
          amountGrams: 30,
          proteinG: 8.5,
          carbsG: 6.0,
          fatG: 15.0,
          caloriesKcal: 185,
          category: 'gordura',
          isCompleted: false
        },
        {
          id: 'f3-6',
          name: 'Morangos Frescos',
          portion: '100g',
          amountGrams: 100,
          proteinG: 1.0,
          carbsG: 7.5,
          fatG: 0.3,
          caloriesKcal: 35,
          category: 'carboidrato',
          isCompleted: false
        }
      ]
    },
    {
      id: 'meal-4',
      number: 4,
      name: 'Refeição 4 (Jantar / Pós-Treino)',
      timeSchedule: '20:30',
      targetProteinG: 36.5,
      targetCarbsG: 44.0,
      targetFatG: 5.7,
      targetCaloriesKcal: 373.2,
      isCompleted: false,
      notes: 'Tomar Ômega 3 (4 cápsulas) 20 minutos após o jantar.',
      foods: [
        {
          id: 'f4-1',
          name: 'Patinho Moído Grelhado / Frango',
          portion: '130g',
          amountGrams: 130,
          proteinG: 36.0,
          carbsG: 0.0,
          fatG: 5.0,
          caloriesKcal: 195,
          category: 'proteina',
          isCompleted: false
        },
        {
          id: 'f4-2',
          name: 'Batata Inglesa Cozida ou Arroz',
          portion: '200g',
          amountGrams: 200,
          proteinG: 4.0,
          carbsG: 38.0,
          fatG: 0.2,
          caloriesKcal: 170,
          category: 'carboidrato',
          isCompleted: false
        },
        {
          id: 'f4-3',
          name: 'Legumes no Vapor (Brócolis, Cenoura, Abobrinha)',
          portion: '150g',
          amountGrams: 150,
          proteinG: 3.0,
          carbsG: 6.0,
          fatG: 0.5,
          caloriesKcal: 45,
          category: 'vegetal',
          isCompleted: false
        }
      ]
    }
  ]
};

export const WORKOUT_SPLITS: WorkoutSplit[] = [
  {
    id: 'w-a',
    code: 'Treino A',
    name: 'Upper Body (Membros Superiores Foco Peitoral & Dorsal)',
    dayOfWeek: 'Segunda-feira',
    targetMuscleGroups: ['Peitoral', 'Dorsal', 'Deltoides', 'Braços'],
    estimatedDurationMinutes: 65,
    isCompletedToday: false,
    cardioOrientation: {
      enabled: true,
      type: 'Esteira Inclinada',
      durationMinutes: 25,
      intensity: 'Zona 2 (120 - 135 BPM)',
      targetKcal: 200,
      heartRateZone: '120 - 135 BPM',
      timing: 'Pós-Treino',
      instructions: 'Realizar imediatamente após o treino de força. Inclinação de 8.0%, velocidade 5.2 a 5.6 km/h. Não segurar nas barras de apoio para maximizar o gasto metabólico.'
    },
    exercises: [
      {
        id: 'ex-a1',
        name: 'Supino Inclinado com Halteres',
        targetMuscle: 'Peitoral Superior',
        restSeconds: 90,
        cadence: '3010',
        technicalNotes: 'Banco a 30°. Amplitude máxima sem perder adução escapular. Última série com Back-off set (-20% carga até a falha).',
        sets: [
          { setNumber: 1, repsTarget: '12', weightKgLogged: 28, technique: 'Warm-up', isCompleted: true, rpe: 6 },
          { setNumber: 2, repsTarget: '8-10', weightKgLogged: 36, technique: 'Normal', isCompleted: true, rpe: 8 },
          { setNumber: 3, repsTarget: '8-10', weightKgLogged: 38, technique: 'Normal', isCompleted: false, rpe: 9 },
          { setNumber: 4, repsTarget: '8 + Falha', weightKgLogged: 38, technique: 'Back-off set', isCompleted: false, rpe: 10 }
        ]
      },
      {
        id: 'ex-a2',
        name: 'Puxada Frontal Aberta (Lat Pulldown)',
        targetMuscle: 'Dorsais / Grande Dorsal',
        restSeconds: 75,
        cadence: '2011',
        technicalNotes: 'Puxar direcionando os cotovelos aos bolsos da calça. Pausa de 1s na contração máxima.',
        sets: [
          { setNumber: 1, repsTarget: '10-12', weightKgLogged: 65, technique: 'Normal', isCompleted: false, rpe: 8 },
          { setNumber: 2, repsTarget: '8-10', weightKgLogged: 75, technique: 'Normal', isCompleted: false, rpe: 9 },
          { setNumber: 3, repsTarget: '8 + Drop', weightKgLogged: 75, technique: 'Drop set', isCompleted: false, rpe: 10 }
        ]
      },
      {
        id: 'ex-a3',
        name: 'Desenvolvimento Militar com Halteres',
        targetMuscle: 'Deltoide Anterior / Medial',
        restSeconds: 90,
        cadence: '2010',
        technicalNotes: 'Tronco firme no encosto, sem hiperextensão lombar.',
        sets: [
          { setNumber: 1, repsTarget: '10-12', weightKgLogged: 22, technique: 'Normal', isCompleted: false, rpe: 8 },
          { setNumber: 2, repsTarget: '8-10', weightKgLogged: 26, technique: 'Normal', isCompleted: false, rpe: 9 },
          { setNumber: 3, repsTarget: '8-10', weightKgLogged: 26, technique: 'Normal', isCompleted: false, rpe: 9.5 }
        ]
      },
      {
        id: 'ex-a4',
        name: 'Remada Baixa no Triângulo',
        targetMuscle: 'Miolo de Costas / Romboides',
        restSeconds: 75,
        cadence: '2111',
        technicalNotes: 'Cluster Set: 4 reps, pausa de 15s, + 4 reps, pausa de 15s, + 4 reps.',
        sets: [
          { setNumber: 1, repsTarget: '10-12', weightKgLogged: 60, technique: 'Normal', isCompleted: false, rpe: 8 },
          { setNumber: 2, repsTarget: '8-10', weightKgLogged: 70, technique: 'Normal', isCompleted: false, rpe: 8.5 },
          { setNumber: 3, repsTarget: '4+4+4 reps', weightKgLogged: 75, technique: 'Cluster set', isCompleted: false, rpe: 10 }
        ]
      },
      {
        id: 'ex-a5',
        name: 'Elevação Lateral na Polia (Cabo)',
        targetMuscle: 'Deltoide Lateral',
        restSeconds: 60,
        cadence: '2012',
        technicalNotes: 'Altura da mão no nível dos ombros, controle absoluto da fase excêntrica.',
        sets: [
          { setNumber: 1, repsTarget: '12-15', weightKgLogged: 12.5, technique: 'Normal', isCompleted: false, rpe: 8 },
          { setNumber: 2, repsTarget: '12-15', weightKgLogged: 12.5, technique: 'Normal', isCompleted: false, rpe: 9 },
          { setNumber: 3, repsTarget: '12 + Drop', weightKgLogged: 12.5, technique: 'Drop set', isCompleted: false, rpe: 10 }
        ]
      }
    ]
  },
  {
    id: 'w-b',
    code: 'Treino B',
    name: 'Lower Body 1 (Foco Quadríceps & Panturrilhas)',
    dayOfWeek: 'Terça-feira',
    targetMuscleGroups: ['Quadríceps', 'Adutores', 'Panturrilhas'],
    estimatedDurationMinutes: 70,
    isCompletedToday: false,
    cardioOrientation: {
      enabled: false,
      type: 'Descanso Ativo / Alongamento',
      durationMinutes: 0,
      intensity: 'Nenhum',
      targetKcal: 0,
      timing: 'Pós-Treino',
      instructions: 'Sem cardio pós-treino hoje devido ao altíssimo desgaste neuromuscular do treino de membros inferiores.'
    },
    exercises: [
      {
        id: 'ex-b1',
        name: 'Agachamento Hack Machine',
        targetMuscle: 'Quadríceps',
        restSeconds: 90,
        cadence: '3010',
        technicalNotes: 'Pés na base inferior para enfatizar vastos. Descida controlada e profunda.',
        sets: [
          { setNumber: 1, repsTarget: '12-15', weightKgLogged: 80, technique: 'Warm-up', isCompleted: false, rpe: 6 },
          { setNumber: 2, repsTarget: '8-10', weightKgLogged: 120, technique: 'Normal', isCompleted: false, rpe: 8 },
          { setNumber: 3, repsTarget: '8-10', weightKgLogged: 140, technique: 'Normal', isCompleted: false, rpe: 9 },
          { setNumber: 4, repsTarget: '8 + Back-off', weightKgLogged: 140, technique: 'Back-off set', isCompleted: false, rpe: 10 }
        ]
      },
      {
        id: 'ex-b2',
        name: 'Cadeira Extensora',
        targetMuscle: 'Reto Femoral / Vastos',
        restSeconds: 70,
        cadence: '2012',
        technicalNotes: 'Pausa de 2s no topo em contração máxima.',
        sets: [
          { setNumber: 1, repsTarget: '12-15', weightKgLogged: 60, technique: 'Normal', isCompleted: false, rpe: 8 },
          { setNumber: 2, repsTarget: '10-12', weightKgLogged: 75, technique: 'Normal', isCompleted: false, rpe: 9 },
          { setNumber: 3, repsTarget: '10 + Triple Drop', weightKgLogged: 75, technique: 'Drop set', isCompleted: false, rpe: 10 }
        ]
      },
      {
        id: 'ex-b3',
        name: 'Leg Press 45°',
        targetMuscle: 'Quadríceps & Glúteos',
        restSeconds: 90,
        technicalNotes: 'Amplitude completa sem desgrudar quadril do encosto.',
        sets: [
          { setNumber: 1, repsTarget: '10-12', weightKgLogged: 240, technique: 'Normal', isCompleted: false, rpe: 8 },
          { setNumber: 2, repsTarget: '10-12', weightKgLogged: 280, technique: 'Normal', isCompleted: false, rpe: 9 },
          { setNumber: 3, repsTarget: '8-10', weightKgLogged: 320, technique: 'Falha Concêntrica', isCompleted: false, rpe: 10 }
        ]
      },
      {
        id: 'ex-b4',
        name: 'Gêmeos em Pé (Panturrilhas no Smith / Máquina)',
        targetMuscle: 'Gastrocnêmio',
        restSeconds: 60,
        technicalNotes: 'Alongamento total embaixo (2s de pausa) para anular reflexo miotático.',
        sets: [
          { setNumber: 1, repsTarget: '15', weightKgLogged: 70, technique: 'Normal', isCompleted: false, rpe: 8 },
          { setNumber: 2, repsTarget: '12-15', weightKgLogged: 85, technique: 'Normal', isCompleted: false, rpe: 9 },
          { setNumber: 3, repsTarget: '12-15 + Rest Pause', weightKgLogged: 85, technique: 'Rest-pause', isCompleted: false, rpe: 10 }
        ]
      }
    ]
  },
  {
    id: 'w-c',
    code: 'Treino C',
    name: 'Push (Peitoral, Ombros & Tríceps)',
    dayOfWeek: 'Quarta-feira',
    targetMuscleGroups: ['Peitoral Maior', 'Deltoide Anterior/Lateral', 'Tríceps Braquial'],
    estimatedDurationMinutes: 60,
    isCompletedToday: false,
    cardioOrientation: {
      enabled: true,
      type: 'Bike Ergométrica / AirBike',
      durationMinutes: 30,
      intensity: 'Moderada Contínua',
      targetKcal: 220,
      heartRateZone: '125 - 135 BPM',
      timing: 'Pós-Treino',
      instructions: 'Pedalar com cadência estável entre 75-85 RPM. Manter postura ereta e respiração nasal controlada.'
    },
    exercises: [
      {
        id: 'ex-c1',
        name: 'Crucifixo Inclinado no Cabo (Polia Baixa)',
        targetMuscle: 'Peitoral Clavicular',
        restSeconds: 70,
        sets: [
          { setNumber: 1, repsTarget: '12-15', weightKgLogged: 15, technique: 'Normal', isCompleted: false },
          { setNumber: 2, repsTarget: '10-12', weightKgLogged: 17.5, technique: 'Normal', isCompleted: false },
          { setNumber: 3, repsTarget: '10-12 + Drop', weightKgLogged: 17.5, technique: 'Drop set', isCompleted: false }
        ]
      },
      {
        id: 'ex-c2',
        name: 'Supino Reto com Barra',
        targetMuscle: 'Peitoral Médio',
        restSeconds: 90,
        sets: [
          { setNumber: 1, repsTarget: '8-10', weightKgLogged: 80, technique: 'Normal', isCompleted: false },
          { setNumber: 2, repsTarget: '6-8', weightKgLogged: 95, technique: 'Normal', isCompleted: false },
          { setNumber: 3, repsTarget: '6-8', weightKgLogged: 95, technique: 'Normal', isCompleted: false }
        ]
      },
      {
        id: 'ex-c3',
        name: 'Tríceps Testa com Barra W na Polia',
        targetMuscle: 'Tríceps Cabeça Longa',
        restSeconds: 70,
        sets: [
          { setNumber: 1, repsTarget: '12-15', weightKgLogged: 35, technique: 'Normal', isCompleted: false },
          { setNumber: 2, repsTarget: '10-12', weightKgLogged: 42.5, technique: 'Normal', isCompleted: false },
          { setNumber: 3, repsTarget: '10 + Rest Pause', weightKgLogged: 42.5, technique: 'Rest-pause', isCompleted: false }
        ]
      }
    ]
  },
  {
    id: 'w-d',
    code: 'Treino D',
    name: 'Pull (Dorsais, Trapézio, Deltoide Posterior & Bíceps)',
    dayOfWeek: 'Quinta-feira',
    targetMuscleGroups: ['Grande Dorsal', 'Trapézio', 'Bíceps', 'Antebraço'],
    estimatedDurationMinutes: 65,
    isCompletedToday: false,
    cardioOrientation: {
      enabled: true,
      type: 'Escada (StairMaster)',
      durationMinutes: 20,
      intensity: 'Zona 2 Alta (130 - 140 BPM)',
      targetKcal: 230,
      heartRateZone: '130 - 140 BPM',
      timing: 'Pós-Treino',
      instructions: 'Nível 5-7. Passadas completas sem apoiar o peso do corpo nos braços. Foco em oxidação lipídica e ativação de glúteos.'
    },
    exercises: [
      {
        id: 'ex-d1',
        name: 'Remada Curvada com Barra Pegada Supinada',
        targetMuscle: 'Dorsais & Espessura',
        restSeconds: 90,
        sets: [
          { setNumber: 1, repsTarget: '10-12', weightKgLogged: 60, technique: 'Normal', isCompleted: false },
          { setNumber: 2, repsTarget: '8-10', weightKgLogged: 80, technique: 'Normal', isCompleted: false },
          { setNumber: 3, repsTarget: '8-10', weightKgLogged: 85, technique: 'Normal', isCompleted: false }
        ]
      },
      {
        id: 'ex-d2',
        name: 'Rosca Direta com Barra W no Banco Scott',
        targetMuscle: 'Bíceps Braquial',
        restSeconds: 70,
        sets: [
          { setNumber: 1, repsTarget: '10-12', weightKgLogged: 30, technique: 'Normal', isCompleted: false },
          { setNumber: 2, repsTarget: '8-10', weightKgLogged: 36, technique: 'Normal', isCompleted: false },
          { setNumber: 3, repsTarget: '8 + Drop', weightKgLogged: 36, technique: 'Drop set', isCompleted: false }
        ]
      }
    ]
  },
  {
    id: 'w-e',
    code: 'Treino E',
    name: 'Lower Body 2 (Foco Posteriores de Coxa & Glúteos)',
    dayOfWeek: 'Sexta-feira',
    targetMuscleGroups: ['Posteriores de Coxa', 'Glúteo Máximo', 'Lombar'],
    estimatedDurationMinutes: 65,
    isCompletedToday: false,
    cardioOrientation: {
      enabled: false,
      type: 'Alongamento Miofascial',
      durationMinutes: 10,
      intensity: 'Leve',
      targetKcal: 0,
      timing: 'Pós-Treino',
      instructions: 'Liberar fáscia plantar, posteriores de coxa e glúteos com rolo de liberação miofascial.'
    },
    exercises: [
      {
        id: 'ex-e1',
        name: 'Stiff com Barra Olímpica',
        targetMuscle: 'Isquiotibiais & Glúteos',
        restSeconds: 90,
        sets: [
          { setNumber: 1, repsTarget: '10-12', weightKgLogged: 70, technique: 'Normal', isCompleted: false },
          { setNumber: 2, repsTarget: '8-10', weightKgLogged: 90, technique: 'Normal', isCompleted: false },
          { setNumber: 3, repsTarget: '8-10', weightKgLogged: 100, technique: 'Normal', isCompleted: false }
        ]
      },
      {
        id: 'ex-e2',
        name: 'Mesa Flexora Deitada',
        targetMuscle: 'Bíceps Femoral',
        restSeconds: 75,
        sets: [
          { setNumber: 1, repsTarget: '12-15', weightKgLogged: 45, technique: 'Normal', isCompleted: false },
          { setNumber: 2, repsTarget: '10-12', weightKgLogged: 55, technique: 'Normal', isCompleted: false },
          { setNumber: 3, repsTarget: '10 + Triple Drop', weightKgLogged: 55, technique: 'Drop set', isCompleted: false }
        ]
      },
      {
        id: 'ex-e3',
        name: 'Elevação Pélvica com Barra / Máquina',
        targetMuscle: 'Glúteo Máximo',
        restSeconds: 90,
        sets: [
          { setNumber: 1, repsTarget: '10-12', weightKgLogged: 120, technique: 'Normal', isCompleted: false },
          { setNumber: 2, repsTarget: '8-10', weightKgLogged: 150, technique: 'Normal', isCompleted: false },
          { setNumber: 3, repsTarget: '8-10 (Pausa 3s no topo)', weightKgLogged: 160, technique: 'Normal', isCompleted: false }
        ]
      }
    ]
  },
  {
    id: 'w-cardio',
    code: 'Treino F',
    name: 'Cardio LISS & Core Funcional',
    dayOfWeek: 'Sábado',
    targetMuscleGroups: ['Sistema Cardiovascular', 'Abdômen', 'Core'],
    estimatedDurationMinutes: 45,
    isCompletedToday: false,
    cardioOrientation: {
      enabled: true,
      type: 'Esteira Inclinada / Caminhada ao Ar Livre',
      durationMinutes: 45,
      intensity: 'Zona 2 (120 - 135 BPM)',
      targetKcal: 350,
      heartRateZone: '120 - 135 BPM',
      timing: 'Em Jejum (Manhã)',
      instructions: 'Realizar pela manhã em jejum. Ingerir 500ml de água + 5g de BCAA ou café preto sem açúcar antes. Manter ritmo constante para queima oxidativa lipídica.'
    },
    exercises: [
      {
        id: 'ex-cardio-1',
        name: 'Prancha Abdominal Isométrica',
        targetMuscle: 'Transverso do Abdômen',
        restSeconds: 45,
        technicalNotes: 'Manter retroversão pélvica e abdômen fortemente contraído.',
        sets: [
          { setNumber: 1, repsTarget: '60 segundos', weightKgLogged: 0, technique: 'Normal', isCompleted: false },
          { setNumber: 2, repsTarget: '60 segundos', weightKgLogged: 0, technique: 'Normal', isCompleted: false },
          { setNumber: 3, repsTarget: '60 segundos', weightKgLogged: 0, technique: 'Normal', isCompleted: false }
        ]
      },
      {
        id: 'ex-cardio-2',
        name: 'Abdominal Supra na Polia (Crunch no Cabo)',
        targetMuscle: 'Reto Abdominal',
        restSeconds: 60,
        sets: [
          { setNumber: 1, repsTarget: '15-20', weightKgLogged: 40, technique: 'Normal', isCompleted: false },
          { setNumber: 2, repsTarget: '15-20', weightKgLogged: 45, technique: 'Normal', isCompleted: false },
          { setNumber: 3, repsTarget: '15-20 + Drop', weightKgLogged: 45, technique: 'Drop set', isCompleted: false }
        ]
      }
    ]
  }
];

export const INITIAL_WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'tmpl-fst7-push',
    name: 'FST-7 Push & Deltoides Power (Classic)',
    description: 'Protocolo de hipertrofia miofibrilar com técnica FST-7 no final para expansão da fáscia muscular.',
    category: 'FST-7 & Volume',
    exercisesCount: 5,
    estimatedDurationMinutes: 65,
    targetMuscleGroups: ['Peitoral', 'Deltoides', 'Tríceps'],
    isOfficial: true,
    createdAt: '2026-08-01',
    split: {
      id: 'tmpl-s1',
      code: 'Treino A',
      name: 'FST-7 Push & Deltoides Power',
      dayOfWeek: 'Segunda-feira',
      targetMuscleGroups: ['Peitoral', 'Deltoides', 'Tríceps'],
      estimatedDurationMinutes: 65,
      cardioOrientation: {
        enabled: true,
        type: 'Esteira Inclinada',
        durationMinutes: 25,
        intensity: 'Zona 2 (120-130 BPM)',
        targetKcal: 200,
        timing: 'Pós-Treino',
        instructions: '25 min contínuos com 7% inclinação a 5.4 km/h.'
      },
      exercises: [
        {
          id: 't-ex-1',
          name: 'Supino Inclinado com Halteres',
          targetMuscle: 'Peitoral Superior',
          restSeconds: 90,
          cadence: '3010',
          sets: [
            { setNumber: 1, repsTarget: '12-15', weightKgLogged: 24, technique: 'Warm-up', isCompleted: false },
            { setNumber: 2, repsTarget: '8-10', weightKgLogged: 34, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '8-10', weightKgLogged: 38, technique: 'Normal', isCompleted: false },
            { setNumber: 4, repsTarget: '6-8', weightKgLogged: 40, technique: 'Back-off set', isCompleted: false }
          ]
        },
        {
          id: 't-ex-2',
          name: 'Crucifixo Inclinado no Cabo (FST-7)',
          targetMuscle: 'Peitoral',
          restSeconds: 30,
          cadence: '2012',
          technicalNotes: '7 séries de 10-12 reps com apenas 30s de descanso e alongamento fascial entre séries.',
          sets: [
            { setNumber: 1, repsTarget: '12', weightKgLogged: 15, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '12', weightKgLogged: 15, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '10', weightKgLogged: 15, technique: 'Normal', isCompleted: false },
            { setNumber: 4, repsTarget: '10', weightKgLogged: 15, technique: 'Normal', isCompleted: false },
            { setNumber: 5, repsTarget: '10', weightKgLogged: 15, technique: 'Normal', isCompleted: false },
            { setNumber: 6, repsTarget: '8-10', weightKgLogged: 15, technique: 'Normal', isCompleted: false },
            { setNumber: 7, repsTarget: '8 + Falha', weightKgLogged: 15, technique: 'Falha Concêntrica', isCompleted: false }
          ]
        },
        {
          id: 't-ex-3',
          name: 'Desenvolvimento com Halteres',
          targetMuscle: 'Deltoides',
          restSeconds: 75,
          sets: [
            { setNumber: 1, repsTarget: '10-12', weightKgLogged: 22, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '8-10', weightKgLogged: 26, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '8-10', weightKgLogged: 26, technique: 'Normal', isCompleted: false }
          ]
        },
        {
          id: 't-ex-4',
          name: 'Elevação Lateral na Polia',
          targetMuscle: 'Deltoide Lateral',
          restSeconds: 60,
          sets: [
            { setNumber: 1, repsTarget: '12-15', weightKgLogged: 10, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '12-15', weightKgLogged: 12.5, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '12 + Drop', weightKgLogged: 12.5, technique: 'Drop set', isCompleted: false }
          ]
        },
        {
          id: 't-ex-5',
          name: 'Tríceps Corda na Polia',
          targetMuscle: 'Tríceps',
          restSeconds: 60,
          sets: [
            { setNumber: 1, repsTarget: '12-15', weightKgLogged: 30, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '10-12', weightKgLogged: 35, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '10 + Triple Drop', weightKgLogged: 35, technique: 'Drop set', isCompleted: false }
          ]
        }
      ]
    }
  },
  {
    id: 'tmpl-quad-brutal',
    name: 'Lower 1 - Foco Quadríceps & Panturrilhas Brutal',
    description: 'Enfatiza vasto lateral, medial e reto femoral com alta densidade e técnicas de intensidade.',
    category: 'Hipertrofia',
    exercisesCount: 5,
    estimatedDurationMinutes: 70,
    targetMuscleGroups: ['Quadríceps', 'Adutores', 'Panturrilhas'],
    isOfficial: true,
    createdAt: '2026-08-01',
    split: {
      id: 'tmpl-s2',
      code: 'Treino B',
      name: 'Lower 1 - Quadríceps Brutal',
      dayOfWeek: 'Terça-feira',
      targetMuscleGroups: ['Quadríceps', 'Adutores', 'Panturrilhas'],
      estimatedDurationMinutes: 70,
      cardioOrientation: {
        enabled: false,
        type: 'Nenhum',
        durationMinutes: 0,
        intensity: 'Nenhum',
        targetKcal: 0,
        timing: 'Pós-Treino',
        instructions: 'Descanso total pós-treino.'
      },
      exercises: [
        {
          id: 't-ex-201',
          name: 'Agachamento Hack Machine',
          targetMuscle: 'Quadríceps',
          restSeconds: 90,
          cadence: '3010',
          sets: [
            { setNumber: 1, repsTarget: '15', weightKgLogged: 80, technique: 'Warm-up', isCompleted: false },
            { setNumber: 2, repsTarget: '10-12', weightKgLogged: 120, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '8-10', weightKgLogged: 150, technique: 'Normal', isCompleted: false },
            { setNumber: 4, repsTarget: '8 + Drop', weightKgLogged: 150, technique: 'Drop set', isCompleted: false }
          ]
        },
        {
          id: 't-ex-202',
          name: 'Cadeira Extensora',
          targetMuscle: 'Reto Femoral',
          restSeconds: 60,
          cadence: '2012',
          sets: [
            { setNumber: 1, repsTarget: '12-15', weightKgLogged: 60, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '10-12', weightKgLogged: 75, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '10 + Rest-pause', weightKgLogged: 75, technique: 'Rest-pause', isCompleted: false }
          ]
        },
        {
          id: 't-ex-203',
          name: 'Leg Press 45°',
          targetMuscle: 'Quadríceps',
          restSeconds: 90,
          sets: [
            { setNumber: 1, repsTarget: '12', weightKgLogged: 260, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '10', weightKgLogged: 320, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '8-10', weightKgLogged: 360, technique: 'Falha Concêntrica', isCompleted: false }
          ]
        },
        {
          id: 't-ex-204',
          name: 'Cadeira Adutora',
          targetMuscle: 'Adutores',
          restSeconds: 60,
          sets: [
            { setNumber: 1, repsTarget: '15', weightKgLogged: 50, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '12-15', weightKgLogged: 65, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '12 + Drop', weightKgLogged: 65, technique: 'Drop set', isCompleted: false }
          ]
        },
        {
          id: 't-ex-205',
          name: 'Gêmeos Sentado na Máquina',
          targetMuscle: 'Sóleo / Panturrilhas',
          restSeconds: 60,
          sets: [
            { setNumber: 1, repsTarget: '15-20', weightKgLogged: 45, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '15', weightKgLogged: 55, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '12-15 + Rest-pause', weightKgLogged: 55, technique: 'Rest-pause', isCompleted: false }
          ]
        }
      ]
    }
  },
  {
    id: 'tmpl-pull-density',
    name: 'Pull - Dorsais, Deltoide Posterior & Bíceps Densidade',
    description: 'Foco em largura e espessura dorsal com remadas pesadas e isolamento de posteriores e bíceps.',
    category: 'Push / Pull / Legs',
    exercisesCount: 5,
    estimatedDurationMinutes: 65,
    targetMuscleGroups: ['Dorsais', 'Trapézio', 'Deltoide Posterior', 'Bíceps'],
    isOfficial: true,
    createdAt: '2026-08-01',
    split: {
      id: 'tmpl-s3',
      code: 'Treino C',
      name: 'Pull - Dorsais & Bíceps Densidade',
      dayOfWeek: 'Quinta-feira',
      targetMuscleGroups: ['Dorsais', 'Deltoide Posterior', 'Bíceps'],
      estimatedDurationMinutes: 65,
      cardioOrientation: {
        enabled: true,
        type: 'Escada (StairMaster)',
        durationMinutes: 20,
        intensity: 'Moderada (130 BPM)',
        targetKcal: 220,
        timing: 'Pós-Treino',
        instructions: '20 minutos contínuos na escada nível 6 sem se apoiar.'
      },
      exercises: [
        {
          id: 't-ex-301',
          name: 'Puxada Articulada Aberta',
          targetMuscle: 'Grande Dorsal',
          restSeconds: 75,
          sets: [
            { setNumber: 1, repsTarget: '12', weightKgLogged: 50, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '8-10', weightKgLogged: 70, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '8 + Drop', weightKgLogged: 70, technique: 'Drop set', isCompleted: false }
          ]
        },
        {
          id: 't-ex-302',
          name: 'Remada Curvada com Barra',
          targetMuscle: 'Espessura Dorsal / Trapézio',
          restSeconds: 90,
          sets: [
            { setNumber: 1, repsTarget: '10-12', weightKgLogged: 60, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '8-10', weightKgLogged: 80, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '8-10', weightKgLogged: 90, technique: 'Normal', isCompleted: false }
          ]
        },
        {
          id: 't-ex-303',
          name: 'Crucifixo Invertido no Peck Deck',
          targetMuscle: 'Deltoide Posterior',
          restSeconds: 60,
          sets: [
            { setNumber: 1, repsTarget: '15', weightKgLogged: 35, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '12-15', weightKgLogged: 45, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '12 + Drop', weightKgLogged: 45, technique: 'Drop set', isCompleted: false }
          ]
        },
        {
          id: 't-ex-304',
          name: 'Rosca Direta com Barra W',
          targetMuscle: 'Bíceps',
          restSeconds: 70,
          sets: [
            { setNumber: 1, repsTarget: '10-12', weightKgLogged: 30, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '8-10', weightKgLogged: 36, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '8 + Drop', weightKgLogged: 36, technique: 'Drop set', isCompleted: false }
          ]
        },
        {
          id: 't-ex-305',
          name: 'Rosca Martelo com Halteres',
          targetMuscle: 'Braquial / Braquiorradial',
          restSeconds: 60,
          sets: [
            { setNumber: 1, repsTarget: '12', weightKgLogged: 16, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '10', weightKgLogged: 18, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '10', weightKgLogged: 20, technique: 'Normal', isCompleted: false }
          ]
        }
      ]
    }
  },
  {
    id: 'tmpl-posterior-glutes',
    name: 'Lower 2 - Posteriores de Coxa & Glúteos Densidade',
    description: 'Trabalho de cadeia posterior com Stiff, Mesa Flexora e Elevação Pélvica pesada.',
    category: 'Hipertrofia',
    exercisesCount: 4,
    estimatedDurationMinutes: 60,
    targetMuscleGroups: ['Posteriores de Coxa', 'Glúteos', 'Lombar'],
    isOfficial: true,
    createdAt: '2026-08-01',
    split: {
      id: 'tmpl-s4',
      code: 'Treino D',
      name: 'Lower 2 - Posteriores & Glúteos',
      dayOfWeek: 'Sexta-feira',
      targetMuscleGroups: ['Posteriores de Coxa', 'Glúteos'],
      estimatedDurationMinutes: 60,
      cardioOrientation: {
        enabled: true,
        type: 'Bike Ergométrica',
        durationMinutes: 20,
        intensity: 'Leve Recuperativa (115-125 BPM)',
        targetKcal: 150,
        timing: 'Pós-Treino',
        instructions: 'Giro solto para remover lactato e promover drenagem linfática.'
      },
      exercises: [
        {
          id: 't-ex-401',
          name: 'Stiff com Barra Olímpica',
          targetMuscle: 'Isquiotibiais',
          restSeconds: 90,
          sets: [
            { setNumber: 1, repsTarget: '12', weightKgLogged: 70, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '10', weightKgLogged: 90, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '8-10', weightKgLogged: 110, technique: 'Normal', isCompleted: false }
          ]
        },
        {
          id: 't-ex-402',
          name: 'Mesa Flexora Deitada',
          targetMuscle: 'Bíceps Femoral',
          restSeconds: 70,
          sets: [
            { setNumber: 1, repsTarget: '15', weightKgLogged: 40, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '12', weightKgLogged: 50, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '10 + Triple Drop', weightKgLogged: 50, technique: 'Drop set', isCompleted: false }
          ]
        },
        {
          id: 't-ex-403',
          name: 'Elevação Pélvica com Barra',
          targetMuscle: 'Glúteo Máximo',
          restSeconds: 90,
          sets: [
            { setNumber: 1, repsTarget: '12', weightKgLogged: 120, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '10', weightKgLogged: 150, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '8-10 (Pausa 3s no topo)', weightKgLogged: 170, technique: 'Normal', isCompleted: false }
          ]
        },
        {
          id: 't-ex-404',
          name: 'Cadeira Flexora Unilateral',
          targetMuscle: 'Isquiotibiais',
          restSeconds: 60,
          sets: [
            { setNumber: 1, repsTarget: '12-15', weightKgLogged: 30, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '10-12', weightKgLogged: 40, technique: 'Normal', isCompleted: false }
          ]
        }
      ]
    }
  },
  {
    id: 'tmpl-liss-cardio',
    name: 'Protocolo Cardio LISS em Jejum & Queima Oxidativa',
    description: 'Protocolo aeróbico em Zona 2 para queima de gordura visceral e melhora da sensibilidade à insulina.',
    category: 'Cardio & Queima',
    exercisesCount: 2,
    estimatedDurationMinutes: 45,
    targetMuscleGroups: ['Cardiovascular', 'Core / Abdômen'],
    isOfficial: true,
    createdAt: '2026-08-01',
    split: {
      id: 'tmpl-s5',
      code: 'Cardio',
      name: 'Cardio LISS em Jejum & Core',
      dayOfWeek: 'Sábado',
      targetMuscleGroups: ['Cardiovascular', 'Abdômen'],
      estimatedDurationMinutes: 45,
      cardioOrientation: {
        enabled: true,
        type: 'Esteira Inclinada em Jejum',
        durationMinutes: 45,
        intensity: 'Zona 2 (120 - 135 BPM)',
        targetKcal: 350,
        heartRateZone: '120 - 135 BPM',
        timing: 'Em Jejum (Manhã)',
        instructions: 'Tomar 500ml de água morna com limão ou café sem açúcar. 45 min com 9% de inclinação a 5.5 km/h sem segurar no painel.'
      },
      exercises: [
        {
          id: 't-ex-501',
          name: 'Prancha Abdominal Isométrica',
          targetMuscle: 'Abdômen',
          restSeconds: 45,
          sets: [
            { setNumber: 1, repsTarget: '60s', weightKgLogged: 0, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '60s', weightKgLogged: 0, technique: 'Normal', isCompleted: false },
            { setNumber: 3, repsTarget: '60s', weightKgLogged: 0, technique: 'Normal', isCompleted: false }
          ]
        },
        {
          id: 't-ex-502',
          name: 'Abdominal Infra no Banco Declinado',
          targetMuscle: 'Reto Abdominal Inferior',
          restSeconds: 60,
          sets: [
            { setNumber: 1, repsTarget: '15-20', weightKgLogged: 0, technique: 'Normal', isCompleted: false },
            { setNumber: 2, repsTarget: '15-20', weightKgLogged: 0, technique: 'Normal', isCompleted: false }
          ]
        }
      ]
    }
  }
];

export const SUPPLEMENT_PROTOCOLS: SupplementItem[] = [
  {
    id: 'sup-1',
    name: 'Creatina Monohidratada 100% Pura (Creapure)',
    dosage: '10g ao dia',
    schedule: '07:30 (Junto à Refeição 1 / Café da Manhã)',
    category: 'geral',
    benefits: 'Aumento de fosfocreatina intramuscular, ganho de força, hidratação celular e recuperação.',
    ingredients: ['Creatina Monohidratada micronizada 10g'],
    isTakenToday: true,
    doctorNotes: 'Uso contínuo mesmo em dias de descanso.'
  },
  {
    id: 'sup-2',
    name: 'Ômega 3 Ultra Concentrado (TG High EPA/DHA)',
    dosage: '4 cápsulas (totalizando ~2.000mg EPA + 1.000mg DHA)',
    schedule: '21:00 (Pós-jantar / Refeição 4)',
    category: 'geral',
    benefits: 'Ação anti-inflamatória sistêmica, sensibilidade à insulina, proteção cardiovascular e suporte articular.',
    ingredients: ['Óleo de Peixe Selvagem TG Concentrado'],
    isTakenToday: false,
    doctorNotes: 'Consumir com refeição rica em lipídios para máxima absorção.'
  },
  {
    id: 'sup-3',
    name: 'Cocktail Intra-Treino LM Performance',
    dosage: '1 garrafa (800ml de água gelada diluída)',
    schedule: '17:45 - 19:00 (Tomar em goles espaçados durante o treino)',
    category: 'intra_treino',
    benefits: 'Tamponamento da acidose lútea, vasodilatação endotelial, hidratação osmótica e fluxo de aminoácidos.',
    ingredients: [
      'Beta-Alanina: 3.200mg',
      'L-Arginina Alfa-Cetoglutarato (AAKG): 3.000mg',
      'Bicarbonato de Sódio Grau Farmacêutico: 5.000mg',
      'EAA / Freak Aminoácidos Essenciais: 10.000mg',
      'Sachê de Sal Rosa / Eletrólitos: 1.000mg (com Sódio/Potássio)',
      'Gatorade Powder / Maltodextrina: 25.000mg',
      'L-Glutamina Fermentada: 10.000mg'
    ],
    isTakenToday: false,
    doctorNotes: 'Iniciar consumo a partir da 2ª série do primeiro exercício de força.'
  },
  {
    id: 'sup-4',
    name: 'Sachê Noturno Neuro-Relax & Sono REM',
    dosage: '1 sachê dissolvido em 150ml de água morna',
    schedule: '22:30 (30 a 45 minutos antes de deitar)',
    category: 'sono_relaxamento',
    benefits: 'Indução rápida do sono, otimização da secreção de GH natural noturno, redução de cortisol sérico e relaxamento do SNC.',
    ingredients: [
      'Melatonina Microencapsulada: 0.5mg',
      'Extrato Seco de Mulungu (Erythrina mulungu): 300mg',
      'GABA (Ácido Gama-Aminobutírico): 500mg',
      '5-HTP (5-Hidroxitriptofano): 100mg',
      'Ashwagandha KSM-66: 400mg',
      'L-Glicina Pura: 3.000mg',
      'Extrato Padronizado de Passiflora Incarnata: 250mg',
      'Bisglicinato de Magnésio Quelato: 350mg'
    ],
    isTakenToday: false,
    doctorNotes: 'Manter quarto 100% escuro e evitar telas e luz azul após a ingestão.'
  },
  {
    id: 'sup-5',
    name: 'Fórmula de Proteção Cardiovascular & Hepática',
    dosage: '2 cápsulas pela manhã + 2 cápsulas à noite',
    schedule: '08:00 e 20:00 (Com as grandes refeições)',
    category: 'saude_cardiovascular',
    benefits: 'Manutenção do perfil lipídico (HDL/LDL/Triglicerídeos), controle de enzimas hepáticas (TGO/TGP) e elasticidade arterial.',
    ingredients: [
      'Coenzima Q10 (Ubiquinona): 100mg',
      'Citrus Bergamot Extrato Padronizado: 500mg',
      'N-Acetilcisteína (NAC): 600mg',
      'Vitamina D3 (5.000 UI) + Vitamina K2 MK-7 (120mcg)',
      'Curcumina C3 Complex 95% + Piperina: 250mg'
    ],
    isTakenToday: true,
    doctorNotes: 'Reavaliação periódica via exames laboratoriais a cada 90 dias.'
  }
];

export const INITIAL_FORMULA_TEMPLATES: SupplementFormulaTemplate[] = [
  {
    id: 'tmpl-sup-intra',
    name: 'Cocktail Intra-Treino LM High-Performance',
    description: 'Solução ergogênica para vasodilatação, tamponamento ácido celular, hidratação plasmática e anticatabolismo.',
    category: 'intra_treino',
    dosage: '1 garrafa (800ml de água gelada diluída)',
    schedule: 'Durante o treino de força (goles fracionados)',
    benefits: 'Tamponamento da acidose muscular por H+, vasodilatação endotelial via óxido nítrico e preservação de glicogênio.',
    ingredients: [
      'Beta-Alanina: 3.200mg',
      'L-Arginina Alfa-Cetoglutarato (AAKG): 3.000mg',
      'Bicarbonato de Sódio Grau Farmacêutico: 5.000mg',
      'EAA / Aminoácidos Essenciais Fermentados: 10.000mg',
      'Sachê de Sal Rosa & Minerais Eletrolíticos: 1.000mg',
      'Gatorade Powder / Maltodextrina: 25.000mg',
      'L-Glutamina Fermentada: 10.000mg'
    ],
    doctorNotes: 'Iniciar a ingestão a partir da 2ª série do primeiro exercício pesado.',
    isOfficial: true,
    createdBy: 'LM Team Medical & Performance Board',
    createdAt: '2026-08-01'
  },
  {
    id: 'tmpl-sup-sleep',
    name: 'Sachê Magistral Neuro-Relax & Otimização Sono REM',
    description: 'Composto bioativo para relaxamento neural, redução de cortisol noturno, indução de ondas delta e secreção de GH.',
    category: 'sono_relaxamento',
    dosage: '1 sachê dissolvido em 150ml de água morna',
    schedule: '22:30 (30 a 45 min antes de deitar)',
    benefits: 'Indução do sono fisiológico, otimização de secreção de GH noturno, redução de cortisol e relaxamento neuromuscular.',
    ingredients: [
      'Melatonina Microencapsulada: 0.5mg',
      'Extrato Seco de Mulungu (Erythrina mulungu): 300mg',
      'GABA (Ácido Gama-Aminobutírico): 500mg',
      '5-HTP (5-Hidroxitriptofano): 100mg',
      'Ashwagandha KSM-66 (Extrato Padronizado): 400mg',
      'L-Glicina Pura Grau Farmacêutico: 3.000mg',
      'Extrato Padronizado de Passiflora Incarnata: 250mg',
      'Bisglicinato de Magnésio Quelato: 350mg'
    ],
    doctorNotes: 'Desligar telas de celulares, TV e luzes azuladas 40 minutos antes da ingestão.',
    isOfficial: true,
    createdBy: 'Dr. Rodrigo Albuquerque (Médico do Esporte)',
    createdAt: '2026-08-01'
  },
  {
    id: 'tmpl-sup-cardio-hep',
    name: 'Fórmula Protetora Cardiovascular, Endotelial & Hepática',
    description: 'Blend antioxidante mitocondrial com suporte enzimático ao fígado e modulação do perfil lipídico arterial.',
    category: 'saude_cardiovascular',
    dosage: '2 cápsulas pela manhã + 2 cápsulas à noite',
    schedule: '08:00 e 20:00 (Junto às refeições principais)',
    benefits: 'Manutenção do perfil lipídico (HDL/LDL/Triglicerídeos), controle de enzimas TGO/TGP hepáticas e elasticidade arterial.',
    ingredients: [
      'Coenzima Q10 (Ubiquinona): 100mg',
      'Citrus Bergamot Extrato Padronizado: 500mg',
      'N-Acetilcisteína (NAC): 600mg',
      'Vitamina D3 (5.000 UI) + Vitamina K2 MK-7 (120mcg)',
      'Curcumina C3 Complex 95% + Piperina: 250mg'
    ],
    doctorNotes: 'Monitorar perfil lipídico e enzimas hepáticas em check-ups a cada 90 dias.',
    isOfficial: true,
    createdBy: 'Dr. Rodrigo Albuquerque (Médico do Esporte)',
    createdAt: '2026-08-01'
  },
  {
    id: 'tmpl-sup-thermo',
    name: 'Termogênico & Foco Cognitivo Pré-Treino',
    description: 'Aceleração do metabolismo basal, foco dopaminérgico e aumento da taxa de lipólise em jejum ou pré-treino.',
    category: 'termogenico_energia',
    dosage: '2 cápsulas 30 minutos antes do treino',
    schedule: 'Pré-Treino ou Manhã em Jejum',
    benefits: 'Aumento do gasto calórico basal, clareza mental e oxidação de ácidos graxos livres.',
    ingredients: [
      'Cafeína Anidra: 200mg',
      'L-Tirosina: 1.000mg',
      'Teacrina (TeaCrine 80%): 100mg',
      'Extrato de Chá Verde Padronizado (50% EGCG): 300mg',
      'Huperzina A (Huperzia serrata 1%): 200mcg',
      'Capsiate (Extrato de Pimenta Vermelha): 6mg'
    ],
    doctorNotes: 'Evitar consumo após as 17h para não interferir na arquitetura do sono.',
    isOfficial: true,
    createdBy: 'Dra. Marina Valente (Nutricionista Esportiva)',
    createdAt: '2026-08-01'
  },
  {
    id: 'tmpl-sup-joint',
    name: 'Complexo Articular, Tendíneo & Regeneração Cartilaginosa',
    description: 'Proteção contra desgaste por sobrecarga biomecânica pesada em atletas de alto rendimento.',
    category: 'articular_colageno',
    dosage: '1 sachê ou 3 cápsulas ao dia',
    schedule: 'Pela manhã com água ou café da manhã',
    benefits: 'Estímulo de colágeno sinovial, redução da inflamação de tendões e melhora da flexibilidade articular.',
    ingredients: [
      'Colágeno Tipo II Não Desnaturado (UC-II): 40mg',
      'Metilsulfonilmetano (MSM): 1.000mg',
      'Sulfato de Glucosamina + Condroitina: 1.500mg',
      'Ácido Hialurônico Oral: 100mg',
      'Vitamina C Revestida (Ácido Ascórbico): 500mg'
    ],
    doctorNotes: 'Uso contínuo mínimo recomendado de 60 a 90 dias.',
    isOfficial: true,
    createdBy: 'Dra. Camila Rocha (Fisioterapeuta)',
    createdAt: '2026-08-01'
  },
  {
    id: 'tmpl-sup-digestive',
    name: 'Suporte Digestivo, Enzimas & Barreira Intestinal',
    description: 'Melhora da absorção de macronutrientes em dietas hipercalóricas ou hiperproteicas.',
    category: 'digestivo_intestinal',
    dosage: '1 cápsula antes das 2 maiores refeições',
    schedule: 'Antes do Almoço e Jantar',
    benefits: 'Eliminação de estufamento pós-prandial, quebra ótima de proteínas e integridade das tight-junctions intestinais.',
    ingredients: [
      'Complexo Multi-Enzimático DigeZyme: 150mg',
      'Bromelaína 2400 GDU: 200mg',
      'L-Glutamina Fermentada: 5.000mg',
      'Probióticos Microencapsulados: 10 Bilhões UFC',
      'FOS (Frutooligossacarídeos Prebióticos): 2.000mg'
    ],
    doctorNotes: 'Especialmente indicado em fases de superávit calórico e alta ingestão proteica.',
    isOfficial: true,
    createdBy: 'Dra. Marina Valente (Nutricionista Esportiva)',
    createdAt: '2026-08-01'
  }
];

export const FIT_RECIPES: FitRecipe[] = [
  {
    id: 'rec-1',
    title: 'Sorvete Fit Proteico de Fruta Selvagem',
    category: 'Doce Proteico',
    prepTimeMinutes: 5,
    difficulty: 'Fácil',
    proteinG: 32,
    carbsG: 28,
    fatG: 2,
    caloriesKcal: 258,
    servings: 1,
    image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&auto=format&fit=crop&q=80',
    ingredients: [
      '150g de frutas vermelhas ou banana congelada em rodelas',
      '35g de Whey Protein Baunilha ou Frutas Vermelhas (Concentrado ou Isolado)',
      '60ml de leite vegetal desnatado ou água mineral gelada',
      '1 colher de chá de goma xantana (opcional para textura ultra cremosa)',
      'Adoçante Stevia a gosto'
    ],
    instructions: [
      'Coloque as frutas congeladas no processador de alimentos ou liquidificador potente.',
      'Adicione o Whey Protein e o leite vegetal gelado.',
      'Processe no modo pulsar até virar um creme denso e consistente de sorvete italiano.',
      'Sirva imediatamente em uma tigela gelada.'
    ],
    tips: 'Pode adicionar 10g de nibs de cacau 100% por cima para crocância sem alterar as calorias significativamente.'
  },
  {
    id: 'rec-2',
    title: 'Coxinha Fit de Frango no Cuscuz (AirFryer)',
    category: 'Salgado Fit',
    prepTimeMinutes: 20,
    difficulty: 'Médio',
    proteinG: 42,
    carbsG: 34,
    fatG: 6,
    caloriesKcal: 358,
    servings: 2,
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80',
    ingredients: [
      '150g de peito de frango cozido, desfiado e bem temperado com páprica e cúrcuma',
      '70g de flocão de milho para cuscuz hidratado com água morna e sal',
      '30g de ricota fresca ou requeijão light para cremosidade',
      'Cheiro-verde picadinho a gosto'
    ],
    instructions: [
      'Hidrate o flocão de milho por 10 minutos com água e sal, e cozinhe no micro-ondas por 2 min ou na cuscuzeira.',
      'Misture a massa de cuscuz com um garfo até formar uma massa modelável.',
      'Abra um disco de massa na palma da mão, coloque o frango desfiado cremoso no centro e feche em formato clássico de coxinha.',
      'Pincele levemente com água ou gema e leve à AirFryer pré-aquecida a 190°C por 12 a 15 minutos até dourar e ficar crocante.'
    ],
    tips: 'Excelente substituição para o almoço ou pré-treino com alto teor de proteína magra.'
  },
  {
    id: 'rec-3',
    title: 'Misto Quente Proteico Turbinado de Frigideira',
    category: 'Lanche Rápido',
    prepTimeMinutes: 8,
    difficulty: 'Rápido',
    proteinG: 38,
    carbsG: 26,
    fatG: 9,
    caloriesKcal: 337,
    servings: 1,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
    ingredients: [
      '2 fatias de pão 100% integral',
      '80g de peito de frango desfiado ou lombo suíno magro',
      '30g de queijo minas frescal light ou mussarela light',
      '2 claras de ovo batidas com orégano e sal rosa',
      'Tomate em rodelas finas e manjericão'
    ],
    instructions: [
      'Monte o sanduíche com o frango, queijo light e rodelas de tomate.',
      'Em uma frigideira antiaderente levemente untada, despeje as claras batidas.',
      'Coloque o sanduíche por cima das claras ainda líquidas para aderir.',
      'Vire o sanduíche dobrando as abas de clara para dentro e doure os dois lados até o queijo derreter.'
    ]
  },
  {
    id: 'rec-4',
    title: 'Cuscuz Nordestino Fit Temperado com Ovos Caipiras',
    category: 'Refeição Principal',
    prepTimeMinutes: 12,
    difficulty: 'Fácil',
    proteinG: 26,
    carbsG: 48,
    fatG: 14,
    caloriesKcal: 422,
    servings: 1,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    ingredients: [
      '80g de flocão de milho não transgênico',
      '2 ovos inteiros caipiras + 1 clara',
      '30g de queijo coalho light em cubinhos',
      'Cebola roxa picada, tomate e coentro a gosto',
      'Pitada de sal rosa e cominho'
    ],
    instructions: [
      'Hidrate o flocão com água e sal por 8 minutos e cozinhe na cuscuzeira por 7 minutos.',
      'Em uma frigideira, refogue a cebola e tomate, adicione os ovos mexendo suavemente até ficarem úmidos.',
      'Despeje o cuscuz quentinho diretamente na frigideira com os ovos e cubos de queijo.',
      'Misture tudo delicadamente e finalize com coentro fresco.'
    ]
  },
  {
    id: 'rec-5',
    title: 'Doce de Abacaxi Proteico com Canela & Whey',
    category: 'Doce Proteico',
    prepTimeMinutes: 10,
    difficulty: 'Fácil',
    proteinG: 28,
    carbsG: 22,
    fatG: 1.5,
    caloriesKcal: 213,
    servings: 1,
    image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&auto=format&fit=crop&q=80',
    ingredients: [
      '150g de abacaxi maduro cortado em cubos',
      '30g de Whey Protein sabor Baunilha ou Coco',
      '1 pau de canela ou 1 colher de chá de canela em pó',
      '2 cravos-da-índia',
      '50ml de água filtrada'
    ],
    instructions: [
      'Leve o abacaxi, a água, a canela e os cravos a uma panela em fogo médio.',
      'Cozinhe por 6 a 8 minutos até o abacaxi amaciar e a água reduzir.',
      'Desligue o fogo e espere amornar por 3 minutos (para não desnaturar o whey).',
      'Incorpore o Whey Protein mexendo até formar uma calda aveludada e cremosa.',
      'Sirva morno ou bem gelado.'
    ]
  }
];

export const FOOD_SUBSTITUTIONS_DATABASE: FoodSubstitution[] = [
  {
    baseFoodName: 'Arroz Branco Cozido',
    baseAmountG: 150,
    baseMacroCategory: 'carboidrato',
    options: [
      { name: 'Batata Inglesa Cozida / AirFryer', equivalentGrams: 220, calories: 185, proteinG: 3.8, carbsG: 41.5, fatG: 0.2, observation: 'Maior saciedade e volume gástrico' },
      { name: 'Batata Doce Cozida', equivalentGrams: 160, calories: 188, proteinG: 2.5, carbsG: 43.0, fatG: 0.3, observation: 'Baixo índice glicêmico e fibras' },
      { name: 'Cuscuz de Milho Cozido', equivalentGrams: 125, calories: 182, proteinG: 3.5, carbsG: 39.0, fatG: 0.8, observation: 'Excelente opção para pré-treino' },
      { name: 'Mandioca / Aipim Cozido', equivalentGrams: 120, calories: 189, proteinG: 1.5, carbsG: 44.5, fatG: 0.3, observation: 'Alta densidade de glicogênio' },
      { name: 'Aveia em Flocos', equivalentGrams: 48, calories: 186, proteinG: 6.8, carbsG: 32.0, fatG: 3.6, observation: 'Ideal para lanches rápidos' }
    ]
  },
  {
    baseFoodName: 'Peito de Frango Grelhado',
    baseAmountG: 120,
    baseMacroCategory: 'proteina',
    options: [
      { name: 'Patinho Moído Grelhado (Carne Bovina Magra)', equivalentGrams: 120, calories: 180, proteinG: 34.0, carbsG: 0.0, fatG: 4.5, observation: 'Rico em creatina e ferro heme natural' },
      { name: 'Filé de Tilápia / Peixe Branco Grelhado', equivalentGrams: 145, calories: 172, proteinG: 35.0, carbsG: 0.0, fatG: 3.0, observation: 'Digestão ultrarrápida' },
      { name: 'Ovos Inteiros Caipiras', equivalentGrams: 160, calories: 230, proteinG: 20.0, carbsG: 1.5, fatG: 16.0, observation: 'Ajustar gorduras das outras refeições' },
      { name: 'Claras de Ovos Pasteurizadas', equivalentGrams: 300, calories: 160, proteinG: 36.0, carbsG: 1.2, fatG: 0.3, observation: '100% albumina pura livre de lipídios' },
      { name: 'Whey Protein 80% Concentrado', equivalentGrams: 42, calories: 168, proteinG: 34.0, carbsG: 3.0, fatG: 2.0, observation: 'Praticidade imediata' }
    ]
  },
  {
    baseFoodName: 'Pão de Forma Integral',
    baseAmountG: 50,
    baseMacroCategory: 'carboidrato',
    options: [
      { name: 'Cuscuz Hidratado Cozido', equivalentGrams: 90, calories: 130, proteinG: 2.8, carbsG: 28.0, fatG: 0.6 },
      { name: 'Tapioca (Goma)', equivalentGrams: 45, calories: 132, proteinG: 0.2, carbsG: 32.0, fatG: 0.0 },
      { name: 'Aveia em Flocos', equivalentGrams: 35, calories: 135, proteinG: 4.9, carbsG: 23.0, fatG: 2.6 },
      { name: 'Banana Prata', equivalentGrams: 120, calories: 130, proteinG: 1.5, carbsG: 31.0, fatG: 0.3 }
    ]
  }
];
