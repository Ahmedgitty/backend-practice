const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//Register
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }
  try {
    //check existing of user
    const existingUser = await pool.query(
      `SELECT * FROM users WHERE email = $1 OR username = $2`,
      [email, username]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ msg: "User with this email or username already exists" });
    }
    //hashin password
    const hashedPassword = await bcrypt.hash(password, 10);

    //insert user
    const result = await pool.query(
      `INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *`,
      [username, email, hashedPassword],
    );

    //generate token
    const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({ token, user: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error: " + err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!password || !email) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }
  try {
    const userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    if (userResult.rows.length == 0){
      return res.status(400).json({msg: "Invalid credentials"})
    }
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch){
      return res.status(400).json({msg: "Invalid credentials"})
    }
    const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});
    res.json({token, user});
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};
