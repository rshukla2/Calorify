import {
  AIFoodEstimate,
  AIPhotoDetectedItem,
  AIPhotoNutritionEstimate,
  ChatResponse,
  NutritionChatContext,
} from "../types";

// Fixed sample data for demo mode
const FOOD_MENU: { keywords: string[]; calories: number; protein: number; carbs: number; fat: number }[] = [
  { keywords: ["banana"], calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { keywords: ["scrambled eggs", "scrambled egg"], calories: 185, protein: 12, carbs: 2, fat: 14 },
  { keywords: ["toast"], calories: 80, protein: 3, carbs: 15, fat: 1 },
  { keywords: ["chicken breast", "grilled chicken breast"], calories: 284, protein: 53, carbs: 0, fat: 6 },
  { keywords: ["rice", "white rice", "brown rice"], calories: 206, protein: 4.3, carbs: 45, fat: 0.4 },
  { keywords: ["oatmeal", "oats"], calories: 150, protein: 6, carbs: 27, fat: 3 },
  { keywords: ["apple"], calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { keywords: ["burrito bowl", "chipotle chicken burrito bowl"], calories: 720, protein: 45, carbs: 85, fat: 22 },
  { keywords: ["lentil curry", "lentils", "curry"], calories: 320, protein: 18, carbs: 42, fat: 8 },
  { keywords: ["salad"], calories: 180, protein: 8, carbs: 12, fat: 12 },
  { keywords: ["pasta"], calories: 220, protein: 8, carbs: 43, fat: 1 },
  { keywords: ["greek yogurt", "greek yoghurt"], calories: 100, protein: 17, carbs: 6, fat: 0 },
  { keywords: ["protein shake"], calories: 120, protein: 24, carbs: 3, fat: 1 },
  { keywords: ["coffee latte", "latte", "coffee"], calories: 150, protein: 8, carbs: 12, fat: 8 },
];

// Helper to parse leading quantity from query
function parseLeadingQuantity(query: string): { quantity: number; remainingQuery: string } {
  const numberWords: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  };

  const trimmed = query.trim();
  const match = trimmed.match(/^(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(.*)/i);

  if (match) {
    const numStr = match[1].toLowerCase();
    const quantity = numberWords[numStr] || parseInt(numStr, 10);
    return { quantity, remainingQuery: match[2] };
  }

  return { quantity: 1, remainingQuery: trimmed };
}

function scaleNutrition(food: typeof FOOD_MENU[0], quantity: number) {
  return {
    calories: Math.round(food.calories * quantity),
    protein: parseFloat((food.protein * quantity).toFixed(1)),
    carbs: parseFloat((food.carbs * quantity).toFixed(1)),
    fat: parseFloat((food.fat * quantity).toFixed(1)),
  };
}

async function delay(min: number, max: number): Promise<void> {
  const randomDelay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise((resolve) => setTimeout(resolve, randomDelay));
}

export const demoAiService = {
  async estimateFood(query: string): Promise<AIFoodEstimate> {
    await delay(700, 1200);

    const { quantity, remainingQuery } = parseLeadingQuantity(query);
    const queryLower = remainingQuery.toLowerCase();

    let matchedFood = null;
    for (const food of FOOD_MENU) {
      if (food.keywords.some((kw) => queryLower.includes(kw))) {
        matchedFood = food;
        break;
      }
    }

    let result;
    if (matchedFood) {
      const scaled = scaleNutrition(matchedFood, quantity);
      const foodName = matchedFood.keywords[0];
      result = {
        foodName: foodName.charAt(0).toUpperCase() + foodName.slice(1),
        description: `A serving of ${foodName}`,
        servingDescription: quantity === 1 ? "1 serving" : `${quantity} servings`,
        baseServingAmount: quantity,
        baseServingUnit: "serving",
        calories: scaled.calories,
        proteinGrams: scaled.protein,
        carbGrams: scaled.carbs,
        fatGrams: scaled.fat,
        confidence: 0.6 + Math.random() * 0.25,
        assumptions: ["Demo mode: sample estimate, not a live AI result"],
      };
    } else {
      // Generic mixed meal
      result = {
        foodName: remainingQuery || "mixed meal",
        description: "A mixed meal",
        servingDescription: "1 serving",
        baseServingAmount: 1,
        baseServingUnit: "serving",
        calories: 450,
        proteinGrams: 25,
        carbGrams: 55,
        fatGrams: 15,
        confidence: 0.65,
        assumptions: ["Demo mode: sample estimate, not a live AI result", "Estimated as a mixed meal"],
      };
    }

    // Add alternatives
    result.alternatives = [
      { label: "Lighter", calories: Math.round(result.calories * 0.8), proteinGrams: Math.round(result.proteinGrams * 0.9), carbGrams: Math.round(result.carbGrams * 0.8), fatGrams: Math.round(result.fatGrams * 0.8) },
      { label: "More protein", calories: Math.round(result.calories * 1.2), proteinGrams: Math.round(result.proteinGrams * 1.3), carbGrams: Math.round(result.carbGrams * 0.9), fatGrams: Math.round(result.fatGrams * 0.9) },
    ];

    return result;
  },

  async analyzeFoodImage(imageBase64: string, mimeType: string = "image/jpeg"): Promise<AIPhotoNutritionEstimate> {
    await delay(700, 1200);

    // Fixed sample meal
    const item1: AIPhotoDetectedItem = {
      id: "item1",
      foodName: "Grilled chicken breast",
      servingDescription: "120g portion",
      baseServingAmount: 120,
      baseServingUnit: "g",
      calories: 192,
      proteinGrams: 36,
      carbGrams: 0,
      fatGrams: 4,
      confidence: 0.82,
      assumptions: ["Demo mode: sample analysis, the photo was not sent anywhere"],
    };

    const item2: AIPhotoDetectedItem = {
      id: "item2",
      foodName: "White rice",
      servingDescription: "80g portion",
      baseServingAmount: 80,
      baseServingUnit: "g",
      calories: 104,
      proteinGrams: 2.1,
      carbGrams: 23,
      fatGrams: 0.2,
      confidence: 0.78,
      assumptions: ["Demo mode: sample analysis, the photo was not sent anywhere"],
    };

    const item3: AIPhotoDetectedItem = {
      id: "item3",
      foodName: "Side salad",
      servingDescription: "100g portion",
      baseServingAmount: 100,
      baseServingUnit: "g",
      calories: 22,
      proteinGrams: 1.5,
      carbGrams: 5,
      fatGrams: 0.3,
      confidence: 0.75,
      assumptions: ["Demo mode: sample analysis, the photo was not sent anywhere"],
    };

    const totals = {
      calories: item1.calories + item2.calories + item3.calories,
      proteinGrams: item1.proteinGrams + item2.proteinGrams + item3.proteinGrams,
      carbGrams: item1.carbGrams + item2.carbGrams + item3.carbGrams,
      fatGrams: item1.fatGrams + item2.fatGrams + item3.fatGrams,
    };

    return {
      mealName: "Grilled chicken bowl",
      detectedItems: [item1, item2, item3],
      totals,
      overallConfidence: 0.78,
      notes: ["Demo mode: sample analysis, the photo was not sent anywhere"],
    };
  },

  async sendChatMessage(
    message: string,
    context: NutritionChatContext,
    history: any[] = []
  ): Promise<ChatResponse> {
    await delay(700, 1200);

    const msgLower = message.toLowerCase();
    const remainingCalories = context.remaining.calories;
    const remainingProtein = context.remaining.proteinGrams;
    const dailyCalorieGoal = context.profile.dailyCalorieGoal;

    // Greeting detection
    if (msgLower.match(/^(hi|hello|hey|good morning|good evening|good afternoon)\b/)) {
      return {
        message: `Hello! I'm your Calorify Coach. You have ${remainingCalories} kcal remaining today based on your daily goal of ${dailyCalorieGoal} kcal. How can I help you reach your goals today?`,
        suggestedPrompts: ["How am I doing on protein?", "Suggest a high-protein dinner", "What snacks fit my remaining calories?"],
      };
    }

    // Meal ideas / what to eat / snack
    if (/\b(what to eat|what should i eat|what can i eat|meal ideas?|dinner|lunch|breakfast|hungry|eat next)\b/.test(msgLower) || msgLower.includes("meal ideas") || msgLower.includes("snack") || msgLower.includes("suggest") || msgLower.includes("recommend")) {
      const snackOptions = [
        "Greek yogurt with berries (150 kcal, 15g protein)",
        "Apple with peanut butter (200 kcal, 6g protein)",
        "Hard-boiled eggs (140 kcal, 12g protein)",
      ].filter(() => remainingCalories > 150);

      const mealOptions = [
        "Grilled chicken with roasted vegetables (500-600 kcal)",
        "Lentil soup with whole grain bread (450 kcal, 20g protein)",
        "Salmon with quinoa and salad (550 kcal, 35g protein)",
      ];

      const options = remainingCalories < 300 ? snackOptions.slice(0, 2) : mealOptions.slice(0, 2);

      const suggestionList = options.length > 0 ? options.join(" or ") : "light snack or small meal";
      return {
        message: `Based on your remaining ${remainingCalories} kcal, try: ${suggestionList}. All options are balanced with protein to keep you full!`,
        suggestedPrompts: ["Give me a low-carb option", "Show me high-protein meals", "What fits under 400 kcal?"],
      };
    }

    if (msgLower.includes("protein")) {
      return {
        message: `You have ${remainingProtein}g of protein remaining today. Your daily protein goal is ${context.profile.proteinGoalGrams}g. Consider adding Greek yogurt, chicken, or a protein shake.`,
        suggestedPrompts: ["High-protein snacks", "Suggest a high-protein dinner", "How much protein have I eaten?"],
      };
    }

    // Calories left/remaining
    if (msgLower.includes("calories left") || msgLower.includes("calories remaining") || msgLower.includes("how many calories") || msgLower.includes("remaining")) {
      return {
        message: `You have ${remainingCalories} kcal remaining today. You've consumed ${context.dailyTotals.calories} out of your ${dailyCalorieGoal} kcal goal.`,
        suggestedPrompts: ["What should I eat?", "Suggest a snack under 200 kcal", "How much protein do I need?"],
      };
    }

    // Progress / how am I doing
    if (msgLower.includes("progress") || msgLower.includes("how am i doing") || msgLower.includes("how am I doing")) {
      const progressPct = Math.round((context.dailyTotals.calories / dailyCalorieGoal) * 100);
      let status = "";
      if (progressPct < 50) status = "great pace";
      else if (progressPct < 80) status = "on track";
      else if (progressPct <= 100) status = "nearing your goal";
      else status = "over your calorie goal";

      return {
        message: `You've consumed ${context.dailyTotals.calories} of ${dailyCalorieGoal} kcal (${progressPct}%). You're ${status}! Keep up the good work, or adjust your next meal if needed.`,
        suggestedPrompts: ["What can I still eat?", "Suggest a light dinner", "How much protein left?"],
      };
    }

    // GLP-1 / medication
    if (msgLower.includes("glp") || msgLower.includes("medication") || msgLower.includes("injection")) {
      return {
        message: "I'm not a medical professional, but GLP-1 medications like Wegovy or Zepbound should be managed with your prescriber. They can help you adjust your nutrition plan alongside your medication.",
        suggestedPrompts: ["How does GLP-1 affect hunger?", "Best foods with GLP-1 medications", "Manage side effects"],
      };
    }

    // Off-topic detection
    const nutritionKeywords = [
      "food", "eat", "meal", "calorie", "protein", "carb", "fat", "macro", "diet", "weight",
      "workout", "exercise", "gym", "water", "sleep", "snack", "breakfast", "lunch", "dinner",
      "hungry", "goal", "glp", "log", "track", "nutrition", "healthy", "fitness", "burn",
      "bmi", "bmr", "metabolism", "tdee", "meal", "portion"
    ];

    const hasNutritionKeyword = nutritionKeywords.some((kw) => msgLower.includes(kw));
    const isGreeting = /^(hi|hello|hey|good morning|good evening|good afternoon)\b/.test(msgLower);

    if (!hasNutritionKeyword && !isGreeting) {
      return {
        message: "I can only help with nutrition, fitness and using Calorify. Try asking about your calories, protein or meal ideas.",
        suggestedPrompts: ["How many calories do I have left?", "Suggest a high-protein dinner", "What snacks fit my goal?"],
      };
    }

    // Fallback: friendly general nutrition tip
    return {
      message: "Eating mindfully and including protein at each meal can help you stay full and reach your goals. Don't forget to stay hydrated too!",
      suggestedPrompts: ["High-protein breakfast ideas", "What should I eat for lunch?", "Tips for staying full?"],
    };
  },
};
