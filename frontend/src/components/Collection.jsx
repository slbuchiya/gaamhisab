import { useState } from "react";
import { useApp } from "../ctx.js";
import { api } from "../api.js";
import { R, N, today, sendWa } from "../utils.js";
import PSel from "./PSel.jsx";
export default function Collection() {
  const { S, admin, pid, run, showRc } = useApp();
  const [q, setQ] = useState("");
  if (pid === "all") return <><PSel /><div className="card">ઉઘરાણી જોવા/કરવા ઉપરથી કોઈ એક કાર્યક્રમ પસંદ કરો.</div></>;
  const prog = S.prog.find((p) => p.id === pid);
  const paid = Object.fromEntries(S.pay.filter((x) => x.pid === pid).map((x) => [x.mid, x]));
  const list = S.mem.filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "gu"));

  const tick = async (m) => {
    const old = paid[m.id];
    if (old) { if (confirm("આ ઉઘરાણી રદ કરવી છે?")) await run(() => api("payments/" + old.id, "DELETE")); return; }
    const a = prompt("કેટલી રકમ લીધી? (₹)", (prog && prog.amount) || "");
    if (a === null || !N(a)) return;
    let created = null;
    const ok = await run(async () => { const r = await api("payments", "POST", { pid, mid: m.id, amount: N(a), date: today() }); created = r && r[0]; });
    if (ok && created && m.phone && confirm(`${m.name} ને WhatsApp પર રસીદ મોકલવી છે?`)) sendWa(S, { ...created, name: m.name, phone: m.phone, kind: "pay" });
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
            {admin && m.phone && <> <button className="b" onClick={() => sendWa(S, { ...p, name: m.name, phone: m.phone, kind: "pay" })}>📲</button></>}
          </span>}
        </div>); })}
      {!list.length && <div className="mu">કોઈ નામ નથી</div>}
    </div>
  </>);
}
