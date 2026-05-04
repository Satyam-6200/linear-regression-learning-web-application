# linear-regression-learning-web-application
# Linear regression — Interactive Linear Regression Learning System

---

## 📁 Project Structure

```
linear-regression-app/
├── index.html              ← Main application (open this in browser)
├── css/
│   └── style.css           ← All styling (dark academic theme)
├── js/
│   ├── data.js             ← Dataset loading, CSV parsing, sample data
│   ├── preprocessing.js    ← Missing values, encoding, scaling
│   ├── eda.js              ← Histograms, correlation matrix, scatter plots
│   ├── theory.js           ← Interactive line demo, cost viz, walkthrough
│   ├── model.js            ← Gradient descent, training, prediction
│   ├── evaluation.js       ← MSE, MAE, R², RMSE metrics
│   └── app.js              ← Navigation, accordion, toast, reset
└── data/
    └── housing_sample.csv  ← Sample dataset (50 rows, housing prices)
```

---

## 🚀 How to Run

### Option 1: VS Code (Recommended)
1. Install the **Live Server** extension in VS Code
2. Open the `linear-regression-app/` folder in VS Code
3. Right-click `index.html` → **Open with Live Server**
4. The app opens at `http://127.0.0.1:5500`

### Option 2: Direct Browser
1. Open `index.html` directly in Chrome / Firefox / Edge
   > ⚠️ Some browsers block local file access for fetch() — use Live Server if CSV upload fails.

### Option 3: Python HTTP Server
```bash
cd linear-regression-app
python -m http.server 8080
# Open h8080ttp://localhost:
```

---

## 🎓 Features Implemented

### Step 01 — Dataset Input
- ✅ CSV file upload (drag & drop or click)
- ✅ Sample housing dataset (auto-generated)
- ✅ Dataset preview table (first 8 rows)
- ✅ Shape info, data types per column

### Step 02 — Preprocessing
- ✅ Missing value handling (mean/median imputation, drop rows)
- ✅ Categorical encoding (Label Encoding, One-Hot Encoding)
- ✅ Feature scaling (Standardization z-score, Min-Max Normalization)
- ✅ Feature & Target selection UI
- ✅ Before/After comparison for each step
- ✅ "Why this step?" explanations for every option

### Step 03 — EDA
- ✅ Feature distribution histograms (interactive column selector)
- ✅ Pearson correlation matrix (color-coded heatmap)
- ✅ Feature vs Target scatter plot

### Step 04 — Linear Regression Theory
- ✅ Simple Linear Regression — interactive demo (drag θ₀, θ₁ sliders)
- ✅ Multiple Linear Regression — matrix form explanation
- ✅ Cost Function (MSE) — formula + parabola visualization
- ✅ Gradient Descent — update rule derivation
- ✅ Step-by-step computation on actual data sample

### Step 05 — Training Configuration
- ✅ Train-Test Split (user-controlled slider 50–90%)
- ✅ K-Fold Cross-Validation (toggle, user-defined K)
- ✅ Learning rate α input
- ✅ Max iterations input

### Step 06 — Model Training & Visualization
- ✅ Gradient descent with live progress bar + log
- ✅ Cost convergence chart
- ✅ Regression line on scatter plot
- ✅ Learned parameters display (θ₀, θ₁, …, θₙ)
- ✅ Full equation display

### Step 07 — Prediction & Inference
- ✅ User input form for new sample
- ✅ Step-by-step prediction computation shown
- ✅ Predicted vs Actual chart (test set)

### Step 08 — Evaluation Metrics
- ✅ MSE, MAE, R², RMSE with formulas
- ✅ Color-coded R² quality indicator
- ✅ Cross-validation fold results (if enabled)

---

## 🛠 Tech Stack

| Tool | Purpose |
|------|---------|
| Vanilla HTML/CSS/JS | Core application (no framework needed) |
| Chart.js 4.4 | All charts (histograms, scatter, convergence) |
| PapaParse 5.4 | CSV parsing |
| MathJax 3 | LaTeX formula rendering |
| Google Fonts | Syne + Space Mono + DM Sans |

No build step required. No npm. No bundler. Just open and run.

---

## 📝 Notes

- All ML computations (gradient descent, metrics) are implemented from scratch in pure JavaScript.
- No scikit-learn or Python used — fully browser-native.
- The app supports multiple features (Multiple Linear Regression) and visualizes using the first feature for the 2D regression line chart.

---

*Machine Learning · Interactive Learning System*
