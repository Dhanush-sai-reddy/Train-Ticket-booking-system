import os
import json
import psycopg2
from psycopg2.extras import execute_values

def connect_db():
    return psycopg2.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        database=os.environ.get('DB_NAME', 'railrover'),
        user=os.environ.get('DB_USER', 'railrover_user'),
        password=os.environ.get('DB_PASS', 'railrover_password'),
        port=5432
    )

def seed_db():
    print("Connecting to database...")
    conn = connect_db()
    cur = conn.cursor()

    # Clear existing data but don't truncate hypertable bookings just yet for this demo
    print("Clearing existing core data (routes, trains, stations)...")
    try:
        cur.execute("TRUNCATE TABLE routes, trains, stations CASCADE;")
    except Exception as e:
        print("Warning during TRUNCATE:", e)
        conn.rollback()

    # 1. Seed Stations
    print("Loading stations.json...")
    with open('stations.json', 'r', encoding='utf-8') as f:
        stations_data = json.load(f) or {}
        
    station_tuples = []
    
    for idx, feature in enumerate(stations_data.get('features', [])):
        if not feature or not isinstance(feature, dict):
            continue
            
        props = feature.get('properties', {})
        geom = feature.get('geometry', {})
        
        code = props.get('code', str(idx)).upper()
        name = props.get('name', 'Unknown')
        state = props.get('state', 'Unknown')
        
        coords = geom.get('coordinates', [0, 0])
        lon, lat = coords if len(coords) >= 2 else (0, 0)
        
        s_id = f"st_{code}_{idx}"
        
        station_tuples.append((s_id, name, code, state, lat, lon))
        
    print(f"Inserting {len(station_tuples)} stations...")
    execute_values(
        cur,
        "INSERT INTO stations (id, name, code, city, latitude, longitude) VALUES %s ON CONFLICT (code) DO NOTHING",
        station_tuples
    )
    
    # Refresh station map from DB explicitly to get the ones that successfully inserted
    cur.execute("SELECT code, id FROM stations;")
    station_map = {row[0]: row[1] for row in cur.fetchall()}

    # 2. Seed Trains and Routes
    print("Loading trains.json...")
    with open('trains.json', 'r', encoding='utf-8') as f:
        trains_data = json.load(f) or {}
        
    train_tuples = []
    route_tuples = []
    
    for idx, feature in enumerate(trains_data.get('features', [])):
        if not feature or not isinstance(feature, dict):
            continue
            
        props = feature.get('properties', {})
        
        number = str(props.get('number', str(idx)))
        name = props.get('name', 'Unknown Train')
        t_type = props.get('type', 'express').lower()
        if not t_type or t_type == 'null':
             t_type = 'express'
        
        seats = props.get('sleeper', 0) + props.get('third_ac', 0) * 2 + 100 # Mock calculation
        
        t_id = f"tr_{number}_{idx}"
        
        train_tuples.append((t_id, name, number, t_type, seats if seats > 0 else 500, ['Wifi', 'Meals']))
        
        from_code = str(props.get('from_station_code', '')).upper()
        to_code = str(props.get('to_station_code', '')).upper()
        distance = props.get('distance', 0)
        
        origin_id = station_map.get(from_code)
        dest_id = station_map.get(to_code)
        
        if origin_id and dest_id:
            route_tuples.append((
                f"rt_{number}_{idx}",
                t_id,
                origin_id,
                dest_id,
                float(distance) if distance else 100.0,
                max(150.0, float(distance or 100) * 1.5) # base price calculation
            ))
            
    print(f"Inserting {len(train_tuples)} trains...")
    execute_values(
        cur,
        "INSERT INTO trains (id, name, number, type, total_seats, amenities) VALUES %s ON CONFLICT (number) DO NOTHING",
        train_tuples
    )
    
    # Get valid trains so routes don't violate FK (in case some trains skipped due to conflict)
    cur.execute("SELECT number, id FROM trains;")
    train_map = {row[0]: row[1] for row in cur.fetchall()}
    
    # Update train_id in routes with actual inserted train_id
    valid_routes = []
    for r in route_tuples:
        train_num = r[1].split('_')[1] # since defined as tr_{number}_{idx}
        if train_num in train_map:
            valid_routes.append((r[0], train_map[train_num], r[2], r[3], r[4], r[5]))
    
    print(f"Inserting {len(valid_routes)} routes...")
    execute_values(
        cur,
        "INSERT INTO routes (id, train_id, origin_id, destination_id, distance_km, base_price) VALUES %s ON CONFLICT (id) DO NOTHING",
        valid_routes
    )
    
    conn.commit()
    print("Database Successfully Seeded with JSON Data!")
    cur.close()
    conn.close()

def run_seed():
    import traceback
    try:
        seed_db()
    except Exception as e:
        print("ERROR:")
        traceback.print_exc()

if __name__ == "__main__":
    run_seed()
