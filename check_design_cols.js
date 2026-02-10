import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf8');
const lines = env.split('\n');
const supabaseUrl = lines.find(l => l.startsWith('VITE_SUPABASE_URL'))?.split('=')[1]?.trim();
const supabaseAnonKey = lines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY'))?.split('=')[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const { data, error } = await supabase.from('designs').select('*').limit(1);
    if (error) {
        console.error('FETCH ERROR:', error);
    } else if (data && data.length > 0) {
        console.log('DESIGN COLUMNS:', Object.keys(data[0]));
    } else {
        console.log('NO DESIGNS FOUND TO CHECK COLUMNS');
    }
}
check();
