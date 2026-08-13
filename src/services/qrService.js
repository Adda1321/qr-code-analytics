const crypto = require("crypto");
const QRCode = require("qrcode");

function generateCode() {
  return crypto.randomBytes(6).toString("base64url");
}

function buildRedirectUrl(baseUrl, code) {
  return `${baseUrl.replace(/\/$/, "")}/r/${code}`;
}

function generatePngBuffer(url) {
  return QRCode.toBuffer(url, { type: "png", width: 400, margin: 1 });
}

function generateDataUrl(url) {
  return QRCode.toDataURL(url, { width: 300, margin: 1 });
}

module.exports = { generateCode, buildRedirectUrl, generatePngBuffer, generateDataUrl };
