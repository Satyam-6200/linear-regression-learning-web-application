/**
 * eda.js
 * Exploratory Data Analysis: histograms, correlation matrix, scatter plots.
 */

function renderEDA() {
  const { processedData, features, target, columns, dtypes } = AppState;
  if (!processedData) return;

  const allCols = [...features, target].filter(c => columns.includes(c));
  const numericCols = allCols.filter(c => dtypes[c] === 'numeric');

  // ── Populate selectors ──
  const histSel = document.getElementById('hist-feature-select');
  histSel.innerHTML = numericCols.map(c => `<option value="${c}">${c}</option>`).join('');

  const scatterSel = document.getElementById('scatter-x-select');
  scatterSel.innerHTML = features.filter(c => dtypes[c] === 'numeric').map(c => `<option value="${c}">${c}</option>`).join('');

  drawHistogram();
  drawCorrelationMatrix(numericCols);
  drawScatter();
}

// ── Histogram ──────────────────────────────────────────────────────
function drawHistogram() {
  const col = document.getElementById('hist-feature-select').value;
  if (!col) return;

  const vals = AppState.processedData.map(r => parseFloat(r[col])).filter(v => !isNaN(v));

  const bins = 10;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const binWidth = (max - min) / bins;
  const counts = Array(bins).fill(0);
  const labels = [];

  for (let i = 0; i < bins; i++) {
    const lo = min + i * binWidth;
    const hi = lo + binWidth;
    labels.push(`${lo.toFixed(1)}–${hi.toFixed(1)}`);
    counts[i] = vals.filter(v => v >= lo && (i === bins - 1 ? v <= hi : v < hi)).length;
  }

  const ctx = document.getElementById('hist-chart');
  destroyChart('hist');
  AppState.charts.hist = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: col,
        data: counts,
        backgroundColor: 'rgba(91,110,245,0.6)',
        borderColor: '#5b6ef5',
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { title: (items) => `Range: ${items[0].label}` } }
      },
      scales: {
        x: { ticks: { color: '#8a91a8', font: { family: 'Space Mono', size: 9 }, maxRotation: 30 }, grid: { color: '#2d3448' } },
        y: { ticks: { color: '#8a91a8' }, grid: { color: '#2d3448' }, title: { display: true, text: 'Count', color: '#545d7a' } }
      }
    }
  });
}

// ── Correlation Matrix ─────────────────────────────────────────────
function drawCorrelationMatrix(numericCols) {
  const data = AppState.processedData;
  const corr = {};
  numericCols.forEach(c1 => {
    corr[c1] = {};
    numericCols.forEach(c2 => {
      corr[c1][c2] = pearsonCorrelation(data, c1, c2);
    });
  });

  let html = '<table class="corr-table"><thead><tr><th></th>';
  numericCols.forEach(c => { html += `<th title="${c}">${c.length > 6 ? c.slice(0,5)+'…' : c}</th>`; });
  html += '</tr></thead><tbody>';

  numericCols.forEach(c1 => {
    html += `<tr><th>${c1.length > 6 ? c1.slice(0,5)+'…' : c1}</th>`;
    numericCols.forEach(c2 => {
      const val = corr[c1][c2];
      const color = correlationColor(val);
      html += `<td style="background:${color};color:${Math.abs(val) > 0.5 ? '#fff' : '#8a91a8'};font-weight:${Math.abs(val) > 0.7 ? 700 : 400}">${val.toFixed(2)}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById('corr-matrix').innerHTML = html;
}

function pearsonCorrelation(data, col1, col2) {
  const x = data.map(r => parseFloat(r[col1])).filter((v, i) => !isNaN(v) && !isNaN(parseFloat(data[i][col2])));
  const y = data.filter(r => !isNaN(parseFloat(r[col1])) && !isNaN(parseFloat(r[col2]))).map(r => parseFloat(r[col2]));

  const n = x.length;
  if (n < 2) return 0;

  const mx = x.reduce((a, b) => a + b) / n;
  const my = y.reduce((a, b) => a + b) / n;
  const num = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0);
  const dx = Math.sqrt(x.reduce((s, xi) => s + (xi - mx) ** 2, 0));
  const dy = Math.sqrt(y.reduce((s, yi) => s + (yi - my) ** 2, 0));
  return dx * dy === 0 ? 0 : parseFloat((num / (dx * dy)).toFixed(4));
}

function correlationColor(r) {
  const abs = Math.abs(r);
  if (r > 0) return `rgba(91,110,245,${abs * 0.9})`;
  return `rgba(244,63,94,${abs * 0.9})`;
}

// ── Scatter Plot ───────────────────────────────────────────────────
function drawScatter() {
  const xCol = document.getElementById('scatter-x-select').value;
  const { processedData, target } = AppState;
  if (!xCol || !target) return;

  const points = processedData
    .map(r => ({ x: parseFloat(r[xCol]), y: parseFloat(r[target]) }))
    .filter(p => !isNaN(p.x) && !isNaN(p.y));

  const ctx = document.getElementById('scatter-chart');
  destroyChart('scatter');
  AppState.charts.scatter = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: `${xCol} vs ${target}`,
        data: points,
        backgroundColor: 'rgba(34,211,160,0.55)',
        borderColor: '#22d3a0',
        borderWidth: 1,
        pointRadius: 5,
        pointHoverRadius: 7,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#8a91a8', font: { family: 'DM Sans' } } } },
      scales: {
        x: {
          title: { display: true, text: xCol, color: '#8a91a8' },
          ticks: { color: '#8a91a8' },
          grid: { color: '#2d3448' }
        },
        y: {
          title: { display: true, text: target, color: '#8a91a8' },
          ticks: { color: '#8a91a8' },
          grid: { color: '#2d3448' }
        }
      }
    }
  });
}

// ── Utility ───────────────────────────────────────────────────────
function destroyChart(key) {
  if (AppState.charts[key]) {
    AppState.charts[key].destroy();
    AppState.charts[key] = null;
  }
}
