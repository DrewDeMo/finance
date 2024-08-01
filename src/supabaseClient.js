import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ncywnemrhsilqvkmavnj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXduZW1yaHNpbHF2a21hdm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE3NTc5OTMsImV4cCI6MjAzNzMzMzk5M30.EomoE0CNaPo-Z8IyF1j405e4LvdTHIMC4lZ7v8OtP-U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

let isRefreshing = false;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error('Unexpected error in getSession:', error);
    return null;
  }
};

export const refreshSession = async (retryCount = 0) => {
  try {
    if (isRefreshing) {
      await wait(RETRY_DELAY);
      return refreshSession(retryCount + 1);
    }

    if (retryCount >= MAX_RETRIES) {
      console.error('Max retries reached for session refresh');
      return null;
    }
  } catch (error) {
    console.error('Unexpected error in refreshSession:', error);
    return null;
  }

  try {
    isRefreshing = true;
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error('Unexpected error during session refresh:', error);
    return null;
  } finally {
    isRefreshing = false;
  }
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Error signing in:', error);
    return { user: null, error };
  }
  return { user: data.user, error: null };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    return { error };
  }
  return { error: null };
};

// Other Supabase-related functions can be added here as needed
