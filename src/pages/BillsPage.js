// src/pages/BillsPage.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const BillsPage = ({ user }) => {
    const [bills, setBills] = useState([]);
    const [editingBill, setEditingBill] = useState(null);
    const [newBill, setNewBill] = useState({
        name: '',
        amount: '',
        dueDate: '',
        paymentUrl: '',
        frequency: 'monthly',
        category: 'Family',
        subcategory: '',
        status: 'unpaid',
        paid_date: null
    });
    const [activeCategory, setActiveCategory] = useState('Family');

    useEffect(() => {
        fetchBills();
    }, [user]);

    const fetchBills = async () => {
        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .eq('user_id', user.id)
            .order('dueDate', { ascending: true });

        if (error) console.error('Error fetching bills:', error);
        else setBills(data);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (editingBill) {
            setEditingBill({ ...editingBill, [name]: value });
        } else {
            setNewBill({ ...newBill, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const billData = editingBill ? editingBill : newBill;

        const dataToSubmit = {
            ...billData,
            category: activeCategory,
            paid_date: billData.status === 'paid' && billData.paid_date ? billData.paid_date : null
        };

        if (editingBill) {
            const { error } = await supabase
                .from('bills')
                .update(dataToSubmit)
                .eq('id', editingBill.id);

            if (error) console.error('Error updating bill:', error);
            else {
                fetchBills();
                setEditingBill(null);
            }
        } else {
            const { error } = await supabase
                .from('bills')
                .insert([{ ...dataToSubmit, user_id: user.id }]);

            if (error) console.error('Error adding bill:', error);
            else {
                fetchBills();
                setNewBill({
                    name: '',
                    amount: '',
                    dueDate: '',
                    paymentUrl: '',
                    frequency: 'monthly',
                    subcategory: '',
                    status: 'unpaid',
                    paid_date: null
                });
            }
        }
    };

    const toggleBillStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
        const { data, error } = await supabase
            .from('bills')
            .update({ status: newStatus })
            .eq('id', id)
            .select();

        if (error) console.error('Error updating bill status:', error);
        else {
            fetchBills();
            if (newStatus === 'paid') {
                alert(`Bill marked as paid on ${new Date(data[0].paid_date).toLocaleDateString()}`);
            }
        }
    };

    const deleteBill = async (id) => {
        const { error } = await supabase
            .from('bills')
            .delete()
            .eq('id', id);

        if (error) console.error('Error deleting bill:', error);
        else fetchBills();
    };

    const startEditing = (bill) => {
        setEditingBill(bill);
        setNewBill(bill);
        setActiveCategory(bill.category);
    };

    const cancelEditing = () => {
        setEditingBill(null);
        setNewBill({
            name: '',
            amount: '',
            dueDate: '',
            paymentUrl: '',
            frequency: 'monthly',
            subcategory: '',
            status: 'unpaid',
            paid_date: null
        });
    };

    const renderBillForm = () => (
        <form onSubmit={handleSubmit} className="mb-8 space-y-4">
            <input
                type="text"
                name="name"
                value={editingBill ? editingBill.name : newBill.name}
                onChange={handleInputChange}
                placeholder="Bill Name"
                className="w-full p-2 border rounded"
                required
            />
            <input
                type="number"
                name="amount"
                value={editingBill ? editingBill.amount : newBill.amount}
                onChange={handleInputChange}
                placeholder="Amount"
                className="w-full p-2 border rounded"
                required
            />
            <input
                type="date"
                name="dueDate"
                value={editingBill ? editingBill.dueDate : newBill.dueDate}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
            />
            <input
                type="url"
                name="paymentUrl"
                value={editingBill ? editingBill.paymentUrl : newBill.paymentUrl}
                onChange={handleInputChange}
                placeholder="Payment URL"
                className="w-full p-2 border rounded"
            />
            <select
                name="frequency"
                value={editingBill ? editingBill.frequency : newBill.frequency}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
            >
                <option value="monthly">Monthly</option>
                <option value="bi-monthly">Bi-Monthly</option>
                <option value="one-time">One-Time</option>
            </select>
            <select
                name="subcategory"
                value={editingBill ? editingBill.subcategory : newBill.subcategory}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
            >
                <option value="">Select Subcategory</option>
                <option value="Heating">Heating</option>
                <option value="Food">Food</option>
                <option value="Electricity">Electricity</option>
                <option value="Internet">Internet</option>
                <option value="Phone">Phone</option>
                <option value="Insurance">Insurance</option>
                <option value="Other">Other</option>
            </select>
            <select
                name="status"
                value={editingBill ? editingBill.status : newBill.status}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
            >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
            </select>
            {(editingBill?.status === 'paid' || newBill.status === 'paid') && (
                <input
                    type="date"
                    name="paid_date"
                    value={editingBill ? editingBill.paid_date : newBill.paid_date}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                />
            )}
            <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
                {editingBill ? 'Update Bill' : 'Add Bill'}
            </button>
            {editingBill && (
                <button type="button" onClick={cancelEditing} className="w-full p-2 bg-gray-500 text-white rounded">
                    Cancel Editing
                </button>
            )}
        </form>
    );

    const renderBillsList = (category) => (
        <div className="space-y-4">
            {bills.filter(bill => bill.category === category).map((bill) => (
                <div key={bill.id} className="border p-4 rounded flex justify-between items-center">
                    <div>
                        <h3 className="font-bold">{bill.name}</h3>
                        <p>Amount: ${bill.amount}</p>
                        <p>Due Date: {new Date(bill.dueDate).toLocaleDateString()}</p>
                        <p>Subcategory: {bill.subcategory}</p>
                        <p>Frequency: {bill.frequency}</p>
                        {bill.paymentUrl && (
                            <a href={bill.paymentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                                Pay Bill
                            </a>
                        )}
                        {bill.status === 'paid' && bill.paid_date && (
                            <p>Paid on: {new Date(bill.paid_date).toLocaleDateString()}</p>
                        )}
                    </div>
                    <div className="space-x-2">
                        <button
                            onClick={() => toggleBillStatus(bill.id, bill.status)}
                            className={`px-4 py-2 rounded ${bill.status === 'paid' ? 'bg-green-500' : 'bg-red-500'} text-white`}
                        >
                            {bill.status === 'paid' ? 'Paid' : 'Unpaid'}
                        </button>
                        <button
                            onClick={() => startEditing(bill)}
                            className="px-4 py-2 rounded bg-yellow-500 text-white"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => deleteBill(bill.id)}
                            className="px-4 py-2 rounded bg-red-700 text-white"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Bills</h1>

            <div className="mb-4 flex space-x-4">
                {['Family', 'Gina', 'Drew'].map(category => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-4 py-2 rounded ${activeCategory === category ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                        {category}'s Bills
                    </button>
                ))}
            </div>

            <h2 className="text-xl font-semibold mb-4">{activeCategory}'s Bills</h2>
            {renderBillForm()}
            {renderBillsList(activeCategory)}
        </div>
    );
};

export default BillsPage;
