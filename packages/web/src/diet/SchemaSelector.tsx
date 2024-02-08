import { MealSpecPerc } from "@dreamdiet/interfaces/src/";
import { Space } from "antd";
import confirm from "antd/es/modal/confirm";
import { query, where } from "firebase/firestore";
import React from "react";
import { api } from "../api/api";
import { useAuthStore } from "../auth/authStore";
import { loader } from "../components/Loader";
import { mealSchemaCollection } from "../data/collections";
import { useFirestoreQuery } from "../hooks/useFirestoreQuery";
import { useMealReqState } from "../mealSpecState";
import { tagF } from "../utils/tagF";

export const SchemaSelector = () => {
  const uid = useAuthStore((s) => tagF(s, "authenticated", (u) => u.user.uid) ?? undefined);
  const q = useFirestoreQuery(() => query(mealSchemaCollection, where("owner", "==", uid)), [uid]);
  const sc = useMealReqState((s) => s.schema);
  if (q.tag === "loading") return <>Loading</>;
  if (q.tag === "error") return <>Error</>;
  if (q.tag === "undefined") return <>No schemas</>;
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const schema = q.value.find((x) => x.id === e.target.value);
    if (schema && schema.data.schema.tag === "perc") {
      const totals = schema.data.schema.totals;
      useMealReqState.setState((s) => ({
        ...s,
        schema: schema,
        totals: totals,
        items: schema.data.schema.specs.map((x, i) => ({ id: x.name + i + "", value: x as MealSpecPerc })),
      }));
    }
  };
  const handleDelete = () => {
    confirm({
      content: `Are you sure you want to permanently delete ${sc?.data.schema.name}?`,
      onCancel: () => {},
      type: "confirm",
      onOk: () => {
        if (sc) {
          loader(() => api.deleteMealSchema({ id: sc.id })).then(() => {
            useMealReqState.setState((s) => ({ ...s, schema: undefined }));
          });
        }
      },
    });
  };
  return (
    <Space direction="horizontal">
      <div>Schema:</div>
      <select onChange={handleChange} value={sc?.id}>
        <option value="">Select schema</option>
        {q.value.map((x) => (
          <option key={x.id} value={x.id}>
            {x.data.schema.name}
          </option>
        ))}
      </select>
      <button onClick={handleDelete} disabled={!sc}>
        Delete
      </button>
    </Space>
  );
};
