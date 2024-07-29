// src/pages/BillsPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { supabase, getSession, refreshSession } from '../supabaseClient';
import { useNotification } from '../context/NotificationContext';

const BillsPage = ({ user }) => {
    // ... (keep all the existing state and functions)

    const handleSubmit = async (e) => {
        e.preventDefault();
        const billData = editingBill ? editingBill : newBill;

        const dataToSubmit = {
            ...billData,
            category: activeCategory,
            paid_date: billData.status === 'paid' && billData.paid_date ? billData.paid_date : null,
            isAutomatic: billData.isAutomatic // Ensure isAutomatic is included in the data
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
                const { data, error } = await supabase
                    .from('bills')
                    .update(dataToSubmit)
                    .eq('id', editingBill.id)
                    .select();

                if (error) {
                    console.error('Error updating bill:', error);
                    addNotification('Error updating bill', 'error');
                } else {
                    await fetchBills();
                    setEditingBill(null);
                    addNotification('Bill updated successfully', 'success');
                }
            } else {
                const { data, error } = await supabase
                    .from('bills')
                    .insert([{ ...dataToSubmit, user_id: user.id }])
                    .select();

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
                        paid_date: null,
                        isAutomatic: false
                    });
                    addNotification('Bill added successfully', 'success');
                }
            }
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            addNotification('Error processing bill', 'error');
        }
    };

    // ... (keep all other existing functions)

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Bills</h1>

            <div className="mb-6 flex space-x-2">
                {['All', 'Family', 'Gina', 'Drew'].map(category => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-4 py-2 rounded-full transition-colors duration-200 ${activeCategory === category ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        {category}'s Bills
                    </button>
                ))}
            </div>

            <h2 className="text-2xl font-semibold mb-4 text-gray-700">{activeCategory}'s Bills</h2>

            <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
                <h3 className="font-bold mb-3 text-lg text-gray-800">Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-xl font-semibold text-gray-800">${billSummary.totalAmount}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Paid Amount</p>
                        <p className="text-xl font-semibold text-green-600">${billSummary.paidAmount}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Unpaid Amount</p>
                        <p className="text-xl font-semibold text-red-600">${billSummary.unpaidAmount}</p>
                    </div>
                </div>
            </div>

            <div className="mb-4 flex justify-between items-center">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 border rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Bills</option>
                    <option value="paid">Paid Bills</option>
                    <option value="unpaid">Unpaid Bills</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full mb-8 bg-white rounded-lg shadow-md">
                    <thead className="bg-gray-50">
                        <tr>
                            <th onClick={() => requestSort('name')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Name</th>
                            <th onClick={() => requestSort('amount')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Amount</th>
                            <th onClick={() => requestSort('dueDate')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Due Date</th>
                            <th onClick={() => requestSort('subcategory')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Subcategory</th>
                            <th onClick={() => requestSort('status')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Status</th>
                            <th onClick={() => requestSort('isAutomatic')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Automatic</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedBills.map((bill) => (
                            <tr key={bill.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${bill.amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(bill.dueDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.subcategory}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bill.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {bill.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.isAutomatic ? 'Yes' : 'No'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => toggleBillStatus(bill.id, bill.status)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium mr-2 ${bill.status === 'paid' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white transition-colors duration-200`}
                                    >
                                        {bill.status === 'paid' ? 'Paid' : 'Unpaid'}
                                    </button>
                                    <button
                                        onClick={() => startEditing(bill)}
                                        className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500 hover:bg-yellow-600 text-white mr-2 transition-colors duration-200"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteBill(bill.id)}
                                        className="px-3 py-1 rounded-full text-xs font-medium bg-red-700 hover:bg-red-800 text-white transition-colors duration-200"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">{editingBill ? 'Edit Bill' : 'Add New Bill'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="name"
                            value={editingBill ? editingBill.name : newBill.name}
                            onChange={handleInputChange}
                            placeholder="Bill Name"
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <input
                            type="number"
                            name="amount"
                            value={editingBill ? editingBill.amount : newBill.amount}
                            onChange={handleInputChange}
                            placeholder="Amount"
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <input
                            type="date"
                            name="dueDate"
                            value={editingBill ? editingBill.dueDate : newBill.dueDate}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <select
                            name="paymentMethod"
                            value={editingBill ? editingBill.paymentMethod : newBill.paymentMethod}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="url">Payment URL</option>
                            <option value="app">App</option>
                            <option value="mail">Mail</option>
                        </select>
                    </div>
                    {(editingBill ? editingBill.paymentMethod === 'url' : newBill.paymentMethod === 'url') && (
                        <input
                            type="url"
                            name="paymentUrl"
                            value={editingBill ? editingBill.paymentUrl : newBill.paymentUrl}
                            onChange={handleInputChange}
                            placeholder="Payment URL"
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={editingBill ? editingBill.paymentMethod === 'url' : newBill.paymentMethod === 'url'}
                        />
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                            name="frequency"
                            value={editingBill ? editingBill.frequency : newBill.frequency}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="bi-monthly">Bi-Monthly</option>
                            <option value="one-time">One-Time</option>
                        </select>
                        <select
                            name="subcategory"
                            value={editingBill ? editingBill.subcategory : newBill.subcategory}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="isAutomatic"
                            checked={editingBill ? editingBill.isAutomatic : newBill.isAutomatic}
                            onChange={handleInputChange}
                            className="mr-2 focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <label htmlFor="isAutomatic" className="text-sm text-gray-700">Automatic Payment</label>
                    </div>
                    <div className="flex space-x-4">
                        <button type="submit" className="flex-1 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            {editingBill ? 'Update Bill' : 'Add Bill'}
                        </button>
                        {editingBill && (
                            <button type="button" onClick={cancelEditing} className="flex-1 p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                                Cancel Editing
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BillsPage;