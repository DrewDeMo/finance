// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { supabase, createSupabaseHandlers } from './supabaseClient';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './Login';
import Dashboard from './Dashboard';
import BillsPage from './pages/BillsPage';
import CalendarPage from './pages/CalendarPage';
import AnalysisPage from './pages/AnalysisPage';
import Navigation from './components/Navigation';

function AppContent() {
  const [user, setUser] = useState(null);
  const { addNotification } = useNotification();
  const { getSession } = createSupabaseHandlers();

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getSession();
      setUser(session?.user ?? null);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user;
        setUser(currentUser ?? null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [getSession]);

  return (
    <Router>
      <div className="App">
        {user ? (
          <>
            <Navigation />
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/bills" element={<BillsPage user={user} />} />
              <Route path="/calendar" element={<CalendarPage user={user} />} />
              <Route path="/analysis" element={<AnalysisPage user={user} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </>
        ) : (
          <Login setUser={setUser} />
        )}
        <ToastContainer position="bottom-right" />
      </div>
    </Router>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;