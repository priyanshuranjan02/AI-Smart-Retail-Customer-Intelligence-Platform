import os
import re
import string
import logging
from typing import List, Dict, Any, Tuple, Optional
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize

from app.config import settings

logger = logging.getLogger("nlp_service")

# Set NLTK data directory inside workspace to avoid home directory permission issues
nltk_data_dir = os.path.join(settings.BASE_DIR, "data", "nltk_data")
os.makedirs(nltk_data_dir, exist_ok=True)
nltk.data.path.append(nltk_data_dir)

# Download NLTK datasets into workspace data dir
for resource in ["stopwords", "punkt", "wordnet", "punkt_tab"]:
    try:
        nltk.download(resource, download_dir=nltk_data_dir, quiet=True)
    except Exception as e:
        logger.warning(f"Could not download NLTK resource {resource}: {e}")


class NLPService:

    def __init__(self):
        try:
            self.stop_words = set(stopwords.words("english"))
        except Exception:
            self.stop_words = {
                "the", "a", "an", "is", "are", "was", "were", "and", "or", "but", "in", "on", "at", "to", "for"
            }
        self.lemmatizer = WordNetLemmatizer()

    def preprocess_text(self, text: str) -> Dict[str, Any]:
        """
        Full text preprocessing pipeline:
        - Lowercasing
        - URL and HTML cleaning
        - Punctuation & number removal
        - Tokenization
        - Stopwords removal
        - Lemmatization
        """
        if not text or not isinstance(text, str):
            return {"clean_text": "", "tokens": []}

        # 1. Lowercase
        cleaned = text.lower()

        # 2. Clean URLs, HTML tags, special chars
        cleaned = re.sub(r"https?://\S+|www\.\S+", "", cleaned)
        cleaned = re.sub(r"<.*?>", "", cleaned)
        cleaned = re.sub(r"[^\w\s]", "", cleaned)
        cleaned = re.sub(r"\d+", "", cleaned)

        # 3. Tokenize
        try:
            raw_tokens = word_tokenize(cleaned)
        except Exception:
            raw_tokens = cleaned.split()

        # 4. Remove Stopwords & Lemmatize
        tokens = []
        for tok in raw_tokens:
            tok = tok.strip()
            if tok and tok not in self.stop_words and len(tok) > 1:
                lemmatized = self.lemmatizer.lemmatize(tok)
                tokens.append(lemmatized)

        clean_str = " ".join(tokens)
        return {
            "original_text": text,
            "clean_text": clean_str,
            "tokens": tokens,
        }

    def analyze_sentiment(
        self, text: str, model: Optional[Any] = None, vectorizer: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Predicts sentiment (Positive, Negative, Neutral) and confidence score.
        """
        prep = self.preprocess_text(text)
        clean_text = prep["clean_text"]

        if model is not None and vectorizer is not None:
            try:
                vec = vectorizer.transform([clean_text if clean_text else text.lower()])
                probs = model.predict_proba(vec)[0]
                classes = model.classes_

                best_idx = int(probs.argmax())
                sentiment = str(classes[best_idx])
                confidence = float(probs[best_idx])
            except Exception as e:
                logger.error(f"Error in ML sentiment prediction: {e}")
                sentiment, confidence = self._rule_based_sentiment(text, prep["tokens"])
        else:
            sentiment, confidence = self._rule_based_sentiment(text, prep["tokens"])

        return {
            "text": text,
            "sentiment": sentiment,
            "confidence": round(confidence, 4),
            "clean_tokens": prep["tokens"],
        }

    def _rule_based_sentiment(self, text: str, tokens: List[str]) -> Tuple[str, float]:
        """Rule-based lexicon fallback for sentiment classification."""
        pos_words = {
            "good", "great", "excellent", "love", "awesome", "fantastic", "amazing",
            "superb", "best", "like", "happy", "satisfied", "quality", "fast", "friendly",
            "perfect", "recommend", "wonderful", "top"
        }
        neg_words = {
            "bad", "terrible", "horrible", "worst", "poor", "hate", "disappointed",
            "slow", "broken", "defective", "useless", "return", "refund", "damaged",
            "rude", "waste", "unhappy", "problem", "late"
        }

        pos_count = sum(1 for t in tokens if t in pos_words)
        neg_count = sum(1 for t in tokens if t in neg_words)

        if pos_count > neg_count:
            return "Positive", min(0.95, 0.65 + 0.1 * (pos_count - neg_count))
        elif neg_count > pos_count:
            return "Negative", min(0.95, 0.65 + 0.1 * (neg_count - pos_count))
        else:
            return "Neutral", 0.75


nlp_service = NLPService()
