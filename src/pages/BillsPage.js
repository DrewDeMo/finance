// File: /finance/src/pages/BillsPage.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const BillsPage = ({ user }) => {
    const [bills, setBills] = useState([]);
    const [newBill, setNewBill] = useState({
        name: '',
        amount: '',
        dueDate: '',
        paymentUrl: '',
        frequency: 'monthly',
        category: 'Family',
        status: 'unpaid'
    });

    useEffect(() => {
        fetchBills();
    }, [user]);

    const fetchBills = async () => {
        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .order('dueDate', { ascending: true });

        if (error) console.error('Error fetching bills:', error);
        else setBills(data);
    };

    const handleInputChange = (e) => {
        setNewBill({ ...newBill, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data, error } = await supabase
            .from('bills')
            .insert([{ ...newBill, user_id: user.id }]);

        if (error) console.error('Error adding bill:', error);
        else {
            fetchBills();
            setNewBill({
                name: '',
                amount: '',
                dueDate: '',
                paymentUrl: '',
                frequency: 'monthly',
                category: 'Family',
                status: 'unpaid'
            });
        }
    };

    const toggleBillStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
        const { error } = await supabase
            .from('bills')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) console.error('Error updating bill status:', error);
        else fetchBills();
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Bills</h1>

            <form onSubmit={handleSubmit} className="mb-8 space-y-4">
                <input
                    type="text"
                    name="name"
                    value={newBill.name}
                    onChange={handleInputChange}
                    placeholder="Bill Name"
                    className="w-full p-2 border rounded"
                    required
                />
                <input
                    type="number"
                    name="amount"
                    value={newBill.amount}
                    onChange={handleInputChange}
                    placeholder="Amount"
                    className="w-full p-2 border rounded"
                    required
                />
                <input
                    type="date"
                    name="dueDate"
                    value={newBill.dueDate}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                />
                <input
                    type="url"
                    name="paymentUrl"
                    value={newBill.paymentUrl}
                    onChange={handleInputChange}
                    placeholder="Payment URL"
                    className="w-full p-2 border rounded"
                />
                <select
                    name="frequency"
                    value={newBill.frequency}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                >
                    <option value="monthly">Monthly</option>
                    <option value="bi-monthly">Bi-Monthly</option>
                    <option value="one-time">One-Time</option>
                </select>
                <select
                    name="category"
                    value={newBill.category}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                >
                    <option value="Family">Family</option>
                    <option value="Drew">Drew</option>
                    <option value="Gina">Gina</option>
                    <option value="One-time">One-time Expense</option>
                </select>
                <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
                    Add Bill
                </button>
            </form>

            <div className="space-y-4">
                {bills.map((bill) => (
                    <div key={bill.id} className="border p-4 rounded flex justify-between items-center">
                        <div>
                            <h3 className="font-bold">{bill.name}</h3>
                            <p>Amount: ${bill.amount}</p>
                            <p>Due Date: {new Date(bill.dueDate).toLocaleDateString()}</p>
                            <p>Category: {bill.category}</p>
                            <p>Frequency: {bill.frequency}</p>
                            {bill.paymentUrl && (
                                <a href={bill.paymentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                                    Pay Bill
                                </a>
                            )}
                        </div>
                        <button
                            onClick={() => toggleBillStatus(bill.id, bill.status)}
                            className={`px-4 py-2 rounded ${bill.status === 'paid' ? 'bg-green-500' : 'bg-red-500'
                                } text-white`}
                        >
                            {bill.status === 'paid' ? 'Paid' : 'Unpaid'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BillsPage;
