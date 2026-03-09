// Lightweight, in-process AI-style logic so the deployed backend
// does not depend on a separate Flask service (which is not available
// on Render by default).

// Helper to build human-readable reasoning similar to the original Flask service
const buildReasoning = (appealReason, probability, evidenceUploaded, daysAfterViolation) => {
  const text = (appealReason || '').toLowerCase();
  const reasons = [];

  if (evidenceUploaded && daysAfterViolation <= 14) {
    reasons.push(
      'Evidence is provided and the appeal was submitted within 14 days, which significantly increases the approval probability.'
    );
  } else if (evidenceUploaded && daysAfterViolation > 14) {
    reasons.push(
      'The appeal was submitted after 14 days, which reduces the approval chances even though evidence is provided.'
    );
  } else if (!evidenceUploaded && daysAfterViolation <= 14) {
    reasons.push(
      'No evidence was uploaded, which lowers the approval probability even though it was submitted within 14 days.'
    );
  } else {
    reasons.push(
      'No evidence was uploaded and the appeal was submitted after 14 days, which makes approval very unlikely.'
    );
  }

  if (/(emergency|hospital|medical|ambulance|doctor)/.test(text)) {
    reasons.push('You mention an emergency or medical situation, which can partially support your case.');
  }

  if (
    /(camera error|system error|wrong plate|mistake in the system|incorrect record)/.test(
      text
    )
  ) {
    reasons.push('You suggest there may be an error in how the violation was recorded.');
  }

  if (!reasons.length) {
    if (probability >= 0.6) {
      reasons.push('Overall the details suggest a reasonable case, increasing approval chances.');
    } else {
      reasons.push(
        'The explanation does not clearly show strong evidence or exceptional circumstances.'
      );
    }
  }

  return reasons.join(' ');
};

exports.predictAppealOutcome = async (req, res) => {
  try {
    const {
      violation_type,
      violation_date, // ISO string (YYYY-MM-DD)
      evidence_uploaded,
      previous_violations,
      days_after_violation,
      appeal_reason_length,
      appeal_reason,
    } = req.body;

    // Basic input validation
    if (!violation_type) {
      return res.status(400).json({
        success: false,
        message: 'violation_type is required',
      });
    }

    // Normalize numeric fields
    const evidenceBinary =
      evidence_uploaded === true || evidence_uploaded === '1' || evidence_uploaded === 1
        ? 1
        : 0;
    const prevViolations = Number(previous_violations || 0);
    const daysAfter = Number(days_after_violation || 0);
    const reasonLength = Number(appeal_reason_length || 0);

    // Derive simple probability following the same high-level rules as the Flask service
    let probability = 0.5;

    if (evidenceBinary === 1 && daysAfter <= 14) {
      probability = 0.92;
    } else if (evidenceBinary === 1 && daysAfter > 14) {
      probability = 0.6;
    } else if (evidenceBinary === 0 && daysAfter <= 14) {
      probability = 0.45;
    } else if (evidenceBinary === 0 && daysAfter > 14) {
      probability = 0.25;
    }

    // Penalize many previous violations slightly
    if (prevViolations >= 3) {
      probability -= 0.1;
    } else if (prevViolations === 2) {
      probability -= 0.05;
    }

    // Reward detailed explanations a bit
    if (reasonLength > 300) {
      probability += 0.05;
    } else if (reasonLength < 50) {
      probability -= 0.05;
    }

    // Clamp to [0, 1]
    probability = Math.max(0, Math.min(1, probability));

    const probPercent = Math.round(probability * 100);
    const reasoningText = buildReasoning(appeal_reason, probability, evidenceBinary, daysAfter);
    const formattedOutput = `Approval Probability: ${probPercent}%\nReasoning: ${reasoningText}`;

    // Decide label based on probability
    const prediction = probability >= 0.5 ? 'approved' : 'rejected';

    return res.json({
      success: true,
      prediction,
      probability,
      reasoning: reasoningText,
      formatted_output: formattedOutput,
    });
  } catch (err) {
    console.error('AI prediction error (in-process):', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while generating AI prediction',
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

    const text = appeal_reason.toLowerCase();

    const categories = {
      'Emergency Situation': /(emergency|hospital|medical|ambulance|doctor|accident)/,
      'Technical Error': /(camera error|system error|technical error|wrong plate|system mistake)/,
      'Incorrect Violation': /(not my fault|incorrect|wrong violation|did not|no violation)/,
    };

    let chosenCategory = 'Other';
    let confidence = 0.55;

    for (const [label, regex] of Object.entries(categories)) {
      if (regex.test(text)) {
        chosenCategory = label;
        confidence = 0.8;
        break;
      }
    }

    const probabilities = {
      'Emergency Situation': chosenCategory === 'Emergency Situation' ? confidence : 0.05,
      'Technical Error': chosenCategory === 'Technical Error' ? confidence : 0.05,
      'Incorrect Violation': chosenCategory === 'Incorrect Violation' ? confidence : 0.05,
      Other: chosenCategory === 'Other' ? confidence : 0.1,
    };

    return res.json({
      success: true,
      category: chosenCategory,
      confidence,
      probabilities,
    });
  } catch (err) {
    console.error('AI reason prediction error (in-process):', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while generating AI reason prediction',
    });
  }
};
