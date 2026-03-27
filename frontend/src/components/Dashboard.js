import React, { useState, useEffect } from 'react';

const API = 'http://localhost:5001/api';

function Dashboard({ goToPredict }) {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/market/overview`)
      .then(r => r.json())
      .then(data => { setStocks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const gainers = [...stocks].filter(s => s.change_pct > 0).sort((a, b) => b.change_pct - a.change_pct);
  const losers = [...stocks].filter(s => s.change_pct < 0).sort((a, b) => a.change_pct - b.change_pct);

  if (loading) {
    return (
      <div className="loading-box">
        <div className="ld-spinner" />
        <span className="ld-text">Fetching live market data...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <div className="page-hero">
        <div className="hero-eyebrow">AI-Powered Analysis</div>
        <h1 className="page-title">
          STOCK<br />
          <span className="highlight">PREDICTOR</span>
        </h1>
        <p className="page-subtitle">
          Real-time market data powered by machine learning.
          Click any stock to get AI-driven predictions for the coming days.
        </p>
      </div>

      {/* Market Stats */}
      <div className="stats-strip">
        <div className="stat-block">
          <div className="stat-num" style={{ color: 'var(--orange)' }}>{stocks.length}</div>
          <div className="stat-label">Stocks Tracked</div>
        </div>
        <div className="stat-block">
          <div className="stat-num up-c">{gainers.length}</div>
          <div className="stat-label">Gainers Today</div>
        </div>
        <div className="stat-block">
          <div className="stat-num dn-c">{losers.length}</div>
          <div className="stat-label">Losers Today</div>
        </div>
        <div className="stat-block">
          <div className="stat-num">17</div>
          <div className="stat-label">AI Features</div>
        </div>
      </div>

      {/* Market Grid */}
      <div className="section-head">
        <div className="section-num">01 — Live Data</div>
        <div className="section-title">
          MARKET <span className="hl">OVERVIEW</span>
        </div>
      </div>

      <div className="market-grid">
        {stocks.map(s => (
          <div key={s.ticker} className="mkt-item" onClick={() => goToPredict(s.ticker)}>
            <div className="mkt-ticker">{s.ticker}</div>
            <div className="mkt-name">{s.name}</div>
            <div className="mkt-price">${s.price}</div>
            <div className={`mkt-change ${s.change_pct >= 0 ? 'up-c' : 'dn-c'}`}>
              {s.change_pct >= 0 ? '+' : ''}{s.change_pct}% ({s.change >= 0 ? '+' : ''}{s.change})
            </div>
          </div>
        ))}
      </div>

      {/* Gainers & Losers */}
      <div className="section-head">
        <div className="section-num">02 — Performance</div>
        <div className="section-title">
          GAINERS & <span className="hl">LOSERS</span>
        </div>
      </div>

      <div className="gl-grid">
        <div className="card">
          <div className="card-head">
            <span>Top Gainers</span>
            <span style={{ color: 'var(--green)', fontSize: '0.7rem' }}>▲ UP</span>
          </div>
          <div className="card-inner">
            <div className="gl-list">
              {gainers.length === 0 ? (
                <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '1rem' }}>No gainers today</p>
              ) : (
                gainers.slice(0, 5).map(s => (
                  <div key={s.ticker} className="gl-row" onClick={() => goToPredict(s.ticker)}>
                    <div className="gl-left">
                      <span className="gl-sym">{s.ticker}</span>
                      <span className="gl-company">{s.name}</span>
                    </div>
                    <div className="gl-right">
                      <div className="gl-price">${s.price}</div>
                      <div className="gl-pct up-c">+{s.change_pct}%</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <span>Top Losers</span>
            <span style={{ color: 'var(--red)', fontSize: '0.7rem' }}>▼ DOWN</span>
          </div>
          <div className="card-inner">
            <div className="gl-list">
              {losers.length === 0 ? (
                <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '1rem' }}>No losers today</p>
              ) : (
                losers.slice(0, 5).map(s => (
                  <div key={s.ticker} className="gl-row" onClick={() => goToPredict(s.ticker)}>
                    <div className="gl-left">
                      <span className="gl-sym">{s.ticker}</span>
                      <span className="gl-company">{s.name}</span>
                    </div>
                    <div className="gl-right">
                      <div className="gl-price">${s.price}</div>
                      <div className="gl-pct dn-c">{s.change_pct}%</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
