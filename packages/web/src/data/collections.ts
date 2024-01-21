import { CollectionReference, collection } from "firebase/firestore";
import { firestore } from "../initializeFirebase";
import { IngredientEntry, MealSchemaEntry } from "@dreamdiet/interfaces/src";

export const plainIngredients = collection(firestore, "plainIngredients") as CollectionReference<IngredientEntry>;
export const mealSchemaCollection = collection(firestore, "mealSchemas") as CollectionReference<MealSchemaEntry>;
