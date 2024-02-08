import { useAuthStore } from "../auth/authStore";
import { auth } from "../initializeFirebase";

export const AccountPage = () => {
  const authState = useAuthStore();

  const handleLogout = () => {
    auth.signOut();
  };

  if (authState.tag === "initializing") return <>Loading...</>;
  if (authState.tag === "unauthenticated") return <>You should not be able to see this as you are unauthenticated wtf bruh</>;

  return (
    <div>
      Hi {authState.user.email}. <button onClick={handleLogout}>Logout</button>
    </div>
  );
};
