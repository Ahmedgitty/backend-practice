// index.js
require("dotenv").config(); // Loads variables from .env
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const userRoutes = require("./routes/userRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const coinRoutes = require("./routes/coinRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 8082;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://7-crypto-tracker.vercel.app'
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
})); // Allow cross-origin requests from your frontend
app.use(express.json()); // Parse JSON request bodies

//Routes
app.use("/api/users", userRoutes);
app.use("/api/portfolios", portfolioRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/coins", coinRoutes);
app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running successfully",
  });
});

//external api route
app.get("/api/crypto", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false",
      {
        params: {
          vs_currency: "usd",
          order: "market_cap_desc",
          per_page: 10,
          page: 1,
          sparkline: false,
        },
      },
    );
    
    // Attempt to silently cache these to our DB so we always have recent prices
    try {
      const pool = require('./config/db');
      for (let coin of response.data) {
        await pool.query(
          `INSERT INTO coins (name, symbol, image, coin_id, current_price, price_change_percentage_24h)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (coin_id) DO UPDATE SET 
             current_price = EXCLUDED.current_price,
             price_change_percentage_24h = EXCLUDED.price_change_percentage_24h,
             last_updated = CURRENT_TIMESTAMP`,
          [coin.name, coin.symbol, coin.image, coin.id, coin.current_price, coin.price_change_percentage_24h]
        );
      }
    } catch (dbErr) {
      console.log("Silent DB cache update failed:", dbErr.message);
    }

    res.status(200).json(response.data);
  } catch (error) {
    console.log("CoinGecko API Error:", error.message);
    
    // FALLBACK: If CoinGecko rate limits (429), fetch latest data from our DB
    try {
      const pool = require('./config/db');
      const dbResult = await pool.query(
        `SELECT coin_id as id, name, symbol, image, current_price, price_change_percentage_24h 
         FROM coins 
         ORDER BY current_price DESC LIMIT 10`
      );
      
      if (dbResult.rows.length > 0) {
        console.log("Serving cached data from database due to rate limit.");
        return res.status(200).json(dbResult.rows);
      }
    } catch (fallbackErr) {
      console.log("Database fallback error:", fallbackErr.message);
    }

    res.status(500).json({ error: "Failed to fetch crypto data from all sources" });
  }
});

app.get("/api/user", (req, res) => {
  const user = {
    id: 101,
    name: "Ahmed Khan",
    email: "[EMAIL_ADDRESS]",
    loggedIn: true,
  };
  res.status(200).json(user);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
