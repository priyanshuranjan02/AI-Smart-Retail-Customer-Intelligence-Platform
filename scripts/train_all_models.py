import os
import sys
import pickle
import json
import numpy as np
import cv2
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# Add parent directory to path so imports work cleanly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings
from app.services.cv_service import cv_service
from app.services.nlp_service import nlp_service


def train_product_classifier():
    """Trains and serializes the product classifier model."""
    print("--- Training Product Classifier Model ---")
    categories = cv_service.product_categories
    X, y = [], []

    # Generate synthetic feature samples representing 5 categories
    np.random.seed(42)
    for idx, cat in enumerate(categories):
        for _ in range(50):
            # Create synthetic color/spatial image patterns
            img = np.zeros((64, 64, 3), dtype=np.uint8)
            if cat == "Shoes":
                img[:, :, 0] = np.random.randint(150, 255, (64, 64))  # Red dominant
            elif cat == "Clothes":
                img[:, :, 1] = np.random.randint(150, 255, (64, 64))  # Green dominant
            elif cat == "Electronics":
                img[:, :, 2] = np.random.randint(150, 255, (64, 64))  # Blue dominant
            elif cat == "Groceries":
                img[:, :32, 0] = 200
                img[:, 32:, 1] = 200
            elif cat == "Bags":
                img[16:48, 16:48, :] = 180

            feat = cv_service.extract_image_features(img)
            X.append(feat)
            y.append(cat)

    X = np.array(X)
    clf = LogisticRegression(max_iter=500)
    clf.fit(X, y)

    os.makedirs(settings.MODEL_DIR, exist_ok=True)
    with open(settings.PRODUCT_CLASSIFIER_PATH, "wb") as f:
        pickle.dump(clf, f)
    print(f"Saved Product Classifier model to {settings.PRODUCT_CLASSIFIER_PATH}")


def train_face_db():
    """Generates initial registered customer facial encodings."""
    print("--- Generating Face Recognition Database ---")
    encodings_db = {
        "metadata": {"total_customers": 3, "version": "1.0"},
        "encodings": {}
    }

    customers = [
        {"id": "CUST-1001", "name": "Alice Vance", "color": (255, 100, 100)},
        {"id": "CUST-1002", "name": "Bob Smith", "color": (100, 255, 100)},
        {"id": "CUST-1003", "name": "Charlie Brown", "color": (100, 100, 255)},
    ]

    for cust in customers:
        # Generate synthetic face canvas with facial features
        canvas = np.full((128, 128, 3), 200, dtype=np.uint8)
        # Draw eyes and mouth for facial features
        cv2.circle(canvas, (40, 45), 10, cust["color"], -1)
        cv2.circle(canvas, (88, 45), 10, cust["color"], -1)
        cv2.ellipse(canvas, (64, 85), (25, 12), 0, 0, 180, (50, 50, 50), 3)

        encoding = cv_service.compute_face_encoding(canvas, (20, 20, 88, 88))
        encodings_db["encodings"][cust["id"]] = {
            "name": cust["name"],
            "encoding": encoding.tolist(),
        }

    os.makedirs(settings.MODEL_DIR, exist_ok=True)
    with open(settings.FACE_DB_PATH, "wb") as f:
        pickle.dump(encodings_db, f)
    print(f"Saved Face Encodings DB to {settings.FACE_DB_PATH}")


def train_sentiment_model():
    """Trains and serializes TF-IDF + Logistic Regression Sentiment Model."""
    print("--- Training Sentiment Analysis Model ---")
    training_data = [
        # Positive
        ("This product is amazing and top quality!", "Positive"),
        ("Extremely satisfied with fast delivery and great packaging.", "Positive"),
        ("Super happy with my purchase, works wonderfully!", "Positive"),
        ("Excellent customer support and friendly staff.", "Positive"),
        ("Loved the design and durable fabric. 5 stars!", "Positive"),
        ("Best retail shopping experience ever!", "Positive"),
        ("Very convenient checkout and great price discounts.", "Positive"),
        ("High quality clothes, fit is absolutely perfect.", "Positive"),
        ("Fantastic product, fast shipping, love it!", "Positive"),
        ("Superb quality and excellent store staff.", "Positive"),
        ("Very good items, top rating!", "Positive"),
        # Negative
        ("Terrible quality, broke after one day of use.", "Negative"),
        ("Very disappointed with late shipping and rude support.", "Negative"),
        ("Waste of money. Product does not match description.", "Negative"),
        ("Worst experience, item arrived damaged and defective.", "Negative"),
        ("Extremely unhappy with the refund delay.", "Negative"),
        ("Poor material, cheap feeling and uncomfortable.", "Negative"),
        ("Do not buy this, complete scam and broken packaging.", "Negative"),
        ("Horrible service, broken items, terrible experience.", "Negative"),
        ("Awful product, very slow delivery and bad quality.", "Negative"),
        # Neutral
        ("The package arrived today.", "Neutral"),
        ("Standard product, nothing special.", "Neutral"),
        ("Average quality for the price paid.", "Neutral"),
        ("Received the order on time.", "Neutral"),
        ("It works as expected.", "Neutral"),
        ("The store opened on time at 9 AM.", "Neutral")
    ]

    texts = [nlp_service.preprocess_text(t[0])["clean_text"] for t in training_data]
    labels = [t[1] for t in training_data]

    vectorizer = TfidfVectorizer(max_features=500, ngram_range=(1, 2))
    X_vec = vectorizer.fit_transform(texts)

    clf = LogisticRegression(C=5.0)
    clf.fit(X_vec, labels)

    os.makedirs(settings.MODEL_DIR, exist_ok=True)
    with open(settings.SENTIMENT_MODEL_PATH, "wb") as f:
        pickle.dump(clf, f)
    with open(settings.SENTIMENT_VECTORIZER_PATH, "wb") as f:
        pickle.dump(vectorizer, f)

    print(f"Saved Sentiment Model & Vectorizer to {settings.MODEL_DIR}")



def train_chatbot_model():
    """Trains and serializes ML Chatbot Intent Classifier."""
    print("--- Training Chatbot Intent Classifier Model ---")
    with open(settings.INTENTS_FILE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    texts, labels = [], []
    for intent in data.get("intents", []):
        tag = intent["tag"]
        for pattern in intent["patterns"]:
            clean_pat = nlp_service.preprocess_text(pattern)["clean_text"]
            if not clean_pat:
                clean_pat = pattern.lower()
            texts.append(clean_pat)
            labels.append(tag)

    vectorizer = TfidfVectorizer(ngram_range=(1, 2))
    X_vec = vectorizer.fit_transform(texts)

    clf = LogisticRegression(max_iter=500)
    clf.fit(X_vec, labels)

    os.makedirs(settings.MODEL_DIR, exist_ok=True)
    with open(settings.CHATBOT_MODEL_PATH, "wb") as f:
        pickle.dump(clf, f)
    with open(settings.CHATBOT_VECTORIZER_PATH, "wb") as f:
        pickle.dump(vectorizer, f)

    print(f"Saved Chatbot Model & Vectorizer to {settings.MODEL_DIR}")


if __name__ == "__main__":
    print("Beginning Model Training Pipeline...")
    train_product_classifier()
    train_face_db()
    train_sentiment_model()
    train_chatbot_model()
    print("ALL MODELS TRAINED AND SERIALIZED SUCCESSFULLY!")
