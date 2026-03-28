const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/exportController');

router.use(auth);

router.get('/workouts',  ctrl.exportWorkouts);
router.get('/nutrition', ctrl.exportNutrition);
router.get('/progress',  ctrl.exportProgress);
router.get('/prs',       ctrl.exportPRs);

module.exports = router;