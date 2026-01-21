import React, { useState } from 'react';
import { Train, TicketClass, Passenger, Station } from '../types';
import { User, CreditCard, ChevronLeft, CheckCircle } from 'lucide-react';

interface BookingFormProps {
  train: Train;
  ticketClass: TicketClass;
  origin: Station;
  destination: Station;
  date: string;
  onBack: () => void;
  onConfirm: (passengers: Passenger[]) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ 
  train, ticketClass, origin, destination, date, onBack, onConfirm 
}) => {
  const [passenger, setPassenger] = useState<Passenger>({
    id: '1',
    firstName: '',
    lastName: '',
    email: '',
    age: 0
  });

  const [paymentStep, setPaymentStep] = useState(false);
  const [cardNumber, setCardNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentStep) {
      setPaymentStep(true);
    } else {
      onConfirm([passenger]);
    }
  };

  const getPrice = () => {
    let multiplier = 1;
    if (ticketClass === TicketClass.BUSINESS) multiplier = 1.5;
    if (ticketClass === TicketClass.FIRST) multiplier = 2.5;
    return Math.round(train.priceStart * multiplier);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Results
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Summary Header */}
        <div className="bg-slate-900 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Complete your booking</h2>
          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-white">{origin.code}</span>
              <span>→</span>
              <span className="font-semibold text-white">{destination.code}</span>
            </div>
            <span>•</span>
            <span>{date}</span>
            <span>•</span>
            <span>{train.departureTime}</span>
            <span>•</span>
            <span className="bg-accent px-2 py-0.5 rounded text-xs text-white uppercase font-bold">{ticketClass}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {!paymentStep ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-50 p-2 rounded-full">
                  <User className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Passenger Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                    value={passenger.firstName}
                    onChange={e => setPassenger({...passenger, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                    value={passenger.lastName}
                    onChange={e => setPassenger({...passenger, lastName: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    required
                    type="email"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                    value={passenger.email}
                    onChange={e => setPassenger({...passenger, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="bg-accent hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
               <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-50 p-2 rounded-full">
                  <CreditCard className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Payment</h3>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600">Ticket Price ({ticketClass})</span>
                  <span className="font-semibold">₹{getPrice()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600">GST & Fees</span>
                  <span className="font-semibold">₹45</span>
                </div>
                <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900">Total</span>
                  <span className="text-lg font-bold text-accent">₹{getPrice() + 45}</span>
                </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Card Number (Mock)</label>
                  <input
                    required
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                  />
              </div>

              <div className="pt-6 mt-6 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setPaymentStep(false)}
                  className="text-slate-500 hover:text-slate-800 font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-green-500/30 transition-all flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  Pay & Book
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
