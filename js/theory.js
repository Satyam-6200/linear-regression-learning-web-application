/**
 * theory.js
 * Theory tab UI, interactive line demo, cost function visualization,
 * and step-by-step computation walkthrough.
 */

// ─── Tab Switcher ─────────────────────────────────────────────────
function showTheoryTab(name, btn) {
  document.querySelectorAll('.theory-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('theory-' + name).classList.add('active');
  btn.classList.add('active');

  // Lazy render
  if (name === 'simple') drawLineDemo();
  if (name === 'cost') drawCostViz();
  if (name === 'walkthrough') renderWalkthrough();
}

// ─── Interactive Line Demo ─────────────────────────────────────────
function updateLineDemoVal(id, val) {
  document.getElementById(id).textContent = parseFloat(val).toFixed(1);
}

function drawLineDemo() {
  const canvas = document.getElementById('line-demo-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const theta0 = parseFloat(document.getElementById('theta0-slider')?.value || 0);
  const theta1 = parseFloat(document.getElementById('theta1-slider')?.value || 1);

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#12151c';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#2d3448';
  ctx.lineWidth = 1;
  const pad = 40;
  for (let i = 0; i <= 10; i++) {
    const x = pad + i * (W - 2 * pad) / 10;
    const y = pad + i * (H - 2 * pad) / 10;
    ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = '#3a4260';
  ctx.lineWidth = 2;
  // x-axis (y=0)
  const y0 = mapY(0, theta0, theta1, H, pad);
  ctx.beginPath(); ctx.moveTo(pad, Math.max(pad, Math.min(H - pad, y0))); ctx.lineTo(W - pad, Math.max(pad, Math.min(H - pad, y0))); ctx.stroke();
  // y-axis
  ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, H - pad); ctx.stroke();

  // Scatter points (random but seeded)
  const points = generateDemoPoints();
  ctx.fillStyle = 'rgba(34,211,160,0.7)';
  points.forEach(([px, py]) => {
    const cx = mapX(px, W, pad);
    const cy = mapY(py, theta0, theta1, H, pad);
    // Draw actual y (data)
    const dataY = mapYData(py, H, pad);
    ctx.beginPath();
    ctx.arc(cx, dataY, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Error lines (residuals)
  ctx.strokeStyle = 'rgba(244,63,94,0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  points.forEach(([px, py]) => {
    const cx = mapX(px, W, pad);
    const lineY = mapY(py, theta0, theta1, H, pad);
    const dataY = mapYData(py, H, pad);
    ctx.beginPath(); ctx.moveTo(cx, dataY); ctx.lineTo(cx, lineY); ctx.stroke();
  });
  ctx.setLineDash([]);

  // Regression line
  ctx.strokeStyle = '#5b6ef5';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const x1 = -1, x2 = 11;
  ctx.moveTo(mapX(x1, W, pad), mapYReg(theta0 + theta1 * x1, H, pad));
  ctx.lineTo(mapX(x2, W, pad), mapYReg(theta0 + theta1 * x2, H, pad));
  ctx.stroke();

  // Label
  ctx.fillStyle = '#5b6ef5';
  ctx.font = '12px Space Mono';
  ctx.fillText(`ŷ = ${theta0.toFixed(1)} + ${theta1.toFixed(1)}x`, W - 190, 20);

  // Axes labels
  ctx.fillStyle = '#545d7a';
  ctx.font = '11px DM Sans';
  ctx.fillText('x', W - pad + 5, H / 2);
  ctx.fillText('y', pad - 10, 20);
}

function generateDemoPoints() {
  const pts = [];
  for (let i = 0; i < 12; i++) {
    const x = 1 + i * 0.8;
    const noise = (Math.sin(i * 3.7) * 1.2);
    const y = 0.5 + 0.8 * x + noise;
    pts.push([x, y]);
  }
  return pts;
}

// Coordinate mapping utilities
function mapX(x, W, pad) { return pad + (x / 12) * (W - 2 * pad); }
function mapYReg(y, H, pad) { return H - pad - ((y + 2) / 12) * (H - 2 * pad); }
function mapYData(y, H, pad) { return H - pad - ((y + 2) / 12) * (H - 2 * pad); }
function mapY(y, theta0, theta1, H, pad) {
  // For the scatter y value, map directly
  return mapYData(y, H, pad);
}

// ─── Cost Function Visualization ─────────────────────────────────
function drawCostViz() {
  const canvas = document.getElementById('cost-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#12151c';
  ctx.fillRect(0, 0, W, H);

  const pad = 40;
  const pts = generateDemoPoints();

  // Draw J(theta1) parabola holding theta0 = 0
  const steps = 100;
  const t1range = [-2, 4];
  const costValues = [];

  for (let s = 0; s <= steps; s++) {
    const t1 = t1range[0] + (s / steps) * (t1range[1] - t1range[0]);
    const cost = pts.reduce((sum, [x, y]) => sum + (y - t1 * x) ** 2, 0) / (2 * pts.length);
    costValues.push({ t1, cost });
  }

  const maxCost = Math.max(...costValues.map(c => c.cost));
  const mapCX = t1 => pad + ((t1 - t1range[0]) / (t1range[1] - t1range[0])) * (W - 2 * pad);
  const mapCY = c => H - pad - (c / maxCost) * (H - 2 * pad);

  // Grid
  ctx.strokeStyle = '#2d3448'; ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i++) {
    const y = pad + i * (H - 2 * pad) / 6;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  }

  // Cost curve
  ctx.strokeStyle = '#5b6ef5'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  costValues.forEach((cv, i) => {
    const cx = mapCX(cv.t1), cy = mapCY(cv.cost);
    if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
  });
  ctx.stroke();

  // Mark minimum
  const minCV = costValues.reduce((a, b) => a.cost < b.cost ? a : b);
  ctx.fillStyle = '#22d3a0';
  ctx.beginPath();
  ctx.arc(mapCX(minCV.t1), mapCY(minCV.cost), 6, 0, Math.PI * 2);
  ctx.fill();

  // Labels
  ctx.fillStyle = '#8a91a8'; ctx.font = '11px Space Mono';
  ctx.fillText('θ₁', W - pad + 4, H / 2);
  ctx.fillText('J(θ)', pad + 2, 16);
  ctx.fillStyle = '#22d3a0';
  ctx.fillText('minimum', mapCX(minCV.t1) + 8, mapCY(minCV.cost) - 8);
}

// ─── Step-by-Step Walkthrough ────────────────────────────────────
function renderWalkthrough() {
  const el = document.getElementById('walkthrough-content');
  const { processedData, features, target } = AppState;

  if (!processedData || features.length === 0 || !target) {
    el.innerHTML = '<div class="info-box">Complete Preprocessing first (Step 2) to see a live walkthrough.</div>';
    return;
  }

  const sample = processedData[0];
  const xVals = features.map(f => parseFloat(sample[f]));
  const yVal = parseFloat(sample[target]);

  // Use simple hypothetical theta for demo
  const theta0 = 1.0;
  const thetas = features.map((_, i) => (i + 1) * 0.5);

  const predicted = theta0 + xVals.reduce((s, x, i) => s + thetas[i] * x, 0);
  const error = predicted - yVal;
  const squaredError = error ** 2;

  let html = `
    <div class="info-box">
      Using sample #1 from your dataset with hypothetical parameters (θ₀=1.0, θ=[${thetas.map(t => t.toFixed(1)).join(', ')}])
    </div>

    <div class="prediction-steps">
      <div class="pred-step">
        <div class="ps-label">STEP 1 — Feature values for sample #1</div>
        ${features.map((f, i) => `x${i + 1} = ${f} = <strong style="color:var(--cyan)">${xVals[i]}</strong>`).join('<br>')}
        <br>y (actual) = <strong style="color:var(--green)">${yVal}</strong>
      </div>

      <div class="pred-step">
        <div class="ps-label">STEP 2 — Apply hypothesis h_θ(x) = θ₀ + θ₁x₁ + … + θₙxₙ</div>
        ŷ = ${theta0} + ${features.map((f, i) => `(${thetas[i].toFixed(1)} × ${xVals[i].toFixed(4)})`).join(' + ')}
        <br>ŷ = <strong style="color:var(--accent)">${predicted.toFixed(4)}</strong>
      </div>

      <div class="pred-step">
        <div class="ps-label">STEP 3 — Compute error (residual)</div>
        error = ŷ − y = ${predicted.toFixed(4)} − ${yVal} = <strong style="color:var(--red)">${error.toFixed(4)}</strong>
      </div>

      <div class="pred-step">
        <div class="ps-label">STEP 4 — Compute squared error</div>
        (error)² = (${error.toFixed(4)})² = <strong style="color:var(--amber)">${squaredError.toFixed(4)}</strong>
      </div>

      <div class="pred-step">
        <div class="ps-label">STEP 5 — Gradient descent update (for θ₀)</div>
        θ₀ := θ₀ − α × error × x₀ = 1.0 − 0.01 × ${error.toFixed(4)} × 1 = <strong style="color:var(--cyan)">${(1.0 - 0.01 * error).toFixed(4)}</strong>
      </div>
    </div>
    <div class="why-box">This walkthrough uses hypothetical θ values. After training (Step 6), the model will have learned optimal values that minimize J(θ) over the entire dataset.</div>
  `;

  el.innerHTML = html;
}
