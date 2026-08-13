const pool = require("../db/pool");

const BREAKDOWN_COLUMNS = new Set(["device_type", "os_name", "browser_name"]);

async function getSummary(qrCodeId = null) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE $1::int IS NULL OR qr_code_id = $1::int) AS all_time,
       COUNT(*) FILTER (WHERE scanned_at > now() - interval '7 days' AND ($1::int IS NULL OR qr_code_id = $1::int)) AS last_7d,
       COUNT(*) FILTER (WHERE scanned_at > now() - interval '30 days' AND ($1::int IS NULL OR qr_code_id = $1::int)) AS last_30d
     FROM scans`,
    [qrCodeId]
  );

  const { rows: activeRows } = await pool.query(
    "SELECT COUNT(*)::int AS count FROM qr_codes WHERE is_active = true"
  );

  return {
    allTime: Number(rows[0].all_time),
    last7Days: Number(rows[0].last_7d),
    last30Days: Number(rows[0].last_30d),
    activeQrCodes: activeRows[0].count,
  };
}

async function getScansOverTime(qrCodeId = null, days = 30) {
  const { rows } = await pool.query(
    `SELECT date_trunc('day', scanned_at) AS day, COUNT(*)::int AS count
     FROM scans
     WHERE scanned_at > now() - ($2 || ' days')::interval
       AND ($1::int IS NULL OR qr_code_id = $1::int)
     GROUP BY day
     ORDER BY day`,
    [qrCodeId, days]
  );

  return rows.map((row) => ({ day: row.day, count: row.count }));
}

async function getBreakdown(column, qrCodeId = null, days = 30, limit = 10) {
  if (!BREAKDOWN_COLUMNS.has(column)) {
    throw new Error(`Invalid breakdown column: ${column}`);
  }

  const { rows } = await pool.query(
    `SELECT ${column} AS label, COUNT(*)::int AS count
     FROM scans
     WHERE scanned_at > now() - ($2 || ' days')::interval
       AND ($1::int IS NULL OR qr_code_id = $1::int)
     GROUP BY ${column}
     ORDER BY count DESC
     LIMIT $3`,
    [qrCodeId, days, limit]
  );

  return rows;
}

async function getQrLeaderboard() {
  const { rows } = await pool.query(
    `SELECT q.id, q.label, q.code, q.is_active, COUNT(s.id)::int AS scan_count
     FROM qr_codes q
     LEFT JOIN scans s ON s.qr_code_id = q.id
     GROUP BY q.id, q.label, q.code, q.is_active
     ORDER BY scan_count DESC`
  );

  return rows;
}

async function getStats(qrCodeId = null, days = 30) {
  const [summary, timeline, deviceBreakdown, osBreakdown, browserBreakdown] = await Promise.all([
    getSummary(qrCodeId),
    getScansOverTime(qrCodeId, days),
    getBreakdown("device_type", qrCodeId, days),
    getBreakdown("os_name", qrCodeId, days),
    getBreakdown("browser_name", qrCodeId, days),
  ]);

  return { summary, timeline, deviceBreakdown, osBreakdown, browserBreakdown };
}

module.exports = { getSummary, getScansOverTime, getBreakdown, getQrLeaderboard, getStats };
