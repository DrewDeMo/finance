import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { supabase, getSession } from './supabaseClient';
import Login from './Login';
import Dashboard from './Dashboard';
import BillsPage from './pages/BillsPage';
import CalendarPage from './pages/CalendarPage';
import AnalysisPage from './pages/AnalysisPage';
import Navigation from './components/Navigation';

function App() {
  const [user, setUser] = useState(null);

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
  }, []);

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
      </div>
    </Router>
  );
}

export default App;