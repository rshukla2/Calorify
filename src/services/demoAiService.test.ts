import { describe, it, expect, vi, beforeEach } from "vitest";
import { demoAiService } from "./demoAiService";
import { AIFoodEstimate, AIPhotoNutritionEstimate, ChatResponse } from "../types";

describe("demoAiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  describe("estimateFood", () => {
    it("returns a banana estimate for banana query", async () => {
      const result = await demoAiService.estimateFood("one medium banana");

      expect(result.foodName.toLowerCase()).toContain("banana");
      expect(result.calories).toBeGreaterThan(0);
      expect(result.proteinGrams).toBeGreaterThanOrEqual(0);
      expect(result.carbGrams).toBeGreaterThanOrEqual(0);
      expect(result.fatGrams).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
      expect(result.confidence).toBeLessThanOrEqual(0.85);
      expect(result.assumptions).toContain("Demo mode: sample estimate, not a live AI result");
    });

    it("scales for '2 scrambled eggs' vs single", async () => {
      const single = await demoAiService.estimateFood("one scrambled egg");
      const double = await demoAiService.estimateFood("two scrambled eggs");

      expect(double.calories).toBeCloseTo(single.calories * 2, -1);
      expect(double.proteinGrams).toBeCloseTo(single.proteinGrams * 2, 1);
    });

    it("returns generic mixed meal for unknown food with demo assumption", async () => {
      const result = await demoAiService.estimateFood("some weird fusion dish");

      expect(result.foodName.toLowerCase()).toContain("fusion dish");
      expect(result.calories).toBeCloseTo(450, -1);
      expect(result.assumptions).toContain("Demo mode: sample estimate, not a live AI result");
      expect(result.assumptions).toContain("Estimated as a mixed meal");
    });

    it("handles quantity word parsing (three chicken breast)", async () => {
      const result = await demoAiService.estimateFood("three chicken breast");

      expect(result.foodName.toLowerCase()).toContain("chicken");
      expect(result.calories).toBeGreaterThan(300); // ~3 * 100
    });
  });

  describe("analyzeFoodImage", () => {
    it("returns fixed sample meal with correct totals", async () => {
      const result = await demoAiService.analyzeFoodImage("dummy-base64");

      expect(result.mealName).toBe("Grilled chicken bowl");
      expect(result.detectedItems.length).toBe(3);

      const totals = result.totals;
      const sumCalories = result.detectedItems.reduce((sum, item) => sum + item.calories, 0);
      const sumProtein = result.detectedItems.reduce((sum, item) => sum + item.proteinGrams, 0);
      const sumCarbs = result.detectedItems.reduce((sum, item) => sum + item.carbGrams, 0);
      const sumFat = result.detectedItems.reduce((sum, item) => sum + item.fatGrams, 0);

      expect(totals.calories).toBe(sumCalories);
      expect(totals.proteinGrams).toBe(sumProtein);
      expect(totals.carbGrams).toBe(sumCarbs);
      expect(totals.fatGrams).toBe(sumFat);

      expect(result.overallConfidence).toBe(0.78);
      expect(result.notes).toContain("Demo mode: sample analysis, the photo was not sent anywhere");
    });
  });

  describe("sendChatMessage", () => {
    const context: any = {
      profile: {
        name: "Test User",
        age: 30,
        biologicalSex: "male",
        heightCm: 180,
        weightKg: 80,
        activityLevel: "moderately_active",
        goal: "lose_weight",
        bmr: 1800,
        maintenanceCalories: 2500,
        dailyCalorieGoal: 2000,
        proteinGoalGrams: 150,
        carbGoalGrams: 200,
        fatGoalGrams: 70,
      },
      selectedDate: "2026-08-01",
      dailyTotals: {
        calories: 1200,
        proteinGrams: 80,
        carbGrams: 100,
        fatGrams: 40,
      },
      remaining: {
        calories: 800,
        proteinGrams: 70,
        carbGrams: 100,
        fatGrams: 30,
      },
      meals: [],
    };

    it("returns remaining calories when asked 'how many calories do I have left'", async () => {
      const result = await demoAiService.sendChatMessage(
        "how many calories do I have left",
        context
      );

      expect(result.message).toContain("800");
      expect(result.suggestedPrompts).toBeDefined();
      expect(result.suggestedPrompts).toHaveLength(3);
    });

    it("returns decline message for off-topic query", async () => {
      const result = await demoAiService.sendChatMessage(
        "write me a python script",
        context
      );

      expect(result.message).toContain("I can only help with nutrition, fitness and using Calorify");
      expect(result.message).not.toContain("Python");
      expect(result.suggestedPrompts).toBeDefined();
      expect(result.suggestedPrompts).toHaveLength(3);
    });

    it("handles greeting keywords", async () => {
      const result = await demoAiService.sendChatMessage("hello", context);

      expect(result.message.toLowerCase()).toContain("hello");
      expect(result.suggestedPrompts).toHaveLength(3);
    });

    it("handles protein-related questions", async () => {
      const result = await demoAiService.sendChatMessage("how much protein do I need", context);

      expect(result.message).toContain("70");
      expect(result.message).toContain("150");
      expect(result.suggestedPrompts).toHaveLength(3);
    });

    it("handles meal/suggestion queries", async () => {
      const result = await demoAiService.sendChatMessage("suggest a high-protein meal", context);

      expect(result.message.toLowerCase()).toContain("protein");
      expect(result.suggestedPrompts).toHaveLength(3);
    });

    it("handles progress questions", async () => {
      const result = await demoAiService.sendChatMessage("how am I doing today", context);

      expect(result.message).toContain("1200");
      expect(result.message).toContain("2000");
      expect(result.suggestedPrompts).toHaveLength(3);
    });

    it("handles GLP-1 medication questions with caution", async () => {
      const result = await demoAiService.sendChatMessage("what about GLP-1", context);

      expect(result.message.toLowerCase()).toContain("prescriber");
      expect(result.message.toLowerCase()).toContain("medical");
      expect(result.suggestedPrompts).toHaveLength(3);
    });

    it("returns suggestedPrompts with exactly 3 items for all cases", async () => {
      const queries = [
        "hello",
        "calories left",
        "protein",
        "what to eat",
        "how am I doing",
        "GLP-1",
        "random off-topic question",
      ];

      for (const q of queries) {
        const result = await demoAiService.sendChatMessage(q, context);
        expect(result.suggestedPrompts).toHaveLength(3);
      }
    }, { timeout: 15000 });
  });
});
