const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const calendarController = require('../controllers/calendarController');

router.use(auth);

router.get('/',              calendarController.getEvents);   // ?month=2024-01
router.post('/',             calendarController.createEvent);
router.put('/:id',           calendarController.updateEvent);
router.delete('/:id',        calendarController.deleteEvent);

module.exports = router;