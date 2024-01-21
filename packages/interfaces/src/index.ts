export type Ingredient = {
  proteins: number;
  carbs: number;
  fats: number;
  name: string;
  tags: string[];
};

export type IngredientEntry = {
  ingredient: Ingredient;
  public: boolean;
  owner: string;
};

export type AddIngredientRequest = {
  ingredient: Ingredient;
};

export type RemoveIngredientRequest = {
  id: string;
};

export type UpdateIngredientRequest = {
  id: string;
  ingredient: Ingredient;
};

export type AddIngredientResponse = {};

export type WithId<T> = {
  id: string;
  data: T;
};
export type MealReq = {
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
};

export type MealSpec = {
  name: string;
  req: MealReq;
  forced: { name: string; grams: number }[];
  variant: "any" | "only-use" | "at-least" | "exactly";
  tolerance: number;
};

export type MealReqPerc = {
  caloricPerc: number;
  tags: string[];
};

export type MealSpecPerc = {
  name: string;
  req: MealReqPerc;
  forced: { name: string; grams: number }[];
  variant: "any" | "only-use" | "at-least" | "exactly";
  tolerance: number;
};

export type Meal = {
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  max_grams_per_meal?: number;
  tags: string[];
};

export type MealPart = {
  meal: Meal;
  quantity: number;
};

export type DailyPlanReq = {
  meals: MealPart[];
};

export type DailyPlan = {
  meals: Meal[];
};
export type MealSchema = {
  name: string;
} & (
  | {
      tag: "exact";
      specs: MealSpec[];
    }
  | {
      tag: "perc";
      specs: MealSpecPerc[];
      totals: { protein: number; carbs: number; fat: number };
    }
);

export type CreateMealSchemaRequest = {
  schema: MealSchema;
};

export type CreateMealSchemaResponse = {
  id: string;
  schema: MealSchemaEntry;
};

export type UpdateMealSchemaRequest = {
  id: string;
  schema: MealSchema;
};

export type DeleteMealSchemaRequest = {
  id: string;
};

export type MealSchemaEntry = {
  schema: MealSchema;
  owner: string;
};

export type SearchRequest = {
  query: string;
  size: number;
};

export type SearchResponse<T> = {
  values: T[];
};

export type IngredientsSearchResponse = SearchResponse<Ingredient>;
