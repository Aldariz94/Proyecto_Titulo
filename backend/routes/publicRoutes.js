const express = require('express');
const router = express.Router();
const { getPublicCatalog, getUserBookCatalog, getUserResourceCatalog } = require('../controllers/publicController');
const authMiddleware = require('../middleware/authMiddleware');


router.get('/catalog', getPublicCatalog);
router.get('/user-catalog/books', authMiddleware, getUserBookCatalog);
router.get('/user-catalog/resources', authMiddleware, getUserResourceCatalog);

module.exports = router;