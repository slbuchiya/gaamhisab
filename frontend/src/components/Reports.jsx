import { useState } from "react";
import "./reports.css";
import { useApp } from "../ctx.js";
import { R, N, today, sum, programStats, reportUrl, DEN } from "../utils.js";

const ymd = (d) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
const Pdf = ({ href, label = "📄 PDF બનાવો / ડાઉનલોડ" }) => href
  ? <a className="b p rp-pdf" href={href} target="_blank" rel="noreferrer">{label}</a>
  : <span className="mu">PDF માટે બેકએન્ડ જોડેલું હોવું જોઈએ</span>;
const Sum = ({ items }) => <div className="rp-sum">{items.map(([k, v, cls]) => <div className={"rp-c " + (cls || "")} key={k}><span>{k}</span><b>{v}</b></div>)}</div>;
const Table = ({ head, rows, foot, right = [] }) => (
  <div className="rp-scroll"><table className="rp-t">
    <thead><tr>{head.map((h, i) => <th key={i} className={right.includes(i) ? "r" : ""}>{h}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k} className={right.includes(k) ? "r" : ""}>{c}</td>)}</tr>)}
      {!rows.length && <tr><td colSpan={head.length} className="mu">કોઈ નોંધ નથી</td></tr>}</tbody>
    {foot && <tfoot><tr>{foot.map((c, i) => <td key={i} className={right.includes(i) ? "r" : ""}>{c}</td>)}</tr></tfoot>}
  </table></div>
);

function Day() {
  const { S, admin } = useApp();
  const [from, setFrom] = useState(today()), [to, setTo] = useState(today()), [net, setNet] = useState(true), [cnt, setCnt] = useState({});
  const f = (x) => x.date >= from && x.date <= to;
  const mem = Object.fromEntries(S.mem.map((m) => [m.id, m.name])), pn = Object.fromEntries(S.prog.map((p) => [p.id, p.name]));
  const pays = S.pay.filter(f).sort((a, b) => (a.no || 0) - (b.no || 0));
  const don = S.don.filter(f), cash = don.filter((d) => d.kind === "cash"), items = don.filter((d) => d.kind !== "cash"), exps = S.exp.filter(f);
  const ug = sum(pays), dc = sum(cash), ex = sum(exps), inc = ug + dc, expected = net ? inc - ex : inc;
  const counted = DEN.reduce((a, d) => a + d * N(cnt[d]), 0), has = DEN.some((d) => N(cnt[d]) > 0), diff = counted - expected;
  const set = (a, b) => { setFrom(a); setTo(b); };
  const q = `from=${from}&to=${to}&net=${net ? 1 : 0}${has ? "&counted=" + counted : ""}`;
  return (<>
    <div className="card"><b>📅 તારીખ પસંદ કરો</b>
      <div className="row"><input type="date" value={from} onChange={(e) => { setFrom(e.target.value); if (e.target.value > to) setTo(e.target.value); }} /><span>થી</span><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></div>
      <div className="row">
        <button className="b" onClick={() => set(today(), today())}>આજ</button>
        <button className="b" onClick={() => { const y = ymd(Date.now() - 864e5); set(y, y); }}>ગઈકાલ</button>
        <button className="b" onClick={() => set(ymd(Date.now() - 6 * 864e5), today())}>છેલ્લા 7 દિવસ</button>
      </div>
    </div>
    <Sum items={[["ઉઘરાણી (" + pays.length + " ઘર)", R(ug)], ["રોકડ દાન", R(dc)], ["કુલ આવક", R(inc), "good"], ["કુલ ખર્ચ", R(ex), "bad"]]} />

    {pays.length > 0 && <>
      <div className="rp-h">ઉઘરાણી ({pays.length} ઘર)</div>
      <Table head={["ક્રમ", "રસીદ", "નામ", "કાર્યક્રમ", "રકમ"]} right={[4]} rows={pays.map((x, i) => [i + 1, x.no, mem[x.mid] || "—", pn[x.pid] || "—", R(x.amount)])} foot={["", "", "કુલ " + pays.length + " ઘર", "", R(ug)]} />
    </>}
    {!pays.length && !don.length && !exps.length && <div className="card mu" style={{ textAlign: "center" }}>આ તારીખે કોઈ નોંધ નથી.</div>}
    {(cash.length > 0 || items.length > 0) && <>
      <div className="rp-h">દાન</div>
      <Table head={["દાતા", "કાર્યક્રમ", "દાન"]} right={[2]} rows={don.map((d) => [d.donor, pn[d.pid] || "—", d.kind === "cash" ? R(d.amount) : d.item])} foot={["કુલ રોકડ દાન", "", R(dc)]} />
    </>}
    {exps.length > 0 && <>
      <div className="rp-h">ખર્ચ</div>
      <Table head={["વિગત", "કાર્યક્રમ", "રકમ"]} right={[2]} rows={exps.map((x) => [x.detail, pn[x.pid] || "—", R(x.amount)])} foot={["કુલ ખર્ચ", "", R(ex)]} />
    </>}

    {admin && <div className="card">
      <b>💵 રોકડ ગણતરી (હાથમાં કેટલી રોકડ છે?)</b>
      <div className="mu">દરેક નોટની ગણતરી લખો. એપના હિસાબ સાથે મેળ ખાય છે કે નહીં તે તરત દેખાશે.</div>
      <label className="row" style={{ cursor: "pointer" }}><input type="checkbox" checked={net} onChange={(e) => setNet(e.target.checked)} /> ખર્ચ કરેલી રોકડ બાદ કરવી</label>
      <div className="rp-den">{DEN.map((d) => <label key={d}>₹{d} ×<input type="number" min="0" inputMode="numeric" value={cnt[d] || ""} onChange={(e) => setCnt({ ...cnt, [d]: e.target.value })} /></label>)}</div>
      <div className="rp-sum">
        <div className="rp-c"><span>હોવી જોઈએ તે રોકડ</span><b>{R(expected)}</b></div>
        <div className="rp-c"><span>ગણેલી રોકડ</span><b>{R(counted)}</b></div>
      </div>
      {has && <div className={"rp-res " + (diff === 0 ? "ok" : diff < 0 ? "low" : "high")}>
        {diff === 0 ? "✅ હિસાબ બરાબર મળે છે, કોઈ ગડબડ નથી" : diff < 0 ? `❌ રોકડ ${R(-diff)} ઓછી છે, ફરી તપાસો` : `⚠️ રોકડ ${R(diff)} વધારે છે, ફરી તપાસો`}
      </div>}
    </div>}
    <div className="row"><Pdf href={reportUrl("day") && `${reportUrl("day")}?${q}`} /></div>
  </>);
}

function ProgramAudit() {
  const { S } = useApp();
  const [pid, setPid] = useState(S.prog.length ? [...S.prog].sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0].id : "");
  const p = S.prog.find((x) => x.id === pid);
  if (!S.prog.length) return <div className="card">હજી કોઈ કાર્યક્રમ નથી.</div>;
  const st = pid ? programStats(S, pid) : null, mem = Object.fromEntries(S.mem.map((m) => [m.id, m.name]));
  return (<>
    <div className="card"><b>🎯 કાર્યક્રમ પસંદ કરો</b>
      <div className="row"><select value={pid} onChange={(e) => setPid(e.target.value)}>{S.prog.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.date || "—"})</option>)}</select></div>
    </div>
    {p && st && <>
      <Sum items={[["કુલ આવક", R(st.inc), "good"], ["કુલ ખર્ચ", R(st.ex), "bad"], [st.bal >= 0 ? "બાકી રકમ (બચત)" : "ખોટ", R(Math.abs(st.bal)), st.bal >= 0 ? "good" : "bad"], ["ભરનાર ઘર", `${st.pays.length}/${S.mem.length}`]]} />
      {st.pays.length > 0 && <>
        <div className="rp-h">આવક</div>
        <Table head={["ક્રમ", "નામ", "રસીદ", "તારીખ", "રકમ"]} right={[4]} rows={st.pays.map((x, i) => [i + 1, mem[x.mid] || "—", x.no, x.date, R(x.amount)])} foot={["", "કુલ " + st.pays.length + " ઘર ઉઘરાણી", "", "", R(st.ug)]} />
      </>}
      {st.cash.length > 0 && <Table head={["રોકડ દાતા", "તારીખ", "રકમ"]} right={[2]} rows={st.cash.map((d) => [d.donor, d.date, R(d.amount)])} foot={["કુલ રોકડ દાન (" + st.cash.length + ")", "", R(st.dc)]} />}
      {st.items.length > 0 && <Table head={["વસ્તુ દાતા", "વસ્તુ", "તારીખ"]} rows={st.items.map((d) => [d.donor, d.item, d.date])} />}
      {st.exps.length > 0 && <>
        <div className="rp-h">ખર્ચ</div>
        <Table head={["ક્રમ", "વિગત", "તારીખ", "રકમ"]} right={[3]} rows={st.exps.map((x, i) => [i + 1, x.detail, x.date, R(x.amount)])} foot={["", "કુલ " + st.exps.length + " ખર્ચ", "", R(st.ex)]} />
      </>}
      <div className="card" style={{ textAlign: "center" }}><b>કુલ આવક {R(st.inc)} − કુલ ખર્ચ {R(st.ex)} = {st.bal >= 0 ? "બચત" : "ખોટ"} {R(Math.abs(st.bal))}</b></div>
      <div className="row"><Pdf href={reportUrl("program/" + pid + ".pdf")} label="📄 ઓડિટ PDF ડાઉનલોડ કરો" /></div>
    </>}
  </>);
}

function Years() {
  const { S } = useApp();
  const years = {};
  S.prog.forEach((p) => { const y = (p.date || "").slice(0, 4) || "—"; (years[y] = years[y] || []).push(p); });
  const ys = Object.keys(years).sort().reverse();
  if (!ys.length) return <div className="card">હજી કોઈ કાર્યક્રમ નથી.</div>;
  return (<>
    {ys.map((y) => {
      const list = years[y].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      const rows = list.map((p) => { const t = programStats(S, p.id); return { p, t }; });
      const yi = rows.reduce((a, r) => a + r.t.inc, 0), ye = rows.reduce((a, r) => a + r.t.ex, 0);
      return (<div key={y}>
        <div className="rp-h">🗓 વર્ષ {y} • {list.length} કાર્યક્રમ</div>
        <Table head={["કાર્યક્રમ", "તારીખ", "આવક", "ખર્ચ", "બચત"]} right={[2, 3, 4]} rows={rows.map(({ p, t }) => [p.name, p.date || "—", R(t.inc), R(t.ex), R(t.bal)])} foot={["કુલ", "", R(yi), R(ye), R(yi - ye)]} />
      </div>);
    })}
    <div className="row"><Pdf href={reportUrl("years")} label="📄 વર્ષવાર PDF ડાઉનલોડ કરો" /></div>
  </>);
}

export default function Reports() {
  const [v, setV] = useState("day");
  const T = [["day", "💵 તારીખ મુજબ રોકડ"], ["prog", "🎯 કાર્યક્રમ ઓડિટ"], ["year", "🗓 વર્ષ મુજબ"]];
  return (<>
    <div className="rp-tabs">{T.map(([k, n]) => <button key={k} className={v === k ? "on" : ""} onClick={() => setV(k)}>{n}</button>)}</div>
    {v === "day" ? <Day /> : v === "prog" ? <ProgramAudit /> : <Years />}
  </>);
}
