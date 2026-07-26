import numpy as np
import cv2
from app.services.cv_service import cv_service
from app.pipeline import pipeline


def test_read_image_bytes(sample_image_bytes):
    img_bgr = cv_service.read_image_bytes(sample_image_bytes)
    assert isinstance(img_bgr, np.ndarray)
    assert img_bgr.shape[2] == 3


def test_preprocess_image(sample_image_bytes):
    img_bgr = cv_service.read_image_bytes(sample_image_bytes)
    prep = cv_service.preprocess_image(img_bgr, target_size=(224, 224))

    assert "gray" in prep
    assert "edges" in prep
    assert "edge_pixel_count" in prep
    assert prep["resized_shape"] == (224, 224, 3)


def test_predict_product_category(sample_image_bytes):
    img_bgr = cv_service.read_image_bytes(sample_image_bytes)
    res = cv_service.predict_product_category(img_bgr, model=pipeline.product_classifier_model)

    assert "category" in res
    assert res["category"] in cv_service.product_categories
    assert "confidence" in res
    assert 0.0 <= res["confidence"] <= 1.0


def test_recognize_face(sample_image_bytes):
    img_bgr = cv_service.read_image_bytes(sample_image_bytes)
    res = cv_service.recognize_face(img_bgr, pipeline.face_db)

    assert "customer_id" in res
    assert "known" in res
    assert "confidence" in res
    assert "face_detected" in res
