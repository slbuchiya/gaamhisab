import "./team.css";
import { waLink, waPhone } from "../utils.js";

export default function MemberCard({ m, size = "md", children }) {
  const ph = waPhone(m.phone);
  return (
    <div className={"tm-card " + size}>
      <div className="tm-top" />
      {m.photo ? <img className="tm-pic" src={m.photo} alt={m.name} loading="lazy" /> : <div className="tm-pic tm-ini">{[...m.name][0]}</div>}
      <div className="tm-body">
        <b className="tm-name">{m.name}</b>
        <span className="tm-role">{m.role}</span>
        {ph && (
          <div className="tm-act">
            <a className="tm-btn" href={`tel:+${ph}`}>📞 કૉલ</a>
            <a className="tm-btn wa" href={waLink(m.phone)} target="_blank" rel="noreferrer">💬 WhatsApp</a>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
