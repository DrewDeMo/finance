// src/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const Dashboard = ({ user }) => {
    const [bills, setBills] = useState([]);
    const [totalDue, setTotalDue] = useState(0);
    const [upcomingBills, setUpcomingBills] = useState([]);
    const [categorySummary, setCategorySummary] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        fetchBills();
        const timer = setInterval(() => {
            setCurrentMonth(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [user, currentMonth]);

    const fetchBills = async () => {
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .eq('user_id', user.id)
            .gte('dueDate', startOfMonth.toISOString())
            .lte('dueDate', endOfMonth.toISOString());

        if (error) {
            console.error('Error fetching bills:', error);
        } else {
            setBills(data);
            calculateTotalDue(data);
            setUpcomingBills(getUpcomingBills(data));
            setCategorySummary(getCategorySummary(data));
        }
    };

    const calculateTotalDue = (bills) => {
        const total = bills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
        setTotalDue(total);
    };

    const getUpcomingBills = (bills) => {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return bills.filter(bill => {
            const dueDate = new Date(bill.dueDate);
            return dueDate >= today && dueDate <= nextWeek;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    };

    const getCategorySummary = (bills) => {
        const summary = bills.reduce((acc, bill) => {
            acc[bill.category] = (acc[bill.category] || 0) + parseFloat(bill.amount);
            return acc;
        }, {});
        return Object.entries(summary).map(([category, amount]) => ({ category, amount }));
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Financial Dashboard</h1>
            <h2 className="text-2xl font-semibold mb-4">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Total Due This Month</h2>
                    <p className="text-3xl font-bold text-blue-600">${totalDue.toFixed(2)}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Upcoming Bills</h2>
                    <ul className="space-y-2">
                        {upcomingBills.map((bill) => (
                            <li key={bill.id} className="flex justify-between">
                                <span>{bill.name}</span>
                                <span className="font-semibold">${bill.amount}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Category Breakdown</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={categorySummary}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="amount" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/bills" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded text-center">
                    Manage Bills
                </Link>
                <Link to="/calendar" className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded text-center">
                    View Calendar
                </Link>
                <Link to="/analysis" className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded text-center">
                    Financial Analysis
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
