import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf8');
const lines = env.split('\n');
const supabaseUrl = lines.find(l => l.startsWith('VITE_SUPABASE_URL'))?.split('=')[1]?.trim();
const supabaseAnonKey = lines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY'))?.split('=')[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const { data } = await supabase.from('orders').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('COLUMNS:', Object.keys(data[0]).join(', '));
        console.log('SAMPLE_ORDER:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('NO ORDERS FOUND');
    }
}
check();
