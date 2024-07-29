import { createClient } from '@supabase/supabase-js'
import { useNotification } from './context/NotificationContext'

const supabaseUrl = 'https://ncywnemrhsilqvkmavnj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXduZW1yaHNpbHF2a21hdm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE3NTc5OTMsImV4cCI6MjAzNzMzMzk5M30.EomoE0CNaPo-Z8IyF1j405e4LvdTHIMC4lZ7v8OtP-U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const createSupabaseHandlers = () => {
  const { addNotification } = useNotification();

  const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      addNotification('Error getting session', 'error');
      return null;
    }
    return data.session;
  };

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error);
      addNotification('Error refreshing session', 'error');
      return null;
    }
    return data.session;
  };

  return { getSession, refreshSession };
};