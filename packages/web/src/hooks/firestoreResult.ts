export type UseFirestoreResult<T> =
  | { tag: "value"; value: T }
  | { tag: "loading" }
  | { tag: "undefined" }
  | { tag: "error"; error: Error };

export const map =
  <T>(r: UseFirestoreResult<T>) =>
  <U>(f: (t: T) => U): UseFirestoreResult<U> => {
    if (r.tag === "value") return { tag: "value", value: f(r.value) };
    return r;
  };
