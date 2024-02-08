import {
  type AddIngredientRequest,
  type AddIngredientResponse,
  type UpdateIngredientRequest,
  type RemoveIngredientRequest,
  type CreateMealSchemaRequest,
  type CreateMealSchemaResponse,
  type UpdateMealSchemaRequest,
  type DeleteMealSchemaRequest,
  type SearchRequest,
  type IngredientsSearchResponse,
  type SetPublicIngredientRequest,
} from "@dreamdiet/interfaces/src/index";
import { HttpsCallable, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { functions } from "../initializeFirebase";

if (process.env.NODE_ENV === "development") connectFunctionsEmulator(functions, "localhost", 5001);

const httpsCallableGood = <TData, TRes>(name: string) => {
  return httpsCallable(functions, name) as HttpsCallable<TData, TRes>;
};

export const api = {
  addIngredient: httpsCallableGood<AddIngredientRequest, AddIngredientResponse>("addIngredient"),
  removeIngredient: httpsCallableGood<RemoveIngredientRequest, {}>("removeIngredient"),
  updateIngredient: httpsCallableGood<UpdateIngredientRequest, {}>("updateIngredient"),
  createMealSchema: httpsCallableGood<CreateMealSchemaRequest, CreateMealSchemaResponse>("createMealSchema"),
  updateMealSchema: httpsCallableGood<UpdateMealSchemaRequest, {}>("updateMealSchema"),
  deleteMealSchema: httpsCallableGood<DeleteMealSchemaRequest, {}>("deleteMealSchema"),
  searchIngredient: httpsCallableGood<SearchRequest, IngredientsSearchResponse>("searchIngredient"),
  setPublicIngredient: httpsCallableGood<SetPublicIngredientRequest, {}>("setPublicIngredient"),
};
