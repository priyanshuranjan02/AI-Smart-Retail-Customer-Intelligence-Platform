import logging
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security API Key Middleware check
@app.middleware("http")
async def verify_api_key(request: Request, call_next):
    # Allow public endpoints (Swagger docs, health check, OPTIONS pre-flight)
    public_paths = ["/docs", "/redoc", "/openapi.json", "/", "/health"]
    if request.method == "OPTIONS" or request.url.path in public_paths:
        return await call_next(request)

    api_key = request.headers.get("X-API-Key")
    if not api_key or api_key != settings.API_KEY:
        # For ease of developer testing, if environment is development, allow requests with default key warning
        if settings.ENVIRONMENT == "development" and not api_key:
            pass  # Allow default dev pass
        else:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid or missing X-API-Key header."},
            )

    response = await call_next(request)
    return response


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
