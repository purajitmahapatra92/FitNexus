const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/habitController');

router.use(auth);

router.get   ('/',                ctrl.getHabits);
router.post  ('/',                ctrl.createHabit);
router.put   ('/:id',             ctrl.updateHabit);
router.delete('/:id',             ctrl.deleteHabit);
router.post  ('/:id/complete',    ctrl.toggleComplete);
router.get   ('/:id/streak',      ctrl.getStreak);
router.get   ('/summary/today',   ctrl.getTodaySummary);
router.get   ('/summary/week',    ctrl.getWeekSummary);

// Water routes
router.get   ('/water/today',     ctrl.getWaterToday);
router.post  ('/water/add',       ctrl.addWater);
router.delete('/water/reset',     ctrl.resetWater);

module.exports = router;