import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  Trash2,
  AlertCircle,
  Bot,
  User as UserIcon,
  Flame,
  Target,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { ChatMessage, NutritionChatContext, UserProfile } from "../types";
import { aiService } from "../services/aiService";
import { storageService } from "../services/storageService";

export interface DailyLogSummary {
  totalCalories: number;
  calorieTarget: number;
  caloriesRemaining: number;
  totalProtein: number;
  proteinTarget: number;
  totalCarbs: number;
  carbTarget: number;
  totalFat: number;
  fatTarget: number;
}

interface CoachTabProps {
  userProfile: UserProfile;
  dailySummary: DailyLogSummary;
  selectedDate: string;
}

const PRESET_QUESTIONS = [
  "How am I doing on protein today?",
  "Suggest a high-protein dinner under 500 kcal.",
  "What should I eat to fill my remaining calorie goal?",
  "How can I adjust my daily routine to reach my goal faster?",
];

export const CoachTab: React.FC<CoachTabProps> = ({
  userProfile,
  dailySummary,
  selectedDate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedHistory = storageService.getChatHistory();
    if (savedHistory.length > 0) {
      setMessages(savedHistory);
    } else {
      // Welcome message from Coach
      const welcomeMsg: ChatMessage = {
        id: "welcome",
        role: "assistant",
        content: `Hi ${userProfile.name || "there"}! 👋 I'm your AI Nutrition & Fitness Coach. I've reviewed your profile and today's log (${dailySummary.totalCalories} / ${dailySummary.calorieTarget} kcal consumed). How can I help you reach your goals today?`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
      storageService.saveChatHistory([welcomeMsg]);
    }
  }, [userProfile.name, dailySummary.totalCalories, dailySummary.calorieTarget]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setErrorNotice(null);

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    storageService.saveChatHistory(updatedMessages);
    if (!textToSend) setInputText("");
    setIsLoading(true);

    // Build context payload for Gemini
    const chatContext: NutritionChatContext = {
      profile: {
        name: userProfile.name,
        age: userProfile.age,
        biologicalSex: userProfile.biologicalSex,
        heightCm: userProfile.heightCm,
        weightKg: userProfile.weightKg,
        activityLevel: userProfile.activityLevel,
        goal: userProfile.goal,
        bmr: userProfile.bmr,
        maintenanceCalories: userProfile.maintenanceCalories,
        dailyCalorieGoal: userProfile.dailyCalorieGoal,
        proteinGoalGrams: userProfile.proteinGoalGrams,
        carbGoalGrams: userProfile.carbGoalGrams,
        fatGoalGrams: userProfile.fatGoalGrams,
      },
      selectedDate,
      dailyTotals: {
        calories: dailySummary.totalCalories,
        proteinGrams: dailySummary.totalProtein,
        carbGrams: dailySummary.totalCarbs,
        fatGrams: dailySummary.totalFat,
      },
      remaining: {
        calories: dailySummary.caloriesRemaining,
        proteinGrams: Math.max(0, dailySummary.proteinTarget - dailySummary.totalProtein),
        carbGrams: Math.max(0, dailySummary.carbTarget - dailySummary.totalCarbs),
        fatGrams: Math.max(0, dailySummary.fatTarget - dailySummary.totalFat),
      },
      meals: [],
    };

    try {
      const response = await aiService.sendChatMessage(text, chatContext, updatedMessages);

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: response.message,
        suggestedPrompts: response.suggestedPrompts,
        safetyNotice: response.safetyNotice,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      storageService.saveChatHistory(finalMessages);
    } catch (err: any) {
      console.error("Coach chat error:", err);
      setErrorNotice(
        err.message || "The AI Coach is currently unavailable. Please try again in a moment."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear your conversation history?")) {
      storageService.clearChatHistory();
      const resetMsg: ChatMessage = {
        id: "welcome_reset",
        role: "assistant",
        content: `Chat history cleared. How can I assist you with your fitness journey today?`,
        timestamp: new Date().toISOString(),
      };
      setMessages([resetMsg]);
      storageService.saveChatHistory([resetMsg]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Banner - Context Awareness Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">Calorify AI Coach</h2>
              <p className="text-xs text-slate-300">
                Personalized guidance powered by your profile & live daily logs
              </p>
            </div>
          </div>

          <button
            onClick={handleClearChat}
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-1.5 transition ml-auto"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>

        {/* Live Today's Snapshot Chip */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Today: <strong className="text-white">{dailySummary.totalCalories}</strong> / {dailySummary.calorieTarget} kcal
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Remaining: <strong className="text-emerald-400">{dailySummary.caloriesRemaining} kcal</strong>
            </span>
          </div>
          <div className="text-slate-400 ml-auto hidden sm:block">
            P: {dailySummary.totalProtein}g | C: {dailySummary.totalCarbs}g | F: {dailySummary.totalFat}g
          </div>
        </div>
      </div>

      {/* Chat Messages Window */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[420px] max-h-[550px]">
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs ${
                  msg.role === "user"
                    ? "bg-slate-800"
                    : "bg-emerald-600 border border-emerald-500"
                }`}
              >
                {msg.role === "user" ? (
                  <UserIcon className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`rounded-2xl p-3.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-tr-none shadow-xs"
                    : "bg-slate-100/90 text-slate-800 rounded-tl-none border border-slate-200/60"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div
                  className={`text-[10px] mt-1.5 text-right ${
                    msg.role === "user" ? "text-emerald-200" : "text-slate-400"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-slate-100 rounded-2xl rounded-tl-none text-slate-600 text-xs flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span>Coach is typing...</span>
              </div>
            </div>
          )}

          {errorNotice && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Chat Service Interrupted</p>
                <p className="text-amber-800">{errorNotice}</p>
              </div>
              <button
                type="button"
                onClick={() => handleSendMessage()}
                className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/60 overflow-x-auto flex gap-2 no-scrollbar">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 shrink-0 pr-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Suggestions:</span>
          </div>
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(q)}
              className="text-xs px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-slate-700 rounded-full whitespace-nowrap transition shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask your Coach anything about nutrition, meal ideas, or workouts..."
            disabled={isLoading}
            maxLength={500}
            className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-full text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition"
            title="Send Message"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
