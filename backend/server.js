// Local ma MongoDB SRV DNS na chale tyare: DNS_FIX=1 set karo (Render par jarur nathi)
if (process.env.DNS_FIX) require("dns").setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express"), mongoose = require("mongoose"), jwt = require("jsonwebtoken"), helmet = require("helmet");
const { buildReceiptPdf } = require("./receipt");
const { buildReportPdf, rs } = require("./report");
const S = require("./security");
const { MONGODB_URI, JWT_SECRET, ADMIN_USERS = "", FRONTEND_URL = "", PORT = 3000 } = process.env;
if (!MONGODB_URI || !JWT_SECRET) { console.error("MONGODB_URI અને JWT_SECRET જરૂરી છે"); process.exit(1); }
if (JWT_SECRET.length < 32) console.warn("⚠️ JWT_SECRET ટૂંકો છે. ઓછામાં ઓછા 32 અક્ષરનો લાંબો રેન્ડમ લખાણ રાખો.");

// ADMIN_USERS="pramukh:pass1,khajanchi:scrypt$salt$hash"  (હેશ બનાવવા: node hash-password.js "પાસવર્ડ")
const admins = {};
ADMIN_USERS.split(",").map(s => s.trim()).filter(Boolean).forEach(s => {
  const i = s.indexOf(":"); if (i > 0) admins[s.slice(0, i)] = s.slice(i + 1);
});
Object.entries(admins).forEach(([u, p]) => { if (!p.startsWith("scrypt$") && p.length < 8) console.warn(`⚠️ "${u}" નો પાસવર્ડ નબળો (8 અક્ષરથી ટૂંકો) છે.`); });

const app = express();
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS: ફક્ત તમારી Vercel સાઇટ (FRONTEND_URL) ને છૂટ. Render પર FRONTEND_URL ન હોય તો બધાને બંધ.
const allowed = FRONTEND_URL.split(",").map(s => s.trim().replace(/\/$/, "")).filter(Boolean);
const open = !allowed.length && !process.env.RENDER;
if (!allowed.length && process.env.RENDER) console.warn("⚠️ FRONTEND_URL સેટ નથી, એટલે વેબસાઇટ બેકએન્ડ સાથે વાત નહીં કરી શકે.");
app.use((req, res, next) => {
  const o = req.headers.origin;
  if (o && (open || allowed.includes(o))) {
    res.set({ "Access-Control-Allow-Origin": o, "Vary": "Origin", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Max-Age": "600" });
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use("/api", S.limiter(300, 60e3));

// નાની બોડી (લૉગિન/સેટિંગ) અને મોટી બોડી (ફોટા) અલગ; મોટી ફક્ત લૉગિન પછી
const small = [express.json({ limit: "10kb" }), S.sanitize];
const big = [express.json({ limit: "1mb" }), S.sanitize];

const opt = { toJSON: { versionKey: false, transform: (d, r) => { r.id = String(r._id); delete r._id; } } };
const today = () => new Date().toISOString().slice(0, 10);
const str = (n) => ({ type: String, required: true, trim: true, maxlength: n });
const img = (req) => ({ type: String, required: req, maxlength: req ? 600000 : 250000, default: req ? undefined : "", validate: { validator: S.imgOk, message: "ખોટું ફોટો ફોર્મેટ" } });
const dateF = { type: String, default: today, maxlength: 10, validate: { validator: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v), message: "ખોટી તારીખ" } };
const mk = (name, def, uniq) => { const s = new mongoose.Schema(def, opt); if (uniq) s.index(uniq, { unique: true }); return mongoose.model(name, s); };
const ROLES = ["પ્રમુખ", "ઉપ પ્રમુખ", "ખજાનચી", "સહ ખજાનચી", "મહામંત્રી", "મંત્રી", "સલાહકાર", "કારોબારી સભ્ય"];

const M = {
  programs: mk("Program", { name: str(100), amount: { type: Number, default: 0, min: 0, max: 1e8 }, date: dateF }),
  families: mk("Family", { name: str(100), order: { type: Number, default: 0 } }),
  members: mk("Member", { name: str(100), phone: { type: String, trim: true, maxlength: 20 }, fid: { type: String, trim: true, maxlength: 40, default: "" } }),
  payments: mk("Payment", { pid: str(40), mid: str(40), amount: { type: Number, required: true, min: 0, max: 1e8 }, date: dateF, no: Number }, { pid: 1, mid: 1 }),
  expenses: mk("Expense", { pid: str(40), detail: str(200), amount: { type: Number, required: true, min: 0, max: 1e8 }, date: dateF }),
  donations: mk("Donation", { pid: str(40), donor: str(100), kind: { type: String, enum: ["cash", "item"], required: true }, amount: { type: Number, min: 0, max: 1e8 }, item: { type: String, trim: true, maxlength: 200 }, phone: { type: String, trim: true, maxlength: 20 }, date: dateF, no: Number }),
  photos: mk("Photo", { caption: { type: String, trim: true, maxlength: 200, default: "" }, pid: { type: String, default: "", maxlength: 40 }, data: img(true), date: dateF }),
  team: mk("Team", { role: { type: String, required: true, enum: ROLES }, name: str(100), phone: { type: String, trim: true, maxlength: 20 }, photo: img(false), order: { type: Number, default: 0 } })
};
const SET_FIELDS = ["gaam", "mandal", "pramukh", "khajanchi", "mantri", "address", "phone", "email", "pramukhPhone", "khajanchiPhone", "mantriPhone"];
const Setting = mongoose.model("Setting", new mongoose.Schema({ _id: Number, ...Object.fromEntries(SET_FIELDS.map(k => [k, { type: String, maxlength: 300 }])) }, opt));
const Counter = mongoose.model("Counter", new mongoose.Schema({ _id: String, n: Number }));
// કોણે શું ફેરફાર કર્યો તેની નોંધ (180 દિવસ સચવાય). Atlas માં "audits" collection માં જોઈ શકાય.
const Audit = mongoose.model("Audit", new mongoose.Schema({ user: String, action: String, target: String, ip: String, at: { type: Date, default: Date.now, expires: "180d" } }));
const audit = (req, action, target = "") => Audit.create({ user: (req.user || "-"), action, target: String(target).slice(0, 100), ip: req.ip }).catch(() => {});
const nextNo = async () => (await Counter.findByIdAndUpdate("receipt", { $inc: { n: 1 } }, { upsert: true, new: true })).n;

// જૂના કાર્યક્રમોમાં તારીખ નથી, એટલે બન્યાની તારીખ લઈએ
const progDate = (p) => p.date || p._id.getTimestamp().toISOString().slice(0, 10);
const progJson = (p) => ({ ...p.toJSON(), date: progDate(p) });
const verify = (req) => jwt.verify((req.headers.authorization || "").replace("Bearer ", ""), JWT_SECRET, { algorithms: ["HS256"] });
const isAdmin = (req) => { try { verify(req); return true; } catch { return false; } };
const auth = (req, res, next) => {
  try { req.user = verify(req).u; next(); }
  catch { res.status(401).json({ error: "પહેલા લૉગિન કરો" }); }
};
const wrap = (fn) => (req, res) => fn(req, res).catch(e => {
  if (e.code === 11000) return res.status(409).json({ error: "આ ઘરની ઉઘરાણી પહેલેથી થઈ ગઈ છે" });
  if (e.name === "ValidationError" || e.name === "CastError") return res.status(400).json({ error: "ખોટી માહિતી" });
  console.error(e.message); res.status(500).json({ error: "સર્વર ભૂલ" });
});
const writes = S.limiter(120, 60e3, "બહુ ફેરફારો, થોડીવાર પછી ફરી કરો");

app.post("/api/login", S.limiter(30, 15 * 60e3, "બહુ પ્રયત્નો, 15 મિનિટ પછી ફરી કરો"), small, wrap(async (req, res) => {
  const user = String((req.body || {}).user || "").slice(0, 50), pass = (req.body || {}).pass;
  if (S.locked(req.ip, user)) return res.status(429).json({ error: "બહુ ખોટા પ્રયત્નો, 15 મિનિટ પછી ફરી કરો" });
  const stored = Object.prototype.hasOwnProperty.call(admins, user) ? admins[user] : null;
  const ok = stored !== null && S.checkPass(stored, pass);
  if (!ok) { S.failed("ip:" + req.ip, "u:" + user); console.warn("ખોટો લૉગિન પ્રયત્ન:", user, req.ip); await S.sleep(800); return res.status(401).json({ error: "યુઝરનેમ કે પાસવર્ડ ખોટો" }); }
  req.user = user; audit(req, "login");
  res.json({ token: jwt.sign({ u: user }, JWT_SECRET, { algorithm: "HS256", expiresIn: "12h" }) });
}));

// મોબાઇલ નંબર ફક્ત લૉગિન કરેલ મંડળને દેખાય; ગામ લોકોને નહીં
app.get("/api/all", wrap(async (req, res) => {
  const [prog, mem, pay, exp, don, set, fam] = await Promise.all([
    M.programs.find(), M.members.find(), M.payments.find(), M.expenses.find(), M.donations.find(), Setting.findById(1), M.families.find().sort({ order: 1, _id: 1 })
  ]);
  const adm = isAdmin(req);
  const strip = (arr) => arr.map(d => { const o = d.toJSON(); if (!adm) delete o.phone; return o; });
  res.set("Cache-Control", "no-store");
  res.json({ prog: prog.map(progJson), mem: strip(mem), fam, pay, exp, don: strip(don), set: set || {} });
}));
app.get("/api/photos", wrap(async (req, res) => { res.json(await M.photos.find().sort({ _id: -1 }).limit(60)); }));
app.get("/api/team", wrap(async (req, res) => { res.json(await M.team.find().sort({ order: 1, _id: 1 })); }));

// રસીદનું PDF: /api/receipt/pay/<id>.pdf  અથવા  /api/receipt/don/<id>.pdf
app.get("/api/receipt/:kind/:id", S.limiter(40, 60e3), wrap(async (req, res) => {
  const { kind } = req.params, id = req.params.id.replace(/\.pdf$/i, "");
  if (!mongoose.isValidObjectId(id)) return res.sendStatus(404);
  let rec, name;
  if (kind === "pay") { rec = await M.payments.findById(id); if (rec) { const m = await M.members.findById(rec.mid); name = m ? m.name : "—"; } }
  else if (kind === "don") { rec = await M.donations.findById(id); if (rec) name = rec.donor; }
  if (!rec) return res.sendStatus(404);
  const [prog, set] = await Promise.all([M.programs.findById(rec.pid), Setting.findById(1)]);
  res.set({ "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="receipt-${rec.no}.pdf"` });
  buildReceiptPdf(res, { ...(set ? set.toJSON() : {}), no: rec.no, date: rec.date, program: prog ? prog.name : "", name, amount: rec.amount, item: rec.item });
}));

// ===== રિપોર્ટ PDF (ઓડિટ, તારીખ મુજબ રોકડ, વર્ષ મુજબ) =====
const rep = S.limiter(20, 60e3);
const dOk = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
const sum = (a) => a.reduce((t, x) => t + (Number(x.amount) || 0), 0);
const stamp = () => "બનાવ્યું: " + today();
const orgOf = (set) => `${(set && set.gaam) || ""} ${(set && set.mandal) ? "– " + set.mandal : ""}`.trim();
const signOf = (set) => ({ a: set && set.pramukh, b: set && set.khajanchi });
const sendPdf = (res, file, spec) => { res.set({ "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${file}"` }); buildReportPdf(res, spec); };
const byNo = (a, b) => (a.no || 0) - (b.no || 0);

app.get("/api/report/program/:id", rep, wrap(async (req, res) => {
  const id = req.params.id.replace(/\.pdf$/i, "");
  if (!mongoose.isValidObjectId(id)) return res.sendStatus(404);
  const [p, set, mem, pay, don, exp, total] = await Promise.all([M.programs.findById(id), Setting.findById(1), M.members.find(), M.payments.find({ pid: id }), M.donations.find({ pid: id }), M.expenses.find({ pid: id }), M.members.countDocuments()]);
  if (!p) return res.sendStatus(404);
  const nm = Object.fromEntries(mem.map(m => [String(m._id), m.name]));
  const pays = pay.sort(byNo), cash = don.filter(d => d.kind === "cash"), items = don.filter(d => d.kind !== "cash");
  const ug = sum(pays), dc = sum(cash), ex = sum(exp), inc = ug + dc;
  sendPdf(res, "audit.pdf", {
    org: orgOf(set), title: "કાર્યક્રમ ઓડિટ રિપોર્ટ", subtitle: `${p.name}  •  તારીખ: ${progDate(p)}`, generated: stamp(), sign: signOf(set),
    summary: [["ઉઘરાણી ભરનાર ઘર", `${pays.length} / ${total}`], ["કુલ ઉઘરાણી", rs(ug)], dc ? ["રોકડ દાન", rs(dc)] : null, ["કુલ આવક", rs(inc), true], ["કુલ ખર્ચ", rs(ex), true], [inc - ex >= 0 ? "બાકી રકમ (બચત)" : "ખૂટતી રકમ (ખોટ)", rs(Math.abs(inc - ex)), true]].filter(Boolean),
    sections: [
      { title: "ઉઘરાણી યાદી", cols: [{ h: "ક્રમ", w: .08 }, { h: "નામ", w: .44 }, { h: "રસીદ નં", w: .14 }, { h: "તારીખ", w: .16 }, { h: "રકમ", w: .18, a: "right" }], rows: pays.map((x, i) => [i + 1, nm[x.mid] || "—", x.no, x.date, rs(x.amount)]), total: ["", `કુલ ${pays.length} ઘર`, "", "", rs(ug)] },
      { title: "રોકડ દાન", cols: [{ h: "ક્રમ", w: .08 }, { h: "દાતા", w: .5 }, { h: "તારીખ", w: .22 }, { h: "રકમ", w: .2, a: "right" }], rows: cash.map((x, i) => [i + 1, x.donor, x.date, rs(x.amount)]), total: ["", `કુલ ${cash.length} દાતા`, "", rs(dc)] },
      { title: "વસ્તુ દાન", cols: [{ h: "ક્રમ", w: .08 }, { h: "દાતા", w: .36 }, { h: "વસ્તુ", w: .34 }, { h: "તારીખ", w: .22 }], rows: items.map((x, i) => [i + 1, x.donor, x.item || "", x.date]), total: ["", `કુલ ${items.length} દાતા`, "", ""] },
      { title: "ખર્ચ", cols: [{ h: "ક્રમ", w: .08 }, { h: "વિગત", w: .5 }, { h: "તારીખ", w: .22 }, { h: "રકમ", w: .2, a: "right" }], rows: exp.map((x, i) => [i + 1, x.detail, x.date, rs(x.amount)]), total: ["", `કુલ ${exp.length} ખર્ચ`, "", rs(ex)] },
    ],
  });
}));

app.get("/api/report/day", rep, wrap(async (req, res) => {
  const from = dOk(req.query.from) ? req.query.from : today(), to = dOk(req.query.to) ? req.query.to : from;
  const net = req.query.net !== "0", counted = req.query.counted === undefined || req.query.counted === "" ? null : Number(req.query.counted);
  const q = { date: { $gte: from, $lte: to } };
  const [set, mem, progs, pay, don, exp] = await Promise.all([Setting.findById(1), M.members.find(), M.programs.find(), M.payments.find(q), M.donations.find(q), M.expenses.find(q)]);
  const nm = Object.fromEntries(mem.map(m => [String(m._id), m.name])), pn = Object.fromEntries(progs.map(p => [String(p._id), p.name]));
  const pays = pay.sort(byNo), cash = don.filter(d => d.kind === "cash"), items = don.filter(d => d.kind !== "cash");
  const ug = sum(pays), dc = sum(cash), ex = sum(exp), inc = ug + dc, expected = net ? inc - ex : inc;
  const summary = [["ઉઘરાણી (" + pays.length + " ઘર)", rs(ug)], dc ? ["રોકડ દાન", rs(dc)] : null, ["કુલ આવક", rs(inc), true], ex ? ["કુલ ખર્ચ", rs(ex)] : null, [net ? "હાથમાં હોવી જોઈએ તેટલી રોકડ (આવક − ખર્ચ)" : "હાથમાં હોવી જોઈએ તેટલી રોકડ (આવક)", rs(expected), true]].filter(Boolean);
  if (counted !== null && Number.isFinite(counted)) {
    const diff = counted - expected;
    summary.push(["ગણેલી રોકડ", rs(counted), true], [diff === 0 ? "હિસાબ બરાબર મળે છે ✓" : diff < 0 ? "રોકડ ઓછી છે" : "રોકડ વધારે છે", diff === 0 ? "—" : rs(Math.abs(diff)), true]);
  }
  sendPdf(res, "daily.pdf", {
    org: orgOf(set), title: "તારીખ મુજબ રોકડ હિસાબ", subtitle: from === to ? `તારીખ: ${from}` : `તારીખ: ${from} થી ${to}`, generated: stamp(), sign: signOf(set), summary,
    sections: [
      { title: "ઉઘરાણી", cols: [{ h: "ક્રમ", w: .07 }, { h: "રસીદ નં", w: .12 }, { h: "નામ", w: .34 }, { h: "કાર્યક્રમ", w: .27 }, { h: "રકમ", w: .2, a: "right" }], rows: pays.map((x, i) => [i + 1, x.no, nm[x.mid] || "—", pn[x.pid] || "—", rs(x.amount)]), total: ["", "", `કુલ ${pays.length} ઘર`, "", rs(ug)] },
      { title: "રોકડ દાન", cols: [{ h: "ક્રમ", w: .08 }, { h: "દાતા", w: .45 }, { h: "કાર્યક્રમ", w: .27 }, { h: "રકમ", w: .2, a: "right" }], rows: cash.map((x, i) => [i + 1, x.donor, pn[x.pid] || "—", rs(x.amount)]), total: ["", `કુલ ${cash.length} દાતા`, "", rs(dc)] },
      { title: "વસ્તુ દાન", cols: [{ h: "ક્રમ", w: .08 }, { h: "દાતા", w: .4 }, { h: "વસ્તુ", w: .32 }, { h: "કાર્યક્રમ", w: .2 }], rows: items.map((x, i) => [i + 1, x.donor, x.item || "", pn[x.pid] || "—"]) },
      { title: "ખર્ચ", cols: [{ h: "ક્રમ", w: .08 }, { h: "વિગત", w: .45 }, { h: "કાર્યક્રમ", w: .27 }, { h: "રકમ", w: .2, a: "right" }], rows: exp.map((x, i) => [i + 1, x.detail, pn[x.pid] || "—", rs(x.amount)]), total: ["", `કુલ ${exp.length} ખર્ચ`, "", rs(ex)] },
    ],
  });
}));

app.get("/api/report/years", rep, wrap(async (req, res) => {
  const [set, progs, pay, don, exp] = await Promise.all([Setting.findById(1), M.programs.find(), M.payments.find(), M.donations.find(), M.expenses.find()]);
  const st = (id) => { const i = sum(pay.filter(x => x.pid === id)) + sum(don.filter(x => x.pid === id && x.kind === "cash")), e = sum(exp.filter(x => x.pid === id)); return { i, e }; };
  const years = {};
  progs.forEach(p => { (years[progDate(p).slice(0, 4)] = years[progDate(p).slice(0, 4)] || []).push(p); });
  let TI = 0, TE = 0;
  const sections = Object.keys(years).sort().reverse().map((y) => {
    const list = years[y].sort((a, b) => progDate(b).localeCompare(progDate(a)));
    let yi = 0, ye = 0;
    const rows = list.map((p) => { const { i, e } = st(String(p._id)); yi += i; ye += e; return [p.name, progDate(p), rs(i), rs(e), rs(i - e)]; });
    TI += yi; TE += ye;
    return { title: `વર્ષ ${y}  (${list.length} કાર્યક્રમ)`, cols: [{ h: "કાર્યક્રમ", w: .34 }, { h: "તારીખ", w: .16 }, { h: "આવક", w: .17, a: "right" }, { h: "ખર્ચ", w: .16, a: "right" }, { h: "બચત", w: .17, a: "right" }], rows, total: ["કુલ", "", rs(yi), rs(ye), rs(yi - ye)] };
  });
  sendPdf(res, "years.pdf", { org: orgOf(set), title: "વર્ષ મુજબ કાર્યક્રમ અને હિસાબ", subtitle: `કુલ ${progs.length} કાર્યક્રમ`, generated: stamp(), sign: signOf(set), summary: [["કુલ આવક", rs(TI), true], ["કુલ ખર્ચ", rs(TE), true], ["કુલ બચત", rs(TI - TE), true]], sections });
}));

// આખા ડેટાનો બેકઅપ (JSON) – ફક્ત લૉગિન કરેલ મંડળ ડાઉનલોડ કરી શકે
app.get("/api/backup", S.limiter(5, 3600e3, "બેકઅપ કલાકમાં 5 વાર જ લઈ શકાય"), auth, wrap(async (req, res) => {
  const out = { exportedAt: new Date().toISOString() };
  for (const [k, Model] of Object.entries(M)) out[k] = await Model.find();
  out.settings = await Setting.findById(1);
  audit(req, "backup");
  res.set({ "Content-Disposition": `attachment; filename="gaam-backup-${today()}.json"`, "Cache-Control": "no-store" });
  res.json(out);
}));

app.put("/api/settings", writes, auth, small, wrap(async (req, res) => {
  const b = req.body || {}, u = {};
  SET_FIELDS.forEach(k => { if (typeof b[k] === "string") u[k] = b[k].slice(0, 300); });
  await Setting.findByIdAndUpdate(1, u, { upsert: true });
  audit(req, "settings"); res.json({ ok: true });
}));

// ઘરોને કુટુંબમાં વહેંચવા: { ids: [ઘરના id...], fid: "કુટુંબ id" } (fid ખાલી = કુટુંબ વગર)
app.put("/api/assign", writes, auth, big, wrap(async (req, res) => {
  const b = req.body || {}, fid = String(b.fid || "");
  const ids = (Array.isArray(b.ids) ? b.ids : []).map(String).filter(mongoose.isValidObjectId).slice(0, 2000);
  if (!ids.length) return res.status(400).json({ error: "કોઈ ઘર પસંદ નથી" });
  if (fid && (!mongoose.isValidObjectId(fid) || !(await M.families.exists({ _id: fid })))) return res.status(400).json({ error: "કુટુંબ મળ્યું નહીં" });
  const r = await M.members.updateMany({ _id: { $in: ids } }, { fid });
  audit(req, "assign", `${ids.length}→${fid || "-"}`); res.json({ ok: true, n: r.modifiedCount });
}));

const EDIT = { members: ["name", "phone", "fid"], families: ["name"], donations: ["phone"], photos: ["caption"], team: ["role", "name", "phone", "photo"], programs: ["name", "amount", "date"] };
app.put("/api/:c/:id", writes, auth, big, wrap(async (req, res) => {
  const { c, id } = req.params, Model = M[c], f = EDIT[c];
  if (!Model || !f || !mongoose.isValidObjectId(id)) return res.sendStatus(404);
  const u = {}; f.forEach(k => { if (req.body && req.body[k] !== undefined) u[k] = req.body[k]; });
  await Model.findByIdAndUpdate(id, u, { runValidators: true });
  audit(req, "edit " + c, id); res.json({ ok: true });
}));

app.post("/api/:c", writes, auth, big, wrap(async (req, res) => {
  const Model = M[req.params.c]; if (!Model) return res.sendStatus(404);
  const list = (Array.isArray(req.body) ? req.body : [req.body]).slice(0, 500);
  const docs = [];
  for (const b of list) {
    if (!b || typeof b !== "object") return res.status(400).json({ error: "ખોટી માહિતી" });
    const d = { ...b }; delete d._id; delete d.id; delete d.no;
    if (req.params.c === "payments" || req.params.c === "donations") d.no = await nextNo();
    if (req.params.c === "families") d.order = Date.now();
    docs.push(d);
  }
  const created = await Model.create(docs);
  audit(req, "add " + req.params.c, `${docs.length}`); res.json(created);
}));

app.delete("/api/:c/:id", writes, auth, wrap(async (req, res) => {
  const { c, id } = req.params, Model = M[c];
  if (!Model || !mongoose.isValidObjectId(id)) return res.sendStatus(404);
  await Model.findByIdAndDelete(id);
  if (c === "programs") await Promise.all([M.payments, M.expenses, M.donations].map(m => m.deleteMany({ pid: id })));
  if (c === "members") await M.payments.deleteMany({ mid: id });
  if (c === "families") await M.members.updateMany({ fid: id }, { fid: "" });
  audit(req, "delete " + c, id); res.json({ ok: true });
}));

app.get("/healthz", (req, res) => res.send("ok"));
app.get("/", (req, res) => res.send("ગામ હિસાબ API ચાલુ છે"));
app.use((req, res) => res.status(404).json({ error: "મળ્યું નહીં" }));
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") return res.status(413).json({ error: "ડેટા બહુ મોટો છે" });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "ખોટી માહિતી" });
  console.error(err.message); res.status(500).json({ error: "સર્વર ભૂલ" });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("MongoDB કનેક્ટ થઈ ગયું!");
    await M.payments.init();

    app.listen(PORT, () => console.log("ચાલુ છે, port " + PORT));
  })
  .catch(e => {
    console.error("MongoDB કનેક્ટ ન થયું:", e.message);
    process.exit(1);
  });

