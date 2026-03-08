import { useEffect, useState } from "react";

function formatMarketCap(num) {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function CoinCard({ coin, index }) {
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
        <div className="coin-rank">#{coin.market_cap_rank}</div>
      </div>

      <div className="coin-price">${coin.current_price.toLocaleString()}</div>

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
    </div>
  );
}

function Dashboard() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchCryptoData = (controller) => {
    setError(null);
    fetch("http://localhost:8081/api/crypto", { signal: controller.signal })
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

  useEffect(() => {
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
  }, []);

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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">// MARKET OVERVIEW</div>
          <div className="dashboard-subtitle">
            CRYPTO <span>COMMAND CENTER</span>
          </div>
        </div>
        <div>
          <div className="live-badge">
            <span className="live-dot" />
            LIVE FEED {lastUpdated && `· ${lastUpdated}`}
          </div>
        </div>
      </div>

      <div className="coin-grid">
        {coins.map((coin, i) => (
          <CoinCard key={coin.id} coin={coin} index={i} />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
