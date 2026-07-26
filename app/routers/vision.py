from datetime import datetime
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status

from sqlalchemy.orm import Session

from app.database import get_db, CustomerVisit, Customer, PredictionLog
from app.pipeline import pipeline
from app.services.cv_service import cv_service
from app.models.schemas import FaceRecognitionResponse, ProductClassificationResponse

logger = logging.getLogger("vision_router")

router = APIRouter(prefix="", tags=["Computer Vision"])


@router.post(
    "/recognize-face",
    response_model=FaceRecognitionResponse,
    status_code=status.HTTP_200_OK,
    summary="Recognize returning customer via facial recognition and log visit",
)
async def recognize_face(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File provided is not an image.",
        )

    try:
        contents = await file.read()
        img_bgr = cv_service.read_image_bytes(contents)

        # Process face recognition against loaded face_db
        res = cv_service.recognize_face(img_bgr, pipeline.face_db)

        # Log visit into SQLite DB
        visit_time = datetime.utcnow()
        cust_code = res["customer_id"]
        status_str = "Known" if res["known"] else "Unknown"

        # Lookup customer object if known
        cust_id_fk = None
        if res["known"]:
            db_cust = db.query(Customer).filter(Customer.customer_code == cust_code).first()
            if db_cust:
                cust_id_fk = db_cust.id

        new_visit = CustomerVisit(
            customer_id=cust_id_fk,
            customer_code=cust_code,
            visit_time=visit_time,
            confidence=res["confidence"],
            status=status_str,
        )
        db.add(new_visit)

        # Log prediction log
        pred_log = PredictionLog(
            prediction_type="face_recognition",
            category=status_str,
            confidence=res["confidence"],
        )
        db.add(pred_log)
        db.commit()

        res["visit_time"] = visit_time.strftime("%Y-%m-%d %H:%M:%S")
        return res
    except Exception as e:
        logger.error(f"Error in face recognition endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face recognition error: {str(e)}",
        )


@router.post(
    "/classify-product",
    response_model=ProductClassificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Classify retail product category (Shoes, Clothes, Electronics, Groceries, Bags)",
)
async def classify_product(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File provided is not an image.",
        )

    try:
        contents = await file.read()
        img_bgr = cv_service.read_image_bytes(contents)

        res = cv_service.predict_product_category(
            img_bgr, model=pipeline.product_classifier_model
        )

        # Log prediction into DB
        pred_log = PredictionLog(
            prediction_type="product_classification",
            category=res["category"],
            confidence=res["confidence"],
        )
        db.add(pred_log)
        db.commit()

        return res
    except Exception as e:
        logger.error(f"Error in product classification endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Product classification error: {str(e)}",
        )


@router.post(
    "/register-customer",
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer face encoding dynamically",
)
async def register_customer(
    customer_code: str = Form(..., description="Unique customer loyalty code (e.g., CUST-1004)"),
    name: str = Form(..., description="Full name of the customer"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    import pickle
    from app.config import settings



    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File provided is not an image.",
        )

    # Check if customer already exists in DB
    existing_cust = db.query(Customer).filter(Customer.customer_code == customer_code).first()
    if existing_cust:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with code {customer_code} is already registered.",
        )

    try:
        contents = await file.read()
        img_bgr = cv_service.read_image_bytes(contents)

        # Detect face
        faces = cv_service.detect_faces_haar(img_bgr)
        if not faces:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No face detected in the image. Please upload a clear portrait.",
            )

        # Select largest face
        faces.sort(key=lambda b: b[2] * b[3], reverse=True)
        best_face = faces[0]

        # Compute face encoding
        encoding = cv_service.compute_face_encoding(img_bgr, best_face)

        # Update in-memory singleton
        pipeline.face_db["encodings"][customer_code] = {
            "name": name,
            "encoding": encoding.tolist(),
        }

        # Save to disk
        with open(settings.FACE_DB_PATH, "wb") as f:
            pickle.dump(pipeline.face_db, f)

        # Add customer to database
        new_cust = Customer(customer_code=customer_code, name=name)
        db.add(new_cust)
        db.commit()

        return {
            "message": "Customer registered successfully.",
            "customer_code": customer_code,
            "name": name,
            "face_detected": True,
            "encoding_length": len(encoding),
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error registering customer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Customer registration error: {str(e)}",
        )

