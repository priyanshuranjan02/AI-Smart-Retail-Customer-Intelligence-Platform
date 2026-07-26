import logging
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db, ChatLog, PredictionLog
from app.pipeline import pipeline
from app.services.chatbot_service import chatbot_service
from app.models.schemas import ChatbotRequest, ChatbotResponse

logger = logging.getLogger("chatbot_router")

router = APIRouter(prefix="", tags=["Chatbot"])


@router.post(
    "/chatbot",
    response_model=ChatbotResponse,
    status_code=status.HTTP_200_OK,
    summary="Interact with Smart Retail FAQ Chatbot (Hybrid Rule-based + ML)",
)
async def chatbot_endpoint(
    payload: ChatbotRequest,
    db: Session = Depends(get_db),
):
    if not payload.message or not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message input cannot be empty.",
        )

    try:
        res = chatbot_service.generate_response(
            payload.message,
            model=pipeline.chatbot_model,
            vectorizer=pipeline.chatbot_vectorizer,
        )

        # Log into ChatLogs table
        new_log = ChatLog(
            user_message=payload.message,
            bot_response=res["bot_response"],
            intent=res["intent"],
            confidence=res["confidence"],
        )
        db.add(new_log)

        # Log prediction
        pred_log = PredictionLog(
            prediction_type="chatbot_intent",
            category=res["intent"],
            confidence=res["confidence"],
        )
        db.add(pred_log)
        db.commit()

        return res
    except Exception as e:
        logger.error(f"Error in chatbot endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot error: {str(e)}",
        )
