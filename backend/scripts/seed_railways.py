import os
import json
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

def load_json_file(filename):
    # Try finding the file in a few relative locations
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(script_dir, filename),
        os.path.join(script_dir, '..', filename),
        os.path.join(script_dir, '..', '..', filename),
        os.path.join("c:\\Users\\dhanu\\Downloads\\railig", filename) # absolute fallback
    ]
    
    for path in candidates:
        if os.path.exists(path):
            print(f"Loading {filename} from {path}...")
            try:
                with open(path, 'r', encoding='utf-8', errors='replace') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error reading {path}: {e}")
                return None
    
    print(f"Could not find {filename} in {candidates}")
    return None

def normalize_data(data, label):
    """Normalize data to a list of dictionaries"""
    if data is None:
        return []
    
    items = []
    if isinstance(data, dict):
        print(f"Top-level keys for {label}: {list(data.keys())}")
        if "features" in data:
            print(f"Detected GeoJSON/Features format for {label}")
            if data["features"] is None:
                print(f"Warning: 'features' is None in {label}")
                return []
            
            # Flatten properties if it's geojson
            for item in data["features"]:
                if item is None: continue
                props = item.get("properties", {})
                if props is None: props = {}
                
                # preserve geometry if needed, but primarily properties
                geom = item.get("geometry")
                if geom and isinstance(geom, dict):
                    coords = geom.get("coordinates")
                    if coords and isinstance(coords, list) and len(coords) >= 2:
                        try:
                            # Usually [lng, lat] for GeoJSON
                            props["lng"] = float(coords[0])
                            props["lat"] = float(coords[1])
                        except (ValueError, TypeError):
                            props["lng"] = 0.0
                            props["lat"] = 0.0
                
                items.append(props)
        else:
            # Maybe a dict of items? or just one item?
            # Check if there's a likely key that contains the list
            possible_keys = [k for k in data.keys() if isinstance(data[k], list)]
            if possible_keys:
                print(f"Found list-like keys in {label}: {possible_keys}. Using {possible_keys[0]}")
                items = data[possible_keys[0]]
            else:
                print(f"No list found in {label}, treating as single item.")
                items = [data]
    elif isinstance(data, list):
        items = data
    else:
        print(f"Unknown data format for {label}: {type(data)}")
    
    if items:
        valid_items = [i for i in items if i is not None]
        if valid_items:
            print(f"Sample item from {label}: {list(valid_items[0].keys())}")
        return valid_items
    return []

def seed_data():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Load Data
        stations_data = load_json_file("stations.json")
        trains_data = load_json_file("trains.json")
        # schedules_data = load_json_file("schedules.json") # Later

        stations_list = normalize_data(stations_data, "Stations")
        trains_list = normalize_data(trains_data, "Trains")

        # 1. Seed Stations
        if stations_list:
            print(f"Processing {len(stations_list)} stations...")
            station_values = []
            seen_codes = set()
            
            for row in stations_list:
                # Flexible key lookup
                code = row.get("code") or row.get("station_code") or row.get("station_code ")
                if not code: continue
                
                code = str(code).strip()
                if code in seen_codes: continue
                seen_codes.add(code)

                st_id = f"st_{code}"
                name = (row.get("name") or row.get("station_name") or "Unknown")[:100]
                city = row.get("city") or row.get("state") or "India"
                lat = row.get("lat") or row.get("latitude") or 0.0
                lng = row.get("lng") or row.get("longitude") or 0.0
                
                try:
                    lat = float(lat)
                    lng = float(lng)
                except:
                    lat, lng = 0.0, 0.0

                station_values.append((st_id, name, code, city, lat, lng))

            print(f"Prepared {len(station_values)} stations for insertion.")
            
            insert_query = """
                INSERT INTO stations (id, name, code, city, latitude, longitude)
                VALUES %s
                ON CONFLICT (code) DO NOTHING
            """
            execute_values(cursor, insert_query, station_values)
            print("Stations seeded.")

        # 2. Seed Trains
        if trains_list:
            print(f"Processing {len(trains_list)} trains...")
            train_values = []
            seen_numbers = set()

            for row in trains_list:
                # Flexible key lookup
                num = row.get("number") or row.get("train_number")
                if not num: continue
                
                num = str(num).strip()
                if num in seen_numbers: continue
                seen_numbers.add(num)

                tr_id = f"tr_{num}"
                name = (row.get("name") or row.get("train_name") or "Unknown")[:100]
                train_type = row.get("type") or "express"
                
                # Default amenities/seats
                amenities = ['General']
                seats = 1000

                train_values.append((tr_id, name, num, train_type, seats, amenities, True))
            
            print(f"Prepared {len(train_values)} trains for insertion.")

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
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    seed_data()

