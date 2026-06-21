import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import GeminiAssistant from './components/GeminiAssistant';
import MyBookings from './components/MyBookings';
import StationSelect from './components/StationSelect';
import { Train, TicketClass, SearchParams, Booking, Passenger, Station } from './types';
import TrainList from './components/TrainList';
import BookingForm from './components/BookingForm';
import TicketView from './components/TicketView';
import { Calendar, Search, Loader2, AlertCircle, TrainFront } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { api } from './services/api';

const DEFAULT_ORIGIN = 'NDLS';
const DEFAULT_DEST = 'MAS';

const AppContent: React.FC = () => {
  const navigate = useNavigate();

  const [stations, setStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState('');

  const [searchParams, setSearchParams] = useState<SearchParams>({
    originId: DEFAULT_ORIGIN,
    destinationId: DEFAULT_DEST,
    date: new Date().toISOString().split('T')[0],
    passengers: 1,
  });

  const [searchResults, setSearchResults] = useState<Train[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [bookingState, setBookingState] = useState<{
    train?: Train;
    ticketClass?: TicketClass;
    booking?: Booking;
  }>({});

  useEffect(() => {
    api.stations.list()
      .then(data => {
        if (data.length) {
          setStations(data);
          const origin = data.find(s => s.code === DEFAULT_ORIGIN) || data[0];
          const dest = data.find(s => s.code === DEFAULT_DEST) || data[1] || data[0];
          setSearchParams(prev => ({
            ...prev,
            originId: origin.id,
            destinationId: dest.id,
          }));
        }
      })
      .catch(() => setStationsError('Could not load stations. Check that the backend is running.'))
      .finally(() => setStationsLoading(false));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchParams.originId === searchParams.destinationId) {
      setSearchError('Origin and destination must be different.');
      return;
    }
    setIsSearching(true);
    setSearchError('');
    setHasSearched(true);
    try {
      const trains = await api.trains.search(searchParams.originId, searchParams.destinationId);
      setSearchResults(trains);
    } catch (err: unknown) {
      setSearchResults([]);
      setSearchError(err instanceof Error ? err.message : 'Train search failed. Check that the backend is running.');
    } finally {
      setIsSearching(false);
      navigate('/results');
    }
  };

  const handleSelectTrain = (train: Train, tClass: TicketClass) => {
    setBookingState({ ...bookingState, train, ticketClass: tClass });
    navigate('/book');
  };

  const handleBookingConfirm = (passengers: Passenger[]) => {
    const origin = stations.find(s => s.id === searchParams.originId)!;
    const dest = stations.find(s => s.id === searchParams.destinationId)!;
    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      train: bookingState.train!,
      ticketClass: bookingState.ticketClass!,
      origin,
      destination: dest,
      date: searchParams.date,
      passengers,
      totalPrice: 0,
    };
    setBookingState({ ...bookingState, booking: newBooking });
    navigate('/confirmation');
  };

  const resetBooking = () => {
    setBookingState({});
    navigate('/');
  };

  const originStation = stations.find(s => s.id === searchParams.originId);
  const destStation = stations.find(s => s.id === searchParams.destinationId);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={
            <div className="flex flex-col lg:flex-row items-center gap-12 mt-8 lg:mt-16">
              <div className="lg:w-1/2 space-y-8 animate-in slide-in-from-left-10 fade-in duration-500">
                <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  Welcome to <br />
                  <span className="text-accent">RailRover</span>
                </h1>
                <p className="text-lg text-slate-600 max-w-lg">
                  Book tickets seamlessly with India's most advanced railway platform. Powered by Real-time Intelligence.
                </p>

                <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                  {stationsError && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {stationsError}
                    </div>
                  )}
                  {searchError && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {searchError}
                    </div>
                  )}

                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <StationSelect
                          label="From"
                          stations={stations}
                          value={searchParams.originId}
                          onChange={(id, station) => {
                            setSearchParams({ ...searchParams, originId: id });
                            if (station && !stations.find(s => s.id === station.id)) {
                              setStations(prev => [...prev, station]);
                            }
                          }}
                          disabled={stationsLoading}
                        />
                      </div>
                      <div className="space-y-1">
                        <StationSelect
                          label="To"
                          stations={stations}
                          value={searchParams.destinationId}
                          onChange={(id, station) => {
                            setSearchParams({ ...searchParams, destinationId: id });
                            if (station && !stations.find(s => s.id === station.id)) {
                              setStations(prev => [...prev, station]);
                            }
                          }}
                          disabled={stationsLoading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 ml-1">Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                          <input
                            type="date"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none"
                            value={searchParams.date}
                            onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 ml-1">Travelers</label>
                        <select
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none"
                          value={searchParams.passengers}
                          onChange={(e) => setSearchParams({ ...searchParams, passengers: parseInt(e.target.value) })}
                        >
                          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>)}
                        </select>
                      </div>
                    </div>

                    <button type="submit" disabled={isSearching || stationsLoading}
                      className="w-full bg-primary hover:bg-slate-800 text-white font-semibold py-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2 disabled:opacity-60">
                      {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                      {isSearching ? 'Searching...' : 'Search Trains'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:w-1/2 relative animate-in slide-in-from-right-10 fade-in duration-700 hidden lg:block">
                <div className="absolute inset-0 bg-accent/10 rounded-full blur-3xl transform translate-x-12 translate-y-12"></div>
                <img
                  src="https://picsum.photos/800/600?grayscale"
                  alt="Modern Train"
                  className="relative rounded-3xl shadow-2xl z-10 object-cover h-[500px] w-full"
                />

                <div className="absolute -bottom-8 -left-8 bg-white p-4 rounded-xl shadow-xl z-20 flex items-center gap-4 animate-bounce duration-[3000ms]">
                  <div className="bg-green-100 p-3 rounded-full">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">98% On Time</p>
                    <p className="text-xs text-slate-500">Reliable service</p>
                  </div>
                </div>
              </div>
            </div>
          } />

          <Route path="/results" element={
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Available Trains</h2>
                {originStation && destStation && (
                  <p className="text-sm text-slate-500">
                    {originStation.code} → {destStation.code} · {searchParams.date}
                  </p>
                )}
              </div>

              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
                  <p>Searching trains...</p>
                </div>
              ) : searchError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                  <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                  <p className="text-red-700 font-medium mb-4">{searchError}</p>
                  <Link to="/" className="text-accent hover:underline text-sm">← Back to search</Link>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="lg:w-64 hidden lg:block space-y-6">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="font-semibold mb-3">Results</h3>
                      <p className="text-sm text-slate-600">{searchResults.length} train{searchResults.length !== 1 ? 's' : ''} found</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <TrainList trains={searchResults} onSelect={handleSelectTrain} />
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                  <TrainFront className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-700 mb-2">
                    {hasSearched ? 'No trains found for this route' : 'No search performed yet'}
                  </p>
                  <p className="text-sm text-slate-500 mb-6">
                    {hasSearched
                      ? 'Try different stations or check if both stations are on the same route.'
                      : 'Search for trains from the home page to see results here.'}
                  </p>
                  <Link to="/" className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors">
                    <Search className="h-4 w-4" />
                    {hasSearched ? 'Try another search' : 'Search trains'}
                  </Link>
                </div>
              )}
            </div>
          } />

          <Route path="/book" element={
            bookingState.train && originStation && destStation ? (
              <BookingForm
                train={bookingState.train}
                ticketClass={bookingState.ticketClass || TicketClass.ECONOMY}
                origin={originStation}
                destination={destStation}
                date={searchParams.date}
                passengers={searchParams.passengers}
                onBack={() => navigate('/results')}
                onConfirm={handleBookingConfirm}
              />
            ) : <div className="text-center p-10">Please select a train first.</div>
          } />

          <Route path="/confirmation" element={
            bookingState.booking ? (
              <TicketView booking={bookingState.booking} onReset={resetBooking} />
            ) : <div className="text-center p-10">No active booking found.</div>
          } />

          <Route path="/my-bookings" element={<MyBookings />} />
        </Routes>
      </main>

      <GeminiAssistant />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
