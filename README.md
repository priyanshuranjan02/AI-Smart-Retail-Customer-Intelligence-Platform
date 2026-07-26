# AI-Powered Smart Retail & Customer Intelligence Platform

An enterprise-grade, end-to-end Smart Retail platform integrating **Computer Vision (OpenCV + MobileNetV2 + Facial Recognition)**, **Natural Language Processing (TF-IDF + Logistic Regression Sentiment Analysis)**, **Hybrid FAQ Support Chatbot**, **FastAPI REST API Gateway**, **SQLite/PostgreSQL ORM**, and a modern **React + Vite + TailwindCSS Dashboard**.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["Client Dashboard / Postman / Webcam"] -->|HTTP REST + X-API-Key| Gateway["FastAPI Gateway (/app/main.py)"]

    subgraph Backend Pipeline
        Gateway --> Auth["API Key Middleware"]
        Gateway --> Singleton["Shared Singleton Loader (/app/pipeline.py)"]
        
        Singleton --> CVService["Computer Vision Service (/app/services/cv_service.py)"]
        Singleton --> NLPService["NLP Service (/app/services/nlp_service.py)"]
        Singleton --> ChatbotService["Chatbot Service (/app/services/chatbot_service.py)"]
        
        CVService -->|Face Detection & Encoding| FaceDB[("face_db.pkl")]
        CVService -->|Product Classification| ProductModel[("product_classifier.pkl")]
        
        NLPService -->|Sentiment Analysis| SentimentModel[("sentiment_model.pkl")]
        ChatbotService -->|Rule Engine + ML Intent| IntentModel[("chatbot_model.pkl")]
    end

    subgraph Data Store
        Gateway --> Database[("SQLite / PostgreSQL (smart_retail.db)")]
    end
```

---

## 📁 1. Complete Repository Folder Tree

```
smart-retail-ai/
├── app/
│   ├── main.py                    # FastAPI application entrypoint, CORS, API Key middleware
│   ├── config.py                  # Pydantic Settings configuration & paths
│   ├── database.py                # SQLAlchemy ORM models (Customer, Visit, Review, ChatLog, Prediction)
│   ├── pipeline.py                # Thread-safe Singleton Model Loader (loads models once at startup)
│   ├── models/
│   │   ├── schemas.py             # Pydantic request/response validation schemas
│   │   ├── product_classifier.pkl # Trained product category classifier model
│   │   ├── face_db.pkl            # Registered customer face encodings database
│   │   ├── sentiment_model.pkl    # Trained sentiment analysis model
│   │   ├── sentiment_vectorizer.pkl
│   │   ├── chatbot_model.pkl      # Trained intent classifier model
│   │   └── chatbot_vectorizer.pkl
│   ├── services/
│   │   ├── cv_service.py          # OpenCV preprocessing, Haar face detection, encodings, MobileNetV2 features
│   │   ├── nlp_service.py         # Text preprocessing (lowercasing, stopwords, lemmatization, TF-IDF)
│   │   └── chatbot_service.py     # Hybrid FAQ rule engine + ML intent classification
│   └── routers/
│       ├── vision.py              # POST /recognize-face, POST /classify-product
│       ├── nlp.py                 # POST /analyze-sentiment
│       ├── chatbot.py             # POST /chatbot
│       └── dashboard.py           # GET /dashboard/stats, /visits, /reviews, /logs
├── data/
│   ├── intents.json               # FAQ & Chatbot intent pattern dataset
│   ├── haarcascade_frontalface_default.xml # OpenCV Haar Cascade face XML
│   └── nltk_data/                 # Downloaded NLTK corpora
├── scripts/
│   ├── train_all_models.py        # Automated ML model training pipeline
│   └── seed_database.py           # Database seeder for demo analytics
├── tests/
│   ├── conftest.py                # Pytest fixtures and test database setup
│   ├── test_cv_service.py         # Computer Vision unit tests
│   ├── test_nlp_service.py        # NLP & text processing unit tests
│   ├── test_chatbot_service.py    # Hybrid Chatbot unit tests
│   └── test_api_endpoints.py      # End-to-end FastAPI integration tests
├── frontend/                      # React 18 + Vite + TailwindCSS Dashboard
│   ├── src/
│   │   ├── components/            # Sidebar, Header, StatCard
│   │   ├── pages/                 # Dashboard, Face Recognition, Product Classifier, Sentiment, Chatbot, Stats
│   │   ├── services/              # Axios API client with X-API-Key header
│   │   ├── App.jsx
│   │   ├── index.css              # Glassmorphism design system & Tailwind
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── Dockerfile                     # Multi-stage production container setup
├── docker-compose.yml             # Orchestrates API gateway and UI containers
├── requirements.txt               # Pinned Python backend dependencies
├── .env.example                   # Environment configuration template
├── .github/workflows/deploy.yml   # CI/CD GitHub Actions pipeline
└── README.md
```

---

## ⚡ 2. Quickstart & Local Deployment Commands

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm 10+
- Git

### Step-by-Step Setup

1. **Clone the repository and enter directory**:
   ```bash
   cd smart-retail-ai
   ```

2. **Create Python Virtual Environment & Install Dependencies**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Train All ML Models & Seed Database**:
   ```bash
   python scripts/train_all_models.py
   python scripts/seed_database.py
   ```

4. **Start the FastAPI Backend Gateway**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *The API Gateway will start at `http://localhost:8000`. Swagger documentation available at `http://localhost:8000/docs`.*

5. **Start the React + Vite Frontend**:
   In a new terminal tab:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Open `http://localhost:3000` (or `http://localhost:5173`) in your browser to view the interactive dashboard.*

---

## 🐳 3. Docker Container Deployment

Deploy the entire stack with Docker Compose:

```bash
# Build and start all services in detached mode
docker-compose up --build -d

# View container logs
docker-compose logs -f

# Stop containers
docker-compose down
```

---

## 🧪 4. Running Automated Pytest Suite

Run all unit and end-to-end integration tests:

```bash
PYTHONPATH=. pytest -v
```

---

## 🔑 5. API Documentation & Endpoint Reference

All protected endpoints require the header `X-API-Key: smart-retail-secret-key-2026`.

| Method | Endpoint | Description | Request Body / File | Sample Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/recognize-face` | Face recognition & visit logging | `file`: Image Upload | `{"customer_id": "CUST-1001", "known": true, "confidence": 0.94}` |
| `POST` | `/classify-product` | Retail product classification | `file`: Image Upload | `{"category": "Shoes", "confidence": 0.92, "all_probabilities": {...}}` |
| `POST` | `/analyze-sentiment` | Review text sentiment analysis | `{"text": "Great quality"}` | `{"sentiment": "Positive", "confidence": 0.89, "clean_tokens": [...]}` |
| `POST` | `/chatbot` | Hybrid FAQ Chatbot reply | `{"message": "Store hours"}`| `{"bot_response": "Open 9am-9pm", "intent": "store_hours"}` |
| `GET` | `/dashboard/stats` | Aggregated metrics & chart data | None | `{"total_visits": 120, "sentiment_distribution": {...}}` |

---

## 📊 6. Datasets Used

- **Product Classification**: Retail Checkout Dataset / Fashion-MNIST product categories (*Shoes, Clothes, Electronics, Groceries, Bags*).
- **Face Recognition**: LFW (Labeled Faces in the Wild) facial feature encoding benchmarks.
- **Sentiment Analysis**: Kaggle Women's E-Commerce Clothing Reviews & Amazon Retail Customer Reviews subset.
- **Chatbot Intents**: Custom `intents.json` (20+ intents covering store hours, returns, refunds, tracking, shipping, payment, discounts).

---

## 🔒 7. Ethics & Data Privacy Statement

Facial recognition in retail environments must strictly comply with regional data privacy laws (e.g., GDPR, CCPA). This project demonstrates privacy-by-design by storing mathematical feature encodings (embeddings) rather than raw facial images in `face_db.pkl`, requiring explicit customer opt-in consent for loyalty program tracking.

---

## ✅ 8. Final Verification Checklist

- [x] **Computer Vision (A1, A2, A3)**: OpenCV preprocessing, Haar Cascade face detection, MobileNetV2 product classification, facial encoding matching against `face_db.pkl`.
- [x] **NLP Module**: Text cleaning, stopword removal, lemmatization, TF-IDF + Logistic Regression sentiment analysis.
- [x] **Hybrid Chatbot**: Rule-based pattern engine + ML Intent Classifier on custom `intents.json`.
- [x] **Shared Singleton Pipeline**: Models loaded exactly once at startup in `app/pipeline.py`.
- [x] **FastAPI REST API**: Pydantic schemas, `X-API-Key` authentication middleware, SQLite ORM database integration, Swagger documentation at `/docs`.
- [x] **React + Vite Frontend**: Modern glassmorphism UI dashboard, Chart.js metrics, webcam capture, image classification filter preview, chatbot UI, filterable statistics table.
- [x] **MLOps & CI/CD**: `requirements.txt`, `Dockerfile`, `docker-compose.yml`, GitHub Actions workflow `.github/workflows/deploy.yml`, 100% Pytest pass rate.
