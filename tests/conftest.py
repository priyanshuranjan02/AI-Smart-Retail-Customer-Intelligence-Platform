import os
import sys
import io
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
import cv2
from PIL import Image
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.pipeline import pipeline
from app.config import settings


TEST_DATABASE_URL = "sqlite:///./test_smart_retail.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    Base.metadata.create_all(bind=engine)
    pipeline.initialize()
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_smart_retail.db"):
        try:
            os.remove("./test_smart_retail.db")
        except Exception:
            pass


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_image_bytes():
    """Generates synthetic test image bytes (224x224 RGB)."""
    img_np = np.zeros((224, 224, 3), dtype=np.uint8)
    # Draw face shape for detection test
    cv2.circle(img_np, (112, 112), 60, (255, 200, 180), -1)
    cv2.circle(img_np, (90, 95), 10, (50, 50, 50), -1)
    cv2.circle(img_np, (134, 95), 10, (50, 50, 50), -1)
    cv2.ellipse(img_np, (112, 145), (25, 10), 0, 0, 180, (50, 50, 50), 3)

    img_pil = Image.fromarray(img_np)
    buf = io.BytesIO()
    img_pil.save(buf, format="JPEG")
    return buf.getvalue()
