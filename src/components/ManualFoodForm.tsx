import React, { useEffect, useState } from "react";
import { X, Calculator, Plus, Save } from "lucide-react";
import { COMMON_SERVING_UNITS, MEAL_TYPES } from "../constants";
import { FoodLogEntry, MealType } from "../types";
import { scaleNutrition } from "../utils/calculations";

interface ManualFoodFormProps {
  isOpen: boolean;
  isEmbedded?: boolean;
  onClose: () => void;
  onSave: (entry: Omit<FoodLogEntry, "id" | "createdAt" | "updatedAt"> & { id?: string }) => void;
  initialMealType?: MealType;
  selectedDate: string;
  editingEntry?: FoodLogEntry | null;
  id?: string;
}

export const ManualFoodForm: React.FC<ManualFoodFormProps> = ({
  isOpen,
  isEmbedded = false,
  onClose,
  onSave,
  initialMealType = "breakfast",
  selectedDate,
  editingEntry = null,
  id = "manual-food-form-modal",
}) => {
  const [foodName, setFoodName] = useState("");
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [date, setDate] = useState(selectedDate);

  // Serving parameters
  const [servingAmount, setServingAmount] = useState<number>(1);
  const [servingUnit, setServingUnit] = useState<string>("serving");
  const [servingDescription, setServingDescription] = useState("");

  // Base Nutrition per base serving unit
  const [calories, setCalories] = useState<number | "">(0);
  const [proteinGrams, setProteinGrams] = useState<number | "">(0);
  const [carbGrams, setCarbGrams] = useState<number | "">(0);
  const [fatGrams, setFatGrams] = useState<number | "">(0);

  // Base reference for portion scaling
  const [baseAmount, setBaseAmount] = useState<number>(1);
  const [baseCalories, setBaseCalories] = useState<number>(0);
  const [baseProtein, setBaseProtein] = useState<number>(0);
  const [baseCarbs, setBaseCarbs] = useState<number>(0);
  const [baseFat, setBaseFat] = useState<number>(0);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or populate state when modal opens or editingEntry changes
  useEffect(() => {
    if (editingEntry) {
      setFoodName(editingEntry.foodName);
      setMealType(editingEntry.mealType);
      setDate(editingEntry.date);
      setServingAmount(editingEntry.servingAmount || 1);
      setServingUnit(editingEntry.servingUnit || "serving");
      setServingDescription(editingEntry.servingDescription || "");

      setCalories(editingEntry.calories);
      setProteinGrams(editingEntry.proteinGrams);
      setCarbGrams(editingEntry.carbGrams);
      setFatGrams(editingEntry.fatGrams);

      setBaseAmount(editingEntry.servingAmount || 1);
      setBaseCalories(editingEntry.calories);
      setBaseProtein(editingEntry.proteinGrams);
      setBaseCarbs(editingEntry.carbGrams);
      setBaseFat(editingEntry.fatGrams);
    } else {
      setFoodName("");
      setMealType(initialMealType);
      setDate(selectedDate);
      setServingAmount(1);
      setServingUnit("serving");
      setServingDescription("");

      setCalories("");
      setProteinGrams(0);
      setCarbGrams(0);
      setFatGrams(0);

      setBaseAmount(1);
      setBaseCalories(0);
      setBaseProtein(0);
      setBaseCarbs(0);
      setBaseFat(0);
    }
    setErrors({});
  }, [editingEntry, initialMealType, selectedDate, isOpen]);

  // Handle portion scaling when serving amount changes
  const handleServingAmountChange = (newAmount: number) => {
    setServingAmount(newAmount);

    // If base values are established, scale automatically
    if (baseAmount > 0 && baseCalories > 0 && newAmount > 0) {
      const scaled = scaleNutrition(
        baseCalories,
        baseProtein,
        baseCarbs,
        baseFat,
        baseAmount,
        newAmount
      );
      setCalories(scaled.calories);
      setProteinGrams(scaled.proteinGrams);
      setCarbGrams(scaled.carbGrams);
      setFatGrams(scaled.fatGrams);
    }
  };

  // Update base values whenever user manually inputs primary nutrition numbers
  const handleNutritionManualChange = (
    field: "calories" | "protein" | "carbs" | "fat",
    val: number | ""
  ) => {
    const numVal = typeof val === "number" ? val : 0;

    if (field === "calories") {
      setCalories(val);
      setBaseCalories(numVal);
      setBaseAmount(servingAmount || 1);
    } else if (field === "protein") {
      setProteinGrams(val);
      setBaseProtein(numVal);
    } else if (field === "carbs") {
      setCarbGrams(val);
      setBaseCarbs(numVal);
    } else if (field === "fat") {
      setFatGrams(val);
      setBaseFat(numVal);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!foodName.trim()) {
      newErrors.foodName = "Food name is required.";
    }

    if (!servingAmount || servingAmount <= 0) {
      newErrors.servingAmount = "Serving amount must be greater than 0.";
    }

    if (calories === "" || calories < 0) {
      newErrors.calories = "Calories are required and cannot be negative.";
    }

    if (proteinGrams !== "" && proteinGrams < 0) {
      newErrors.proteinGrams = "Protein cannot be negative.";
    }

    if (carbGrams !== "" && carbGrams < 0) {
      newErrors.carbGrams = "Carbs cannot be negative.";
    }

    if (fatGrams !== "" && fatGrams < 0) {
      newErrors.fatGrams = "Fat cannot be negative.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: editingEntry?.id,
      date,
      mealType,
      foodName: foodName.trim(),
      servingAmount: Number(servingAmount),
      servingUnit,
      servingDescription: servingDescription.trim(),
      calories: Number(calories) || 0,
      proteinGrams: Number(proteinGrams) || 0,
      carbGrams: Number(carbGrams) || 0,
      fatGrams: Number(fatGrams) || 0,
      source: "manual",
    });
  };

  if (!isOpen) return null;

  if (isEmbedded) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Food Name */}
        <div>
          <label htmlFor="manual-food-name" className="block text-xs font-semibold text-slate-700 mb-1">
            Food Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="manual-food-name"
            type="text"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder="e.g. Grilled Chicken Breast, Oatmeal"
            className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
              errors.foodName ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
            }`}
          />
          {errors.foodName && (
            <p className="text-xs text-rose-600 mt-1">{errors.foodName}</p>
          )}
        </div>

        {/* Meal Type & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Meal Category
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              {MEAL_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Serving Controls */}
        <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" /> Portion & Quantity
            </span>
            <span className="text-[11px] text-emerald-700">Auto-scales calories & macros</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Amount
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={servingAmount}
                onChange={(e) =>
                  handleServingAmountChange(parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Unit
              </label>
              <select
                value={servingUnit}
                onChange={(e) => setServingUnit(e.target.value)}
                className="w-full px-2 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {COMMON_SERVING_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="e.g. 1 medium breast"
                value={servingDescription}
                onChange={(e) => setServingDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          {errors.servingAmount && (
            <p className="text-xs text-rose-600">{errors.servingAmount}</p>
          )}
        </div>

        {/* Nutrition Values */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Nutrition Values (for {servingAmount} {servingUnit})
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="manual-food-calories" className="block text-xs font-semibold text-slate-700 mb-1">
                Calories (kcal) <span className="text-rose-500">*</span>
              </label>
              <input
                id="manual-food-calories"
                type="number"
                step="1"
                min="0"
                placeholder="e.g. 250"
                value={calories}
                onChange={(e) =>
                  handleNutritionManualChange(
                    "calories",
                    e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0)
                  )
                }
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.calories ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                }`}
              />
              {errors.calories && (
                <p className="text-xs text-rose-600 mt-1">{errors.calories}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={proteinGrams}
                onChange={(e) =>
                  handleNutritionManualChange(
                    "protein",
                    e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0)
                  )
                }
                className="w-full px-3 py-2 text-sm bg-amber-50/30 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-blue-800 mb-1">
                Carbohydrates (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={carbGrams}
                onChange={(e) =>
                  handleNutritionManualChange(
                    "carbs",
                    e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0)
                  )
                }
                className="w-full px-3 py-2 text-sm bg-blue-50/30 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-rose-800 mb-1">
                Fat (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={fatGrams}
                onChange={(e) =>
                  handleNutritionManualChange(
                    "fat",
                    e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0)
                  )
                }
                className="w-full px-3 py-2 text-sm bg-rose-50/30 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Food Entry</span>
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      id={id}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 relative my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {editingEntry ? "Edit Food Entry" : "Log Food Manually"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Food Name */}
          <div>
            <label htmlFor="manual-food-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Food Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="manual-food-name"
              type="text"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g. Grilled Chicken Breast, Oatmeal"
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                errors.foodName ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
              }`}
            />
            {errors.foodName && (
              <p className="text-xs text-rose-600 mt-1">{errors.foodName}</p>
            )}
          </div>

          {/* Meal Type & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meal Category
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                {MEAL_TYPES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Serving Controls */}
          <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" /> Portion & Quantity
              </span>
              <span className="text-[11px] text-emerald-700">Auto-scales calories & macros</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={servingAmount}
                  onChange={(e) =>
                    handleServingAmountChange(parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Unit
                </label>
                <select
                  value={servingUnit}
                  onChange={(e) => setServingUnit(e.target.value)}
                  className="w-full px-2 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {COMMON_SERVING_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1 medium breast"
                  value={servingDescription}
                  onChange={(e) => setServingDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            {errors.servingAmount && (
              <p className="text-xs text-rose-600">{errors.servingAmount}</p>
            )}
          </div>

          {/* Nutrition Values */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Nutrition Values (for {servingAmount} {servingUnit})
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label htmlFor="manual-food-calories" className="block text-xs font-semibold text-slate-700 mb-1">
                  Calories (kcal) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="manual-food-calories"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 250"
                  value={calories}
                  onChange={(e) =>
                    handleNutritionManualChange(
                      "calories",
                      e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0)
                    )
                  }
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.calories ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                  }`}
                />
                {errors.calories && (
                  <p className="text-xs text-rose-600 mt-1">{errors.calories}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  value={proteinGrams}
                  onChange={(e) =>
                    handleNutritionManualChange(
                      "protein",
                      e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0)
                    )
                  }
                  className="w-full px-3 py-2 text-sm bg-amber-50/30 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-800 mb-1">
                  Carbohydrates (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  value={carbGrams}
                  onChange={(e) =>
                    handleNutritionManualChange(
                      "carbs",
                      e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0)
                    )
                  }
                  className="w-full px-3 py-2 text-sm bg-blue-50/30 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-rose-800 mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  value={fatGrams}
                  onChange={(e) =>
                    handleNutritionManualChange(
                      "fat",
                      e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0)
                    )
                  }
                  className="w-full px-3 py-2 text-sm bg-rose-50/30 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              {editingEntry ? "Update Entry" : "Save Food Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
