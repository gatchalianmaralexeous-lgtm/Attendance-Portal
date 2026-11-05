// Vercel serverless function: POST /api/submit
// Reads secrets from environment variables only (never from the browser):
//   RESEND_API_KEY     your Resend API key
//   RECIPIENT_EMAILS   where timesheets go, e.g. "you@gmail.com"
//                      (several addresses can be separated by commas)
//   FROM_EMAIL         optional. A sender on a domain verified in Resend,
//                      e.g. "AnQor Timesheets <timesheets@yourdomain.com>".
//                      If not set, Resend's test sender is used, which can
//                      only deliver to the email address of your Resend account.

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const clip = (s, n = 200) => String(s == null ? "" : s).replace(/[\r\n]+/g, " ").slice(0, n).trim();
const num = (v) => {
  const x = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, ""));
  return isNaN(x) ? 0 : x;
};
const fmt = (x) => (x ? String(Math.round(x * 100) / 100) : "0");

function buildEmail(d) {
  const rows = DAYS.map((day, i) => {
    const r = (d.rows && d.rows[i]) || {};
    return { day, date: clip(r.date, 20), job: clip(r.job, 120), reg: clip(r.reg, 10), ot: clip(r.ot, 10) };
  });
  const totalReg = rows.reduce((a, r) => a + num(r.reg), 0);
  const totalOt = rows.reduce((a, r) => a + num(r.ot), 0);

  const pay = d.payStart || d.payEnd ? `${clip(d.payStart, 20)} / ${clip(d.payEnd, 20)}` : "";
  const f = {
    name: clip(d.name, 120),
    title: clip(d.title, 120),
    sup: clip(d.supervisor, 120),
    pay,
    esig: clip(d.employeeSignature, 120),
    edate: clip(d.employeeDate, 20),
    ssig: clip(d.supervisorSignature, 120),
    sdate: clip(d.supervisorDate, 20),
  };

  const th = "border:1px solid #111;padding:8px 10px;background:#f1f1ef;text-align:left;font-size:14px;";
  const thc = th + "text-align:center;";
  const td = "border:1px solid #111;padding:8px 10px;font-size:14px;";
  const tdc = td + "text-align:center;";

  const bodyRows = rows
    .map(
      (r) => `<tr>
  <td style="${td}font-weight:bold;">${esc(r.day)}</td>
  <td style="${td}">${esc(r.date)}</td>
  <td style="${td}">${esc(r.job)}</td>
  <td style="${tdc}">${esc(r.reg)}</td>
  <td style="${tdc}">${esc(r.ot)}</td>
</tr>`
    )
    .join("");

  const meta = (label, value) =>
    `<tr><td style="padding:3px 12px 3px 0;font-weight:bold;font-size:14px;white-space:nowrap;">${label}</td><td style="padding:3px 0;font-size:14px;">${esc(value) || "&nbsp;"}</td></tr>`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:16px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111;">
<div style="max-width:720px;margin:0 auto;">
  <h2 style="margin:0 0 4px;font-size:22px;">Employee Timesheet</h2>
  <p style="margin:0 0 16px;font-weight:bold;">AnQor Plumbing &amp; Heating</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    ${meta("Employee Name:", f.name)}
    ${meta("Pay Period:", f.pay)}
    ${meta("Job Title:", f.title)}
    ${meta("Supervisor:", f.sup)}
  </table>
  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">
    <thead><tr>
      <th style="${th}">Day</th><th style="${th}">Date</th><th style="${th}">Job</th>
      <th style="${thc}">Regular Hours</th><th style="${thc}">Overtime Hours</th>
    </tr></thead>
    <tbody>${bodyRows}</tbody>
    <tfoot><tr>
      <td colspan="3" style="${td}text-align:right;font-weight:bold;">TOTAL HOURS</td>
      <td style="${tdc}font-weight:bold;">${esc(fmt(totalReg))}</td>
      <td style="${tdc}font-weight:bold;">${esc(fmt(totalOt))}</td>
    </tr></tfoot>
  </table>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;">
    <tr>
      <td style="padding:4px 12px 4px 0;font-weight:bold;font-size:14px;">Employee Signature:</td>
      <td style="padding:4px 24px 4px 0;font-size:20px;font-style:italic;font-family:'Times New Roman',serif;">${esc(f.esig)}</td>
      <td style="padding:4px 8px 4px 0;font-weight:bold;font-size:14px;">Date:</td>
      <td style="padding:4px 0;font-size:14px;">${esc(f.edate)}</td>
    </tr>
    <tr>
      <td style="padding:4px 12px 4px 0;font-weight:bold;font-size:14px;">Supervisor Signature:</td>
      <td style="padding:4px 24px 4px 0;font-size:20px;font-style:italic;font-family:'Times New Roman',serif;">${esc(f.ssig)}</td>
      <td style="padding:4px 8px 4px 0;font-weight:bold;font-size:14px;">Date:</td>
      <td style="padding:4px 0;font-size:14px;">${esc(f.sdate)}</td>
    </tr>
  </table>
</div>
</body></html>`;

  const text = [
    "EMPLOYEE TIMESHEET - AnQor Plumbing & Heating",
    `Employee Name: ${f.name}`,
    `Pay Period: ${f.pay}`,
    `Job Title: ${f.title}`,
    `Supervisor: ${f.sup}`,
    "",
    ...rows.map((r) => `${r.day} ${r.date} - ${r.job || "-"} - Regular: ${r.reg || "0"} - Overtime: ${r.ot || "0"}`),
    "",
    `TOTAL HOURS: Regular ${fmt(totalReg)} | Overtime ${fmt(totalOt)}`,
    `Employee Signature: ${f.esig}  Date: ${f.edate}`,
    `Supervisor Signature: ${f.ssig}  Date: ${f.sdate}`,
  ].join("\n");

  return { html, text, f, totalReg, totalOt };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  const { RESEND_API_KEY, RECIPIENT_EMAILS } = process.env;
  const FROM_EMAIL = process.env.FROM_EMAIL || "AnQor Timesheets <onboarding@resend.dev>";
  const recipients = String(RECIPIENT_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!RESEND_API_KEY || recipients.length === 0) {
    console.error("Missing RESEND_API_KEY or RECIPIENT_EMAILS environment variable.");
    return res.status(500).json({ ok: false, error: "The server is not configured to send email yet." });
  }

  let data = req.body;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (e) {
      data = null;
    }
  }
  if (!data || typeof data !== "object") {
    return res.status(400).json({ ok: false, error: "Invalid submission." });
  }

  // Honeypot: real users never fill this hidden field. Pretend success to bots.
  if (data.website) return res.status(200).json({ ok: true });

  if (!clip(data.name)) return res.status(400).json({ ok: false, error: "Employee name is required." });
  if (!clip(data.employeeSignature)) return res.status(400).json({ ok: false, error: "Employee signature is required." });

  const { html, text, f, totalReg, totalOt } = buildEmail(data);
  if (totalReg + totalOt <= 0) {
    return res.status(400).json({ ok: false, error: "Enter hours for at least one day." });
  }

  const subject = `Timesheet - ${f.name} - ${f.pay || "no pay period"}`;

  try {
    // One API call; every address in "to" gets the same email at the same time.
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: recipients, subject, html, text }),
    });
    if (!r.ok) {
      const detail = await r.text();
      console.error("Resend error", r.status, detail);
      return res.status(502).json({ ok: false, error: "The email service rejected the message. Please try again or contact the office." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Resend request failed", err);
    return res.status(502).json({ ok: false, error: "Could not reach the email service. Please try again." });
  }
}
