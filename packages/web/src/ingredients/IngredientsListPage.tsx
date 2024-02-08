import { Flex } from "antd";
import { IngredientsList } from "./IngredientsList";
import { AddIngredientForm } from "./AddIngredientForm";

export const IngredientsListPage = () => {
  return (
    <Flex vertical>
      <AddIngredientForm />
      <IngredientsList />
    </Flex>
  );
};
