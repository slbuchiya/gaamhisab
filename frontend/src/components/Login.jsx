import { useState } from "react";
import { api, DEMO } from "../api.js";
export default function Login({ onLogin }) {
  const [user, setUser] = useState(""), [pass, setPass] = useState("");
  const go = async () => { try { const r = await api("login", "POST", { user: user.trim(), pass }); onLogin(r.token); } catch (e) { alert(e.message); } };
  return (
    <div className="card"><b>મંડળ લૉગિન (પ્રમુખ / ખજાનચી)</b>
      <div className="row"><input placeholder="યુઝરનેમ" autoCapitalize="none" value={user} onChange={(e) => setUser(e.target.value)} /></div>
      <div className="row"><input type="password" placeholder="પાસવર્ડ" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} /></div>
      <button className="b p" onClick={go}>લૉગિન</button>
      {DEMO && <div className="mu" style={{ marginTop: 8 }}>ડેમો: યુઝરનેમ <b>pramukh</b>, પાસવર્ડ <b>1234</b></div>}
    </div>
  );
}
