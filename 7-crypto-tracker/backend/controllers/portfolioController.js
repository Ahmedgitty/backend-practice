const pool = require('../config/db');

//CREAT PORTFOLIO HERE 
exports.createPortfolio = async (req, res) => {
  const {user_id, name, base_currency} = req.body;  

    try {
        const result = await pool.query(
            `INSERT INTO portfolios (user_id, name, base_currency)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [user_id, name, base_currency]
        );
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