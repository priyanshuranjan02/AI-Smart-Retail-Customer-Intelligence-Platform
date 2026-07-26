import logging
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db, Review, PredictionLog
from app.pipeline import pipeline
from app.services.nlp_service import nlp_service
from app.models.schemas import SentimentRequest, SentimentResponse

logger = logging.getLogger("nlp_router")

router = APIRouter(prefix="", tags=["Natural Language Processing"])


@router.post(
    "/analyze-sentiment",
    response_model=SentimentResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze customer review sentiment (Positive, Negative, Neutral)",
)
async def analyze_sentiment(
    payload: SentimentRequest,
    db: Session = Depends(get_db),
):
    if not payload.text or not payload.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text field cannot be empty.",
        )

    try:
        res = nlp_service.analyze_sentiment(
            payload.text,
            model=pipeline.sentiment_model,
            vectorizer=pipeline.sentiment_vectorizer,
        )

        # Log into Reviews database table
        new_review = Review(
            text=payload.text,
            sentiment=res["sentiment"],
            confidence=res["confidence"],
        )
        db.add(new_review)

        # Log prediction
        pred_log = PredictionLog(
            prediction_type="sentiment_analysis",
            category=res["sentiment"],
            confidence=res["confidence"],
        )
        db.add(pred_log)
        db.commit()

        return res
    except Exception as e:
        logger.error(f"Error in sentiment analysis endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sentiment analysis error: {str(e)}",
        )
