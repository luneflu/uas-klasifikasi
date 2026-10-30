# Project Context: Client-Side Data Mining Classification Web App

## 1. Overview & Objective

Build a complete, responsive, client-side web application using **Svelte (SvelteKit with `adapter-static` or Vite + Svelte)** and **Tailwind CSS** for a university Data Mining final exam project. The app will be deployed as a static site on GitHub Pages. All data processing and machine learning calculations must run 100% in the browser using TypeScript/JavaScript (no backend server required).

## 2. Dataset & Case Study

- **Theme:** Online Gaming Player Engagement Classification
- **Default Data:** Load a built-in sample of the dataset (`data/gaming_engagement.csv` or JSON) with the ability for users to upload their own CSV matching the schema.
- **Columns:**
  - Ignored ID: `PlayerID`
  - Numerical Features: `Age`, `PlayTimeHours`, `InGamePurchases` (0 or 1), `SessionsPerWeek`, `AvgSessionDurationMinutes`, `PlayerLevel`, `AchievementsUnlocked`
  - Categorical Features: `Gender` (Male, Female), `Location` (USA, Europe, Asia, Other), `GameGenre` (Strategy, Sports, Action, RPG, Simulation), `GameDifficulty` (Easy, Medium, Hard)
  - **Target Class (`y`):** `EngagementLevel` (`Low`, `Medium`, `High`)

## 3. Navigation & Page Structure (4 Main Tabs)

Model the navigation bar after a classic academic Data Mining system:

1. **Data (`Data`):**
   - Summary cards showing Total Rows, Features Count, and Class Balance (`Low` vs `Medium` vs `High`).
   - Paginated data table displaying the dataset rows.
   - CSV file uploader to replace or append data in memory.
2. **Proses Klasifikasi (`Klasifikasi`):**
   - Configuration form:
     - Select Algorithm: **Gaussian/Categorical Naive Bayes** (primary, because step-by-step probability tables are easy to display) and **K-Nearest Neighbors (KNN)** (with configurable `K` value, default `K = 5`).
     - Train/Test Split Ratio selector (70/30, 80/20, 90/10).
   - "Hitung / Train Model" CTA button.
   - Preview table of the Train/Test split below the form.
3. **Hasil & Prediksi (`Hasil`):**
   - **Evaluation Metrics:** Overall Accuracy (%), macro Precision, Recall, and F1-Score.
   - **Confusion Matrix:** A clean 3x3 visual table comparing Actual vs. Predicted (`Low`, `Medium`, `High`).
   - **Algorithm Transparency Section:** For Naive Bayes, display the Prior Probabilities table $P(Y)$ and Likelihood statistics (Mean/StdDev for numerical, frequency counts for categorical) so the lecturer can verify the math.
   - **Simulasi Prediksi Baru (Live Predictor):** An interactive form where the user inputs a hypothetical player's stats, clicks "Prediksi", and sees the predicted `EngagementLevel` along with class probability percentages.
4. **Grafik (`Grafik`):**
   - Use Chart.js (`chart.js`) to render:
     - Bar chart of Target Class Distribution (`Low`, `Medium`, `High`).
     - Grouped Bar Chart comparing average `PlayTimeHours` and `SessionsPerWeek` across engagement levels.
   - Summary table below the chart listing exact counts and percentages per class.

## 4. Technical Guidelines

- Implement Naive Bayes (using Gaussian distribution for continuous numerical columns and Laplace-smoothed frequency counts for categorical columns) and KNN (using Min-Max normalized Euclidean distance) cleanly in a separate `src/lib/classifier.ts` module.
- Use clean UI styling with Tailwind CSS (dark header navigation bar, clean white cards, blue primary buttons, and clear tabular layouts).
