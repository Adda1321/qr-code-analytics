const express = require("express");
const pool = require("../db/pool");
const { parseUserAgent } = require("../services/uaService");

const router = express.Router();

router.get("/healthz", (req, res) => {
  res.status(200).send("ok");
});

router.get("/r/:code", async (req, res) => {
  const { code } = req.params;

  const { rows } = await pool.query(
    "SELECT id, destination_url FROM qr_codes WHERE code = $1 AND is_active = true",
    [code]
  );

  if (rows.length === 0) {
    return res.status(404).send("This QR code was not found or is no longer active.");
  }

  const qrCode = rows[0];
  const userAgentString = req.headers["user-agent"] || "";
  const { deviceType, osName, osVersion, browserName, browserVersion } =
    parseUserAgent(userAgentString);

  await pool.query(
    `INSERT INTO scans
       (qr_code_id, ip_address, user_agent_raw, device_type, os_name, os_version, browser_name, browser_version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [qrCode.id, req.ip, userAgentString, deviceType, osName, osVersion, browserName, browserVersion]
  );

  res.redirect(302, qrCode.destination_url);
});

module.exports = router;
