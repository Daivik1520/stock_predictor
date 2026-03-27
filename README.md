<div align="center">

# S.P.A.I

### **Stock Price Artificial Intelligence**

An AI-driven stock price prediction system that uses ensemble Machine Learning models trained on real-time market data to forecast stock price movements.

Built with **Python** | **React.js** | **Flask** | **Scikit-Learn** | **Yahoo Finance API**

---

![Python](https://img.shields.io/badge/Python-3.10+-ff6a00?style=for-the-badge&logo=python&logoColor=white&labelColor=000000)
![React](https://img.shields.io/badge/React-18.x-ff6a00?style=for-the-badge&logo=react&logoColor=white&labelColor=000000)
![Flask](https://img.shields.io/badge/Flask-3.x-ff6a00?style=for-the-badge&logo=flask&logoColor=white&labelColor=000000)
![scikit-learn](https://img.shields.io/badge/Scikit--Learn-ML-ff6a00?style=for-the-badge&logo=scikit-learn&logoColor=white&labelColor=000000)
![License](https://img.shields.io/badge/License-MIT-ff6a00?style=for-the-badge&labelColor=000000)

</div>

---

## Overview

**S.P.A.I** (Stock Price Artificial Intelligence) is a full-stack web application that leverages ensemble Machine Learning models to analyze real stock market data and predict future price movements. The system fetches live data from Yahoo Finance, engineers 17 technical indicators, trains multiple ML models, and delivers predictions through a sleek React-based dashboard.

> **Final Year Project** — Built for academic demonstration of AI/ML in financial forecasting.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React.js)                      │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌───────────┐  │
│  │ Market   │  │ AI Prediction│  │ Technical │  │  How It   │  │
│  │ Overview │  │   Engine     │  │  Charts   │  │   Works   │  │
│  └────┬─────┘  └──────┬───────┘  └─────┬─────┘  └───────────┘  │
│       │               │               │                         │
│       └───────────────┼───────────────┘                         │
│                       │  REST API Calls                         │
└───────────────────────┼─────────────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────────────┐
│                  BACKEND (Flask API)                             │
│                       │                                         │
│  ┌────────────────────▼────────────────────┐                    │
│  │         Data Processing Layer           │                    │
│  │  Yahoo Finance → Pandas → 17 Features   │                    │
│  └────────────────────┬────────────────────┘                    │
│                       │                                         │
│  ┌────────────────────▼────────────────────┐                    │
│  │         ML Model Layer                  │                    │
│  │                                         │                    │
│  │  ┌─────────────┐  ┌─────────────────┐   │                    │
│  │  │Random Forest│  │Gradient Boosting│   │  Direction         │
│  │  │  200 Trees  │  │   150 Trees     │   │  (UP / DOWN)      │
│  │  └──────┬──────┘  └───────┬─────────┘   │                    │
│  │         └──────┬──────────┘             │                    │
│  │           Ensemble Vote                 │                    │
│  │                                         │                    │
│  │  ┌──────────────────────┐               │                    │
│  │  │  Linear Regression   │───────────────│─ Predicted Price   │
│  │  └──────────────────────┘               │                    │
│  └─────────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

### 01 — Market Overview
- **Live stock prices** for 12+ major companies (AAPL, GOOGL, TSLA, NVDA, etc.)
- Real-time data from **Yahoo Finance API**
- Top **gainers** and **losers** sorted automatically
- Click any stock to instantly get AI prediction

### 02 — AI Prediction Engine
- **Direction prediction** (Bullish / Bearish) with confidence percentage
- **Next-day price forecast** with expected price change
- **5-day forecast table** with daily direction, confidence, and % change
- Powered by ensemble of **Random Forest + Gradient Boosting** classifiers
- Price prediction via **Linear Regression**

### 03 — Technical Analysis Charts
Five interactive chart views built with **Recharts**:

| Chart | Description |
|-------|-------------|
| **Price** | 60-day closing price with area fill |
| **AI vs Actual** | Model predictions overlaid on real prices |
| **RSI** | Relative Strength Index with overbought/oversold zones |
| **MACD** | Moving Average Convergence Divergence with histogram |
| **Bollinger** | Bollinger Bands with upper, lower, and mid lines |

### 04 — Model Insights
- **Technical indicators** — RSI signal, MACD trend, SMA crossover, volatility
- **Feature importance** — visual ranking of which indicators matter most
- **Model details** — accuracy, MAE, training/test split, model specs
- Company info — sector, market cap, P/E ratio, 52-week range

---

## ML Models & Features

### Classifiers (Direction: UP / DOWN)

| Model | Trees | Purpose |
|-------|-------|---------|
| **Random Forest** | 200 | Parallel ensemble — each tree votes independently |
| **Gradient Boosting** | 150 | Sequential ensemble — each tree corrects the previous |

> Final prediction = averaged probability from both models

### Regressor (Predicted Price)

| Model | Type | Purpose |
|-------|------|---------|
| **Linear Regression** | Parametric | Predicts exact next-day closing price |

### 17 Engineered Features

```
Moving Averages     SMA (5, 20, 50)  •  EMA (12, 26)
Momentum            MACD  •  MACD Signal  •  RSI (14)
Volatility          Bollinger Width  •  10d Vol  •  20d Vol
Returns             1-day  •  5-day  •  10-day
Volume              Volume Ratio (vs 20d avg)
Position            Price vs SMA-20  •  Price vs SMA-50
```

---

## Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| **Frontend** | React.js 18 | Single-page application with interactive UI |
| **Charts** | Recharts | Area, Line, Bar, Composed chart visualizations |
| **Backend** | Flask + Flask-CORS | REST API serving ML predictions |
| **ML Engine** | Scikit-Learn | RandomForest, GradientBoosting, LinearRegression |
| **Data** | Pandas, NumPy | Feature engineering and data manipulation |
| **Market Data** | yfinance (Yahoo Finance) | Real-time and historical stock data |
| **Styling** | Custom CSS | Dark theme with orange accent (MARK-inspired) |

---

## Project Structure

```
stock_predictor/
│
├── server.py                    # Flask API backend
├── app.py                       # Streamlit version (standalone)
├── .gitignore
├── README.md
│
└── frontend/                    # React application
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js             # Entry point
        ├── index.css            # Global styles & CSS variables
        ├── App.js               # Main app with routing
        ├── App.css              # Full component styles
        └── components/
            ├── Navbar.js        # Navigation bar
            ├── Dashboard.js     # Market overview page
            ├── Predict.js       # AI prediction page
            └── About.js         # How it works page
```

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **npm** or **yarn**

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/Daivik1520/stock_predictor.git
cd stock_predictor
```

**2. Install Python dependencies**
```bash
pip install flask flask-cors yfinance pandas numpy scikit-learn
```

**3. Install React dependencies**
```bash
cd frontend
npm install
cd ..
```

### Running the Application

**Start the backend** (Terminal 1):
```bash
python server.py
```
> Backend runs on `http://localhost:5001`

**Start the frontend** (Terminal 2):
```bash
cd frontend
npm start
```
> Frontend runs on `http://localhost:3000`

Open **http://localhost:3000** in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/predict/<ticker>` | Full AI prediction for a stock |
| `GET` | `/api/market/overview` | Live prices for 12 tracked stocks |

### Sample Response — `/api/predict/AAPL`

```json
{
  "ticker": "AAPL",
  "company_name": "Apple Inc.",
  "current_price": 252.89,
  "prediction": {
    "direction": "UP",
    "confidence": 77.8,
    "predicted_price": 254.39,
    "price_change_pct": 0.59
  },
  "forecast": [
    { "day": 1, "price": 254.39, "direction": "UP", "confidence": 77.8 },
    { "day": 2, "price": 255.12, "direction": "UP", "confidence": 72.3 }
  ],
  "model": {
    "accuracy": 56.1,
    "mae": 3.42
  },
  "indicators": {
    "rsi": 58.3,
    "macd": 1.245,
    "sma_trend": "Bullish"
  }
}
```

---

## Design

The UI follows a **dark premium aesthetic** inspired by modern product landing pages:

- **Color Palette** — Pure black `#0a0a0a` background, dark gray `#111` cards, orange `#ff6a00` accents
- **Typography** — Bold condensed uppercase headings, JetBrains Mono for data
- **Layout** — Numbered sections (01, 02, 03), borderless grid cards, minimal spacing
- **Interactions** — Arrow hover effects, orange glow on focus, pulse animation on AI status

---

## Disclaimer

> This is an **academic project** built for educational purposes. Stock market predictions are inherently uncertain — past performance does not guarantee future results. This tool should **NOT** be used for actual financial decisions. The AI models detect patterns in historical data but cannot account for breaking news, market sentiment, or black swan events.

---

<div align="center">

**S.P.A.I** — Stock Price Artificial Intelligence

Built by **Daivik Reddy**

</div>
