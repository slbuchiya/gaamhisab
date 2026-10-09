export const N = (v) => Number(v) || 0;
export const R = (v) => "₹" + N(v).toLocaleString("en-IN");
export const today = () => new Date().toISOString().slice(0, 10);
export const pname = (S, id) => (S.prog.find((p) => p.id === id) || {}).name || "—";
export const inP = (pid) => (x) => pid === "all" || x.pid === pid;
export const sum = (a) => a.reduce((t, x) => t + N(x.amount), 0);
export function totals(S, pid) {
  const f = inP(pid);
  const ug = sum(S.pay.filter(f));
  const dc = sum(S.don.filter(f).filter((x) => x.kind === "cash"));
  const ex = sum(S.exp.filter(f));
  return { ug, dc, inc: ug + dc, ex, bal: ug + dc - ex };
}

// WhatsApp: ભારતીય નંબર -> 91XXXXXXXXXX
export const waPhone = (p) => { let d = String(p || "").replace(/\D/g, ""); if (d.length === 11 && d[0] === "0") d = d.slice(1); if (d.length === 10) d = "91" + d; return d.length >= 11 ? d : ""; };
export const waLink = (p, text) => `https://wa.me/${waPhone(p)}${text ? "?text=" + encodeURIComponent(text) : ""}`;
export function receiptText(S, o) {
  const s = S.set;
  return [
    `🙏 ${s.mandal || s.gaam || "ગામ હિસાબ"}`,
    `રસીદ નં: ${o.no}`,
    `તારીખ: ${o.date}`,
    `કાર્યક્રમ: ${pname(S, o.pid)}`,
    `શ્રી ${o.name} પાસેથી ${o.item ? "વસ્તુ: " + o.item : R(o.amount)} સ્વીકાર્યા. આભાર 🙏`,
    `રસીદ જુઓ / પ્રિન્ટ: ${location.origin}/?r=${o.kind}-${o.id}`,
  ].join("\n");
}
export function sendWa(S, o) {
  if (!waPhone(o.phone)) return alert("આ વ્યક્તિનો મોબાઇલ નંબર સેવ નથી");
  window.open(waLink(o.phone, receiptText(S, o)), "_blank");
}
// ફોટો નાનો કરીને (JPEG) ડેટાબેઝમાં સાચવવા માટે
export function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      for (const [max, q] of [[1000, 0.72], [900, 0.6], [700, 0.5]]) {
        const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const d = c.toDataURL("image/jpeg", q);
        if (d.length < 580000) return res(d);
      }
      rej(new Error("ફોટો બહુ મોટો છે"));
    };
    img.onerror = () => rej(new Error("ફોટો વાંચી શકાયો નહીં"));
    img.src = url;
  });
}
