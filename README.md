# RailRover — Train Ticket Booking System

A full-stack railway booking platform. The backend is a Node.js REST API using Prisma and PostgreSQL, and the frontend is a React + TypeScript SPA. Both are deployed on Vercel.

---

## Features

- **User Authentication** — JWT-based register/login with bcrypt password hashing
- **Train & Station Search** — Search trains between stations, including indirect routes via schedule stops
- **Ticket Booking** — Book tickets with coach-class selection; awards loyalty points on each booking
- **Booking Management** — View, retrieve, and cancel personal bookings
- **User Profile** — Update profile details and preferences
- **Analytics** — Revenue, occupancy, popular routes, and demand metrics via SQL aggregations
- **AI Assistant** — Gemini-powered travel assistant in the UI

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

### Analytics

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics/revenue` | Yes | Revenue grouped by day/week/month |
| `GET` | `/api/analytics/occupancy` | Yes | Average occupancy rates by train |
| `GET` | `/api/analytics/popular-routes` | Yes | Top 10 routes by booking count |
| `GET` | `/api/analytics/train-performance` | Yes | Demand metrics per train |

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

```
Train-Ticket-booking-system/
├── backend/                  # Node.js Express API
│   ├── routes/               # auth, trains, stations, schedules, bookings, users, analytics
│   ├── middleware/           # JWT auth guard, error handler
│   ├── lib/                  # Prisma client singleton
│   ├── prisma/               # Migrations
│   ├── schema.prisma.        # Prisma schema
│   └── server.js             # App entry point
├── frontend/                 # React + TypeScript SPA (Vite)
│   ├── components/           # Navbar, BookingForm, TrainList, TicketView, AuthModal, ...
│   ├── contexts/             # Auth context
│   ├── services/             # API service layer
│   ├── App.tsx               # Root component and routing
│   └── types.ts              # Shared TypeScript types
├── docker-compose.yml        # Optional local infrastructure
├── .env.example              # Environment variable template
└── seed.js                   # Database seeding script
```

---

## License

This project is licensed under the **ISC License**.
