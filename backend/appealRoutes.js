const express = require('express');
const router = express.Router();
const {
  createAppeal,
  getMyAppeals,
  getAppeal,
  getAllAppeals,
  updateAppealStatus,
  getAppealStatistics,
} = require('../controllers/appealController');
const { protect, admin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      'evidence-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images and PDFs
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF) and PDFs are allowed!'));
    }
  },
});

// All routes are protected
router.use(protect);

// Citizen routes
router.post('/', upload.single('evidence'), createAppeal);
router.get('/', getMyAppeals);
router.get('/:id', getAppeal);

// Admin routes
router.get('/admin/all', admin, getAllAppeals);
router.get('/admin/statistics', admin, getAppealStatistics);
router.put('/:id/status', admin, updateAppealStatus);

module.exports = router;

