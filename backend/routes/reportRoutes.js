const express = require('express');
const router = express.Router();
const { generateLoanReport } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

router.get('/loans', [authMiddleware, checkRole(['admin', 'profesor'])], generateLoanReport);

module.exports = router;