import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../supabaseClient';

moment.locale('en-GB');
const localizer = momentLocalizer(moment);

const CalendarPage = ({ user }) => {
    const [events, setEvents] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchBills();
        const timer = setInterval(() => {
            setCurrentDate(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [user, currentDate]);

    const fetchBills = async () => {
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
        } else {
            const calendarEvents = data.map(bill => ({
                title: `${bill.name} - $${bill.amount}`,
                start: new Date(bill.dueDate),
                end: new Date(bill.dueDate),
                allDay: true,
                resource: bill
            }));
            setEvents(calendarEvents);
        }
    };

    const eventStyleGetter = (event, start, end, isSelected) => {
        let style = {
            backgroundColor: event.resource.status === 'paid' ? '#10B981' : '#EF4444',
            borderRadius: '5px',
            opacity: 0.8,
            color: 'white',
            border: '0px',
            display: 'block'
        };
        return { style };
    };

    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Bill Calendar</h1>
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="px-4 py-2 bg-blue-500 text-white rounded">Previous Month</button>
                <h2 className="text-2xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="px-4 py-2 bg-blue-500 text-white rounded">Next Month</button>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 'calc(100vh - 200px)' }}
                    eventPropGetter={eventStyleGetter}
                    className="rounded-lg overflow-hidden"
                    date={currentDate}
                    onNavigate={(date) => setCurrentDate(date)}
                />
            </div>
        </div>
    );
};

export default CalendarPage;
