// ડેમો મોડ: VITE_API_URL ખાલી હોય ત્યારે બ્રાઉઝરમાં જ ડેટા સચવાય (સાચા બેકએન્ડની નકલ)
const K = "gaam-demo";
const base = { programs: [], members: [], payments: [], expenses: [], donations: [], photos: [], team: [], set: {}, n: 0 };
const load = () => ({ ...base, ...JSON.parse(localStorage.getItem(K) || "{}") });
const save = (d) => localStorage.setItem(K, JSON.stringify(d));
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

export async function demoApi(p, method, body, token) {
  const d = load(), [c, id] = p.split("/");
  if (p === "login") {
    if (body.user === "pramukh" && body.pass === "1234") return { token: "demo" };
    throw new Error("યુઝરનેમ કે પાસવર્ડ ખોટો");
  }
  const strip = (a) => a.map((x) => { const o = { ...x }; if (!token) delete o.phone; return o; });
  if (p === "all") return { prog: d.programs, mem: strip(d.members), pay: d.payments, exp: d.expenses, don: strip(d.donations), set: d.set };
  if (p === "photos" && method === "GET") return [...d.photos].reverse();
  if (p === "team" && method === "GET") return d.team;
  if (!token) throw new Error("પહેલા લૉગિન કરો");
  if (p === "settings") { d.set = body; save(d); return { ok: true }; }
  if (!d[c]) throw new Error("ખોટી વિનંતી");
  if (method === "POST") {
    const out = [];
    for (const b of Array.isArray(body) ? body : [body]) {
      const r = { ...b, id: uid() };
      if (c === "payments") {
        if (d.payments.some((x) => x.pid === r.pid && x.mid === r.mid)) throw new Error("આ ઘરની ઉઘરાણી પહેલેથી થઈ ગઈ છે");
        r.no = ++d.n; r.date = r.date || today();
      }
      if (c === "donations") { r.no = ++d.n; r.date = r.date || today(); }
      if (c === "expenses" || c === "photos") r.date = r.date || today();
      d[c].push(r); out.push(r);
    }
    save(d); return out;
  }
  if (method === "PUT") {
    d[c] = d[c].map((x) => (x.id === id ? { ...x, ...body } : x));
    save(d); return { ok: true };
  }
  if (method === "DELETE") {
    d[c] = d[c].filter((x) => x.id !== id);
    if (c === "programs") ["payments", "expenses", "donations"].forEach((t) => (d[t] = d[t].filter((x) => x.pid !== id)));
    if (c === "members") d.payments = d.payments.filter((x) => x.mid !== id);
    save(d); return { ok: true };
  }
  throw new Error("ખોટી વિનંતી");
}
