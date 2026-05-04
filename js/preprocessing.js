/**
 * preprocessing.js
 * Handles: missing value imputation, categorical encoding, feature scaling.
 */

// ─── Missing Value Handling ────────────────────────────────────────
function applyMissingValues() {
  if (!AppState.processedData) { showToast('Load a dataset first!', 'error'); return; }

  const strategy = document.getElementById('mv-strategy').value;
  const data = AppState.processedData;
  const cols = AppState.columns;
  const dtypes = AppState.dtypes;

  // Count missing per column
  const missingCounts = {};
  cols.forEach(col => {
    missingCounts[col] = data.filter(r => r[col] === null || r[col] === undefined || r[col] === '').length;
  });

  const infoEl = document.getElementById('missing-value-info');
  const totalMissing = Object.values(missingCounts).reduce((a, b) => a + b, 0);
  infoEl.innerHTML = `<div style="margin-bottom:0.5rem;">
    ${totalMissing === 0
      ? '<span style="color:var(--green)">✓ No missing values found in dataset.</span>'
      : Object.entries(missingCounts).filter(([, v]) => v > 0)
          .map(([k, v]) => `<span class="col-type-chip">${k}: <span class="ctype">${v} missing</span></span>`).join(' ')
    }
  </div>`;

  if (totalMissing === 0) {
    showToast('No missing values to handle.', 'success');
    return;
  }

  const before = snapshotSummary(data, cols, dtypes);

  if (strategy === 'drop') {
    AppState.processedData = data.filter(r =>
      cols.every(col => r[col] !== null && r[col] !== undefined && r[col] !== '')
    );
  } else {
    // Compute fill values
    cols.forEach(col => {
      if (dtypes[col] !== 'numeric') return;
      const vals = data.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '').map(Number);
      let fillVal;
      if (strategy === 'mean') {
        fillVal = vals.reduce((a, b) => a + b, 0) / vals.length;
      } else {
        const sorted = [...vals].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        fillVal = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      }
      AppState.processedData = AppState.processedData.map(r => {
        if (r[col] === null || r[col] === undefined || r[col] === '') {
          return { ...r, [col]: parseFloat(fillVal.toFixed(4)) };
        }
        return r;
      });
    });
  }

  const after = snapshotSummary(AppState.processedData, cols, dtypes);
  renderBeforeAfter('mv-before-after', before, after);
  showToast(`Missing values handled using: ${strategy}`, 'success');
}

// ─── Categorical Encoding ─────────────────────────────────────────
function applyEncoding() {
  if (!AppState.processedData) { showToast('Load a dataset first!', 'error'); return; }

  const method = document.getElementById('encoding-method').value;
  const data = AppState.processedData;
  const catCols = AppState.columns.filter(c => AppState.dtypes[c] === 'categorical');

  const infoEl = document.getElementById('cat-columns-info');
  if (catCols.length === 0) {
    infoEl.innerHTML = '<span style="color:var(--green)">✓ No categorical columns detected.</span>';
    showToast('No categorical columns to encode.', 'success');
    return;
  }

  infoEl.innerHTML = `Categorical columns: ${catCols.map(c => `<span class="col-type-chip">${c}</span>`).join(' ')}`;

  const before = snapshotSummary(data, AppState.columns, AppState.dtypes);
  let newData = data.map(r => ({ ...r }));
  let newColumns = [...AppState.columns];

  catCols.forEach(col => {
    const uniqueVals = [...new Set(data.map(r => r[col]))].sort();

    if (method === 'label') {
      const mapping = {};
      uniqueVals.forEach((v, i) => mapping[v] = i);
      newData = newData.map(r => ({ ...r, [col]: mapping[r[col]] }));
      AppState.dtypes[col] = 'numeric';
    } else {
      // One-hot: add col_VALUE columns, remove original
      uniqueVals.forEach(v => {
        const newCol = `${col}_${v}`;
        if (!newColumns.includes(newCol)) newColumns.push(newCol);
        newData = newData.map(r => ({ ...r, [newCol]: r[col] === v ? 1 : 0 }));
        AppState.dtypes[newCol] = 'numeric';
      });
      newData = newData.map(r => { const copy = { ...r }; delete copy[col]; return copy; });
      newColumns = newColumns.filter(c => c !== col);
      delete AppState.dtypes[col];
    }
  });

  AppState.processedData = newData;
  AppState.columns = newColumns;

  const after = snapshotSummary(newData, newColumns, AppState.dtypes);
  renderBeforeAfter('encoding-before-after', before, after);
  showToast(`Encoding applied: ${method}`, 'success');
  populateFeatureSelector(); // Refresh feature UI
}

// ─── Feature Scaling ─────────────────────────────────────────────
function applyScaling() {
  if (!AppState.processedData) { showToast('Load a dataset first!', 'error'); return; }

  const method = document.getElementById('scaling-method').value;
  if (method === 'none') { showToast('No scaling applied.', 'success'); return; }

  const numericCols = AppState.columns.filter(c => AppState.dtypes[c] === 'numeric');
  const before = snapshotSummary(AppState.processedData, numericCols, AppState.dtypes);

  AppState.scalingParams = {};

  numericCols.forEach(col => {
    const vals = AppState.processedData.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
    const min = Math.min(...vals);
    const max = Math.max(...vals);

    AppState.scalingParams[col] = { method, mean, std, min, max };

    AppState.processedData = AppState.processedData.map(r => {
      let val = parseFloat(r[col]);
      if (isNaN(val)) return r;
      if (method === 'standardize') {
        val = std !== 0 ? (val - mean) / std : 0;
      } else {
        val = (max - min) !== 0 ? (val - min) / (max - min) : 0;
      }
      return { ...r, [col]: parseFloat(val.toFixed(6)) };
    });
  });

  const after = snapshotSummary(AppState.processedData, numericCols, AppState.dtypes);
  renderBeforeAfter('scaling-before-after', before, after);
  showToast(`Scaling applied: ${method}`, 'success');
}

// ─── Finalize Preprocessing & Proceed to EDA ─────────────────────
function finalizePreprocessing() {
  if (!AppState.processedData) { showToast('Load a dataset first!', 'error'); return; }

  // Read target and features from UI
  const targetSel = document.getElementById('target-select');
  if (!targetSel) { showToast('Please expand Feature Selection to set target.', 'error'); return; }

  AppState.target = targetSel.value;
  const checkboxes = document.querySelectorAll('.feature-checkbox:checked');
  AppState.features = Array.from(checkboxes)
    .map(cb => cb.dataset.col)
    .filter(c => c !== AppState.target);

  if (AppState.features.length === 0) {
    showToast('Select at least one feature column.', 'error'); return;
  }

  markStepCompleted(1);
  goToStep(2);
  renderEDA();
  showToast(`Features: [${AppState.features.join(', ')}] → Target: ${AppState.target}`, 'success');
}

// ─── Helpers ─────────────────────────────────────────────────────

/** Snapshot summary statistics for before/after display */
function snapshotSummary(data, cols, dtypes) {
  return cols.map(col => {
    const vals = data.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
    if (dtypes[col] === 'numeric') {
      const nums = vals.map(Number).filter(v => !isNaN(v));
      const mean = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      const min = nums.length ? Math.min(...nums) : 0;
      const max = nums.length ? Math.max(...nums) : 0;
      return { col, type: 'numeric', mean: mean.toFixed(3), min: min.toFixed(3), max: max.toFixed(3) };
    }
    const unique = [...new Set(vals)];
    return { col, type: 'categorical', unique: unique.slice(0, 4).join(', ') };
  });
}

function renderBeforeAfter(containerId, before, after) {
  const el = document.getElementById(containerId);
  const renderRows = (rows) => rows.slice(0, 6).map(r => {
    if (r.type === 'numeric') {
      return `<div class="data-table" style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-dim);padding:0.3rem 0;border-bottom:1px solid var(--border);">
        <strong style="color:var(--text)">${r.col}</strong> mean=${r.mean} | range=[${r.min}, ${r.max}]
      </div>`;
    }
    return `<div style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-dim);padding:0.3rem 0;border-bottom:1px solid var(--border);">
      <strong style="color:var(--text)">${r.col}</strong> cats: ${r.unique}
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="ba-col">
      <h4>BEFORE</h4>
      ${renderRows(before)}
    </div>
    <div class="ba-col after">
      <h4>AFTER</h4>
      ${renderRows(after)}
    </div>
  `;
}

function toggleCV(cb) {
  document.getElementById('cv-controls').style.display = cb.checked ? 'block' : 'none';
}
