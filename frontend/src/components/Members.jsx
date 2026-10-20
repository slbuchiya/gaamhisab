import { useState } from "react";
import "./members.css";
import { useApp } from "../ctx.js";
import { api } from "../api.js";
const parse = (line) => {
  const m = line.match(/^(.*?)[,\t]\s*(\+?[\d][\d\s-]{6,})$/);
  return m ? { name: m[1].trim(), phone: m[2].replace(/[\s-]/g, "") } : { name: line.trim() };
};
const PICK = "__pick";
export default function Members() {
  const { S, run } = useApp();
  const fam = S.fam || [];
  const famName = Object.fromEntries(fam.map((x) => [x.id, x.name]));
  const fidOf = (m) => (famName[m.fid] ? m.fid : ""); // કાઢેલા કુટુંબવાળા = કુટુંબ વગર
  const cnt = (id) => S.mem.filter((m) => fidOf(m) === id).length;

  const [name, setName] = useState(""), [phone, setPhone] = useState(""), [bulk, setBulk] = useState("");
  const [addFid, setAddFid] = useState(""), [fname, setFname] = useState("");
  const [f, setF] = useState("all"), [q, setQ] = useState(""), [sel, setSel] = useState(new Set()), [target, setTarget] = useState(PICK);

  // ---- કુટુંબ (6-7 મોટા જૂથ) ----
  const addFam = async () => { if (fname.trim() && await run(() => api("families", "POST", { name: fname.trim() }))) setFname(""); };
  const renFam = (x) => { const v = prompt("કુટુંબનું નવું નામ", x.name); if (v && v.trim() && v.trim() !== x.name) run(() => api("families/" + x.id, "PUT", { name: v.trim() })); };
  const delFam = (x) => confirm(`"${x.name}" કુટુંબ કાઢવું છે?\n(તેના ${cnt(x.id)} ઘર કાઢી નહીં નાખીએ, ફક્ત "કુટુંબ વગર" થઈ જશે)`) && run(async () => { await api("families/" + x.id, "DELETE"); if (f === x.id) setF("all"); });

  // ---- ઘર ----
  const add = async () => {
    if (name.trim() && await run(() => api("members", "POST", { name: name.trim(), phone: phone.trim(), fid: addFid }))) { setName(""); setPhone(""); }
  };
  const addBulk = async () => {
    const rows = bulk.split("\n").map((s) => s.trim()).filter(Boolean).map(parse).filter((r) => r.name).map((r) => ({ ...r, fid: addFid }));
    if (rows.length && await run(() => api("members", "POST", rows))) setBulk("");
  };
  const del = (m) => confirm(`"${m.name}" કાઢવું છે?`) && run(() => api("members/" + m.id, "DELETE"));
  const setPh = (m) => { const v = prompt(`"${m.name}" નો મોબાઇલ નંબર (WhatsApp)`, m.phone || ""); if (v !== null) run(() => api("members/" + m.id, "PUT", { phone: v.trim() })); };
  const assign = (ids, fid) => run(() => api("assign", "PUT", { ids, fid }));

  const shown = [...S.mem]
    .filter((m) => (f === "all" ? true : f === "none" ? !fidOf(m) : fidOf(m) === f))
    .filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "gu"));
  const allOn = shown.length > 0 && shown.every((m) => sel.has(m.id));
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSel(allOn ? new Set() : new Set(shown.map((m) => m.id)));
  const moveSel = async () => {
    if (!sel.size) return alert("પહેલા ઘર પસંદ કરો");
    if (target === PICK) return alert("કયા કુટુંબમાં મોકલવા છે તે પસંદ કરો");
    if (await assign([...sel], target)) setSel(new Set());
  };
  const withPh = S.mem.filter((m) => m.phone).length;
  const FamSelect = ({ value, onChange, first }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {first && <option value={PICK}>{first}</option>}
      <option value="">કુટુંબ વગર</option>
      {fam.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
    </select>
  );

  return (<>
    <div className="card"><b>👨‍👩‍👧‍👦 કુટુંબ (જૂથ) બનાવો</b>
      <div className="mu">ગામના મોટા કુટુંબો, દા.ત. "બુચિયા પરિવાર", "પટેલ પરિવાર". પછી નીચે ઘરોને તેમાં વહેંચો.</div>
      <div className="row">
        <input placeholder="કુટુંબનું નામ" value={fname} onChange={(e) => setFname(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFam()} />
        <button className="b p" onClick={addFam}>કુટુંબ ઉમેરો</button>
      </div>
      {fam.map((x) => (
        <div className="fm-fam" key={x.id}>
          <span>👨‍👩‍👧‍👦 <b>{x.name}</b> <span className="mu">• {cnt(x.id)} ઘર</span></span>
          <span><button className="b" onClick={() => renFam(x)}>✏️ નામ</button> <button className="b d" onClick={() => delFam(x)}>🗑</button></span>
        </div>))}
      {!fam.length && <div className="mu" style={{ marginTop: 6 }}>હજી કોઈ કુટુંબ બનાવ્યું નથી.</div>}
    </div>

    <div className="card"><b>નવું ઘર / નામ ઉમેરો</b>
      <div className="row">
        <input placeholder="ઘરના મુખ્ય વ્યક્તિનું નામ" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="મોબાઇલ નંબર (WhatsApp)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <FamSelect value={addFid} onChange={setAddFid} />
        <button className="b p" onClick={add}>ઉમેરો</button>
      </div>
    </div>

    <div className="card"><b>કુલ ઘર: {S.mem.length}</b> <span className="mu">• નંબર સેવ: {withPh} • કુટુંબ વગર: {S.mem.filter((m) => !fidOf(m)).length}</span>
      <div className="fm-chips">
        <button className={"b" + (f === "all" ? " p" : "")} onClick={() => setF("all")}>બધા ({S.mem.length})</button>
        {fam.map((x) => <button key={x.id} className={"b" + (f === x.id ? " p" : "")} onClick={() => setF(x.id)}>{x.name} ({cnt(x.id)})</button>)}
        <button className={"b" + (f === "none" ? " p" : "")} onClick={() => setF("none")}>કુટુંબ વગર ({S.mem.filter((m) => !fidOf(m)).length})</button>
      </div>
      <div className="row">
        <input style={{ flex: 1 }} placeholder="🔍 નામ શોધો" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="mu"><input type="checkbox" checked={allOn} onChange={toggleAll} /> બધા પસંદ ({shown.length})</label>
      </div>

      {sel.size > 0 && (
        <div className="fm-bar">
          <b>✅ {sel.size} ઘર પસંદ</b>
          <div className="row">
            <FamSelect value={target} onChange={setTarget} first="— કયા કુટુંબમાં? —" />
            <button className="b p" onClick={moveSel}>આમાં મોકલો</button>
            <button className="b" onClick={() => setSel(new Set())}>રદ</button>
          </div>
        </div>)}

      {shown.map((m) => (
        <div className="li" key={m.id}>
          <div className="fm-row" style={{ width: "100%" }}>
            <input type="checkbox" checked={sel.has(m.id)} onChange={() => toggle(m.id)} />
            <span className="nm">🏠 {m.name} {fidOf(m) && f === "all" && <span className="fm-tag">{famName[m.fid]}</span>}
              <div>{m.phone ? <span className="mu">📱 {m.phone}</span> : <span className="mu">(નંબર નથી)</span>}</div>
            </span>
            <select value={fidOf(m)} onChange={(e) => assign([m.id], e.target.value)} title="કુટુંબ બદલો">
              <option value="">કુટુંબ વગર</option>
              {fam.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <button className="b" onClick={() => setPh(m)}>📱</button> <button className="b d" onClick={() => del(m)}>🗑</button>
          </div>
        </div>))}
      {!shown.length && <div className="mu" style={{ padding: "10px 0" }}>આ યાદીમાં કોઈ ઘર નથી.</div>}
    </div>

    <div className="card"><b>આખી યાદી એકસાથે ઉમેરો</b>
      <div className="mu">દરેક નામ નવી લાઈનમાં. નંબર સાથે: <b>નામ, 9876543210</b> • ઉપર "નવું ઘર" માં પસંદ કરેલ કુટુંબમાં બધા ઉમેરાશે.</div>
      <div className="row"><span className="mu">કુટુંબ:</span><FamSelect value={addFid} onChange={setAddFid} /></div>
      <textarea rows={5} style={{ width: "100%", font: "inherit", background: "var(--bg)", color: "var(--tx)", border: "1px solid var(--bd)", borderRadius: 8 }} value={bulk} onChange={(e) => setBulk(e.target.value)} />
      <button className="b p" onClick={addBulk}>બધા ઉમેરો</button>
    </div>
  </>);
}
