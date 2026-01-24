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
    print("Downloading dataset from Kaggle...")
    try:
        # Download dataset
        path = kagglehub.dataset_download("sripaadsrinivasan/indian-railways-dataset")
        print(f" Dataset downloaded to: {path}")
    except Exception as e:
        print(f"Failed to download dataset: {e}")
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        json_files = glob.glob(f"{path}/**/*.json", recursive=True)
        print(f"Found JSON files: {json_files}")

        # Placeholder for dataframes
        stations_df = None
        trains_df = None
        schedules_df = None

        # Naive file identification based on name
        for file in json_files:
            lower_name = file.lower()
            if "station" in lower_name:
                print(f"Reading Stations from {file}...")
                stations_df = pd.read_json(file)
            elif "train" in lower_name and "schedule" not in lower_name:
                print(f"Reading Trains from {file}...")
                trains_df = pd.read_json(file)
            elif "schedule" in lower_name:
                # schedules not implemented yet in DB seed for now
                pass

        # 1. Seed Stations
        if stations_df is not None:
            print(f"Processing {len(stations_df)} stations...")
            # JSON structure analysis (likely):
            # properties might be: code, name, zone, state, address, location (lat/lng)
            
            # Print columns to be sure in logs
            print(f"Columns: {stations_df.columns.tolist()}")

            # Simple column mapping attempt
            cols = stations_df.columns.str.lower()
            code_col = next((c for c in stations_df.columns if 'code' in c.lower()), None)
            name_col = next((c for c in stations_df.columns if 'name' in c.lower()), None)
            lat_col = next((c for c in stations_df.columns if 'lat' in c.lower()), None)
            lng_col = next((c for c in stations_df.columns if 'lng' in c.lower() or 'long' in c.lower()), None)
            
            if code_col and name_col:
                station_values = []
                for _, row in stations_df.iterrows():
                    st_id = f"st_{row[code_col]}"
                    lat = row[lat_col] if lat_col and pd.notna(row[lat_col]) else 0.0
                    lon = row[lng_col] if lng_col and pd.notna(row[lng_col]) else 0.0
                    
                    # Truncate to ensure fit
                    name = str(row[name_col])[:100]
                    # City often not in basic station list, use "Unknown" or infer
                    city = "India"
                    
                    station_values.append((st_id, name, str(row[code_col]), city, lat, lon))
                
                insert_query = """
                    INSERT INTO stations (id, name, code, city, latitude, longitude)
                    VALUES %s
                    ON CONFLICT (code) DO NOTHING
                """
                execute_values(cursor, insert_query, station_values)
                print("Stations seeded.")

        # 2. Seed Trains
        if trains_df is not None:
            print(f"Processing {len(trains_df)} trains...")
            print(f"Columns: {trains_df.columns.tolist()}")
            
            # Need Number, Name
            num_col = next((c for c in trains_df.columns if 'number' in c.lower() or 'no' in c.lower()), None)
            name_col = next((c for c in trains_df.columns if 'name' in c.lower()), None)

            if num_col and name_col:
                train_values = []
                for _, row in trains_df.iterrows():
                    # Handle strange numbers (string/int mixed)
                    t_num = str(row[num_col])
                    tr_id = f"tr_{t_num}"
                    t_name = str(row[name_col])[:100]
                    
                    train_values.append((tr_id, t_name, t_num, 'express', 1000, ['General'], True))
                
                insert_query = """
                    INSERT INTO trains (id, name, number, type, total_seats, amenities, active)
                    VALUES %s
                    ON CONFLICT (number) DO NOTHING
                """
                execute_values(cursor, insert_query, train_values)
                print("Trains seeded.")

        conn.commit()
        print("Database seeding completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"Error during seeding: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    seed_data()
