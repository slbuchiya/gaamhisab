import { demoApi } from "./demo.js";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const DEMO = !API;
let token = localStorage.getItem("tk") || "";
export const getToken = () => token;
export const setToken = (t) => { token = t || ""; t ? localStorage.setItem("tk", t) : localStorage.removeItem("tk"); };

export async function api(p, method = "GET", body) {
  if (DEMO) return demoApi(p, method, body, token);
  const r = await fetch(`${API}/api/${p}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && token && p !== "login") { setToken(""); window.dispatchEvent(new Event("logout")); }
  if (!r.ok) throw new Error(j.error || "ભૂલ");
  return j;
}
