// index.js
require('dotenv').config(); // Loads variables from .env
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const userRoutes = require('./routes/userRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const coinRoutes = require('./routes/coinRoutes');

const app = express();
const PORT = process.env.PORT || 8082;

// Middleware
app.use(cors()); // Allow cross-origin requests from your frontend
app.use(express.json()); // Parse JSON request bodies

//Routes
app.use('/api/users', userRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/coins', coinRoutes);
app.get('/health', (req,res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is running successfully"
    });
});

//external api route 
app.get('/api/crypto', async (req, res) => {
  try{
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false', {
        params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 10,
            page: 1,
            sparkline: false
        },
    });
    res.status(200).json(response.data); 
  } catch (error){
    console.log("Error fetching data from CoinGecko:", error.message);
    res.status(500).json({ error: "Failed to fetch crypto data" });
  }
});

app.get('/api/user', (req,res) => {
    const user = {
        id: 101,
        name: "Ahmed Khan",
        email: "[EMAIL_ADDRESS]",
        loggedIn: true
    };
    res.status(200).json(user);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
