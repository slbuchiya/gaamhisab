// રસીદનું PDF બનાવે છે (ગુજરાતી ફોન્ટ સાથે). WhatsApp માં આ PDF ની લિંક જાય છે.
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const A = (f) => path.join(__dirname, "assets", f);
const rupee = (v) => "રૂ. " + (Number(v) || 0).toLocaleString("en-IN");

function buildReceiptPdf(res, d) {
  const doc = new PDFDocument({ size: "A5", margin: 0, info: { Title: "Receipt " + d.no } });
  doc.registerFont("g", A("NotoSansGujarati-Regular.ttf"));
  doc.registerFont("gb", A("NotoSansGujarati-Bold.ttf"));
  doc.pipe(res);
  const W = doc.page.width, H = doc.page.height, BR = "#92400e";

  doc.lineWidth(3).rect(16, 16, W - 32, H - 32).stroke(BR);
  doc.lineWidth(1).rect(23, 23, W - 46, H - 46).stroke(BR);

  doc.font("gb").fontSize(17).fillColor(BR).text(`${d.gaam || "ગામ"} – ${d.mandal || "મંડળ"}`, 36, 48, { width: W - 72, align: "center" });
  doc.font("gb").fontSize(15).fillColor("#111").text("રસીદ", 36, doc.y + 6, { width: W - 72, align: "center" });
  doc.moveTo(60, doc.y + 6).lineTo(W - 60, doc.y + 6).lineWidth(0.7).stroke(BR);

  doc.font("g").fontSize(11).fillColor("#111");
  const y0 = doc.y + 20;
  doc.text(`રસીદ નં: ${d.no}`, 40, y0, { width: (W - 80) / 2 });
  doc.text(`તારીખ: ${d.date}`, W / 2, y0, { width: (W - 80) / 2, align: "right" });
  doc.text(`કાર્યક્રમ: ${d.program || "—"}`, 40, y0 + 22, { width: W - 80 });
  doc.text(`શ્રી ${d.name} પાસેથી નીચે મુજબ સ્વીકાર્યા છે. આભાર.`, 40, y0 + 46, { width: W - 80 });

  const bx = 70, by = y0 + 86, bw = W - 140;
  doc.roundedRect(bx, by, bw, 54, 8).lineWidth(1.2).fillAndStroke("#fff7ed", BR);
  doc.fillColor("#111").font("gb").fontSize(d.item ? 16 : 24)
    .text(d.item ? `વસ્તુ: ${d.item}` : rupee(d.amount), bx + 6, by + (d.item ? 17 : 11), { width: bw - 12, align: "center" });

  // સહી / સિક્કો
  const sy = H - 92;
  if (fs.existsSync(A("sikko-pdf.jpg"))) {
    try { doc.image(A("sikko-pdf.jpg"), 36, sy - 66, { width: 150 }); } catch (e) { /* ignore */ }
  }
  doc.lineWidth(0.8).strokeColor("#111");
  doc.moveTo(40, sy).lineTo(190, sy).stroke();
  doc.moveTo(W - 190, sy).lineTo(W - 40, sy).stroke();
  doc.fillColor("#111").font("g").fontSize(10);
  doc.text(`${d.pramukh || "પ્રમુખ"}\nપ્રમુખ`, 40, sy + 4, { width: 150, align: "center" });
  doc.text(`${d.khajanchi || "ખજાનચી"}\nખજાનચી`, W - 190, sy + 4, { width: 150, align: "center" });
  doc.end();
}
module.exports = { buildReceiptPdf };
