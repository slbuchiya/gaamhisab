import { useApp } from "../ctx.js";
export default function PSel() {
  const { S, pid, setPid } = useApp();
  return (
    <div className="row"><b>કાર્યક્રમ:</b>
      <select value={pid} onChange={(e) => setPid(e.target.value)}>
        <option value="all">કાર્યક્રમ પસંદ કરો </option>
        {S.prog.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>
  );
}
