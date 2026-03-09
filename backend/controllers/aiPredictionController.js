const FLASK_URL = process.env.AI_MODEL_SERVICE_URL || 'http://localhost:5001/predict';
const REASON_FLASK_URL =
  process.env.AI_REASON_MODEL_SERVICE_URL || 'http://localhost:5001/predict-reason';

exports.predictAppealOutcome = async (req, res) => {
  try {
    // Expect fields from frontend body
    const {
      violation_type,
      violation_date,           // ISO string
      evidence_uploaded,        // boolean or 0/1
      previous_violations,
      days_after_violation,
      appeal_reason_length,
      appeal_reason
    } = req.body;

    // Normalize evidence_uploaded to 0/1
    const evidenceBinary =
      evidence_uploaded === true || evidence_uploaded === '1' || evidence_uploaded === 1 ? 1 : 0;

    const payload = {
      violation_type,
      violation_date,
      evidence_uploaded: evidenceBinary,
      previous_violations: Number(previous_violations || 0),
      days_after_violation: Number(days_after_violation || 0),
      appeal_reason_length: Number(appeal_reason_length || 0),
      appeal_reason: appeal_reason || ''
    };

    const response = await fetch(FLASK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return res.status(400).json({
        success: false,
        message: data.message || 'AI prediction failed'
      });
    }

    return res.json({
      success: true,
      prediction: data.prediction,                // 'approved' or 'rejected'
      probability: data.probability,             // 0–1
      reasoning: data.reasoning,
      formatted_output: data.formatted_output,
      raw: data
    });
  } catch (err) {
    console.error('AI prediction error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while calling AI prediction service'
    });
  }
};

exports.predictAppealReasonCategory = async (req, res) => {
  try {
    const { appeal_reason } = req.body;

    if (!appeal_reason || !appeal_reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'appeal_reason is required',
      });
    }

    const response = await fetch(REASON_FLASK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appeal_reason }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return res.status(400).json({
        success: false,
        message: data.message || 'AI reason prediction failed',
      });
    }

    return res.json({
      success: true,
      category: data.category,
      confidence: data.confidence,
      probabilities: data.probabilities || null,
      raw: data,
    });
  } catch (err) {
    console.error('AI reason prediction error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while calling AI reason prediction service',
    });
  }
};