const pool = require('../config/db');

// CREATE TRANSACTION
exports.createTransaction = async (req, res) => {
  const {portfolio_id, coin_id, type, quantity, price} = req.body;
  
  if (!portfolio_id || !coin_id || !type || !quantity || !price) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insert into transactions table
    const transactionResult = await client.query(
      `INSERT INTO transactions
       (portfolio_id, coin_id, type, quantity, price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [portfolio_id, coin_id, type, quantity, price]
    );

    const newTransaction = transactionResult.rows[0];
          
    // For a BUY, we add to holdings. For a SELL, we subtract.
    let qtyChange = parseFloat(quantity);
    if (type === 'SELL') {
      qtyChange = -qtyChange;
    }

    // Insert or update holdings
    await client.query(
      `INSERT INTO holdings (portfolio_id, coin_id, total_quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (portfolio_id, coin_id)
       DO UPDATE SET total_quantity = holdings.total_quantity + EXCLUDED.total_quantity`,
      [portfolio_id, coin_id, qtyChange]
    );

    // 3. Verify total_quantity hasn't gone below zero
    const holdingCheckResult = await client.query(
      `SELECT total_quantity FROM holdings WHERE portfolio_id = $1 AND coin_id = $2`,
      [portfolio_id, coin_id]
    );

    const finalQuantity = parseFloat(holdingCheckResult.rows[0].total_quantity);

    if (finalQuantity < -0.00000001) {
      throw new Error("Insufficient holdings for this sale.");
    }
    
    // Cleanup 0 holdings
    if (finalQuantity >= -0.00000001 && finalQuantity <= 0.00000001) {
      await client.query(
        `DELETE FROM holdings WHERE portfolio_id = $1 AND coin_id = $2`,
        [portfolio_id, coin_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(newTransaction);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
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