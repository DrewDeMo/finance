// File: /finance/src/components/Navigation.js
import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Navigation = () => {
    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-white font-bold">FinanceApp</Link>
                <div>
                    <Link to="/" className="text-white mr-4">Home</Link>
                    <Link to="/bills" className="text-white mr-4">Bills</Link>
                    <Link to="/calendar" className="text-white mr-4">Calendar</Link>
                    <Link to="/analysis" className="text-white mr-4">Analysis</Link>
                    <button onClick={handleLogout} className="text-white">Logout</button>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
