/**
 * model.js
 * Gradient descent linear regression training, visualization, and prediction.
 */

// ─── Data Splitting ────────────────────────────────────────────────
function splitData(data, features, target, trainRatio) {
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  const trainSize = Math.floor(shuffled.length * trainRatio);
  const trainSet = shuffled.slice(0, trainSize);
  const testSet = shuffled.slice(trainSize);

  const toMatrix = (set) => set.map(row => features.map(f => parseFloat(row[f])));
  const toVector = (set) => set.map(row => parseFloat(row[target]));

  return {
    XTrain: toMatrix(trainSet),
    yTrain: toVector(trainSet),
    XTest: toMatrix(testSet),
    yTest: toVector(testSet),
  };
}

// ─── Train Model ───────────────────────────────────────────────────
function trainModel() {
  const { processedData, features, target } = AppState;

  if (!processedData || features.length === 0 || !target) {
    showToast('Complete preprocessing first!', 'error');
    goToStep(1);
    return;
  }

  const trainRatio = parseInt(document.getElementById('train-split').value) / 100;
  const alpha = parseFloat(document.getElementById('learning-rate').value);
  const maxIter = parseInt(document.getElementById('max-iter').value);

  const { XTrain, yTrain, XTest, yTest } = splitData(processedData, features, target, trainRatio);
  AppState.XTrain = XTrain; AppState.yTrain = yTrain;
  AppState.XTest = XTest;   AppState.yTest = yTest;

  const n = features.length;
  let theta = new Array(n + 1).fill(0); // [bias, w1, w2, …]
  const costHistory = [];
  const logEl = document.getElementById('training-log');
  const progressBar = document.getElementById('train-progress-bar');
  logEl.innerHTML = '';

  function addLog(text, highlight = false) {
    logEl.innerHTML += `<div class="log-line${highlight ? ' highlight' : ''}">${text}</div>`;
    logEl.scrollTop = logEl.scrollHeight;
  }

  addLog(`Training on ${XTrain.length} samples, testing on ${XTest.length} samples`);
  addLog(`Learning rate α = ${alpha}, Max iterations = ${maxIter}`);
  addLog(`Features: [${features.join(', ')}] → Target: ${target}`);

  // Gradient Descent
  const recordEvery = Math.max(1, Math.floor(maxIter / 100));

  for (let iter = 0; iter <= maxIter; iter++) {
    // Forward pass
    const predictions = XTrain.map(x => predict(x, theta));
    const errors = predictions.map((p, i) => p - yTrain[i]);

    // Compute cost (MSE / 2)
    const cost = errors.reduce((s, e) => s + e * e, 0) / (2 * XTrain.length);

    if (iter % recordEvery === 0) {
      costHistory.push({ iter, cost });
      progressBar.style.width = (iter / maxIter * 100) + '%';
    }

    // Compute gradients
    const m = XTrain.length;
    const gradients = new Array(n + 1).fill(0);
    for (let i = 0; i < m; i++) {
      gradients[0] += errors[i]; // bias gradient
      for (let j = 0; j < n; j++) {
        gradients[j + 1] += errors[i] * XTrain[i][j];
      }
    }

    // Update parameters
    theta = theta.map((t, j) => t - (alpha / m) * gradients[j]);

    // Early stopping if cost is very small
    if (cost < 1e-8) {
      addLog(`Converged at iteration ${iter} (cost < 1e-8)`, true);
      break;
    }
  }

  progressBar.style.width = '100%';
  addLog(`Training complete! Final cost: ${costHistory[costHistory.length - 1].cost.toFixed(6)}`, true);
  addLog(`θ₀ (intercept) = ${theta[0].toFixed(4)}`);
  features.forEach((f, i) => addLog(`θ${i + 1} (${f}) = ${theta[i + 1].toFixed(4)}`));

  AppState.model = { theta, features };
  AppState.history = costHistory;

  markStepCompleted(4);
  markStepCompleted(5);

  // Render charts
  drawConvergenceChart(costHistory);
  drawRegressionChart(theta);
  renderLearnedParams(theta);
  setupPredictionInputs();
  drawPredVsActual();
  computeMetrics();

  // Cross-validation if enabled
  if (document.getElementById('cv-toggle').checked) {
    runCrossValidation();
  }

  showToast('Model trained successfully!', 'success');
}

// ─── Predict single sample ─────────────────────────────────────────
function predict(xRow, theta) {
  return theta[0] + xRow.reduce((s, x, i) => s + theta[i + 1] * x, 0);
}

// ─── Convergence Chart ─────────────────────────────────────────────
function drawConvergenceChart(history) {
  const ctx = document.getElementById('convergence-chart');
  destroyChart('conv');
  AppState.charts.conv = new Chart(ctx, {
    type: 'line',
    data: {
      labels: history.map(h => h.iter),
      datasets: [{
        label: 'Cost J(θ)',
        data: history.map(h => h.cost),
        borderColor: '#5b6ef5',
        borderWidth: 2,
        fill: true,
        backgroundColor: 'rgba(91,110,245,0.1)',
        pointRadius: 0,
        tension: 0.3,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#8a91a8' } } },
      scales: {
        x: { ticks: { color: '#8a91a8', maxTicksLimit: 8 }, grid: { color: '#2d3448' }, title: { display: true, text: 'Iteration', color: '#545d7a' } },
        y: { ticks: { color: '#8a91a8' }, grid: { color: '#2d3448' }, title: { display: true, text: 'Cost', color: '#545d7a' } }
      }
    }
  });
}

// ─── Regression Line Chart ─────────────────────────────────────────
function drawRegressionChart(theta) {
  const { XTrain, yTrain, features } = AppState;
  // Use first feature for 2D plot
  const x0 = XTrain.map(r => r[0]);
  const minX = Math.min(...x0), maxX = Math.max(...x0);

  // Use average of other features for regression line
  const otherMeans = features.slice(1).map((_, i) =>
    XTrain.reduce((s, r) => s + r[i + 1], 0) / XTrain.length
  );

  const linePoints = [];
  for (let x = minX; x <= maxX; x += (maxX - minX) / 50) {
    const y = predict([x, ...otherMeans], theta);
    linePoints.push({ x, y });
  }

  const scatterData = XTrain.map((xRow, i) => ({ x: xRow[0], y: yTrain[i] }));

  const ctx = document.getElementById('regression-chart');
  destroyChart('reg');
  AppState.charts.reg = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Training data',
          data: scatterData,
          backgroundColor: 'rgba(34,211,160,0.5)',
          borderColor: '#22d3a0',
          borderWidth: 1,
          pointRadius: 4,
          type: 'scatter',
        },
        {
          label: 'Regression line',
          data: linePoints,
          type: 'line',
          borderColor: '#5b6ef5',
          borderWidth: 2.5,
          pointRadius: 0,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#8a91a8' } } },
      scales: {
        x: { ticks: { color: '#8a91a8' }, grid: { color: '#2d3448' }, title: { display: true, text: features[0], color: '#545d7a' } },
        y: { ticks: { color: '#8a91a8' }, grid: { color: '#2d3448' }, title: { display: true, text: AppState.target, color: '#545d7a' } }
      }
    }
  });
}

// ─── Learned Parameters Display ────────────────────────────────────
function renderLearnedParams(theta) {
  const { features } = AppState;
  let html = `<div class="param-chip"><div class="pc-name">θ₀ (intercept / bias)</div><div class="pc-val">${theta[0].toFixed(4)}</div></div>`;
  features.forEach((f, i) => {
    html += `<div class="param-chip"><div class="pc-name">θ${i + 1} (${f})</div><div class="pc-val">${theta[i + 1].toFixed(4)}</div></div>`;
  });

  // Equation string
  const eq = `ŷ = ${theta[0].toFixed(3)} ` +
    features.map((f, i) => `${theta[i + 1] >= 0 ? '+' : ''} ${theta[i + 1].toFixed(3)}·${f}`).join(' ');
  html += `<div style="width:100%;margin-top:0.75rem;font-family:var(--font-mono);font-size:0.8rem;color:var(--cyan);background:var(--bg3);padding:0.75rem 1rem;border-radius:6px;border:1px solid var(--border)">${eq}</div>`;

  document.getElementById('learned-params').innerHTML = html;
}

// ─── Prediction Module ─────────────────────────────────────────────
function setupPredictionInputs() {
  const { features, processedData } = AppState;
  const el = document.getElementById('prediction-inputs');
  const sample = processedData[0];

  el.innerHTML = features.map(f => `
    <div class="pred-input-group">
      <label>${f}</label>
      <input type="number" class="input-field pred-input" id="pred-${f}"
        value="${parseFloat(sample[f]).toFixed(3)}" step="any" style="width:150px">
    </div>
  `).join('');
}

function computePrediction() {
  const { features, model } = AppState;
  if (!model) { showToast('Train the model first!', 'error'); return; }

  const xVals = features.map(f => {
    const val = parseFloat(document.getElementById('pred-' + f).value);
    return isNaN(val) ? 0 : val;
  });

  const { theta } = model;
  const contributions = xVals.map((x, i) => theta[i + 1] * x);
  const predicted = theta[0] + contributions.reduce((s, c) => s + c, 0);

  const resultEl = document.getElementById('prediction-result');
  resultEl.style.display = 'block';

  const steps = document.getElementById('prediction-steps');
  steps.innerHTML = `
    <div class="pred-step">
      <div class="ps-label">STEP 1 — Input values</div>
      ${features.map((f, i) => `${f} = <strong style="color:var(--cyan)">${xVals[i]}</strong>`).join('<br>')}
    </div>
    <div class="pred-step">
      <div class="ps-label">STEP 2 — Apply learned hypothesis</div>
      ŷ = θ₀ + Σ(θⱼ · xⱼ)<br>
      ŷ = ${theta[0].toFixed(4)}
      ${features.map((f, i) => ` + (${theta[i + 1].toFixed(4)} × ${xVals[i]})`).join('')}<br>
      ŷ = ${theta[0].toFixed(4)} + ${contributions.reduce((s, c) => s + c, 0).toFixed(4)}
    </div>
  `;

  document.getElementById('prediction-final').innerHTML = `
    <div class="pf-label">PREDICTED VALUE (${AppState.target})</div>
    <div class="pf-value">${predicted.toFixed(4)}</div>
  `;
}

// ─── Predicted vs Actual Chart ─────────────────────────────────────
function drawPredVsActual() {
  const { XTest, yTest, model } = AppState;
  if (!model) return;

  const predicted = XTest.map(x => predict(x, model.theta));
  const maxVal = Math.max(...yTest, ...predicted);

  const ctx = document.getElementById('pred-vs-actual-chart');
  destroyChart('pva');
  AppState.charts.pva = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Predictions vs Actual',
          data: yTest.map((y, i) => ({ x: y, y: predicted[i] })),
          backgroundColor: 'rgba(91,110,245,0.55)',
          borderColor: '#5b6ef5',
          pointRadius: 5,
        },
        {
          label: 'Perfect fit (y=x)',
          data: [{ x: 0, y: 0 }, { x: maxVal, y: maxVal }],
          type: 'line',
          borderColor: '#22d3a0',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#8a91a8' } } },
      scales: {
        x: { title: { display: true, text: 'Actual', color: '#545d7a' }, ticks: { color: '#8a91a8' }, grid: { color: '#2d3448' } },
        y: { title: { display: true, text: 'Predicted', color: '#545d7a' }, ticks: { color: '#8a91a8' }, grid: { color: '#2d3448' } }
      }
    }
  });
}

// ─── Cross-Validation ──────────────────────────────────────────────
function runCrossValidation() {
  const { processedData, features, target } = AppState;
  const k = parseInt(document.getElementById('k-value').value);
  const alpha = parseFloat(document.getElementById('learning-rate').value);
  const maxIter = parseInt(document.getElementById('max-iter').value);

  const data = [...processedData].sort(() => Math.random() - 0.5);
  const foldSize = Math.floor(data.length / k);
  const results = [];

  for (let fold = 0; fold < k; fold++) {
    const valSet = data.slice(fold * foldSize, (fold + 1) * foldSize);
    const trainSet = [...data.slice(0, fold * foldSize), ...data.slice((fold + 1) * foldSize)];

    const XTr = trainSet.map(r => features.map(f => parseFloat(r[f])));
    const yTr = trainSet.map(r => parseFloat(r[target]));
    const XVal = valSet.map(r => features.map(f => parseFloat(r[f])));
    const yVal = valSet.map(r => parseFloat(r[target]));

    let theta = new Array(features.length + 1).fill(0);
    const m = XTr.length;

    for (let iter = 0; iter < maxIter; iter++) {
      const errors = XTr.map((x, i) => predict(x, theta) - yTr[i]);
      const grads = new Array(features.length + 1).fill(0);
      for (let i = 0; i < m; i++) {
        grads[0] += errors[i];
        for (let j = 0; j < features.length; j++) grads[j + 1] += errors[i] * XTr[i][j];
      }
      theta = theta.map((t, j) => t - (alpha / m) * grads[j]);
    }

    const preds = XVal.map(x => predict(x, theta));
    const r2 = computeR2(yVal, preds);
    const mse = preds.reduce((s, p, i) => s + (p - yVal[i]) ** 2, 0) / preds.length;
    results.push({ fold: fold + 1, r2, mse });
  }

  AppState.cvResults = results;
  renderCVResults(results);
}

function renderCVResults(results) {
  const card = document.getElementById('cv-results-card');
  card.style.display = 'block';

  const meanR2 = results.reduce((s, r) => s + r.r2, 0) / results.length;
  const meanMSE = results.reduce((s, r) => s + r.mse, 0) / results.length;

  let html = '<div class="cv-fold-grid">';
  results.forEach(r => {
    html += `<div class="cv-fold-chip">
      <div class="fold-label">Fold ${r.fold}</div>
      <div class="fold-r2">R² = ${r.r2.toFixed(4)}</div>
      <div style="font-size:0.7rem;color:var(--text-muted)">MSE = ${r.mse.toFixed(2)}</div>
    </div>`;
  });
  html += '</div>';
  html += `<div class="cv-summary">
    Mean R² across ${results.length} folds: <strong style="color:var(--cyan)">${meanR2.toFixed(4)}</strong> &nbsp;|&nbsp;
    Mean MSE: <strong style="color:var(--cyan)">${meanMSE.toFixed(4)}</strong>
  </div>`;

  document.getElementById('cv-results-content').innerHTML = html;
}
