if (window.Chart && window.ChartDataLabels) {
  Chart.register(window.ChartDataLabels);
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function formatDay(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDateTime(isoString) {
  if (!isoString) return "Never";
  return new Date(isoString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function baseChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        color: cssVar("--text-primary"),
        font: { weight: "600", size: 12 },
      },
    },
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

  const options = baseChartOptions();
  options.plugins.datalabels.align = "top";
  options.plugins.datalabels.display = (ctx) => ctx.dataset.data[ctx.dataIndex] > 0;

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
    options,
  });
}

function renderBarChart(canvas, rows, labelKey = "label") {
  if (!canvas) return;
  if (canvas._chart) canvas._chart.destroy();

  const options = baseChartOptions();
  options.indexAxis = "y";
  options.scales.x.beginAtZero = true;
  options.plugins.datalabels.anchor = "end";
  options.plugins.datalabels.align = "end";

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

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function renderLeaderboardTable(rows) {
  const tbody = document.getElementById("leaderboard-body");
  if (!tbody || !rows) return;

  tbody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.label)}</td>
          <td>${row.scan_count}</td>
          <td>${row.unique_devices}</td>
          <td>${row.repeat_scans}</td>
          <td>${formatDateTime(row.last_scanned_at)}</td>
          <td><span class="badge ${row.is_active ? "active" : "inactive"}">${row.is_active ? "Active" : "Inactive"}</span></td>
        </tr>`
    )
    .join("");

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No QR codes yet.</td></tr>';
  }
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
  setStatTile("stat-unique", data.visitors.uniqueDevices);
  setStatTile("stat-repeat", data.visitors.repeatScans);

  renderLineChart(document.getElementById("chart-timeline"), data.timeline);
  renderBarChart(document.getElementById("chart-device"), data.deviceBreakdown);

  if (data.leaderboard) {
    renderBarChart(document.getElementById("chart-leaderboard"), data.leaderboard, "label");
    renderLeaderboardTable(data.leaderboard);
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
