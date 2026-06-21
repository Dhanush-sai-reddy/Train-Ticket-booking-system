const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3001';


function getToken(): string | null {
  return localStorage.getItem('railrover_token');
}

export function setToken(token: string) {
  localStorage.setItem('railrover_token', token);
}

export function clearToken() {
  localStorage.removeItem('railrover_token');
}

interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data: ApiResponse<T> = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
  return data as T;
}

function mapStation(s: { code: string; name: string; state?: string | null }) {
  return {
    id: s.code,
    name: s.name,
    code: s.code,
    city: s.state ? `${s.name}, ${s.state}` : s.name,
  };
}

function formatTime(t?: string | null): string | undefined {
  if (!t) return undefined;
  return t.slice(0, 5);
}

function formatDuration(h?: number | null, m?: number | null): string | undefined {
  if (h == null && m == null) return undefined;
  const hours = h ?? 0;
  const mins = m ?? 0;
  if (hours === 0 && mins === 0) return undefined;
  return `${hours}h ${mins}m`;
}

function deriveAmenities(t: {
  sleeper?: number;
  chairCar?: number;
  secondAc?: number;
  thirdAc?: number;
  firstClass?: number;
  type?: string | null;
}): string[] {
  const amenities: string[] = [];
  if (t.thirdAc || t.secondAc || t.firstClass || t.chairCar) amenities.push('AC');
  if (t.sleeper) amenities.push('Sleeper');
  if (t.chairCar) amenities.push('Meals');
  if (t.type?.includes('SUF') || t.type?.includes('SF')) amenities.push('WiFi');
  return amenities.length ? amenities : ['AC'];
}

function deriveBasePrice(t: {
  sleeper?: number;
  chairCar?: number;
  secondAc?: number;
  thirdAc?: number;
  firstClass?: number;
}): number {
  if (t.firstClass) return 2500;
  if (t.secondAc) return 1800;
  if (t.thirdAc) return 1200;
  if (t.chairCar) return 900;
  if (t.sleeper) return 500;
  return 500;
}

function mapTrain(t: Record<string, unknown>, fromCode?: string, toCode?: string) {
  const fromStation = t.fromStation as { code: string; name: string; state?: string | null } | undefined;
  const toStation = t.toStation as { code: string; name: string; state?: string | null } | undefined;

  return {
    id: t.number as string,
    name: t.name as string,
    number: t.number as string,
    type: (t.type as string) || 'EXP',
    totalSeats: ((t.sleeper as number) || 0) + ((t.chairCar as number) || 0) +
      ((t.secondAc as number) || 0) + ((t.thirdAc as number) || 0) + ((t.firstClass as number) || 0),
    amenities: deriveAmenities(t as Parameters<typeof deriveAmenities>[0]),
    routes: fromStation && toStation ? [{
      id: `${t.number}-${fromCode || fromStation.code}-${toCode || toStation.code}`,
      trainId: t.number as string,
      originId: fromCode || fromStation.code,
      destinationId: toCode || toStation.code,
      distanceKm: null,
      basePrice: String(deriveBasePrice(t as Parameters<typeof deriveBasePrice>[0])),
      origin: mapStation(fromStation),
      destination: mapStation(toStation),
    }] : [],
    departureTime: formatTime(t.departure as string),
    arrivalTime: formatTime(t.arrival as string),
    duration: formatDuration(t.durationH as number, t.durationM as number),
    priceStart: deriveBasePrice(t as Parameters<typeof deriveBasePrice>[0]),
  };
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
      request<{ token: string; user: { id: string; email: string; name: string } }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      request<{ token: string; user: { id: string; email: string; name: string } }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () =>
      request<{ id: string; email: string; name: string }>('/api/auth/me'),
  },
  stations: {
    list: (search?: string) => {
      const qs = search ? `?search=${encodeURIComponent(search)}&limit=50` : '?limit=50';
      return request<ApiResponse<Record<string, unknown>[]>>(`/api/stations${qs}`).then(res => {
        if (!res.data) return [];
        return res.data.map(s => mapStation(s as { code: string; name: string; state?: string | null }));
      });
    },
  },
  trains: {
    search: (origin?: string, destination?: string) => {
      const params = new URLSearchParams();
      if (origin) params.set('from', origin);
      if (destination) params.set('to', destination);
      const qs = params.toString();
      return request<ApiResponse<Record<string, unknown>[]>>(`/api/trains/search${qs ? `?${qs}` : ''}`).then(res => {
        if (!res.data) return [];
        return res.data.map(t => mapTrain(t, origin, destination));
      });
    },
  },
  bookings: {
    create: (body: {
      trainNumber: string;
      fromStationCode: string;
      toStationCode: string;
      travelDate: string;
      ticketClass: string;
      passengers: number;
    }) =>
      request<{ success: boolean; message: string; data: unknown }>('/api/bookings', { method: 'POST', body: JSON.stringify(body) }),
    list: () =>
      request<ApiResponse<unknown[]>>('/api/bookings').then(res => res.data || []),
  },
};
