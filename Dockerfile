FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app ./app
COPY data ./data
COPY scripts ./scripts

# Download cascade xml if needed and train initial models
RUN curl -sSL -o data/haarcascade_frontalface_default.xml https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascade_frontalface_default.xml \
    && python scripts/train_all_models.py \
    && python scripts/seed_database.py

# Expose FastAPI server port
EXPOSE 8000

ENV ENVIRONMENT=production
ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
