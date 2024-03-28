import { Flex, Layout, Spin } from "antd";
import { EmailAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../initializeFirebase";
import StyledFirebaseAuth from "./StyledFirebaseAuth";
import { useAuthStore } from "./authStore";
import logoBig from "./logo-big.png";

export const AuthPage = () => {
  const uiConfig: firebaseui.auth.Config = {
    signInFlow: "popup",
    signInSuccessUrl: "/dreamdiet",
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
      <Flex gap={1} vertical>
        <Flex align="center" vertical>
          <div>
            <img src={logoBig} alt="DreamDiet" style={{ width: 200 }} />
          </div>
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
