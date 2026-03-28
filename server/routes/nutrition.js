const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/nutritionController');

router.use(auth);

router.get('/logs',        ctrl.getLogs);
router.post('/logs',       ctrl.addLog);
router.put('/logs/:id',    ctrl.updateLog);
router.delete('/logs/:id', ctrl.deleteLog);
router.get('/goals',       ctrl.getGoals);
router.put('/goals',       ctrl.updateGoals);
router.get('/summary',     ctrl.getDailySummary);
router.get('/weekly',      ctrl.getWeeklySummary);
router.get('/foods',       ctrl.searchFoods);

module.exports = router;