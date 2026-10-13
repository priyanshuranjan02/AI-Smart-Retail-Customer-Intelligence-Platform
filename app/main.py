import logging
import secrets
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, Security, status
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.pipeline import pipeline
from app.routers import vision, nlp, chatbot, dashboard
from app.models.schemas import HealthResponse

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("main")

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler initializing DB and shared ML Pipeline."""
    logger.info("Initializing Smart Retail Application Startup...")
    init_db()
    pipeline.initialize()
    logger.info("Application Startup Completed!")
    yield
    logger.info("Shutting down application...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Industry-grade AI Smart Retail & Customer Intelligence API Gateway.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ai-smart-retail-customer-intelligence.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)


@app.middleware("http")
async def verify_api_key(request: Request, call_next):
    # Public endpoints and browser CORS preflight requests
    public_paths = {
        "/",
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
    }

    if request.method == "OPTIONS" or request.url.path in public_paths:
        return await call_next(request)

    configured_key = settings.API_KEY.strip()
    previous_key = settings.PREVIOUS_API_KEY.strip()
    supplied_key = request.headers.get("X-API-Key", "").strip()
    environment = settings.ENVIRONMENT.lower()

    # Allow keyless requests only for local development/testing
    # when no key is configured at all.
    if not configured_key:
        if environment in {"development", "dev", "test"} and not supplied_key:
            return await call_next(request)

        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": "API authentication is not configured."},
        )

    valid_keys = [
        key for key in (configured_key, previous_key) if key
    ]

    if not supplied_key or not any(
        secrets.compare_digest(supplied_key, valid_key)
        for valid_key in valid_keys
    ):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Invalid or missing API key."},
        )

    return await call_next(request)


# Register Routers
app.include_router(vision.router)
app.include_router(nlp.router)
app.include_router(chatbot.router)
app.include_router(dashboard.router)


@app.get("/", summary="Root API Welcome Endpoint")
def root():
    return {
        "title": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "Online",
        "docs": "/docs",
    }


@app.get("/health", response_model=HealthResponse, summary="Health Check Endpoint")
def health_check():
    return HealthResponse(
        status="Healthy",
        version=settings.VERSION,
        models_loaded=getattr(pipeline, "_is_initialized", False),
        environment=settings.ENVIRONMENT,
    )
