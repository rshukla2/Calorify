import React from "react";
import { useCalorifyData } from "../hooks/useCalorifyData";
import { LoginPage } from "../pages/LoginPage";
import { OnboardingPage } from "../pages/OnboardingPage";
import { DashboardPage } from "../pages/DashboardPage";
import { MealsPage } from "../pages/MealsPage";
import { HistoryPage } from "../pages/HistoryPage";
import { ProfilePage } from "../pages/ProfilePage";
import { TopHeader } from "./TopHeader";
import { BottomNavigation } from "./BottomNavigation";
import { AddFoodModal } from "./AddFoodModal";
import { CoachTab } from "./CoachTab";
import { useGLP1Data } from "../hooks/useGLP1Data";
import { GLP1Page } from "../pages/GLP1Page";
import { GLP1SetupForm } from "./GLP1SetupForm";
import { MedicationLogModal } from "./MedicationLogModal";
import { SymptomLogModal } from "./SymptomLogModal";
import { MedicationAdministration, SymptomEntry } from "../types";

export const AppShell: React.FC = () => {
  const glp1 = useGLP1Data();
  const [glp1Screen, setGLP1Screen] = React.useState<"closed" | "setup" | "open">("closed");
  const [medicationModalOpen, setMedicationModalOpen] = React.useState(false);
  const [symptomModalOpen, setSymptomModalOpen] = React.useState(false);
  const [editingMedication, setEditingMedication] = React.useState<MedicationAdministration | null>(null);
  const [editingSymptom, setEditingSymptom] = React.useState<SymptomEntry | null>(null);
  const {
    auth,
    profile,
    isOnboardingComplete,
    selectedDate,
    setSelectedDate,
    foodLogs,
    activeTab,
    setActiveTab,
    login,
    logout,
    saveProfile,
    saveFoodEntry,
    saveMultipleFoodEntries,
    deleteFoodEntry,
    resetAllData,

    // Modal state
    isFoodModalOpen,
    editingFoodEntry,
    preselectedMealType,
    openAddFoodModal,
    openEditFoodModal,
    closeFoodModal,

    // Computed
    selectedDateEntries,
    selectedDateTotals,
    entriesByMeal,
    historyByDate,
  } = useCalorifyData();

  // Screen 1: Dummy Login
  if (!auth.isLoggedIn) {
    return <LoginPage onLogin={login} />;
  }

  // Screen 2: Onboarding Profile Setup
  if (!isOnboardingComplete || !profile) {
    return <OnboardingPage username={auth.username} onComplete={saveProfile} />;
  }

  const openMedication = (entry: MedicationAdministration | null = null) => { setEditingMedication(entry); setMedicationModalOpen(true); };
  const openSymptom = (entry: SymptomEntry | null = null) => { setEditingSymptom(entry); setSymptomModalOpen(true); };
  const closeGLP1 = () => setGLP1Screen("closed");

  if (glp1Screen === "setup") {
    return <div className="min-h-screen bg-slate-50 p-4"><div className="max-w-xl mx-auto mt-6 bg-white rounded-3xl p-6 border shadow-sm"><GLP1SetupForm profile={glp1.profile} dose={glp1.currentDose} onCancel={closeGLP1} onSave={(p,d)=>{glp1.saveSetup(p,d);setGLP1Screen("open")}}/></div></div>;
  }

  if (glp1Screen === "open" && glp1.profile) {
    return <div className="min-h-screen bg-slate-50 text-slate-900"><main className="max-w-2xl mx-auto px-4 pt-4"><GLP1Page profile={glp1.profile} dose={glp1.currentDose} doses={glp1.doses} administrations={glp1.administrations} symptoms={glp1.symptoms} meals={glp1.meals} foodLogs={foodLogs} onBack={closeGLP1} onSetup={glp1.saveSetup} onLogMedication={()=>openMedication()} onEditMedication={openMedication} onDeleteMedication={glp1.deleteAdministration} onLogSymptom={()=>openSymptom()} onEditSymptom={openSymptom} onDeleteSymptom={glp1.deleteSymptom} onDeactivate={()=>{glp1.deactivate();closeGLP1()}} onDeleteAll={()=>{glp1.deleteAll();closeGLP1()}} onExport={glp1.exportData}/></main><MedicationLogModal open={medicationModalOpen} profile={glp1.profile} dose={glp1.currentDose} editing={editingMedication} onClose={()=>setMedicationModalOpen(false)} onSave={glp1.saveAdministration} onEditDuplicate={x=>setEditingMedication(x)}/><SymptomLogModal open={symptomModalOpen} meals={glp1.meals} editing={editingSymptom} onClose={()=>setSymptomModalOpen(false)} onSave={glp1.saveSymptom}/></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-200">
      {/* Top Header Bar */}
      <TopHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        username={profile.name || auth.username}
        onLogout={logout}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-4">
        {activeTab === "dashboard" && (
          <DashboardPage
            profile={profile}
            selectedDate={selectedDate}
            totals={selectedDateTotals}
            entriesByMeal={entriesByMeal}
            onAddFood={(mealType) => openAddFoodModal(mealType || "breakfast")}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            glp1={{ profile: glp1.profile, dose: glp1.currentDose, administrations: glp1.administrations, symptoms: glp1.symptoms }}
            onOpenGLP1={() => setGLP1Screen(glp1.profile ? "open" : "setup")}
            onSetupGLP1={() => setGLP1Screen(glp1.profile ? "open" : "setup")}
            onLogMedication={() => glp1.profile ? openMedication() : setGLP1Screen("setup")}
            onLogSymptom={() => glp1.profile ? openSymptom() : setGLP1Screen("setup")}
          />
        )}

        {activeTab === "meals" && (
          <MealsPage
            selectedDate={selectedDate}
            entriesByMeal={entriesByMeal}
            totalEntriesCount={selectedDateEntries.length}
            totals={selectedDateTotals}
            onAddFood={(mealType) => openAddFoodModal(mealType || "breakfast")}
            onEditFood={openEditFoodModal}
            onDeleteFood={deleteFoodEntry}
          />
        )}

        {activeTab === "coach" && (
          <CoachTab
            userProfile={profile}
            selectedDate={selectedDate}
            dailySummary={{
              totalCalories: selectedDateTotals.totalCalories,
              calorieTarget: profile.dailyCalorieGoal,
              caloriesRemaining: Math.max(0, profile.dailyCalorieGoal - selectedDateTotals.totalCalories),
              totalProtein: selectedDateTotals.totalProtein,
              proteinTarget: profile.proteinGoalGrams,
              totalCarbs: selectedDateTotals.totalCarbs,
              carbTarget: profile.carbGoalGrams,
              totalFat: selectedDateTotals.totalFat,
              fatTarget: profile.fatGoalGrams,
            }}
          />
        )}

        {activeTab === "history" && (
          <HistoryPage
            profile={profile}
            historyByDate={historyByDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "profile" && (
          <ProfilePage
            profile={profile}
            username={auth.username}
            onSaveProfile={saveProfile}
            onLogout={logout}
            onResetData={() => { glp1.deleteAll(); resetAllData(); }}
            glp1Active={!!glp1.profile?.isActive}
            glp1HasData={!!glp1.profile}
            onManageGLP1={() => { if (glp1.profile && !glp1.profile.isActive) glp1.reactivate(); setGLP1Screen(glp1.profile ? "open" : "setup"); }}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Add Food Modal (AI Search, Photo Analysis, or Manual Entry) */}
      <AddFoodModal
        isOpen={isFoodModalOpen}
        onClose={closeFoodModal}
        onSaveEntry={saveFoodEntry}
        onSaveMultipleEntries={saveMultipleFoodEntries}
        initialMealType={preselectedMealType}
        selectedDate={selectedDate}
        editingEntry={editingFoodEntry}
        glp1Active={!!glp1.profile?.isActive}
        onCreateMeal={glp1.createMeal}
      />

      {glp1.profile && <><MedicationLogModal open={medicationModalOpen} profile={glp1.profile} dose={glp1.currentDose} editing={editingMedication} onClose={()=>setMedicationModalOpen(false)} onSave={glp1.saveAdministration} onEditDuplicate={x=>setEditingMedication(x)}/><SymptomLogModal open={symptomModalOpen} meals={glp1.meals} editing={editingSymptom} onClose={()=>setSymptomModalOpen(false)} onSave={glp1.saveSymptom}/></>}
    </div>
  );
};
