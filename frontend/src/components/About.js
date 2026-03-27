import React from 'react';

function About() {
  return (
    <div className="about-content">
      {/* Hero */}
      <div className="page-hero">
        <div className="hero-eyebrow">Documentation</div>
        <h1 className="page-title">
          HOW IT<br />
          <span className="highlight">WORKS</span>
        </h1>
        <p className="page-subtitle">
          A complete breakdown of the AI-driven stock prediction system —
          from data collection to model training to real-time predictions.
        </p>
      </div>

      {/* Process Flow */}
      <div className="section-head">
        <div className="section-num">01 — Process</div>
        <div className="section-title">DATA <span className="hl">PIPELINE</span></div>
      </div>

      <div className="flow-row">
        <div className="flow-cell">
          <div className="flow-num">01</div>
          <h4>Data Collection</h4>
          <p>Real-time stock data fetched from Yahoo Finance — historical prices, volume, OHLC data for any publicly traded company.</p>
        </div>
        <div className="flow-cell">
          <div className="flow-num">02</div>
          <h4>Feature Engineering</h4>
          <p>17 technical indicators computed — SMA, EMA, RSI, MACD, Bollinger Bands, volatility metrics, and price momentum signals.</p>
        </div>
        <div className="flow-cell">
          <div className="flow-num">03</div>
          <h4>Model Training</h4>
          <p>Ensemble ML models trained on 80% historical data. Random Forest + Gradient Boosting for direction, Linear Regression for price.</p>
        </div>
        <div className="flow-cell">
          <div className="flow-num">04</div>
          <h4>Prediction</h4>
          <p>Direction (UP/DOWN) with confidence score + predicted closing price for the next trading day and 5-day forecast.</p>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="section-head">
        <div className="section-num">02 — Stack</div>
        <div className="section-title">TECHNOLOGY <span className="hl">USED</span></div>
      </div>

      <div className="tech-row">
        <div className="tech-cell">
          <div className="icon">⚙️</div>
          <h4>Python + Flask</h4>
          <p>Backend REST API serving ML predictions. Handles data fetching, feature computation, model training in real-time.</p>
        </div>
        <div className="tech-cell">
          <div className="icon">◻️</div>
          <h4>React.js</h4>
          <p>Frontend SPA with interactive Recharts visualizations, responsive layout, and real-time API integration.</p>
        </div>
        <div className="tech-cell">
          <div className="icon">◈</div>
          <h4>Scikit-Learn</h4>
          <p>Machine learning library powering RandomForest, GradientBoosting classifiers and LinearRegression models.</p>
        </div>
        <div className="tech-cell">
          <div className="icon">▤</div>
          <h4>Pandas + NumPy</h4>
          <p>Data manipulation and numerical computation for feature engineering and time-series analysis.</p>
        </div>
        <div className="tech-cell">
          <div className="icon">◉</div>
          <h4>Yahoo Finance API</h4>
          <p>Real-time and historical stock market data source — prices, volume, company fundamentals.</p>
        </div>
        <div className="tech-cell">
          <div className="icon">▦</div>
          <h4>Recharts</h4>
          <p>React charting library for interactive area charts, line charts, bar charts, and composed visualizations.</p>
        </div>
      </div>

      {/* Models Explained */}
      <div className="section-head">
        <div className="section-num">03 — Models</div>
        <div className="section-title">ML <span className="hl">ARCHITECTURE</span></div>
      </div>

      <div className="model-explain">
        <div className="model-box">
          <h4>Direction Classification</h4>
          <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1rem' }}>
            Ensemble of two classifiers predicts UP or DOWN for next trading day.
            Probabilities are averaged for final confidence score.
          </p>
          <div className="model-item">
            <h5>Random Forest — 200 Trees</h5>
            <p>Creates 200 decision trees on random data subsets. Each tree votes independently. Majority vote determines prediction. Highly resistant to overfitting.</p>
          </div>
          <div className="model-item">
            <h5>Gradient Boosting — 150 Trees</h5>
            <p>Builds trees sequentially — each corrects errors of previous trees. Excellent at capturing complex non-linear patterns in financial time-series data.</p>
          </div>
        </div>

        <div className="model-box">
          <h4>Price Regression</h4>
          <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1rem' }}>
            Linear Regression predicts exact next-day closing price using all 17 engineered features.
          </p>
          <div className="model-item">
            <h5>17 Technical Features</h5>
            <p>SMA (5, 20, 50) • EMA (12, 26) • MACD + Signal • RSI (14) • Bollinger Width • Returns (1d, 5d, 10d) • Volatility (10d, 20d) • Volume Ratio • Price vs SMA (20, 50)</p>
          </div>
          <div className="model-item">
            <h5>Evaluation Metrics</h5>
            <p><strong style={{ color: 'var(--orange)' }}>Accuracy:</strong> % of correct UP/DOWN predictions on held-out test data.
            <br /><strong style={{ color: 'var(--orange)' }}>MAE:</strong> Mean Absolute Error — average dollar difference between predicted and actual price.</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer">
        <strong>Disclaimer —</strong> This is a final year academic project built for educational purposes.
        Stock market predictions are inherently uncertain. Past performance does not guarantee future results.
        This tool should NOT be used for actual financial decisions. The AI models detect patterns in historical
        data but cannot account for breaking news, market sentiment shifts, or black swan events.
      </div>
    </div>
  );
}

export default About;
