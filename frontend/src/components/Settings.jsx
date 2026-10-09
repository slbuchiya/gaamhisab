import { useState } from "react";
import { useApp } from "../ctx.js";
import { api } from "../api.js";
const F = [
  ["mandal", "મંડળનું નામ"], ["gaam", "ગામનું નામ"],
  ["pramukh", "પ્રમુખનું નામ"], ["pramukhPhone", "પ્રમુખનો મોબાઇલ"],
  ["khajanchi", "ખજાનચીનું નામ"], ["khajanchiPhone", "ખજાનચીનો મોબાઇલ"],
  ["mantri", "મંત્રીનું નામ"], ["mantriPhone", "મંત્રીનો મોબાઇલ"],
  ["phone", "મંડળનો મુખ્ય WhatsApp નંબર (સંપર્ક પેજ માટે)"], ["email", "ઈમેલ"], ["address", "સરનામું"],
];
function Form({ init }) {
  const { run } = useApp();
  const [f, setF] = useState(Object.fromEntries(F.map(([k]) => [k, init[k] || ""])));
  const save = async () => { if (await run(() => api("settings", "PUT", f))) alert("સચવાઈ ગયું ✅"); };
  return (
    <div className="card"><b>સેટિંગ (રસીદ અને સંપર્ક પેજ માટે)</b>
      {F.map(([k, label]) => <div className="row" key={k}><input style={{ width: "100%" }} placeholder={label} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>)}
      <button className="b p" onClick={save}>સાચવો</button>
    </div>
  );
}
export default function Settings() { const { S } = useApp(); return <Form key={JSON.stringify(S.set)} init={S.set} />; }
