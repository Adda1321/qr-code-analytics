const net = require("net");
const dns = require("dns");
const { Pool } = require("pg");

// Some hosting/sandbox networks advertise IPv6 routes that aren't actually reachable.
// Node's default dual-stack "happy eyeballs" racing can fail outright in that case
// even though plain IPv4 connects fine, so force IPv4-first, non-racing connections.
net.setDefaultAutoSelectFamily(false);
dns.setDefaultResultOrder("ipv4first");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const needsSSL = /sslmode=require/.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: needsSSL ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
