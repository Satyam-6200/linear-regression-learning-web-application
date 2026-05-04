/**
 * app.js
 * Core application controller: step navigation, accordion, toast, reset.
 */

// ─── Step Navigation ──────────────────────────────────────────────
function goToStep(n) {
  document.querySelectorAll('.step-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  document.getElementById('step-' + n).classList.add('active');
  const navItem = document.querySelector(`[data-step="${n}"]`);
  if (navItem) navItem.classList.add('active');

  // Lazy-render theory tab visuals when entering step 3
  if (n === 3) {
    setTimeout(() => {
      drawLineDemo();
      drawCostViz();
    }, 100);
    if (MathJax) MathJax.typesetPromise();
  }

  // When entering evaluation step
  if (n === 7 && AppState.model) {
    computeMetrics();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Accordion ────────────────────────────────────────────────────
function toggleAccordion(header) {
  const card = header.closest('.accordion-card');
  card.classList.toggle('open');
}

// ─── Toast Notifications ──────────────────────────────────────────
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.className = 'toast';
  }, 3200);
}

// ─── Step Status Tracking ─────────────────────────────────────────
function markStepCompleted(n) {
  const statusEl = document.getElementById('status-' + n);
  const navEl = document.querySelector(`[data-step="${n}"]`);
  if (statusEl) statusEl.textContent = '✓';
  if (navEl) navEl.classList.add('completed');
}

// ─── Train-Test Split bar sync ─────────────────────────────────────
document.getElementById('train-split').addEventListener('input', function () {
  const pct = this.value;
  document.getElementById('split-train-bar').style.width = pct + '%';
});

// ─── Reset App ────────────────────────────────────────────────────
function resetApp() {
  // Reset state
  AppState.rawData = null;
  AppState.columns = [];
  AppState.dtypes = {};
  AppState.processedData = null;
  AppState.features = [];
  AppState.target = '';
  AppState.XTrain = null; AppState.XTest = null;
  AppState.yTrain = null; AppState.yTest = null;
  AppState.model = null;
  AppState.history = [];
  AppState.metrics = null;
  AppState.cvResults = null;

  // Destroy all charts
  Object.keys(AppState.charts).forEach(k => {
    if (AppState.charts[k]) { AppState.charts[k].destroy(); AppState.charts[k] = null; }
  });

  // Reset UI
  document.getElementById('dataset-preview').style.display = 'none';
  document.getElementById('sample-info').style.display = 'none';
  document.getElementById('prediction-result').style.display = 'none';
  document.getElementById('cv-results-card').style.display = 'none';
  document.getElementById('training-log').innerHTML = '';
  document.getElementById('train-progress-bar').style.width = '0%';
  document.getElementById('learned-params').innerHTML = '';
  document.getElementById('prediction-inputs').innerHTML = '';
  document.getElementById('before-after', '').innerHTML = '';

  // Reset status dots
  for (let i = 0; i <= 7; i++) {
    const el = document.getElementById('status-' + i);
    if (el) el.textContent = i === 0 ? '●' : '○';
    const nav = document.querySelector(`[data-step="${i}"]`);
    if (nav) nav.classList.remove('completed');
  }

  ['mse-val','mae-val','r2-val','rmse-val'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '—';
  });

  document.getElementById('r2-card').style.borderColor = '';

  showToast('App reset. Load a new dataset to start.', 'success');
}

// ─── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // MathJax render on initial load
  if (window.MathJax) {
    MathJax.typesetPromise();
  }
  console.log('LinearMind app ready!');
});
