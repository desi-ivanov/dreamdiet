import { useMealReqState, useSolutionState } from "../mealSpecState";
import { PrettyNutritionValues } from "./PrettyNutritionValues";

export const Solution = () => {
  const state = useMealReqState();
  const sol = useSolutionState();
  if (sol.tag === "init") return <>Init</>;
  if (sol.tag === "unsolvable") return <>Unsolvable</>;
  return (
    <div>
      {sol.solution.map((s, i) => (
        <div key={s.mealSpecPerc.name + i}>
          <div>{s.mealSpecPerc.name}: </div>
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
            Diff: <PrettyNutritionValues proteins={p - state.totals.protein} carbs={c - state.totals.carbs} fats={f - state.totals.fat} />
          </div>
        </>
      ))(sol.solution.flatMap((s) => s.mealParts).reduce((a, v) => [a[0] + v.meal.protein * v.quantity, a[1] + v.meal.carbs * v.quantity, a[2] + v.meal.fat * v.quantity], [0, 0, 0]))}
    </div>
  );
};
