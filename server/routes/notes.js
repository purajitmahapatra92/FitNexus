const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const noteController = require('../controllers/noteController');

router.use(auth);

router.get('/',          noteController.getNotes);
router.post('/',         noteController.createNote);
router.put('/:id',       noteController.updateNote);
router.delete('/:id',    noteController.deleteNote);
router.patch('/:id/pin', noteController.togglePin);

module.exports = router;