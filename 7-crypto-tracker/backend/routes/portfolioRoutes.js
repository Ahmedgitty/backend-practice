const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, portfolioController.createPortfolio);
router.get('/user/:id', portfolioController.getUserPortfolio);
router.get('/:portfolioId/holdings', portfolioController.getPortfolioHoldings);

module.exports = router;