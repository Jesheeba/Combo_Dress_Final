
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ydlsfrgegqcbiazyilbn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkbHNmcmdlZ3FjYmlhenlpbGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTUzODgsImV4cCI6MjA4NTY5MTM4OH0.jrXP4v9ZgSLGJw8DUw4AY2CalCoj07a_HRopV108MyI'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDB() {
    console.log('Fetching designs...')

    const { data, error } = await supabase
        .from('designs')
        .select('id, name, inventory')

    if (error) {
        console.error('Error:', error)
    } else {
        // Print each design separately to avoid truncation of big object
        data.forEach(d => {
            console.log('DESIGN START ================================')
            console.log('ID:', d.id)
            console.log('Name:', d.name)
            console.log('Inventory:', JSON.stringify(d.inventory, null, 2))
            console.log('DESIGN END ==================================')
        })
    }
}

checkDB()
