import React from 'react';
import { Train, Menu, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-primary text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Train className="h-8 w-8 text-accent" />
              <span className="font-bold text-xl tracking-tight">RailRover</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className="hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
              <a href="#" className="hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium">My Bookings</a>
              <a href="#" className="hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium">Deals</a>
              <a href="#" className="hover:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium">Support</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-slate-800">
              <User className="h-5 w-5" />
            </button>
            <div className="md:hidden">
              <button className="p-2 rounded-md hover:bg-slate-800">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
