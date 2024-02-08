const Colors = {
  p: "red",
  c: "orange",
  f: "blue",
};
export const PrettyNutritionValues: React.FC<{ proteins: number; carbs: number; fats: number }> = ({ proteins, carbs, fats }) => {
  return (
    <>
      <span style={{ color: Colors.p, fontWeight: "600" }}>{proteins.toFixed(0)}</span>g <span style={{ color: Colors.c, fontWeight: "600" }}>{carbs.toFixed(0)}</span>g{" "}
      <span style={{ color: Colors.f, fontWeight: "600" }}>{fats.toFixed(0)}</span>g
    </>
  );
};
