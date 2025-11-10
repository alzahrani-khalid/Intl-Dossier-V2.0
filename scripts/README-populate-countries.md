# Populate Countries Script

## Overview
Automatically fetch and populate geographic data for all countries (250+) from the free REST Countries API.

## Data Populated
- ✅ ISO codes (2 and 3 letter)
- ✅ Capital cities (English + Arabic translations)
- ✅ Region and subregion
- ✅ Population
- ✅ Area in square kilometers
- ✅ Flag URLs

## Options

### Option 1: SQL Script (Recommended - Requires http extension)

```bash
# 1. Enable the http extension in Supabase (if not already enabled)
# In Supabase Dashboard > Database > Extensions, enable "http"

# 2. Run the SQL script in Supabase Dashboard > SQL Editor
# Copy and paste the contents of scripts/populate-countries.sql
```

**Note**: This requires the PostgreSQL `http` extension to be enabled in your Supabase project.

---

### Option 2: TypeScript Script (Requires Service Role Key)

#### Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard
2. Navigate to **Settings** > **API**
3. Copy the **Service Role Key** (not the anon key!)
   - ⚠️ **Warning**: Service role key bypasses RLS - keep it secret!

#### Step 2: Set Environment Variable

**Option A: Temporary (Current Terminal Session)**
```bash
export SUPABASE_SERVICE_KEY="your-service-role-key-here"
npm run countries:populate
```

**Option B: Add to Backend .env (Persistent)**
```bash
# Add to backend/.env
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Then run:
npm run countries:populate
```

#### Step 3: Run the Script
```bash
npm run countries:populate
```

**Expected Output:**
```
🌍 Starting country population script...
📡 Fetching countries from REST Countries API...
✅ Fetched 250 countries

🔄 Processing countries...
➕ Created: China (CN)
➕ Created: United States (US)
➕ Created: India (IN)
...

==================================================
📊 Summary:
==================================================
✅ Created: 250 countries
✏️  Updated: 0 countries
❌ Errors: 0 countries
📝 Total processed: 250 / 250
==================================================
```

---

### Option 3: Manual SQL Insert (For Specific Countries)

If you only want to add a few countries, you can run individual SQL INSERT statements in Supabase Dashboard:

```sql
-- Example: Add Japan
WITH new_dossier AS (
  INSERT INTO dossiers (type, name_en, name_ar, description_en, status, sensitivity_level)
  VALUES ('country', 'Japan', 'اليابان', 'Japan - Asia', 'active', 1)
  RETURNING id
)
INSERT INTO countries (id, iso_code_2, iso_code_3, capital_en, capital_ar, region, population, area_sq_km, flag_url)
SELECT 
  id,
  'JP',
  'JPN',
  'Tokyo',
  'طوكيو',
  'Asia',
  125000000,
  377975,
  'https://flagcdn.com/jp.svg'
FROM new_dossier;
```

---

## Troubleshooting

### Error: "Row-Level Security policy violation"
- **Cause**: Using anon key instead of service role key
- **Fix**: Set `SUPABASE_SERVICE_KEY` environment variable (see Option 2)

### Error: "Failed to fetch countries: Bad Request"
- **Cause**: REST Countries API requires fields parameter
- **Fix**: Script already includes fields parameter, ensure you're using latest version

### Error: "Missing SUPABASE_URL"
- **Cause**: Environment variables not loaded
- **Fix**: Ensure frontend/.env exists with VITE_SUPABASE_URL

### Script runs but creates 0 countries
- **Check**: Verify Supabase connection by checking logs
- **Check**: Ensure dossiers table exists and is accessible
- **Check**: Verify no unique constraint violations (e.g., duplicate country names)

---

## API Source
Data source: [REST Countries API](https://restcountries.com/)
- Free, no API key required
- Reliable, well-maintained
- Used by 1000s of projects
- Updates regularly with latest UN data

---

## After Running

Once populated, the Intelligence Dashboard will automatically display:
- ISO Code
- Region
- Capital
- Population (formatted with commas)
- Area (km²)

No need to manually enter this data for each country! 🎉

