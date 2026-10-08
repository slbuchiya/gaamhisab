import * as CFG from "../config.js";
const RECEIPT_IMAGE = CFG.RECEIPT_IMAGE || "";
const RECEIPT_FIELDS = CFG.RECEIPT_FIELDS || {};
const STAMP_IMAGE = CFG.STAMP_IMAGE || "";
import { R, pname } from "../utils.js";
export default function Receipt({ o, S, onClose }) {
  const s = S.set;
  const amount = o.item ? o.item : R(o.amount);
  const v = { no: o.no, date: o.date, name: o.name, amount, program: pname(S, o.pid), pramukh: s.pramukh || "", khajanchi: s.khajanchi || "", gaam: s.gaam || "" };
  return (
    <div id="m" className="on">
      <div>
        {RECEIPT_IMAGE ? (
          <div className="rc tp"><div className="tpw"><img src={RECEIPT_IMAGE} alt="" />
            {Object.entries(RECEIPT_FIELDS).map(([k, f]) => k === "stamp" ? (STAMP_IMAGE && <img key={k} className="stampimg" src={STAMP_IMAGE} alt="" style={{ left: f.x + "%", top: f.y + "%", width: (f.width || 28) + "%" }} />) : <div key={k} className="tf" style={{ left: f.x + "%", top: f.y + "%", fontSize: (f.size || 3) + "cqw" }}>{v[k]}</div>)}
          </div></div>
        ) : (
          <div className="rc">
            <h3>{s.gaam || "ગામ"} – {s.mandal || "મંડળ"}</h3>
            <p style={{ textAlign: "center", marginTop: 2 }}><b>રસીદ</b></p>
            <p>રસીદ નં: <b>{o.no}</b> &nbsp; તારીખ: <b>{o.date}</b></p>
            <p>કાર્યક્રમ: <b>{v.program}</b></p>
            <p>શ્રી <b>{o.name}</b> પાસેથી {o.item ? <>વસ્તુ: <b>{o.item}</b></> : <>રૂ. <b>{amount}</b></>} સ્વીકાર્યા છે. આભાર 🙏</p>
            <div className="sg"><div className="sgb">{STAMP_IMAGE && <img className="stamp" src={STAMP_IMAGE} alt="" />}<div className="sgl">{s.pramukh || "પ્રમુખ"}<br />પ્રમુખ</div></div><div className="sgb"><div className="sgl">{s.khajanchi || "ખજાનચી"}<br />ખજાનચી</div></div></div>
          </div>
        )}
        <div className="row np" style={{ justifyContent: "center" }}>
          <button className="b p" onClick={() => window.print()}>🖨️ પ્રિન્ટ / PDF</button>
          <button className="b" onClick={onClose}>બંધ</button>
        </div>
      </div>
    </div>
  );
}
