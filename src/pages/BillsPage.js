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
        frequency: 'monthly',
        subcategory: '',
        status: 'unpaid',
        paid_date: null,
        isAutomatic: false
    });
    const [newBill, setNewBill] = useState({
        name: '',
        amount: '',
        dueDate: '',
        frequency: 'monthly',
        category: 'Family',
        subcategory: '',
        status: 'unpaid',
        paid_date: null,
        isAutomatic: false
    });
    const [activeCategory, setActiveCategory] = useState('Family');
    const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'ascending' });
    const [filterStatus, setFilterStatus] = useState('all');
    const { addNotification } = useNotification();

    useEffect(() => {
        fetchBills();
    }, [user]);

    const fetchBills = async () => {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .eq('user_id', user.id)
            .gte('dueDate', startOfMonth.toISOString())
            .lte('dueDate', endOfMonth.toISOString());

        if (error) {
            console.error('Error fetching bills:', error);
            addNotification('Error fetching bills', 'error');
        } else {
            const updatedBills = await handleRecurringBills(data);
            setBills(updatedBills);
            checkBillsStatus(updatedBills);
        }
    };

    const handleRecurringBills = async (bills) => {
        const today = new Date();
        const recurringBills = bills.filter(bill => bill.frequency === 'monthly');

        for (const bill of recurringBills) {
            let dueDate = new Date(bill.dueDate);
            while (dueDate < today) {
                dueDate.setMonth(dueDate.getMonth() + 1);
            }
            const newBill = { ...bill, dueDate: dueDate.toISOString() };
            const { data, error } = await supabase.from('bills').insert([newBill]);
            if (error) {
                console.error('Error inserting recurring bill:', error);
                addNotification(`Error inserting recurring bill: ${error.message}`, 'error');
            }
        }

        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .eq('user_id', user.id)
            .gte('dueDate', startOfMonth.toISOString())
            .lte('dueDate', endOfMonth.toISOString());

        if (error) {
            console.error('Error fetching updated bills:', error);
            addNotification(`Error fetching updated bills: ${error.message}`, 'error');
            return bills;
        }

        return data;
    };

    const checkBillsStatus = (bills) => {
        const today = new Date();
        const updatedBills = bills.map(bill => {
            const dueDate = new Date(bill.dueDate);
            if (bill.isAutomatic && today.toDateString() === dueDate.toDateString() && bill.status === 'unpaid') {
                return { ...bill, status: 'paid', paid_date: today.toISOString() };
            }
            return bill;
        });

        // Update any changed bills in the database
        updatedBills.forEach(async (bill) => {
            if (bill.status !== bills.find(b => b.id === bill.id).status) {
                await supabase
                    .from('bills')
                    .update({ status: bill.status, paid_date: bill.paid_date })
                    .eq('id', bill.id);
            }
        });

        setBills(updatedBills);

        const upcomingBills = updatedBills.filter(bill => {
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
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        if (editingBill) {
            setEditingBill({ ...editingBill, [name]: newValue });
        } else {
            setNewBill({ ...newBill, [name]: newValue });
        }

        // Clear paymentUrl if paymentUrl is 'app'
        if (name === 'paymentUrl') {
            if (value === 'app') {
                if (editingBill) {
                    setEditingBill({ ...editingBill, paymentUrl: '' });
                } else {
                    setNewBill({ ...newBill, paymentUrl: '' });
                }
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
                    addNotification(`Error updating bill: ${error.message}`, 'error');
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
                    addNotification(`Error adding bill: ${error.message}`, 'error');
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
                        paid_date: null,
                        isAutomatic: false
                    });
                    addNotification('Bill added successfully', 'success');
                }
            }
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            addNotification(`Error processing bill: ${error.message}`, 'error');
        }
    };

    const toggleAutoPay = async (id, currentAutoPayStatus) => {
        const newAutoPayStatus = !currentAutoPayStatus;
        const { error } = await supabase
            .from('bills')
            .update({ isAutomatic: newAutoPayStatus })
            .eq('id', id);

        if (error) {
            console.error('Error updating auto pay status:', error);
            addNotification('Error updating auto pay status', 'error');
        } else {
            fetchBills();
            addNotification(`Auto pay status updated to ${newAutoPayStatus ? 'enabled' : 'disabled'}`, 'success');
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
            paid_date: null,
            isAutomatic: false
        });
    };

    const sortedBills = useMemo(() => {
        let sortableBills = [...bills];
        if (activeCategory !== 'All') {
            sortableBills = sortableBills.filter(bill => bill.category === activeCategory);
        }
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
        <div className="container mx-auto p-6 bg-gray-100">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Bills Management</h1>

            <div className="mb-6 flex space-x-4">
                {['All', 'Family', 'Gina', 'Drew'].map(category => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-4 py-2 rounded-full transition-colors duration-200 ${activeCategory === category
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        {category}'s Bills
                    </button>
                ))}
            </div>

            <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-100 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                        <p className="text-2xl font-bold text-blue-800">${billSummary.totalAmount}</p>
                    </div>
                    <div className="p-4 bg-green-100 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Paid Amount</p>
                        <p className="text-2xl font-bold text-green-800">${billSummary.paidAmount}</p>
                    </div>
                    <div className="p-4 bg-red-100 rounded-lg">
                        <p className="text-sm text-red-600 font-medium">Unpaid Amount</p>
                        <p className="text-2xl font-bold text-red-800">${billSummary.unpaidAmount}</p>
                    </div>
                </div>
            </div>

            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-700">{activeCategory}'s Bills</h2>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 border rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">All Bills</option>
                    <option value="paid">Paid Bills</option>
                    <option value="unpaid">Unpaid Bills</option>
                </select>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="w-full table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Name', 'Amount', 'Due Date', 'Subcategory', 'Status', 'Automatic', 'Actions'].map((header) => (
                                <th
                                    key={header}
                                    onClick={() => requestSort(header.toLowerCase())}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedBills.map((bill) => (
                            <tr key={bill.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${bill.amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(bill.dueDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.subcategory}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bill.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {bill.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button
                                        onClick={() => toggleAutoPay(bill.id, bill.isAutomatic)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${bill.isAutomatic ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                                    >
                                        {bill.isAutomatic ? 'Disable Auto Pay' : 'Enable Auto Pay'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => toggleBillStatus(bill.id, bill.status)}
                                        className={`mr-2 px-3 py-1 rounded-full text-xs font-medium ${bill.status === 'paid'
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                                            }`}
                                    >
                                        {bill.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                                    </button>
                                    <button
                                        onClick={() => startEditing(bill)}
                                        className="mr-2 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteBill(bill.id)}
                                        className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">{editingBill ? 'Edit Bill' : 'Add New Bill'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="name"
                            value={editingBill ? editingBill.name : newBill.name}
                            onChange={handleInputChange}
                            placeholder="Bill Name"
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            autoComplete="off"
                        />
                        <input
                            type="number"
                            name="amount"
                            value={editingBill ? editingBill.amount : newBill.amount}
                            onChange={handleInputChange}
                            placeholder="Amount"
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                        <input
                            type="date"
                            name="dueDate"
                            value={editingBill ? editingBill.dueDate : newBill.dueDate}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                        <select
                            name="frequency"
                            value={editingBill ? editingBill.frequency : newBill.frequency}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="bi-monthly">Bi-Monthly</option>
                            <option value="one-time">One-Time</option>
                        </select>
                        <select
                            name="subcategory"
                            value={editingBill ? editingBill.subcategory : newBill.subcategory}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    </div>
                    <div className="flex justify-end space-x-4">
                        {editingBill && (
                            <button
                                type="button"
                                onClick={cancelEditing}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                        >
                            {editingBill ? 'Update Bill' : 'Add Bill'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BillsPage;
