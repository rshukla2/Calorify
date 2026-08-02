import React, { useEffect, useState } from "react";
import { Sparkles, Search, History, AlertCircle, ArrowRight, PenTool } from "lucide-react";
import { AIFoodEstimate, AIRequestStatus } from "../types";
import { aiService } from "../services/aiService";
import { storageService } from "../services/storageService";

interface AIFoodSearchFormProps {
  onEstimateReceived: (estimate: AIFoodEstimate, query: string) => void;
  onSwitchToManual: () => void;
}

const EXAMPLE_QUERIES = [
  "One medium banana",
  "Two scrambled eggs with butter",
  "Chipotle chicken burrito bowl",
  "1 cup homemade lentil curry",
  "180g grilled chicken breast",
];

export const AIFoodSearchForm: React.FC<AIFoodSearchFormProps> = ({
  onEstimateReceived,
  onSwitchToManual,
}) => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AIRequestStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(storageService.getRecentSearches());
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const estimate = await aiService.estimateFood(cleanQuery);
      storageService.addRecentSearch(cleanQuery);
      setStatus("success");
      onEstimateReceived(estimate, cleanQuery);
    } catch (err: any) {
      console.error("Food search error:", err);
      if (err.isRateLimit) {
        setStatus("rate_limited");
      } else {
        setStatus("error");
      }
      setErrorMessage(
        err.message || "Calorify could not estimate this food right now. You can try again or enter it manually."
      );
    }
  };

  const handleSelectExample = (text: string) => {
    setQuery(text);
  };

  return (
    <div className="space-y-5">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Describe what you ate or drank:
        </label>
        <div className="relative rounded-xl shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 2 scrambled eggs, toast with jam, black coffee"
            disabled={status === "loading"}
            maxLength={300}
            className="block w-full pl-11 pr-24 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base transition"
          />
          <button
            type="submit"
            disabled={!query.trim() || status === "loading"}
            className="absolute right-2 top-2 bottom-2 px-4 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
          >
            {status === "loading" ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Estimating...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Estimate</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading Indicator Bar */}
      {status === "loading" && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Estimating nutrition with Gemini AI...</p>
            <p className="text-xs text-emerald-700">Analyzing portion, macros, and common cooking methods</p>
          </div>
        </div>
      )}

      {/* Error & Rate Limit States */}
      {(status === "error" || status === "rate_limited") && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 text-slate-800">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">
                {status === "rate_limited" ? "AI Service Busy" : "Estimation Unavailable"}
              </p>
              <p className="text-amber-800 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60">
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="text-xs font-semibold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={onSwitchToManual}
              className="text-xs font-semibold px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-100 flex items-center gap-1 transition"
            >
              <PenTool className="w-3.5 h-3.5" />
              Enter Food Manually
            </button>
          </div>
        </div>
      )}

      {/* Example Suggestions */}
      {status !== "loading" && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Try an example:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_QUERIES.map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectExample(example)}
                className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80 rounded-lg text-slate-700 transition text-left"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && status !== "loading" && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>Recent searches:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentSearches.slice(0, 5).map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectExample(item)}
                className="text-xs px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-md transition flex items-center gap-1"
              >
                <span>{item}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
