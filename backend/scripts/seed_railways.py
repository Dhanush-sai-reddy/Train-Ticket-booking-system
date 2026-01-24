import os
import kagglehub
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import glob

# Database connection
DB_HOST = os.getenv("DB_HOST", "timescaledb")
DB_NAME = os.getenv("DB_NAME", "railrover")
DB_USER = os.getenv("DB_USER", "railrover_user")
DB_PASS = os.getenv("DB_PASS", "railrover_password")

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )

def seed_data():
    print("⬇️  Downloading dataset from Kaggle...")
    try:
        # Download dataset
        path = kagglehub.dataset_download("sripaadsrinivasan/indian-railways-dataset")
        print(f"✅ Dataset downloaded to: {path}")
    except Exception as e:
        print(f"❌ Failed to download dataset: {e}")
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        csv_files = glob.glob(f"{path}/**/*.csv", recursive=True)
        print(f"📂 Found CSV files: {csv_files}")

        # Placeholder for dataframes
        stations_df = None
        trains_df = None
        schedules_df = None

        # Naive file identification based on name
        for file in csv_files:
            lower_name = file.lower()
            if "station" in lower_name:
                stations_df = pd.read_csv(file)
            elif "train" in lower_name and "schedule" not in lower_name:
                 # Prefer 'Train_Details.csv' if available or similar
                 trains_df = pd.read_csv(file)
            elif "schedule" in lower_name:
                schedules_df = pd.read_csv(file)

        # 1. Seed Stations
        if stations_df is not None:
            print(f"Processing {len(stations_df)} stations...")
            # Normalize columns: Expecting 'Station Code', 'Station Name'
            # Adjust column names based on inspect (dataset specific logic)
            # Assuming standard Kaggle dataset format often used:
            # Code, Name, State, Zone... we need Code, Name, Lat, Long if avail
            
            # Simple column mapping attempt
            cols = stations_df.columns.str.lower()
            code_col = next((c for c in stations_df.columns if 'code' in c.lower()), None)
            name_col = next((c for c in stations_df.columns if 'name' in c.lower()), None)
            
            if code_col and name_col:
                station_values = []
                for _, row in stations_df.iterrows():
                    # Generate ID or use ID if exists. Using code as ID part can be safer or just 'st_' + code
                    st_id = f"st_{row[code_col]}"
                    # Latitude/Longitude often missing in basic datasets, use 0.0 or random if missing
                    lat = 0.0
                    lon = 0.0
                    
                    station_values.append((st_id, row[name_col], row[code_col], 'Unknown', lat, lon))
                
                insert_query = """
                    INSERT INTO stations (id, name, code, city, latitude, longitude)
                    VALUES %s
                    ON CONFLICT (code) DO NOTHING
                """
                execute_values(cursor, insert_query, station_values)
                print("✅ Stations seeded.")

        # 2. Seed Trains
        if trains_df is not None:
            print(f"Processing {len(trains_df)} trains...")
            # Need Number, Name
            num_col = next((c for c in trains_df.columns if 'number' in c.lower() or 'no' in c.lower()), None)
            name_col = next((c for c in trains_df.columns if 'name' in c.lower()), None)

            if num_col and name_col:
                train_values = []
                for _, row in trains_df.iterrows():
                    tr_id = f"tr_{row[num_col]}"
                    train_values.append((tr_id, row[name_col], str(row[num_col]), 'express', 1000, ['General'], True))
                
                insert_query = """
                    INSERT INTO trains (id, name, number, type, total_seats, amenities, active)
                    VALUES %s
                    ON CONFLICT (number) DO NOTHING
                """
                execute_values(cursor, insert_query, train_values)
                print("✅ Trains seeded.")

        conn.commit()
        print("🎉 Database seeding completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error during seeding: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    seed_data()
