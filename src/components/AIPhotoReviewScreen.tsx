import React, { useMemo, useState } from "react";
import { Camera, Check, Trash2, Plus, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { AIPhotoDetectedItem, AIPhotoNutritionEstimate, FoodLogEntry, MealType } from "../types";
import { MEAL_TYPES, COMMON_SERVING_UNITS } from "../constants";

interface AIPhotoReviewScreenProps {
  photoEstimate: AIPhotoNutritionEstimate;
  initialMealType: MealType;
  selectedDate: string;
  onSaveItems: (entries: Array<Omit<FoodLogEntry, "id" | "createdAt" | "updatedAt">>) => void;
  onBack: () => void;
}

export const AIPhotoReviewScreen: React.FC<AIPhotoReviewScreenProps> = ({
  photoEstimate,
  initialMealType,
  selectedDate,
  onSaveItems,
  onBack,
}) => {
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [date, setDate] = useState(selectedDate);
  const [items, setItems] = useState<AIPhotoDetectedItem[]>(photoEstimate.detectedItems);

  // Recompute combined totals in TypeScript dynamically
  const recomputedTotals = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        calories: acc.calories + (Number(item.calories) || 0),
        proteinGrams: Math.round((acc.proteinGrams + (Number(item.proteinGrams) || 0)) * 10) / 10,
        carbGrams: Math.round((acc.carbGrams + (Number(item.carbGrams) || 0)) * 10) / 10,
        fatGrams: Math.round((acc.fatGrams + (Number(item.fatGrams) || 0)) * 10) / 10,
      }),
      { calories: 0, proteinGrams: 0, carbGrams: 0, fatGrams: 0 }
    );
  }, [items]);

  const handleItemChange = (id: string, field: keyof AIPhotoDetectedItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // TypeScript portion scaling if baseServingAmount changes
        if (field === "baseServingAmount" && Number(value) > 0) {
          const newAmount = Number(value);
          const oldAmount = item.baseServingAmount || 1;
          const ratio = newAmount / oldAmount;

          updated.calories = Math.round((item.calories || 0) * ratio);
          updated.proteinGrams = Math.round((item.proteinGrams || 0) * ratio * 10) / 10;
          updated.carbGrams = Math.round((item.carbGrams || 0) * ratio * 10) / 10;
          updated.fatGrams = Math.round((item.fatGrams || 0) * ratio * 10) / 10;
        }

        return updated;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddItem = () => {
    const newItem: AIPhotoDetectedItem = {
      id: `item_manual_${Date.now()}`,
      foodName: "New Food Item",
      servingDescription: "1 serving",
      baseServingAmount: 1,
      baseServingUnit: "serving",
      calories: 100,
      proteinGrams: 5,
      carbGrams: 10,
      fatGrams: 2,
      confidence: 1.0,
      assumptions: ["User manually added item"],
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const newLogEntries = items.map((item) => ({
      date,
      mealType,
      foodName: item.foodName.trim() || "Food Item",
      servingDescription: item.servingDescription || `${item.baseServingAmount} ${item.baseServingUnit}`,
      servingAmount: Number(item.baseServingAmount) || 1,
      servingUnit: item.baseServingUnit || "serving",
      calories: Math.max(0, Number(item.calories) || 0),
      proteinGrams: Math.max(0, Number(item.proteinGrams) || 0),
      carbGrams: Math.max(0, Number(item.carbGrams) || 0),
      fatGrams: Math.max(0, Number(item.fatGrams) || 0),
      source: "ai_image" as const,
      aiMetadata: {
        confidence: item.confidence,
        assumptions: item.assumptions,
        estimatedAt: new Date().toISOString(),
      },
    }));

    onSaveItems(newLogEntries);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retake / Back</span>
        </button>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
          <Camera className="w-3.5 h-3.5 text-emerald-600" />
          AI-estimated from photo
        </span>
      </div>

      {/* Confidence & Notes */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
        <div className="flex items-center justify-between font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Photo Confidence: {Math.round(photoEstimate.overallConfidence * 100)}%</span>
          </div>
          <span className="text-slate-500 font-normal">{items.length} item(s) detected</span>
        </div>
        {photoEstimate.notes && photoEstimate.notes.length > 0 && (
          <p className="text-slate-600 italic mt-0.5">{photoEstimate.notes.join(". ")}</p>
        )}
      </div>

      {/* Date & Meal Type Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Meal Type
          </label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Dynamic Recomputed Combined Totals Bar */}
      <div className="p-3.5 bg-emerald-950 text-white rounded-2xl shadow-sm space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
            Combined Meal Total (TypeScript Recalculated)
          </span>
          <span className="text-xs text-emerald-400 font-medium">
            {items.length} food item(s)
          </span>
        </div>
        <div className="flex items-baseline gap-4 pt-1">
          <div>
            <span className="text-xl font-black text-emerald-400">{recomputedTotals.calories}</span>
            <span className="text-xs text-slate-300 ml-1">kcal</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-200 font-medium ml-auto">
            <span>P: <strong className="text-rose-300">{recomputedTotals.proteinGrams}g</strong></span>
            <span>C: <strong className="text-amber-300">{recomputedTotals.carbGrams}g</strong></span>
            <span>F: <strong className="text-blue-300">{recomputedTotals.fatGrams}g</strong></span>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Detected Items (Edit or Remove)
          </span>
          <button
            type="button"
            onClick={handleAddItem}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
            <p className="text-sm font-medium text-slate-600">All detected items were removed.</p>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
            >
              Add Item Manually
            </button>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-3 relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <input
                  type="text"
                  required
                  value={item.foodName}
                  onChange={(e) => handleItemChange(item.id, "foodName", e.target.value)}
                  placeholder="Food name"
                  className="font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none flex-1"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Portion Inputs */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-slate-500 mb-0.5">Portion Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={item.baseServingAmount}
                    onChange={(e) =>
                      handleItemChange(item.id, "baseServingAmount", parseFloat(e.target.value) || 1)
                    }
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">Portion Unit</label>
                  <input
                    type="text"
                    value={item.baseServingUnit}
                    onChange={(e) => handleItemChange(item.id, "baseServingUnit", e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Nutrition row */}
              <div className="grid grid-cols-4 gap-2 text-xs text-center">
                <div className="p-1.5 bg-white border border-slate-200 rounded-lg">
                  <span className="block text-[10px] font-semibold text-slate-500">kcal</span>
                  <input
                    type="number"
                    min="0"
                    value={item.calories}
                    onChange={(e) => handleItemChange(item.id, "calories", Number(e.target.value))}
                    className="w-full text-center font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div className="p-1.5 bg-white border border-rose-200 rounded-lg">
                  <span className="block text-[10px] font-semibold text-rose-600">Prot (g)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={item.proteinGrams}
                    onChange={(e) => handleItemChange(item.id, "proteinGrams", Number(e.target.value))}
                    className="w-full text-center font-bold text-rose-900 focus:outline-none"
                  />
                </div>
                <div className="p-1.5 bg-white border border-amber-200 rounded-lg">
                  <span className="block text-[10px] font-semibold text-amber-600">Carb (g)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={item.carbGrams}
                    onChange={(e) => handleItemChange(item.id, "carbGrams", Number(e.target.value))}
                    className="w-full text-center font-bold text-amber-900 focus:outline-none"
                  />
                </div>
                <div className="p-1.5 bg-white border border-blue-200 rounded-lg">
                  <span className="block text-[10px] font-semibold text-blue-600">Fat (g)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={item.fatGrams}
                    onChange={(e) => handleItemChange(item.id, "fatGrams", Number(e.target.value))}
                    className="w-full text-center font-bold text-blue-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))
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
          disabled={items.length === 0}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <Check className="w-4 h-4" />
          <span>Save {items.length} Item(s)</span>
        </button>
      </div>
    </form>
  );
};
