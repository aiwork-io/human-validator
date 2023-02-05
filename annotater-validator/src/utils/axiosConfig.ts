import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

import { ACCESS_TOKEN_KEY } from "./constants";
import { logout } from "./function";

axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL;

const setupAxiosInterceptors = () => {
  const onRequestSuccess = async (config: AxiosRequestConfig) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      config.headers = {
        Authorization: `Bearer ${accessToken}`,
      };
    }
    return config;
  };

  const onResponseSuccess = (response: AxiosResponse) => response;
  const onResponseError = (err: AxiosError) => {
    const status = err?.response?.status;
    if (status === 401) {
      logout();
    }
    return Promise.reject(err);
  };

  axios.interceptors.request.use(onRequestSuccess);
  axios.interceptors.response.use(onResponseSuccess, onResponseError);
};

export { setupAxiosInterceptors };
