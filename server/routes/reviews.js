const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// Note: Testimonial reviews can be written/read publicly so no protect middleware explicitly required
router.get('/', reviewController.getReviews);
router.post('/', auth, reviewController.createReview);

module.exports = router;
