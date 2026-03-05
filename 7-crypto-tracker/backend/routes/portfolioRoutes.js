const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');

router.post('/', portfolioController.createPortfolio);
router.get('/user/:id', portfolioController.getUserPortfolio);

module.exports = router;