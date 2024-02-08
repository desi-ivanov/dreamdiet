import { Ingredient } from "@dreamdiet/interfaces/src/";
import { Alert, Button, Input, Space, Spin } from "antd";
import confirm from "antd/es/modal/confirm";
import React, { useMemo, useState } from "react";
import { api } from "../api/api";
import { errToStr } from "../utils/showError";
import { PrettyNutritionValues } from "./PrettyNutritionValues";

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

export const pickIngredient = (onFinish: (ingredient: Ingredient) => void) => {
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
