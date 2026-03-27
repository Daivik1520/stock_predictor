from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, mean_absolute_error
import warnings

warnings.filterwarnings("ignore")

app = Flask(__name__)
CORS(app)

FEATURE_COLS = [
    "SMA_5", "SMA_20", "SMA_50", "EMA_12", "EMA_26",
    "MACD", "MACD_Signal", "RSI",
    "BB_Width", "Return_1d", "Return_5d", "Return_10d",
    "Volatility_10d", "Volatility_20d", "Volume_Ratio",
    "Price_vs_SMA20", "Price_vs_SMA50",
]


def compute_features(df):
    df = df.copy()
    df["SMA_5"] = df["Close"].rolling(5).mean()
    df["SMA_20"] = df["Close"].rolling(20).mean()
    df["SMA_50"] = df["Close"].rolling(50).mean()
    df["EMA_12"] = df["Close"].ewm(span=12).mean()
    df["EMA_26"] = df["Close"].ewm(span=26).mean()
    df["MACD"] = df["EMA_12"] - df["EMA_26"]
    df["MACD_Signal"] = df["MACD"].ewm(span=9).mean()

    delta = df["Close"].diff()
    gain = delta.where(delta > 0, 0).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss
    df["RSI"] = 100 - (100 / (1 + rs))

    df["BB_Mid"] = df["Close"].rolling(20).mean()
    bb_std = df["Close"].rolling(20).std()
    df["BB_Upper"] = df["BB_Mid"] + 2 * bb_std
    df["BB_Lower"] = df["BB_Mid"] - 2 * bb_std
    df["BB_Width"] = (df["BB_Upper"] - df["BB_Lower"]) / df["BB_Mid"]

    df["Return_1d"] = df["Close"].pct_change(1)
    df["Return_5d"] = df["Close"].pct_change(5)
    df["Return_10d"] = df["Close"].pct_change(10)
    df["Volatility_10d"] = df["Return_1d"].rolling(10).std()
    df["Volatility_20d"] = df["Return_1d"].rolling(20).std()
    df["Volume_SMA_20"] = df["Volume"].rolling(20).mean()
    df["Volume_Ratio"] = df["Volume"] / df["Volume_SMA_20"]
    df["Price_vs_SMA20"] = (df["Close"] - df["SMA_20"]) / df["SMA_20"]
    df["Price_vs_SMA50"] = (df["Close"] - df["SMA_50"]) / df["SMA_50"]

    df["Target"] = (df["Close"].shift(-1) > df["Close"]).astype(int)
    df["Next_Close"] = df["Close"].shift(-1)
    return df


def run_prediction(ticker, period="1y"):
    df = yf.download(ticker, period=period, progress=False)
    if df.empty:
        return None

    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    current_price = float(df["Close"].iloc[-1])
    prev_close = float(df["Close"].iloc[-2])
    data = compute_features(df)
    data = data.dropna(subset=FEATURE_COLS + ["Target", "Next_Close"])

    X = data[FEATURE_COLS]
    y_cls = data["Target"]
    y_reg = data["Next_Close"]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    split = int(len(X_scaled) * 0.8)
    X_train, X_test = X_scaled[:split], X_scaled[split:]
    y_cls_train, y_cls_test = y_cls.iloc[:split], y_cls.iloc[split:]
    y_reg_train, y_reg_test = y_reg.iloc[:split], y_reg.iloc[split:]

    # Ensemble classifier
    rf = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
    gb = GradientBoostingClassifier(n_estimators=150, max_depth=5, random_state=42)
    rf.fit(X_train, y_cls_train)
    gb.fit(X_train, y_cls_train)

    ensemble_pred = ((rf.predict_proba(X_test)[:, 1] + gb.predict_proba(X_test)[:, 1]) / 2 >= 0.5).astype(int)
    accuracy = accuracy_score(y_cls_test, ensemble_pred)

    # Regressor
    lr = LinearRegression()
    lr.fit(X_train, y_reg_train)
    reg_pred = lr.predict(X_test)
    mae = mean_absolute_error(y_reg_test, reg_pred)

    # Predict next day
    latest = X_scaled[-1].reshape(1, -1)
    prob_up = float((rf.predict_proba(latest)[:, 1] + gb.predict_proba(latest)[:, 1]) / 2)
    predicted_price = float(lr.predict(latest)[0])
    direction = "UP" if prob_up >= 0.5 else "DOWN"

    # Multi-day forecast (5 days ahead)
    forecast = []
    last_features = X_scaled[-1].copy()
    last_price = current_price
    for day in range(1, 6):
        p = float(lr.predict(last_features.reshape(1, -1))[0])
        d_prob = float((rf.predict_proba(last_features.reshape(1, -1))[:, 1] +
                        gb.predict_proba(last_features.reshape(1, -1))[:, 1]) / 2)
        forecast.append({
            "day": day,
            "price": round(p, 2),
            "direction": "UP" if d_prob >= 0.5 else "DOWN",
            "confidence": round(d_prob * 100 if d_prob >= 0.5 else (1 - d_prob) * 100, 1),
            "change_pct": round((p - last_price) / last_price * 100, 2),
        })
        last_price = p

    # Feature importance
    importances = sorted(
        [{"feature": f, "importance": round(float(v), 4)} for f, v in zip(FEATURE_COLS, rf.feature_importances_)],
        key=lambda x: x["importance"], reverse=True
    )

    # Price history (60 days)
    recent = df.tail(60)
    price_history = [
        {
            "date": d.strftime("%Y-%m-%d"),
            "open": round(float(o), 2),
            "high": round(float(h), 2),
            "low": round(float(l), 2),
            "close": round(float(c), 2),
            "volume": int(v),
        }
        for d, o, h, l, c, v in zip(recent.index, recent["Open"], recent["High"],
                                      recent["Low"], recent["Close"], recent["Volume"])
    ]

    # Test set predictions
    test_results = [
        {"date": d.strftime("%Y-%m-%d"), "actual": round(float(a), 2), "predicted": round(float(p), 2)}
        for d, a, p in zip(data.index[split:], y_reg_test.values, reg_pred)
    ][-40:]

    # RSI history
    rsi_history = [
        {"date": d.strftime("%Y-%m-%d"), "rsi": round(float(r), 2)}
        for d, r in zip(data.index[-60:], data["RSI"].iloc[-60:])
        if not np.isnan(r)
    ]

    # MACD history
    macd_history = [
        {"date": d.strftime("%Y-%m-%d"), "macd": round(float(m), 4), "signal": round(float(s), 4),
         "histogram": round(float(m - s), 4)}
        for d, m, s in zip(data.index[-60:], data["MACD"].iloc[-60:], data["MACD_Signal"].iloc[-60:])
        if not (np.isnan(m) or np.isnan(s))
    ]

    # Bollinger bands
    bb_history = [
        {"date": d.strftime("%Y-%m-%d"), "close": round(float(c), 2),
         "upper": round(float(u), 2), "lower": round(float(lo), 2), "mid": round(float(mi), 2)}
        for d, c, u, lo, mi in zip(data.index[-60:], data["Close"].iloc[-60:],
                                    data["BB_Upper"].iloc[-60:], data["BB_Lower"].iloc[-60:],
                                    data["BB_Mid"].iloc[-60:])
        if not (np.isnan(u) or np.isnan(lo))
    ]

    latest_row = data.iloc[-1]

    # Company info
    try:
        info = yf.Ticker(ticker).info
        company_name = info.get("longName", ticker)
        sector = info.get("sector", "N/A")
        market_cap = info.get("marketCap", 0)
        pe_ratio = info.get("trailingPE", None)
        week52_high = info.get("fiftyTwoWeekHigh", None)
        week52_low = info.get("fiftyTwoWeekLow", None)
    except Exception:
        company_name, sector, market_cap, pe_ratio, week52_high, week52_low = ticker, "N/A", 0, None, None, None

    return {
        "ticker": ticker,
        "company_name": company_name,
        "sector": sector,
        "market_cap": market_cap,
        "pe_ratio": pe_ratio,
        "week52_high": week52_high,
        "week52_low": week52_low,
        "current_price": round(current_price, 2),
        "prev_close": round(prev_close, 2),
        "day_change": round(current_price - prev_close, 2),
        "day_change_pct": round((current_price - prev_close) / prev_close * 100, 2),
        "day_high": round(float(df["High"].iloc[-1]), 2),
        "day_low": round(float(df["Low"].iloc[-1]), 2),
        "volume": int(df["Volume"].iloc[-1]),
        "prediction": {
            "direction": direction,
            "confidence": round(prob_up * 100 if prob_up >= 0.5 else (1 - prob_up) * 100, 1),
            "predicted_price": round(predicted_price, 2),
            "price_change": round(predicted_price - current_price, 2),
            "price_change_pct": round((predicted_price - current_price) / current_price * 100, 2),
        },
        "forecast": forecast,
        "model": {
            "accuracy": round(accuracy * 100, 1),
            "mae": round(mae, 2),
            "training_samples": split,
            "test_samples": len(X_scaled) - split,
            "features_used": len(FEATURE_COLS),
            "classifiers": "Random Forest (200) + Gradient Boosting (150)",
            "regressor": "Linear Regression",
        },
        "indicators": {
            "rsi": round(float(latest_row["RSI"]), 1),
            "rsi_signal": "Overbought" if latest_row["RSI"] > 70 else "Oversold" if latest_row["RSI"] < 30 else "Neutral",
            "macd": round(float(latest_row["MACD"]), 4),
            "macd_signal": round(float(latest_row["MACD_Signal"]), 4),
            "macd_trend": "Bullish" if latest_row["MACD"] > latest_row["MACD_Signal"] else "Bearish",
            "sma_20": round(float(latest_row["SMA_20"]), 2),
            "sma_50": round(float(latest_row["SMA_50"]), 2),
            "sma_trend": "Bullish" if latest_row["SMA_20"] > latest_row["SMA_50"] else "Bearish",
            "volatility_10d": round(float(latest_row["Volatility_10d"] * 100), 2),
            "volatility_20d": round(float(latest_row["Volatility_20d"] * 100), 2),
            "volume_ratio": round(float(latest_row["Volume_Ratio"]), 2),
            "bb_upper": round(float(latest_row["BB_Upper"]), 2),
            "bb_lower": round(float(latest_row["BB_Lower"]), 2),
        },
        "feature_importances": importances,
        "price_history": price_history,
        "test_results": test_results,
        "rsi_history": rsi_history,
        "macd_history": macd_history,
        "bb_history": bb_history,
    }


@app.route("/api/predict/<ticker>")
def predict(ticker):
    try:
        period = "1y"
        result = run_prediction(ticker.upper(), period)
        if result is None:
            return jsonify({"error": f"No data found for {ticker}"}), 404
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/market/overview")
def market_overview():
    tickers = {
        "AAPL": "Apple", "GOOGL": "Google", "MSFT": "Microsoft", "AMZN": "Amazon",
        "TSLA": "Tesla", "NVDA": "NVIDIA", "META": "Meta", "NFLX": "Netflix",
        "JPM": "JPMorgan", "AMD": "AMD", "DIS": "Disney", "BA": "Boeing",
    }
    results = []
    for t, name in tickers.items():
        try:
            df = yf.download(t, period="5d", progress=False)
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
            if len(df) >= 2:
                price = float(df["Close"].iloc[-1])
                prev = float(df["Close"].iloc[-2])
                change = price - prev
                change_pct = (change / prev) * 100
                results.append({
                    "ticker": t,
                    "name": name,
                    "price": round(price, 2),
                    "change": round(change, 2),
                    "change_pct": round(change_pct, 2),
                    "volume": int(df["Volume"].iloc[-1]),
                    "high": round(float(df["High"].iloc[-1]), 2),
                    "low": round(float(df["Low"].iloc[-1]), 2),
                })
        except Exception:
            pass
    return jsonify(results)


if __name__ == "__main__":
    app.run(debug=True, port=5001)
