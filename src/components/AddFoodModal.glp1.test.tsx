import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("./AIFoodSearchForm", () => ({ AIFoodSearchForm: ({ onEstimateReceived }: any) => <button onClick={() => onEstimateReceived({ foodName:"Soup",description:"Soup",servingDescription:"1 bowl",baseServingAmount:1,baseServingUnit:"bowl",calories:200,proteinGrams:10,carbGrams:20,fatGrams:5,confidence:.8,assumptions:[] }, "soup")}>Mock text estimate</button> }));
vi.mock("./AIPhotoUploadForm", () => ({ AIPhotoUploadForm: ({ onPhotoAnalyzed }: any) => <button onClick={() => onPhotoAnalyzed({ mealName:"Meal",detectedItems:[{id:"a",foodName:"A",servingDescription:"1",baseServingAmount:1,baseServingUnit:"serving",calories:100,proteinGrams:1,carbGrams:2,fatGrams:3,confidence:.8,assumptions:[]},{id:"b",foodName:"B",servingDescription:"1",baseServingAmount:1,baseServingUnit:"serving",calories:100,proteinGrams:1,carbGrams:2,fatGrams:3,confidence:.8,assumptions:[]}],totals:{calories:200,proteinGrams:2,carbGrams:4,fatGrams:6},overallConfidence:.8,notes:[] })}>Mock photo estimate</button> }));
vi.mock("./AIFoodEstimateReviewScreen", () => ({ AIFoodEstimateReviewScreen: ({ onSave }: any) => <button onClick={() => onSave({date:"2026-08-01",mealType:"breakfast",foodName:"Soup",servingDescription:"1 bowl",servingAmount:1,servingUnit:"bowl",calories:200,proteinGrams:10,carbGrams:20,fatGrams:5,source:"ai_text"})}>Save text result</button> }));
vi.mock("./AIPhotoReviewScreen", () => ({ AIPhotoReviewScreen: ({ onSaveItems }: any) => <button onClick={() => onSaveItems([{date:"2026-08-01",mealType:"lunch",foodName:"A",servingDescription:"1",servingAmount:1,servingUnit:"serving",calories:100,proteinGrams:1,carbGrams:2,fatGrams:3,source:"ai_image"},{date:"2026-08-01",mealType:"lunch",foodName:"B",servingDescription:"1",servingAmount:1,servingUnit:"serving",calories:100,proteinGrams:1,carbGrams:2,fatGrams:3,source:"ai_image"}])}>Save photo results</button> }));
vi.mock("./ManualFoodForm", () => ({ ManualFoodForm: ({ onSave }: any) => <button onClick={() => onSave({date:"2026-08-01",mealType:"dinner",foodName:"Manual",servingDescription:"1",servingAmount:1,servingUnit:"serving",calories:100,proteinGrams:1,carbGrams:2,fatGrams:3,source:"manual"})}>Save manual result</button> }));

import { AddFoodModal } from "./AddFoodModal";

const baseProps = () => ({ isOpen:true,onClose:vi.fn(),onSaveEntry:vi.fn(),onSaveMultipleEntries:vi.fn(),initialMealType:"breakfast" as const,selectedDate:"2026-08-01",editingEntry:null,glp1Active:true,onCreateMeal:vi.fn(() => "shared_meal") });

async function enableContext() {
  await userEvent.click(screen.getByLabelText("Add GLP-1 meal timing and appetite context"));
  await userEvent.selectOptions(screen.getByLabelText("Meal size"), "small");
  await userEvent.type(screen.getByLabelText("Hunger before (1–5)"), "3");
  await userEvent.type(screen.getByLabelText("Fullness after (1–5)"), "4");
}

describe("AddFoodModal shared GLP-1 meal context", () => {
  it("attaches one shared meal to AI text entries", async () => {
    const props=baseProps(); render(<AddFoodModal {...props}/>); await enableContext();
    await userEvent.click(screen.getByRole("button",{name:"Mock text estimate"})); await userEvent.click(screen.getByRole("button",{name:"Save text result"}));
    expect(props.onCreateMeal).toHaveBeenCalledOnce();
    expect(props.onSaveEntry).toHaveBeenCalledWith(expect.objectContaining({mealId:"shared_meal"}));
  });
  it("uses the same meal ID for every AI photo item", async () => {
    const props=baseProps(); render(<AddFoodModal {...props}/>); await enableContext(); await userEvent.click(screen.getByRole("button",{name:"Photo"}));
    await userEvent.click(screen.getByRole("button",{name:"Mock photo estimate"})); await userEvent.click(screen.getByRole("button",{name:"Save photo results"}));
    const saved=props.onSaveMultipleEntries.mock.calls[0][0]; expect(saved).toHaveLength(2); expect(saved.every((x:any)=>x.mealId==="shared_meal")).toBe(true); expect(props.onCreateMeal).toHaveBeenCalledOnce();
  });
  it("supports manual entries and remains optional when GLP-1 is inactive", async () => {
    const props=baseProps(); const {unmount}=render(<AddFoodModal {...props}/>); await enableContext(); await userEvent.click(screen.getByRole("button",{name:"Manual"})); await userEvent.click(screen.getByRole("button",{name:"Save manual result"}));
    expect(props.onSaveEntry).toHaveBeenCalledWith(expect.objectContaining({mealId:"shared_meal"}));
    unmount(); const inactive=baseProps(); render(<AddFoodModal {...inactive} glp1Active={false}/>); expect(screen.queryByLabelText("Add GLP-1 meal timing and appetite context")).not.toBeInTheDocument();
  });
});
