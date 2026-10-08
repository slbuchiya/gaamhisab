import { useState } from "react";
import { useApp } from "../ctx.js";
import { api } from "../api.js";
import { R, N, pname, inP } from "../utils.js";
import PSel from "./PSel.jsx";
export default function Donations() {
  const { S, admin, pid, run, showRc } = useApp();
  const [donor, setDonor] = useState(""), [kind, setKind] = useState("cash"), [v, setV] = useState("");
  const add = async () => {
    if (!donor.trim() || !v.trim()) return alert("નામ અને રકમ/વસ્તુ લખો");
    const d = { pid, donor: donor.trim(), kind };
    if (kind === "cash") d.amount = N(v); else d.item = v.trim();
    if (await run(() => api("donations", "POST", d))) { setDonor(""); setV(""); }
  };
  const del = (id) => confirm("ખરેખર કાઢી નાખવું છે?") && run(() => api("donations/" + id, "DELETE"));
  return (<>
    <PSel />
    {admin && (pid !== "all" ? (
      <div className="card"><b>નવું દાન ઉમેરો</b>
        <div className="row">
          <input placeholder="દાતાનું નામ" value={donor} onChange={(e) => setDonor(e.target.value)} />
          <select value={kind} onChange={(e) => setKind(e.target.value)}><option value="cash">રોકડ</option><option value="item">વસ્તુ</option></select>
          <input placeholder={kind === "cash" ? "રકમ ₹" : "વસ્તુનું નામ"} value={v} onChange={(e) => setV(e.target.value)} />
          <button className="b p" onClick={add}>ઉમેરો</button>
        </div>
      </div>) : <div className="mu">દાન ઉમેરવા કાર્યક્રમ પસંદ કરો.</div>)}
    <div className="card">
      {S.don.filter(inP(pid)).map((x) => (
        <div className="li" key={x.id}>
          <span>🎁 {x.donor} – {x.kind === "cash" ? R(x.amount) : x.item} <span className="mu">{pname(S, x.pid)} • {x.date}</span></span>
          <span><button className="b" onClick={() => showRc({ ...x, name: x.donor })}>🧾</button>{admin && <> <button className="b d" onClick={() => del(x.id)}>🗑</button></>}</span>
        </div>))}
      {!S.don.filter(inP(pid)).length && <div className="mu">હજી કોઈ દાન નથી</div>}
    </div>
  </>);
}
