import { useState } from "react";
import "./reports.css";
import "./collection.css";
import { useApp } from "../ctx.js";
import { api } from "../api.js";
import { R, N, today, waPhone, waLink, receiptText, isNote } from "../utils.js";
import PSel from "./PSel.jsx";

export default function Collection() {
  const { S, admin, kut, pid, run, showRc } = useApp();
  const canTick = admin || !!kut; // કુટુંબનું લૉગિન પણ ઉઘરાણી કરી શકે (ફક્ત પોતાના કુટુંબની)
  const [q, setQ] = useState(""), [sheet, setSheet] = useState(null), [fid, setFid] = useState("all");
  if (pid === "all") return <><PSel /><div className="card">ઉઘરાણી જોવા/કરવા ઉપરથી કોઈ એક કાર્યક્રમ પસંદ કરો.</div></>;
  const prog = S.prog.find((p) => p.id === pid);
  const MEM = kut ? S.mem.filter((m) => m.fid === kut.fid) : S.mem;
  const paid = Object.fromEntries(S.pay.filter((x) => x.pid === pid).map((x) => [x.mid, x]));

  // સરવાળો (શોધ ફિલ્ટર વગર આખા ગામનો)
  const paidAll = MEM.filter((m) => paid[m.id]);
  const pendAll = MEM.filter((m) => !paid[m.id]);
  const total = paidAll.reduce((a, m) => a + N(paid[m.id].amount), 0);
  const pct = MEM.length ? Math.round((paidAll.length * 100) / MEM.length) : 0;
  const est = prog && N(prog.amount) ? N(prog.amount) * pendAll.length : 0;

  const fam = S.fam || [], famIds = new Set(fam.map((x) => x.id));
  const inFam = (m) => fid === "all" || (fid === "none" ? !famIds.has(m.fid) : m.fid === fid);
  const match = (m) => inFam(m) && m.name.toLowerCase().includes(q.trim().toLowerCase());
  // જેમણે આપ્યા: છેલ્લે આપનાર સૌથી ઉપર   |   બાકી: નામ મુજબ
  const paidList = paidAll.filter(match).sort((a, b) => (N(paid[b.id].no) - N(paid[a.id].no)) || a.name.localeCompare(b.name, "gu"));
  const pendList = pendAll.filter(match).sort((a, b) => a.name.localeCompare(b.name, "gu"));

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
    if (old) { if (confirm(`${m.name} ની ઉઘરાણી રદ કરવી છે? (તે બાકીની યાદીમાં પાછા જશે)`)) await run(() => api("payments/" + old.id, "DELETE")); return; }
    const a = prompt("કેટલી રકમ લીધી? (₹)\n(રોકડ લીધી ન હોય, પ્રસાદી/વસ્તુ આપી હોય તો 0 લખો)", (prog && prog.amount) || "");
    if (a === null || String(a).trim() === "" || isNaN(Number(a)) || Number(a) < 0) return;
    if (!N(a)) { // રોકડ વગર: નામ ટિક થશે અને દાતાની યાદીમાં પણ દેખાશે
      const note = prompt(`${m.name} એ શું આપ્યું? (દા.ત. પ્રસાદી, નાળિયેર, મીઠાઈ)`, "પ્રસાદી");
      if (note === null || !note.trim()) return;
      await run(() => api("payments", "POST", { pid, mid: m.id, amount: 0, note: note.trim(), date: today() }));
      return;
    }
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

  const Row = ({ m }) => {
    const p = paid[m.id];
    return (
      <div className={"li" + (p ? " cl-row-paid" : "")}>
        <span>
          {canTick ? <input type="checkbox" checked={!!p} onChange={() => tick(m)} /> : (p ? "✅" : "⬜")} {m.name}
          {p && (isNote(p) ? <span className="mu"> 🎁 {p.note} (રોકડ નહીં)</span> : <span className="mu"> {R(p.amount)} • રસીદ {p.no}</span>)}
        </span>
        {p && !isNote(p) && <span>
          <button className="b" onClick={() => showRc({ ...p, name: m.name, phone: m.phone, kind: "pay" })}>🧾 રસીદ</button>
          {canTick && <> <button className="b" onClick={() => sendRow(p, m)}>📲</button></>}
        </span>}
      </div>
    );
  };

  return (<>
    <PSel />
    <div className="rp-sum">
      <div className="rp-c good"><span>✅ મળેલ રકમ </span><b>{paidAll.length} ઘર</b></div>
      <div className="rp-c bad"><span>⏳ બાકી રકમ </span><b>{pendAll.length} ઘર</b></div>
      <div className="rp-c"><span>💰 કુલ ઉઘરાણી</span><b>{R(total)}</b></div>
      <div className="rp-c"><span>{kut ? "તમારા કુટુંબના ઘર" : "કુલ ઘર"}</span><b>{MEM.length}</b></div>
    </div>
    <div className="card" style={{ padding: "10px 12px" }}>
      <div className="mu">ઉઘરાણી પ્રગતિ: {pct}%{est > 0 && <> • બાકી અંદાજ: {R(est)}</>}</div>
      <div className="bar"><i style={{ width: pct + "%" }} /></div>
    </div>
    <div className="row"><input placeholder="🔍 નામ શોધો" value={q} onChange={(e) => setQ(e.target.value)} />
      {!kut && fam.length > 0 && <select value={fid} onChange={(e) => setFid(e.target.value)}>
        <option value="all">👨‍👩‍👧‍👦 બધા કુટુંબ</option>
        {fam.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        <option value="none">કુટુંબ વગર</option>
      </select>}
    </div>

    <div className="cl-h ok"><span>✅ મળેલ રકમ </span><span>{paidList.length}{q && paidList.length !== paidAll.length ? ` / ${paidAll.length}` : ""} ઘર</span></div>
    <div className="card">
      {paidList.map((m) => <Row key={m.id} m={m} />)}
      {!paidList.length && <div className="cl-empty">{q ? "આ નામ આપનારમાં નથી" : "હજી કોઈએ આપ્યા નથી"}</div>}
      {paidList.length > 0 && <div className="cl-foot">કુલ {paidAll.length} ઘર • {R(total)}</div>}
    </div>

    <div className="cl-h pend"><span>⏳ બાકી રકમ </span><span>{pendList.length}{q && pendList.length !== pendAll.length ? ` / ${pendAll.length}` : ""} ઘર</span></div>
    <div className="card">
      {pendList.map((m) => <Row key={m.id} m={m} />)}
      {!pendList.length && <div className="cl-empty">{q ? "આ નામ બાકીમાં નથી" : "🎉 બધાએ આપી દીધા!"}</div>}
      {pendList.length > 0 && <div className="cl-foot pend">હજી બાકી: {pendAll.length} ઘર{est > 0 && <> • અંદાજ {R(est)}</>}</div>}
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
