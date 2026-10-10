import { useCallback, useEffect, useState } from "react";
import { api, setToken, getToken, DEMO } from "./api.js";
import { AppCtx } from "./ctx.js";
import Home from "./components/Home.jsx";
import Photos from "./components/Photos.jsx";
import Contact from "./components/Contact.jsx";
import Team from "./components/Team.jsx";
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
  const [photos, setPhotos] = useState([]);
  const loadPhotos = useCallback(async () => { try { setPhotos(await api("photos")); } catch { /* ignore */ } }, []);
  useEffect(() => { loadPhotos(); }, [loadPhotos]);
  const [team, setTeam] = useState([]);
  const loadTeam = useCallback(async () => { try { setTeam(await api("team")); } catch { /* ignore */ } }, []);
  useEffect(() => { loadTeam(); }, [loadTeam]);

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

  // WhatsApp માં આવેલી રસીદની લિંક (?r=pay-ID) ખોલવા
  useEffect(() => {
    if (!loaded) return;
    const r = new URLSearchParams(location.search).get("r");
    if (!r) return;
    const [k, ...rest] = r.split("-"), id = rest.join("-");
    if (k === "pay") { const p = S.pay.find((x) => x.id === id), m = p && S.mem.find((x) => x.id === p.mid); if (p) setRc({ ...p, name: m ? m.name : "—", kind: "pay" }); }
    if (k === "don") { const d = S.don.find((x) => x.id === id); if (d) setRc({ ...d, name: d.donor, kind: "don" }); }
    // eslint-disable-next-line
  }, [loaded]);

  const run = async (fn) => { try { await fn(); await load(); return true; } catch (e) { alert(e.message); return false; } };
  const login = (t) => { setToken(t); setAdmin(true); setTab("home"); load(); };
  const logout = () => { setToken(""); setAdmin(false); setTab("home"); load(); };

  const tabs = [["home", "🏠 હોમ"], ["sum", "📊 સારાંશ"], ["ug", "✅ ઉઘરાણી"], ["dn", "🎁 દાન"], ["ex", "💸 ખર્ચ"],
    ...(admin ? [["ph", "🖼 ફોટા"], ["pg", "📅 કાર્યક્રમ"], ["gm", "🏠 ગામ યાદી"], ["st", "⚙️ સેટિંગ"]] : []),
    ["team", "👥 સમિતિ"], ["contact", "📞 સંપર્ક"], ["lg", admin ? "🚪 લૉગઆઉટ" : "🔐 મંડળ લૉગિન"]];
  const View = { home: Home, sum: Summary, contact: Contact, team: Team, ph: Photos, ug: Collection, dn: Donations, ex: Expenses, pg: Programs, gm: Members, st: Settings }[tab];

  return (
    <AppCtx.Provider value={{ S, admin, pid, setPid, run, showRc: setRc, photos, loadPhotos, setTab, team, loadTeam }}>
      <div className="app-wrapper">
        <header>
          <div className="w" style={{ padding: 0 }}>
            <h1>🙏 {S.set.gaam || "ગામ"} – {S.set.mandal || "ફંડ હિસાબ"}</h1>
            <div className="mu">{admin ? "👤 મંડળ (પ્રમુખ/ખજાનચી) વિભાગ" : "👥 ગામ લોકો માટે (ફક્ત જોવા માટે)"}</div>
          </div>
        </header>
        <main className="w content-wrap">
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
        </main>
        <footer>
          <div className="w">
            Design & Development by Sachin L Buchiya
          </div>
        </footer>
      </div>
      {rc && <Receipt o={rc} S={S} onClose={() => { setRc(null); history.replaceState({}, "", location.pathname); }} />}
    </AppCtx.Provider>
  );
}