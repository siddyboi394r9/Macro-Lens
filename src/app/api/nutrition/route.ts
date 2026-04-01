import { NextResponse } from 'next/server';

const USDA_API_KEY = "bxTVPsdeKYnXputtfjTSzFBme1LA7TvBxeLUsni6";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { ingredients } = await request.json();

    if (!ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json({ error: 'Ingredients array is required' }, { status: 400 });
    }

    const totalNutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      breakdown: [] as {originalName: string, fdcName: string, amount: string, macros: {calories: number, protein: number, carbs: number, fat: number}}[]
    };

    const fetchPromises = ingredients.map(async (ing) => {
      // We perform a food search in USDA API
      const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(ing.name)}&pageSize=1`;
      
      const res = await fetch(searchUrl);
      if (!res.ok) throw new Error('Failed to fetch from USDA');
      const data = await res.json();
      
      if (data.foods && data.foods.length > 0) {
        const topFood = data.foods[0];
        
        // Extract macros (USDA nutrient IDs: 1008=Energy Cals, 1003=Protein, 1005=Carbs, 1004=Fat)
        let cals = 0, p = 0, c = 0, f = 0;
        
        topFood.foodNutrients.forEach((n: { nutrientNumber: string; value: number }) => {
          if (n.nutrientNumber === '208' || n.nutrientNumber === '1008') cals = n.value;
          if (n.nutrientNumber === '203' || n.nutrientNumber === '1003') p = n.value;
          if (n.nutrientNumber === '205' || n.nutrientNumber === '1005') c = n.value;
          if (n.nutrientNumber === '204' || n.nutrientNumber === '1004') f = n.value;
        });

        // Helper to convert units to grams for USDA 100g base calculation
        const convertToGrams = (amountStr: string): number => {
          const match = amountStr.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z\s]+)$/);
          if (!match) return 0;

          const value = parseFloat(match[1]);
          const unit = match[2].toLowerCase().trim();

          if (unit === 'g' || unit === 'gram' || unit === 'grams' || unit === 'ml' || unit === 'milliliter' || unit === 'milliliters') {
            return value;
          }
          if (unit === 'oz' || unit === 'ounce' || unit === 'ounces' || unit === 'fl oz') {
            return value * 28.35;
          }
          if (unit === 'cup' || unit === 'cups') {
            return value * 240;
          }
          if (unit === 'tbsp' || unit === 'tablespoon' || unit === 'tablespoons') {
            return value * 15;
          }
          if (unit === 'tsp' || unit === 'teaspoon' || unit === 'teaspoons') {
            return value * 5;
          }
          return value; // Default to assumed grams if unit is unrecognized
        };

        let multiplier = 1;
        if (typeof ing.amount === 'string') {
          const grams = convertToGrams(ing.amount);
          if (grams > 0) {
            multiplier = grams / 100;
          }
        }

        return {
          originalName: ing.name,
          fdcName: topFood.description,
          amount: ing.amount,
          macros: { 
            calories: cals * multiplier, 
            protein: p * multiplier, 
            carbs: c * multiplier, 
            fat: f * multiplier 
          }
        };
      } else {
        return { 
          originalName: ing.name, 
          fdcName: "Not Found", 
          amount: ing.amount, 
          macros: { calories: 0, protein: 0, carbs: 0, fat: 0 } 
        };
      }
    });

    const results = await Promise.all(fetchPromises);

    results.forEach(res => {
      totalNutrition.calories += res.macros.calories;
      totalNutrition.protein += res.macros.protein;
      totalNutrition.carbs += res.macros.carbs;
      totalNutrition.fat += res.macros.fat;
      totalNutrition.breakdown.push(res);
    });
    
    // Round macros
    totalNutrition.calories = Math.round(totalNutrition.calories);
    totalNutrition.protein = Math.round(totalNutrition.protein * 10) / 10;
    totalNutrition.carbs = Math.round(totalNutrition.carbs * 10) / 10;
    totalNutrition.fat = Math.round(totalNutrition.fat * 10) / 10;

    return NextResponse.json({ nutrition: totalNutrition });

  } catch (error: unknown) {
    console.error("USDA Error:", error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch nutrition data';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
