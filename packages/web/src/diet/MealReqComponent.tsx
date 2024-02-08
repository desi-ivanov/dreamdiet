import { MealSpecPerc } from "@dreamdiet/interfaces/src/";
import { Button, Space } from "antd";
import React from "react";
import { useMealReqState } from "../mealSpecState";
import { pickIngredient } from "./IngredientPicker";

export const MealReqComponent: React.FC<{ id: string }> = ({ id }) => {
  const state = useMealReqState((s) => s.items.find((x) => x.id === id));
  const updateMap = (f: (v: MealSpecPerc) => MealSpecPerc) => useMealReqState.setState((s) => ({ ...s, items: s.items.map((x) => (x.id === id ? { ...x, value: f(x.value) } : x)) }));
  const variants = ["any", "at-least", "exactly", "only-use"] as const;

  type check = typeof variants[number] extends MealSpecPerc["variant"]
    ? MealSpecPerc["variant"] extends typeof variants[number]
      ? true
      : ["missing:", [Exclude<MealSpecPerc["variant"], typeof variants[number]>]]
    : ["invalid:", [Exclude<typeof variants[number], MealSpecPerc["variant"]>]];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _check: check = true; // just a type check to enforce all variants

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateMap((v) => ({ ...v, variant: e.target.value as MealSpecPerc["variant"] }));
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
          <input type="number" defaultValue={state.value.req.caloricPerc} onChange={(e) => updateMap((v) => ({ ...v, req: { ...v.req, caloricPerc: parseFloat(e.target.value) } }))} />
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
