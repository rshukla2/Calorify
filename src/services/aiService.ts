import {
  AIFoodEstimate,
  AIPhotoNutritionEstimate,
  ChatMessage,
  ChatResponse,
  NutritionChatContext,
} from "../types";

export class AIServiceError extends Error {
  isRateLimit?: boolean;
  constructor(message: string, isRateLimit?: boolean) {
    super(message);
    this.name = "AIServiceError";
    this.isRateLimit = isRateLimit;
  }
}

export const aiService = {
  /**
   * Search food nutrition by natural language query
   */
  async estimateFood(query: string): Promise<AIFoodEstimate> {
    const response = await fetch("/api/ai/estimate-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

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
    const response = await fetch("/api/ai/analyze-food-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType }),
    });

    const data = await response.json();

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
    const formattedHistory = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      text: msg.content,
    }));

    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        context,
        history: formattedHistory,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new AIServiceError(
        data.error || "The AI Coach is currently unavailable.",
        data.isRateLimit || response.status === 429
      );
    }

    return data as ChatResponse;
  },
};
