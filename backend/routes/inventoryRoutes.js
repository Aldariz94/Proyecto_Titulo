const express = require('express');
const router = express.Router();
const { getItemsForAttention, deleteItemInstance } = require('../controllers/inventoryController'); 
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

router.get('/attention', [authMiddleware, checkRole(['admin'])], getItemsForAttention);
router.delete('/item/:itemModel/:itemId', [authMiddleware, checkRole(['admin'])], deleteItemInstance);

module.exports = router;