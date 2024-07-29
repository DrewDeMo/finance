// src/pages/BillsPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { supabase, getSession, refreshSession } from '../supabaseClient';
import { useNotification } from '../context/NotificationContext';

const BillsPage = ({ user }) => {
    const [bills, setBills] = useState([]);
    const [editingBill, setEditingBill] = useState({
        name: '',
        amount: '',
        dueDate: '',
        paymentUrl: '',
        frequency: 'monthly',
        subcategory: '',
        status: 'unpaid',
        paid_date: null,
        paymentMethod: 'url'
    });
    const [newBill, setNewBill] = useState({
        name: '',
        amount: '',
        dueDate: '',
        paymentUrl: '',
        frequency: 'monthly',
        category: 'Family',
        subcategory: '',
        status: 'unpaid',
        paid_date: null,
        paymentMethod: 'url'
    });
    const [activeCategory, setActiveCategory] = useState('Family');
    const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'ascending' });
    const [filterStatus, setFilterStatus] = useState('all');
    const { addNotification } = useNotification();

    useEffect(() => {
        fetchBills();
    }, [user]);

    const fetchBills = async () => {
        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching bills:', error);
            addNotification('Error fetching bills', 'error');
        } else {
            setBills(data);
            checkUpcomingBills(data);
        }
    };

    const checkUpcomingBills = (bills) => {
        const today = new Date();
        const upcomingBills = bills.filter(bill => {
            const dueDate = new Date(bill.dueDate);
            const timeDiff = dueDate.getTime() - today.getTime();
            const daysDiff = timeDiff / (1000 * 3600 * 24);
            return daysDiff <= 3 && daysDiff > 0 && bill.status === 'unpaid';
        });

        upcomingBills.forEach(bill => {
            addNotification(`${bill.name} is due in ${Math.ceil((new Date(bill.dueDate) - today) / (1000 * 60 * 60 * 24))} days`, 'warning');
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (editingBill) {
            setEditingBill({ ...editingBill, [name]: value });
        } else {
            setNewBill({ ...newBill, [name]: value });
        }

        // Clear paymentUrl if paymentMethod is not 'url'
        if (name === 'paymentMethod' && value !== 'url') {
            if (editingBill) {
                setEditingBill({ ...editingBill, paymentUrl: '' });
            } else {
                setNewBill({ ...newBill, paymentUrl: '' });
            }
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

        try {
            let session = await getSession();
            if (!session) {
                addNotification('User not authenticated', 'error');
                session = await refreshSession();
                if (!session) {
                    addNotification('User not authenticated even after refresh', 'error');
                    return;
                }
            }

            if (editingBill) {
                const { error } = await supabase
                    .from('bills')
                    .update(dataToSubmit)
                    .eq('id', editingBill.id);

                if (error) {
                    console.error('Error updating bill:', error);
                    addNotification('Error updating bill', 'error');
                } else {
                    await fetchBills();
                    setEditingBill(null);
                    addNotification('Bill updated successfully', 'success');
                }
            } else {
                const { error } = await supabase
                    .from('bills')
                    .insert([{ ...dataToSubmit, user_id: user.id }])
                    .single();

                if (error) {
                    console.error('Error adding bill:', error);
                    addNotification('Error adding bill', 'error');
                } else {
                    await fetchBills();
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
                    addNotification('Bill added successfully', 'success');
                }
            }
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            addNotification('Error processing bill', 'error');
        }
    };

    const toggleBillStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
        const { data, error } = await supabase
            .from('bills')
            .update({ status: newStatus, paid_date: newStatus === 'paid' ? new Date().toISOString() : null })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error updating bill status:', error);
            addNotification('Error updating bill status', 'error');
        } else {
            fetchBills();
            addNotification(`Bill marked as ${newStatus}`, 'success');
        }
    };

    const deleteBill = async (id) => {
        const { error } = await supabase
            .from('bills')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting bill:', error);
            addNotification('Error deleting bill', 'error');
        } else {
            fetchBills();
            addNotification('Bill deleted successfully', 'success');
        }
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

    const sortedBills = useMemo(() => {
        let sortableBills = [...bills].filter(bill => bill.category === activeCategory);
        if (filterStatus !== 'all') {
            sortableBills = sortableBills.filter(bill => bill.status === filterStatus);
        }
        sortableBills.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortableBills;
    }, [bills, activeCategory, sortConfig, filterStatus]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const summarizeBills = (bills) => {
        const summary = bills.reduce((acc, bill) => {
            acc.totalAmount += parseFloat(bill.amount);
            acc.paidAmount += bill.status === 'paid' ? parseFloat(bill.amount) : 0;
            acc.unpaidAmount += bill.status === 'unpaid' ? parseFloat(bill.amount) : 0;
            return acc;
        }, { totalAmount: 0, paidAmount: 0, unpaidAmount: 0 });
        summary.totalAmount = summary.totalAmount.toFixed(2);
        summary.paidAmount = summary.paidAmount.toFixed(2);
        summary.unpaidAmount = summary.unpaidAmount.toFixed(2);
        return summary;
    };

    const billSummary = summarizeBills(sortedBills);

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

            <div className="mb-4 p-4 bg-gray-100 rounded">
                <h3 className="font-bold mb-2">Summary</h3>
                <p>Total Amount: ${billSummary.totalAmount}</p>
                <p>Paid Amount: ${billSummary.paidAmount}</p>
                <p>Unpaid Amount: ${billSummary.unpaidAmount}</p>
            </div>

            <div className="mb-4">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 border rounded"
                >
                    <option value="all">All Bills</option>
                    <option value="paid">Paid Bills</option>
                    <option value="unpaid">Unpaid Bills</option>
                </select>
            </div>

            <table className="w-full mb-8">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('name')} className="cursor-pointer">Name</th>
                        <th onClick={() => requestSort('amount')} className="cursor-pointer">Amount</th>
                        <th onClick={() => requestSort('dueDate')} className="cursor-pointer">Due Date</th>
                        <th onClick={() => requestSort('subcategory')} className="cursor-pointer">Subcategory</th>
                        <th onClick={() => requestSort('status')} className="cursor-pointer">Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedBills.map((bill) => (
                        <tr key={bill.id} className="border-b">
                            <td>{bill.name}</td>
                            <td>${bill.amount}</td>
                            <td>{new Date(bill.dueDate).toLocaleDateString()}</td>
                            <td>{bill.subcategory}</td>
                            <td>{bill.status}</td>
                            <td>
                                <button
                                    onClick={() => toggleBillStatus(bill.id, bill.status)}
                                    className={`px-2 py-1 rounded ${bill.status === 'paid' ? 'bg-green-500' : 'bg-red-500'} text-white mr-2`}
                                >
                                    {bill.status === 'paid' ? 'Paid' : 'Unpaid'}
                                </button>
                                <button
                                    onClick={() => startEditing(bill)}
                                    className="px-2 py-1 rounded bg-yellow-500 text-white mr-2"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => deleteBill(bill.id)}
                                    className="px-2 py-1 rounded bg-red-700 text-white"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h3 className="text-lg font-semibold mb-2">{editingBill ? 'Edit Bill' : 'Add New Bill'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <select
                    name="paymentMethod"
                    value={editingBill ? editingBill.paymentMethod : newBill.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                >
                    <option value="url">Payment URL</option>
                    <option value="app">App</option>
                    <option value="mail">Mail</option>
                </select>
                {((editingBill && editingBill.paymentMethod === 'url') || (!editingBill && newBill.paymentMethod === 'url')) && (
                    <input
                        type="url"
                        name="paymentUrl"
                        value={editingBill ? editingBill.paymentUrl : newBill.paymentUrl}
                        onChange={handleInputChange}
                        placeholder="Payment URL"
                        className="w-full p-2 border rounded"
                    />
                )}
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
                <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
                    {editingBill ? 'Update Bill' : 'Add Bill'}
                </button>
                {editingBill && (
                    <button type="button" onClick={cancelEditing} className="w-full p-2 bg-gray-500 text-white rounded">
                        Cancel Editing
                    </button>
                )}
            </form>
        </div>
    );
};

export default BillsPage;
