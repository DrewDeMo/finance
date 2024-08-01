// File: /finance/src/components/Navigation.js
// File: /finance/src/components/Navigation.js
import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ReactComponent as DemaioloLogo } from '../assets/images/d_logo.svg';

const Navigation = () => {
    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <nav className="bg-gray-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0">
                            <svg width="32" height="32" className="text-white">
                                <use href="#new-d"></use>
                            </svg>
                        </Link>
                        <span className="ml-2 text-white font-bold text-xl">DeMaiolo Finance</span>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <Link to="/" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">Home</Link>
                            <Link to="/bills" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">Bills</Link>
                            <Link to="/calendar" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">Calendar</Link>
                            <Link to="/analysis" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">Analysis</Link>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out">
                            Logout
                        </button>
                    </div>
                    <div className="-mr-2 flex md:hidden">
                        <button type="button" className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white" aria-controls="mobile-menu" aria-expanded="false">
                            <span className="sr-only">Open main menu</span>
                            <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <svg className="hidden h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="md:hidden" id="mobile-menu">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    <Link to="/" className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Home</Link>
                    <Link to="/bills" className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Bills</Link>
                    <Link to="/calendar" className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Calendar</Link>
                    <Link to="/analysis" className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Analysis</Link>
                </div>
                <div className="pt-4 pb-3 border-t border-gray-700">
                    <div className="px-2">
                        <button onClick={handleLogout} className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-white bg-red-500 hover:bg-red-600">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;

