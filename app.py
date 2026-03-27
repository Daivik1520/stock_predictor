import streamlit as st
import yfinance as yf
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error
from datetime import datetime, timedelta
import warnings

warnings.filterwarnings("ignore")

# ── Page Config ──────────────────────────────────────────────────────────────
st.set_page_config(page_title="AI Stock Predictor", page_icon="📈", layout="wide")

# ── Custom CSS ───────────────────────────────────────────────────────────────
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(90deg, #00d2ff, #3a7bd5);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        padding: 1rem 0;
    }
    .metric-card {
        background: linear-gradient(135deg, #1e1e2f, #2d2d44);
        border-radius: 12px;
        padding: 1.2rem;
        text-align: center;
        border: 1px solid #3a3a5c;
    }
    .metric-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #00d2ff;
    }
    .metric-label {
        font-size: 0.85rem;
        color: #a0a0b0;
        margin-top: 0.3rem;
    }
    .prediction-up {
        background: linear-gradient(135deg, #0a3d0a, #1a5c1a);
        border: 1px solid #2ecc71;
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
    }
    .prediction-down {
        background: linear-gradient(135deg, #3d0a0a, #5c1a1a);
        border: 1px solid #e74c3c;
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        border-radius: 8px;
    }
</style>
""", unsafe_allow_html=True)


# ── Feature Engineering ──────────────────────────────────────────────────────
def compute_features(df):
    """Compute technical indicators as ML features."""
    df = df.copy()

    # Moving averages
    df["SMA_5"] = df["Close"].rolling(5).mean()
    df["SMA_20"] = df["Close"].rolling(20).mean()
    df["SMA_50"] = df["Close"].rolling(50).mean()
    df["EMA_12"] = df["Close"].ewm(span=12).mean()
    df["EMA_26"] = df["Close"].ewm(span=26).mean()

    # MACD
    df["MACD"] = df["EMA_12"] - df["EMA_26"]
    df["MACD_Signal"] = df["MACD"].ewm(span=9).mean()

    # RSI
    delta = df["Close"].diff()
    gain = delta.where(delta > 0, 0).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss
    df["RSI"] = 100 - (100 / (1 + rs))

    # Bollinger Bands
    df["BB_Mid"] = df["Close"].rolling(20).mean()
    bb_std = df["Close"].rolling(20).std()
    df["BB_Upper"] = df["BB_Mid"] + 2 * bb_std
    df["BB_Lower"] = df["BB_Mid"] - 2 * bb_std
    df["BB_Width"] = (df["BB_Upper"] - df["BB_Lower"]) / df["BB_Mid"]

    # Price changes & volatility
    df["Return_1d"] = df["Close"].pct_change(1)
    df["Return_5d"] = df["Close"].pct_change(5)
    df["Return_10d"] = df["Close"].pct_change(10)
    df["Volatility_10d"] = df["Return_1d"].rolling(10).std()
    df["Volatility_20d"] = df["Return_1d"].rolling(20).std()

    # Volume features
    df["Volume_SMA_20"] = df["Volume"].rolling(20).mean()
    df["Volume_Ratio"] = df["Volume"] / df["Volume_SMA_20"]

    # Price position
    df["Price_vs_SMA20"] = (df["Close"] - df["SMA_20"]) / df["SMA_20"]
    df["Price_vs_SMA50"] = (df["Close"] - df["SMA_50"]) / df["SMA_50"]

    # Target: 1 if next day close > today close
    df["Target"] = (df["Close"].shift(-1) > df["Close"]).astype(int)

    # Price prediction target
    df["Next_Close"] = df["Close"].shift(-1)

    return df


FEATURE_COLS = [
    "SMA_5", "SMA_20", "SMA_50", "EMA_12", "EMA_26",
    "MACD", "MACD_Signal", "RSI",
    "BB_Width", "Return_1d", "Return_5d", "Return_10d",
    "Volatility_10d", "Volatility_20d", "Volume_Ratio",
    "Price_vs_SMA20", "Price_vs_SMA50",
]


# ── Model Training ───────────────────────────────────────────────────────────
@st.cache_data(ttl=3600)
def fetch_data(ticker, period):
    return yf.download(ticker, period=period, progress=False)


def train_models(df):
    """Train direction classifier + price regressor."""
    data = compute_features(df)
    data = data.dropna(subset=FEATURE_COLS + ["Target", "Next_Close"])

    X = data[FEATURE_COLS]
    y_cls = data["Target"]
    y_reg = data["Next_Close"]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Split: last 20% for testing
    split = int(len(X_scaled) * 0.8)
    X_train, X_test = X_scaled[:split], X_scaled[split:]
    y_cls_train, y_cls_test = y_cls.iloc[:split], y_cls.iloc[split:]
    y_reg_train, y_reg_test = y_reg.iloc[:split], y_reg.iloc[split:]

    # Direction classifier (Random Forest + Gradient Boosting ensemble)
    rf = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
    gb = GradientBoostingClassifier(n_estimators=150, max_depth=5, random_state=42)
    rf.fit(X_train, y_cls_train)
    gb.fit(X_train, y_cls_train)

    rf_pred = rf.predict(X_test)
    gb_pred = gb.predict(X_test)
    ensemble_pred = ((rf.predict_proba(X_test)[:, 1] + gb.predict_proba(X_test)[:, 1]) / 2 >= 0.5).astype(int)

    cls_accuracy = accuracy_score(y_cls_test, ensemble_pred)

    # Price regressor
    lr = LinearRegression()
    lr.fit(X_train, y_reg_train)
    reg_pred = lr.predict(X_test)
    reg_mae = mean_absolute_error(y_reg_test, reg_pred)

    # Feature importance
    importances = pd.Series(rf.feature_importances_, index=FEATURE_COLS).sort_values(ascending=False)

    # Predict next day
    latest = X_scaled[-1].reshape(1, -1)
    direction_prob = (rf.predict_proba(latest)[:, 1] + gb.predict_proba(latest)[:, 1]) / 2
    predicted_price = lr.predict(latest)[0]
    predicted_direction = "UP 📈" if direction_prob[0] >= 0.5 else "DOWN 📉"

    return {
        "accuracy": cls_accuracy,
        "mae": reg_mae,
        "direction": predicted_direction,
        "direction_prob": direction_prob[0],
        "predicted_price": predicted_price,
        "importances": importances,
        "test_actual": y_reg_test,
        "test_pred": reg_pred,
        "test_dates": data.index[split:],
        "data": data,
    }


# ── UI ───────────────────────────────────────────────────────────────────────
st.markdown('<div class="main-header">AI Stock Price Predictor</div>', unsafe_allow_html=True)
st.markdown("<p style='text-align:center; color:#888;'>Powered by Machine Learning &bull; Random Forest &bull; Gradient Boosting &bull; Linear Regression</p>", unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.header("⚙️ Settings")
    ticker = st.text_input("Stock Ticker", value="AAPL", help="e.g. AAPL, GOOGL, TSLA, MSFT, AMZN")
    period = st.selectbox("Data Period", ["6mo", "1y", "2y", "5y"], index=1)
    st.markdown("---")
    st.markdown("### Popular Tickers")
    cols = st.columns(3)
    popular = ["AAPL", "GOOGL", "TSLA", "MSFT", "AMZN", "META", "NVDA", "NFLX", "JPM"]
    for i, t in enumerate(popular):
        if cols[i % 3].button(t, use_container_width=True):
            ticker = t
    st.markdown("---")
    st.markdown("### About")
    st.info(
        "This app uses **ensemble ML models** trained on technical indicators "
        "to predict stock price direction and next-day price. "
        "Not financial advice!"
    )

# Main content
if ticker:
    ticker = ticker.upper().strip()

    with st.spinner(f"Fetching data for **{ticker}**..."):
        df = fetch_data(ticker, period)

    if df.empty:
        st.error(f"No data found for ticker '{ticker}'. Please check the symbol.")
    else:
        # Flatten MultiIndex columns if present
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        current_price = df["Close"].iloc[-1]
        prev_price = df["Close"].iloc[-2]
        price_change = current_price - prev_price
        pct_change = (price_change / prev_price) * 100

        # Company info
        try:
            info = yf.Ticker(ticker).info
            company_name = info.get("longName", ticker)
        except Exception:
            company_name = ticker

        st.markdown(f"## {company_name} ({ticker})")

        # Metrics row
        c1, c2, c3, c4 = st.columns(4)
        with c1:
            st.metric("Current Price", f"${current_price:.2f}", f"{price_change:+.2f} ({pct_change:+.2f}%)")
        with c2:
            st.metric("Day High", f"${df['High'].iloc[-1]:.2f}")
        with c3:
            st.metric("Day Low", f"${df['Low'].iloc[-1]:.2f}")
        with c4:
            st.metric("Volume", f"{df['Volume'].iloc[-1]:,.0f}")

        # Train models
        with st.spinner("Training AI models..."):
            results = train_models(df)

        # Prediction cards
        st.markdown("### 🤖 AI Prediction — Next Trading Day")
        p1, p2, p3 = st.columns(3)

        direction_class = "prediction-up" if "UP" in results["direction"] else "prediction-down"
        with p1:
            st.markdown(f"""
            <div class="{direction_class}">
                <div style="font-size:1rem; color:#ccc;">Predicted Direction</div>
                <div style="font-size:2rem; font-weight:700;">{results["direction"]}</div>
                <div style="font-size:0.9rem; color:#aaa;">Confidence: {results["direction_prob"]*100:.1f}%</div>
            </div>
            """, unsafe_allow_html=True)
        with p2:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Predicted Price</div>
                <div class="metric-value">${results["predicted_price"]:.2f}</div>
                <div style="font-size:0.85rem; color:#aaa;">
                    Change: {((results["predicted_price"] - current_price) / current_price * 100):+.2f}%
                </div>
            </div>
            """, unsafe_allow_html=True)
        with p3:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Model Accuracy</div>
                <div class="metric-value">{results["accuracy"]*100:.1f}%</div>
                <div style="font-size:0.85rem; color:#aaa;">MAE: ${results["mae"]:.2f}</div>
            </div>
            """, unsafe_allow_html=True)

        # Tabs
        tab1, tab2, tab3, tab4 = st.tabs(["📊 Price Chart", "🔮 Prediction vs Actual", "📉 Technical Indicators", "🧠 Model Insights"])

        with tab1:
            fig = make_subplots(rows=2, cols=1, shared_xaxes=True, row_heights=[0.7, 0.3],
                                vertical_spacing=0.05)

            fig.add_trace(go.Candlestick(
                x=df.index, open=df["Open"], high=df["High"],
                low=df["Low"], close=df["Close"], name="OHLC"
            ), row=1, col=1)

            data = results["data"]
            fig.add_trace(go.Scatter(x=data.index, y=data["SMA_20"], name="SMA 20",
                                     line=dict(color="#ff9800", width=1)), row=1, col=1)
            fig.add_trace(go.Scatter(x=data.index, y=data["SMA_50"], name="SMA 50",
                                     line=dict(color="#2196f3", width=1)), row=1, col=1)

            fig.add_trace(go.Bar(x=df.index, y=df["Volume"], name="Volume",
                                 marker_color="rgba(100,100,255,0.4)"), row=2, col=1)

            fig.update_layout(
                height=600, template="plotly_dark",
                xaxis_rangeslider_visible=False,
                title=f"{ticker} Price & Volume",
                showlegend=True,
            )
            st.plotly_chart(fig, use_container_width=True)

        with tab2:
            fig2 = go.Figure()
            fig2.add_trace(go.Scatter(
                x=results["test_dates"], y=results["test_actual"].values,
                name="Actual Price", line=dict(color="#2ecc71", width=2)
            ))
            fig2.add_trace(go.Scatter(
                x=results["test_dates"], y=results["test_pred"],
                name="Predicted Price", line=dict(color="#e74c3c", width=2, dash="dash")
            ))
            fig2.update_layout(
                height=500, template="plotly_dark",
                title="Model Predictions vs Actual (Test Set)",
                yaxis_title="Price ($)",
            )
            st.plotly_chart(fig2, use_container_width=True)

        with tab3:
            ind1, ind2 = st.columns(2)
            with ind1:
                fig_rsi = go.Figure()
                fig_rsi.add_trace(go.Scatter(x=data.index, y=data["RSI"], name="RSI",
                                             line=dict(color="#ff6b6b")))
                fig_rsi.add_hline(y=70, line_dash="dash", line_color="red", annotation_text="Overbought")
                fig_rsi.add_hline(y=30, line_dash="dash", line_color="green", annotation_text="Oversold")
                fig_rsi.update_layout(height=350, template="plotly_dark", title="RSI (14)")
                st.plotly_chart(fig_rsi, use_container_width=True)

            with ind2:
                fig_macd = go.Figure()
                fig_macd.add_trace(go.Scatter(x=data.index, y=data["MACD"], name="MACD",
                                              line=dict(color="#3498db")))
                fig_macd.add_trace(go.Scatter(x=data.index, y=data["MACD_Signal"], name="Signal",
                                              line=dict(color="#e67e22")))
                fig_macd.add_trace(go.Bar(x=data.index, y=data["MACD"] - data["MACD_Signal"],
                                          name="Histogram", marker_color="rgba(150,150,255,0.4)"))
                fig_macd.update_layout(height=350, template="plotly_dark", title="MACD")
                st.plotly_chart(fig_macd, use_container_width=True)

            # Bollinger Bands
            fig_bb = go.Figure()
            fig_bb.add_trace(go.Scatter(x=data.index, y=data["BB_Upper"], name="Upper Band",
                                        line=dict(color="rgba(255,100,100,0.5)")))
            fig_bb.add_trace(go.Scatter(x=data.index, y=data["BB_Lower"], name="Lower Band",
                                        line=dict(color="rgba(100,255,100,0.5)"),
                                        fill="tonexty", fillcolor="rgba(100,100,255,0.1)"))
            fig_bb.add_trace(go.Scatter(x=data.index, y=data["Close"], name="Close",
                                        line=dict(color="#00d2ff", width=1.5)))
            fig_bb.update_layout(height=400, template="plotly_dark", title="Bollinger Bands")
            st.plotly_chart(fig_bb, use_container_width=True)

        with tab4:
            m1, m2 = st.columns(2)
            with m1:
                st.markdown("#### Feature Importance (Random Forest)")
                fig_imp = go.Figure(go.Bar(
                    x=results["importances"].values[:10],
                    y=results["importances"].index[:10],
                    orientation="h",
                    marker_color="#00d2ff",
                ))
                fig_imp.update_layout(
                    height=400, template="plotly_dark",
                    yaxis=dict(autorange="reversed"),
                    xaxis_title="Importance",
                )
                st.plotly_chart(fig_imp, use_container_width=True)

            with m2:
                st.markdown("#### Model Details")
                st.markdown(f"""
                | Metric | Value |
                |--------|-------|
                | **Direction Accuracy** | {results["accuracy"]*100:.1f}% |
                | **Price MAE** | ${results["mae"]:.2f} |
                | **Training Samples** | {int(len(df)*0.8)} |
                | **Test Samples** | {len(df) - int(len(df)*0.8)} |
                | **Features Used** | {len(FEATURE_COLS)} |
                | **Classifiers** | RF (200 trees) + GB (150 trees) |
                | **Regressor** | Linear Regression |
                """)

                st.markdown("#### Current Indicator Values")
                latest_data = results["data"].iloc[-1]
                st.markdown(f"""
                | Indicator | Value |
                |-----------|-------|
                | **RSI** | {latest_data['RSI']:.1f} |
                | **MACD** | {latest_data['MACD']:.3f} |
                | **SMA 20** | ${latest_data['SMA_20']:.2f} |
                | **SMA 50** | ${latest_data['SMA_50']:.2f} |
                | **Volatility (10d)** | {latest_data['Volatility_10d']*100:.2f}% |
                | **Volume Ratio** | {latest_data['Volume_Ratio']:.2f}x |
                """)

        # Disclaimer
        st.markdown("---")
        st.warning(
            "**Disclaimer:** This tool is for educational purposes only. "
            "Stock predictions are inherently uncertain. Do not make financial decisions based solely on this tool. "
            "Past performance does not guarantee future results."
        )
