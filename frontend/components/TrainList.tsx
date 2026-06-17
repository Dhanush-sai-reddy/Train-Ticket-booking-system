import React from 'react';
import { Train, TicketClass } from '../types';
import { Clock, ArrowRight, Wifi, Coffee, Zap, Moon } from 'lucide-react';

interface TrainListProps {
  trains: Train[];
  onSelect: (train: Train, tClass: TicketClass) => void;
}

const TrainList: React.FC<TrainListProps> = ({ trains, onSelect }) => {
  const getIcon = (amenity: string) => {
    switch (amenity) {
      case 'WiFi': return <Wifi className="h-3 w-3" key={amenity}/>;
      case 'Cafe':
      case 'Meals': return <Coffee className="h-3 w-3" key={amenity}/>;
      case 'Power': 
      case 'AC': return <Zap className="h-3 w-3" key={amenity}/>;
      case 'Sleeper': 
      case 'Bedroll': return <Moon className="h-3 w-3" key={amenity}/>;
      default: return null;
    }
  };

  // Get base price: try route basePrice, then priceStart, then default
  const getBasePrice = (train: Train): number => {
    if (train.routes?.length && train.routes[0].basePrice) {
      return Number(train.routes[0].basePrice);
    }
    return train.priceStart || 500;
  };

  // Get route info for display
  const getRouteInfo = (train: Train) => {
    if (train.routes?.length) {
      const r = train.routes[0];
      return { origin: r.origin?.code, destination: r.destination?.code };
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {trains.map((train) => {
        const basePrice = getBasePrice(train);
        const route = getRouteInfo(train);
        return (
        <div key={train.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
              
              {/* Train Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                    {train.number}
                  </span>
                  <h3 className="font-semibold text-lg text-slate-900">{train.name}</h3>
                  {train.type && (
                    <span className="bg-accent/10 text-accent text-xs font-medium px-2 py-0.5 rounded-full capitalize">{train.type}</span>
                  )}
                </div>
                
                {/* Departure/Arrival or Route */}
                <div className="flex items-center gap-6 mt-4">
                  {train.departureTime ? (
                    <>
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{train.departureTime}</div>
                        <div className="text-sm text-slate-500">Departure</div>
                      </div>
                      <div className="flex flex-col items-center px-4">
                        <div className="text-xs text-slate-400 font-medium mb-1">{train.duration || '—'}</div>
                        <div className="w-24 h-px bg-slate-300 relative">
                            <div className="absolute -top-1 right-0 w-2 h-2 bg-slate-300 rounded-full"></div>
                            <div className="absolute -top-1 left-0 w-2 h-2 bg-slate-300 rounded-full"></div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 mt-1" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{train.arrivalTime}</div>
                        <div className="text-sm text-slate-500">Arrival</div>
                      </div>
                    </>
                  ) : route ? (
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-bold text-slate-900">{route.origin}</div>
                      <div className="flex flex-col items-center px-2">
                        <div className="w-16 h-px bg-slate-300 relative">
                          <div className="absolute -top-1 right-0 w-2 h-2 bg-slate-300 rounded-full"></div>
                          <div className="absolute -top-1 left-0 w-2 h-2 bg-slate-300 rounded-full"></div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 mt-1" />
                      </div>
                      <div className="text-xl font-bold text-slate-900">{route.destination}</div>
                      {train.totalSeats && (
                        <span className="text-sm text-slate-400 ml-4">{train.totalSeats} seats</span>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-2 mt-4 text-slate-400">
                  {(train.amenities || []).map(a => (
                    <span key={a} title={a} className="bg-slate-50 p-1.5 rounded-full border border-slate-100">
                      {getIcon(a)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pricing & Actions */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                <button 
                  onClick={() => onSelect(train, TicketClass.ECONOMY)}
                  className="flex justify-between items-center p-3 rounded-lg border border-slate-200 hover:border-accent hover:bg-blue-50 transition-colors group text-left"
                >
                  <span className="text-sm font-medium text-slate-600 group-hover:text-accent">CC / Sleeper</span>
                  <span className="font-bold text-slate-900 group-hover:text-accent">₹{basePrice}</span>
                </button>
                <button 
                  onClick={() => onSelect(train, TicketClass.BUSINESS)}
                  className="flex justify-between items-center p-3 rounded-lg border border-slate-200 hover:border-accent hover:bg-blue-50 transition-colors group text-left"
                >
                  <span className="text-sm font-medium text-slate-600 group-hover:text-accent">3rd AC / EC</span>
                  <span className="font-bold text-slate-900 group-hover:text-accent">₹{Math.round(basePrice * 1.5)}</span>
                </button>
                <button 
                  onClick={() => onSelect(train, TicketClass.FIRST)}
                  className="flex justify-between items-center p-3 rounded-lg border border-slate-200 hover:border-accent hover:bg-blue-50 transition-colors group text-left"
                >
                  <span className="text-sm font-medium text-slate-600 group-hover:text-accent">1st AC</span>
                  <span className="font-bold text-slate-900 group-hover:text-accent">₹{Math.round(basePrice * 2.5)}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
};

export default TrainList;
