import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ncywnemrhsilqvkmavnj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXduZW1yaHNpbHF2a21hdm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE3NTc5OTMsImV4cCI6MjAzNzMzMzk5M30.EomoE0CNaPo-Z8IyF1j405e4LvdTHIMC4lZ7v8OtP-U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}