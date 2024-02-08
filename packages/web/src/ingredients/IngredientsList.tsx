import { Alert, Button, Space, Spin, Table, Tag } from "antd";
import { api } from "../api/api";
import { useAuthStore } from "../auth/authStore";
import { loader } from "../components/Loader";
import { tagF } from "../utils/tagF";
import { useMyPlainIngredients } from "./useMyPlainIngredients";
export const isAdmin = () => tagF(useAuthStore.getState(), "authenticated", (x) => x.idTokenResult?.claims.admin);
export const IngredientsList = () => {
  const uid = useAuthStore((s) => tagF(s, "authenticated", (u) => u) ?? undefined);
  const res = useMyPlainIngredients(uid?.user.uid);
  const handleRemove = (id: string) => {
    loader(() => api.removeIngredient({ id }));
  };

  const handlePublicToggle = (id: string) => {
    if (res.tag !== "value") return;
    const ingredient = res.value.find((x) => x.id === id);
    loader(() => api.setPublicIngredient({ id, public: !ingredient?.data.public }));
  };

  return res.tag === "loading" ? (
    <Spin />
  ) : res.tag === "undefined" ? (
    <></>
  ) : res.tag === "error" ? (
    <Alert message={`Error: ${res.error.message}`} />
  ) : (
    <Table
      dataSource={res.value.map((x) => ({ ...x.data.ingredient, key: x.id, id: x.id, public: x.data.public }))}
      columns={[
        { title: "Name", dataIndex: "name" },
        { title: "Protein", dataIndex: "proteins" },
        { title: "Carbs", dataIndex: "carbs" },
        { title: "Fat", dataIndex: "fats" },
        { title: "Tags", dataIndex: "tags", render: (_, { tags }) => tags.map((t: string) => <Tag key={t}>{t}</Tag>) },
        {
          title: "Action",
          key: "action",
          render: (_, record) => (
            <Space size="middle">
              <Button onClick={() => handleRemove(record.id)}>Delete</Button>
              {isAdmin() && <Button onClick={() => handlePublicToggle(record.id)}>Make {record.public ? "private" : "public"}</Button>}
            </Space>
          ),
        },
      ]}
    />
  );
};
