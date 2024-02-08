import { Button, Form, Input, InputNumber, Space } from "antd";
import { useForm } from "antd/es/form/Form";
import { api } from "../api/api";
import { loader } from "../components/Loader";

export const AddIngredientForm = () => {
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
  );
};
