export interface Station {
  id: string;
  name: string;
  code: string;
  city: string;
}

// Backend train shape (with routes included)
export interface TrainRoute {
  id: string;
  trainId: string;
  originId: string;
  destinationId: string;
  distanceKm: number | null;
  basePrice: string; // Decimal comes as string from Prisma
  origin: Station;
  destination: Station;
}

export interface Train {
  id: string;
  name: string;
  number: string;
  type?: string;
  totalSeats?: number;
  amenities?: string[];
  routes?: TrainRoute[];
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  pricing?: Record<string, { price: number; demandFactor: number }> | null;
}

export enum TicketClass {
  ECONOMY = 'Economy',
  BUSINESS = 'Business',
  FIRST = 'First',
}

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
}

export interface Booking {
  id: string;
  train: Train;
  passengers: Passenger[];
  ticketClass: TicketClass;
  totalPrice: number;
  date: string;
  origin: Station;
  destination: Station;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface SearchParams {
  originId: string;
  destinationId: string;
  date: string;
  passengers: number;
}
