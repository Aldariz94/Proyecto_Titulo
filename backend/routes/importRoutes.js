
const express = require('express');
const router = express.Router();
const { importUsers, importBooks, importResources } = require('../controllers/importController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');


router.post('/users', [authMiddleware, checkRole(['admin'])], upload.single('file'), importUsers);
router.post('/books', [authMiddleware, checkRole(['admin'])], upload.single('file'), importBooks);
router.post('/resources', [authMiddleware, checkRole(['admin'])], upload.single('file'), importResources);

module.exports = router;