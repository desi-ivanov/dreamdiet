import { MealPart, MealSchemaEntry, MealSpecPerc, WithId } from "@dreamdiet/interfaces/src/";
import { create } from "zustand";
export const defaultMealSpecPerc: MealSpecPerc = { name: "", req: { caloricPerc: 1, tags: [] }, variant: "any", forced: [], tolerance: 0 };

export const useMealReqState = create<{ tolerance: number; items: { id: string; value: MealSpecPerc }[]; totals: { protein: number; carbs: number; fat: number }; schema?: WithId<MealSchemaEntry> }>(
  () => ({
    items: [{ id: "0", value: { ...defaultMealSpecPerc } }],
    tolerance: 0.1,
    totals: { protein: 0, carbs: 0, fat: 0 },
  })
);

export const useSolutionState = create<{ tag: "solved"; solution: { mealSpecPerc: MealSpecPerc; mealParts: MealPart[] }[] } | { tag: "init" } | { tag: "unsolvable" }>(() => ({ tag: "init" }));
