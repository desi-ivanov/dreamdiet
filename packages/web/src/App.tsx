import { MealPart, MealSpec, WithId, MealSchemaEntry, Ingredient, MealReq } from "@dreamdiet/interfaces/src/";
import { Alert, Button, Checkbox, Flex, Form, Input, InputNumber, List, Space, Spin, Table, Tabs, TabsProps, Tag } from "antd";
import { useForm } from "antd/es/form/Form";
import confirm from "antd/es/modal/confirm";
import { query, where } from "firebase/firestore";
import type { GLPK } from "glpk.js";
import React, { useMemo, useState } from "react";
import { create } from "zustand";
import { api } from "./api/api";
import { RequireAuth } from "./auth/RequireAuth";
import { useAuthStore } from "./auth/authStore";
import { FullscreenLoader, loader } from "./components/Loader";
import { mealSchemaCollection, plainIngredients } from "./data/collections";
import { useFirestoreQuery } from "./hooks/useFirestoreQuery";
import { db } from "./solver/db";
import { minTolerane, solver2 } from "./solver/main";
import { tagF } from "./utils/tagF";
import { errToStr, showError } from "./utils/showError";

const loadGlpk = () => import("glpk.js").then(({ default: loadGlpk }) => (loadGlpk as () => Promise<GLPK>)());
const Colors = {
  p: "red",
  c: "orange",
  f: "blue",
};
const PrettyNutritionValues: React.FC<{ proteins: number; carbs: number; fats: number }> = ({ proteins, carbs, fats }) => {
  return (
    <>
      <span style={{ color: Colors.p, fontWeight: "600" }}>{proteins.toFixed(0)}</span>g <span style={{ color: Colors.c, fontWeight: "600" }}>{carbs.toFixed(0)}</span>g{" "}
      <span style={{ color: Colors.f, fontWeight: "600" }}>{fats.toFixed(0)}</span>g
    </>
  );
};

const RequirementsMaker = () => {
  const state = useMealReqState((s) => s);
  const solve = () => {
    loader(() =>
      loadGlpk()
        .then((glpk) =>
          minTolerane(
            {
              glpk,
              mealSpecs: state.items.map((x) => x.value),
              tolerance: state.tolerance,
              meals: db,
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
              name: values.name,
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
            <th>Name</th>
            <th>Proteins</th>
            <th>Carbs</th>
            <th>Fats</th>
            <th>Tags</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {state.items.map((req) => (
            <MealReqComponent key={req.id} id={req.id} />
          ))}
          <tr>
            <td>Total</td>
            <td>
              <span style={{ color: Colors.p }}>{state.items.map((v) => v.value.req.protein).reduce((a, v) => a + v)}</span>g
            </td>
            <td>
              <span style={{ color: Colors.c }}>{state.items.map((v) => v.value.req.carbs).reduce((a, v) => a + v)}</span>g
            </td>
            <td>
              <span style={{ color: Colors.f }}>{state.items.map((v) => v.value.req.fat).reduce((a, v) => a + v)}</span>g
            </td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <Space direction="horizontal">
        <button onClick={() => useMealReqState.setState((s) => ({ ...s, items: [...s.items, { id: Date.now().toString(), value: { ...defaultMealSpec } }] }))}>Add</button>
        <button onClick={handleSave} disabled={!state.schema}>
          Save
        </button>
        <button onClick={handleSaveAsNew}>Save as new</button>
        <button onClick={solve}>Solve</button>
      </Space>
    </Space>
  );
};
const SchemaSelector = () => {
  const uid = useAuthStore((s) => tagF(s, "authenticated", (u) => u.user.uid) ?? undefined);
  const q = useFirestoreQuery(() => query(mealSchemaCollection, where("owner", "==", uid)), [uid]);
  const sc = useMealReqState((s) => s.schema);
  if (q.tag === "loading") return <>Loading</>;
  if (q.tag === "error") return <>Error</>;
  if (q.tag === "undefined") return <>No schemas</>;
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const schema = q.value.find((x) => x.id === e.target.value);
    if (schema) {
      useMealReqState.setState((s) => ({
        ...s,
        schema: schema,
        items: schema.data.schema.specs.map((x, i) => ({ id: i + "", value: x })),
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

function makeSuspender(): <U>(prom: Promise<U>) => Promise<U> {
  let idCnt = 0;
  let leader: number | null = null;
  return function <U>(prom: Promise<U>) {
    const id = idCnt++;
    leader = id;
    return new Promise<U>((resolve) => {
      prom.then((...res) => {
        if (id === leader) resolve(...res);
      });
    });
  };
}

function debounced<T extends any[], U>(f: (...xs: T) => Promise<U>, delayMs: number) {
  let timeout: null | ReturnType<typeof setTimeout> = null;
  let idCnt = 0;
  let leader: number | null = null;
  return (...xs: T) => {
    const id = idCnt++;
    leader = id;
    if (timeout) clearTimeout(timeout);
    const actualDelayMs = timeout === null ? 0 : delayMs;
    return new Promise<U>((resolve) => {
      timeout = setTimeout(() => {
        f(...xs).then((...res) => {
          if (id === leader) resolve(...res);
        });
      }, actualDelayMs);
    });
  };
}

const IngredientPickerModal: React.FC<{ onFinish: (ingredient: Ingredient) => void; destroy: () => void }> = ({ onFinish, destroy }) => {
  const [loading, setLoading] = useState(false);
  const [data, setDaata] = useState<Ingredient[]>([]);
  const [error, setError] = useState<null | string>(null);

  const handleChange = useMemo(() => {
    const suspender = makeSuspender();
    return debounced(async (e: React.ChangeEvent<HTMLInputElement>) => {
      setLoading(true);
      setError(null);
      return suspender(api.searchIngredient({ query: e.target.value, size: 10 }))
        .then((res) => setDaata(res.data.values))
        .catch((err) => setError(errToStr(err)))
        .finally(() => setLoading(false));
    }, 300);
  }, []);

  const handlePick = (ingredient: Ingredient) => {
    onFinish(ingredient);
    destroy();
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <div>
        <Input.Search placeholder="Search" onChange={handleChange} />
        {loading ? (
          <Spin />
        ) : error ? (
          <Alert message={error} />
        ) : (
          <div>
            {data.length === 0
              ? "No data"
              : data.map((x, i) => (
                  <Button key={x.name + i} style={{ cursor: "pointer", backgroundColor: "white", width: "100%", alignItems: "flex-start", display: "flex" }} onClick={() => handlePick(x)}>
                    {x.name} <PrettyNutritionValues proteins={x.proteins} carbs={x.carbs} fats={x.fats} />
                  </Button>
                ))}
          </div>
        )}
      </div>
      <Button onClick={destroy}>Close</Button>
    </Space>
  );
};

const pickIngredient = (onFinish: (ingredient: Ingredient) => void) => {
  const destroyWrp = { current: null as null | (() => void) };
  const doDestroy = () => {
    destroyWrp.current?.();
  };
  const { destroy } = confirm({
    content: <IngredientPickerModal onFinish={onFinish} destroy={doDestroy} />,
    footer: <></>,
  });
  destroyWrp.current = destroy;
};

const MealReqComponent: React.FC<{ id: string }> = ({ id }) => {
  const state = useMealReqState((s) => s.items.find((x) => x.id === id));
  const updateMap = (f: (v: MealSpec) => MealSpec) => useMealReqState.setState((s) => ({ ...s, items: s.items.map((x) => (x.id === id ? { ...x, value: f(x.value) } : x)) }));
  const variants = ["any", "at-least", "exactly", "only-use"] as const;

  type check = typeof variants[number] extends MealSpec["variant"]
    ? MealSpec["variant"] extends typeof variants[number]
      ? true
      : ["missing:", [Exclude<MealSpec["variant"], typeof variants[number]>]]
    : ["invalid:", [Exclude<typeof variants[number], MealSpec["variant"]>]];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _check: check = true; // just a type check to enforce all variants

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateMap((v) => ({ ...v, variant: e.target.value as MealSpec["variant"] }));
  };

  const handleInclude = () => {
    pickIngredient((ingredient) => {
      useMealReqState.setState((s) => ({
        ...s,
        items: s.items.map((x) =>
          x.id === id
            ? {
                ...x,
                value: {
                  ...x.value,
                  forced: [...x.value.forced, { name: ingredient.name, grams: 0 }],
                },
              }
            : x
        ),
      }));
    });
  };
  const handleChangeForced = (i: number, value: string) => {
    updateMap((v) => ({
      ...v,
      forced: v.forced
        .slice(0, i)
        .concat([{ name: state!.value.forced[i].name, grams: ((z) => (isNaN(z) ? state!.value.forced[i].grams : z))(parseInt(value)) }])
        .concat(v.forced.slice(i + 1)),
    }));
  };
  const handleRemoveForced = (i: number) => {
    updateMap((v) => ({
      ...v,
      forced: v.forced.slice(0, i).concat(v.forced.slice(i + 1)),
    }));
  };
  if (!state) return null;
  return (
    <>
      <tr>
        <td>
          <input type="text" value={state.value.name} onChange={(e) => updateMap((v) => ({ ...v, name: e.target.value }))} />
        </td>
        <td>
          <input type="number" value={state.value.req.protein} onChange={(e) => updateMap((v) => ({ ...v, req: { ...v.req, protein: parseFloat(e.target.value) } }))} />
        </td>
        <td>
          <input type="number" value={state.value.req.carbs} onChange={(e) => updateMap((v) => ({ ...v, req: { ...v.req, carbs: parseFloat(e.target.value) } }))} />
        </td>
        <td>
          <input type="number" value={state.value.req.fat} onChange={(e) => updateMap((v) => ({ ...v, req: { ...v.req, fat: parseFloat(e.target.value) } }))} />
        </td>
        <td>
          <input type="text" value={state.value.req.tags.join(",")} onChange={(e) => updateMap((v) => ({ ...v, req: { ...v.req, tags: e.target.value.split(",") } }))} />
        </td>
        <td>
          <button onClick={() => useMealReqState.setState((s) => ({ ...s, items: s.items.filter((x) => x.id !== id) }))}>-</button>
        </td>
      </tr>
      <tr>
        <td>
          <select onChange={handleTypeChange} value={state.value.variant} defaultValue={"any"}>
            {variants.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </td>
        <td colSpan={5}>
          {state.value.variant !== "any" && (
            <Space direction="vertical">
              {state.value.forced.map((f, i) => (
                <Space key={f.name + i}>
                  <div>{f.name}</div>
                  {state.value.variant !== "only-use" && <input type="number" value={f.grams} onChange={(e) => handleChangeForced(i, e.target.value)} />}
                  <Button onClick={() => handleRemoveForced(i)}>Remove</Button>
                </Space>
              ))}
              <Button onClick={handleInclude}>Include</Button>
            </Space>
          )}
        </td>
      </tr>
    </>
  );
};

const Solution = () => {
  const sol = useSolutionState();
  if (sol.tag === "init") return <>Init</>;
  if (sol.tag === "unsolvable") return <>Unsolvable</>;
  return (
    <div>
      {sol.solution.map((s, i) => (
        <div key={s.mealSpec.name + i}>
          <div>{s.mealSpec.name}: </div>
          <div style={{ marginLeft: 20 }}>
            {s.mealParts.map((p, j) => (
              <div key={j}>
                {p.meal.name}, {(p.quantity * 100).toFixed(2)}g <PrettyNutritionValues proteins={p.meal.protein * p.quantity} carbs={p.meal.carbs * p.quantity} fats={p.meal.fat * p.quantity} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {(([p, c, f]) => (
        <>
          <div>
            Total: <PrettyNutritionValues proteins={p} carbs={c} fats={f} />
          </div>
          <div>
            Diff:{" "}
            <PrettyNutritionValues
              proteins={p - sol.solution.reduce((a, v) => a + v.mealSpec.req.protein, 0)}
              carbs={c - sol.solution.reduce((a, v) => a + v.mealSpec.req.carbs, 0)}
              fats={f - sol.solution.reduce((a, v) => a + v.mealSpec.req.fat, 0)}
            />
          </div>
        </>
      ))(sol.solution.flatMap((s) => s.mealParts).reduce((a, v) => [a[0] + v.meal.protein * v.quantity, a[1] + v.meal.carbs * v.quantity, a[2] + v.meal.fat * v.quantity], [0, 0, 0]))}
    </div>
  );
};

const Ingredients = () => {
  const [form] = useForm<{ name: string; protein: number; carbs: number; fat: number; tags?: string }>();
  const handleAdd = (values: { name: string; protein: number; carbs: number; fat: number; tags?: string }) => {
    return loader(() =>
      api.addIngredient({
        ingredient: {
          name: values.name,
          proteins: values.protein,
          carbs: values.carbs,
          fats: values.fat,
          tags: values.tags?.split(",") ?? [],
        },
      })
    ).then(() => form.resetFields());
  };
  return (
    <Flex vertical>
      <Space>
        <Form onFinish={handleAdd} form={form} style={{ maxWidth: 600 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="protein" label="Protein" rules={[{ type: "number", min: 0, required: true }]}>
            <InputNumber addonAfter="g" />
          </Form.Item>
          <Form.Item name="carbs" label="Carbs" rules={[{ type: "number", min: 0, required: true }]}>
            <InputNumber addonAfter="g" />
          </Form.Item>
          <Form.Item name="fat" label="Fat" rules={[{ type: "number", min: 0, required: true }]}>
            <InputNumber addonAfter="g" />
          </Form.Item>
          <Form.Item name="tags" label="Tags">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit">Add</Button>
          </Form.Item>
        </Form>
      </Space>
      <IngredientsList />
    </Flex>
  );
};

const useMyPlainIngredients = (uid: string | undefined) => {
  return useFirestoreQuery(() => query(plainIngredients, where("owner", "==", uid)), [uid]);
};

const IngredientsList = () => {
  const uid = useAuthStore((s) => tagF(s, "authenticated", (u) => u.user.uid) ?? undefined);
  const res = useMyPlainIngredients(uid);
  const handleRemove = (id: string) => {
    loader(() => api.removeIngredient({ id }));
  };

  return res.tag === "loading" ? (
    <Spin />
  ) : res.tag === "undefined" ? (
    <></>
  ) : res.tag === "error" ? (
    <Alert message={`Error: ${res.error.message}`} />
  ) : (
    <Table
      dataSource={res.value.map((x) => ({ ...x.data.ingredient, key: x.id, id: x.id }))}
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
            </Space>
          ),
        },
      ]}
    />
  );
};

const tabs: TabsProps["items"] = [
  {
    key: "1",
    label: "Home",
    children: (
      <div className="App">
        <RequirementsMaker />
        <Solution />
      </div>
    ),
  },
  {
    key: "2",
    label: "Ingredients",
    children: <Ingredients />,
  },
  {
    key: "3",
    label: "Account",
    children: "TODO",
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

const defaultMealSpec: MealSpec = { name: "", req: { protein: 0, carbs: 0, fat: 0, tags: [] }, variant: "any", forced: [], tolerance: 0 };

const useMealReqState = create<{ tolerance: number; items: { id: string; value: MealSpec }[]; schema?: WithId<MealSchemaEntry> }>(() => ({
  items: [{ id: "0", value: { ...defaultMealSpec } }],
  tolerance: 0.1,
}));
const useSolutionState = create<{ tag: "solved"; solution: { mealSpec: MealSpec; mealParts: MealPart[] }[] } | { tag: "init" } | { tag: "unsolvable" }>(() => ({ tag: "init" }));
export default App;
