import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score


# ======================================================
# LOAD DATASET
# ======================================================

DATASET_FILE = "dataset.csv"

data = pd.read_csv(DATASET_FILE)

print("✅ Dataset loaded successfully!")
print("Total records:", len(data))


# ======================================================
# CHECK REQUIRED COLUMNS
# ======================================================

required_columns = ["skills", "career"]

for column in required_columns:
    if column not in data.columns:
        raise ValueError(
            f"❌ Missing required column: {column}"
        )


# ======================================================
# CLEAN DATA
# ======================================================

data = data.dropna(
    subset=["skills", "career"]
)

data["skills"] = data["skills"].astype(str)
data["career"] = data["career"].astype(str)


# ======================================================
# INPUT & TARGET
# ======================================================

X = data["skills"]
y = data["career"]


# ======================================================
# TRAIN / TEST SPLIT
# ======================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# ======================================================
# ML PIPELINE
# ======================================================

model = Pipeline([
    (
        "tfidf",
        TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2)
        )
    ),
    (
        "classifier",
        LogisticRegression(
            max_iter=1000
        )
    )
])


# ======================================================
# TRAIN MODEL
# ======================================================

print("\n🤖 Training ML career prediction model...")

model.fit(
    X_train,
    y_train
)


# ======================================================
# TEST MODEL
# ======================================================

predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions
)

print("\n📊 Model Accuracy:")
print(f"{accuracy * 100:.2f}%")


# ======================================================
# SAVE MODEL
# ======================================================

MODEL_FILE = "career_model.pkl"

joblib.dump(
    model,
    MODEL_FILE
)

print("\n✅ Model trained successfully!")
print(f"✅ Model saved as: {MODEL_FILE}")