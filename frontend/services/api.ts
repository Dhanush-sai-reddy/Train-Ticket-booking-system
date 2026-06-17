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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
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
    list: () => request<any>('/api/stations').then(res => {
      if (!res.data) return [];
      return res.data.map((s: any) => ({
        id: s.code,
        name: s.name,
        code: s.code,
        city: s.state ? `${s.name}, ${s.state}` : s.name
      }));
    }),
  },
  trains: {
    search: (origin?: string, destination?: string) => {
      const params = new URLSearchParams();
      if (origin) params.set('from', origin);
      if (destination) params.set('to', destination);
      const qs = params.toString();
      return request<any>(`/api/trains/search${qs ? `?${qs}` : ''}`).then(res => {
        if (!res.data) return [];
        return res.data.map((t: any) => ({
          id: t.number,
          name: t.name,
          number: t.number,
          departureTime: t.departure || '00:00',
          arrivalTime: t.arrival || '00:00',
          duration: t.durationH ? `${t.durationH}h ${t.durationM || 0}m` : 'N/A',
          priceStart: 500,
          amenities: ['AC', 'WiFi']
        }));
      });
    },
  },
  bookings: {
    create: (body: { trainId: string; routeId: string; travelDate: string; ticketClass: string; passengers: number }) =>
      request<{ message: string; booking: any }>('/api/bookings', { method: 'POST', body: JSON.stringify(body) }),
    list: () => request<any[]>('/api/bookings'),
  },
};
