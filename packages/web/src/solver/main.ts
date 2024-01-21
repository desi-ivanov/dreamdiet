import { LP } from "glpk.js";
import GLPK from "glpk.js";
import { Meal, MealPart, MealSpec } from "@dreamdiet/interfaces/src/index";

const groupBy = <T>(arr: T[], key: (t: T) => string): { [key: string]: T[] } => {
  const res: { [key: string]: T[] } = {};
  arr.forEach((t) => {
    const k = key(t);
    if (res[k] === undefined) {
      res[k] = [];
    }
    res[k].push(t);
  });
  return res;
};
type Problem = { glpk: GLPK.GLPK; mealSpecs: MealSpec[]; meals: Meal[]; tolerance: number };
export const solver2 = async (problem: Problem): Promise<{ mealSpec: MealSpec; mealParts: MealPart[] }[]> => {
  const { glpk } = problem;
  const reqTags = problem.mealSpecs.map((p) => new Set(p.req.tags));
  const usablePerMeals = problem.mealSpecs.map((p, i) => ({
    mealSpec: p,
    usable:
      p.variant === "only-use" || p.variant === "exactly"
        ? problem.meals.filter((meal) => p.forced.some((f) => f.name === meal.name))
        : problem.meals.filter((meal) => meal.tags.length === 0 || p.req.tags.length === 0 || meal.tags.some((tag) => reqTags[i].has(tag))),
  }));

  const lp: LP = {
    name: "Meal Planner",
    objective: {
      direction: glpk.GLP_MIN,
      name: "Daily Nutrition",
      vars: usablePerMeals.flatMap(({ usable }, j) => usable.flatMap((meal, i) => [{ name: `x_${j}_${i}`, coef: 1 }])),
    },
    subjectTo: usablePerMeals
      .flatMap(({ usable, mealSpec }, j) => [
        ...(mealSpec.variant === "exactly" ? [] : (["protein", "carbs", "fat"] as const)).map((valName) => ({
          name: `${valName}_${j}`,
          vars: usable.flatMap((meal, i) => [{ name: `x_${j}_${i}`, coef: meal[valName] }]),
          bnds: {
            type: glpk.GLP_DB,
            ub: problem.mealSpecs[j].req[valName] * 3,
            lb: problem.mealSpecs[j].req[valName] * 1,
          },
        })),
        ...(mealSpec.variant === "at-least" || mealSpec.variant === "exactly"
          ? mealSpec.forced.map((f, k) => ({
              name: `forced_${j}_f${k}`,
              vars: [{ name: `x_${j}_${usable.findIndex((v) => v.name === f.name)}`, coef: 1 }],
              bnds:
                mealSpec.variant === "at-least"
                  ? {
                      type: glpk.GLP_LO,
                      ub: Infinity,
                      lb: f.grams / 100,
                    }
                  : {
                      type: glpk.GLP_DB,
                      ub: f.grams / 100,
                      lb: f.grams / 100,
                    },
            }))
          : []),
      ])
      .concat(
        (["protein", "carbs", "fat"] as const).map((valName) => ({
          name: `${valName}_full`,
          vars: usablePerMeals.flatMap(({ usable }, j) => usable.flatMap((meal, i) => [{ name: `x_${j}_${i}`, coef: meal[valName] }])),
          bnds: {
            type: glpk.GLP_DB,
            ub: problem.mealSpecs.reduce((a, p) => a + p.req[valName], 0) * (1 + problem.tolerance),
            lb: problem.mealSpecs.reduce((a, p) => a + p.req[valName], 0) * Math.max(1 - problem.tolerance, 0),
          },
        }))
      ),
  };
  const sol = await glpk.solve(lp);
  if (sol.result.status === glpk.GLP_UNBND) {
    throw new Error("Solution UNBND");
  } else if (sol.result.status === glpk.GLP_NOFEAS) {
    throw new Error("Solution NOFEAS");
  } else if (sol.result.status === glpk.GLP_INFEAS) {
    throw new Error("Solution INFEAS");
  } else if (sol.result.status === glpk.GLP_UNDEF) {
    throw new Error("Solution UNDEF");
  }
  return Object.values(
    groupBy(
      Object.entries(sol.result.vars)
        .map(([key, value]) => ({
          key,
          quantity: value,
          meal: (([_x, j, i]) => usablePerMeals[parseInt(j)].usable[parseInt(i)])(key.split("_")),
        }))
        .filter((meal) => meal.quantity > 0),
      (x) => x.key.split("_")[1]
    )
  ).map((v, j) => ({
    mealSpec: problem.mealSpecs[j],
    mealParts: v,
  }));
};
export const minTolerane = async (problem: Problem, stopRangeLR: number): Promise<Awaited<ReturnType<typeof solver2>>> => {
  // return solver2(problem);
  let l = 0;
  let r = 5;
  let p: Awaited<ReturnType<typeof solver2>> | null = null;
  while (r - l > stopRangeLR) {
    const t = (r + l) / 2;
    console.log("Tolerance", l, r);
    try {
      p = await solver2({ ...problem, tolerance: t });
      r = t;
    } catch {
      l = t;
    }
  }
  if (p === null) throw new Error("Unsolvable");
  return p;
};
