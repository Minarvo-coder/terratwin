import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import dotenv from 'dotenv'
import { featuresToInsert } from './seed-scientific-features.mjs'

// Load .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'))
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  console.log(`Upserting ${featuresToInsert.length} verified environmental features into Supabase...`)

  // Prepare records
  const records = featuresToInsert.map((f) => ({
    id: f.id,
    location_id: f.location_id,
    source_id: f.source_id,
    feature_name: f.feature_name,
    value: f.value,
    text_value: f.text_value || null,
    unit: f.unit,
    measurement_period: f.measurement_period,
    spatial_resolution: f.spatial_resolution,
    quality_notes: f.quality_notes,
  }))

  const { data, error } = await supabase.from('environmental_features').upsert(records, { onConflict: 'id' })

  if (error) {
    console.error('Upsert failed:', error)
    process.exit(1)
  }

  console.log('Successfully upserted all verified scientific features into Supabase!')

  // Check count
  const countRes = await supabase.from('environmental_features').select('id', { count: 'exact', head: true })
  console.log('Total environmental_features in DB now:', countRes.count)
}

run()
