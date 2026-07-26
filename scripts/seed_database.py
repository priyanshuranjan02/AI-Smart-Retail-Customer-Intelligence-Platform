from datetime import datetime, timedelta
import random
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import init_db, SessionLocal, Customer, CustomerVisit, Review, ChatLog, PredictionLog


def seed():
    print("--- Seeding Database with Synthetic Analytics Data ---")
    init_db()
    db = SessionLocal()

    # Clear existing records
    db.query(CustomerVisit).delete()
    db.query(Customer).delete()
    db.query(Review).delete()
    db.query(ChatLog).delete()
    db.query(PredictionLog).delete()
    db.commit()

    # 1. Customers
    customers_data = [
        ("CUST-1001", "Alice Vance"),
        ("CUST-1002", "Bob Smith"),
        ("CUST-1003", "Charlie Brown"),
        ("CUST-1004", "Diana Prince"),
        ("CUST-1005", "Ethan Hunt"),
    ]
    db_customers = []
    for code, name in customers_data:
        c = Customer(customer_code=code, name=name)
        db.add(c)
        db_customers.append(c)
    db.commit()

    # 2. Customer Visits over last 30 days
    now = datetime.utcnow()
    statuses = ["Known", "Unknown"]

    for i in range(120):
        days_ago = random.randint(0, 30)
        hours_ago = random.randint(0, 23)
        v_time = now - timedelta(days=days_ago, hours=hours_ago)
        is_known = random.choice([True, True, False])  # 66% returning
        status_str = "Known" if is_known else "Unknown"

        if is_known:
            cust = random.choice(db_customers)
            cust_code = cust.customer_code
            cust_id = cust.id
            conf = round(random.uniform(0.75, 0.98), 4)
        else:
            cust_code = "UNKNOWN"
            cust_id = None
            conf = round(random.uniform(0.40, 0.65), 4)

        v = CustomerVisit(
            customer_id=cust_id,
            customer_code=cust_code,
            visit_time=v_time,
            confidence=conf,
            status=status_str,
        )
        db.add(v)

    # 3. Reviews
    sample_reviews = [
        ("The store experience was amazing, super fast checkout!", "Positive", 0.95),
        ("Loved the shoes I bought, great fit and comfort.", "Positive", 0.92),
        ("Great customer service and friendly staff.", "Positive", 0.88),
        ("High quality clothes, fast shipping.", "Positive", 0.91),
        ("The product arrived broken and packaging was bad.", "Negative", 0.89),
        ("Late delivery and unhelpful support agent.", "Negative", 0.85),
        ("Disappointed with the return process.", "Negative", 0.82),
        ("The store opened on time. Average experience.", "Neutral", 0.75),
        ("Item arrived on schedule as described.", "Neutral", 0.78),
        ("Standard retail store, prices are reasonable.", "Neutral", 0.72),
    ]
    for text, sent, conf in sample_reviews * 3:
        r = Review(text=text, sentiment=sent, confidence=conf)
        db.add(r)

    # 4. Chat Logs
    sample_chats = [
        ("What are your store hours?", "Our stores are open daily! Monday-Saturday: 9am-9pm, Sunday: 10am-6pm.", "store_hours", 0.95),
        ("How do I return a product?", "We offer a 30-day hassle-free return policy for unused items.", "returns", 0.92),
        ("Where is my order?", "You can track your order by visiting the Order Tracking tab.", "order_status", 0.89),
        ("Do you accept PayPal?", "We accept Visa, MasterCard, PayPal, and Apple Pay.", "payment", 0.94),
        ("Hi there", "Hello! Welcome to Smart Retail Customer Support. How can I assist you today?", "greeting", 0.98),
    ]
    for u_msg, b_resp, int_tag, conf in sample_chats * 4:
        c_log = ChatLog(
            user_message=u_msg,
            bot_response=b_resp,
            intent=int_tag,
            confidence=conf,
        )
        db.add(c_log)

    # 5. Product Predictions
    categories = ["Shoes", "Clothes", "Electronics", "Groceries", "Bags"]
    for _ in range(80):
        cat = random.choice(categories)
        conf = round(random.uniform(0.75, 0.99), 4)
        p_log = PredictionLog(
            prediction_type="product_classification",
            category=cat,
            confidence=conf,
        )
        db.add(p_log)

    db.commit()
    db.close()
    print("Database Seeded Successfully!")


if __name__ == "__main__":
    seed()
