import { query, where } from "firebase/firestore";
import { plainIngredients } from "../data/collections";
import { useFirestoreQuery } from "../hooks/useFirestoreQuery";

export const useMyPlainIngredients = (uid: string | undefined) => {
  return useFirestoreQuery(() => query(plainIngredients, where("owner", "==", uid)), [uid]);
};
