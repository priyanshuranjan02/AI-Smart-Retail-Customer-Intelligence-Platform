import io
from app.config import settings


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "Online"
    assert "docs" in json_data


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "Healthy"
    assert json_data["models_loaded"] is True


def test_analyze_sentiment_endpoint(client):
    headers = {"X-API-Key": settings.API_KEY}
    payload = {"text": "Excellent service and high quality retail products!"}
    response = client.post("/analyze-sentiment", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["sentiment"] == "Positive"
    assert data["confidence"] > 0.40



def test_chatbot_endpoint(client):
    headers = {"X-API-Key": settings.API_KEY}
    payload = {"message": "Where is my order tracking link?"}
    response = client.post("/chatbot", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "bot_response" in data
    assert data["intent"] in ["order_status", "shipping", "unknown_query"]


def test_classify_product_endpoint(client, sample_image_bytes):
    headers = {"X-API-Key": settings.API_KEY}
    files = {"file": ("test.jpg", io.BytesIO(sample_image_bytes), "image/jpeg")}
    response = client.post("/classify-product", files=files, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "category" in data
    assert "confidence" in data
    assert "preprocessing" in data


def test_recognize_face_endpoint(client, sample_image_bytes):
    headers = {"X-API-Key": settings.API_KEY}
    files = {"file": ("face.jpg", io.BytesIO(sample_image_bytes), "image/jpeg")}
    response = client.post("/recognize-face", files=files, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "customer_id" in data
    assert "known" in data
    assert "visit_time" in data


def test_dashboard_stats_endpoint(client):
    headers = {"X-API-Key": settings.API_KEY}
    response = client.get("/dashboard/stats", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_visits" in data
    assert "sentiment_distribution" in data
    assert "daily_visits" in data
    assert "monthly_visits" in data


def test_protected_route_rejects_missing_api_key(client, monkeypatch):
    monkeypatch.setattr(settings, "API_KEY", "test-only-secret")
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    response = client.get("/dashboard/stats")

    assert response.status_code == 401


def test_protected_route_rejects_invalid_api_key(client, monkeypatch):
    monkeypatch.setattr(settings, "API_KEY", "test-only-secret")
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    response = client.get(
        "/dashboard/stats",
        headers={"X-API-Key": "incorrect-test-key"},
    )

    assert response.status_code == 401


def test_protected_route_accepts_valid_api_key(client, monkeypatch):
    monkeypatch.setattr(settings, "API_KEY", "test-only-secret")
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    response = client.get(
        "/dashboard/stats",
        headers={"X-API-Key": "test-only-secret"},
    )

    assert response.status_code == 200


def test_production_rejects_requests_when_api_key_is_unconfigured(
    client, monkeypatch
):
    monkeypatch.setattr(settings, "API_KEY", "")
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    response = client.get("/dashboard/stats")

    assert response.status_code == 503


def test_health_endpoint_remains_public(client, monkeypatch):
    monkeypatch.setattr(settings, "API_KEY", "")
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    response = client.get("/health")

    assert response.status_code == 200


def test_previous_api_key_accepted_during_rotation(
    client, monkeypatch
):
    monkeypatch.setattr(
        settings, "API_KEY", "fresh-test-secret"
    )
    monkeypatch.setattr(
        settings, "PREVIOUS_API_KEY", "previous-test-secret"
    )
    monkeypatch.setattr(
        settings, "ENVIRONMENT", "production"
    )

    response = client.get(
        "/dashboard/stats",
        headers={"X-API-Key": "previous-test-secret"},
    )

    assert response.status_code == 200
