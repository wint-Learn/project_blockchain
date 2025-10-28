const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');

// Get login activities for a wallet
router.get('/login', activityController.getLoginActivities);

module.exports = router;
