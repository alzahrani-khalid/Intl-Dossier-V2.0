-- Update China dossier with complete geographic data
UPDATE countries
SET 
  iso_code_2 = 'CN',
  iso_code_3 = 'CHN',
  capital_en = 'Beijing',
  capital_ar = 'بكين',
  region = 'Asia',
  subregion = 'Eastern Asia',
  population = 1400000000,
  area_sq_km = 9596961,
  flag_url = 'https://flagcdn.com/cn.svg'
WHERE id = (SELECT id FROM dossiers WHERE name_en = 'China' AND type = 'country' LIMIT 1);
