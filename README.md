# RailRover - Railway Booking System

A modern railway ticket booking system with AI-powered travel assistance, built with React, Node.js, and TimescaleDB.

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Google Gemini AI** for travel assistance

### Backend
- **Node.js 20** with TypeScript
- **Express.js** web framework
- **TimescaleDB** for time-series data
- **Redis** for caching and sessions
- **Prisma ORM** for database management
- **JWT** for authentication

### Infrastructure
- **Docker** & **Docker Compose** for containerization
- **TimescaleDB** for time-series analytics
- **Redis** for session management

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Google Gemini API key (optional, for AI features)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd railig
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - TimescaleDB: localhost:5432

### Development Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart specific service
docker-compose restart backend

# Access database
docker-compose exec timescaledb psql -U railrover_user -d railrover
```

## Database Schema

### Core Tables
- **stations** - Railway stations with location data
- **trains** - Train fleet information
- **routes** - Train routes with pricing
- **users** - User accounts and authentication
- **user_profiles** - User preferences and loyalty data

### Time-Series Tables (TimescaleDB)
- **train_schedules** - Real-time schedule data
- **seat_occupancy** - Seat availability tracking
- **pricing_history** - Dynamic pricing data
- **bookings** - Booking records with analytics

### Continuous Aggregates
- **daily_occupancy_stats** - Real-time occupancy analytics
- **pricing_trends** - Historical pricing analysis

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Trains & Routes
- `GET /api/trains` - List available trains
- `GET /api/trains/:id` - Train details
- `GET /api/routes/search` - Search routes
- `GET /api/schedules` - Train schedules

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Booking details
- `GET /api/users/:id/bookings` - User bookings
- `DELETE /api/bookings/:id` - Cancel booking

### Analytics
- `GET /api/analytics/occupancy` - Seat occupancy stats
- `GET /api/analytics/pricing` - Pricing trends
- `GET /api/analytics/popularity` - Route popularity

## Features

### Core Functionality
- ✅ Train search and filtering
- ✅ Seat selection and booking
- ✅ User authentication
- ✅ Payment processing (mock)
- ✅ Booking confirmation with QR codes

### AI Integration
- ✅ Travel assistant chatbot
- ✅ Destination recommendations
- ✅ Travel advice and tips

### Analytics
- ✅ Real-time seat occupancy tracking
- ✅ Dynamic pricing based on demand
- ✅ Route popularity analytics
- ✅ User behavior insights

## Architecture

### Time-Series Data Usage
- **Train Schedules**: Real-time delay tracking
- **Seat Occupancy**: Live availability monitoring
- **Pricing History**: Dynamic pricing algorithms
- **User Bookings**: Booking pattern analytics

### Microservices Pattern
- **API Gateway**: Express.js server
- **Database Layer**: TimescaleDB with Prisma
- **Cache Layer**: Redis for sessions
- **AI Service**: Gemini integration

## Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Database Management
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# View database
npm run db:studio

# Seed database
npm run db:seed
```

## Deployment

### Production Docker Compose
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Environment Variables
- `NODE_ENV=production`
- `DATABASE_URL` - Production TimescaleDB URL
- `REDIS_URL` - Production Redis URL
- `JWT_SECRET` - Secure JWT secret
- `GEMINI_API_KEY` - Google Gemini API key

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
