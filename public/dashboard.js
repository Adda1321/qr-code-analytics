function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function formatDay(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function baseChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: cssVar("--gridline") },
        ticks: { color: cssVar("--text-muted") },
      },
      y: {
        grid: { color: cssVar("--gridline") },
        ticks: { color: cssVar("--text-muted") },
        beginAtZero: true,
      },
    },
  };
}

function renderLineChart(canvas, timeline) {
  if (!canvas) return;
  if (canvas._chart) canvas._chart.destroy();

  canvas._chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: timeline.map((row) => formatDay(row.day)),
      datasets: [
        {
          data: timeline.map((row) => row.count),
          borderColor: cssVar("--accent"),
          backgroundColor: cssVar("--accent"),
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.2,
        },
      ],
    },
    options: baseChartOptions(),
  });
}

function renderBarChart(canvas, rows, labelKey = "label") {
  if (!canvas) return;
  if (canvas._chart) canvas._chart.destroy();

  const options = baseChartOptions();
  options.indexAxis = "y";
  options.scales.x.beginAtZero = true;

  canvas._chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: rows.map((row) => row[labelKey] || "unknown"),
      datasets: [
        {
          data: rows.map((row) => row.count ?? row.scan_count),
          backgroundColor: cssVar("--accent"),
          borderRadius: 4,
        },
      ],
    },
    options,
  });
}

async function loadStats(statsUrl, days) {
  const res = await fetch(`${statsUrl}?range=${days}d`);
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

function setStatTile(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function refreshDashboard(statsUrl, days) {
  const data = await loadStats(statsUrl, days);

  setStatTile("stat-all-time", data.summary.allTime);
  setStatTile("stat-7d", data.summary.last7Days);
  setStatTile("stat-30d", data.summary.last30Days);
  setStatTile("stat-active", data.summary.activeQrCodes);

  renderLineChart(document.getElementById("chart-timeline"), data.timeline);
  renderBarChart(document.getElementById("chart-device"), data.deviceBreakdown);
  renderBarChart(document.getElementById("chart-os"), data.osBreakdown);
  renderBarChart(document.getElementById("chart-browser"), data.browserBreakdown);

  if (data.leaderboard) {
    renderBarChart(document.getElementById("chart-leaderboard"), data.leaderboard, "label");
  }
}

function initDashboard(statsUrl) {
  const rangeSelect = document.getElementById("range-select");
  const days = () => (rangeSelect ? rangeSelect.value : "30");

  refreshDashboard(statsUrl, days());

  if (rangeSelect) {
    rangeSelect.addEventListener("change", () => refreshDashboard(statsUrl, days()));
  }
}
