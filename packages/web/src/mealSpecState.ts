import { MealPart, MealSchemaEntry, MealSpecPerc, WithId } from "@dreamdiet/interfaces/src/";
import { create } from "zustand";
export const defaultMealSpecPerc: MealSpecPerc = { name: "", req: { caloricPerc: 1, tags: [] }, variant: "any", forced: [], tolerance: 0 };

export const useMealReqState = create<{ tolerance: number; items: { id: string; value: MealSpecPerc }[]; totals: { protein: number; carbs: number; fat: number }; schema?: WithId<MealSchemaEntry> }>(
  () => ({
    items: [
      {
        id: "0",
        value: {
          name: "Breakfast",
          req: { caloricPerc: 0.3, tags: ["breakfast"] },
          variant: "any",
          forced: [],
          tolerance: 0.1,
        },
      },
      {
        id: "1",
        value: {
          name: "Lunch",
          req: { caloricPerc: 0.3, tags: ["lunch"] },
          variant: "any",
          forced: [],
          tolerance: 0.1,
        },
      },
      {
        id: "2",
        value: {
          name: "Snack",
          req: { caloricPerc: 0.1, tags: ["snack"] },
          variant: "any",
          forced: [],
          tolerance: 0.1,
        },
      },
      {
        id: "3",
        value: {
          name: "Dinner",
          req: { caloricPerc: 0.3, tags: ["dinner"] },
          variant: "any",
          forced: [],
          tolerance: 0.1,
        },
      },
    ],
    tolerance: 0.1,
    totals: { protein: 60, carbs: 350, fat: 90 },
  })
);

export const useSolutionState = create<{ tag: "solved"; solution: { mealSpecPerc: MealSpecPerc; mealParts: MealPart[] }[] } | { tag: "init" } | { tag: "unsolvable" }>(() => ({ tag: "init" }));
