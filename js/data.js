/**
 * data.js
 * Handles dataset loading, CSV parsing, and sample dataset generation.
 */

// ─── Global State ─────────────────────────────────────────────────
window.AppState = {
  rawData: null,          // Parsed CSV rows (array of objects)
  columns: [],            // Column names
  dtypes: {},             // Column → 'numeric' | 'categorical'
  processedData: null,    // After preprocessing
  features: [],           // Selected feature column names
  target: '',             // Selected target column name
  XTrain: null, XTest: null,
  yTrain: null, yTest: null,
  model: null,            // Trained model result
  history: [],            // Cost history
  charts: {}              // Chart.js instances (for destruction before re-creation)
};

// ─── Sample Dataset (Housing Prices) ─────────────────────────────
function generateSampleDataset() {
  const data = [];
  const seed = 42;
  function seededRand(i, offset) {
    const x = Math.sin(i * 9301 + offset * 49297 + seed) * 233280;
    return x - Math.floor(x);
  }

  for (let i = 0; i < 50; i++) {
    const area = Math.round(500 + seededRand(i, 1) * 2500);
    const rooms = Math.round(1 + seededRand(i, 2) * 5);
    const age = Math.round(seededRand(i, 3) * 40);
    const location = ['Urban', 'Suburban', 'Rural'][Math.floor(seededRand(i, 4) * 3)];
    const noise = (seededRand(i, 5) - 0.5) * 20000;
    const price = Math.round(100000 + area * 45 + rooms * 15000 - age * 800 + noise);
    data.push({ area, rooms, age, location, price });
  }
  return data;
}

// ─── Load Sample Dataset ─────────────────────────────────────────
function loadSampleDataset() {
  const data = generateSampleDataset();
  AppState.rawData = data;
  AppState.columns = Object.keys(data[0]);
  AppState.dtypes = inferDtypes(data, AppState.columns);
  AppState.processedData = data.map(row => ({ ...row }));

  document.getElementById('sample-info').style.display = 'flex';
  showDatasetPreview();
  showToast('Sample housing dataset loaded! (50 rows, 5 columns)', 'success');
  markStepCompleted(0);
}

// ─── CSV File Upload ─────────────────────────────────────────────
document.getElementById('csv-file-input').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    complete: function (results) {
      if (results.errors.length > 0) {
        showToast('CSV parse error: ' + results.errors[0].message, 'error');
        return;
      }
      AppState.rawData = results.data;
      AppState.columns = results.meta.fields;
      AppState.dtypes = inferDtypes(results.data, results.meta.fields);
      AppState.processedData = results.data.map(row => ({ ...row }));
      showDatasetPreview();
      showToast(`Loaded ${results.data.length} rows × ${results.meta.fields.length} columns`, 'success');
      markStepCompleted(0);
    },
    error: function (err) {
      showToast('Failed to parse CSV: ' + err.message, 'error');
    }
  });
});

// Drag and drop support
const uploadZone = document.getElementById('upload-zone');
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith('.csv')) {
    document.getElementById('csv-file-input').files = e.dataTransfer.files;
    document.getElementById('csv-file-input').dispatchEvent(new Event('change'));
  } else {
    showToast('Please drop a CSV file.', 'error');
  }
});

// ─── Infer Data Types ─────────────────────────────────────────────
function inferDtypes(data, columns) {
  const dtypes = {};
  columns.forEach(col => {
    const vals = data.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
    const numericCount = vals.filter(v => typeof v === 'number' || (!isNaN(parseFloat(v)) && isFinite(v))).length;
    dtypes[col] = numericCount > vals.length * 0.8 ? 'numeric' : 'categorical';
  });
  return dtypes;
}

// ─── Show Dataset Preview ─────────────────────────────────────────
function showDatasetPreview() {
  const { rawData, columns, dtypes } = AppState;
  const preview = document.getElementById('dataset-preview');
  preview.style.display = 'block';

  // Meta tags
  const meta = document.getElementById('dataset-meta');
  meta.innerHTML = `
    <span class="tag">${rawData.length} rows</span>
    <span class="tag">${columns.length} columns</span>
    <span class="tag">${Object.values(dtypes).filter(t => t === 'numeric').length} numeric</span>
    <span class="tag">${Object.values(dtypes).filter(t => t === 'categorical').length} categorical</span>
  `;

  // Table (first 8 rows)
  const table = document.getElementById('preview-table');
  const head = '<thead><tr>' + columns.map(c => `<th>${c}</th>`).join('') + '</tr></thead>';
  const rows = rawData.slice(0, 8).map(row =>
    '<tr>' + columns.map(c => `<td>${row[c] ?? '—'}</td>`).join('') + '</tr>'
  ).join('');
  table.innerHTML = head + '<tbody>' + rows + '</tbody>';

  // Column type chips
  const typesEl = document.getElementById('column-types');
  typesEl.innerHTML = columns.map(c =>
    `<div class="col-type-chip">${c}<span class="ctype">${dtypes[c]}</span></div>`
  ).join('');

  // Populate preprocessing feature selector
  populateFeatureSelector();
}

// ─── Populate feature/target selector in Preprocessing ────────────
function populateFeatureSelector() {
  const { columns, dtypes } = AppState;
  const ui = document.getElementById('feature-selection-ui');

  let html = `<div class="feature-sel-row">
    <label>Target (Y) column:</label>
    <select id="target-select">
      ${columns.map(c => `<option value="${c}" ${c === columns[columns.length - 1] ? 'selected' : ''}>${c}</option>`).join('')}
    </select>
  </div>
  <div style="margin-top:0.75rem; font-family:var(--font-mono); font-size:0.72rem; color:var(--text-muted);">FEATURE COLUMNS (X):</div>`;

  columns.forEach(c => {
    html += `<div class="feature-sel-row">
      <label>${c} <span style="color:var(--text-muted);font-size:0.72rem;">(${dtypes[c]})</span></label>
      <label class="toggle-switch">
        <input type="checkbox" class="feature-checkbox" data-col="${c}" ${c !== columns[columns.length - 1] ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    </div>`;
  });

  ui.innerHTML = html;
}
