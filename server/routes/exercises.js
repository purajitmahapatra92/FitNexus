const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const exerciseController = require('../controllers/exerciseController');

router.use(auth);

router.get('/',           exerciseController.getExercises);    // ?muscle=chest&equipment=barbell&difficulty=beginner
router.get('/:id',        exerciseController.getExercise);
router.get('/muscle/:group', exerciseController.getByMuscle);

module.exports = router;