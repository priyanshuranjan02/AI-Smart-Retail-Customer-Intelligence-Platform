from app.services.nlp_service import nlp_service
from app.pipeline import pipeline


def test_preprocess_text():
    sample = "Hello! Check out https://smartretail.com for 100% GREAT discounts & deals."
    prep = nlp_service.preprocess_text(sample)

    assert "clean_text" in prep
    assert "tokens" in prep
    assert "https" not in prep["clean_text"]
    assert "great" in prep["tokens"] or "deal" in prep["tokens"]


def test_analyze_sentiment_positive():
    text = "The retail product is amazing and exceptional quality!"
    res = nlp_service.analyze_sentiment(
        text, model=pipeline.sentiment_model, vectorizer=pipeline.sentiment_vectorizer
    )

    assert res["sentiment"] == "Positive"
    assert res["confidence"] > 0.40
    assert len(res["clean_tokens"]) > 0


def test_analyze_sentiment_negative():
    text = "Terrible quality, broken item and rude support."
    res = nlp_service.analyze_sentiment(
        text, model=pipeline.sentiment_model, vectorizer=pipeline.sentiment_vectorizer
    )

    assert res["sentiment"] == "Negative"
    assert res["confidence"] > 0.40

