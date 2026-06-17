import React, { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { Station } from '../types';

interface StationSelectProps {
  label: string;
  stations: Station[];
  value: string;
  onChange: (stationId: string) => void;
}

export default function StationSelect({ label, stations, value, onChange }: StationSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedStation = stations.find(s => s.id === value);
  const displayValue = selectedStation ? `${selectedStation.city} (${selectedStation.code})` : '';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStations = stations.filter(s => 
    (s.city || '').toLowerCase().includes(query.toLowerCase()) || 
    (s.code || '').toLowerCase().includes(query.toLowerCase()) ||
    (s.name || '').toLowerCase().includes(query.toLowerCase())
  ).slice(0, 50);

  return (
    <div className="space-y-1 relative" ref={wrapperRef}>
      <label className="text-sm font-medium text-slate-700 ml-1">{label}</label>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
        <input
          type="text"
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none"
          placeholder="Search city, name or station code..."
          value={isOpen ? query : displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
          {filteredStations.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">No stations found</div>
          ) : (
            filteredStations.map(s => (
              <div
                key={s.id}
                className={`px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 flex flex-col border-b border-slate-50 last:border-0 ${s.id === value ? 'bg-accent/5' : ''}`}
                onClick={() => {
                  onChange(s.id);
                  setIsOpen(false);
                }}
              >
                <span className="font-semibold text-slate-800">{s.city}</span>
                <span className="text-xs text-slate-500">{s.name} ({s.code})</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
