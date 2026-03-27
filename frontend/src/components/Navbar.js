import React from 'react';

function Navbar({ page, setPage }) {
  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => setPage('dashboard')}>
        S.P.A.I <span className="dot" />
      </div>
      <div className="nav-links">
        <button className={`nav-link ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>
          Market
        </button>
        <button className={`nav-link ${page === 'predict' ? 'active' : ''}`} onClick={() => setPage('predict')}>
          Predictions
        </button>
        <button className={`nav-link ${page === 'about' ? 'active' : ''}`} onClick={() => setPage('about')}>
          How It Works
        </button>
      </div>
      <button className="nav-cta" onClick={() => setPage('predict')}>
        Get Prediction
      </button>
    </nav>
  );
}

export default Navbar;
