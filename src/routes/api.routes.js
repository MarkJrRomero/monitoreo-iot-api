const express = require('express');
const router = express.Router();
const { login, ingestData } = require('../controllers/api.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.post('/ingesta', authMiddleware, ingestData);


module.exports = router;
