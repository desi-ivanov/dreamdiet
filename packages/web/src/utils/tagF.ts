export const kf = <T extends { [tag in K]: string }, K extends keyof T, V extends T[K], Z>(x: T, k: K, t: V, f: (x: T & { [k in K]: V }) => Z): Z | undefined => {
  if (x[k] === t) return f(x as T & { [k in K]: V });
  return undefined;
};

export const tagF = <T extends { tag: string }, V extends T["tag"], Z>(x: T, t: V, f: (x: T & { tag: V }) => Z): Z | undefined => {
  return kf(x, "tag", t, f);
};

export const tagMap = <T extends { tag: string }, V extends T["tag"], Z>(x: T, t: V, f: (x: T & { tag: V }) => Z): Exclude<T, { tag: V }> | Z => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return kf(x, "tag", t, f) ?? x;
};
