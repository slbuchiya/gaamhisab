import { demoApi } from "./demo.js";

export const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const DEMO = !API;
let token = localStorage.getItem("tk") || "";
export const getToken = () => token;
// ફક્ત સ્ક્રીન બતાવવા માટે (સુરક્ષા સર્વર પર થાય છે): એડમિન કે કુટુંબનું લૉગિન?
export const getSession = () => {
  if (!token) return null;
  if (token.startsWith("k:")) return { role: "kutumb", fid: token.slice(2) }; // ડેમો
  try {
    const p = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return p.r === "k" ? { role: "kutumb", fid: p.f, u: p.u } : { role: "admin" };
  } catch { return { role: "admin" }; }
};
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
  if (!r.ok) throw new Error(j.error || ("ભૂલ " + r.status));
  return j;
}
