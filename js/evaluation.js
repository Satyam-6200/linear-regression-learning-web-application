/**
 * evaluation.js
 * Compute and display evaluation metrics: MSE, MAE, R², RMSE.
 */

function computeMetrics() {
  const { XTest, yTest, model } = AppState;
  if (!model || !XTest || XTest.length === 0) return;

  const predicted = XTest.map(x => predict(x, model.theta));

  const mse  = computeMSE(yTest, predicted);
  const mae  = computeMAE(yTest, predicted);
  const r2   = computeR2(yTest, predicted);
  const rmse = Math.sqrt(mse);

  AppState.metrics = { mse, mae, r2, rmse };

  animateMetric('mse-val', mse.toFixed(4));
  animateMetric('mae-val', mae.toFixed(4));
  animateMetric('r2-val',  r2.toFixed(4));
  animateMetric('rmse-val', rmse.toFixed(4));

  // Color R² card based on quality
  const r2Card = document.getElementById('r2-card');
  if (r2 >= 0.9)       r2Card.style.borderColor = 'var(--green)';
  else if (r2 >= 0.7)  r2Card.style.borderColor = 'var(--amber)';
  else                 r2Card.style.borderColor = 'var(--red)';

  markStepCompleted(6);
  markStepCompleted(7);
}

function computeMSE(actual, predicted) {
  return predicted.reduce((s, p, i) => s + (p - actual[i]) ** 2, 0) / predicted.length;
}

function computeMAE(actual, predicted) {
  return predicted.reduce((s, p, i) => s + Math.abs(p - actual[i]), 0) / predicted.length;
}

function computeR2(actual, predicted) {
  const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
  const ssTot = actual.reduce((s, y) => s + (y - mean) ** 2, 0);
  const ssRes = predicted.reduce((s, p, i) => s + (p - actual[i]) ** 2, 0);
  return ssTot === 0 ? 1 : 1 - ssRes / ssTot;
}

function animateMetric(id, value) {
  const el = document.getElementById(id);
  el.style.opacity = 0;
  setTimeout(() => {
    el.textContent = value;
    el.style.transition = 'opacity 0.5s ease';
    el.style.opacity = 1;
  }, 100);
}
