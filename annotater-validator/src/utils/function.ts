import { ACCESS_TOKEN_KEY } from "./constants";

export const isLoggedIn = () => {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAuth = (accessToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
};

export const removeAuth = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const logout = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.location.href = "/login";
};

export const getFullUrl = () => {
  return !window.location.search
    ? `${window.location.pathname}`
    : `${window.location.pathname}${window.location.search}`;
};
