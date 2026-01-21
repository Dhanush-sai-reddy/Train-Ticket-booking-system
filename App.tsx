import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import GeminiAssistant from './components/GeminiAssistant';
import { STATIONS, MOCK_TRAINS } from './constants';
import { Train, TicketClass, SearchParams, Booking, Passenger } from './types';
import TrainList from './components/TrainList';
import BookingForm from './components/BookingForm';
import TicketView from './components/TicketView';
import { Calendar, MapPin, Search } from 'lucide-react';

// Wrapper component to use hooks like useNavigate
const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    originId: STATIONS[0].id,
    destinationId: STATIONS[2].id,
    date: new Date().toISOString().split('T')[0],
    passengers: 1
  });

  const [bookingState, setBookingState] = useState<{
    train?: Train;
    ticketClass?: TicketClass;
    booking?: Booking;
  }>({});

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/results');
  };

  const handleSelectTrain = (train: Train, tClass: TicketClass) => {
    setBookingState({ ...bookingState, train, ticketClass: tClass });
    navigate('/book');
  };

  const handleBookingConfirm = (passengers: Passenger[]) => {
    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      train: bookingState.train!,
      ticketClass: bookingState.ticketClass!,
      origin: STATIONS.find(s => s.id === searchParams.originId)!,
      destination: STATIONS.find(s => s.id === searchParams.destinationId)!,
      date: searchParams.date,
      passengers,
      totalPrice: 0 // Calculated in form
    };
    setBookingState({ ...bookingState, booking: newBooking });
    navigate('/confirmation');
  };

  const resetBooking = () => {
    setBookingState({});
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={
            <div className="flex flex-col lg:flex-row items-center gap-12 mt-8 lg:mt-16">
              <div className="lg:w-1/2 space-y-8 animate-in slide-in-from-left-10 fade-in duration-500">
                <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  Discover new <br/>
                  <span className="text-accent">destinations</span> today.
                </h1>
                <p className="text-lg text-slate-600 max-w-lg">
                  Experience the comfort of modern rail travel. Book tickets seamlessly with our smart booking platform.
                </p>
                
                {/* Search Card */}
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 ml-1">From</label>
                        <div className="relative">
                           <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                           <select 
                             className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none appearance-none"
                             value={searchParams.originId}
                             onChange={(e) => setSearchParams({...searchParams, originId: e.target.value})}
                           >
                             {STATIONS.map(s => <option key={s.id} value={s.id}>{s.city} ({s.code})</option>)}
                           </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 ml-1">To</label>
                         <div className="relative">
                           <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                           <select 
                             className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none appearance-none"
                             value={searchParams.destinationId}
                             onChange={(e) => setSearchParams({...searchParams, destinationId: e.target.value})}
                           >
                             {STATIONS.map(s => <option key={s.id} value={s.id}>{s.city} ({s.code})</option>)}
                           </select>
                        </div>
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
                            onChange={(e) => setSearchParams({...searchParams, date: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-sm font-medium text-slate-700 ml-1">Travelers</label>
                         <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none"
                            value={searchParams.passengers}
                            onChange={(e) => setSearchParams({...searchParams, passengers: parseInt(e.target.value)})}
                         >
                           {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>)}
                         </select>
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-primary hover:bg-slate-800 text-white font-semibold py-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2">
                      <Search className="h-5 w-5" />
                      Search Trains
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
                 {/* Floating Element */}
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
               <h2 className="text-2xl font-bold mb-6 text-slate-800">Available Trains</h2>
               <div className="flex flex-col lg:flex-row gap-8">
                 {/* Filters Sidebar (Visual only) */}
                 <div className="lg:w-64 hidden lg:block space-y-6">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="font-semibold mb-3">Filters</h3>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input type="checkbox" className="rounded text-accent focus:ring-accent" defaultChecked /> Direct
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input type="checkbox" className="rounded text-accent focus:ring-accent" /> High Speed
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input type="checkbox" className="rounded text-accent focus:ring-accent" /> Sleeper
                        </label>
                      </div>
                    </div>
                 </div>
                 
                 <div className="flex-1">
                    <TrainList trains={MOCK_TRAINS} onSelect={handleSelectTrain} />
                 </div>
               </div>
            </div>
          } />

          <Route path="/book" element={
            bookingState.train ? (
              <BookingForm 
                train={bookingState.train}
                ticketClass={bookingState.ticketClass || TicketClass.ECONOMY}
                origin={STATIONS.find(s => s.id === searchParams.originId)!}
                destination={STATIONS.find(s => s.id === searchParams.destinationId)!}
                date={searchParams.date}
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
        </Routes>
      </main>

      <GeminiAssistant />
    </div>
  );
}

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;