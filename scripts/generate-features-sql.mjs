import fs from 'fs'

const data = JSON.parse(fs.readFileSync('raw-data/cleaned_standardized_records.json', 'utf8'))

function escapeSql(s) {
  if (s === null || s === undefined) return 'NULL'
  return `'${String(s).replace(/'/g, "''")}'`
}

const values = data.environmentalFeatures
  .map((f) => {
    return `(${escapeSql(f.id)}, ${escapeSql(f.location_id)}, ${escapeSql(f.source_id)}, ${escapeSql(f.feature_name)}, ${f.value}, ${escapeSql(f.unit)}, ${escapeSql(f.measurement_period)}, ${escapeSql(f.spatial_resolution)}, ${escapeSql(f.quality_notes)})`
  })
  .join(',\n')

const sql = `INSERT INTO public.environmental_features (id, location_id, source_id, feature_name, value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES 
${values}
ON CONFLICT (id) DO UPDATE SET
  location_id = EXCLUDED.location_id,
  source_id = EXCLUDED.source_id,
  feature_name = EXCLUDED.feature_name,
  value = EXCLUDED.value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;`

fs.writeFileSync('raw-data/insert_features.sql', sql)
console.log('Features SQL generated, length:', sql.length)
