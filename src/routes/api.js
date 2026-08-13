const express = require("express");
const statsService = require("../services/statsService");

const router = express.Router();

function parseRangeDays(rangeParam) {
  const match = /^(\d+)d$/.exec(rangeParam || "30d");
  return match ? Number(match[1]) : 30;
}

router.get("/api/stats/summary", async (req, res) => {
  const summary = await statsService.getSummary();
  res.json(summary);
});

router.get("/api/stats/combined", async (req, res) => {
  const days = parseRangeDays(req.query.range);
  const [stats, leaderboard] = await Promise.all([
    statsService.getStats(null, days),
    statsService.getQrLeaderboard(),
  ]);

  res.json({ ...stats, leaderboard });
});

router.get("/api/stats/qr/:id", async (req, res) => {
  const days = parseRangeDays(req.query.range);
  const stats = await statsService.getStats(Number(req.params.id), days);
  res.json(stats);
});

module.exports = router;
