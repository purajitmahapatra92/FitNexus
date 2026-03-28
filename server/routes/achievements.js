const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const achievementController = require('../controllers/achievementController');

router.use(auth);

router.get('/',              achievementController.getAchievements);
router.get('/recent',        achievementController.getRecent);
router.get('/xp',            achievementController.getXPSummary);

module.exports = router;