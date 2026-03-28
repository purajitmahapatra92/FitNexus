const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/profileController');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// ── Multer storage config ─────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${req.user.id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext     = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG and WebP images are allowed.'));
    }
  },
});

// ── Routes ────────────────────────────────────────────────────
router.use(auth);

router.get('/streak',          ctrl.getStreak);
router.get('/avatar',          ctrl.getAvatar);
router.post('/avatar',         upload.single('avatar'), ctrl.uploadAvatar);
router.get('/',                ctrl.getProfile);
router.put('/',                ctrl.updateProfile);
router.put('/onboard',         ctrl.completeOnboarding);
router.put('/password',        ctrl.changePassword);

module.exports = router;