import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf8');
const lines = env.split('\n');
const supabaseUrl = lines.find(l => l.startsWith('VITE_SUPABASE_URL'))?.split('=')[1]?.trim();
const supabaseAnonKey = lines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY'))?.split('=')[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectForeignKeys() {
    console.log('--- INSPECTING FOREIGN KEYS ---');

    // Attempting to delete a design and capturing the exact table name in the error
    const { data: designs } = await supabase.from('designs').select('id').limit(1);
    if (!designs?.length) {
        console.log('No designs to test.');
        return;
    }
    const testId = designs[0].id;

    console.log(`Testing deletion for Design ID: ${testId}`);
    const { error } = await supabase.from('designs').delete().eq('id', testId);

    if (error) {
        console.error('DELETE ERROR ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('Delete succeeded (Unexpectedly!)');
    }
}

inspectForeignKeys();
