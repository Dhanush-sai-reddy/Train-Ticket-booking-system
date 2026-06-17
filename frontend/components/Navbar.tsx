import React, { useState } from 'react';
import { Train as TrainIcon, Menu, User, LogOut, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="bg-primary text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <TrainIcon className="h-8 w-8 text-accent" />
                <span className="font-bold text-xl tracking-tight">RailRover</span>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className="hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                <Link to="/my-bookings" className="hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium">My Bookings</Link>
                <a href="#" className="hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium">Support</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-sm text-slate-300">
                    Hi, <span className="text-white font-semibold">{user?.name?.split(' ')[0]}</span>
                  </span>
                  <button onClick={logout} className="p-2 rounded-full hover:bg-slate-800 transition-colors" title="Logout">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowAuth(true)} className="flex items-center gap-2 bg-accent hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  <User className="h-4 w-4" /> Login
                </button>
              )}
              <div className="md:hidden">
                <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-md hover:bg-slate-800">
                  {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden pb-4 space-y-1">
              <Link to="/" className="block hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium" onClick={() => setMobileOpen(false)}>Home</Link>
              <Link to="/my-bookings" className="block hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium" onClick={() => setMobileOpen(false)}>My Bookings</Link>
            </div>
          )}
        </div>
      </nav>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
};

export default Navbar;
