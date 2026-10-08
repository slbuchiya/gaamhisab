// Local ma MongoDB SRV DNS na chale tyare: DNS_FIX=1 set karo (Render par jarur nathi)
if (process.env.DNS_FIX) require("dns").setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express"), mongoose = require("mongoose"), jwt = require("jsonwebtoken");
const crypto = require("crypto"), path = require("path");
const { MONGODB_URI, JWT_SECRET, ADMIN_USERS = "", FRONTEND_URL = "", PORT = 3000 } = process.env;
if (!MONGODB_URI || !JWT_SECRET) { console.error("MONGODB_URI અને JWT_SECRET જરૂરી છે"); process.exit(1); }

// ADMIN_USERS="pramukh:pass1,khajanchi:pass2"
const admins = {};
ADMIN_USERS.split(",").map(s => s.trim()).filter(Boolean).forEach(s => {
  const i = s.indexOf(":"); if (i > 0) admins[s.slice(0, i)] = s.slice(i + 1);
});

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "200kb" }));

// CORS: FRONTEND_URL = Vercel website nu link (comma thi ek karta vadhu pan chale). khali hoy to badhane chhut.
const allowed = FRONTEND_URL.split(",").map(s => s.trim().replace(/\/$/, "")).filter(Boolean);
app.use((req, res, next) => {
  const o = req.headers.origin;
  if (o && (!allowed.length || allowed.includes(o))) {
    res.set({ "Access-Control-Allow-Origin": o, "Vary": "Origin", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS" });
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const opt = { toJSON: { versionKey: false, transform: (d, r) => { r.id = String(r._id); delete r._id; } } };
const today = () => new Date().toISOString().slice(0, 10);
const str = (n) => ({ type: String, required: true, trim: true, maxlength: n });
const mk = (name, def, uniq) => { const s = new mongoose.Schema(def, opt); if (uniq) s.index(uniq, { unique: true }); return mongoose.model(name, s); };

const M = {
  programs: mk("Program", { name: str(100), amount: { type: Number, default: 0, min: 0 } }),
  members: mk("Member", { name: str(100) }),
  payments: mk("Payment", { pid: str(40), mid: str(40), amount: { type: Number, required: true, min: 0 }, date: { type: String, default: today }, no: Number }, { pid: 1, mid: 1 }),
  expenses: mk("Expense", { pid: str(40), detail: str(200), amount: { type: Number, required: true, min: 0 }, date: { type: String, default: today } }),
  donations: mk("Donation", { pid: str(40), donor: str(100), kind: { type: String, enum: ["cash", "item"], required: true }, amount: { type: Number, min: 0 }, item: { type: String, trim: true, maxlength: 200 }, date: { type: String, default: today }, no: Number })
};
const Setting = mongoose.model("Setting", new mongoose.Schema({ _id: Number, gaam: String, mandal: String, pramukh: String, khajanchi: String }, opt));
const Counter = mongoose.model("Counter", new mongoose.Schema({ _id: String, n: Number }));
const nextNo = async () => (await Counter.findByIdAndUpdate("receipt", { $inc: { n: 1 } }, { upsert: true, new: true })).n;

// લૉગિન પર બહુ પ્રયત્નો રોકવા
const tries = new Map();
function limited(ip) {
  const now = Date.now(), t = (tries.get(ip) || []).filter(x => now - x < 15 * 60e3);
  tries.set(ip, t); return t.length >= 10;
}
const h = (v) => crypto.createHash("sha256").update(String(v)).digest();

const auth = (req, res, next) => {
  try { jwt.verify((req.headers.authorization || "").replace("Bearer ", ""), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "પહેલા લૉગિન કરો" }); }
};
const wrap = (fn) => (req, res) => fn(req, res).catch(e => {
  if (e.code === 11000) return res.status(409).json({ error: "આ ઘરની ઉઘરાણી પહેલેથી થઈ ગઈ છે" });
  if (e.name === "ValidationError" || e.name === "CastError") return res.status(400).json({ error: "ખોટી માહિતી" });
  console.error(e); res.status(500).json({ error: "સર્વર ભૂલ" });
});

app.post("/api/login", wrap(async (req, res) => {
  const { user, pass } = req.body || {};
  if (limited(req.ip)) return res.status(429).json({ error: "બહુ પ્રયત્નો, થોડીવાર પછી ફરી કરો" });
  const ok = Object.prototype.hasOwnProperty.call(admins, user) && crypto.timingSafeEqual(h(admins[user]), h(pass));
  if (!ok) { tries.get(req.ip).push(Date.now()); return res.status(401).json({ error: "યુઝરનેમ કે પાસવર્ડ ખોટો" }); }
  res.json({ token: jwt.sign({ u: user }, JWT_SECRET, { expiresIn: "30d" }) });
}));

app.get("/api/all", wrap(async (req, res) => {
  const [prog, mem, pay, exp, don, set] = await Promise.all([
    M.programs.find(), M.members.find(), M.payments.find(), M.expenses.find(), M.donations.find(), Setting.findById(1)
  ]);
  res.json({ prog, mem, pay, exp, don, set: set || {} });
}));

app.put("/api/settings", auth, wrap(async (req, res) => {
  const { gaam, mandal, pramukh, khajanchi } = req.body || {};
  await Setting.findByIdAndUpdate(1, { gaam, mandal, pramukh, khajanchi }, { upsert: true });
  res.json({ ok: true });
}));

app.post("/api/:c", auth, wrap(async (req, res) => {
  const Model = M[req.params.c]; if (!Model) return res.sendStatus(404);
  const list = (Array.isArray(req.body) ? req.body : [req.body]).slice(0, 500);
  const docs = [];
  for (const b of list) {
    const d = { ...b }; delete d._id; delete d.id; delete d.no;
    if (req.params.c === "payments" || req.params.c === "donations") d.no = await nextNo();
    docs.push(d);
  }
  res.json(await Model.create(docs));
}));

app.delete("/api/:c/:id", auth, wrap(async (req, res) => {
  const { c, id } = req.params, Model = M[c]; if (!Model) return res.sendStatus(404);
  await Model.findByIdAndDelete(id);
  if (c === "programs") await Promise.all([M.payments, M.expenses, M.donations].map(m => m.deleteMany({ pid: id })));
  if (c === "members") await M.payments.deleteMany({ mid: id });
  res.json({ ok: true });
}));

app.get("/healthz", (req, res) => res.send("ok"));
app.get("/", (req, res) => res.send("ગામ હિસાબ API ચાલુ છે"));

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 }).then(async () => {
  await M.payments.init();
  app.listen(PORT, () => console.log("ચાલુ છે, port " + PORT));
}).catch(e => { console.error("MongoDB કનેક્ટ ન થયું:", e.message); process.exit(1); });