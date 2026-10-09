import { useState } from "react";
import { useApp } from "../ctx.js";
import { api } from "../api.js";
const parse = (line) => {
  const m = line.match(/^(.*?)[,\t]\s*(\+?[\d][\d\s-]{6,})$/);
  return m ? { name: m[1].trim(), phone: m[2].replace(/[\s-]/g, "") } : { name: line.trim() };
};
export default function Members() {
  const { S, run } = useApp();
  const [name, setName] = useState(""), [phone, setPhone] = useState(""), [bulk, setBulk] = useState("");
  const add = async () => { if (name.trim() && await run(() => api("members", "POST", { name: name.trim(), phone: phone.trim() }))) { setName(""); setPhone(""); } };
  const addBulk = async () => {
    const rows = bulk.split("\n").map((s) => s.trim()).filter(Boolean).map(parse).filter((r) => r.name);
    if (rows.length && await run(() => api("members", "POST", rows))) setBulk("");
  };
  const del = (m) => confirm(`"${m.name}" કાઢવું છે?`) && run(() => api("members/" + m.id, "DELETE"));
  const setPh = (m) => { const v = prompt(`"${m.name}" નો મોબાઇલ નંબર (WhatsApp)`, m.phone || ""); if (v !== null) run(() => api("members/" + m.id, "PUT", { phone: v.trim() })); };
  const withPh = S.mem.filter((m) => m.phone).length;
  return (<>
    <div className="card"><b>નવું ઘર / નામ ઉમેરો</b>
      <div className="row">
        <input placeholder="ઘરના મુખ્ય વ્યક્તિનું નામ" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="મોબાઇલ નંબર (WhatsApp)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button className="b p" onClick={add}>ઉમેરો</button>
      </div>
    </div>
    <div className="card"><b>કુલ ઘર: {S.mem.length}</b> <span className="mu">• નંબર સેવ: {withPh}</span>
      {[...S.mem].sort((a, b) => a.name.localeCompare(b.name, "gu")).map((m) => (
        <div className="li" key={m.id}>
          <span>🏠 {m.name} {m.phone ? <span className="mu">📱 {m.phone}</span> : <span className="mu">(નંબર નથી)</span>}</span>
          <span><button className="b" onClick={() => setPh(m)}>📱 નંબર</button> <button className="b d" onClick={() => del(m)}>🗑</button></span>
        </div>))}
    </div>
    <div className="card"><b>આખી યાદી એકસાથે ઉમેરો</b>
      <div className="mu">દરેક નામ નવી લાઈનમાં. નંબર સાથે: <b>નામ, 9876543210</b></div>
      <textarea rows={5} style={{ width: "100%", font: "inherit", background: "var(--bg)", color: "var(--tx)", border: "1px solid var(--bd)", borderRadius: 8 }} value={bulk} onChange={(e) => setBulk(e.target.value)} />
      <button className="b p" onClick={addBulk}>બધા ઉમેરો</button>
    </div>
  </>);
}
