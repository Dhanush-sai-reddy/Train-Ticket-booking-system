# RailRover — Train Ticket Booking System

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/Dhanush-sai-reddy/Train-Ticket-booking-system)
[![Frontend Live](https://img.shields.io/badge/Frontend-Live-success?logo=vercel)](https://train-ticket-booking-system-zp43.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend-API-success?logo=vercel)](https://train-ticket-booking-system-sigma.vercel.app)

A full-stack railway booking platform. The backend is a Node.js REST API using Prisma and PostgreSQL, and the frontend is a React + TypeScript SPA. Both are deployed on Vercel.

---

## Features

- **User Authentication** — JWT-based register/login with bcrypt password hashing
- **Train & Station Search** — Search trains between stations, including indirect routes via schedule stops
- **Ticket Booking** — Book tickets with coach-class selection; awards loyalty points on each booking
- **Booking Management** — View, retrieve, and cancel personal bookings
- **User Profile** — Update profile details and preferences
- **AI Assistant** — Gemini-powered travel assistant in the UI
- **Model Context Protocol (MCP)** — Seamlessly exposes database and booking features to any MCP-compatible LLM client (like Claude Desktop or Cursor)

---

## Model Context Protocol (MCP) Integration

RailRover implements the **[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)** to expose its capabilities to AI models and agents. The MCP server is available on the backend at `/mcp` and provides a set of standardized tools.

By passing a valid JWT as a Bearer token, MCP clients can securely access both public data and user-specific tools:

### Available MCP Tools
- `search_trains` — Find trains between stations, including indirect routes.
- `get_train` — Get full details, schedules, and seat counts for a specific train.
- `search_stations` — Search stations by name, code, or state.
- `get_my_profile` — Fetch the authenticated user's profile, loyalty points, and tier.
- `get_my_bookings` — List the user's recent and active bookings.
- `get_my_booking` — Fetch details of a specific booking.
- `cancel_my_booking` — Cancel an existing booking.

This integration empowers agents to natively plan trips, check schedules, and manage bookings conversationally.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, React Router, Lucide Icons |
| **Backend** | Node.js, Express.js, Prisma ORM |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | JSON Web Tokens (JWT), bcryptjs |
| **AI** | Google Gemini API |
| **Deployment** | Vercel (frontend + backend) |

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18+ |
| PostgreSQL database | (or a Supabase project) |

---

## Local Development

### Backend

```bash
cd backend
cp ../.env.example .env
# Fill in DATABASE_URL, JWT_SECRET, etc.
npm install
npm run dev
# Server starts at http://localhost:3001
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL and optionally VITE_GEMINI_API_KEY
npm install
npm run dev
# App starts at http://localhost:3000
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (e.g. Supabase) |
| `DIRECT_URL` | Direct DB URL used by Prisma for migrations |
| `JWT_SECRET` | Secret key for signing JWTs |
| `PORT` | Backend port (default: `3001`) |
| `CORS_ORIGIN` | Allowed frontend origin (e.g. `http://localhost:3000`) |
| `VITE_API_URL` | Backend URL consumed by the frontend |
| `GEMINI_API_KEY` | Google Gemini API key for the AI assistant |

---

## API Endpoints

Base URL: `http://localhost:3001`

> All routes under `/api/*` are rate-limited to **100 requests per 15 minutes** per IP.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Create a new user account |
| `POST` | `/api/auth/login` | No | Login and receive a JWT |
| `GET` | `/api/auth/me` | Yes | Get the current authenticated user |

### Trains

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/trains` | No | List all trains (paginated, filterable) |
| `GET` | `/api/trains/search?from=&to=` | No | Search trains between two station codes |
| `GET` | `/api/trains/:number` | No | Get a single train with full schedule |
| `GET` | `/api/trains/:number/schedule` | No | Get all stops for a train |

### Stations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/stations` | No | List all stations |

### Schedules

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/schedules` | No | List train schedules |

### Bookings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/bookings` | Yes | Create a new booking |
| `GET` | `/api/bookings` | Yes | List current user's bookings |
| `GET` | `/api/bookings/:id` | Yes | Get a single booking |
| `PATCH` | `/api/bookings/:id/cancel` | Yes | Cancel a confirmed booking |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/profile` | Yes | Get current user profile |
| `PATCH` | `/api/users/profile` | Yes | Update profile and preferences |
| `GET` | `/api/users/bookings/stats` | Yes | Get booking statistics for the current user |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |

---

## Database Schema

Managed with **Prisma** against PostgreSQL:

| Model | Description |
|---|---|
| `User` | Registered users with hashed passwords |
| `UserProfile` | Loyalty points, tier, preferences per user |
| `Train` | Train number, name, type, coach capacities |
| `Station` | Station code, name, state, coordinates |
| `TrainSchedule` | Per-stop arrival/departure times for each train |
| `Booking` | Ticket reservations linked to user and train |

---

## Project Structure

- 📁 **[backend/](./backend)** — Node.js Express API
  - 📁 **[routes/](./backend/routes)** — auth, trains, stations, schedules, bookings, users
  - 📁 **[middleware/](./backend/middleware)** — JWT auth guard, error handler
  - 📁 **[lib/](./backend/lib)** — Prisma client singleton
  - 📁 **[prisma/](./backend/prisma)** — Migrations
  - 📄 **[schema.prisma](./backend/schema.prisma.)** — Prisma schema
  - 📄 **[server.js](./backend/server.js)** — App entry point
  - 📄 **[mcp.js](./backend/mcp.js)** — MCP server implementation
- 📁 **[frontend/](./frontend)** — React + TypeScript SPA (Vite)
  - 📁 **[components/](./frontend/components)** — Navbar, BookingForm, TrainList, TicketView, AuthModal, ...
  - 📁 **[contexts/](./frontend/contexts)** — Auth context
  - 📁 **[services/](./frontend/services)** — API service layer
  - 📄 **[App.tsx](./frontend/App.tsx)** — Root component and routing
  - 📄 **[types.ts](./frontend/types.ts)** — Shared TypeScript types
- 📄 **[docker-compose.yml](./docker-compose.yml)** — Optional local infrastructure (Kafka, Redis, TimescaleDB)
- 📄 **[.env.example](./.env.example)** — Environment variable template
- 📄 **[seed.js](./seed.js)** — Database seeding script

---

## License

This project is licensed under the **ISC License**.
