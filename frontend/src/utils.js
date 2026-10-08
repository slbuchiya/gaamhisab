export const N = (v) => Number(v) || 0;
export const R = (v) => "₹" + N(v).toLocaleString("en-IN");
export const today = () => new Date().toISOString().slice(0, 10);
export const pname = (S, id) => (S.prog.find((p) => p.id === id) || {}).name || "—";
export const inP = (pid) => (x) => pid === "all" || x.pid === pid;
export const sum = (a) => a.reduce((t, x) => t + N(x.amount), 0);
export function totals(S, pid) {
  const f = inP(pid);
  const ug = sum(S.pay.filter(f));
  const dc = sum(S.don.filter(f).filter((x) => x.kind === "cash"));
  const ex = sum(S.exp.filter(f));
  return { ug, dc, inc: ug + dc, ex, bal: ug + dc - ex };
}
