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
            <div className="bg-white rounded-lg shadow-md p-6">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 'calc(100vh - 200px)' }}
                    eventPropGetter={eventStyleGetter}
                    className="rounded-lg overflow-hidden"
                />
            </div>
        </div>
    );
};

export default CalendarPage;
