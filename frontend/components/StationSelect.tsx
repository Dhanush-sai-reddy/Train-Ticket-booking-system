import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Station } from '../types';
import { api } from '../services/api';

interface StationSelectProps {
  label: string;
  stations: Station[];
  value: string;
  onChange: (stationId: string) => void;
  disabled?: boolean;
}

export default function StationSelect({ label, stations, value, onChange, disabled }: StationSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedStation = stations.find(s => s.id === value);
  const displayValue = selectedStation ? `${selectedStation.city} (${selectedStation.code})` : '';

  const [asyncStations, setAsyncStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length === 0) {
      setAsyncStations(stations);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await api.stations.list(query);
        setAsyncStations(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, stations]);

  const displayStations = query.trim().length === 0 ? stations : asyncStations;

  return (
    <div className="space-y-1 relative" ref={wrapperRef}>
      <label className="text-sm font-medium text-slate-700 ml-1">{label}</label>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
        <input
          type="text"
          disabled={disabled}
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none disabled:opacity-60"
          placeholder={disabled ? 'Loading stations...' : 'Search city, name or station code...'}
          value={isOpen ? query : displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (disabled) return;
            setIsOpen(true);
            setQuery('');
          }}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 flex justify-center text-accent"><Loader2 className="animate-spin h-5 w-5" /></div>
          ) : displayStations.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">No stations found</div>
          ) : (
            displayStations.map(s => (
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
