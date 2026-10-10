import { useState } from "react";
import { useApp } from "../ctx.js";
import { api } from "../api.js";
import { R, N, today, waPhone, waLink, receiptText } from "../utils.js";
import PSel from "./PSel.jsx";
export default function Collection() {
  const { S, admin, pid, run, showRc } = useApp();
  const [q, setQ] = useState(""), [sheet, setSheet] = useState(null);
  if (pid === "all") return <><PSel /><div className="card">ઉઘરાણી જોવા/કરવા ઉપરથી કોઈ એક કાર્યક્રમ પસંદ કરો.</div></>;
  const prog = S.prog.find((p) => p.id === pid);
  const paid = Object.fromEntries(S.pay.filter((x) => x.pid === pid).map((x) => [x.mid, x]));
  const list = S.mem.filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "gu"));

  // નંબર સેવ ન હોય તો અહીં જ પૂછી લે (ખાલી રાખો તો રસીદ WhatsApp પર નહીં મોકલાય)
  const askPhone = (m) => {
    if (waPhone(m.phone)) return m.phone;
    const v = prompt(`${m.name} નો WhatsApp નંબર (રસીદ મોકલવી ન હોય તો ખાલી રાખો)`, "");
    if (!v) return "";
    if (!waPhone(v)) { alert("નંબર સાચો નથી, રસીદ મોકલાશે નહીં"); return ""; }
    return v.trim();
  };
  const openSheet = (rec, m, phone) => setSheet({ name: m.name, no: rec.no, url: waLink(phone, receiptText(S, { ...rec, name: m.name, kind: "pay" })) });

  const tick = async (m) => {
    const old = paid[m.id];
    if (old) { if (confirm("આ ઉઘરાણી રદ કરવી છે?")) await run(() => api("payments/" + old.id, "DELETE")); return; }
    const a = prompt("કેટલી રકમ લીધી? (₹)", (prog && prog.amount) || "");
    if (a === null || !N(a)) return;
    const phone = askPhone(m);
    let created = null;
    const ok = await run(async () => {
      if (phone && phone !== m.phone) await api("members/" + m.id, "PUT", { phone });
      const r = await api("payments", "POST", { pid, mid: m.id, amount: N(a), date: today() });
      created = r && r[0];
    });
    if (ok && created && phone) openSheet(created, m, phone);
  };
  const sendRow = async (p, m) => {
    const phone = askPhone(m);
    if (!phone) return;
    if (phone !== m.phone) await run(() => api("members/" + m.id, "PUT", { phone }));
    openSheet(p, m, phone);
  };
  return (<>
    <PSel />
    <div className="row"><input placeholder="🔍 નામ શોધો" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    <div className="card">
      {list.map((m) => { const p = paid[m.id]; return (
        <div className="li" key={m.id}>
          <span>
            {admin ? <input type="checkbox" checked={!!p} onChange={() => tick(m)} /> : (p ? "✅" : "⬜")} {m.name}
            {p && <span className="mu"> {R(p.amount)}</span>}
          </span>
          {p && <span>
            <button className="b" onClick={() => showRc({ ...p, name: m.name, phone: m.phone, kind: "pay" })}>🧾 રસીદ</button>
            {admin && <> <button className="b" onClick={() => sendRow(p, m)}>📲</button></>}
          </span>}
        </div>); })}
      {!list.length && <div className="mu">કોઈ નામ નથી</div>}
    </div>
    {sheet && (
      <div className="sheetbg" onClick={() => setSheet(null)}>
        <div className="sheet" onClick={(e) => e.stopPropagation()}>
          <div style={{ fontSize: 42 }}>✅</div>
          <b>{sheet.name} ની ઉઘરાણી સચવાઈ</b>
          <div className="mu">રસીદ નં: {sheet.no}</div>
          <a className="b wa" href={sheet.url} target="_blank" rel="noreferrer" onClick={() => setTimeout(() => setSheet(null), 400)}>📲 WhatsApp પર રસીદ (PDF લિંક) મોકલો</a>
          <button className="b" onClick={() => setSheet(null)}>હમણાં નહીં</button>
        </div>
      </div>)}
  </>);
}
