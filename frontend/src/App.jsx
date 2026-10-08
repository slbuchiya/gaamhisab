import { useCallback, useEffect, useState } from "react";
import { api, setToken, getToken, DEMO } from "./api.js";
import { AppCtx } from "./ctx.js";
import Summary from "./components/Summary.jsx";
import Collection from "./components/Collection.jsx";
import Donations from "./components/Donations.jsx";
import Expenses from "./components/Expenses.jsx";
import Programs from "./components/Programs.jsx";
import Members from "./components/Members.jsx";
import Settings from "./components/Settings.jsx";
import Login from "./components/Login.jsx";
import Receipt from "./components/Receipt.jsx";

const empty = { prog: [], mem: [], pay: [], exp: [], don: [], set: {} };

export default function App() {
  const [S, setS] = useState(empty);
  const [admin, setAdmin] = useState(!!getToken());
  const [tab, setTab] = useState("home");
  const [pid, setPid] = useState("all");
  const [err, setErr] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [rc, setRc] = useState(null);

  const load = useCallback(async () => {
    try {
      const d = await api("all");
      setS({ prog: d.prog || [], mem: d.mem || [], pay: d.pay || [], exp: d.exp || [], don: d.don || [], set: d.set || {} });
      setErr("");
    } catch { setErr("સર્વર સાથે જોડાઈ શકાયું નથી. થોડીવાર પછી ફરી ખોલો."); }
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (!document.hidden) load(); }, 30000);
    const lo = () => setAdmin(false);
    window.addEventListener("logout", lo);
    return () => { clearInterval(t); window.removeEventListener("logout", lo); };
  }, [load]);

  const run = async (fn) => { try { await fn(); await load(); return true; } catch (e) { alert(e.message); return false; } };
  const login = (t) => { setToken(t); setAdmin(true); setTab("home"); };
  const logout = () => { setToken(""); setAdmin(false); setTab("home"); };

  const tabs = [["home", "📊 સારાંશ"], ["ug", "✅ ઉઘરાણી"], ["dn", "🎁 દાન"], ["ex", "💸 ખર્ચ"],
    ...(admin ? [["pg", "📅 કાર્યક્રમ"], ["gm", "🏠 ગામ યાદી"], ["st", "⚙️ સેટિંગ"]] : []),
    ["lg", admin ? "🚪 લૉગઆઉટ" : "🔐 મંડળ લૉગિન"]];
  const View = { home: Summary, ug: Collection, dn: Donations, ex: Expenses, pg: Programs, gm: Members, st: Settings }[tab];

  return (
    <AppCtx.Provider value={{ S, admin, pid, setPid, run, showRc: setRc }}>
      <header>
        <div className="w" style={{ padding: 0 }}>
          <h1>🙏 {S.set.gaam || "ગામ"} – {S.set.mandal || "ફંડ હિસાબ"}</h1>
          <div className="mu">{admin ? "👤 મંડળ (પ્રમુખ/ખજાનચી) વિભાગ" : "👥 ગામ લોકો માટે (ફક્ત જોવા માટે)"}</div>
        </div>
      </header>
      <div className="w">
        {DEMO && <div className="demo">⚠️ ડેમો મોડ: ડેટા ફક્ત આ બ્રાઉઝરમાં સચવાય છે. સાચો ડેટાબેઝ વાપરવા <code>VITE_API_URL</code> સેટ કરો.</div>}
        <div className="tabs">
          {tabs.map(([k, n]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => { if (k === "lg" && admin) logout(); else setTab(k); }}>{n}</button>
          ))}
        </div>
        {err && <div className="card">{err}</div>}
        {!loaded ? <div className="card">લોડ થઈ રહ્યું છે…</div>
          : tab === "lg" ? <Login onLogin={login} />
          : <View />}
        <footer>🙏 ગામ હિસાબ</footer>
      </div>
      {rc && <Receipt o={rc} S={S} onClose={() => setRc(null)} />}
    </AppCtx.Provider>
  );
}
