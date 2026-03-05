const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');

router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.delete('/:id', userController.deleteUser);

module.exports = router;
