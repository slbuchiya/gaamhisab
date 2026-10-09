import { useState } from "react";
import { useApp } from "../ctx.js";
import { waLink, waPhone } from "../utils.js";

export default function Contact() {
  const { S } = useApp();
  const s = S.set;
  const [nm, setNm] = useState("");
  const [msg, setMsg] = useState("");

  // તમારું સરનામું
  const fixedAddress = "48PW+F36, Vadva Kanyavala, Gujarat 370445";
  
  // તમે મોકલેલી શ્રી બાબા રામદેવપીર મંદિરની સચોટ ગૂગલ મેપ લિંક
  const mapLink = "https://www.google.com/maps/place/Shree+Baba+Ramdevpir+Mandir+Vadvakanya/@23.1361725,69.3425682,17z/data=!3m1!4b1!4m6!3m5!1s0x395115999084ae27:0x3d92731822f0381b!8m2!3d23.1361725!4d69.3451431!16s%2Fg%2F11hbbzlmjx";

  const people = [
    ["પ્રમુખ", s?.pramukh, s?.pramukhPhone],
    ["ખજાનચી", s?.khajanchi, s?.khajanchiPhone],
    ["મંત્રી", s?.mantri, s?.mantriPhone]
  ].filter((x) => x || x);

  const main = s?.phone;

  const send = () => {
    if (!waPhone(main)) return alert("મંડળનો WhatsApp નંબર હજી ઉમેરાયો નથી");
    if (!msg.trim()) return alert("સંદેશ લખો");
    window.open(waLink(main, `${nm.trim() ? "નામ: " + nm.trim() + "\n" : ""}${msg.trim()}`), "_blank");
  };

  const Btns = ({ ph }) => waPhone(ph) ? (<span><a className="b" href={`tel:+${waPhone(ph)}`}>📞</a> <a className="b" href={waLink(ph)} target="_blank" rel="noreferrer">💬</a></span>) : null;

  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>📞 અમારો સંપર્ક કરો</h2>
        <div><b>{s?.mandal || "મંડળ"}</b>{s?.gaam ? ` – ${s.gaam}` : ""}</div>
        
        <div className="li">
          <span>📍 {fixedAddress}</span>
          {/* હવે અહીં સચોટ મંદિરની લિંક ઓપન થશે */}
          <a 
            className="b" 
            target="_blank" 
            rel="noreferrer" 
            href={mapLink}
          >
            નકશો
          </a>
        </div>

        {main && <div className="li"><span>📱 {main}</span><Btns ph={main} /></div>}
        {s?.email && <div className="li"><span>✉️ {s.email}</span><a className="b" href={`mailto:${s.email}`}>મેઇલ</a></div>}
      </div>

      {people.length > 0 && (
        <div className="card">
          <b>મંડળના હોદ્દેદારો</b> 
          {people.map(([r, n, ph]) => (
            <div className="li" key={r}>
              <span>👤 {r}: <b>{n || "—"}</b> {ph && <span className="mu">{ph}</span>}</span>
              <Btns ph={ph} />
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <b>💬 WhatsApp પર સંદેશ મોકલો</b>
        <div className="row"><input placeholder="તમારું નામ" value={nm} onChange={(e) => setNm(e.target.value)} /></div>
        <div className="row">
          <textarea 
            rows={3} 
            placeholder="તમારો સંદેશ…" 
            style={{ width: "100%", font: "inherit", background: "var(--bg)", color: "var(--tx)", border: "1px solid var(--bd)", borderRadius: 8, padding: 8 }} 
            value={msg} 
            onChange={(e) => setMsg(e.target.value)} 
          />
        </div>
        <button className="b p" onClick={send}>WhatsApp પર મોકલો</button>
      </div>
    </>
  );
}
