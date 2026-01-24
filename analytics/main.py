import os
import json
import time
import threading
from kafka import KafkaConsumer
import pandas as pd
from sqlalchemy import create_engine
import psycopg2

# Configuration
KAFKA_BROKER = os.environ.get('KAFKA_BROKER', 'kafka:29092')
TOPIC_NAME = 'booking-events'
DB_URL = os.environ.get('DATABASE_URL', 'postgresql://railrover_user:railrover_password@timescaledb:5432/railrover')

print(f"🚀 Analytics Service Starting...")
print(f"🔌 Connecting to Kafka at {KAFKA_BROKER}")
print(f"💾 Database URL configured")

# Wait for Kafka to be ready
def wait_for_kafka():
    while True:
        try:
            consumer = KafkaConsumer(
                TOPIC_NAME,
                bootstrap_servers=[KAFKA_BROKER],
                auto_offset_reset='earliest',
                enable_auto_commit=True,
                group_id='analytics-group',
                value_deserializer=lambda x: json.loads(x.decode('utf-8'))
            )
            print("✅ Connected to Kafka!")
            return consumer
        except Exception as e:
            print(f"⏳ Waiting for Kafka... ({e})")
            time.sleep(5)

# Database Connection
try:
    engine = create_engine(DB_URL)
    print("✅ Database engine created.")
except Exception as e:
    print(f"❌ Failed to create DB engine: {e}")

def process_message(message):
    try:
        data = message.value
        print(f"📥 Received Event: {data}")
        
        # Simple Analytics Logic:
        # We could aggregate here using Pandas if we had a batch, 
        # for now let's just log "Real-time Processing"
        
        event_type = data.get('event')
        if event_type == 'BOOKING_CREATED':
            amount = data.get('amount', 0)
            route_id = data.get('route')
            
            # Example: We could insert into a 'daily_revenue' table here
            # For demonstration, we just print the 'Intelligence'
            print(f"💰 Revenue Alert: New booking of ${amount} on route {route_id}")
            
    except Exception as e:
        print(f"❌ Error processing message: {e}")

def start_consumer():
    consumer = wait_for_kafka()
    for message in consumer:
        process_message(message)

if __name__ == "__main__":
    # Start Consumer
    start_consumer()
