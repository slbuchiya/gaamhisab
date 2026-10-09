import { useEffect, useState } from "react";
import { useApp } from "../ctx.js";
import { R, totals, pname, waLink, waPhone } from "../utils.js";

function useCount(to) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let f, st; const D = 900;
    const step = (t) => { st = st || t; const p = Math.min(1, (t - st) / D); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) f = requestAnimationFrame(step); };
    f = requestAnimationFrame(step);
    return () => cancelAnimationFrame(f);
  }, [to]);
  return v;
}
function Stat({ icon, label, value, money }) {
  const v = useCount(value);
  return <div className="hp-stat"><div className="hp-ic">{icon}</div><b>{money ? R(v) : v.toLocaleString("en-IN")}</b><span>{label}</span></div>;
}

export default function Home() {
  const { S, photos, setTab, setPid } = useApp();
  const [i, setI] = useState(0), [lb, setLb] = useState(-1);
  const slides = photos.slice(0, 8), n = slides.length, s = S.set;
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 4500);
    return () => clearInterval(t);
  }, [n]);

  const t = totals(S, "all");
  const cur = slides[Math.min(i, Math.max(n - 1, 0))];
  const cap = cur && (cur.caption || (cur.pid ? pname(S, cur.pid) : ""));

  const progs = [...S.prog].reverse().slice(0, 4).map((p) => {
    const pay = S.pay.filter((x) => x.pid === p.id);
    return { ...p, got: pay.reduce((a, x) => a + (Number(x.amount) || 0), 0), cnt: pay.length, pct: S.mem.length ? Math.min(100, Math.round((pay.length * 100) / S.mem.length)) : 0 };
  });
  const people = [["પ્રમુખ", s.pramukh, s.pramukhPhone], ["ખજાનચી", s.khajanchi, s.khajanchiPhone], ["મંત્રી", s.mantri, s.mantriPhone]].filter((x) => x[1]);
  const donors = [...S.don].reverse().slice(0, 6);
  const gal = photos.slice(0, 12);
  const openProg = (id) => { setPid(id); setTab("ug"); };
  const lbGo = (d) => setLb((x) => (x + d + gal.length) % gal.length);

  return (<>
    <section className="hp-hero">
      {n ? slides.map((p, k) => <img key={p.id} src={p.data} alt="" className={"hp-slide" + (k === i ? " on" : "")} />) : <div className="hp-bg" />}
      <div className="hp-shade" />
      <div className="hp-txt">
        <div className="hp-kicker">🙏 સ્વાગત છે</div>
        <h2>{s.mandal || "ગામ ફંડ હિસાબ"}</h2>
        {s.gaam && <p>📍 {s.gaam}</p>}
        <div className="hp-cta">
          <button className="b hp-ghost" onClick={() => setTab("contact")}>📞 સંપર્ક</button>
        </div>
      </div>
      {cap && <div className="hp-cap">📸 {cap}</div>}
      {n > 1 && <div className="hp-dots">{slides.map((p, k) => <i key={p.id} className={k === i ? "on" : ""} onClick={() => setI(k)} />)}</div>}
    </section>

    <div className="hp-stats">
      <Stat icon="🏠" label="કુલ ઘર" value={S.mem.length} />
      <Stat icon="📅" label="કાર્યક્રમ" value={S.prog.length} />
      <Stat icon="💰" label="કુલ આવક" value={t.inc} money />
      <Stat icon="🧾" label="કુલ ખર્ચ" value={t.ex} money />
    </div>

    <div className="card hp-about">
      <div className="hp-h">અમારા વિશે</div>
      <p>{s.mandal || "અમારું મંડળ"}{s.gaam ? `, ${s.gaam}` : ""} દ્વારા ગામના દરેક કાર્યક્રમની ઉઘરાણી, દાન અને ખર્ચનો હિસાબ પારદર્શક રીતે અહીં રજૂ કરવામાં આવે છે. દરેક ઘર પોતાની ઉઘરાણીની રસીદ અહીંથી જોઈ અને પ્રિન્ટ કરી શકે છે.</p>
    </div>

    {progs.length > 0 && <>
      <div className="hp-h">📅 તાજેતરના કાર્યક્રમ</div>
      <div className="hp-progs">
        {progs.map((p) => (
          <div className="card hp-prog" key={p.id}>
            <b>{p.name}</b>
            <div className="mu">{R(p.got)} એકત્ર • {p.cnt}/{S.mem.length} ઘર</div>
            <div className="bar"><i style={{ width: p.pct + "%" }} /></div>
            <div className="row" style={{ justifyContent: "space-between" }}><span className="mu">{p.pct}% પૂર્ણ</span><button className="b" onClick={() => openProg(p.id)}>વિગત જુઓ</button></div>
          </div>))}
      </div>
    </>}

    {gal.length > 0 && <>
      <div className="hp-h">🖼 ફોટો ગેલેરી</div>
      <div className="hp-gal">{gal.map((p, k) => <img key={p.id} src={p.data} alt={p.caption || ""} onClick={() => setLb(k)} />)}</div>
    </>}

    {donors.length > 0 && <>
      <div className="hp-h">🙏 દાતાઓનો આભાર</div>
      <div className="card">
        {donors.map((d) => (
          <div className="li" key={d.id}><span>🎁 <b>{d.donor}</b> <span className="mu">{pname(S, d.pid)}</span></span><b className="ok">{d.kind === "cash" ? R(d.amount) : d.item}</b></div>))}
      </div>
    </>}

    {people.length > 0 && <>
      <div className="hp-h">👥 મંડળના હોદ્દેદારો</div>
      <div className="hp-team">
        {people.map(([role, name, ph]) => (
          <div className="card hp-person" key={role}>
            <div className="hp-av">{[...name][0]}</div>
            <b>{name}</b><span className="mu">{role}</span>
            {waPhone(ph) && <div className="row" style={{ justifyContent: "center" }}><a className="b" href={`tel:+${waPhone(ph)}`}>📞</a><a className="b" href={waLink(ph)} target="_blank" rel="noreferrer">💬</a></div>}
          </div>))}
      </div>
    </>}

    <div className="card hp-end">
      <b>કંઈ પૂછવું છે? અમારો સંપર્ક કરો</b>
      <button className="b p" onClick={() => setTab("contact")}>📞 સંપર્ક પેજ</button>
    </div>

    {lb >= 0 && gal[lb] && (
      <div className="lb" onClick={() => setLb(-1)}>
        <img src={gal[lb].data} alt="" onClick={(e) => e.stopPropagation()} />
        {(gal[lb].caption || gal[lb].pid) && <div className="lbc">{gal[lb].caption || pname(S, gal[lb].pid)}</div>}
        <button className="hnav l" onClick={(e) => { e.stopPropagation(); lbGo(-1); }}>‹</button>
        <button className="hnav r" onClick={(e) => { e.stopPropagation(); lbGo(1); }}>›</button>
        <button className="lbx" onClick={() => setLb(-1)}>✕</button>
      </div>)}
  </>);
}
