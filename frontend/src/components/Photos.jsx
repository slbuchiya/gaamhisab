import { useState } from "react";
import { useApp } from "../ctx.js";
import { api } from "../api.js";
import { fileToDataUrl, pname } from "../utils.js";
export default function Photos() {
  const { S, photos, loadPhotos } = useApp();
  const [pid, setPid] = useState(""), [cap, setCap] = useState(""), [busy, setBusy] = useState(false);
  const onFiles = async (e) => {
    const files = [...e.target.files]; e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    try {
      for (const f of files) {
        const data = await fileToDataUrl(f);
        await api("photos", "POST", { caption: cap.trim() || (pid ? pname(S, pid) : ""), pid, data });
      }
      setCap(""); await loadPhotos();
    } catch (err) { alert("ભૂલ: " + err.message); }
    setBusy(false);
  };
  const del = async (id) => { if (!confirm("આ ફોટો કાઢી નાખવો છે?")) return; try { await api("photos/" + id, "DELETE"); await loadPhotos(); } catch (e) { alert(e.message); } };
  return (<>
    <div className="card"><b>🖼 નવા ફોટા ઉમેરો</b>
      <div className="mu">ફોટા હોમ પેજ પર સ્લાઇડ થશે (છેલ્લા 60 ફોટા દેખાય)</div>
      <div className="row">
        <select value={pid} onChange={(e) => setPid(e.target.value)}>
          <option value="">કાર્યક્રમ (વૈકલ્પિક)</option>
          {S.prog.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input placeholder="ફોટાનું લખાણ (વૈકલ્પિક)" value={cap} onChange={(e) => setCap(e.target.value)} />
      </div>
      <div className="row"><input type="file" accept="image/*" multiple disabled={busy} onChange={onFiles} />{busy && <span className="mu">અપલોડ થઈ રહ્યું છે…</span>}</div>
    </div>
    <div className="card"><b>કુલ ફોટા: {photos.length}</b>
      <div className="pgrid">
        {photos.map((p) => (
          <div key={p.id} className="pth"><img src={p.data} alt="" /><div className="mu">{p.caption || "—"}</div><button className="b d" onClick={() => del(p.id)}>🗑</button></div>
        ))}
      </div>
    </div>
  </>);
}
