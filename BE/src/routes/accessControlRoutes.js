const express = require('express');
const router = express.Router();
const { swipeCard, getSimulatorData } = require('../controllers/accessControlController');

// Simulator API endpoints (Public / accessible for demo)
router.post('/swipe', swipeCard);
router.get('/simulator-data', getSimulatorData);

module.exports = router;
