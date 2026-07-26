import json
import logging
import random
from typing import Dict, Any, List, Optional, Tuple
from app.services.nlp_service import nlp_service

logger = logging.getLogger("chatbot_service")


class HybridChatbotService:

    def __init__(self):
        self.intents_data: Dict[str, Any] = {"intents": []}
        self.rule_patterns: List[Tuple[str, List[str], List[str]]] = []

    def load_intents(self, intents_file_path: str):
        """Loads intents from JSON file into memory for rule matching and ML fallback."""
        try:
            with open(intents_file_path, "r", encoding="utf-8") as f:
                self.intents_data = json.load(f)

            self.rule_patterns = []
            for intent in self.intents_data.get("intents", []):
                tag = intent["tag"]
                patterns = [p.lower() for p in intent["patterns"]]
                responses = intent["responses"]
                self.rule_patterns.append((tag, patterns, responses))
            logger.info(f"Loaded {len(self.rule_patterns)} intents successfully.")
        except Exception as e:
            logger.error(f"Failed to load intents JSON: {e}")

    def generate_response(
        self,
        user_message: str,
        model: Optional[Any] = None,
        vectorizer: Optional[Any] = None,
        confidence_threshold: float = 0.40,
    ) -> Dict[str, Any]:
        """
        Hybrid Chatbot execution:
        1. Rule-based exact keyword match check
        2. ML Intent Classifier
        3. Fallback response for low confidence
        """
        if not user_message or not user_message.strip():
            return {
                "user_message": user_message,
                "bot_response": "Please enter a valid message.",
                "intent": "empty_input",
                "confidence": 1.0,
            }

        prep = nlp_service.preprocess_text(user_message)
        clean_text = prep["clean_text"]
        raw_lower = user_message.lower().strip()

        # Step 1: Rule-based exact / keyword matching
        rule_result = self._check_rule_match(raw_lower, prep["tokens"])
        if rule_result is not None:
            intent_tag, response, confidence = rule_result
            return {
                "user_message": user_message,
                "bot_response": response,
                "intent": intent_tag,
                "confidence": round(confidence, 4),
            }

        # Step 2: ML Model Classification
        if model is not None and vectorizer is not None and clean_text:
            try:
                vec = vectorizer.transform([clean_text])
                probs = model.predict_proba(vec)[0]
                best_idx = int(probs.argmax())
                intent_tag = str(model.classes_[best_idx])
                confidence = float(probs[best_idx])

                if confidence >= confidence_threshold:
                    response = self._get_response_for_intent(intent_tag)
                    return {
                        "user_message": user_message,
                        "bot_response": response,
                        "intent": intent_tag,
                        "confidence": round(confidence, 4),
                    }
            except Exception as e:
                logger.error(f"Error in ML Chatbot classification: {e}")

        # Step 3: Fallback response
        fallback_responses = [
            "I'm sorry, I didn't quite understand that. Could you please rephrase your request? You can ask about store hours, shipping, returns, refunds, or product availability!",
            "Thank you for contacting Smart Retail! I am not sure about that specific question. Please contact our support team at support@smartretail.com for further assistance.",
            "I'm still learning! Try asking me things like 'What is your return policy?' or 'What are your store hours?'"
        ]
        return {
            "user_message": user_message,
            "bot_response": random.choice(fallback_responses),
            "intent": "unknown_query",
            "confidence": 0.20,
        }

    def _check_rule_match(
        self, raw_lower: str, tokens: List[str]
    ) -> Optional[Tuple[str, str, float]]:
        """Scans loaded rule patterns for direct string matches or keyword triggers."""
        token_set = set(tokens)
        
        for tag, patterns, responses in self.rule_patterns:
            for pat in patterns:
                # Direct substring match
                if pat in raw_lower or raw_lower in pat:
                    resp = random.choice(responses)
                    return tag, resp, 0.95

                # High keyword overlap
                pat_tokens = set(pat.split())
                if len(pat_tokens) >= 2 and len(pat_tokens.intersection(token_set)) >= len(pat_tokens) - 1:
                    resp = random.choice(responses)
                    return tag, resp, 0.88

        return None

    def _get_response_for_intent(self, intent_tag: str) -> str:
        """Retrieves random response corresponding to given intent tag."""
        for tag, patterns, responses in self.rule_patterns:
            if tag == intent_tag:
                return random.choice(responses)
        return "Thank you for reaching out! How else can I assist you?"


chatbot_service = HybridChatbotService()
