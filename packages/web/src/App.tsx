import { Tabs, TabsProps } from "antd";
import { AccountPage } from "./account/AccountPage";
import { RequireAuth } from "./auth/RequireAuth";
import { FullscreenLoader } from "./components/Loader";
import { DietPage } from "./diet/DietPage";
import { IngredientsListPage } from "./ingredients/IngredientsListPage";

const tabs: TabsProps["items"] = [
  {
    key: "1",
    label: "Diet",
    children: <DietPage />,
  },
  {
    key: "2",
    label: "Ingredients",
    children: <IngredientsListPage />,
  },
  {
    key: "3",
    label: "Account",
    children: <AccountPage />,
  },
];
function App() {
  return (
    <RequireAuth>
      <>
        <Tabs defaultActiveKey="1" items={tabs} />
        <FullscreenLoader />
      </>
    </RequireAuth>
  );
}

export default App;
