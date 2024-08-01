// src/pages/BillsPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { supabase, getSession, refreshSession } from '../supabaseClient';
import { useNotification } from '../context/NotificationContext';
import { v4 as uuidv4 } from 'uuid';

const BillsPage = ({ user }) => {
    const [bills, setBills] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [editingBill, setEditingBill] = useState(null);
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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initializePage = async () => {
            setIsLoading(true);
            setError(null);
            try {
                let session = await getSession();
                if (!session) {
                    addNotification('Refreshing session...', 'info');
                    session = await refreshSession();
                    if (!session) {
                        throw new Error('Failed to authenticate user');
                    }
                }
                await fetchBills();
            } catch (err) {
                console.error('Error initializing page:', err);
                setError('Failed to load bills. Please try refreshing the page.');
                addNotification('Error loading bills', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        initializePage();
    }, [user, selectedMonth]);

    const fetchBills = async () => {
        const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

        try {
            const { data, error } = await supabase
                .from('bills')
                .select('*')
                .eq('user_id', user.id)
                .gte('dueDate', startOfMonth.toISOString())
                .lte('dueDate', endOfMonth.toISOString());

            if (error) throw error;

            const updatedBills = await handleRecurringBills(data);
            setBills(updatedBills);
            checkBillsStatus(updatedBills);
        } catch (error) {
            console.error('Error fetching bills:', error);
            addNotification('Error fetching bills', 'error');
            throw error;
        }
    };

    // ... (rest of the component code remains the same)

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Bills Management</h1>

            {/* ... (rest of the JSX remains the same) */}
        </div>
    );
};

export default BillsPage;
