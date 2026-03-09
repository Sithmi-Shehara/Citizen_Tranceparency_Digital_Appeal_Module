from flask import Flask, request, jsonify
import pickle
import numpy as np
import pandas as pd
from datetime import datetime

app = Flask(__name__)

# Load the trained pipelines
model = pickle.load(open("appeal_model.pkl", "rb"))
reason_model = pickle.load(open("appeal_reason_model.pkl", "rb"))


def build_reasoning(appeal_reason: str, probability: float, evidence_uploaded: int, days_after_violation: int) -> str:
    """
    Generate a short natural-language explanation based on evidence and timing rules.
    """
    text = (appeal_reason or "").lower()
    reasons = []

    # Core rule-based explanation (matches front-end expectations)
    if evidence_uploaded and days_after_violation <= 14:
        reasons.append(
            "Evidence is provided and the appeal was submitted within 14 days, which significantly increases the approval probability."
        )
    elif evidence_uploaded and days_after_violation > 14:
        reasons.append(
            "The appeal was submitted after 14 days, which reduces the approval chances even though evidence is provided."
        )
    elif not evidence_uploaded and days_after_violation <= 14:
        reasons.append(
            "No evidence was uploaded, which lowers the approval probability even though it was submitted within 14 days."
        )
    else:  # no evidence and submitted after 14 days
        reasons.append(
            "No evidence was uploaded and the appeal was submitted after 14 days, which makes approval very unlikely."
        )

    # Optional extra nuance from text (emergency or system error)
    if any(word in text for word in ["emergency", "hospital", "medical", "ambulance", "doctor"]):
        reasons.append("You mention an emergency or medical situation, which can partially support your case.")

    if any(word in text for word in ["camera error", "system error", "wrong plate", "mistake in the system", "incorrect record"]):
        reasons.append("You suggest there may be an error in how the violation was recorded.")

    if not reasons:
        if probability >= 0.6:
            reasons.append("Overall the details suggest a reasonable case, increasing approval chances.")
        else:
            reasons.append("The explanation does not clearly show strong evidence or exceptional circumstances.")

    return " ".join(reasons)


@app.route("/predict", methods=["POST"])
def predict():
    """
    Expects JSON body with fields:
    - violation_type (str)
    - violation_date (ISO string, e.g. '2026-03-01')
    - evidence_uploaded (0 or 1)
    - previous_violations (int)
    - days_after_violation (int)
    - appeal_reason_length (int)
    - appeal_reason (str, full text used only for explanation)
    """
    data = request.json or {}

    try:
        violation_type = data["violation_type"]
        violation_date_str = data.get("violation_date")
        evidence_uploaded = int(data["evidence_uploaded"])
        previous_violations = int(data["previous_violations"])
        days_after_violation = int(data["days_after_violation"])
        appeal_reason_length = int(data["appeal_reason_length"])
        appeal_reason = data.get("appeal_reason", "")

        # Parse violation_date to derive day_of_week and month
        if violation_date_str:
            v_date = datetime.fromisoformat(violation_date_str).date()
        else:
            v_date = datetime.now().date()

        violation_day_of_week = v_date.weekday()
        violation_month = v_date.month

        # Build DataFrame matching training features (model still uses numeric + categorical features,
        # not the raw text; the text is only for human-readable reasoning)
        features_df = pd.DataFrame([{
            "violation_type": violation_type,
            "evidence_uploaded": evidence_uploaded,
            "previous_violations": previous_violations,
            "days_after_violation": days_after_violation,
            "appeal_reason_length": appeal_reason_length,
            "violation_day_of_week": violation_day_of_week,
            "violation_month": violation_month
        }])

        pred = model.predict(features_df)[0]
        proba = float(model.predict_proba(features_df)[0][1])  # base probability of "approved" class

        # Rule-based adjustment on top of the model probability
        # Rule 1: Evidence YES and <= 14 days -> HIGH (90–95%)
        if evidence_uploaded == 1 and days_after_violation <= 14:
            proba = max(proba, 0.90)
            proba = min(proba, 0.95)
        # Rule 2: Evidence YES and > 14 days -> MEDIUM (55–65%)
        elif evidence_uploaded == 1 and days_after_violation > 14:
            proba = min(max(proba, 0.55), 0.65)
        # Rule 3: Evidence NO and <= 14 days -> LOW (< 50%)
        elif evidence_uploaded == 0 and days_after_violation <= 14:
            proba = min(proba, 0.50)
        # Rule 4: Evidence NO and > 14 days -> VERY LOW (< 30%)
        elif evidence_uploaded == 0 and days_after_violation > 14:
            proba = min(proba, 0.30)

        # Final clamp to [0, 1]
        proba = max(0.0, min(1.0, proba))
        prob_percent = round(proba * 100, 2)

        reasoning_text = build_reasoning(appeal_reason, proba, evidence_uploaded, days_after_violation)
        formatted_output = f"Approval Probability: {prob_percent}%\nReasoning: {reasoning_text}"

        return jsonify({
            "success": True,
            "prediction": "approved" if int(pred) == 1 else "rejected",
            "probability": proba,
            "probability_percent": prob_percent,
            "reasoning": reasoning_text,
            "formatted_output": formatted_output,
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Prediction error: {str(e)}"
        }), 400


@app.route("/predict-reason", methods=["POST"])
def predict_reason():
    """
    Predict the category of an appeal_reason text using the trained text classification model.

    Expects JSON body:
    - appeal_reason (str, required)
    """
    data = request.json or {}

    try:
        appeal_reason = data.get("appeal_reason", "")

        if not appeal_reason or not appeal_reason.strip():
            return jsonify({
                "success": False,
                "message": "appeal_reason is required"
            }), 400

        # reason_model is expected to be a scikit-learn Pipeline with
        # TF-IDF vectorizer + classifier supporting predict_proba
        proba_arr = reason_model.predict_proba([appeal_reason])[0]
        classes = list(reason_model.classes_)

        top_idx = int(np.argmax(proba_arr))
        top_category = classes[top_idx]
        top_confidence = float(proba_arr[top_idx])

        probabilities = {
            cls: float(p)
            for cls, p in zip(classes, proba_arr)
        }

        return jsonify({
            "success": True,
            "category": top_category,
            "confidence": top_confidence,
            "probabilities": probabilities
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Reason prediction error: {str(e)}"
        }), 400

if __name__ == "__main__":
    # Run Flask microservice on port 5001
    app.run(host="0.0.0.0", port=5001)