// સુરક્ષા માટેના સાધનો: રેટ-લિમિટ, ઇનપુટ સફાઈ, પાસવર્ડ તપાસ
const crypto = require("crypto");

// ઓછા સમયમાં બહુ વિનંતીઓ આવે (હુમલો / બોટ) તો રોકે
function limiter(max, windowMs, msg) {
  const hits = new Map();
  setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (v.reset < now) hits.delete(k); }, 60000).unref();
  return (req, res, next) => {
    const now = Date.now();
    let h = hits.get(req.ip);
    if (!h || h.reset < now) { h = { n: 0, reset: now + windowMs }; hits.set(req.ip, h); }
    if (++h.n > max) {
      res.set("Retry-After", String(Math.ceil((h.reset - now) / 1000)));
      return res.status(429).json({ error: msg || "બહુ વિનંતીઓ આવી, થોડીવાર પછી ફરી કરો" });
    }
    next();
  };
}

// NoSQL injection રોકવા: "$" થી શરૂ થતી કે "." વાળી કી કાઢી નાખે
function clean(o) {
  if (Array.isArray(o)) return o.map(clean);
  if (o && typeof o === "object") {
    const r = {};
    for (const k of Object.keys(o)) { if (k.startsWith("$") || k.includes(".")) continue; r[k] = clean(o[k]); }
    return r;
  }
  return o;
}
const sanitize = (req, res, next) => { if (req.body) req.body = clean(req.body); next(); };

// ફક્ત સુરક્ષિત ફોટો ફોર્મેટ (SVG/સ્ક્રિપ્ટ નહીં)
const imgOk = (v) => !v || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v);

const sha = (v) => crypto.createHash("sha256").update(String(v)).digest();
function hashPassword(pass) {
  const salt = crypto.randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${crypto.scryptSync(String(pass), salt, 32).toString("hex")}`;
}
// stored = સાદો પાસવર્ડ  અથવા  scrypt$salt$hash  (હેશ કરેલો, વધુ સુરક્ષિત)
function checkPass(stored, pass) {
  pass = String(pass == null ? "" : pass);
  if (stored.startsWith("scrypt$")) {
    const [, salt, hash] = stored.split("$");
    const k = crypto.scryptSync(pass, Buffer.from(salt, "hex"), 32), hb = Buffer.from(hash, "hex");
    return hb.length === k.length && crypto.timingSafeEqual(k, hb);
  }
  return crypto.timingSafeEqual(sha(stored), sha(pass));
}

// ખોટા લૉગિન પ્રયત્નોની ગણતરી (15 મિનિટમાં)
const fails = new Map();
const recent = (k) => { const now = Date.now(), a = (fails.get(k) || []).filter((t) => now - t < 15 * 60e3); fails.set(k, a); return a; };
const failed = (...keys) => keys.forEach((k) => recent(k).push(Date.now()));
const locked = (ip, user) => recent("ip:" + ip).length >= 10 || recent("u:" + user).length >= 20;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { limiter, clean, sanitize, imgOk, hashPassword, checkPass, failed, locked, sleep };
