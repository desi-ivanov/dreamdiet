import { DependencyList, useState, useEffect } from "react";
import type { WithId } from "@dreamdiet/interfaces/src/index";
import { UseFirestoreResult } from "./firestoreResult";
import { DocumentData, Query, onSnapshot } from "firebase/firestore";

export const useFirestoreQuery = <T extends DocumentData>(f: () => Query<T> | undefined, deps: DependencyList): UseFirestoreResult<WithId<T>[]> => {
  const [state, setState] = useState<UseFirestoreResult<WithId<T>[]>>({ tag: "loading" });
  useEffect(() => {
    const q = f();
    if (!q) return setState({ tag: "undefined" });
    return onSnapshot(
      q,
      (snapshot) => setState({ tag: "value", value: snapshot.docs.map((d) => ({ id: d.id, data: d.data() })) }),
      (error) => {
        console.error(error);
        setState({ tag: "error", error });
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
};
