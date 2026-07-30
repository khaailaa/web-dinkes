import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://exwxceeozjmxqrrkvije.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4d3hjZWVvempteHFycmt2aWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MjU4MzEsImV4cCI6MjEwMDIwMTgzMX0.OGNwJW3piZa0lWPbyNOr4NxcwURNQBVF9vMvGZcqrPM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Perangkat Daerah ID (Dinas Kesehatan Kabupaten Garut)
export const PERANGKAT_DAERAH_ID = '01f23672-5d5c-4b8c-963e-01f551ee46a4';
