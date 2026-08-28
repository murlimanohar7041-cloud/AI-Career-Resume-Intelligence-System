import sys
import json
import joblib
import os

MODEL_FILE = os.path.join(
    os.path.dirname(__file__),
    "career_model.pkl"
)

try:
    # Load trained ML model
    model = joblib.load(MODEL_FILE)

    # Skills/text received from Node.js
    skills = sys.argv[1] if len(sys.argv) > 1 else ""

    if not skills.strip():
        print(json.dumps({
            "success": False,
            "message": "No skills provided"
        }))
        sys.exit(0)

    # Predict career
    prediction = model.predict([skills])[0]

    print(json.dumps({
        "success": True,
        "career": prediction
    }))

except Exception as error:
    print(json.dumps({
        "success": False,
        "message": str(error)
    }))