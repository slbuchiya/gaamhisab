import { useState } from "react";
import { useApp } from "../ctx.js";
import { api } from "../api.js";
import { R, N } from "../utils.js";
export default function Programs() {
  const { S, run } = useApp();
  const [name, setName] = useState(""), [amt, setAmt] = useState("");
  const add = async () => { if (name.trim() && await run(() => api("programs", "POST", { name: name.trim(), amount: N(amt) }))) { setName(""); setAmt(""); } };
  const del = (p) => confirm(`"${p.name}" કાઢવાથી તેની ઉઘરાણી, ખર્ચ અને દાન પણ કાઢી નંખાશે. ચાલુ રાખવું?`) && run(() => api("programs/" + p.id, "DELETE"));
  return (<>
    <div className="card"><b>નવો કાર્યક્રમ</b>
      <div className="row">
        <input placeholder="કાર્યક્રમનું નામ (દા.ત. નવરાત્રી)" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" placeholder="પ્રતિ ઘર રકમ ₹" value={amt} onChange={(e) => setAmt(e.target.value)} />
        <button className="b p" onClick={add}>ઉમેરો</button>
      </div>
    </div>
    <div className="card">
      {S.prog.map((p) => (
        <div className="li" key={p.id}><span>📅 {p.name} <span className="mu">{R(p.amount)}/ઘર</span></span><button className="b d" onClick={() => del(p)}>🗑</button></div>))}
      {!S.prog.length && <div className="mu">કોઈ કાર્યક્રમ નથી</div>}
    </div>
  </>);
}
