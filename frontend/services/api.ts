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
    list: () => request<any[]>('/api/stations'),
  },
  trains: {
    search: (origin?: string, destination?: string) => {
      const params = new URLSearchParams();
      if (origin) params.set('origin', origin);
      if (destination) params.set('destination', destination);
      const qs = params.toString();
      return request<any[]>(`/api/trains${qs ? `?${qs}` : ''}`);
    },
  },
  bookings: {
    create: (body: { trainId: string; routeId: string; travelDate: string; ticketClass: string; passengers: number }) =>
      request<{ message: string; booking: any }>('/api/bookings', { method: 'POST', body: JSON.stringify(body) }),
    list: () => request<any[]>('/api/bookings'),
  },
};
