import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, LineChart, Line, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, ComposedChart
} from 'recharts';

const API = 'http://localhost:5001/api';
const TICKERS = ['AAPL', 'GOOGL', 'TSLA', 'MSFT', 'AMZN', 'NVDA', 'META', 'NFLX', 'JPM', 'AMD'];

function Predict({ initialTicker }) {
  const [ticker, setTicker] = useState(initialTicker || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartTab, setChartTab] = useState('price');

  const fetchPrediction = useCallback(async (t) => {
    const sym = (t || ticker).trim().toUpperCase();
    if (!sym) return;
    setTicker(sym);
    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch(`${API}/predict/${sym}`);
      const result = await res.json();
      if (result.error) setError(result.error);
      else setData(result);
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    if (initialTicker) fetchPrediction(initialTicker);
  }, [initialTicker, fetchPrediction]);

  const fmtCap = (c) => {
    if (!c) return 'N/A';
    if (c >= 1e12) return `$${(c/1e12).toFixed(2)}T`;
    if (c >= 1e9) return `$${(c/1e9).toFixed(2)}B`;
    return `$${(c/1e6).toFixed(0)}M`;
  };

  const ttStyle = {
    background: '#111', border: '1px solid #222', borderRadius: 6,
    color: '#e5e5e5', fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace",
  };

  return (
    <div>
      {/* Hero */}
      <div className="page-hero">
        <div className="hero-eyebrow">Machine Learning Engine</div>
        <h1 className="page-title">
          AI<br />
          <span className="highlight">PREDICTION</span>
        </h1>
        <p className="page-subtitle">
          Enter any stock ticker to run real-time AI analysis using ensemble
          machine learning models trained on historical market data.
        </p>
      </div>

      {/* Search */}
      <div className="search-wrapper">
        <div className="search-row">
          <input
            className="search-input"
            placeholder="Enter ticker symbol..."
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && fetchPrediction()}
          />
          <button className="search-go" onClick={() => fetchPrediction()} disabled={loading}>
            {loading ? 'ANALYZING...' : 'PREDICT'}
          </button>
        </div>
        <div className="ticker-chips">
          {TICKERS.map(t => (
            <button key={t} className="chip" onClick={() => fetchPrediction(t)}>{t}</button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          padding: '1rem 1.5rem', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, color: 'var(--red)', marginBottom: '2rem', fontSize: '0.88rem'
        }}>{error}</div>
      )}

      {loading && (
        <div className="loading-box">
          <div className="ld-spinner" />
          <span className="ld-text">Training AI models on {ticker} data...</span>
        </div>
      )}

      {data && (
        <>
          {/* Company */}
          <div className="co-header">
            <h1>{data.company_name} <span className="ticker">{data.ticker}</span></h1>
            <div className="co-meta">
              <span>Sector: <span className="val">{data.sector}</span></span>
              <span>Market Cap: <span className="val">{fmtCap(data.market_cap)}</span></span>
              {data.pe_ratio && <span>P/E: <span className="val">{data.pe_ratio.toFixed(2)}</span></span>}
            </div>
          </div>

          {/* Stats */}
          <div className="stats-strip">
            <div className="stat-block">
              <div className="stat-num" style={{ color: 'var(--orange)' }}>${data.current_price}</div>
              <div className="stat-label">Current Price</div>
              <div className="stat-sub" style={{ color: data.day_change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {data.day_change >= 0 ? '+' : ''}{data.day_change} ({data.day_change_pct}%)
              </div>
            </div>
            <div className="stat-block">
              <div className="stat-num">${data.day_low} — ${data.day_high}</div>
              <div className="stat-label">Day Range</div>
            </div>
            <div className="stat-block">
              <div className="stat-num" style={{ fontSize: '1.1rem' }}>
                {data.week52_low ? `$${data.week52_low} — $${data.week52_high}` : 'N/A'}
              </div>
              <div className="stat-label">52-Week Range</div>
            </div>
            <div className="stat-block">
              <div className="stat-num">{(data.volume / 1e6).toFixed(1)}M</div>
              <div className="stat-label">Volume</div>
              <div className="stat-sub" style={{ color: 'var(--gray-500)' }}>{data.indicators.volume_ratio}x avg</div>
            </div>
          </div>

          {/* Prediction */}
          <div className="section-head">
            <div className="section-num">01 — AI Output</div>
            <div className="section-title">
              MARKET <span className="hl">PREDICTION</span>
            </div>
          </div>

          <div className="prediction-block">
            <div className="prediction-header">
              <span className="ai-dot" /> AI Prediction Engine — Next Trading Day
            </div>
            <div className="prediction-body">
              <div className="pred-cell">
                <div className="pred-cell-label">Direction</div>
                <div className="pred-cell-value" style={{
                  color: data.prediction.direction === 'UP' ? 'var(--green)' : 'var(--red)',
                }}>
                  {data.prediction.direction === 'UP' ? '▲ BULLISH' : '▼ BEARISH'}
                </div>
                <div className="pred-cell-sub">Next trading day</div>
              </div>
              <div className="pred-cell">
                <div className="pred-cell-label">Predicted Price</div>
                <div className="pred-cell-value" style={{ color: 'var(--orange)' }}>
                  ${data.prediction.predicted_price}
                </div>
                <div className="pred-cell-sub" style={{
                  color: data.prediction.price_change >= 0 ? 'var(--green)' : 'var(--red)'
                }}>
                  {data.prediction.price_change >= 0 ? '+' : ''}${data.prediction.price_change} ({data.prediction.price_change_pct}%)
                </div>
              </div>
              <div className="pred-cell">
                <div className="pred-cell-label">Confidence</div>
                <div className="pred-cell-value">{data.prediction.confidence}%</div>
                <div className="pred-cell-sub">Ensemble vote</div>
              </div>
              <div className="pred-cell">
                <div className="pred-cell-label">Model Accuracy</div>
                <div className="pred-cell-value">{data.model.accuracy}%</div>
                <div className="pred-cell-sub">MAE: ${data.model.mae}</div>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-head">5-Day Forecast</div>
            <div className="card-inner" style={{ padding: 0 }}>
              <table className="forecast-tbl">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Price</th>
                    <th>Direction</th>
                    <th>Confidence</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {data.forecast.map(f => (
                    <tr key={f.day}>
                      <td>Day {f.day}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>${f.price}</td>
                      <td><span className={`dir-tag ${f.direction.toLowerCase()}`}>{f.direction}</span></td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>{f.confidence}%</td>
                      <td style={{
                        color: f.change_pct >= 0 ? 'var(--green)' : 'var(--red)',
                        fontWeight: 700, fontFamily: "'JetBrains Mono', monospace"
                      }}>
                        {f.change_pct >= 0 ? '+' : ''}{f.change_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts */}
          <div className="section-head">
            <div className="section-num">02 — Analysis</div>
            <div className="section-title">
              TECHNICAL <span className="hl">CHARTS</span>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-head">
              <span>Chart View</span>
              <div className="chart-tabs">
                {[['price','Price'],['prediction','AI vs Actual'],['rsi','RSI'],['macd','MACD'],['bb','Bollinger']].map(([k,l]) => (
                  <button key={k} className={`ctab ${chartTab === k ? 'on' : ''}`} onClick={() => setChartTab(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="card-inner">
              <ResponsiveContainer width="100%" height={360}>
                {chartTab === 'price' ? (
                  <AreaChart data={data.price_history}>
                    <defs>
                      <linearGradient id="og" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff6a00" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ff6a00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: '#525252', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis domain={['auto','auto']} tick={{ fill: '#525252', fontSize: 10 }} />
                    <Tooltip contentStyle={ttStyle} formatter={(v) => [`$${v}`, 'Close']} />
                    <Area type="monotone" dataKey="close" stroke="#ff6a00" fill="url(#og)" strokeWidth={2} />
                  </AreaChart>
                ) : chartTab === 'prediction' ? (
                  <LineChart data={data.test_results}>
                    <XAxis dataKey="date" tick={{ fill: '#525252', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis domain={['auto','auto']} tick={{ fill: '#525252', fontSize: 10 }} />
                    <Tooltip contentStyle={ttStyle} formatter={(v) => [`$${v}`]} />
                    <Legend />
                    <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2} dot={false} name="Actual" />
                    <Line type="monotone" dataKey="predicted" stroke="#ff6a00" strokeWidth={2} dot={false} strokeDasharray="5 5" name="AI Predicted" />
                  </LineChart>
                ) : chartTab === 'rsi' ? (
                  <LineChart data={data.rsi_history}>
                    <XAxis dataKey="date" tick={{ fill: '#525252', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#525252', fontSize: 10 }} />
                    <Tooltip contentStyle={ttStyle} formatter={(v) => [v.toFixed(1), 'RSI']} />
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Overbought', fill: '#ef4444', fontSize: 10 }} />
                    <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Oversold', fill: '#22c55e', fontSize: 10 }} />
                    <Line type="monotone" dataKey="rsi" stroke="#ff6a00" strokeWidth={2} dot={false} />
                  </LineChart>
                ) : chartTab === 'macd' ? (
                  <ComposedChart data={data.macd_history}>
                    <XAxis dataKey="date" tick={{ fill: '#525252', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fill: '#525252', fontSize: 10 }} />
                    <Tooltip contentStyle={ttStyle} />
                    <Legend />
                    <Bar dataKey="histogram" fill="rgba(255,106,0,0.3)" name="Histogram" />
                    <Line type="monotone" dataKey="macd" stroke="#ff6a00" strokeWidth={2} dot={false} name="MACD" />
                    <Line type="monotone" dataKey="signal" stroke="#525252" strokeWidth={1.5} dot={false} name="Signal" />
                  </ComposedChart>
                ) : (
                  <LineChart data={data.bb_history}>
                    <XAxis dataKey="date" tick={{ fill: '#525252', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis domain={['auto','auto']} tick={{ fill: '#525252', fontSize: 10 }} />
                    <Tooltip contentStyle={ttStyle} formatter={(v) => [`$${v}`]} />
                    <Legend />
                    <Line type="monotone" dataKey="upper" stroke="rgba(239,68,68,0.5)" strokeWidth={1} dot={false} name="Upper" />
                    <Line type="monotone" dataKey="lower" stroke="rgba(34,197,94,0.5)" strokeWidth={1} dot={false} name="Lower" />
                    <Line type="monotone" dataKey="mid" stroke="#404040" strokeWidth={1} dot={false} strokeDasharray="3 3" name="Mid" />
                    <Line type="monotone" dataKey="close" stroke="#ff6a00" strokeWidth={2} dot={false} name="Close" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Indicators + Features + Model */}
          <div className="section-head">
            <div className="section-num">03 — Deep Dive</div>
            <div className="section-title">
              MODEL <span className="hl">INSIGHTS</span>
            </div>
          </div>

          <div className="cols-3">
            {/* Indicators */}
            <div className="card">
              <div className="card-head">Indicators</div>
              <div className="card-inner" style={{ padding: 0 }}>
                <div className="ind-grid">
                  <div className="ind-cell">
                    <div className="ind-cell-val" style={{
                      color: data.indicators.rsi > 70 ? 'var(--red)' : data.indicators.rsi < 30 ? 'var(--green)' : 'var(--orange)'
                    }}>{data.indicators.rsi}</div>
                    <div className="ind-cell-name">RSI (14)</div>
                    <div className="ind-cell-signal" style={{
                      color: data.indicators.rsi_signal === 'Overbought' ? 'var(--red)' :
                             data.indicators.rsi_signal === 'Oversold' ? 'var(--green)' : 'var(--orange)'
                    }}>{data.indicators.rsi_signal}</div>
                  </div>
                  <div className="ind-cell">
                    <div className="ind-cell-val" style={{
                      color: data.indicators.macd_trend === 'Bullish' ? 'var(--green)' : 'var(--red)'
                    }}>{data.indicators.macd}</div>
                    <div className="ind-cell-name">MACD</div>
                    <div className="ind-cell-signal" style={{
                      color: data.indicators.macd_trend === 'Bullish' ? 'var(--green)' : 'var(--red)'
                    }}>{data.indicators.macd_trend}</div>
                  </div>
                  <div className="ind-cell">
                    <div className="ind-cell-val" style={{
                      color: data.indicators.sma_trend === 'Bullish' ? 'var(--green)' : 'var(--red)'
                    }}>{data.indicators.sma_trend}</div>
                    <div className="ind-cell-name">SMA Crossover</div>
                    <div className="ind-cell-signal" style={{ color: 'var(--gray-500)' }}>
                      20: ${data.indicators.sma_20}
                    </div>
                  </div>
                  <div className="ind-cell">
                    <div className="ind-cell-val">{data.indicators.volatility_10d}%</div>
                    <div className="ind-cell-name">Volatility</div>
                    <div className="ind-cell-signal" style={{ color: 'var(--gray-500)' }}>10-day</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Importance */}
            <div className="card">
              <div className="card-head">Feature Importance</div>
              <div className="card-inner">
                <div className="feat-list">
                  {data.feature_importances.slice(0, 8).map(f => {
                    const max = data.feature_importances[0].importance;
                    const pct = (f.importance / max) * 100;
                    return (
                      <div key={f.feature} className="feat-row">
                        <div className="feat-name">{f.feature}</div>
                        <div className="feat-track">
                          <div className="feat-fill" style={{ width: `${pct}%` }}>
                            <span className="feat-pct">{(f.importance * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Model */}
            <div className="card">
              <div className="card-head">Model Info</div>
              <div className="card-inner">
                <div className="model-rows">
                  <div className="model-row"><span className="k">Accuracy</span><span className="v" style={{ color: 'var(--green)' }}>{data.model.accuracy}%</span></div>
                  <div className="model-row"><span className="k">MAE</span><span className="v">${data.model.mae}</span></div>
                  <div className="model-row"><span className="k">Training</span><span className="v">{data.model.training_samples} days</span></div>
                  <div className="model-row"><span className="k">Testing</span><span className="v">{data.model.test_samples} days</span></div>
                  <div className="model-row"><span className="k">Features</span><span className="v">{data.model.features_used}</span></div>
                  <div className="model-row"><span className="k">Classifier</span><span className="v" style={{ fontSize: '0.7rem' }}>RF + GB</span></div>
                  <div className="model-row"><span className="k">Regressor</span><span className="v" style={{ fontSize: '0.7rem' }}>Linear</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="foot-note">
            <strong>Disclaimer:</strong> This is an academic project for educational purposes.
            Predictions are based on historical patterns. Stock markets are inherently unpredictable.
            Do not make financial decisions based on these predictions.
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <div className="empty-box">
          <div className="e-icon">◎</div>
          <h3>Enter a Ticker</h3>
          <p>
            Type any stock symbol and hit PREDICT to run AI analysis using
            Random Forest + Gradient Boosting models on real market data.
          </p>
        </div>
      )}
    </div>
  );
}

export default Predict;
