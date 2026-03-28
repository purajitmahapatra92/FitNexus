const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/workoutController');

router.use(auth);

// Sessions routes MUST come before /:id to avoid param conflicts
router.get ('/sessions/all',               ctrl.getSessions);
router.get ('/sessions/:id',               ctrl.getSession);
router.put ('/sessions/:id',               ctrl.updateSession);
router.post('/sessions/:id/complete',      ctrl.completeSession);

// Workout CRUD
router.get ('/',                           ctrl.getWorkouts);
router.post('/',                           ctrl.createWorkout);
router.get ('/:id',                        ctrl.getWorkout);
router.put ('/:id',                        ctrl.updateWorkout);
router.delete('/:id',                      ctrl.deleteWorkout);

// Start a session for a workout
router.post('/:id/start',                  ctrl.startSession);

// Exercises within a workout
router.post('/:id/exercises',              ctrl.addExercise);
router.put ('/:id/exercises/:exerciseId',  ctrl.updateExercise);
router.delete('/:id/exercises/:exerciseId',ctrl.removeExercise);
router.post('/sessions/:id/swap', ctrl.swapExercise);
module.exports = router;