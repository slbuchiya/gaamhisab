// રિપોર્ટ / ઓડિટનું PDF (ગુજરાતી ફોન્ટ, કોષ્ટકો, પાના નંબર, સહી અને સિક્કા સાથે)
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const A = (f) => path.join(__dirname, "assets", f);
const rs = (v) => "રૂ. " + (Number(v) || 0).toLocaleString("en-IN");

// spec = { org, title, subtitle, generated, summary:[[label,value,strong?]], sections:[{title, cols:[{h,w,a}], rows:[[..]], total:[..]}], sign:{a,b} }
function buildReportPdf(res, spec) {
  const doc = new PDFDocument({ size: "A4", margin: 36, bufferPages: true, info: { Title: spec.title } });
  doc.registerFont("g", A("NotoSansGujarati-Regular.ttf"));
  doc.registerFont("gb", A("NotoSansGujarati-Bold.ttf"));
  doc.pipe(res);
  const BR = "#92400e", L = 36, W = doc.page.width - 72, BOT = doc.page.height - 56;

  doc.font("gb").fontSize(16).fillColor(BR).text(spec.org || "", L, 36, { width: W, align: "center" });
  doc.font("gb").fontSize(14).fillColor("#111").text(spec.title, L, doc.y + 4, { width: W, align: "center" });
  if (spec.subtitle) doc.font("g").fontSize(11).fillColor("#444").text(spec.subtitle, L, doc.y + 2, { width: W, align: "center" });
  doc.moveTo(L, doc.y + 8).lineTo(L + W, doc.y + 8).lineWidth(1).strokeColor(BR).stroke();
  doc.y += 18;

  if (spec.summary && spec.summary.length) {
    const rh = 22, y0 = doc.y, h = spec.summary.length * rh + 8;
    doc.roundedRect(L, y0, W, h, 6).fillAndStroke("#fff7ed", BR);
    spec.summary.forEach(([k, v, strong], i) => {
      const y = y0 + 6 + i * rh;
      doc.fillColor("#111").font(strong ? "gb" : "g").fontSize(strong ? 11.5 : 10.5);
      doc.text(k, L + 12, y + 3, { width: W / 2 });
      doc.text(String(v), L + W / 2, y + 3, { width: W / 2 - 12, align: "right" });
    });
    doc.y = y0 + h + 6;
  }

  const table = (sec) => {
    if (doc.y + 70 > BOT) doc.addPage();
    doc.font("gb").fontSize(12).fillColor(BR).text(sec.title, L, doc.y + 10, { width: W });
    doc.y += 4;
    const cols = sec.cols.map((c) => ({ ...c, w: c.w * W }));
    const head = () => {
      const y = doc.y; doc.rect(L, y, W, 20).fill(BR);
      let x = L; doc.fillColor("#fff").font("gb").fontSize(9.5);
      cols.forEach((c) => { doc.text(c.h, x + 4, y + 4, { width: c.w - 8, align: c.a || "left" }); x += c.w; });
      doc.y = y + 20;
    };
    const row = (cells, i, bold) => {
      doc.font(bold ? "gb" : "g").fontSize(9.5);
      const h = Math.max(...cells.map((t, k) => doc.heightOfString(String(t), { width: cols[k].w - 8 }))) + 8;
      if (doc.y + h > BOT) { doc.addPage(); head(); }
      const y = doc.y;
      if (bold) doc.rect(L, y, W, h).fill("#fde7d3"); else if (i % 2) doc.rect(L, y, W, h).fill("#faf5ee");
      doc.fillColor("#111").font(bold ? "gb" : "g").fontSize(9.5);
      let x = L; cells.forEach((t, k) => { doc.text(String(t), x + 4, y + 4, { width: cols[k].w - 8, align: cols[k].a || "left" }); x += cols[k].w; });
      doc.y = y + h;
    };
    head();
    sec.rows.forEach((r, i) => row(r, i, false));
    if (!sec.rows.length) { doc.font("g").fontSize(10).fillColor("#666").text("કોઈ નોંધ નથી", L + 4, doc.y + 4); doc.y += 22; }
    if (sec.total) row(sec.total, 0, true);
  };
  const secs = (spec.sections || []).filter((s) => s.rows && s.rows.length);
  secs.forEach(table);
  if (!secs.length) { doc.font("g").fontSize(11).fillColor("#666").text("આ સમયગાળામાં કોઈ નોંધ નથી.", L, doc.y + 12, { width: W, align: "center" }); doc.y += 30; }

  // સહી અને સિક્કો
  if (doc.y + 140 > BOT) doc.addPage();
  const sy = doc.y + 100;
  if (fs.existsSync(A("sikko-pdf.jpg"))) { try { doc.image(A("sikko-pdf.jpg"), L + 10, sy - 66, { width: 150 }); } catch (e) { /* ignore */ } }
  doc.lineWidth(0.8).strokeColor("#111");
  doc.moveTo(L + 10, sy).lineTo(L + 170, sy).stroke();
  doc.moveTo(L + W - 170, sy).lineTo(L + W - 10, sy).stroke();
  const sg = spec.sign || {};
  doc.fillColor("#111").font("g").fontSize(10);
  doc.text(`${sg.a || "પ્રમુખ"}\nપ્રમુખ`, L + 10, sy + 4, { width: 160, align: "center" });
  doc.text(`${sg.b || "ખજાનચી"}\nખજાનચી`, L + W - 170, sy + 4, { width: 160, align: "center" });

  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    const mb = doc.page.margins.bottom; doc.page.margins.bottom = 0;
    doc.font("g").fontSize(8.5).fillColor("#888").text(`પાના ${i + 1} / ${range.count}   •   ${spec.generated || ""}`, L, doc.page.height - 28, { width: W, align: "center" });
    doc.page.margins.bottom = mb;
  }
  doc.end();
}
module.exports = { buildReportPdf, rs };
