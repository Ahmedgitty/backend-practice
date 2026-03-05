const express = require('express');
const router = express.Router();
const coinController = require('../controllers/coinController');

router.post('/:coinId', coinController.fetchAndSaveCoin);
router.get('/', coinController.getCoins);

module.exports = router;
