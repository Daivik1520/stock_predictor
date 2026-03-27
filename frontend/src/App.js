import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Predict from './components/Predict';
import About from './components/About';

function App() {
  const [page, setPage] = useState('dashboard');
  const [selectedTicker, setSelectedTicker] = useState(null);

  const goToPredict = (ticker) => {
    setSelectedTicker(ticker);
    setPage('predict');
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard goToPredict={goToPredict} />;
      case 'predict':
        return <Predict initialTicker={selectedTicker} />;
      case 'about':
        return <About />;
      default:
        return <Dashboard goToPredict={goToPredict} />;
    }
  };

  return (
    <div className="app">
      <Navbar page={page} setPage={setPage} />
      <div className="main-content">
        {renderPage()}
      </div>
    </div>
  );
}

export default App;
