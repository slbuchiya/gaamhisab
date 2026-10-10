import { useEffect, useState } from "react";
import { useApp } from "../ctx.js";
import MemberCard from "./MemberCard.jsx";
import "./home.css";
import { R, totals, pname, waLink, waPhone, ROLES } from "../utils.js";

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
  const { S, photos, setTab, setPid, team } = useApp();
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
  const top = [...team].sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role)).slice(0, 8);
  const donors = [...S.don].reverse().slice(0, 6);
  const gal = photos.slice(0, 12);
  const openProg = (id) => { setPid(id); setTab("ug"); };
  const lbGo = (d) => setLb((x) => (x + d + gal.length) % gal.length);

  return (<>
    <section className="hp-hero2">
      <div className="hp-title">
        <div className="hp-kicker">🙏 સ્વાગત છે</div>
        <h2>{s.mandal || "ગામ ફંડ હિસાબ"}</h2>
        {s.gaam && <p>📍 {s.gaam}</p>}
      </div>
      {n ? (
        <div className="hp-frame">
          {slides.map((p, k) => (
            <div key={p.id} className={"hp-s" + (k === i ? " on" : "")}>
              <img className="bgi" src={p.data} alt="" aria-hidden="true" />
              <img className="fg" src={p.data} alt={p.caption || ""} />
            </div>
          ))}
          {n > 1 && <>
            <button className="hp-nav l" onClick={() => setI((x) => (x - 1 + n) % n)} aria-label="પાછળ">‹</button>
            <button className="hp-nav r" onClick={() => setI((x) => (x + 1) % n)} aria-label="આગળ">›</button>
          </>}
        </div>
      ) : (
        <div className="hp-frame0"><div style={{ fontSize: 44 }}>🙏</div><span>કાર્યક્રમના ફોટા અહીં સ્લાઇડ થશે</span></div>
      )}
      {(cap || n > 1) && (
        <div className="hp-bar">
          {cap && <div className="hp-capt">📸 {cap}</div>}
          {n > 1 && <div className="hp-dots2">{slides.map((p, k) => <i key={p.id} className={k === i ? "on" : ""} onClick={() => setI(k)} />)}</div>}
        </div>
      )}
    </section>

    <div className="hp-stats">
      <Stat icon="🏠" label="કુલ ઘર" value={S.mem.length} />
      <Stat icon="📅" label="કાર્યક્રમ" value={S.prog.length} />
      <Stat icon="💰" label="કુલ આવક" value={t.inc} money />
      <Stat icon="🧾" label="કુલ ખર્ચ" value={t.ex} money />
    </div>

    <div className="card hp-about">
      <div className="hp-h">અમારા વિશે</div>
      <p>{s.mandal || "અમારું મંડળ"}{s.gaam ? `, ${s.gaam}` : ""} આ મંડળ/સમિતિ ગામના લોકો દ્વારા, ગામના લોકો માટે અને ગામના હિત અર્થે બનાવવામાં આવી છે. ગામમાં એકતા જળવાઈ રહે, ધાર્મિક અને સામાજિક પ્રસંગો દીપી ઊઠે અને વિકાસ કાર્યો અવિરત ચાલતા રહે તે માટે સમિતિના તમામ સભ્યો નિસ્વાર્થ ભાવે કાર્ય કરે છે. ગામના દરેક નાગરિકનો વિશ્વાસ અને સહકાર એ જ અમારી મૂડી છે..</p>
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

    {(top.length > 0 || people.length > 0) && <>
      <div className="hp-h">👥 મંડળના હોદ્દેદારો</div>
      <div className="tm-grid">
        {top.length > 0
          ? top.map((m) => <MemberCard key={m.id} m={m} size="sm" />)
          : people.map(([role, name, ph]) => <MemberCard key={role} m={{ name, role, phone: ph, photo: "" }} size="sm" />)}
      </div>
      <div style={{ textAlign: "center", marginTop: 10 }}><button className="b" onClick={() => setTab("team")}>👥 આખી સમિતિ જુઓ</button></div>
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
