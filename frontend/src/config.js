const normalizeBase = (value) => value?.trim().replace(/\/+$/, "");

const envBase = normalizeBase(import.meta.env.VITE_API_BASE_URL);
const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : "";

let BASE_URL = envBase;

if (!BASE_URL) {
  if (import.meta.env.DEV && runtimeOrigin) {
    BASE_URL = `${runtimeOrigin}/api`;
  } else if (runtimeOrigin) {
    BASE_URL = `${runtimeOrigin}/api`;
  } else {
    BASE_URL = "/api";
  }
}

export default BASE_URL;
