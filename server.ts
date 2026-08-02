import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const PORT = 3000;

// Initialize Google GenAI SDK with server-side API Key
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || "placeholder_key",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();

  // Increase payload limit for image base64 uploads
  app.use(express.json({ limit: "15mb" }));

  // Helper to handle Gemini API errors consistently
  const handleGeminiError = (err: any, res: express.Response, fallbackMessage: string) => {
    console.error("Gemini Error:", err);
    const errorMessage = err?.message || String(err);
    const isRateLimit =
      errorMessage.includes("429") ||
      errorMessage.toLowerCase().includes("quota") ||
      errorMessage.toLowerCase().includes("rate limit") ||
      errorMessage.toLowerCase().includes("resource_exhausted");

    if (isRateLimit) {
      return res.status(429).json({
        error: "The AI service is temporarily busy. Please wait a moment or use manual entry.",
        isRateLimit: true,
      });
    }

    return res.status(500).json({
      error: fallbackMessage,
      details: process.env.NODE_ENV !== "production" ? errorMessage : undefined,
    });
  };

  // Check if API key is configured
  const checkApiKey = (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: "GEMINI_API_KEY environment variable is not configured. Please enter food manually or add the API key in Settings > Secrets.",
      });
    }
    next();
  };

  // -------------------------------------------------------------------------
  // Feature 1: Food Estimate by Name / Description (POST /api/ai/estimate-food)
  // -------------------------------------------------------------------------
  app.post("/api/ai/estimate-food", checkApiKey, async (req: express.Request, res: express.Response) => {
    try {
      const { query } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Food description is required." });
      }

      const cleanQuery = query.trim();
      if (cleanQuery.length === 0 || cleanQuery.length > 500) {
        return res.status(400).json({
          error: "Please enter a valid food description between 1 and 500 characters.",
        });
      }

      const systemInstruction = `You are an expert, realistic nutrition AI. Estimate calories and macronutrients for the user's food description.
Provide one primary estimate. When quantity, cooking method, or preparation is vague, make reasonable general assumptions and state them in 'assumptions'.
Return non-negative numeric values for calories and macros.
Do not invent lab precision; confidence should be a decimal between 0 and 1.
If the input is ambiguous (e.g. "a bowl of pasta"), provide 1-2 realistic alternatives in the 'alternatives' array.`;

      const estimateSchema = {
        type: Type.OBJECT,
        properties: {
          foodName: { type: Type.STRING, description: "Clear title for the food" },
          description: { type: Type.STRING, description: "Short summary" },
          servingDescription: { type: Type.STRING, description: "e.g. 1 medium banana, 1 cup, 150g" },
          baseServingAmount: { type: Type.NUMBER, description: "Base numeric portion, e.g. 1" },
          baseServingUnit: { type: Type.STRING, description: "e.g. serving, bowl, piece, g, oz" },
          calories: { type: Type.NUMBER },
          proteinGrams: { type: Type.NUMBER },
          carbGrams: { type: Type.NUMBER },
          fatGrams: { type: Type.NUMBER },
          fiberGrams: { type: Type.NUMBER },
          sugarGrams: { type: Type.NUMBER },
          sodiumMg: { type: Type.NUMBER },
          confidence: { type: Type.NUMBER, description: "Confidence score between 0.0 and 1.0" },
          assumptions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Short list of assumptions made",
          },
          alternatives: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                calories: { type: Type.NUMBER },
                proteinGrams: { type: Type.NUMBER },
                carbGrams: { type: Type.NUMBER },
                fatGrams: { type: Type.NUMBER },
              },
              required: ["label", "calories", "proteinGrams", "carbGrams", "fatGrams"],
            },
          },
        },
        required: [
          "foodName",
          "servingDescription",
          "baseServingAmount",
          "baseServingUnit",
          "calories",
          "proteinGrams",
          "carbGrams",
          "fatGrams",
          "confidence",
          "assumptions",
        ],
      };

      const executePrompt = async (promptText: string) => {
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: estimateSchema,
            temperature: 0.2,
          },
        });
        return JSON.parse(response.text || "{}");
      };

      let parsed = await executePrompt(`Estimate nutrition for: "${cleanQuery}"`);

      // Validation check
      const isValid = (data: any) =>
        data &&
        typeof data.foodName === "string" &&
        data.foodName.trim().length > 0 &&
        typeof data.calories === "number" &&
        data.calories >= 0 &&
        typeof data.proteinGrams === "number" &&
        data.proteinGrams >= 0 &&
        typeof data.carbGrams === "number" &&
        data.carbGrams >= 0 &&
        typeof data.fatGrams === "number" &&
        data.fatGrams >= 0 &&
        typeof data.confidence === "number" &&
        data.confidence >= 0 &&
        data.confidence <= 1;

      // Controlled single retry if response is malformed
      if (!isValid(parsed)) {
        console.warn("First Gemini response invalid, retrying once...");
        parsed = await executePrompt(
          `Please provide a valid JSON nutrition estimate for: "${cleanQuery}". Ensure foodName is non-empty, all nutrition numbers are non-negative, and confidence is between 0 and 1.`
        );
      }

      if (!isValid(parsed)) {
        return res.status(500).json({
          error: "Calorify could not estimate this food right now. You can try again or enter it manually.",
        });
      }

      // Ensure clean numbers
      const sanitized = {
        foodName: String(parsed.foodName).trim(),
        description: String(parsed.description || parsed.foodName).trim(),
        servingDescription: String(parsed.servingDescription || "1 serving").trim(),
        baseServingAmount: Math.max(0.1, Number(parsed.baseServingAmount) || 1),
        baseServingUnit: String(parsed.baseServingUnit || "serving").trim(),
        calories: Math.round(Math.max(0, Number(parsed.calories) || 0)),
        proteinGrams: Math.round(Math.max(0, Number(parsed.proteinGrams) || 0) * 10) / 10,
        carbGrams: Math.round(Math.max(0, Number(parsed.carbGrams) || 0) * 10) / 10,
        fatGrams: Math.round(Math.max(0, Number(parsed.fatGrams) || 0) * 10) / 10,
        fiberGrams: parsed.fiberGrams !== undefined ? Math.max(0, Number(parsed.fiberGrams) || 0) : undefined,
        sugarGrams: parsed.sugarGrams !== undefined ? Math.max(0, Number(parsed.sugarGrams) || 0) : undefined,
        sodiumMg: parsed.sodiumMg !== undefined ? Math.max(0, Number(parsed.sodiumMg) || 0) : undefined,
        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.8)),
        assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions.map(String) : ["General average estimation"],
        alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
      };

      return res.json(sanitized);
    } catch (err) {
      return handleGeminiError(
        err,
        res,
        "Calorify could not estimate this food right now. You can try again or enter it manually."
      );
    }
  });

  // -------------------------------------------------------------------------
  // Feature 2: Photo Food Analysis (POST /api/ai/analyze-food-image)
  // -------------------------------------------------------------------------
  app.post("/api/ai/analyze-food-image", checkApiKey, async (req: express.Request, res: express.Response) => {
    try {
      const { imageBase64, mimeType } = req.body;

      if (!imageBase64 || typeof imageBase64 !== "string") {
        return res.status(400).json({ error: "Image data is required." });
      }

      const validMime = mimeType && typeof mimeType === "string" ? mimeType : "image/jpeg";
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const photoSchema = {
        type: Type.OBJECT,
        properties: {
          mealName: { type: Type.STRING, description: "Title describing the meal in the photo" },
          detectedItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                foodName: { type: Type.STRING },
                servingDescription: { type: Type.STRING },
                baseServingAmount: { type: Type.NUMBER },
                baseServingUnit: { type: Type.STRING },
                calories: { type: Type.NUMBER },
                proteinGrams: { type: Type.NUMBER },
                carbGrams: { type: Type.NUMBER },
                fatGrams: { type: Type.NUMBER },
                confidence: { type: Type.NUMBER },
                assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                "foodName",
                "servingDescription",
                "baseServingAmount",
                "baseServingUnit",
                "calories",
                "proteinGrams",
                "carbGrams",
                "fatGrams",
                "confidence",
                "assumptions",
              ],
            },
          },
          totals: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              proteinGrams: { type: Type.NUMBER },
              carbGrams: { type: Type.NUMBER },
              fatGrams: { type: Type.NUMBER },
            },
            required: ["calories", "proteinGrams", "carbGrams", "fatGrams"],
          },
          overallConfidence: { type: Type.NUMBER },
          notes: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["mealName", "detectedItems", "totals", "overallConfidence", "notes"],
      };

      const systemInstruction = `You are a visual food recognition and nutrition estimation AI.
1. Identify all visible foods and drinks in the photo.
2. Estimate the portion size of each item.
3. Estimate calories and macros (protein, carbs, fat) for each item.
4. List key assumptions (e.g. cooked with oil, standard portion size).
5. Provide overall confidence (0.0 to 1.0) and helpful observations.
Avoid claiming exact lab accuracy from a photo. Return JSON only.`;

      const imagePart = {
        inlineData: {
          data: cleanBase64,
          mimeType: validMime,
        },
      };

      const textPart = {
        text: "Analyze this food image. Detect all individual food and drink items, portion sizes, calories, and macros.",
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: photoSchema,
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || "{}");

      if (!parsed || !Array.isArray(parsed.detectedItems) || parsed.detectedItems.length === 0) {
        return res.status(422).json({
          error: "We could not confidently identify food in this photo. Try another photo or add items manually.",
        });
      }

      // Sanitize items and recompute totals using TypeScript
      const items = parsed.detectedItems.map((item: any, idx: number) => ({
        id: item.id || `item_${Date.now()}_${idx}`,
        foodName: String(item.foodName || `Food Item ${idx + 1}`).trim(),
        servingDescription: String(item.servingDescription || "1 serving").trim(),
        baseServingAmount: Math.max(0.1, Number(item.baseServingAmount) || 1),
        baseServingUnit: String(item.baseServingUnit || "serving").trim(),
        calories: Math.round(Math.max(0, Number(item.calories) || 0)),
        proteinGrams: Math.round(Math.max(0, Number(item.proteinGrams) || 0) * 10) / 10,
        carbGrams: Math.round(Math.max(0, Number(item.carbGrams) || 0) * 10) / 10,
        fatGrams: Math.round(Math.max(0, Number(item.fatGrams) || 0) * 10) / 10,
        confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.75)),
        assumptions: Array.isArray(item.assumptions) ? item.assumptions.map(String) : ["Estimated from image"],
      }));

      // Server recomputes authoritative totals in TypeScript
      const computedTotals = items.reduce(
        (acc: any, item: any) => ({
          calories: acc.calories + item.calories,
          proteinGrams: Math.round((acc.proteinGrams + item.proteinGrams) * 10) / 10,
          carbGrams: Math.round((acc.carbGrams + item.carbGrams) * 10) / 10,
          fatGrams: Math.round((acc.fatGrams + item.fatGrams) * 10) / 10,
        }),
        { calories: 0, proteinGrams: 0, carbGrams: 0, fatGrams: 0 }
      );

      return res.json({
        mealName: String(parsed.mealName || "Meal Photo").trim(),
        detectedItems: items,
        totals: computedTotals,
        overallConfidence: Math.min(1, Math.max(0, Number(parsed.overallConfidence) || 0.8)),
        notes: Array.isArray(parsed.notes) ? parsed.notes.map(String) : [],
      });
    } catch (err) {
      return handleGeminiError(
        err,
        res,
        "We could not analyze this photo right now. Please try again or enter food manually."
      );
    }
  });

  // -------------------------------------------------------------------------
  // Feature 3: AI Nutrition Coach Chat (POST /api/ai/chat)
  // -------------------------------------------------------------------------
  app.post("/api/ai/chat", checkApiKey, async (req: express.Request, res: express.Response) => {
    try {
      const { message, context, history } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message text is required." });
      }

      const userMessage = message.trim();
      if (userMessage.length === 0 || userMessage.length > 1000) {
        return res.status(400).json({ error: "Please enter a message between 1 and 1000 characters." });
      }

      const systemInstruction = `You are Calorify's AI Nutrition and Fitness Coach.
You provide encouraging, practical, non-judgmental nutrition & fitness coaching.

CRITICAL CONSTRAINTS:
1. Treat all TypeScript-calculated values in the USER CONTEXT object as the absolute source of truth for the session:
   - Daily Calorie Target, Maintenance Calories, BMR, Daily Macro Goals.
   - Today's Total Calories, Protein, Carbs, Fat logged so far.
   - Remaining Calories, Protein, Carbs, Fat.
2. DO NOT recalculate or override these totals unless explicitly asked to explain how they were calculated.
3. NEVER diagnose medical conditions, treat eating disorders, or prescribe drugs/supplements.
4. NEVER recommend extreme starvation diets, purging, or dangerous calorie restriction.
5. If the user asks high-risk medical/disease/pregnancy questions, give a cautious response and advise speaking with a physician or registered dietitian.
6. Keep responses mobile-friendly, scannable, empathetic, and concise (use short paragraphs and small bullet lists).
7. Suggest 2-3 brief follow-up prompt ideas for the user.`;

      const chatSchema = {
        type: Type.OBJECT,
        properties: {
          message: { type: Type.STRING, description: "Your friendly, helpful, concise answer" },
          suggestedPrompts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2-3 short follow-up questions the user might ask",
          },
          safetyNotice: {
            type: Type.STRING,
            description: "Optional cautious notice if question involves medical/health risk",
          },
        },
        required: ["message"],
      };

      // Sanitize context for context injection
      const contextPrompt = `USER NUTRITION CONTEXT:
${JSON.stringify(context || {}, null, 2)}

RECENT CHAT HISTORY:
${JSON.stringify(history || [], null, 2)}

USER QUESTION:
"${userMessage}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: contextPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: chatSchema,
          temperature: 0.4,
        },
      });

      const parsed = JSON.parse(response.text || "{}");

      return res.json({
        message: String(parsed.message || "I'm here to support your nutrition goals! How else can I help?"),
        suggestedPrompts: Array.isArray(parsed.suggestedPrompts) ? parsed.suggestedPrompts.slice(0, 3) : [
          "How many calories do I have left?",
          "What should I eat next?",
          "How am I doing on protein?",
        ],
        safetyNotice: parsed.safetyNotice ? String(parsed.safetyNotice) : undefined,
      });
    } catch (err) {
      return handleGeminiError(
        err,
        res,
        "The AI Coach is currently unavailable. Please try again in a moment."
      );
    }
  });

  // Serve static files in production or Vite middleware in development
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Calorify server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
