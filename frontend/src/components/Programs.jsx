import { useState } from "react";
import { useApp } from "../ctx.js";
import { api } from "../api.js";
import { R, N, today } from "../utils.js";
export default function Programs() {
  const { S, run } = useApp();
  const [name, setName] = useState(""), [amt, setAmt] = useState(""), [date, setDate] = useState(today());
  const add = async () => { if (name.trim() && await run(() => api("programs", "POST", { name: name.trim(), amount: N(amt), date: date || today() }))) { setName(""); setAmt(""); setDate(today()); } };
  const del = (p) => confirm(`"${p.name}" કાઢવાથી તેની ઉઘરાણી, ખર્ચ અને દાન પણ કાઢી નંખાશે. ચાલુ રાખવું?`) && run(() => api("programs/" + p.id, "DELETE"));
  const chDate = (p) => { const v = prompt("કાર્યક્રમની તારીખ (YYYY-MM-DD)", p.date || ""); if (v && /^\d{4}-\d{2}-\d{2}$/.test(v.trim())) run(() => api("programs/" + p.id, "PUT", { date: v.trim() })); else if (v) alert("તારીખ આ રીતે લખો: 2026-10-10"); };
  const list = [...S.prog].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return (<>
    <div className="card"><b>નવો કાર્યક્રમ</b>
      <div className="row">
        <input placeholder="કાર્યક્રમનું નામ (દા.ત. નવરાત્રી)" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" placeholder="પ્રતિ ઘર રકમ ₹" value={amt} onChange={(e) => setAmt(e.target.value)} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="b p" onClick={add}>ઉમેરો</button>
      </div>
    </div>
    <div className="card">
      {list.map((p) => (
        <div className="li" key={p.id}>
          <span>📅 {p.name} <span className="mu">{R(p.amount)}/ઘર • {p.date || "તારીખ નથી"}</span></span>
          <span><button className="b" onClick={() => chDate(p)}>🗓 તારીખ</button> <button className="b d" onClick={() => del(p)}>🗑</button></span>
        </div>))}
      {!S.prog.length && <div className="mu">કોઈ કાર્યક્રમ નથી</div>}
    </div>
  </>);
}
