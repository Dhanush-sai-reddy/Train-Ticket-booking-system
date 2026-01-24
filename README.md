# RailRover - Advanced Booking System

A robust, hybrid microservices architecture for railway bookings.

## Architecture
- **Backend**: Node.js/Express (API)
- **Analytics**: Python (Kafka Consumer)
- **Database**: TimescaleDB (PostgreSQL)
- **Messaging**: Kafka (Streaming) & RabbitMQ (Tasks)
- **Caching**: Redis
- **Monitoring**: Grafana

## Quick Start

### 1. Start Infrastructure
```bash
docker-compose up --build
```
*Note: Ensure you have 8GB+ RAM available.*

### 2. View Analytics
**Option A: Real-time Alerts (Terminal)**
Watch the Python logs to see "Revenue Alerts" as bookings happen:
```bash
docker logs -f railrover-analytics
```

**Option B: Visual Dashboards (Grafana)**
1.  Open [http://localhost:3002](http://localhost:3002)
2.  Login with `admin` / `admin`
3.  Add Data Source -> **PostgreSQL**:
    - Host: `timescaledb:5432`
    - Database: `railrover`
    - User/Pass: `railrover_user` / `railrover_password`
    - SSL Mode: `disable`
4.  Create a Dashboard and query the `bookings` or `seat_occupancy` tables!

### 3. API Usage
- **Health Check**: [http://localhost:3001/health](http://localhost:3001/health)
- **Register**: `POST /api/auth/register`
- **Book Ticket**: `POST /api/bookings`
