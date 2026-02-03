
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ydlsfrgegqcbiazyilbn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkbHNmcmdlZ3FjYmlhenlpbGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTUzODgsImV4cCI6MjA4NTY5MTM4OH0.jrXP4v9ZgSLGJw8DUw4AY2CalCoj07a_HRopV108MyI'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testUpdate() {
    console.log('Attempting update...')

    const { data, error } = await supabase
        .from('designs')
        .upsert({
            id: '1',
            name: 'Garden Leaf Print',
            color: 'White / Green',
            fabric: 'Organza',
            inventory: {
                men: { M: 5, L: 6, XL: 7 }, // TEST VALUES
                boys: {}, girls: {}, women: {}
            },
            createdat: Date.now()
        })
        .select()

    if (error) {
        console.error('Update Failed:', error)
    } else {
        console.log('Update Success:', data)
    }
}

testUpdate()
