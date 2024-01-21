import { User } from "firebase/auth";
import firebase from "firebase/compat/app";
import { create } from "zustand";
import { auth } from "../initializeFirebase";

export type AuthStore =
  | {
      tag: "authenticated";
      user: User;
      idTokenResult?: firebase.auth.IdTokenResult;
      token?: string;
    }
  | {
      tag: "unauthenticated";
    }
  | { tag: "initializing" };

export const useAuthStore = create<AuthStore>(() => ({
  tag: "initializing",
}));

class Refresher {
  timeout?: NodeJS.Timeout;
  constructor(private user: User | null) {}
  refreshForever(force?: boolean) {
    if (this.user) {
      this.user
        .getIdTokenResult(force)
        .then((res) => {
          const s = useAuthStore.getState();
          if (s.tag === "authenticated" && s.user === this.user) {
            useAuthStore.setState({ token: res.token, idTokenResult: res });
            const delta = new Date(res.expirationTime).getTime() - Date.now() - 4000;
            this.timeout = setTimeout(() => this.refreshForever(true), delta);
          }
        })
        .catch(console.error);
    }
  }
  setUser(user: User | null) {
    this.user = user;
    clearTimeout(this.timeout as unknown as number);
    this.refreshForever();
  }
}

class AuthCacher {
  currentUser?: User | null;
  refresher = new Refresher(null);
  watchAuth() {
    auth.onAuthStateChanged((user) => {
      console.log("Auth state changed", user?.uid);
      this.refresher.setUser(user);
      this.currentUser = user;
      if (user) {
        useAuthStore.setState({ tag: "authenticated", user });
      } else {
        useAuthStore.setState({ tag: "unauthenticated" });
      }
    });
  }
}
const ac = new AuthCacher();
ac.watchAuth();

export const useUser = () => useAuthStore((s) => (s.tag === "authenticated" ? s.user : null));
