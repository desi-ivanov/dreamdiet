import { Spin } from "antd";
import { create } from "zustand";

export type LoadingContextType = {
  push: (str?: string) => void;
  pop: () => void;
  loader: <T>(f: () => Promise<T>, str?: string) => Promise<T>;
};
const useLoadingStore = create<{
  count: number;
  message?: string;
  push: (str?: string) => void;
  pop: () => void;
}>((set) => ({
  count: 0,
  push: (s) => set((ps) => ({ count: ps.count + 1, message: s })),
  pop: () => set((ps) => ({ count: ps.count - 1, message: ps.count === 1 ? undefined : ps.message })),
}));
export const setMessage = (str?: string) => useLoadingStore.setState({ message: str });

export async function loader<T>(f: () => Promise<T>, str?: string): Promise<T> {
  useLoadingStore.getState().push(str);
  try {
    const res = await f();
    return Promise.resolve(res);
  } catch (err) {
    return Promise.reject(err);
  } finally {
    useLoadingStore.getState().pop();
  }
}

export const FullscreenLoader = () => {
  const isLoading = useLoadingStore((s) => s.count > 0);
  const msg = useLoadingStore((s) => s.message);
  return <Spin spinning={isLoading} tip={msg} fullscreen style={{ zIndex: 9999 }} />;
};
