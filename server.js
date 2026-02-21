const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express    = require("express");
const nodemailer = require("nodemailer");
const cors       = require("cors");
const crypto     = require("crypto");

const app  = express();
const PORT = process.env.PORT || 3001;

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

console.log("\n============================");
console.log("🚀 Holly Backend");
console.log("============================");
console.log("📧 Gmail :", GMAIL_USER || "❌ Belum diisi");
console.log("🔑 Pass  :", GMAIL_PASS ? "✅ Terkonfigurasi (" + GMAIL_PASS.slice(0,4) + "...)" : "❌ Belum diisi");
console.log("============================\n");

app.use(express.json());
app.use(cors({ origin: "*" }));

const otpStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("❌ Koneksi Gmail GAGAL:", error.message);
  } else {
    console.log("✅ Gmail terhubung! Siap kirim OTP.\n");
  }
});

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

function otpEmailTemplate(otp, name) {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"/></head>
  <body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr><td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#6c63ff,#48cae4);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;">Holly</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,.85);font-size:14px;">Produk & Jasa Digital</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a2e;">Halo, ${name}! 👋</h2>
              <p style="margin:0 0 28px;color:#666;font-size:15px;line-height:1.6;">
                Gunakan kode OTP berikut untuk verifikasi akun Anda:
              </p>
              <div style="background:#f4f4f8;border:2px dashed #6c63ff;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;">Kode Verifikasi</p>
                <div style="font-size:42px;font-weight:800;letter-spacing:10px;color:#6c63ff;">${otp}</div>
                <p style="margin:12px 0 0;font-size:13px;color:#f39c12;">⏱ Berlaku selama <strong>5 menit</strong></p>
              </div>
              <p style="margin:0;color:#999;font-size:12px;">Jangan bagikan kode ini kepada siapapun.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9f9fb;padding:20px 40px;border-top:1px solid #eee;text-align:center;">
              <p style="margin:0;color:#bbb;font-size:12px;">© 2025 Holly. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}

// POST /api/send-otp
app.post("/api/send-otp", async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) return res.status(400).json({ success: false, message: "Email dan nama harus diisi." });

  const existing = otpStore[email];
  if (existing && Date.now() < existing.expiredAt - 4 * 60 * 1000) {
    const sisa = Math.ceil((existing.expiredAt - 4 * 60 * 1000 - Date.now()) / 1000);
    return res.status(429).json({ success: false, message: `Tunggu ${sisa} detik sebelum kirim ulang.` });
  }

  const otp = generateOTP();
  const expiredAt = Date.now() + 5 * 60 * 1000;
  otpStore[email] = { otp, expiredAt, verified: false, name };
  setTimeout(() => { if (otpStore[email] && !otpStore[email].verified) delete otpStore[email]; }, 5 * 60 * 1000);

  try {
    await transporter.sendMail({
      from: `"Holly" <${GMAIL_USER}>`,
      to: email,
      subject: "Kode OTP Verifikasi Akun Holly",
      html: otpEmailTemplate(otp, name),
    });
    console.log(`📧 OTP terkirim ke ${email}: ${otp}`);
    res.json({ success: true, message: "OTP berhasil dikirim ke email Anda." });
  } catch (err) {
    console.error("❌ Gagal kirim email:", err.message);
    delete otpStore[email];
    res.status(500).json({ success: false, message: "Gagal mengirim email: " + err.message });
  }
});

// POST /api/verify-otp
app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: "Email dan OTP harus diisi." });

  const record = otpStore[email];
  if (!record) return res.status(400).json({ success: false, message: "OTP tidak ditemukan atau sudah kedaluwarsa." });
  if (Date.now() > record.expiredAt) { delete otpStore[email]; return res.status(400).json({ success: false, message: "OTP sudah kedaluwarsa." }); }
  if (record.otp !== otp.toString().trim()) return res.status(400).json({ success: false, message: "Kode OTP salah." });

  record.verified = true;
  console.log(`✅ OTP verified untuk ${email}`);
  setTimeout(() => delete otpStore[email], 5 * 60 * 1000);
  res.json({ success: true, message: "OTP berhasil diverifikasi!" });
});

// GET /api/health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", gmail: GMAIL_USER, passConfigured: !!GMAIL_PASS });
});

app.listen(PORT, () => {
  console.log(`🌐 Server berjalan di http://localhost:${PORT}\n`);
});