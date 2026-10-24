import { useState } from "react";
import { useApp } from "../ctx.js";
import { api } from "../api.js";
const F = [
  ["mandal", "મંડળનું નામ"], ["gaam", "ગામનું નામ"],
  ["pramukh", "પ્રમુખનું નામ"], ["pramukhPhone", "પ્રમુખનો મોબાઇલ"],
  ["khajanchi", "ખજાનચીનું નામ"], ["khajanchiPhone", "ખજાનચીનો મોબાઇલ"],
  ["mantri", "મંત્રીનું નામ"], ["mantriPhone", "મંત્રીનો મોબાઇલ"],
  ["openBal", "જૂની બચત ₹ (અગાઉના હિસાબની શરૂઆતની રકમ)"], ["openNote", "જૂની બચત વિશે નોંધ (દા.ત. 31-03-2026 સુધીની)"],
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
function Backup() {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      const d = await api("backup");
      const url = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = `gaam-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert(e.message); }
    setBusy(false);
  };
  return (
    <div className="card"><b>💾 ડેટાનો બેકઅપ</b>
      <div className="mu">આખો ડેટા (ઘર, ઉઘરાણી, દાન, ખર્ચ, ફોટા) એક ફાઇલમાં સેવ થશે. અઠવાડિયે એકવાર લેવો અને કમ્પ્યુટર/ડ્રાઇવમાં સાચવવો.</div>
      <button className="b p" disabled={busy} onClick={go}>{busy ? "તૈયાર થાય છે…" : "⬇️ બેકઅપ ડાઉનલોડ કરો"}</button>
    </div>
  );
}
export default function Settings() { const { S } = useApp(); return <><Form key={JSON.stringify(S.set)} init={S.set} /><Backup /></>; }
