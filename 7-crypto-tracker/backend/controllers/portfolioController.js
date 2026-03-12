const pool = require('../config/db');

//CREAT PORTFOLIO HERE 
exports.createPortfolio = async (req, res) => {
  const {user_id, name, base_currency} = req.body;  

  //modified a bit so that its not necessary to send basecurrency to access protected route and match init.sql table.
    try { 
        let result;
        if(base_currency){
         result = await pool.query(
            `INSERT INTO portfolios (user_id, name, base_currency)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [user_id, name, base_currency]
        );
    } else {
        result = await pool.query(
            `INSERT INTO portfolios (user_id, name)
            VALUES ($1, $2)
            RETURNING *`,
            [user_id, name]
        );
    }    
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
};

//GET PORTFOLIO BY USER 
exports.getUserPortfolio = async (req, res) => {
    try{
        const result = await pool.query(
            `SELECT * FROM portfolios WHERE user_id = $1`,
            [req.params.id]
        );
        res.status(200).json(result.rows);
    } catch(err){
        res.status(500).json({error: err.message});
    }
};

// GET PORTFOLIO HOLDINGS
exports.getPortfolioHoldings = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT h.portfolio_id, h.coin_id, h.total_quantity, c.name, c.symbol, c.image, c.current_price, c.price_change_percentage_24h
             FROM holdings h
             JOIN coins c ON h.coin_id = c.id
             WHERE h.portfolio_id = $1`,
            [req.params.portfolioId]
        );
        res.status(200).json(result.rows);
    } catch(err) {
        res.status(500).json({error: err.message});
    }
};