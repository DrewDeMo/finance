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
        <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="flex items-center">
                    <DemaioloLogo className="icon w-8 h-8 mr-2 fill-current text-white" style={{ display: 'block', width: '2rem', height: '2rem' }} />
                    <span className="text-white font-bold text-xl">FinanceApp</span>
                </Link>
                <div className="flex items-center">
                    <Link to="/" className="text-white mr-4 hover:text-gray-300">Home</Link>
                    <Link to="/bills" className="text-white mr-4 hover:text-gray-300">Bills</Link>
                    <Link to="/calendar" className="text-white mr-4 hover:text-gray-300">Calendar</Link>
                    <Link to="/analysis" className="text-white mr-4 hover:text-gray-300">Analysis</Link>
                    <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;

