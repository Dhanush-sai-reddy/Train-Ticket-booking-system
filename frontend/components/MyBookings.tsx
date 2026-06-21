import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Loader2, Ticket, MapPin, Calendar, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyBookings: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    api.bookings.list()
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <Ticket className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <p className="text-xl font-semibold text-slate-600">Please login to view your bookings</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Home
      </Link>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">My Bookings</h2>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Ticket className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No bookings yet. Book your first train!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b: any) => (
            <div key={b.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                      {b.train?.number || '—'}
                    </span>
                    <span className="font-semibold text-slate-900">{b.train?.name || 'Train'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{b.fromStation?.code || '?'}</span>
                    <span>→</span>
                    <span className="font-medium">{b.toStation?.code || '?'}</span>
                    <span className="text-slate-400">•</span>
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{b.travelDate ? new Date(b.travelDate).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full uppercase ${
                    b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{b.status}</span>
                  <p className="font-bold text-lg text-slate-900 mt-1">₹{Number(b.totalPrice).toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{b.ticketClass} • {b.passengers} pax</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
