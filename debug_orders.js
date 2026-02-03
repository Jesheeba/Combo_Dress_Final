import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ydlsfrgegqcbiazyilbn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkbHNmcmdlZ3FjYmlhenlpbGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTUzODgsImV4cCI6MjA4NTY5MTM4OH0.jrXP4v9ZgSLGJw8DUw4AY2CalCoj07a_HRopV108MyI'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrders() {
    console.log('Fetching orders from database...')

    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('createdat', { ascending: false })

    if (error) {
        console.error('Error fetching orders:', error)
    } else {
        console.log(`Found ${data.length} orders:`)
        data.forEach(order => {
            console.log('ORDER START ================================')
            console.log('ID:', order.id)
            console.log('Design ID:', order.designid)
            console.log('Combo Type:', order.combotype)
            console.log('Status:', order.status)
            console.log('Selected Sizes:', JSON.stringify(order.selectedsizes, null, 2))
            console.log('Created At:', new Date(order.createdat).toLocaleString())
            console.log('ORDER END ==================================')
        })
    }
}

checkOrders()
