const pool = require('../config/db');

// CREATE TRANSACTION
exports.createTransaction = async (req, res) => {
  const {portfolio_id, coin_id, type, quantity, price} = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO transactions
       (portfolio_id, coin_id, type, quantity, price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [portfolio_id, coin_id, type, quantity, price]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET TRANSACTIONS BY PORTFOLIO
exports.getPortfolioTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM transactions WHERE portfolio_id = $1`,
      [req.params.portfolioId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};