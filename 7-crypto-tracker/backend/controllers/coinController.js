const pool = require('../config/db');
const axios = require('axios');

exports.getCoins = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM coins`);
        res.status(200).json(result.rows); // ← sends array ✅
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.fetchAndSaveCoin = async (req, res) => {
    const coinId = req.params.coinId; // e.g. "bitcoin"

    try {
        // 1. Fetch from CoinGecko
        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/markets`, {
            params: {
                vs_currency: 'usd',
                ids: coinId
            }
        });

        if (response.data.length === 0) {
            return res.status(404).json({ error: "Coin not found on CoinGecko" });
        }

        const coinData = response.data[0];

        // 2. Insert or Update in our Database (Using UPSERT)
        const result = await pool.query(
            `INSERT INTO coins (name, symbol, image, coin_id, current_price, price_change_percentage_24h)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (coin_id) 
             DO UPDATE SET 
                current_price = EXCLUDED.current_price,
                price_change_percentage_24h = EXCLUDED.price_change_percentage_24h,
                last_updated = CURRENT_TIMESTAMP
             RETURNING *`,
            [
                coinData.name, 
                coinData.symbol, 
                coinData.image, 
                coinData.id, 
                coinData.current_price, 
                coinData.price_change_percentage_24h
            ]
        );

        res.status(200).json(result.rows[0]);

    } catch (err) {
        // FALLBACK: If CoinGecko rate limits us, check if we already have it in DB
        try {
            const result = await pool.query(`SELECT * FROM coins WHERE coin_id = $1`, [coinId]);
            if (result.rows.length > 0) {
                return res.status(200).json(result.rows[0]);
            }
        } catch (dbErr) {
            console.error("DB Fallback error:", dbErr.message);
        }

        res.status(500).json({ error: err.message });
    }
};
