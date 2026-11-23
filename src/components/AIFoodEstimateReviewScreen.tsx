import React, { useEffect, useState } from "react";
import { Sparkles, Check, ArrowLeft, ShieldCheck, HelpCircle } from "lucide-react";
import { AIFoodEstimate, FoodLogEntry, MealType } from "../types";
import { MEAL_TYPES, COMMON_SERVING_UNITS } from "../constants";

interface AIFoodEstimateReviewScreenProps {
  estimate: AIFoodEstimate;
  initialMealType: MealType;
  selectedDate: string;
  originalQuery: string;
  onSave: (entry: Omit<FoodLogEntry, "id" | "createdAt" | "updatedAt">) => void;
  onBack: () => void;
}

export const AIFoodEstimateReviewScreen: React.FC<AIFoodEstimateReviewScreenProps> = ({
  estimate,
  initialMealType,
  selectedDate,
  originalQuery,
  onSave,
  onBack,
}) => {
  const [foodName, setFoodName] = useState(estimate.foodName);
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [date, setDate] = useState(selectedDate);

  // Portion quantity & unit
  const [baseAmount] = useState(estimate.baseServingAmount || 1);
  const [servingAmount, setServingAmount] = useState<number>(estimate.baseServingAmount || 1);
  const [servingUnit, setServingUnit] = useState(estimate.baseServingUnit || "serving");
  const [servingDescription, setServingDescription] = useState(
    estimate.servingDescription || `${estimate.baseServingAmount || 1} ${estimate.baseServingUnit || "serving"}`
  );

  // Nutrition values
  const [calories, setCalories] = useState<number>(estimate.calories);
  const [proteinGrams, setProteinGrams] = useState<number>(estimate.proteinGrams);
  const [carbGrams, setCarbGrams] = useState<number>(estimate.carbGrams);
  const [fatGrams, setFatGrams] = useState<number>(estimate.fatGrams);

  // Portion Scaling Logic in TypeScript
  const handleServingAmountChange = (newAmount: number) => {
    if (newAmount <= 0) return;
    setServingAmount(newAmount);

    const scaleFactor = newAmount / (baseAmount || 1);
    setCalories(Math.round(estimate.calories * scaleFactor));
    setProteinGrams(Math.round(estimate.proteinGrams * scaleFactor * 10) / 10);
    setCarbGrams(Math.round(estimate.carbGrams * scaleFactor * 10) / 10);
    setFatGrams(Math.round(estimate.fatGrams * scaleFactor * 10) / 10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      date,
      mealType,
      foodName: foodName.trim() || estimate.foodName,
      servingDescription:
        servingDescription.trim() || `${servingAmount} ${servingUnit}`,
      servingAmount: Number(servingAmount) || 1,
      servingUnit: servingUnit.trim() || "serving",
      calories: Math.max(0, Number(calories) || 0),
      proteinGrams: Math.max(0, Number(proteinGrams) || 0),
      carbGrams: Math.max(0, Number(carbGrams) || 0),
      fatGrams: Math.max(0, Number(fatGrams) || 0),
      source: "ai_text",
      aiMetadata: {
        confidence: estimate.confidence,
        assumptions: estimate.assumptions,
        originalQuery,
        estimatedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Top Header Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Search</span>
        </button>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          AI estimate
        </span>
      </div>

      {/* Confidence & Assumptions Box */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-700 font-semibold">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>AI Confidence: {Math.round(estimate.confidence * 100)}%</span>
          </div>
          <span className="text-slate-500 font-normal">Review before saving</span>
        </div>

        {estimate.assumptions && estimate.assumptions.length > 0 && (
          <div className="pt-2 border-t border-slate-200/60 text-slate-600">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              Assumptions:
            </span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
              {estimate.assumptions.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Basic Food Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Food Name
          </label>
          <input
            type="text"
            required
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Meal Type & Date Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Meal Type
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {MEAL_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Portion Scaling Section */}
        <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
              Portion Quantity (TypeScript Scaled)
            </span>
            <span className="text-xs text-emerald-700 font-medium">
              Base: {estimate.baseServingAmount || 1} {estimate.baseServingUnit || "serving"} = {estimate.calories} kcal
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-medium">Quantity</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={servingAmount}
                onChange={(e) => handleServingAmountChange(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1 font-medium">Unit</label>
              <input
                type="text"
                value={servingUnit}
                onChange={(e) => setServingUnit(e.target.value)}
                list="serving-units-list"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <datalist id="serving-units-list">
                {COMMON_SERVING_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Editable Nutrition Grid */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Nutrition Values (Editable)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Calories</label>
              <input
                type="number"
                required
                min="0"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full text-center py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">kcal</span>
            </div>

            <div className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl text-center">
              <label className="block text-xs font-semibold text-rose-800 mb-1">Protein</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={proteinGrams}
                onChange={(e) => setProteinGrams(Number(e.target.value))}
                className="w-full text-center py-1 bg-white border border-rose-200 rounded-lg font-bold text-rose-900 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <span className="text-[10px] text-rose-600 font-medium">grams</span>
            </div>

            <div className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl text-center">
              <label className="block text-xs font-semibold text-amber-800 mb-1">Carbs</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={carbGrams}
                onChange={(e) => setCarbGrams(Number(e.target.value))}
                className="w-full text-center py-1 bg-white border border-amber-200 rounded-lg font-bold text-amber-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-amber-600 font-medium">grams</span>
            </div>

            <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-center">
              <label className="block text-xs font-semibold text-blue-800 mb-1">Fat</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={fatGrams}
                onChange={(e) => setFatGrams(Number(e.target.value))}
                className="w-full text-center py-1 bg-white border border-blue-200 rounded-lg font-bold text-blue-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-blue-600 font-medium">grams</span>
            </div>
          </div>
        </div>

        {/* Optional Micronutrients */}
        {(estimate.fiberGrams !== undefined || estimate.sugarGrams !== undefined || estimate.sodiumMg !== undefined) && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-wrap gap-4 text-slate-600">
            {estimate.fiberGrams !== undefined && (
              <div>
                <span className="font-semibold text-slate-700">Fiber: </span>
                <span>{estimate.fiberGrams}g</span>
              </div>
            )}
            {estimate.sugarGrams !== undefined && (
              <div>
                <span className="font-semibold text-slate-700">Sugar: </span>
                <span>{estimate.sugarGrams}g</span>
              </div>
            )}
            {estimate.sodiumMg !== undefined && (
              <div>
                <span className="font-semibold text-slate-700">Sodium: </span>
                <span>{estimate.sodiumMg}mg</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 border border-slate-200 rounded-xl font-medium text-slate-700 text-sm hover:bg-slate-50 transition"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <Check className="w-4 h-4" />
          <span>Review and Save</span>
        </button>
      </div>
    </form>
  );
};
