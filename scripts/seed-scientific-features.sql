INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000c8', 'a0000002-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 'mean_surface_temp_c', -48, NULL, '°C', '2012-08 to 2022-08 (MSL REMS Sols 0-3500)', 'Local ground contact (< 2 m)', '10-year ground temperature sensor (GTS) diurnal mean measured along Curiosity traverse across Aeolis Palus.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000c9', 'a0000002-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 'diurnal_temp_range_c', 85, NULL, '°C', '2012-08 to 2022-08 (MSL REMS)', 'Local ground contact', 'Diurnal GTS amplitude swinging from typical dawn minimum ~ -80 °C to afternoon peak ~ +5 °C.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000ca', 'a0000002-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'mean_slope_deg', 4.5, NULL, '°', '1997-2001 (MGS MOLA / HiRISE DTM)', '14.8 km/pixel baseline with local 1 m HiRISE slope DTM calibration', 'Traverse-averaged topographic slope across Aeolis Palus sediment plains.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000cb', 'a0000002-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 'rock_abundance_pct', 8, NULL, '%', 'In situ rover & orbital TES', 'Local rover area / 3 km orbital TES', 'Percentage of surface covered by cobbles and boulders > 0.1 m along Curiosity traverse.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000cc', 'a0000002-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 'median_grain_size_mm', 0.25, NULL, 'mm', 'MSL MAHLI / APXS eolian dune campaigns', 'Microscopic (sub-millimeter resolution)', 'Median grain size of active basaltic eolian ripples (e.g. Bagnold Dunes) and unconsolidated soil.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000cd', 'a0000002-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'surface_albedo', 0.17, NULL, '', 'MGS TES / Mars Express OMEGA', '3 km/pixel', 'Broadband bolometric solar albedo derived from thermal emission spectrometer baseline.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000ce', 'a0000002-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 'vegetation_cover_pct', 0, NULL, '%', 'Perpetual (Hyper-arid desiccated vacuum environment)', 'Planetary scale', 'Zero biological vegetative cover in accordance with hyper-arid radiation environment.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000cf', 'a0000002-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 'dominant_lithology', NULL, 'clay-sedimentary', '', 'MSL CheMin XRD / SAM campaigns (2012-2025)', 'In situ drill samples', 'Lithology class: clay-sedimentary. Murray formation lacustrine mudstones rich in smectite clays and sulfates.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000d0', 'a0000002-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 'surface_solar_irradiance_wm2', 148, NULL, 'W/m2', 'Multi-year climatological mean (Mars Climate Database v6.1)', 'Grid cell (~100 km)', 'Diurnally averaged solar irradiance reaching equatorial surface at 1.52 AU factoring mean dust opacity (tau ~ 0.5).')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000d1', 'a0000002-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 'annual_precipitation_mm', 0, NULL, 'mm/year', 'Climatological baseline', 'Planetary scale', 'Zero liquid rainfall. Excluded from cross-body similarity calculation due to atmospheric phase constraints.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000d2', 'a0000001-0000-4000-8000-000000000001', '55555555-5555-4555-8555-555555555555', 'mean_surface_temp_c', -55, NULL, '°C', '2021-02 to 2024-10 (Perseverance MEDA)', 'Local ground contact (< 2 m)', 'Diurnal mean surface ground temperature recorded by MEDA Thermal Infrared Sensor (TIRS).')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000d3', 'a0000001-0000-4000-8000-000000000001', '55555555-5555-4555-8555-555555555555', 'diurnal_temp_range_c', 80, NULL, '°C', '2021-02 to 2024-10 (Perseverance MEDA)', 'Local ground contact', 'Diurnal ground thermal swing between nocturnal nadir ~ -83 °C and midday maximum ~ -3 °C.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000d4', 'a0000001-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'mean_slope_deg', 5, NULL, '°', 'MOLA / HiRISE DTM', '1 m/pixel stereo DTM', 'Regional mean terrain slope across Western Delta fan deposits.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000d5', 'a0000001-0000-4000-8000-000000000001', '55555555-5555-4555-8555-555555555555', 'rock_abundance_pct', 14, NULL, '%', 'Navcam / MEDA traverse photometry', 'Rover local field', 'Fractured deltaic boulder lag and blocky crater floor basaltic pavers.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000d6', 'a0000001-0000-4000-8000-000000000001', '55555555-5555-4555-8555-555555555555', 'median_grain_size_mm', 0.35, NULL, 'mm', 'SuperCam / WATSON imaging', 'Microscopic', 'Medium sand fraction across Delta scarp eolian ripples and poorly sorted sandstone matrix.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000d7', 'a0000001-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'surface_albedo', 0.19, NULL, '', 'CRISM / TES baseline', '3 km/pixel', 'Broadband surface albedo over clay-rich crater delta deposit.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000d8', 'a0000001-0000-4000-8000-000000000001', '55555555-5555-4555-8555-555555555555', 'vegetation_cover_pct', 0, NULL, '%', 'Perpetual', 'Planetary scale', 'Zero biological vegetative cover in accordance with hyper-arid radiation environment.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000d9', 'a0000001-0000-4000-8000-000000000001', '55555555-5555-4555-8555-555555555555', 'dominant_lithology', NULL, 'clay-sedimentary', '', 'SuperCam LIBS / PIXL XRF analysis (2021-2025)', 'Millimeter-scale core samples', 'Lithology class: clay-sedimentary. Smectite and iron-magnesium carbonate-bearing deltaic siltstones.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000da', 'a0000001-0000-4000-8000-000000000001', '55555555-5555-4555-8555-555555555555', 'surface_solar_irradiance_wm2', 152, NULL, 'W/m2', 'M2020 MEDA Radiative Budget Sensor (2021-2024)', 'Local sensor point', 'All-sky solar downward irradiance at 18.4° N latitude under background atmospheric dust optical depth.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000db', 'a0000001-0000-4000-8000-000000000001', '55555555-5555-4555-8555-555555555555', 'annual_precipitation_mm', 0, NULL, 'mm/year', 'Climatological baseline', 'Planetary scale', 'Zero liquid rainfall. Excluded from cross-body similarity calculation due to atmospheric phase constraints.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000dc', 'b0000001-0000-4000-8000-000000000001', '66666666-6666-4666-8666-666666666666', 'mean_surface_temp_c', -73, NULL, '°C', '2009-2024 (LRO Diviner DLRE GDR)', '128 pixels/degree (~240 m/pixel)', 'Mean bolometric brightness temperature of quasi-permanently illuminated rim ridge (~200 K).')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000dd', 'b0000001-0000-4000-8000-000000000001', '66666666-6666-4666-8666-666666666666', 'diurnal_temp_range_c', 40, NULL, '°C', 'LRO Diviner Lunar Radiometer Experiment', '240 m/pixel', 'Diurnal amplitude at 89.9° S; grazing polar sun angles attenuate day-night thermal oscillation relative to lunar equator.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000de', 'b0000001-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'mean_slope_deg', 18, NULL, '°', 'LRO LOLA Polar DEM (20 m/pixel)', '20 m/pixel', 'Mean slope across crater rim crest and upper inner/outer flanks (15-25° slope variance).')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000df', 'b0000001-0000-4000-8000-000000000001', '66666666-6666-4666-8666-666666666666', 'rock_abundance_pct', 4, NULL, '%', 'Diviner Rock Abundance & Roughness Product (Bandfield et al.)', '1 km/pixel', 'Fractional area covered by exposed bedrock and boulders > 1 m in mature polar regolith.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000e0', 'b0000001-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'median_grain_size_mm', 0.07, NULL, 'mm', 'Lunar regolith sample return baseline', 'Surface sample benchmark', 'Apollo lunar sample return median grain size benchmark for mature sub-millimeter highland regolith (70 micrometers).')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000e1', 'b0000001-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'surface_albedo', 0.18, NULL, '', 'LROC WAC Global Reflectance Map', '100 m/pixel', 'Normal albedo at 566 nm for South Pole highland anorthositic terrain.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000e2', 'b0000001-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'vegetation_cover_pct', 0, NULL, '%', 'Perpetual', 'Planetary scale', 'Airless hard vacuum environment with zero biological activity.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000e3', 'b0000001-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'dominant_lithology', NULL, 'anorthositic', '', 'LRO Diviner / Lunar Prospector gamma-ray spectrometry', 'Orbital mineralogical mapping', 'Lithology class: anorthositic. Ancient ferroan anorthosite lunar highland crust.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000e4', 'b0000001-0000-4000-8000-000000000001', '66666666-6666-4666-8666-666666666666', 'surface_solar_irradiance_wm2', 110, NULL, 'W/m2', 'LOLA / Diviner illumination models', '20 m/pixel', 'Average surface solar flux factoring low solar elevation angles (1.5° maximum above horizon).')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000e5', 'b0000001-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'annual_precipitation_mm', 0, NULL, 'mm/year', 'Perpetual', 'Planetary scale', 'Zero precipitation in hard vacuum.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000e6', 'b0000002-0000-4000-8000-000000000002', '66666666-6666-4666-8666-666666666666', 'mean_surface_temp_c', -20, NULL, '°C', '2009-2024 (LRO Diviner DLRE GDR)', '240 m/pixel', 'Equatorial diurnal cycle mean temperature (~253 K).')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000e7', 'b0000002-0000-4000-8000-000000000002', '66666666-6666-4666-8666-666666666666', 'diurnal_temp_range_c', 290, NULL, '°C', 'LRO Diviner DLRE GDR', '240 m/pixel', 'Equatorial lunar thermal swing from midday peak ~ 390 K (117 °C) to midnight nadir ~ 100 K (-173 °C).')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000e8', 'b0000002-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'mean_slope_deg', 2.5, NULL, '°', 'LRO LOLA GDR', '60 m/pixel', 'Flat low-relief basaltic volcanic mare plain.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000e9', 'b0000002-0000-4000-8000-000000000002', '66666666-6666-4666-8666-666666666666', 'rock_abundance_pct', 2, NULL, '%', 'Diviner Rock Abundance Product', '1 km/pixel', 'Mature regolith blanketing basaltic floor with sparse impact-excavated boulders.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000ea', 'b0000002-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'median_grain_size_mm', 0.07, NULL, 'mm', 'Apollo 11 sample return laboratory sieve analysis (1969)', 'Centimeter sample', 'Direct physical laboratory measurement of Apollo 11 soil sample 10084 (70 micron median size).')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000eb', 'b0000002-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'surface_albedo', 0.07, NULL, '', 'LROC WAC Photometric Map', '100 m/pixel', 'Dark titanium-rich mare basalt normal albedo at 566 nm.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000ec', 'b0000002-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'vegetation_cover_pct', 0, NULL, '%', 'Perpetual', 'Planetary scale', 'Airless hard vacuum environment with zero biological activity.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000ed', 'b0000002-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'dominant_lithology', NULL, 'basaltic', '', 'Apollo 11 sample return petrology', 'Ground truth rock return', 'Lithology class: basaltic. High-titanium ilmenite-rich vesicular mare basalts.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000ee', 'b0000002-0000-4000-8000-000000000002', '66666666-6666-4666-8666-666666666666', 'surface_solar_irradiance_wm2', 300, NULL, 'W/m2', 'Solar constant geometric diurnal average', 'Equatorial baseline', 'Geometric diurnal average of 1361 W/m² top-of-atmosphere solar flux over 29.5-day synodic month.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000ef', 'b0000002-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'annual_precipitation_mm', 0, NULL, 'mm/year', 'Perpetual', 'Planetary scale', 'Zero precipitation in hard vacuum.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000f0', 'c0000001-0000-4000-8000-000000000001', '77777777-7777-4777-8777-777777777777', 'mean_slope_deg', 3.5, NULL, '°', '2000-2024 (NASA SRTMGL1 v003 / Copernicus 30 m)', '30 m/pixel', 'Mean slope across plateau desert pavement and alluvial fans.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000f1', 'c0000001-0000-4000-8000-000000000001', '77777777-7777-4777-8777-777777777777', 'rock_abundance_pct', 12, NULL, '%', 'Terrestrial analog ground survey (Navarro-González et al.)', 'Field station quadrats', 'Desert pavement surface coverage by gravel and cobble lag deposits.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000f2', 'c0000001-0000-4000-8000-000000000001', '77777777-7777-4777-8777-777777777777', 'median_grain_size_mm', 0.45, NULL, 'mm', 'Soil sieve field measurements', 'Point soil sample', 'Median grain size of eolian sand sheets and hyper-arid regolith.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000f3', 'c0000001-0000-4000-8000-000000000001', '88888888-8888-4888-8888-888888888888', 'surface_albedo', 0.22, NULL, '', '2001-2025 (MODIS MCD43A3 v061)', '500 m/pixel', 'White-sky broadband shortwave surface albedo over bare desert plateau.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000f4', 'c0000001-0000-4000-8000-000000000001', '88888888-8888-4888-8888-888888888888', 'vegetation_cover_pct', 0, NULL, '%', 'MODIS MOD13A2 25-year NDVI Climatology', '1 km/pixel', 'Zero vascular plant vegetation in the hyper-arid core of Yungay plateau.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000f5', 'c0000001-0000-4000-8000-000000000001', '77777777-7777-4777-8777-777777777777', 'dominant_lithology', NULL, 'clay-sedimentary', '', 'Geological field survey', 'Regional', 'Lithology class: clay-sedimentary. Hyper-arid nitrate, perchlorate, sulfate and clay-bearing evaporite soils.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000f6', 'c0000001-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'annual_precipitation_mm', 2.5, NULL, 'mm/year', '25-year Climatology (NASA POWER / Yungay station)', '0.5 x 0.625 deg', 'Hyper-arid precipitation baseline (~2.5 mm/year sporadic rain/fog). Flagged non-comparable across bodies.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000f7', 'c0000002-0000-4000-8000-000000000002', '77777777-7777-4777-8777-777777777777', 'mean_slope_deg', 14, NULL, '°', 'SRTMGL1 v003 (30 m)', '30 m/pixel', 'Mean slope across basaltic cinder cone flanks and summit tephra slopes.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000f8', 'c0000002-0000-4000-8000-000000000002', '77777777-7777-4777-8777-777777777777', 'rock_abundance_pct', 35, NULL, '%', 'USGS Hawaiian Volcano Observatory geological mapping', 'Regional quadrangle', 'Surface covered by vesicular basaltic blocks, spindle bombs, and tephra fragments.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000f9', 'c0000002-0000-4000-8000-000000000002', '77777777-7777-4777-8777-777777777777', 'median_grain_size_mm', 1.2, NULL, 'mm', 'Volcanic ash sieve analysis', 'Field station', 'Coarse basaltic lapilli and palagonitized volcanic cinders.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000fa', 'c0000002-0000-4000-8000-000000000002', '88888888-8888-4888-8888-888888888888', 'surface_albedo', 0.12, NULL, '', 'MODIS MCD43A3 v061', '500 m/pixel', 'Low-reflectance weathered basaltic ash and cinder cone surface.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000fb', 'c0000002-0000-4000-8000-000000000002', '88888888-8888-4888-8888-888888888888', 'vegetation_cover_pct', 1, NULL, '%', 'MODIS MOD13A2 NDVI', '1 km/pixel', 'Sparse alpine silversword and lichens; virtually barren volcanic substrate.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000fc', 'c0000002-0000-4000-8000-000000000002', '77777777-7777-4777-8777-777777777777', 'dominant_lithology', NULL, 'basaltic', '', 'USGS Petrological benchmark', 'Regional', 'Lithology class: basaltic. Alkali and tholeiitic basaltic tephra, hawaiite, and palagonitized dust.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000fd', 'c0000002-0000-4000-8000-000000000002', '33333333-3333-4333-8333-333333333333', 'annual_precipitation_mm', 180, NULL, 'mm/year', 'NASA POWER 25-year Climatology', '0.5 x 0.625 deg', 'Sub-alpine snowfall/rain at high elevation. Flagged non-comparable across bodies.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000fe', 'c0000003-0000-4000-8000-000000000003', '77777777-7777-4777-8777-777777777777', 'mean_slope_deg', 7.5, NULL, '°', 'ArcticDEM 2 m mosaic / SRTM', '2 m/pixel', 'Mean slope across impact crater ring faults, central uplift, and breccia hills.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-0000000000ff', 'c0000003-0000-4000-8000-000000000003', '77777777-7777-4777-8777-777777777777', 'rock_abundance_pct', 22, NULL, '%', 'Haughton-Mars Project (HMP) geological mapping', 'Field station', 'Extensive impact melt breccia shatter-cone blocks and periglacial felsenmeer boulder fields.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-000000000100', 'c0000003-0000-4000-8000-000000000003', '77777777-7777-4777-8777-777777777777', 'median_grain_size_mm', 0.8, NULL, 'mm', 'Sedimentological analysis', 'Field sample', 'Shattered dolomitic breccia matrix and periglacial regolith gravel.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-000000000101', 'c0000003-0000-4000-8000-000000000003', '88888888-8888-4888-8888-888888888888', 'surface_albedo', 0.16, NULL, '', 'MODIS summer cloud-free composite', '500 m/pixel', 'Snow-free summer surface albedo across dolomitic impact formation.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-000000000102', 'c0000003-0000-4000-8000-000000000003', '88888888-8888-4888-8888-888888888888', 'vegetation_cover_pct', 4, NULL, '%', 'MODIS MOD13A2 NDVI', '1 km/pixel', 'Sparse polar semi-desert cryptogamic crust, mosses, and dwarf willows.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-000000000103', 'c0000003-0000-4000-8000-000000000003', '77777777-7777-4777-8777-777777777777', 'dominant_lithology', NULL, 'clay-sedimentary', '', 'Geological Survey of Canada', 'Regional', 'Lithology class: clay-sedimentary. Impact-shattered sedimentary dolomite and limestone breccia.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-000000000104', 'c0000003-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', 'annual_precipitation_mm', 110, NULL, 'mm/year', 'NASA POWER 25-year Climatology', '0.5 x 0.625 deg', 'Polar desert precipitation primarily as winter snow. Flagged non-comparable across bodies.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-000000000105', 'c0000004-0000-4000-8000-000000000004', '77777777-7777-4777-8777-777777777777', 'mean_slope_deg', 9, NULL, '°', 'REMA (Reference Elevation Model of Antarctica, 8 m)', '8 m/pixel', 'Mean slope along ice-free valley floor, alluvial fans, and glacial moraines.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-000000000106', 'c0000004-0000-4000-8000-000000000004', '77777777-7777-4777-8777-777777777777', 'rock_abundance_pct', 28, NULL, '%', 'Antarctic LTER soil and geomorphology survey', 'Field station', 'Extensive ventifact gravel, basaltic boulder pavements, and permafrost contraction-crack polygons.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-000000000107', 'c0000004-0000-4000-8000-000000000004', '77777777-7777-4777-8777-777777777777', 'median_grain_size_mm', 0.6, NULL, 'mm', 'McMurdo LTER soil sieve database', 'Field sample', 'Coarse eolian sand and ventifact granule lag over permafrost table.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-000000000108', 'c0000004-0000-4000-8000-000000000004', '88888888-8888-4888-8888-888888888888', 'surface_albedo', 0.17, NULL, '', 'MODIS MCD43A3 summer Antarctic composite', '500 m/pixel', 'Ice-free dark dolerite and sandstone valley floor albedo.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-000000000109', 'c0000004-0000-4000-8000-000000000004', '88888888-8888-4888-8888-888888888888', 'vegetation_cover_pct', 0, NULL, '%', 'Perpetual', 'Planetary scale', 'Cold hyper-arid biological void devoid of vascular plant cover.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-00000000010a', 'c0000004-0000-4000-8000-000000000004', '77777777-7777-4777-8777-777777777777', 'dominant_lithology', NULL, 'basaltic', '', 'Antarctic Geological Survey', 'Regional', 'Lithology class: basaltic. Jurassic Ferrar dolerite sills and basaltic volcanic drift over sandstone.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;
INSERT INTO environmental_features (id, location_id, source_id, feature_name, value, text_value, unit, measurement_period, spatial_resolution, quality_notes)
VALUES ('f0000000-0000-4000-8000-00000000010b', 'c0000004-0000-4000-8000-000000000004', '33333333-3333-4333-8333-333333333333', 'annual_precipitation_mm', 10, NULL, 'mm/year', 'NASA POWER 25-year Climatology', '0.5 x 0.625 deg', 'Extreme polar arid regime (< 10 mm water equivalent). Flagged non-comparable across bodies.')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  text_value = EXCLUDED.text_value,
  unit = EXCLUDED.unit,
  measurement_period = EXCLUDED.measurement_period,
  spatial_resolution = EXCLUDED.spatial_resolution,
  quality_notes = EXCLUDED.quality_notes;