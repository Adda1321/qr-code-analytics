const { UAParser } = require("ua-parser-js");

function parseUserAgent(userAgentString) {
  const result = UAParser(userAgentString || "");

  return {
    deviceType: result.device.type || "desktop",
    osName: result.os.name || "unknown",
    osVersion: result.os.version || null,
    browserName: result.browser.name || "unknown",
    browserVersion: result.browser.version || null,
  };
}

module.exports = { parseUserAgent };
