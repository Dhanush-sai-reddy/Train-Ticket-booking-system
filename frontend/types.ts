export interface Station {
  id: string;
  name: string;
  code: string;
  city: string;
}

export interface Train {
  id: string;
  name: string;
  number: string;
  departureTime: string; // ISO string or HH:mm
  arrivalTime: string;
  duration: string;
  priceStart: number;
  amenities: string[];
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
