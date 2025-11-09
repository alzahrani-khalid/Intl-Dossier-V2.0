# AnythingLLM Workspace Auto-Creation

**Feature**: 029-dynamic-country-intelligence
**Updated**: 2025-10-31

---

## Overview

The intelligence system now **automatically creates AnythingLLM workspaces** for any country dossier when intelligence is requested for the first time. This eliminates the need to manually create workspaces for each country.

---

## How It Works

### 1. Workspace Slug Generation

When intelligence is requested for a country, the system generates a workspace slug:

```typescript
const workspaceSlug = `country-${entityName.toLowerCase().replace(/\s+/g, '-')}`;
```

**Examples**:
- `Saudi Arabia` → `country-saudi-arabia`
- `China` → `country-china`
- `United States` → `country-united-states`
- `United Arab Emirates` → `country-united-arab-emirates`

### 2. Workspace Check & Creation

Before querying AnythingLLM, the system:

1. **Checks if workspace exists**: `GET /api/v1/workspace/{slug}`
2. **If not found (404)**: Creates workspace automatically
3. **If exists**: Proceeds with intelligence query

### 3. Workspace Configuration

Auto-created workspaces use these settings:

```json
{
  "name": "Country Intelligence: {Country Name}",
  "slug": "country-{country-slug}",
  "openAiTemp": 0.7,           // Balanced creativity
  "openAiHistory": 20,         // Remember 20 previous messages
  "similarityThreshold": 0.25, // Vector search threshold
  "topN": 4                    // Return top 4 relevant documents
}
```

---

## User Experience

### Before (Manual Workspaces)
1. Admin creates workspace in AnythingLLM
2. Admin uploads documents for country
3. User requests intelligence → Works only for pre-configured countries

### After (Auto-Creation)
1. User clicks any country dossier
2. System auto-creates workspace on first intelligence request
3. Intelligence query executes (may return empty if no documents uploaded yet)
4. Admin can later upload documents to populate the workspace

---

## Document Upload Workflow

### Step 1: User Views Country Dossier
User navigates to any country (e.g., China) and clicks the Intelligence tab.

### Step 2: First Intelligence Request
- System detects workspace `country-china` doesn't exist
- Auto-creates workspace with default settings
- Queries AnythingLLM (will return generic response if no docs)

### Step 3: Admin Uploads Documents (Optional)
Admin can now upload country-specific intelligence documents to the workspace:

```bash
# Using AnythingLLM UI
1. Navigate to Workspaces → country-china
2. Click "Upload Documents"
3. Add PDFs, Word docs, or text files
4. Wait for embedding process to complete

# Using AnythingLLM API
curl -X POST http://localhost:3001/api/v1/workspace/country-china/upload \
  -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}" \
  -F "file=@china_economic_report_2024.pdf"
```

### Step 4: Subsequent Requests
Future intelligence requests will use uploaded documents for RAG-based responses.

---

## Error Handling

### Workspace Creation Failures

**Scenario**: AnythingLLM service is down or API key is invalid

**Behavior**:
- Edge Function catches error
- Returns error response with status `error`
- User sees: "Intelligence service temporarily unavailable"
- System falls back to cached data if available

**Response**:
```json
{
  "success": false,
  "error": {
    "code": "ANYTHINGLLM_ERROR",
    "message_en": "Failed to create workspace for country",
    "message_ar": "فشل إنشاء مساحة العمل للبلد"
  }
}
```

### Workspace Already Exists

**Scenario**: Workspace was manually created with same slug

**Behavior**:
- System detects existing workspace
- Skips creation step
- Proceeds with intelligence query
- **No error thrown**

---

## Admin Monitoring

### View All Workspaces

```bash
# List all workspaces in AnythingLLM
curl http://localhost:3001/api/v1/workspaces \
  -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}"
```

### Check Workspace Document Count

```bash
# Check if workspace has documents
curl http://localhost:3001/api/v1/workspace/country-china/documents \
  -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}"
```

### Delete Unused Workspaces

```bash
# Delete workspace (if needed)
curl -X DELETE http://localhost:3001/api/v1/workspace/country-china \
  -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}"
```

---

## Benefits

### 1. Zero Manual Configuration
- No need to pre-create workspaces for 200+ countries
- System scales automatically as users explore different dossiers

### 2. Graceful Degradation
- Empty workspaces still work (generic LLM responses)
- Admin can populate documents incrementally

### 3. Consistent Naming
- Predictable workspace slugs (`country-{slug}`)
- Easy to identify and manage in AnythingLLM UI

### 4. Reduced Friction
- Users can view any country immediately
- Intelligence tab always available
- No "workspace not found" errors

---

## Limitations & Considerations

### 1. Initial Empty Responses
**Issue**: First intelligence request may return generic LLM response if no documents exist

**Mitigation**:
- Pre-upload documents for priority countries (Saudi Arabia, USA, China, etc.)
- Add UI indicator: "No intelligence documents uploaded yet"

### 2. Workspace Quota
**Issue**: AnythingLLM may have workspace limits

**Mitigation**:
- Monitor workspace count via API
- Implement cleanup job for unused workspaces (e.g., delete if no queries in 90 days)

### 3. Document Management
**Issue**: No automatic document population

**Mitigation**:
- Build admin dashboard for bulk document uploads
- Create automated scrapers for public intelligence sources (World Bank, IMF, etc.)

---

## Future Enhancements

### 1. Auto-Document Population
```typescript
// After workspace creation, automatically fetch and upload documents
await populateWorkspaceDocuments(workspaceSlug, entityName);

async function populateWorkspaceDocuments(slug: string, country: string) {
  // Fetch from World Bank API
  const worldBankData = await fetchWorldBankData(country);

  // Fetch from IMF API
  const imfData = await fetchIMFData(country);

  // Upload to AnythingLLM
  await uploadToWorkspace(slug, [worldBankData, imfData]);
}
```

### 2. Workspace Warm-Up
```typescript
// Pre-create workspaces for top 50 countries
const TOP_COUNTRIES = ['United States', 'China', 'United Kingdom', ...];

for (const country of TOP_COUNTRIES) {
  await ensureWorkspaceExists(`country-${slugify(country)}`, country);
}
```

### 3. Document Freshness Monitoring
```typescript
// Check if workspace documents are outdated
const lastUpload = await getWorkspaceLastUploadDate(workspaceSlug);
const isStale = Date.now() - lastUpload > 90 * 24 * 60 * 60 * 1000; // 90 days

if (isStale) {
  // Trigger alert for admin to update documents
  await sendDocumentUpdateAlert(workspaceSlug);
}
```

---

## Testing

### Test Workspace Auto-Creation

1. **Find a country without workspace**:
   ```bash
   # List existing workspaces
   curl http://localhost:3001/api/v1/workspaces \
     -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}"
   ```

2. **Request intelligence for new country**:
   - Navigate to any country dossier (e.g., France)
   - Click Intelligence tab
   - Click "Refresh Intelligence" button

3. **Verify workspace created**:
   ```bash
   # Check if workspace exists
   curl http://localhost:3001/api/v1/workspace/country-france \
     -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}"
   ```

4. **Check Edge Function logs**:
   ```bash
   supabase functions logs intelligence-refresh --project-ref zkrcjzdemdmwhearhfgg
   ```

   Expected log output:
   ```
   Creating new workspace: country-france
   Workspace created successfully: country-france
   ```

---

## Rollback Plan

If auto-creation causes issues, you can disable it by commenting out the function call:

```typescript
// File: supabase/functions/intelligence-refresh/index.ts
// Line 316

// Temporarily disable auto-creation
// await ensureWorkspaceExists(workspaceSlug, entityName);
```

Then redeploy:
```bash
supabase functions deploy intelligence-refresh --project-ref zkrcjzdemdmwhearhfgg
```

---

## Related Files

- **Edge Function**: `supabase/functions/intelligence-refresh/index.ts` (lines 407-478)
- **Workspace Check Logic**: Line 417-432
- **Workspace Creation Logic**: Line 435-468
- **Function Call**: Line 316

---

## Changelog

- **2025-10-31**: Initial implementation of workspace auto-creation
- **2025-10-31**: Deployed to production (zkrcjzdemdmwhearhfgg)

---

## Support

**Issue**: Workspace creation failing
**Solution**: Check AnythingLLM service health and API key validity

**Issue**: Generic responses even after document upload
**Solution**: Verify documents are embedded (check workspace in AnythingLLM UI)

**Issue**: Workspace quota exceeded
**Solution**: Implement workspace cleanup job or contact AnythingLLM support

---

**Last Updated**: 2025-10-31
**Feature**: 029-dynamic-country-intelligence
**Status**: Production Ready ✅
