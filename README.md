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
