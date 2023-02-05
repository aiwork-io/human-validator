import { get } from "lodash";

export const getGenericErrors = (error: Error): string => {
  const inputFieldError = get(error, "response.data.error");

  return inputFieldError;
};
