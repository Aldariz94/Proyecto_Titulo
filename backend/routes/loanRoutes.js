const express = require('express');
const router = express.Router();
const { createLoan, returnLoan, getAllLoans, getLoansByUser, renewLoan, getMyLoans, getOverdueLoans } = require('../controllers/loanController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');


router.get('/my-loans', authMiddleware, getMyLoans);
router.post('/', [authMiddleware, checkRole(['admin'])], createLoan);
router.post('/return/:loanId', [authMiddleware, checkRole(['admin'])], returnLoan);
router.get('/', [authMiddleware, checkRole(['admin'])], getAllLoans);
router.get('/user/:userId', [authMiddleware, checkRole(['admin'])], getLoansByUser);
router.put('/:id/renew', [authMiddleware, checkRole(['admin'])], renewLoan);
router.get('/overdue', [authMiddleware, checkRole(['admin'])], getOverdueLoans);

module.exports = router;