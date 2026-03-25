import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function formatMarketCap(num) {
  if (num === undefined || num === null) return "N/A";
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function CoinCard({ coin, index, onTrade }) {
  const isPositive = coin.price_change_percentage_24h > 0;
  // Clamp bar width: max 20% change = full bar
  const barWidth = Math.min(
    (Math.abs(coin.price_change_percentage_24h) / 20) * 100,
    100,
  );

  return (
    <div className="coin-card">
      <div className="coin-card-top">
        <img src={coin.image} alt={coin.name} className="coin-logo" />
        <div>
          <div className="coin-name">{coin.name}</div>
          <div className="coin-symbol">{coin.symbol}</div>
        </div>
        <div className="coin-rank">#{coin.market_cap_rank || "?"}</div>
      </div>

      <div className="coin-price">${Number(coin.current_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>

      <div className="coin-change-row">
        <span className={`coin-change ${isPositive ? "positive" : "negative"}`}>
          {isPositive ? "▲" : "▼"}{" "}
          {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
        </span>
        <span className="coin-mcap">
          MCap {formatMarketCap(coin.market_cap)}
        </span>
      </div>

      <div className="mini-chart">
        <div className="mini-chart-label">24H MOMENTUM</div>
        <div className="mini-bar-track">
          <div
            className={`mini-bar-fill ${isPositive ? "positive" : "negative"}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
      
      <button 
        className="trade-btn" 
        onClick={() => onTrade(coin)}
      >
        {'>'} TRADE_ASSET
      </button>
    </div>
  );
}

function Dashboard() {
  const { user, token } = useAuth();
  
  const [coins, setCoins] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Trade Modal State
  const [tradeModalCoin, setTradeModalCoin] = useState(null);
  const [tradeType, setTradeType] = useState('BUY');
  const [tradeQuantity, setTradeQuantity] = useState('');

  const fetchCryptoData = (controller) => {
    setError(null);
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
    fetch(`${API_URL}/api/crypto`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setCoins(data);
          setLastUpdated(new Date().toLocaleTimeString());
        } else {
          throw new Error("Invalid data format");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError("Failed to fetch market data.");
        setLoading(false);
      });
  };

  const fetchUserPortfolios = async () => {
    try{
      if(!user || !token) return;

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
      const res = await fetch(`${API_URL}/api/portfolios/user/${user.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
    });

    if(!res.ok) throw new Error("Failed to fetch portfolios");
    
    const data = await res.json();
    setPortfolios(data);

    if(data.length > 0){
      setSelectedPortfolio(data[0].id);
    }
  } catch(err){
    console.error("Error fetching portfolios:", err);
  }
  };

  const fetchHoldings = async (portfolioId) => {
    if(!portfolioId) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
      const res = await fetch(`${API_URL}/api/portfolios/${portfolioId}/holdings`);
      if(!res.ok) throw new Error("Failed to fetch holdings");
      const data = await res.json();
      setHoldings(data);
    } catch (err){
      console.error(err);
    }
  };

  const handleTradeSubmit = async (e) => {
    e.preventDefault();
    const qtyNumber = Number(tradeQuantity);
    if (!selectedPortfolio || !tradeModalCoin || !qtyNumber || qtyNumber <= 0) return;

    try {
      // 1. Fetch from CoinGecko to make sure it exists in DB / is updated
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
      const saveRes = await fetch(`${API_URL}/api/coins/${tradeModalCoin.id}`, { method: 'POST' });
      if(!saveRes.ok) throw new Error("Failed to sync coin data to database.");
      const savedCoin = await saveRes.json();

      // 2. Perform the transaction
      const txRes = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          portfolio_id: selectedPortfolio,
          coin_id: savedCoin.id, // The ID from our internal DB, not coingecko
          type: tradeType,
          quantity: qtyNumber,
          price: tradeModalCoin.current_price
        })
      });

      if (!txRes.ok) {
        const errorData = await txRes.json();
        throw new Error(errorData.error || "Transaction failed");
      }

      // 3. Success! Close modal and refresh holdings
      setTradeModalCoin(null);
      setTradeQuantity('');
      fetchHoldings(selectedPortfolio);

    } catch (err) {
      alert("Trade Error: " + err.message);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchUserPortfolios();
    }
    const controller = new AbortController();
    fetchCryptoData(controller);
    const interval = setInterval(
      () => fetchCryptoData(new AbortController()),
      30000,
    );
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [user, token]);

  useEffect(() => {
    if(selectedPortfolio){
      fetchHoldings(selectedPortfolio);
    }
  }, [selectedPortfolio]);

  // Create Portfolio State
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");

  const handleCreatePortfolio = async (e) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;

    try {
      if (!user || !token) throw new Error("Not logged in");

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
      const res = await fetch(`${API_URL}/api/portfolios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          name: newPortfolioName,
        }),
      });

      if (!res.ok) throw new Error("Failed to create portfolio");

      const savedPortfolio = await res.json();
      
      // Update local state and select the new one
      setPortfolios([...portfolios, savedPortfolio]);
      setSelectedPortfolio(savedPortfolio.id);
      setShowCreatePortfolio(false);
      setNewPortfolioName("");

    } catch (err) {
      alert("Error creating portfolio: " + err.message);
    }
  };

  if (loading)
    return (
      <div className="status-screen">
        <div className="status-spinner" />
        <p className="status-text">FETCHING MARKET DATA...</p>
      </div>
    );

  if (error)
    return (
      <div className="status-screen">
        <p className="status-error">⚠ {error}</p>
      </div>
    );

  const totalPortfolioValue = holdings.reduce((sum, item) => {
    return sum + (Number(item.total_quantity) * Number(item.current_price));
  }, 0);  

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">// MARKET OVERVIEW</div>
          <div className="dashboard-subtitle">
            CRYPTO <span>COMMAND CENTER</span>
          </div>
          
          {showCreatePortfolio ? (
            <form className="portfolio-selector create-portfolio-form" onSubmit={handleCreatePortfolio}>
              <input 
                type="text" 
                className="auth-input portfolio-input" 
                placeholder="Portfolio Name..." 
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="create-portfolio-btn confirm-btn">✔</button>
              <button type="button" className="create-portfolio-btn cancel-btn" onClick={() => setShowCreatePortfolio(false)}>✕</button>
            </form>
          ) : portfolios.length > 0 ? (
            <div className="portfolio-selector">
              <select
                value={selectedPortfolio || ""}
                onChange={(e) => setSelectedPortfolio(e.target.value)}
                className="portfolio-dropdown"
              >
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button 
                className="create-portfolio-btn add-new-btn" 
                onClick={() => setShowCreatePortfolio(true)}
                title="Create New Portfolio"
              >
                +
              </button>
            </div>
          ) : (
            <div className="portfolio-selector">
              <button 
                className="create-portfolio-btn" 
                onClick={() => setShowCreatePortfolio(true)}
              >
                + Create Portfolio
              </button>
            </div>
          )}
        </div>
        <div>
          <div className="live-badge">
            <span className="live-dot" />
            LIVE FEED {lastUpdated && `· ${lastUpdated}`}
          </div>
        </div>
      </div>
                {/* Portfolio Summary Section */}
      {selectedPortfolio && (
        <div className="portfolio-summary">
          <div className="portfolio-total">
            <h3>Total Balance</h3>
            <h2>${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
          
          <div className="holdings-list">
            <h4>Your Assets</h4>
            {holdings.length === 0 ? (
              <p className="empty-holdings">No assets in this portfolio yet.</p>
            ) : (
              <div className="holdings-grid">
                {holdings.map(h => {
                  const numQty = Number(h.total_quantity);
                  // Format nicely - avoid scientific notation like 1e-8
                  let displayQty = numQty.toString();
                  if (displayQty.includes('e')) {
                    displayQty = numQty.toFixed(8).replace(/\.?0+$/, '');
                  }
                  
                  return (
                    <div key={h.coin_id} className="holding-item">
                      <img src={h.image} alt={h.name} className="holding-icon" />
                      <div className="holding-info">
                        <span className="holding-name">{h.name}</span>
                        <span className="holding-qty">{displayQty} {h.symbol.toUpperCase()}</span>
                      </div>
                      <div className="holding-value">
                        ${(numQty * Number(h.current_price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="coin-grid">
        {coins.map((coin, i) => (
          <CoinCard 
            key={coin.id} 
            coin={coin} 
            index={i} 
            onTrade={setTradeModalCoin}
          />
        ))}
      </div>

      {/* Trade Modal */}
      {tradeModalCoin && (
        <div className="modal-overlay">
          <div className="modal-content auth-box">
            <div className="modal-header auth-logo">
              // EXECUTE_TRADE //
            </div>
            <h2 className="modal-title">Trade {tradeModalCoin.name}</h2>
            <p className="modal-subtitle auth-subtitle">
              Current Price: <span className="highlight-price">${tradeModalCoin.current_price.toLocaleString()}</span>
            </p>

            <form className="trade-form auth-form" onSubmit={handleTradeSubmit}>
              <div className="trade-type-selector">
                <button 
                  type="button" 
                  className={`type-btn ${tradeType === 'BUY' ? 'active buy' : ''}`}
                  onClick={(e) => { e.preventDefault(); setTradeType('BUY'); }}
                >
                  BUY
                </button>
                <button 
                  type="button" 
                  className={`type-btn ${tradeType === 'SELL' ? 'active sell' : ''}`}
                  onClick={(e) => { e.preventDefault(); setTradeType('SELL'); }}
                >
                  SELL
                </button>
              </div>

              <div className="input-group">
                <label className="input-label">QUANTITY ({tradeModalCoin.symbol.toUpperCase()})</label>
                <input 
                  type="text" 
                  required
                  className="auth-input trade-input"
                  value={tradeQuantity}
                  onChange={(e) => {
                    // Only allow numbers and one decimal point
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setTradeQuantity(val);
                    }
                  }}
                  placeholder="0.00"
                />
              </div>

              <div className="trade-summary">
                <span className="summary-label">ESTIMATED TOTAL:</span>
                <span className="summary-value">
                  ${tradeQuantity && !isNaN(tradeQuantity) ? (Number(tradeQuantity) * tradeModalCoin.current_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </span>
              </div>

              <div className="modal-actions">
                <button type="button" className="auth-btn cancel-btn" onClick={() => setTradeModalCoin(null)}>
                  ABORT
                </button>
                <button type="submit" className={`auth-btn submit-btn ${tradeType.toLowerCase()}-btn`}>
                  CONFIRM {tradeType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
