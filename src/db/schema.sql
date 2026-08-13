CREATE TABLE IF NOT EXISTS qr_codes (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(16) UNIQUE NOT NULL,
  label           VARCHAR(255) NOT NULL,
  destination_url TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active       BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS scans (
  id              BIGSERIAL PRIMARY KEY,
  qr_code_id      INTEGER NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  scanned_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address      VARCHAR(64),
  user_agent_raw  TEXT,
  device_type     VARCHAR(32),
  os_name         VARCHAR(64),
  os_version      VARCHAR(32),
  browser_name    VARCHAR(64),
  browser_version VARCHAR(32)
);

CREATE INDEX IF NOT EXISTS idx_scans_qr_code_id ON scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON scans(scanned_at);
CREATE INDEX IF NOT EXISTS idx_scans_qr_scanned ON scans(qr_code_id, scanned_at);
