import { useState } from "react";
import { useApp } from "../ctx.js";
import { api } from "../api.js";
function Form({ init }) {
  const { run } = useApp();
  const [f, setF] = useState({ gaam: init.gaam || "", mandal: init.mandal || "", pramukh: init.pramukh || "", khajanchi: init.khajanchi || "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => { if (await run(() => api("settings", "PUT", f))) alert("સચવાઈ ગયું ✅"); };
  return (
    <div className="card"><b>સેટિંગ (રસીદ માટે)</b>
      <div className="row"><input placeholder="ગામનું નામ" value={f.gaam} onChange={set("gaam")} /></div>
      <div className="row"><input placeholder="મંડળનું નામ" value={f.mandal} onChange={set("mandal")} /></div>
      <div className="row"><input placeholder="પ્રમુખનું નામ" value={f.pramukh} onChange={set("pramukh")} /></div>
      <div className="row"><input placeholder="ખજાનચીનું નામ" value={f.khajanchi} onChange={set("khajanchi")} /></div>
      <button className="b p" onClick={save}>સાચવો</button>
    </div>
  );
}
export default function Settings() { const { S } = useApp(); return <Form key={JSON.stringify(S.set)} init={S.set} />; }
