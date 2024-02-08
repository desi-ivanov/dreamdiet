import { Button, Form, Input, Space } from "antd";
import { useForm } from "antd/es/form/Form";
import confirm from "antd/es/modal/confirm";
import type { GLPK } from "glpk.js";
import { api } from "../api/api";
import { useAuthStore } from "../auth/authStore";
import { loader } from "../components/Loader";
import { useMyPlainIngredients } from "../ingredients/useMyPlainIngredients";
import { defaultMealSpecPerc, useMealReqState, useSolutionState } from "../mealSpecState";
import { binSearchMinTolerance } from "../solver/main";
import { showError } from "../utils/showError";
import { tagF } from "../utils/tagF";
import { MealReqComponent } from "./MealReqComponent";
import { SchemaSelector } from "./SchemaSelector";

const loadGlpk = () => import("glpk.js").then(({ default: loadGlpk }) => (loadGlpk as () => Promise<GLPK>)());

export const SchemaManager = () => {
  const state = useMealReqState((s) => s);
  const uid = useAuthStore((s) => tagF(s, "authenticated", (u) => u.user.uid) ?? undefined);
  const res = useMyPlainIngredients(uid);
  const solve = () => {
    const ings = res.tag === "value" ? res.value.map((x) => x.data.ingredient) : [];
    loader(() =>
      loadGlpk()
        .then((glpk) =>
          binSearchMinTolerance(
            {
              glpk,
              mealSpecs: state.items.map((x) => x.value),
              tolerance: state.tolerance,
              totals: state.totals,
              meals: ings.map((x) => ({ ...x, protein: x.proteins, carbs: x.carbs, fat: x.fats })),
            },
            0.001
          )
        )
        .then((sol) => {
          useSolutionState.setState((s) => ({ ...s, solution: sol, tag: "solved" }));
        })
    ).catch(showError);
  };

  const handleSaveAsNew = () => {
    const Content = () => {
      const [form] = useForm<{ name: string }>();
      const handleSubmit = (values: { name: string }) => {
        loader(async () =>
          api.createMealSchema({
            schema: {
              tag: "perc",
              name: values.name,
              totals: state.totals,
              specs: state.items.map((x) => x.value),
            },
          })
        )
          .then((res) => {
            destroy();
            useMealReqState.setState({ schema: { data: res.data.schema, id: res.data.id } });
          })
          .catch(showError);
      };
      return (
        <Form onFinish={handleSubmit} form={form}>
          <div>Insert name:</div>
          <Form.Item name="name" rules={[{ required: true }]}>
            <Input placeholder="name" autoFocus />
          </Form.Item>
          <Form.Item>
            <Button onClick={destroy}>Cancel</Button>
            <Button htmlType="submit">Save</Button>
          </Form.Item>
        </Form>
      );
    };
    const { destroy } = confirm({
      content: <Content />,
      footer: <></>,
    });
  };
  const handleSave = () => {
    loader(async () => {
      if (!state.schema) throw new Error("No schema");
      return api.updateMealSchema({
        id: state.schema.id,
        schema: {
          name: state.schema.data.schema.name,
          tag: "perc",
          totals: state.totals,
          specs: state.items.map((x) => x.value),
        },
      });
    }).catch(showError);
  };

  return (
    <Space direction="vertical">
      <SchemaSelector />
      <table>
        <thead>
          <tr>
            <td>Daily total {state.totals.protein * 4 + state.totals.carbs * 4 + state.totals.fat * 9}kcal</td>
            <td>
              P<input type="number" value={state.totals.protein} onChange={(e) => useMealReqState.setState((z) => ({ ...z, totals: { ...z.totals, protein: parseInt(e.target.value) } }))} />
            </td>
            <td>
              C<input type="number" value={state.totals.carbs} onChange={(e) => useMealReqState.setState((z) => ({ ...z, totals: { ...z.totals, carbs: parseInt(e.target.value) } }))} />
            </td>
            <td>
              F<input type="number" value={state.totals.fat} onChange={(e) => useMealReqState.setState((z) => ({ ...z, totals: { ...z.totals, fat: parseInt(e.target.value) } }))} />
            </td>
          </tr>
          <tr>
            <th>Name</th>
            <th>Caloricperc</th>
            <th>Tags</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {state.items.map((req) => (
            <MealReqComponent key={req.id} id={req.id} />
          ))}
        </tbody>
      </table>
      <Space direction="horizontal">
        <button onClick={() => useMealReqState.setState((s) => ({ ...s, items: [...s.items, { id: Date.now().toString(), value: { ...defaultMealSpecPerc } }] }))}>Add</button>
        <button onClick={handleSave} disabled={!state.schema}>
          Save
        </button>
        <button onClick={handleSaveAsNew}>Save as new</button>
        <button onClick={solve}>Solve</button>
      </Space>
    </Space>
  );
};
