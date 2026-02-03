
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ydlsfrgegqcbiazyilbn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkbHNmcmdlZ3FjYmlhenlpbGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTUzODgsImV4cCI6MjA4NTY5MTM4OH0.jrXP4v9ZgSLGJw8DUw4AY2CalCoj07a_HRopV108MyI'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testUpload() {
    console.log('Attempting upload to "clothes" bucket...')

    // Create a dummy buffer
    const buffer = Buffer.from('test file content')

    const { data, error } = await supabase.storage
        .from('clothes')
        .upload('debug_test.txt', buffer, {
            upsert: true
        })

    if (error) {
        console.error('Upload Failed:', error)
    } else {
        console.log('Upload Success:', data)
    }
}

testUpload()
