const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const progressController = require('../controllers/progressController');

router.use(auth);

// Body metrics (weight, body fat, measurements)
router.get('/metrics',       progressController.getMetrics);
router.post('/metrics',      progressController.addMetric);
router.delete('/metrics/:id', progressController.deleteMetric);

// Strength PRs
router.get('/prs',           progressController.getPRs);
router.get('/prs/:exerciseId', progressController.getExercisePRs);

// Volume over time
router.get('/volume',        progressController.getVolumeHistory);

// Progress photos (base64 stored in DB for simplicity)
router.get('/photos',        progressController.getPhotos);
router.post('/photos',       progressController.addPhoto);
router.delete('/photos/:id', progressController.deletePhoto);

module.exports = router;