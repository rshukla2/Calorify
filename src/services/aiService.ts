import {
  AIFoodEstimate,
  AIPhotoNutritionEstimate,
  ChatMessage,
  ChatResponse,
  NutritionChatContext,
} from "../types";
import { isDemoMode } from "./demoMode";
import { demoAiService } from "./demoAiService";

export class AIServiceError extends Error {
  isRateLimit?: boolean;
  constructor(message: string, isRateLimit?: boolean) {
    super(message);
    this.name = "AIServiceError";
    this.isRateLimit = isRateLimit;
  }
}

const AI_UNAVAILABLE_MESSAGE =
  "AI features need the Calorify backend server, which isn't running in this demo. You can still add food manually.";

async function postJson(url: string, body: unknown): Promise<{ response: Response; data: any }> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AIServiceError(AI_UNAVAILABLE_MESSAGE);
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    // Static hosting (e.g. GitHub Pages) returns HTML 404/405 pages for /api routes.
    throw new AIServiceError(AI_UNAVAILABLE_MESSAGE);
  }
  return { response, data };
}

export const aiService = {
  /**
   * Search food nutrition by natural language query
   */
  async estimateFood(query: string): Promise<AIFoodEstimate> {
    if (isDemoMode) return demoAiService.estimateFood(query);
    const { response, data } = await postJson("/api/ai/estimate-food", { query });

    if (!response.ok) {
      throw new AIServiceError(
        data.error || "Failed to estimate food nutrition.",
        data.isRateLimit || response.status === 429
      );
    }

    return data as AIFoodEstimate;
  },

  /**
   * Analyze food photo and return multi-item nutrition estimate
   */
  async analyzeFoodImage(imageBase64: string, mimeType: string = "image/jpeg"): Promise<AIPhotoNutritionEstimate> {
    if (isDemoMode) return demoAiService.analyzeFoodImage(imageBase64, mimeType);
    const { response, data } = await postJson("/api/ai/analyze-food-image", { imageBase64, mimeType });

    if (!response.ok) {
      throw new AIServiceError(
        data.error || "Failed to analyze food photo.",
        data.isRateLimit || response.status === 429
      );
    }

    return data as AIPhotoNutritionEstimate;
  },

  /**
   * Send question to AI Coach
   */
  async sendChatMessage(
    message: string,
    context: NutritionChatContext,
    history: ChatMessage[] = []
  ): Promise<ChatResponse> {
    if (isDemoMode) return demoAiService.sendChatMessage(message, context, history);
    const formattedHistory = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      text: msg.content,
    }));

    const { response, data } = await postJson("/api/ai/chat", {
        message,
        context,
        history: formattedHistory,
      });

    if (!response.ok) {
      throw new AIServiceError(
        data.error || "The AI Coach is currently unavailable.",
        data.isRateLimit || response.status === 429
      );
    }

    return data as ChatResponse;
  },
};
