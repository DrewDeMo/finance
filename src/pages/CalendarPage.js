// File: /finance/src/pages/CalendarPage.js
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../supabaseClient';

moment.locale('en-GB');
const localizer = momentLocalizer(moment);

const CalendarPage = ({ user }) => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetchBills();
    }, [user]);

    const fetchBills = async () => {
        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .eq('user_id', user.id);

        if (error) console.error('Error fetching bills:', error);
        else {
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
        <div className="container mx-auto p-4 h-screen">
            <h1 className="text-2xl font-bold mb-4">Calendar</h1>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 'calc(100vh - 100px)' }}
                eventPropGetter={eventStyleGetter}
            />
        </div>
    );
};

export default CalendarPage;
