import React from 'react';
import { Booking } from '../types';
import { Download, Share2, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TicketViewProps {
  booking: Booking;
  onReset: () => void;
}

const TicketView: React.FC<TicketViewProps> = ({ booking, onReset }) => {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Download className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
        <p className="text-slate-500">Your ticket has been sent to your email.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative mb-8">
        {/* Top Section */}
        <div className="bg-slate-900 p-6 text-white text-left">
           <div className="flex justify-between items-start mb-4">
             <div>
               <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Train</p>
               <p className="font-bold text-xl">{booking.train.name}</p>
               <p className="text-accent text-sm">{booking.train.number}</p>
             </div>
             <div className="text-right">
               <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Class</p>
               <p className="font-bold text-xl">{booking.ticketClass}</p>
             </div>
           </div>
           
           <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-4xl font-bold">{booking.origin.code}</p>
                <p className="text-slate-400 text-sm">{booking.origin.city}</p>
              </div>
              <div className="flex-1 border-b-2 border-dashed border-slate-600 mx-4 relative top-[-10px]"></div>
              <div className="text-right">
                <p className="text-4xl font-bold">{booking.destination.code}</p>
                <p className="text-slate-400 text-sm">{booking.destination.city}</p>
              </div>
           </div>

           <div className="flex justify-between">
              <div>
                 <p className="text-slate-400 text-xs uppercase mb-1">Date</p>
                 <p className="font-semibold">{booking.date}</p>
              </div>
              <div>
                 <p className="text-slate-400 text-xs uppercase mb-1">Departure</p>
                 <p className="font-semibold">{booking.train.departureTime}</p>
              </div>
              <div className="text-right">
                 <p className="text-slate-400 text-xs uppercase mb-1">Passenger</p>
                 <p className="font-semibold">{booking.passengers[0].firstName} {booking.passengers[0].lastName[0]}.</p>
              </div>
           </div>
        </div>

        {/* Perforation */}
        <div className="relative h-8 bg-white">
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-full border border-slate-200"></div>
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-full border border-slate-200"></div>
          <div className="absolute top-1/2 left-4 right-4 border-b-2 border-dashed border-slate-200"></div>
        </div>

        {/* QR Section */}
        <div className="p-6 bg-white flex flex-col items-center justify-center">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.id}`} 
              alt="QR Code" 
              className="w-32 h-32 mb-4 opacity-90"
            />
            <p className="text-xs text-slate-400 uppercase tracking-widest">Scan at Gate</p>
            <p className="text-xs text-slate-300 mt-1">ID: {booking.id}</p>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <Link 
          to="/"
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <Home className="h-5 w-5" />
          Home
        </Link>
        <button className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          <Share2 className="h-5 w-5" />
          Share
        </button>
      </div>
    </div>
  );
};

export default TicketView;
