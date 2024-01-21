import confirm from "antd/es/modal/confirm";

export const errToStr = (err?: Error | string | undefined) => {
  return err?.toString() ?? String(err);
};

export const showError = (err?: Error | string | undefined) => {
  confirm({ content: errToStr(err) });
};
