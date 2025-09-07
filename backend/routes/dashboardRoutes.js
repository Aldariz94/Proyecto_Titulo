const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

router.get('/stats', [authMiddleware, checkRole(['admin'])], getDashboardStats);

module.exports = router;