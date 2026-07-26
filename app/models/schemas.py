from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# --- Face Recognition Schemas ---
class BoundingBox(BaseModel):
    x: int
    y: int
    w: int
    h: int


class FaceRecognitionResponse(BaseModel):
    customer_id: str
    customer_name: Optional[str] = "Unknown Customer"
    known: bool
    confidence: float
    visit_time: str
    face_detected: bool
    bounding_box: Optional[BoundingBox] = None


# --- Product Classification Schemas ---
class PreprocessingMeta(BaseModel):
    original_size: List[int]
    resized_size: List[int]
    has_blur: bool
    edge_pixels: int


class ProductClassificationResponse(BaseModel):
    category: str
    confidence: float
    all_probabilities: Dict[str, float]
    preprocessing: PreprocessingMeta


# --- Sentiment Analysis Schemas ---
class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Customer review or feedback text")


class SentimentResponse(BaseModel):
    text: str
    sentiment: str  # Positive, Negative, Neutral
    confidence: float
    clean_tokens: List[str]


# --- Chatbot Schemas ---
class ChatbotRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User input message to chatbot")


class ChatbotResponse(BaseModel):
    user_message: str
    bot_response: str
    intent: str
    confidence: float


# --- Dashboard Stats Schemas ---
class DailyVisitStat(BaseModel):
    date: str
    visits: int
    returning: int
    unknown: int


class MonthlyVisitStat(BaseModel):
    month: str
    visits: int


class SentimentDistribution(BaseModel):
    positive: int
    negative: int
    neutral: int


class DashboardStatsResponse(BaseModel):
    total_visits: int
    returning_customers: int
    unknown_customers: int
    positive_reviews: int
    negative_reviews: int
    neutral_reviews: int
    sentiment_distribution: SentimentDistribution
    daily_visits: List[DailyVisitStat]
    monthly_visits: List[MonthlyVisitStat]
    top_product_categories: Dict[str, int]


# --- Error & Status Schemas ---
class HealthResponse(BaseModel):
    status: str
    version: str
    models_loaded: bool
    environment: str


class ErrorResponse(BaseModel):
    detail: str
    status_code: int
