import { useState } from "react";
import { useApp } from "../ctx.js";
import { api } from "../api.js";
import { R, N, pname, inP, totals, today } from "../utils.js";
import PSel from "./PSel.jsx";
export default function Expenses() {
  const { S, admin, pid, run } = useApp();
  const [detail, setDetail] = useState(""), [amt, setAmt] = useState("");
  const add = async () => {
    if (!detail.trim() || !N(amt)) return alert("વિગત અને રકમ લખો");
    if (await run(() => api("expenses", "POST", { pid, detail: detail.trim(), amount: N(amt), date: today() }))) { setDetail(""); setAmt(""); }
  };
  const del = (id) => confirm("ખરેખર કાઢી નાખવું છે?") && run(() => api("expenses/" + id, "DELETE"));
  const l = S.exp.filter(inP(pid));
  return (<>
    <PSel />
    {admin && (pid !== "all" ? (
      <div className="card"><b>નવો ખર્ચ ઉમેરો</b>
        <div className="row">
          <input placeholder="શેના માટે ખર્ચ" value={detail} onChange={(e) => setDetail(e.target.value)} />
          <input type="number" placeholder="રકમ ₹" value={amt} onChange={(e) => setAmt(e.target.value)} />
          <button className="b p" onClick={add}>ઉમેરો</button>
        </div>
      </div>) : <div className="mu">ખર્ચ ઉમેરવા કાર્યક્રમ પસંદ કરો.</div>)}
    <div className="card">
      {l.map((x) => (
        <div className="li" key={x.id}>
          <span>💸 {x.detail} <span className="mu">{pname(S, x.pid)} • {x.date}</span></span>
          <span><b>{R(x.amount)}</b>{admin && <> <button className="b d" onClick={() => del(x.id)}>🗑</button></>}</span>
        </div>))}
      {!l.length && <div className="mu">હજી કોઈ ખર્ચ નથી</div>}
    </div>
    <div className="card"><b>કુલ ખર્ચ: {R(totals(S, pid).ex)}</b></div>
  </>);
}
