import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('_test').select('*').limit(1)
    if (error && error.code !== 'PGRST116') { // PGRST116 = table not found, which is OK
      console.error('❌ Supabase connection failed:', error.message)
      return false
    }
    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    console.error('❌ Supabase connection failed:', error)
    return false
  }
}