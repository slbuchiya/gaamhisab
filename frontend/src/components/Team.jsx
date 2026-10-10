import { useState } from "react";
import "./team.css";
import { useApp } from "../ctx.js";
import { api } from "../api.js";
import { ROLES, fileToAvatar } from "../utils.js";
import MemberCard from "./MemberCard.jsx";

const TIERS = [
  ["નેતૃત્વ", ["પ્રમુખ", "ઉપ પ્રમુખ"], "lg"],
  ["પદાધિકારીઓ", ["ખજાનચી", "સહ ખજાનચી", "મહામંત્રી", "મંત્રી"], "md"],
  ["સલાહકાર અને કારોબારી સભ્યો", ["સલાહકાર", "કારોબારી સભ્ય"], "sm"],
];

export default function Team() {
  const { S, team, admin, loadTeam } = useApp();
  const [role, setRole] = useState(ROLES[0]), [name, setName] = useState(""), [phone, setPhone] = useState(""), [photo, setPhoto] = useState(""), [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const f = e.target.files[0]; e.target.value = "";
    if (!f) return;
    try { setPhoto(await fileToAvatar(f)); } catch (er) { alert(er.message); }
  };
  const add = async () => {
    if (!name.trim()) return alert("નામ લખો");
    setBusy(true);
    try { await api("team", "POST", { role, name: name.trim(), phone: phone.trim(), photo }); setName(""); setPhone(""); setPhoto(""); await loadTeam(); }
    catch (e) { alert("ભૂલ: " + e.message); }
    setBusy(false);
  };
  const edit = async (m, patch) => { try { await api("team/" + m.id, "PUT", patch); await loadTeam(); } catch (e) { alert(e.message); } };
  const del = async (m) => { if (!confirm(`"${m.name}" ને સમિતિમાંથી કાઢવા છે?`)) return; try { await api("team/" + m.id, "DELETE"); await loadTeam(); } catch (e) { alert(e.message); } };
  const rename = (m) => { const n = prompt("નામ", m.name); if (n && n.trim()) edit(m, { name: n.trim() }); };
  const rphone = (m) => { const v = prompt("મોબાઇલ નંબર", m.phone || ""); if (v !== null) edit(m, { phone: v.trim() }); };
  const rphoto = async (m, e) => { const f = e.target.files[0]; e.target.value = ""; if (!f) return; try { edit(m, { photo: await fileToAvatar(f) }); } catch (er) { alert(er.message); } };

  return (<>
    <div className="tm-head">
      <h2>👥 આપણી સમિતિ</h2>
      <p>{S.set.mandal || "મંડળ"} ના પદાધિકારીઓ અને સભ્યો</p>
    </div>

    {admin && (
      <div className="card"><b>➕ સમિતિમાં નવા સભ્ય ઉમેરો</b>
        <div className="row">
          <select value={role} onChange={(e) => setRole(e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
          <input placeholder="નામ" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="મોબાઇલ (વૈકલ્પિક)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="row">
          <input type="file" accept="image/*" onChange={pick} />
          {photo && <img src={photo} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} />}
          <button className="b p" disabled={busy} onClick={add}>{busy ? "સેવ થાય છે…" : "ઉમેરો"}</button>
        </div>
      </div>
    )}

    {!team.length && <div className="tm-empty"><div style={{ fontSize: 40 }}>👥</div>હજી સમિતિની માહિતી ઉમેરાઈ નથી.</div>}

    {TIERS.map(([title, roles, size]) => {
      const list = team.filter((x) => roles.includes(x.role)).sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role));
      if (!list.length) return null;
      return (
        <section key={title}>
          <div className="tm-tier"><span>{title}</span></div>
          <div className="tm-grid">
            {list.map((m) => (
              <MemberCard key={m.id} m={m} size={size}>
                {admin && (
                  <div className="tm-adm">
                    <select value={m.role} onChange={(e) => edit(m, { role: e.target.value })}>{ROLES.map((x) => <option key={x}>{x}</option>)}</select>
                    <div className="row" style={{ justifyContent: "center" }}>
                      <button className="b" onClick={() => rename(m)}>✏️</button>
                      <button className="b" onClick={() => rphone(m)}>📱</button>
                      <label className="b" style={{ cursor: "pointer" }}>📷<input type="file" accept="image/*" hidden onChange={(e) => rphoto(m, e)} /></label>
                      <button className="b d" onClick={() => del(m)}>🗑</button>
                    </div>
                  </div>
                )}
              </MemberCard>
            ))}
          </div>
        </section>
      );
    })}
  </>);
}
