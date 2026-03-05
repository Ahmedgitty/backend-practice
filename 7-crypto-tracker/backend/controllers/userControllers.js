const pool = require('../config/db');

//USER CREATION
exports.createUser = async (req, res) => {
    const {username, email, password} = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO users (username, email, password)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [username, email, password]
        );
        return res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
};

exports.getAllUsers = async (req, res) => {

    try{
        const result = await pool.query(`SELECT * FROM users`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
};

exports.getUserById = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM users WHERE id = $1`,
            [req.params.id]
        );
        return res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM users WHERE id = $1`,
      [req.params.id]
    );

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};