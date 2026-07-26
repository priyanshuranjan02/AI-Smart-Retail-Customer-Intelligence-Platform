from app.services.chatbot_service import chatbot_service
from app.pipeline import pipeline


def test_chatbot_rule_match_hours():
    res = chatbot_service.generate_response(
        "What are your store hours?",
        model=pipeline.chatbot_model,
        vectorizer=pipeline.chatbot_vectorizer,
    )
    assert res["intent"] == "store_hours"
    assert res["confidence"] >= 0.85
    assert len(res["bot_response"]) > 10


def test_chatbot_rule_match_returns():
    res = chatbot_service.generate_response(
        "How do I return a product?",
        model=pipeline.chatbot_model,
        vectorizer=pipeline.chatbot_vectorizer,
    )
    assert res["intent"] == "returns"
    assert res["confidence"] >= 0.85


def test_chatbot_fallback_unknown():
    res = chatbot_service.generate_response(
        "xyz random unformatted gibberish text 999",
        model=pipeline.chatbot_model,
        vectorizer=pipeline.chatbot_vectorizer,
    )
    assert res["intent"] in ["unknown_query", "empty_input"] or res["confidence"] < 0.50
    assert len(res["bot_response"]) > 0
