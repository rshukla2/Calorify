import React, { useEffect, useState } from "react";
import { ACTIVITY_OPTIONS, GOAL_OPTIONS, WEEKLY_CHANGE_OPTIONS } from "../constants";
import { ActivityLevel, BiologicalSex, PrimaryGoal, UserProfile } from "../types";
import {
  calculateBMR,
  calculateDefaultMacroGoals,
  calculateMaintenanceCalories,
  calculateRecommendedCalorieGoal,
  cmToFeetInches,
  feetInchesToCm,
  kgToLbs,
  lbsToKg,
} from "../utils/calculations";
import { Info, RefreshCw, Save, Sliders, Sparkles } from "lucide-react";

interface ProfileFormProps {
  initialProfile?: UserProfile | null;
  onSave: (profile: UserProfile) => void;
  isInitialOnboarding?: boolean;
  id?: string;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialProfile,
  onSave,
  isInitialOnboarding = false,
  id = "profile-form-container",
}) => {
  // Unit mode state for input convenience
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");

  // Form fields
  const [name, setName] = useState(initialProfile?.name || "");
  const [age, setAge] = useState<number | "">(initialProfile?.age || 28);
  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex>(
    initialProfile?.biologicalSex || "female"
  );

  // Metric values (primary stored values)
  const [heightCm, setHeightCm] = useState<number | "">(initialProfile?.heightCm || 168);
  const [weightKg, setWeightKg] = useState<number | "">(initialProfile?.weightKg || 65);

  // Imperial helper fields
  const [feet, setFeet] = useState<number>(5);
  const [inches, setInches] = useState<number>(6);
  const [weightLbs, setWeightLbs] = useState<number>(143);

  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialProfile?.activityLevel || "moderately_active"
  );
  const [goal, setGoal] = useState<PrimaryGoal>(
    initialProfile?.goal || "lose_weight"
  );
  const [weeklyGoalKg, setWeeklyGoalKg] = useState<number>(
    initialProfile?.weeklyGoalKg ?? 0.5
  );

  // Custom Override Goal Values
  const [isCustomOverride, setIsCustomOverride] = useState(false);
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState<number | "">(
    initialProfile?.dailyCalorieGoal || 2000
  );
  const [proteinGoalGrams, setProteinGoalGrams] = useState<number | "">(
    initialProfile?.proteinGoalGrams || 150
  );
  const [carbGoalGrams, setCarbGoalGrams] = useState<number | "">(
    initialProfile?.carbGoalGrams || 200
  );
  const [fatGoalGrams, setFatGoalGrams] = useState<number | "">(
    initialProfile?.fatGoalGrams || 65
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync imperial inputs when height/weight changes
  useEffect(() => {
    if (typeof heightCm === "number" && heightCm > 0) {
      const fi = cmToFeetInches(heightCm);
      setFeet(fi.feet);
      setInches(fi.inches);
    }
    if (typeof weightKg === "number" && weightKg > 0) {
      setWeightLbs(kgToLbs(weightKg));
    }
  }, [heightCm, weightKg]);

  // Derived Calculations
  const numWeight = typeof weightKg === "number" ? weightKg : 0;
  const numHeight = typeof heightCm === "number" ? heightCm : 0;
  const numAge = typeof age === "number" ? age : 0;

  const calculatedBmr = calculateBMR(numWeight, numHeight, numAge, biologicalSex);
  const calculatedMaintenance = calculateMaintenanceCalories(calculatedBmr, activityLevel);
  const recommendedCalorieGoal = calculateRecommendedCalorieGoal(
    calculatedMaintenance,
    goal,
    biologicalSex,
    weeklyGoalKg
  );
  const defaultMacros = calculateDefaultMacroGoals(recommendedCalorieGoal);

  // Auto-update goals unless user toggled custom override
  useEffect(() => {
    if (!isCustomOverride && !initialProfile) {
      setDailyCalorieGoal(recommendedCalorieGoal);
      setProteinGoalGrams(defaultMacros.proteinGoalGrams);
      setCarbGoalGrams(defaultMacros.carbGoalGrams);
      setFatGoalGrams(defaultMacros.fatGoalGrams);
    }
  }, [
    recommendedCalorieGoal,
    defaultMacros.proteinGoalGrams,
    defaultMacros.carbGoalGrams,
    defaultMacros.fatGoalGrams,
    isCustomOverride,
    initialProfile,
  ]);

  const handleRecalculateGoals = () => {
    setDailyCalorieGoal(recommendedCalorieGoal);
    setProteinGoalGrams(defaultMacros.proteinGoalGrams);
    setCarbGoalGrams(defaultMacros.carbGoalGrams);
    setFatGoalGrams(defaultMacros.fatGoalGrams);
    setIsCustomOverride(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (numAge < 13 || numAge > 100) {
      newErrors.age = "Age must be between 13 and 100.";
    }

    if (numHeight < 80 || numHeight > 250) {
      newErrors.heightCm = "Height must be between 80 cm and 250 cm (2'7\" - 8'2\").";
    }

    if (numWeight < 30 || numWeight > 300) {
      newErrors.weightKg = "Weight must be between 30 kg and 300 kg (66 - 660 lbs).";
    }

    const numCalorieGoal = typeof dailyCalorieGoal === "number" ? dailyCalorieGoal : 0;
    if (numCalorieGoal < 800 || numCalorieGoal > 10000) {
      newErrors.dailyCalorieGoal = "Calorie target must be realistic (800 - 10,000 kcal).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const now = new Date().toISOString();
    const finalProfile: UserProfile = {
      id: initialProfile?.id || `user_${Date.now()}`,
      name: name.trim(),
      age: Number(age),
      biologicalSex,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      activityLevel,
      goal,
      weeklyGoalKg,
      bmr: calculatedBmr,
      maintenanceCalories: calculatedMaintenance,
      dailyCalorieGoal: Number(dailyCalorieGoal) || recommendedCalorieGoal,
      proteinGoalGrams: Number(proteinGoalGrams) || defaultMacros.proteinGoalGrams,
      carbGoalGrams: Number(carbGoalGrams) || defaultMacros.carbGoalGrams,
      fatGoalGrams: Number(fatGoalGrams) || defaultMacros.fatGoalGrams,
      createdAt: initialProfile?.createdAt || now,
      updatedAt: now,
    };

    onSave(finalProfile);
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-6">
      {/* Unit system toggle */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Input Units</h3>
          <p className="text-xs text-slate-500">Calculations use metric standard internally</p>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setUnitSystem("metric")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              unitSystem === "metric"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Metric (cm / kg)
          </button>
          <button
            type="button"
            onClick={() => setUnitSystem("imperial")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              unitSystem === "imperial"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Imperial (ft, in / lbs)
          </button>
        </div>
      </div>

      {/* Personal Info Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          Personal Information
        </h3>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Rivera"
            className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.name ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
            }`}
          />
          {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
        </div>

        {/* Age & Sex */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Age (Years) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="13"
              max="100"
              value={age}
              onChange={(e) =>
                setAge(e.target.value === "" ? "" : parseInt(e.target.value) || 0)
              }
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.age ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
              }`}
            />
            {errors.age && <p className="text-xs text-rose-600 mt-1">{errors.age}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Biological Sex
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBiologicalSex("female")}
                className={`py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                  biologicalSex === "female"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Female
              </button>
              <button
                type="button"
                onClick={() => setBiologicalSex("male")}
                className={`py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                  biologicalSex === "male"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Male
              </button>
            </div>
          </div>
        </div>

        {/* Height & Weight Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {unitSystem === "metric" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Height (cm) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="80"
                max="250"
                value={heightCm}
                onChange={(e) =>
                  setHeightCm(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)
                }
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.heightCm ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                }`}
              />
              {errors.heightCm && (
                <p className="text-xs text-rose-600 mt-1">{errors.heightCm}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Height (feet & inches) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={feet}
                    onChange={(e) => {
                      const ft = parseInt(e.target.value) || 0;
                      setFeet(ft);
                      setHeightCm(feetInchesToCm(ft, inches));
                    }}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <span className="text-xs text-slate-500">ft</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={inches}
                    onChange={(e) => {
                      const inch = parseInt(e.target.value) || 0;
                      setInches(inch);
                      setHeightCm(feetInchesToCm(feet, inch));
                    }}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <span className="text-xs text-slate-500">in</span>
                </div>
              </div>
            </div>
          )}

          {unitSystem === "metric" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Weight (kg) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={weightKg}
                onChange={(e) =>
                  setWeightKg(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)
                }
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.weightKg ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                }`}
              />
              {errors.weightKg && (
                <p className="text-xs text-rose-600 mt-1">{errors.weightKg}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Weight (lbs) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="66"
                max="660"
                value={weightLbs}
                onChange={(e) => {
                  const lbs = parseFloat(e.target.value) || 0;
                  setWeightLbs(lbs);
                  setWeightKg(lbsToKg(lbs));
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Activity Level */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Physical Activity Level</h3>
        <div className="space-y-2">
          {ACTIVITY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                activityLevel === opt.value
                  ? "bg-emerald-50/60 border-emerald-500 shadow-2xs"
                  : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50"
              }`}
            >
              <input
                type="radio"
                name="activityLevel"
                value={opt.value}
                checked={activityLevel === opt.value}
                onChange={() => setActivityLevel(opt.value)}
                className="mt-1 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-800 block">
                  {opt.label}{" "}
                  <span className="text-slate-400 font-normal">({opt.multiplier}x)</span>
                </span>
                <span className="text-xs text-slate-500">{opt.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Primary Goal & Rate */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Primary Nutrition Goal</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {GOAL_OPTIONS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGoal(g.value)}
              className={`p-3 text-left rounded-xl border transition-all ${
                goal === g.value
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="text-xs font-bold block mb-0.5">{g.label}</span>
              <span
                className={`text-[11px] block leading-tight ${
                  goal === g.value ? "text-emerald-100" : "text-slate-500"
                }`}
              >
                {g.description}
              </span>
            </button>
          ))}
        </div>

        {/* Weekly Target selector if lose or gain */}
        {goal !== "maintain_weight" && (
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Pace / Weekly Change Rate
            </label>
            <select
              value={weeklyGoalKg}
              onChange={(e) => setWeeklyGoalKg(parseFloat(e.target.value) || 0.5)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {WEEKLY_CHANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Derived Calculations Banner */}
      <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Metabolic Estimates
          </span>
          <span className="text-[10px] bg-emerald-800/80 px-2.5 py-0.5 rounded-full text-emerald-200">
            Mifflin-St Jeor Formula
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-emerald-800/50 p-3 rounded-xl border border-emerald-700/50">
            <span className="text-[11px] text-emerald-300 block">Basal Metabolic Rate (BMR)</span>
            <span className="text-lg font-black text-white">{calculatedBmr} kcal</span>
          </div>

          <div className="bg-emerald-800/50 p-3 rounded-xl border border-emerald-700/50">
            <span className="text-[11px] text-emerald-300 block">Maintenance Calories</span>
            <span className="text-lg font-black text-white">{calculatedMaintenance} kcal</span>
          </div>
        </div>

        <div className="flex items-start gap-2 pt-1 text-[11px] text-emerald-200/90 leading-relaxed">
          <Info className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <span>General wellness estimate, not medical advice.</span>
        </div>
      </div>

      {/* Target Goals Customization */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-600" /> Daily Target Goals
            </h3>
            <p className="text-xs text-slate-500">
              Customize your calorie and macro targets manually if desired
            </p>
          </div>

          <button
            type="button"
            onClick={handleRecalculateGoals}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset to Formula
          </button>
        </div>

        <div className="space-y-3">
          {/* Calorie Target */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Daily Calorie Target (kcal)
            </label>
            <input
              type="number"
              value={dailyCalorieGoal}
              onChange={(e) => {
                setIsCustomOverride(true);
                setDailyCalorieGoal(e.target.value === "" ? "" : parseInt(e.target.value) || 0);
              }}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.dailyCalorieGoal ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
              }`}
            />
            {errors.dailyCalorieGoal && (
              <p className="text-xs text-rose-600 mt-1">{errors.dailyCalorieGoal}</p>
            )}
          </div>

          {/* Macro Targets */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                value={proteinGoalGrams}
                onChange={(e) => {
                  setIsCustomOverride(true);
                  setProteinGoalGrams(
                    e.target.value === "" ? "" : parseInt(e.target.value) || 0
                  );
                }}
                className="w-full px-3 py-2 text-sm bg-amber-50/40 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-blue-800 mb-1">
                Carbs (g)
              </label>
              <input
                type="number"
                value={carbGoalGrams}
                onChange={(e) => {
                  setIsCustomOverride(true);
                  setCarbGoalGrams(
                    e.target.value === "" ? "" : parseInt(e.target.value) || 0
                  );
                }}
                className="w-full px-3 py-2 text-sm bg-blue-50/40 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-800 mb-1">Fat (g)</label>
              <input
                type="number"
                value={fatGoalGrams}
                onChange={(e) => {
                  setIsCustomOverride(true);
                  setFatGoalGrams(
                    e.target.value === "" ? "" : parseInt(e.target.value) || 0
                  );
                }}
                className="w-full px-3 py-2 text-sm bg-rose-50/40 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Action */}
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-sm transition-all active:scale-98"
      >
        <Save className="w-5 h-5" />
        {isInitialOnboarding ? "Complete Profile Setup" : "Save Profile Changes"}
      </button>
    </form>
  );
};
