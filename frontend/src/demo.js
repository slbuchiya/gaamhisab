// ડેમો મોડ: VITE_API_URL ખાલી હોય ત્યારે બ્રાઉઝરમાં જ ડેટા સચવાય (સાચા બેકએન્ડની નકલ)
const K = "gaam-demo";
const base = { programs: [], families: [], members: [], payments: [], expenses: [], donations: [], photos: [], team: [], set: {}, n: 0 };
const load = () => ({ ...base, ...JSON.parse(localStorage.getItem(K) || "{}") });
const save = (d) => localStorage.setItem(K, JSON.stringify(d));
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

export async function demoApi(p, method, body, token) {
  const d = load(), [c, id] = p.split("/");
  if (p === "login") {
    if (body.user === "pramukh" && body.pass === "1234") return { token: "demo", role: "admin" };
    const kf = d.families.find((x) => x.user && x.user === String(body.user).toLowerCase() && x.pass === body.pass);
    if (kf) return { token: "k:" + kf.id, role: "kutumb" };
    throw new Error("યુઝરનેમ કે પાસવર્ડ ખોટો");
  }
  const kfid = token.startsWith("k:") ? token.slice(2) : "";
  const strip = (a) => a.map((x) => { const o = { ...x }; if (!token) delete o.phone; return o; });
  const stripM = (a) => a.map((x) => { const o = { ...x }; if (!token || (kfid && x.fid !== kfid)) delete o.phone; return o; });
  const famOut = d.families.map(({ pass, ...f }) => ({ ...f, hasLogin: !!f.user, ...(token && !kfid ? {} : { user: undefined }) }));
  if (p === "all") return { prog: d.programs, mem: stripM(d.members), fam: famOut, pay: d.payments, exp: d.expenses, don: strip(d.donations), set: d.set };
  if (p === "photos" && method === "GET") return [...d.photos].reverse();
  if (p === "team" && method === "GET") return d.team;
  if (!token) throw new Error("પહેલા લૉગિન કરો");
  if (kfid) { // કુટુંબનું લૉગિન: ફક્ત પોતાના કુટુંબની ઉઘરાણી
    const mine = (mid) => d.members.some((m) => m.id === mid && m.fid === kfid);
    const okPay = c === "payments" && ((method === "POST" && (Array.isArray(body) ? body : [body]).every((b) => mine(b.mid))) || (method === "DELETE" && mine((d.payments.find((x) => x.id === id) || {}).mid)));
    const okMem = c === "members" && method === "PUT" && mine(id) && Object.keys(body).every((k) => k === "phone");
    if (!okPay && !okMem) throw new Error("આ કામ ફક્ત મંડળ (પ્રમુખ/ખજાનચી) કરી શકે");
  }
  if (p === "family-login") {
    d.families = d.families.map((f) => (f.id !== body.id ? f : body.remove ? { ...f, user: undefined, pass: undefined } : { ...f, user: String(body.user).toLowerCase(), pass: body.pass }));
    save(d); return { ok: true };
  }
  if (p === "settings") { d.set = body; save(d); return { ok: true }; }
  if (p === "assign") {
    const ids = new Set(body.ids || []);
    d.members = d.members.map((m) => (ids.has(m.id) ? { ...m, fid: body.fid || "" } : m));
    save(d); return { ok: true, n: ids.size };
  }
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
    if (c === "families") d.members = d.members.map((m) => (m.fid === id ? { ...m, fid: "" } : m));
    save(d); return { ok: true };
  }
  throw new Error("ખોટી વિનંતી");
}
