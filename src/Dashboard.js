// File: /finance/src/Dashboard.js
import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = ({ user }) => {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Welcome to Your Financial Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/bills" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Manage Bills
                </Link>
                <Link to="/calendar" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                    View Calendar
                </Link>
                <Link to="/analysis" className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                    Financial Analysis
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
