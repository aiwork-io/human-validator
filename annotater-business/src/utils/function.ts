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

export const formatText = (text?: string | null): string => {
  if (!text) return "-";
  return text;
};

const fallbackCopyTextToClipboard = (text: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand("copy");
    const msg = successful ? "successful" : "unsuccessful";
    // eslint-disable-next-line no-console
    console.log("Fallback: Copying text command was " + msg);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Fallback: Oops, unable to copy", err);
  }

  document.body.removeChild(textArea);
};

export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return true;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Async: Could not copy text: ", err);
    return false;
  }
};

export const delay = async (t: number) =>
  new Promise((resolve) => setTimeout(resolve, t));
