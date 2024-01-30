import { Flex, Layout, Spin } from "antd";
import { EmailAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../initializeFirebase";
import StyledFirebaseAuth from "./StyledFirebaseAuth";
import { useAuthStore } from "./authStore";
export const AuthPage = () => {
  const uiConfig: firebaseui.auth.Config = {
    signInFlow: "popup",
    signInSuccessUrl: "/",
    signInOptions: [
      {
        provider: EmailAuthProvider.PROVIDER_ID,
        fullLabel: "Sign in/up with Email",
        requireDisplayName: false,
      },
      GoogleAuthProvider.PROVIDER_ID,
    ],
  };
  return (
    <Layout.Content>
      <Flex gap={1}>
        <Flex align="center">
          <strong>DreamDiet</strong>
        </Flex>
        <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
      </Flex>
    </Layout.Content>
  );
};

export const RequireAuth: React.FC<{ children: JSX.Element }> = ({ children }): JSX.Element => {
  const auth = useAuthStore();
  if (auth.tag === "initializing") {
    return <Spin />;
  }
  if (auth.tag !== "authenticated") {
    return <AuthPage />;
  }

  return children;
};
