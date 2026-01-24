# Train Ticket Booking System

This project is a railway booking platform built with a hybrid microservices architecture. It uses Node.js for the main API and Python for analytics, connected via Kafka and RabbitMQ.

## Architecture

The system consistsland of the following services:

*   **Backend (Node.js)**: Handles user registration, booking logic, and API requests.
*   **Analytics (Python)**: Consumes booking events from Kafka to calculate revenue and occupancy stats.
*   **Database (TimescaleDB)**: Stores train schedules, bookings, and users.
*   **Kafka**: Handles high-throughput event streaming (e.g., booking requests, waitlists).
*   **RabbitMQ**: Manages background tasks (e.g., sending emails).
*   **Redis**: Caches session data and frequent queries.

## Prerequisites

*   Docker and Docker Compose
*   Node.js 18+ (for local development)
*   Python 3.10+ (for local development)

## Setup and Running

1.  Clone the repository:
    ```bash
    git clone https://github.com/Dhanush-sai-reddy/Train-Ticket-booking-system.git
    cd Train-Ticket-booking-system
    ```

2.  Start the application using Docker Compose:
    ```bash
    docker-compose up --build
    ```

    This command will start all containers (API, Database, Kafka, RabbitMQ, Analytics, Grafana).

3.  (Optional) Seed the database with initial data:
    ```bash
    docker-compose --profile seed up result-seeder
    ```

## API Endpoints

The backend runs on port `3001`.

*   `POST /api/auth/register` - Create a new user account.
*   `POST /api/auth/login` - Log in and get a JWT.
*   `GET /api/trains` - List available trains.
*   `POST /api/bookings` - Book a ticket.

## Monitoring

*   **Grafana**: `http://localhost:3002` (Login: `admin` / `admin`)
*   **RabbitMQ Management**: `http://localhost:15672` (Login: `railrover` / `railrover_pass`)
*   **API Health**: `http://localhost:3001/health`

## Project Structure

*   `backend/` - Node.js Express application.
*   `analytics/` - Python Kafka consumer service.
*   `frontend/` - React frontend (work in progress).
*   `docker-compose.yml` - Container orchestration config.

## Features implemented

*   User Authentication (JWT)
*   Ticket Booking (Transactional)
*   Waitlist System (Kafka-based)
*   Real-time Revenue Analysis
*   Async Email Notifications
