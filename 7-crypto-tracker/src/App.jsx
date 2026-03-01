import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  // error state to track if something goes wrong
  const [error, setError] = useState(null);

const fetchCryptoData = (controller) => {
    setLoading(true);
    // Clear any previous errors when starting a new fetch
    setError(null);

    fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false"
      // Add signal option: , { signal: controller.signal }
      , { signal: controller.signal }
    )
      .then((response) => response.json())
      .then((data) => {
        setCoins(data);
        // console.log(data);
        setLoading(false);
      })
      .catch((error) => {
        // Check if error is from abort
        if (error.name === "AbortError") {
          console.log("Fetch aborted");
          return;
        }
        console.error("Error fetching data:", error);
        setError("Failed to fetch crypto data. Please try again later.");
        setLoading(false);
      });
};

  useEffect(() => {
    const controller = new AbortController();
    
    //fetch immediately 
    fetchCryptoData(controller);
    
    //auto refresh every 30 sec
    const intervalId = setInterval(() => {
      fetchCryptoData(new AbortController());
    }, 30000);
    
    //cleanup function
    return () => {
      controller.abort();
      clearInterval(intervalId);
    }
  }, []); // Empty dependency array means this effect runs only once


  return (
    <div className="app-container">
      <h1>Crypto Tracker</h1>
      <div className="card-container">
        {/* Add error handling to the conditional rendering */}
        {/* Structure: if loading -> show loading, else if error -> show error, else -> show data */}
        {loading ? (
          <p>Loading crypto data...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          coins.map((coin) => (
            <div key={coin.id} className="card">
              <div className="card-header">
                <img src={coin.image} alt={coin.name} className="coin-logo" />
                <div>
                  <h3>{coin.name}</h3>
                  <p className="symbol">{coin.symbol.toUpperCase()}</p>
                </div>
              </div>
              <div>
                <p className="price">${coin.current_price.toLocaleString()}</p>
                <p className={coin.price_change_percentage_24h > 0 ? "positive" : "negative"}>
                  {coin.price_change_percentage_24h > 0 ? "▲" : "▼"}
                  {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                </p>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
