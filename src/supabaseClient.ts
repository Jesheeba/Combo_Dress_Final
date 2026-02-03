import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.includes('supabase.co') &&
    !supabaseUrl.includes('YOUR_SUPABASE_PROJECT_URL')
);

const dummyUrl = 'https://placeholder.supabase.co';
const dummyKey = 'placeholder-key';

export const supabase = createClient(
    isSupabaseConfigured ? supabaseUrl : dummyUrl,
    isSupabaseConfigured ? supabaseAnonKey : dummyKey
);
