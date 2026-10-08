import { useState } from "react";
import { useApp } from "../ctx.js";
import { api } from "../api.js";
export default function Members() {
  const { S, run } = useApp();
  const [name, setName] = useState(""), [bulk, setBulk] = useState("");
  const add = async () => { if (name.trim() && await run(() => api("members", "POST", { name: name.trim() }))) setName(""); };
  const addBulk = async () => {
    const names = bulk.split("\n").map((s) => s.trim()).filter(Boolean);
    if (names.length && await run(() => api("members", "POST", names.map((n) => ({ name: n }))))) setBulk("");
  };
  const del = (m) => confirm(`"${m.name}" કાઢવું છે?`) && run(() => api("members/" + m.id, "DELETE"));
  return (<>
    <div className="card"><b>નવું ઘર / નામ ઉમેરો</b>
      <div className="row"><input placeholder="ઘરના મુખ્ય વ્યક્તિનું નામ" value={name} onChange={(e) => setName(e.target.value)} /><button className="b p" onClick={add}>ઉમેરો</button></div>
    </div>
    <div className="card"><b>કુલ ઘર: {S.mem.length}</b>
      {[...S.mem].sort((a, b) => a.name.localeCompare(b.name, "gu")).map((m) => (
        <div className="li" key={m.id}><span>🏠 {m.name}</span><button className="b d" onClick={() => del(m)}>🗑 કાઢો</button></div>))}
    </div>
    <div className="card"><b>આખી યાદી એકસાથે ઉમેરો</b><div className="mu">દરેક નામ નવી લાઈનમાં લખો/પેસ્ટ કરો</div>
      <textarea rows={5} style={{ width: "100%", font: "inherit", background: "var(--bg)", color: "var(--tx)", border: "1px solid var(--bd)", borderRadius: 8 }} value={bulk} onChange={(e) => setBulk(e.target.value)} />
      <button className="b p" onClick={addBulk}>બધા ઉમેરો</button>
    </div>
  </>);
}
