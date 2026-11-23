import React, { useState } from "react";
import { X, Sparkles, Camera, PenTool, Lock } from "lucide-react";
import { AIFoodEstimate, AIPhotoNutritionEstimate, FoodLogEntry, MealRecord, MealType } from "../types";
import { isDemoMode } from "../services/demoMode";
import { localInputToIso, localTimeZone, toLocalInputValue } from "../utils/glp1";
import { AIFoodSearchForm } from "./AIFoodSearchForm";
import { AIPhotoUploadForm } from "./AIPhotoUploadForm";
import { AIFoodEstimateReviewScreen } from "./AIFoodEstimateReviewScreen";
import { AIPhotoReviewScreen } from "./AIPhotoReviewScreen";
import { ManualFoodForm } from "./ManualFoodForm";

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEntry: (entry: Omit<FoodLogEntry, "id" | "createdAt" | "updatedAt"> & { id?: string }) => void;
  onSaveMultipleEntries?: (entries: Array<Omit<FoodLogEntry, "id" | "createdAt" | "updatedAt">>) => void;
  initialMealType: MealType;
  selectedDate: string;
  editingEntry: FoodLogEntry | null;
  glp1Active?: boolean;
  onCreateMeal?: (meal: Omit<MealRecord, "id" | "createdAt" | "updatedAt">) => string;
}

type Mode = "select" | "search" | "photo" | "review_estimate" | "review_photo" | "manual";

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  isOpen,
  onClose,
  onSaveEntry,
  onSaveMultipleEntries,
  initialMealType,
  selectedDate,
  editingEntry,
  glp1Active = false,
  onCreateMeal,
}) => {
  const [activeTab, setActiveTab] = useState<"search" | "photo" | "manual">("search");
  const [addMealContext, setAddMealContext] = useState(false);
  const [mealStartedAt, setMealStartedAt] = useState(() => `${selectedDate}${toLocalInputValue().slice(10)}`);
  const [mealSize, setMealSize] = useState<"small"|"medium"|"large"|"not_sure">("not_sure");
  const [hungerBefore, setHungerBefore] = useState("");
  const [fullnessAfter, setFullnessAfter] = useState("");
  const [stoppingReason, setStoppingReason] = useState("");
  const [mealNotes, setMealNotes] = useState("");
  const createMealId = (mealType: MealType) => addMealContext && onCreateMeal ? onCreateMeal({ mealType, mealStartedAt: mealStartedAt ? localInputToIso(mealStartedAt) : null, mealEndedAt: null, recordedTimeZone: localTimeZone(), mealSize, hungerBefore: hungerBefore ? Number(hungerBefore) : null, fullnessAfter: fullnessAfter ? Number(fullnessAfter) : null, stoppingReason: stoppingReason || null, notes: mealNotes || null }) : undefined;

  // Review screen states
  const [currentEstimate, setCurrentEstimate] = useState<{
    estimate: AIFoodEstimate;
    query: string;
  } | null>(null);

  const [currentPhotoEstimate, setCurrentPhotoEstimate] = useState<AIPhotoNutritionEstimate | null>(
    null
  );

  if (!isOpen) return null;

  // If editing an existing item, defer to the standard editing form
  if (editingEntry) {
    return (
      <ManualFoodForm
        isOpen={isOpen}
        onClose={onClose}
        onSave={onSaveEntry}
        initialMealType={editingEntry.mealType}
        selectedDate={editingEntry.date}
        editingEntry={editingEntry}
      />
    );
  }

  const handleEstimateReceived = (estimate: AIFoodEstimate, query: string) => {
    setCurrentEstimate({ estimate, query });
  };

  const handlePhotoAnalyzed = (photoEstimate: AIPhotoNutritionEstimate) => {
    setCurrentPhotoEstimate(photoEstimate);
  };

  const handleSaveTextEstimate = (entryData: Omit<FoodLogEntry, "id" | "createdAt" | "updatedAt">) => {
    onSaveEntry({ ...entryData, mealId: createMealId(entryData.mealType) });
    setCurrentEstimate(null);
    onClose();
  };

  const handleSavePhotoEstimate = (entriesData: Array<Omit<FoodLogEntry, "id" | "createdAt" | "updatedAt">>) => {
    const mealId = entriesData.length ? createMealId(entriesData[0].mealType) : undefined;
    const withMeal = entriesData.map(entry => ({ ...entry, mealId }));
    if (onSaveMultipleEntries) {
      onSaveMultipleEntries(withMeal);
    } else {
      withMeal.forEach((item) => onSaveEntry(item));
    }
    setCurrentPhotoEstimate(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
              <span>Log Food Item</span>
              {isDemoMode && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-200 rounded-full">Demo mode</span>}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose an AI estimation method or enter details manually
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 space-y-5">
          {glp1Active && !editingEntry && <div className="p-3 bg-violet-50 border border-violet-200 rounded-2xl space-y-3"><label className="text-sm font-bold text-violet-950 flex gap-2"><input type="checkbox" checked={addMealContext} onChange={e=>setAddMealContext(e.target.checked)}/> Add GLP-1 meal timing and appetite context</label>{addMealContext&&<div className="grid grid-cols-2 gap-2"><label className="text-xs font-semibold col-span-2">Meal start time<input type="datetime-local" value={mealStartedAt} onChange={e=>setMealStartedAt(e.target.value)} className="field"/></label><label className="text-xs font-semibold">Meal size<select value={mealSize} onChange={e=>setMealSize(e.target.value as any)} className="field"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="not_sure">Not sure</option></select></label><label className="text-xs font-semibold">Hunger before (1-5)<input type="number" min="1" max="5" value={hungerBefore} onChange={e=>setHungerBefore(e.target.value)} className="field"/></label><label className="text-xs font-semibold">Fullness after (1-5)<input type="number" min="1" max="5" value={fullnessAfter} onChange={e=>setFullnessAfter(e.target.value)} className="field"/></label><label className="text-xs font-semibold">Reason for stopping<select value={stoppingReason} onChange={e=>setStoppingReason(e.target.value)} className="field"><option value="">Not recorded</option>{["Comfortably satisfied","Felt full quickly","Felt overly full","Felt nauseated","Lost interest in food","Finished the planned portion","Other"].map(x=><option key={x}>{x}</option>)}</select></label><label className="text-xs font-semibold col-span-2">Meal notes<textarea value={mealNotes} onChange={e=>setMealNotes(e.target.value)} className="field"/></label></div>}</div>}
          {/* Review Text Estimate Screen */}
          {currentEstimate ? (
            <AIFoodEstimateReviewScreen
              estimate={currentEstimate.estimate}
              initialMealType={initialMealType}
              selectedDate={selectedDate}
              originalQuery={currentEstimate.query}
              onSave={handleSaveTextEstimate}
              onBack={() => setCurrentEstimate(null)}
            />
          ) : currentPhotoEstimate ? (
            /* Review Photo Estimate Screen */
            <AIPhotoReviewScreen
              photoEstimate={currentPhotoEstimate}
              initialMealType={initialMealType}
              selectedDate={selectedDate}
              onSaveItems={handleSavePhotoEstimate}
              onBack={() => setCurrentPhotoEstimate(null)}
            />
          ) : (
            <>
              {/* Option Mode Selector Tabs */}
              <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-2xl text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setActiveTab("search")}
                  className={`py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                    activeTab === "search"
                      ? "bg-white text-emerald-900 shadow-xs font-bold"
                      : "hover:text-slate-900"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Search AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("photo")}
                  className={`py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                    activeTab === "photo"
                      ? "bg-white text-emerald-900 shadow-xs font-bold"
                      : "hover:text-slate-900"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("manual")}
                  className={`py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                    activeTab === "manual"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "hover:text-slate-900"
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5 text-slate-600" />
                  <span>Manual</span>
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "search" && (
                <AIFoodSearchForm
                  onEstimateReceived={handleEstimateReceived}
                  onSwitchToManual={() => setActiveTab("manual")}
                />
              )}

              {activeTab === "photo" && (
                <AIPhotoUploadForm
                  onPhotoAnalyzed={handlePhotoAnalyzed}
                  onSwitchToManual={() => setActiveTab("manual")}
                />
              )}

              {activeTab === "manual" && (
                <ManualFoodForm
                  isOpen={true}
                  isEmbedded={true}
                  onClose={onClose}
                  onSave={(data) => {
                    onSaveEntry({ ...data, mealId: createMealId(data.mealType) });
                    onClose();
                  }}
                  initialMealType={initialMealType}
                  selectedDate={selectedDate}
                  editingEntry={null}
                />
              )}

              {/* Privacy Disclaimer Note */}
              <div className="pt-2 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>
                  {isDemoMode ? "Demo mode: AI results are sample responses. Nothing is sent anywhere." : "AI features send submitted food text or images to Gemini for analysis."}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
