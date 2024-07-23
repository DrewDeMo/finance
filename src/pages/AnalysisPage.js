// src/pages/AnalysisPage.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AnalysisPage = ({ user }) => {
    const [bills, setBills] = useState([]);
    const [timeFrame, setTimeFrame] = useState('month');

    useEffect(() => {
        fetchBills();
    }, [user]);

    const fetchBills = async () => {
        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .eq('user_id', user.id);

        if (error) console.error('Error fetching bills:', error);
        else setBills(data);
    };

    const filterBillsByTimeFrame = (bills, timeFrame) => {
        const now = new Date();
        const timeFrames = {
            month: new Date(now.getFullYear(), now.getMonth(), 1),
            quarter: new Date(now.getFullYear(), now.getMonth() - 3, 1),
            year: new Date(now.getFullYear() - 1, now.getMonth(), 1)
        };
        return bills.filter(bill => new Date(bill.dueDate) >= timeFrames[timeFrame]);
    };

    const getCategoryData = (bills) => {
        const categoryTotals = bills.reduce((acc, bill) => {
            acc[bill.category] = (acc[bill.category] || 0) + parseFloat(bill.amount);
            return acc;
        }, {});
        return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
    };

    const getSubcategoryData = (bills) => {
        const subcategoryTotals = bills.reduce((acc, bill) => {
            acc[bill.subcategory] = (acc[bill.subcategory] || 0) + parseFloat(bill.amount);
            return acc;
        }, {});
        return Object.entries(subcategoryTotals).map(([name, value]) => ({ name, value }));
    };

    const filteredBills = filterBillsByTimeFrame(bills, timeFrame);
    const categoryData = getCategoryData(filteredBills);
    const subcategoryData = getSubcategoryData(filteredBills);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Financial Analysis</h1>

            <div className="mb-4">
                <label htmlFor="timeFrame" className="mr-2">Time Frame:</label>
                <select
                    id="timeFrame"
                    value={timeFrame}
                    onChange={(e) => setTimeFrame(e.target.value)}
                    className="p-2 border rounded"
                >
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Spending by Category</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                label
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">Spending by Subcategory</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={subcategoryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AnalysisPage;
