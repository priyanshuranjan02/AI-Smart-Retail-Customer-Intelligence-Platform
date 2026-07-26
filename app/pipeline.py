import os
import pickle
import logging
from typing import Optional, Dict, Any

from app.config import settings
from app.services.cv_service import cv_service
from app.services.nlp_service import nlp_service
from app.services.chatbot_service import chatbot_service

logger = logging.getLogger("model_pipeline")


class ModelPipelineSingleton:

    _instance: Optional["ModelPipelineSingleton"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelPipelineSingleton, cls).__new__(cls)
            cls._instance._is_initialized = False
        return cls._instance

    def initialize(self):
        """Loads all serialized ML models and datasets into memory ONCE at application startup."""
        if getattr(self, "_is_initialized", False):
            logger.info("Model pipeline is already initialized.")
            return

        logger.info("Initializing Model Pipeline & Loading Artifacts...")

        # 1. Product Classifier Model
        self.product_classifier_model = self._load_pickle(settings.PRODUCT_CLASSIFIER_PATH)

        # 2. Face Recognition Encodings Database
        self.face_db = self._load_pickle(settings.FACE_DB_PATH)
        if not self.face_db:
            self.face_db = {"metadata": {}, "encodings": {}}

        # 3. Sentiment Model & Vectorizer
        self.sentiment_model = self._load_pickle(settings.SENTIMENT_MODEL_PATH)
        self.sentiment_vectorizer = self._load_pickle(settings.SENTIMENT_VECTORIZER_PATH)

        # 4. Chatbot Model & Vectorizer
        self.chatbot_model = self._load_pickle(settings.CHATBOT_MODEL_PATH)
        self.chatbot_vectorizer = self._load_pickle(settings.CHATBOT_VECTORIZER_PATH)

        # 5. Load Intents FAQ JSON into Chatbot Service
        chatbot_service.load_intents(settings.INTENTS_FILE_PATH)

        self._is_initialized = True
        logger.info("All 4 ML Models and Databases Loaded Successfully!")

    def _load_pickle(self, file_path: str) -> Optional[Any]:
        """Safely loads a serialized pickle file."""
        if os.path.exists(file_path):
            try:
                with open(file_path, "rb") as f:
                    obj = pickle.load(f)
                logger.info(f"Loaded model artifact from {file_path}")
                return obj
            except Exception as e:
                logger.error(f"Error loading model artifact {file_path}: {e}")
                return None
        else:
            logger.warning(f"Model artifact not found at {file_path}. Dynamic fallback will be active.")
            return None


pipeline = ModelPipelineSingleton()
