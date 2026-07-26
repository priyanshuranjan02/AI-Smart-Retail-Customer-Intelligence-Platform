import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Smart Retail & Customer Intelligence Platform"
    VERSION: str = "1.0.0"
    API_KEY: str = "smart-retail-secret-key-2026"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "sqlite:///./smart_retail.db"
    LOG_LEVEL: str = "INFO"

    # Base directories
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODEL_DIR: str = os.path.join(BASE_DIR, "app", "models")
    DATA_DIR: str = os.path.join(BASE_DIR, "data")

    # Model file paths
    PRODUCT_CLASSIFIER_PATH: str = os.path.join(MODEL_DIR, "product_classifier.pkl")
    FACE_DB_PATH: str = os.path.join(MODEL_DIR, "face_db.pkl")
    SENTIMENT_MODEL_PATH: str = os.path.join(MODEL_DIR, "sentiment_model.pkl")
    SENTIMENT_VECTORIZER_PATH: str = os.path.join(MODEL_DIR, "sentiment_vectorizer.pkl")
    CHATBOT_MODEL_PATH: str = os.path.join(MODEL_DIR, "chatbot_model.pkl")
    CHATBOT_VECTORIZER_PATH: str = os.path.join(MODEL_DIR, "chatbot_vectorizer.pkl")
    INTENTS_FILE_PATH: str = os.path.join(DATA_DIR, "intents.json")

    # Image processing defaults
    IMAGE_TARGET_SIZE: tuple[int, int] = (224, 224)
    FACE_MATCH_THRESHOLD: float = 0.6

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
