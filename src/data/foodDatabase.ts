export interface StandardFoodItem {
  name: string;
  category: 'proteina' | 'carboidrato' | 'gordura' | 'vegetal' | 'suplemento';
  defaultPortion: string;
  defaultGrams: number;
  // Macros per 100g
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  caloriesPer100g: number;
}

export const FITNESS_FOOD_DATABASE: StandardFoodItem[] = [
  // ================= PROTEÍNAS =================
  {
    name: 'Peito de Frango Grelhado',
    category: 'proteina',
    defaultPortion: '120g pesado pronto',
    defaultGrams: 120,
    proteinPer100g: 31.0,
    carbsPer100g: 0.0,
    fatPer100g: 3.2,
    caloriesPer100g: 165
  },
  {
    name: 'Patinho Moído Grelhado / Magro',
    category: 'proteina',
    defaultPortion: '130g',
    defaultGrams: 130,
    proteinPer100g: 32.0,
    carbsPer100g: 0.0,
    fatPer100g: 4.8,
    caloriesPer100g: 175
  },
  {
    name: 'Ovos Inteiros Mexidos / Cozidos',
    category: 'proteina',
    defaultPortion: '3 unidades (150g)',
    defaultGrams: 150,
    proteinPer100g: 13.0,
    carbsPer100g: 1.0,
    fatPer100g: 10.5,
    caloriesPer100g: 150
  },
  {
    name: 'Claras de Ovo Pasteurizadas',
    category: 'proteina',
    defaultPortion: '150ml (150g)',
    defaultGrams: 150,
    proteinPer100g: 11.0,
    carbsPer100g: 0.7,
    fatPer100g: 0.2,
    caloriesPer100g: 52
  },
  {
    name: 'Tilápia / Peixe Branco Grelhado',
    category: 'proteina',
    defaultPortion: '150g',
    defaultGrams: 150,
    proteinPer100g: 26.0,
    carbsPer100g: 0.0,
    fatPer100g: 2.5,
    caloriesPer100g: 128
  },
  {
    name: 'Salmão Grelhado',
    category: 'proteina',
    defaultPortion: '140g',
    defaultGrams: 140,
    proteinPer100g: 24.0,
    carbsPer100g: 0.0,
    fatPer100g: 12.0,
    caloriesPer100g: 208
  },
  {
    name: 'Atum Sólido em Água (Drenado)',
    category: 'proteina',
    defaultPortion: '1 lata (120g)',
    defaultGrams: 120,
    proteinPer100g: 28.0,
    carbsPer100g: 0.0,
    fatPer100g: 1.0,
    caloriesPer100g: 120
  },
  {
    name: 'Alcatra / Maminha Bovina Magra',
    category: 'proteina',
    defaultPortion: '130g',
    defaultGrams: 130,
    proteinPer100g: 31.0,
    carbsPer100g: 0.0,
    fatPer100g: 6.5,
    caloriesPer100g: 190
  },
  {
    name: 'Queijo Cottage Zero / Magro',
    category: 'proteina',
    defaultPortion: '100g',
    defaultGrams: 100,
    proteinPer100g: 12.5,
    carbsPer100g: 3.0,
    fatPer100g: 1.5,
    caloriesPer100g: 78
  },
  {
    name: 'Iogurte Natural Desnatado',
    category: 'proteina',
    defaultPortion: '1 pote (160g)',
    defaultGrams: 160,
    proteinPer100g: 4.5,
    carbsPer100g: 6.0,
    fatPer100g: 0.2,
    caloriesPer100g: 45
  },
  {
    name: 'Iogurte Grego Zero Gordura',
    category: 'proteina',
    defaultPortion: '100g',
    defaultGrams: 100,
    proteinPer100g: 10.0,
    carbsPer100g: 4.5,
    fatPer100g: 0.0,
    caloriesPer100g: 60
  },

  // ================= CARBOIDRATOS =================
  {
    name: 'Arroz Branco Cozido',
    category: 'carboidrato',
    defaultPortion: '150g',
    defaultGrams: 150,
    proteinPer100g: 2.5,
    carbsPer100g: 28.0,
    fatPer100g: 0.3,
    caloriesPer100g: 128
  },
  {
    name: 'Arroz Integral Cozido',
    category: 'carboidrato',
    defaultPortion: '150g',
    defaultGrams: 150,
    proteinPer100g: 2.8,
    carbsPer100g: 25.5,
    fatPer100g: 1.0,
    caloriesPer100g: 124
  },
  {
    name: 'Batata Inglesa Cozida',
    category: 'carboidrato',
    defaultPortion: '200g',
    defaultGrams: 200,
    proteinPer100g: 2.0,
    carbsPer100g: 19.0,
    fatPer100g: 0.1,
    caloriesPer100g: 86
  },
  {
    name: 'Batata Doce Cozida',
    category: 'carboidrato',
    defaultPortion: '180g',
    defaultGrams: 180,
    proteinPer100g: 1.5,
    carbsPer100g: 22.0,
    fatPer100g: 0.1,
    caloriesPer100g: 95
  },
  {
    name: 'Mandioca / Aipim Cozido',
    category: 'carboidrato',
    defaultPortion: '150g',
    defaultGrams: 150,
    proteinPer100g: 1.2,
    carbsPer100g: 30.0,
    fatPer100g: 0.3,
    caloriesPer100g: 130
  },
  {
    name: 'Aveia em Flocos Finos / Grossos',
    category: 'carboidrato',
    defaultPortion: '50g',
    defaultGrams: 50,
    proteinPer100g: 14.0,
    carbsPer100g: 66.0,
    fatPer100g: 7.5,
    caloriesPer100g: 388
  },
  {
    name: 'Pão de Forma Integral',
    category: 'carboidrato',
    defaultPortion: '2 fatias (50g)',
    defaultGrams: 50,
    proteinPer100g: 9.0,
    carbsPer100g: 46.0,
    fatPer100g: 3.0,
    caloriesPer100g: 247
  },
  {
    name: 'Cuscuz Nordestino Cozido',
    category: 'carboidrato',
    defaultPortion: '120g',
    defaultGrams: 120,
    proteinPer100g: 2.2,
    carbsPer100g: 24.0,
    fatPer100g: 0.6,
    caloriesPer100g: 112
  },
  {
    name: 'Tapioca (Goma Hidratada Pronta)',
    category: 'carboidrato',
    defaultPortion: '80g',
    defaultGrams: 80,
    proteinPer100g: 0.2,
    carbsPer100g: 54.0,
    fatPer100g: 0.1,
    caloriesPer100g: 220
  },
  {
    name: 'Macarrão Cozido (Trigo / Grano Duro)',
    category: 'carboidrato',
    defaultPortion: '150g',
    defaultGrams: 150,
    proteinPer100g: 5.0,
    carbsPer100g: 31.0,
    fatPer100g: 0.9,
    caloriesPer100g: 155
  },
  {
    name: 'Banana Prata Fatiada',
    category: 'carboidrato',
    defaultPortion: '1 unidade grande (100g)',
    defaultGrams: 100,
    proteinPer100g: 1.3,
    carbsPer100g: 26.0,
    fatPer100g: 0.3,
    caloriesPer100g: 105
  },
  {
    name: 'Mamão Papaia Fresco',
    category: 'carboidrato',
    defaultPortion: '150g',
    defaultGrams: 150,
    proteinPer100g: 0.6,
    carbsPer100g: 11.0,
    fatPer100g: 0.1,
    caloriesPer100g: 45
  },
  {
    name: 'Morangos Frescos',
    category: 'carboidrato',
    defaultPortion: '100g',
    defaultGrams: 100,
    proteinPer100g: 0.8,
    carbsPer100g: 7.5,
    fatPer100g: 0.3,
    caloriesPer100g: 35
  },
  {
    name: 'Maçã Gala / Fuji com Casca',
    category: 'carboidrato',
    defaultPortion: '1 unidade média (130g)',
    defaultGrams: 130,
    proteinPer100g: 0.4,
    carbsPer100g: 14.0,
    fatPer100g: 0.2,
    caloriesPer100g: 56
  },
  {
    name: 'Feijão Carioca Cozido (Grão + Caldo)',
    category: 'carboidrato',
    defaultPortion: '80g',
    defaultGrams: 80,
    proteinPer100g: 4.8,
    carbsPer100g: 14.0,
    fatPer100g: 0.5,
    caloriesPer100g: 76
  },

  // ================= GORDURAS =================
  {
    name: 'Azeite de Oliva Extra Virgem',
    category: 'gordura',
    defaultPortion: '1 colher de sopa (10g)',
    defaultGrams: 10,
    proteinPer100g: 0.0,
    carbsPer100g: 0.0,
    fatPer100g: 100.0,
    caloriesPer100g: 884
  },
  {
    name: 'Pasta de Amendoim Integral',
    category: 'gordura',
    defaultPortion: '30g (1 colher de sopa cheia)',
    defaultGrams: 30,
    proteinPer100g: 28.0,
    carbsPer100g: 20.0,
    fatPer100g: 50.0,
    caloriesPer100g: 610
  },
  {
    name: 'Castanha de Caju / Pará',
    category: 'gordura',
    defaultPortion: '20g',
    defaultGrams: 20,
    proteinPer100g: 18.0,
    carbsPer100g: 29.0,
    fatPer100g: 46.0,
    caloriesPer100g: 590
  },
  {
    name: 'Abacate Fresco',
    category: 'gordura',
    defaultPortion: '100g',
    defaultGrams: 100,
    proteinPer100g: 1.5,
    carbsPer100g: 6.0,
    fatPer100g: 15.0,
    caloriesPer100g: 160
  },
  {
    name: 'Chocolate 70% Cacau',
    category: 'gordura',
    defaultPortion: '20g',
    defaultGrams: 20,
    proteinPer100g: 7.5,
    carbsPer100g: 45.0,
    fatPer100g: 42.0,
    caloriesPer100g: 580
  },

  // ================= VEGETAIS =================
  {
    name: 'Brócolis Cozido no Vapor',
    category: 'vegetal',
    defaultPortion: '100g',
    defaultGrams: 100,
    proteinPer100g: 2.8,
    carbsPer100g: 4.5,
    fatPer100g: 0.4,
    caloriesPer100g: 35
  },
  {
    name: 'Mix de Folhas Verdes (Alface / Rúcula / Agrião)',
    category: 'vegetal',
    defaultPortion: 'Porção Livre (80g)',
    defaultGrams: 80,
    proteinPer100g: 1.5,
    carbsPer100g: 2.8,
    fatPer100g: 0.2,
    caloriesPer100g: 18
  },
  {
    name: 'Pepino e Tomate Fatiados',
    category: 'vegetal',
    defaultPortion: '100g',
    defaultGrams: 100,
    proteinPer100g: 1.0,
    carbsPer100g: 3.5,
    fatPer100g: 0.2,
    caloriesPer100g: 19
  },
  {
    name: 'Cenoura Crua Ralada',
    category: 'vegetal',
    defaultPortion: '60g',
    defaultGrams: 60,
    proteinPer100g: 1.0,
    carbsPer100g: 9.0,
    fatPer100g: 0.2,
    caloriesPer100g: 41
  },

  // ================= SUPLEMENTOS =================
  {
    name: 'Whey Protein Concentrado 80%',
    category: 'suplemento',
    defaultPortion: '1 dosador (30g)',
    defaultGrams: 30,
    proteinPer100g: 80.0,
    carbsPer100g: 7.5,
    fatPer100g: 5.5,
    caloriesPer100g: 400
  },
  {
    name: 'Whey Protein Isolado 90%',
    category: 'suplemento',
    defaultPortion: '1 dosador (30g)',
    defaultGrams: 30,
    proteinPer100g: 90.0,
    carbsPer100g: 2.0,
    fatPer100g: 1.0,
    caloriesPer100g: 375
  },
  {
    name: 'Caseína Micelar / Albumina',
    category: 'suplemento',
    defaultPortion: '1 dosador (30g)',
    defaultGrams: 30,
    proteinPer100g: 78.0,
    carbsPer100g: 4.0,
    fatPer100g: 1.5,
    caloriesPer100g: 360
  }
];

export function computeFoodMacrosFrom100g(food: StandardFoodItem, grams: number) {
  const ratio = Math.max(0, grams) / 100;
  const p = Math.round(food.proteinPer100g * ratio * 10) / 10;
  const c = Math.round(food.carbsPer100g * ratio * 10) / 10;
  const f = Math.round(food.fatPer100g * ratio * 10) / 10;
  const kcal = Math.round(food.caloriesPer100g * ratio * 10) / 10;
  return { proteinG: p, carbsG: c, fatG: f, caloriesKcal: kcal };
}
