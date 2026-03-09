const express = require('express');
const router = express.Router();
const {
  predictAppealOutcome,
  predictAppealReasonCategory,
} = require('../controllers/aiPredictionController');

// You can secure this with auth middleware if needed
router.post('/predict', predictAppealOutcome);
router.post('/predict-reason', predictAppealReasonCategory);

module.exports = router;