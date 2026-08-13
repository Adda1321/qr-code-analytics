const express = require("express");
const pool = require("../db/pool");
const qrService = require("../services/qrService");
const { getQrLeaderboard } = require("../services/statsService");

const router = express.Router();

router.get("/", (req, res) => {
  res.render("admin-dashboard", { baseUrl: process.env.BASE_URL });
});

router.get("/admin", (req, res) => {
  res.redirect("/");
});

router.get("/admin/qr", async (req, res) => {
  const qrCodes = await getQrLeaderboard();
  res.render("admin-qr-list", { qrCodes });
});

router.get("/admin/qr/new", (req, res) => {
  res.render("admin-qr-new", { error: null });
});

router.post("/admin/qr", async (req, res) => {
  const { label, destination_url } = req.body;

  if (!label || !destination_url) {
    return res.status(400).render("admin-qr-new", { error: "Label and destination URL are required." });
  }

  const code = qrService.generateCode();

  const { rows } = await pool.query(
    "INSERT INTO qr_codes (code, label, destination_url) VALUES ($1, $2, $3) RETURNING id",
    [code, label, destination_url]
  );

  res.redirect(`/admin/qr/${rows[0].id}`);
});

router.get("/admin/qr/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM qr_codes WHERE id = $1", [req.params.id]);

  if (rows.length === 0) {
    return res.status(404).send("QR code not found.");
  }

  const qrCode = rows[0];
  const redirectUrl = qrService.buildRedirectUrl(process.env.BASE_URL, qrCode.code);

  res.render("admin-qr-detail", { qrCode, redirectUrl });
});

router.get("/admin/qr/:id/image", async (req, res) => {
  const { rows } = await pool.query("SELECT code FROM qr_codes WHERE id = $1", [req.params.id]);

  if (rows.length === 0) {
    return res.status(404).send("QR code not found.");
  }

  const redirectUrl = qrService.buildRedirectUrl(process.env.BASE_URL, rows[0].code);
  const pngBuffer = await qrService.generatePngBuffer(redirectUrl);

  res.set("Content-Type", "image/png");
  res.send(pngBuffer);
});

router.post("/admin/qr/:id/deactivate", async (req, res) => {
  await pool.query("UPDATE qr_codes SET is_active = false WHERE id = $1", [req.params.id]);
  res.redirect("/admin/qr");
});

module.exports = router;
