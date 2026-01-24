-- Initialize TimescaleDB for RailRover
-- This script runs when the database container starts

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create core tables
CREATE TABLE IF NOT EXISTS stations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    city TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trains (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- 'express', 'premium', 'local'
    total_seats INTEGER NOT NULL,
    amenities TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    train_id TEXT REFERENCES trains(id),
    origin_id TEXT REFERENCES stations(id),
    destination_id TEXT REFERENCES stations(id),
    distance_km DOUBLE PRECISION,
    base_price DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create time-series tables
CREATE TABLE IF NOT EXISTS train_schedules (
    time TIMESTAMPTZ NOT NULL,
    train_id TEXT NOT NULL,
    route_id TEXT NOT NULL,
    departure_time TIMESTAMPTZ,
    arrival_time TIMESTAMPTZ,
    platform INTEGER,
    status TEXT DEFAULT 'scheduled',
    delay_minutes INTEGER DEFAULT 0
);

-- Create time-series tables
CREATE TABLE IF NOT EXISTS seat_occupancy (
    time TIMESTAMPTZ NOT NULL,
    train_id TEXT NOT NULL,
    route_id TEXT NOT NULL,
    date DATE NOT NULL,
    total_booked INTEGER NOT NULL,
    total_available INTEGER NOT NULL,
    occupancy_rate DOUBLE PRECISION GENERATED ALWAYS AS (
        (total_booked::DOUBLE PRECISION / (total_booked + total_available)) * 100
    ) STORED
);

CREATE TABLE IF NOT EXISTS pricing_history (
    time TIMESTAMPTZ NOT NULL,
    train_id TEXT NOT NULL,
    route_id TEXT NOT NULL,
    ticket_class TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    demand_factor DOUBLE PRECISION DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS bookings (
    time TIMESTAMPTZ NOT NULL,
    id TEXT,
    PRIMARY KEY (time, id),
    user_id TEXT NOT NULL,
    train_id TEXT NOT NULL,
    route_id TEXT NOT NULL,
    travel_date DATE NOT NULL,
    ticket_class TEXT NOT NULL,
    passengers INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'confirmed',
    payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User management tables
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}',
    loyalty_points INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'regular',
    total_bookings INTEGER DEFAULT 0
);

-- Convert to hypertables
SELECT create_hypertable('train_schedules', 'time', if_not_exists => TRUE);
SELECT create_hypertable('seat_occupancy', 'time', if_not_exists => TRUE);
SELECT create_hypertable('pricing_history', 'time', if_not_exists => TRUE);
SELECT create_hypertable('bookings', 'time', if_not_exists => TRUE);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trains_active ON trains(active);
CREATE INDEX IF NOT EXISTS idx_routes_train ON routes(train_id);
CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON routes(origin_id, destination_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(travel_date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create continuous aggregates for real-time analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_occupancy_stats
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 day', time) AS day,
    train_id,
    AVG(occupancy_rate) as avg_occupancy,
    MAX(occupancy_rate) as max_occupancy,
    MIN(occupancy_rate) as min_occupancy,
    COUNT(*) as data_points
FROM seat_occupancy
GROUP BY day, train_id;

-- Add comments for documentation
COMMENT ON TABLE stations IS 'Railway stations with location data';
COMMENT ON TABLE trains IS 'Train fleet information';
COMMENT ON TABLE routes IS 'Train routes with pricing';
COMMENT ON TABLE train_schedules IS 'Time-series train schedule data';
COMMENT ON TABLE seat_occupancy IS 'Time-series seat occupancy tracking';
COMMENT ON TABLE pricing_history IS 'Time-series pricing data';
COMMENT ON TABLE bookings IS 'Time-series booking records';
COMMENT ON TABLE users IS 'User accounts and authentication';
COMMENT ON TABLE user_profiles IS 'User preferences and loyalty data';

-- Seed Data
-- Stations (Major Indian Cities)
INSERT INTO stations (id, name, code, city, latitude, longitude) VALUES
('st_1', 'Mumbai CSMT', 'CSMT', 'Mumbai', 18.9415, 72.8347),
('st_2', 'New Delhi', 'NDLS', 'New Delhi', 28.6139, 77.2090),
('st_3', 'KSR Bangalore', 'SBC', 'Bangalore', 12.9716, 77.5946),
('st_4', 'Chennai Central', 'MAS', 'Chennai', 13.0827, 80.2707),
('st_5', 'Howrah Junction', 'HWH', 'Kolkata', 22.5837, 88.3426),
('st_6', 'Secunderabad', 'SC', 'Hyderabad', 17.4399, 78.4983),
('st_7', 'Pune Junction', 'PUNE', 'Pune', 18.5289, 73.8744),
('st_8', 'Ahmedabad Junction', 'ADI', 'Ahmedabad', 23.0225, 72.5714),
('st_9', 'Jaipur Junction', 'JP', 'Jaipur', 26.9196, 75.7878),
('st_10', 'Patna Junction', 'PNBE', 'Patna', 25.6022, 85.1194);

-- Trains
INSERT INTO trains (id, name, number, type, total_seats, amenities, active) VALUES
('tr_1', 'Mumbai Rajdhani', '12951', 'premium', 750, ARRAY['Wifi', 'Meals', 'AC', 'Lounge'], true),
('tr_2', 'Bhopal Shatabdi', '12002', 'express', 500, ARRAY['Meals', 'AC'], true),
('tr_3', 'Vande Bharat', '20901', 'premium', 1100, ARRAY['Wifi', 'Meals', 'AC', 'Bio-Toilets'], true),
('tr_4', 'Karnataka Express', '12627', 'express', 1200, ARRAY['Pantry', 'Sleeper'], true),
('tr_5', 'Coromandel Express', '12841', 'express', 1500, ARRAY['Pantry'], true),
('tr_6', 'Deccan Queen', '12124', 'local', 800, ARRAY['PassHolder'], true);

-- Routes (Connecting the graph)
INSERT INTO routes (id, train_id, origin_id, destination_id, distance_km, base_price) VALUES
('rt_1', 'tr_1', 'st_1', 'st_2', 1384.0, 2800.00), -- Mumbai -> Delhi
('rt_2', 'tr_2', 'st_2', 'st_5', 1450.0, 2200.00), -- Delhi -> Kolkata
('rt_3', 'tr_3', 'st_1', 'st_8', 492.0, 1500.00), -- Mumbai -> Ahmedabad
('rt_4', 'tr_4', 'st_3', 'st_2', 2300.0, 1800.00), -- Bangalore -> Delhi
('rt_5', 'tr_5', 'st_5', 'st_4', 1660.0, 1400.00), -- Kolkata -> Chennai
('rt_6', 'tr_6', 'st_1', 'st_7', 192.0, 150.00),  -- Mumbai -> Pune
('rt_7', 'tr_1', 'st_2', 'st_1', 1384.0, 2800.00), -- Delhi -> Mumbai (Return)
('rt_8', 'tr_4', 'st_2', 'st_3', 2300.0, 1800.00); -- Delhi -> Bangalore (Return)
