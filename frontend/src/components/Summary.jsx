import { useApp } from "../ctx.js";
import { R, totals, inP } from "../utils.js";
import PSel from "./PSel.jsx";
export default function Summary() {
  const { S, pid } = useApp();
  const t = totals(S, pid), paid = S.pay.filter(inP(pid)).length;
  const pct = S.mem.length ? Math.min(100, Math.round((paid * 100) / S.mem.length)) : 0;
  return (<>
    <PSel />
    <div className="g">
      <div className="s">આવક<b className="ok">{R(t.inc)}</b></div>
      <div className="s">કુલ ખર્ચ<b style={{ color: "var(--bad)" }}>{R(t.ex)}</b></div>
      <div className="s">બાકી રકમ<b>{R(t.bal)}</b></div>
    </div>
    {pid !== "all" && <div className="card"><div className="mu">ઉઘરાણી પ્રગતિ: {pct}%</div><div className="bar"><i style={{ width: pct + "%" }} /></div></div>}
    <div className="card mu">ઉઘરાણી: {R(t.ug)} • રોકડ દાન: {R(t.dc)} • ભરનાર ઘર: {paid}/{S.mem.length}</div>
  </>);
}
