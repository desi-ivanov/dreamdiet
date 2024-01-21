import { onCall } from "firebase-functions/v2/https";
import {
  type AddIngredientRequest,
  type AddIngredientResponse,
  type IngredientEntry,
  type UpdateIngredientRequest,
  type RemoveIngredientRequest,
  CreateMealSchemaRequest,
  MealSchemaEntry,
  CreateMealSchemaResponse,
  UpdateMealSchemaRequest,
  DeleteMealSchemaRequest,
  SearchRequest,
  IngredientsSearchResponse,
} from "@dreamdiet/interfaces/src/index";
import { withAuth } from "./withAuth";
import { initializeApp } from "firebase-admin/app";
import { CollectionReference, Filter, getFirestore } from "firebase-admin/firestore";

const app = initializeApp();

const plainIngredientsCollection = getFirestore(app).collection("plainIngredients") as CollectionReference<IngredientEntry>;
const mealSchemaCollection = getFirestore(app).collection("mealSchemas") as CollectionReference<MealSchemaEntry>;

export const addIngredient = onCall(
  withAuth<AddIngredientRequest, AddIngredientResponse>(async (req) => {
    const { ingredient } = req.data;
    const { uid } = req.auth!;
    const newIngredient = await plainIngredientsCollection.add({
      ingredient,
      public: false,
      owner: uid,
    });
    return {
      id: newIngredient.id,
    };
  })
);

export const removeIngredient = onCall(
  withAuth<RemoveIngredientRequest, {}>(async (req) => {
    const { id } = req.data;
    const { uid } = req.auth!;
    const doc = await plainIngredientsCollection.doc(id).get();
    if (!doc.exists) throw new Error("No such ingredient");
    if (doc.data()!.owner !== uid) throw new Error("You don't own this ingredient");
    await doc.ref.delete();
  })
);

export const updateIngredient = onCall(
  withAuth<UpdateIngredientRequest, {}>(async (req) => {
    const { ingredient, id } = req.data;
    const { uid } = req.auth!;
    const doc = await plainIngredientsCollection.doc(id).get();
    if (!doc.exists) throw new Error("No such ingredient");
    if (doc.data()!.owner !== uid) throw new Error("You don't own this ingredient");
    await doc.ref.update({
      ingredient,
    });
  })
);

export const createMealSchema = onCall(
  withAuth<CreateMealSchemaRequest, Promise<CreateMealSchemaResponse>>(async (req) => {
    const { uid } = req.auth!;
    const res = await mealSchemaCollection.add({
      schema: req.data.schema,
      owner: uid,
    });
    return {
      id: res.id,
      schema: (await res.get()).data()!,
    };
  })
);

export const updateMealSchema = onCall(
  withAuth<UpdateMealSchemaRequest, {}>(async (req) => {
    const { uid } = req.auth!;
    const { schema, id } = req.data;
    const doc = await mealSchemaCollection.doc(id).get();
    if (!doc.exists) throw new Error("No such schema");
    if (doc.data()!.owner !== uid) throw new Error("You don't own this schema");
    await doc.ref.update({ schema });
  })
);

export const deleteMealSchema = onCall(
  withAuth<DeleteMealSchemaRequest, {}>(async (req) => {
    const { uid } = req.auth!;
    const { id } = req.data;
    const doc = await mealSchemaCollection.doc(id).get();
    if (!doc.exists) throw new Error("No such schema");
    if (doc.data()!.owner !== uid) throw new Error("You don't own this schema");
    await doc.ref.delete();
  })
);

export const searchIngredient = onCall(
  withAuth<SearchRequest, Promise<IngredientsSearchResponse>>(async (req) => {
    const { uid } = req.auth!;
    const { query, size } = req.data;
    const querySnapshot = await plainIngredientsCollection
      .where(Filter.or(Filter.where("public", "==", true), Filter.where("owner", "==", uid)))
      .where("ingredient.name", ">=", query)
      .where("ingredient.name", "<=", query + "\uf8ff")
      .limit(size)
      .get();
    return { values: querySnapshot.docs.map((doc) => doc.data().ingredient) };
  })
);
