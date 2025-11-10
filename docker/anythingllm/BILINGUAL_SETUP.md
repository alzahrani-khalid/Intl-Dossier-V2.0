# AnythingLLM Bilingual Intelligence Configuration

**Feature:** 029-dynamic-country-intelligence
**Issue:** Intelligence showing "محتوى عربي قيد الترجمة" instead of actual Arabic content
**Root Cause:** AnythingLLM not returning properly formatted bilingual responses

## ⚠️ CRITICAL: Current Status

✅ **Completed:**
- AnythingLLM container is running (port 3002)
- Workspace created: "Country Intelligence (Shared)" (slug: `country-intelligence-shared`)
- Edge Function updated to use correct workspace slug
- Test script configured and working

❌ **REQUIRED USER ACTIONS:**
1. **Add OpenAI API key** to `.env` file (currently placeholder)
2. **Configure workspace system prompt** in AnythingLLM UI (currently null)

**Without these two steps, intelligence generation will fail or return placeholders!**

---

## Quick Fix Checklist

- [ ] Configure OpenAI API key in `.env`
- [ ] Update Supabase secrets with correct URL and API key
- [ ] Configure workspace system prompt for bilingual output
- [ ] Test bilingual response generation
- [ ] Refresh intelligence data in application

---

## Step 1: Configure OpenAI API Key

### 1.1 Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy the key (starts with `sk-`)

### 1.2 Update AnythingLLM Environment
```bash
cd docker/anythingllm

# Edit .env file
nano .env

# Replace this line:
OPENAI_API_KEY=your-openai-api-key-here

# With your actual key:
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Save and exit (Ctrl+X, Y, Enter)
```

### 1.3 Restart Container
```bash
docker-compose restart

# Wait 10 seconds, then verify
docker-compose logs anythingllm | grep "OpenAI"
```

---

## Step 2: Configure Workspace System Prompt

### 2.1 Access AnythingLLM UI
```bash
open http://localhost:3002
# or visit http://localhost:3002 in your browser
```

### 2.2 Navigate to Workspace
1. Click on "Workspaces" in sidebar
2. Find or create workspace: **"country-intelligence"**
3. Click on the workspace to enter

### 2.3 Set System Prompt
1. Click **"Settings"** (⚙️ icon in top right)
2. Scroll to **"Chat Settings"** section
3. Find **"System Prompt"** field
4. Paste this prompt:

```
You are an intelligence analyst providing bilingual reports in English and Arabic for government decision-makers.

**CRITICAL FORMATTING REQUIREMENT:**

You MUST structure ALL responses using this exact format:

[ENGLISH]
{Provide your complete, detailed analysis in English here. Be professional, data-driven, and cite sources when possible.}

[ARABIC]
{قدم نفس التحليل الكامل والمفصل باللغة العربية هنا. كن محترفاً ومعتمداً على البيانات واستشهد بالمصادر عندما يكون ذلك ممكناً.}

**FORMAT RULES:**
- Use EXACTLY these markers: [ENGLISH] and [ARABIC]
- Do NOT use colons after markers (correct: [ENGLISH] not [ENGLISH]:)
- Both sections must be complete and equivalent
- Never omit either section
- Never use alternative formats or markers

**FAILURE TO FOLLOW THIS FORMAT WILL RESULT IN REJECTED RESPONSES.**

When analyzing countries, provide:
- Economic indicators (GDP, inflation, trade, investment)
- Political developments (leadership, policies, reforms)
- Security assessments (stability, threats, advisories)
- Bilateral opportunities (agreements, cooperation areas)
```

5. Click **"Update"** or **"Save"** button

### 2.4 Verify Configuration
```bash
# Run test script
cd docker/anythingllm
./test-bilingual.sh
```

Expected output:
```
✅ Found [ENGLISH] marker
✅ Found [ARABIC] marker
```

---

## Step 3: Update Supabase Secrets

### 3.1 Update AnythingLLM URL
```bash
# Use host.docker.internal for Docker-to-Docker communication
# Use port 3002 (the host port, not container port)
supabase secrets set \
  ANYTHINGLLM_URL="http://host.docker.internal:3002" \
  --project-ref zkrcjzdemdmwhearhfgg
```

### 3.2 Update API Key
```bash
# Use the API key from docker/anythingllm/.env
supabase secrets set \
  ANYTHINGLLM_API_KEY="T70PG8S-WRD4EXH-KEVN4ZB-WM1SEG2" \
  --project-ref zkrcjzdemdmwhearhfgg
```

### 3.3 Verify Secrets
```bash
supabase secrets list --project-ref zkrcjzdemdmwhearhfgg | grep ANYTHINGLLM
```

---

## Step 4: Test Intelligence Generation

### 4.1 Run Local Test
```bash
cd docker/anythingllm
./test-bilingual.sh
```

Review the output in `anythingllm-test-response.json`

### 4.2 Test via Application
1. Open application: http://localhost:3001 (or your dev port)
2. Navigate to a country dossier (e.g., Saudi Arabia)
3. Click **"Intelligence"** tab
4. Click the **refresh button** (↻) on any intelligence card
5. Wait 30-60 seconds
6. Refresh the page
7. Check if Arabic content appears properly

### 4.3 Verify Database
```bash
# Check if Arabic content was generated
curl -s "https://zkrcjzdemdmwhearhfgg.supabase.co/rest/v1/intelligence_reports?select=intelligence_type,content_ar&limit=1&order=updated_at.desc" \
  -H "apikey: YOUR_ANON_KEY" | jq -r '.[0].content_ar' | head -20
```

---

## Troubleshooting

### Issue: "OpenAI API key invalid"
**Solution:**
1. Verify key is correct (starts with `sk-proj-` or `sk-`)
2. Check OpenAI account has credits: https://platform.openai.com/usage
3. Ensure key has access to GPT-4 or GPT-3.5-turbo

### Issue: "Workspace not found"
**Solution:**
```bash
# Create workspace via API
curl -X POST http://localhost:3002/api/v1/workspace/new \
  -H "Authorization: Bearer T70PG8S-WRD4EXH-KEVN4ZB-WM1SEG2" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Country Intelligence (Shared)",
    "slug": "country-intelligence",
    "openAiTemp": 0.7,
    "openAiHistory": 20,
    "topN": 4
  }'
```

### Issue: "[ENGLISH] and [ARABIC] markers still missing"
**Possible causes:**
1. System prompt not saved - Re-enter and save again
2. Using wrong workspace - Verify workspace slug is "country-intelligence"
3. LLM ignoring instructions - Try GPT-4 instead of GPT-3.5
4. Token limit exceeded - Increase max tokens in workspace settings

**Solutions:**
- Re-enter system prompt and click Save
- Check workspace slug in Edge Function (line 313 of intelligence-refresh/index.ts)
- In AnythingLLM UI: Settings → LLM → Select GPT-4
- In workspace settings: Increase "Max Tokens" to 4096

### Issue: "محتوى عربي قيد الترجمة" still appears
**Solution:**
The old data is cached in database. You must:
1. **Refresh the intelligence** using the refresh button in UI
2. Wait for new generation to complete
3. Refresh the page
4. If still showing, check `supabase/functions/intelligence-refresh/index.ts` logs

### Issue: Edge Function timeout
**Solution:**
1. Check AnythingLLM logs: `docker-compose logs anythingllm`
2. Verify OpenAI is responding: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`
3. Increase timeout in Edge Function (currently 30s at line 394)

---

## Verification Checklist

After configuration, verify:

- [ ] AnythingLLM container is running: `docker ps | grep anythingllm`
- [ ] Health check passes: `curl http://localhost:3002/api/ping`
- [ ] OpenAI key configured: `docker-compose logs anythingllm | grep -i openai`
- [ ] Workspace exists: `curl -H "Authorization: Bearer YOUR_KEY" http://localhost:3002/api/v1/workspace/country-intelligence`
- [ ] System prompt saved: Check in AnythingLLM UI
- [ ] Test script passes: `./test-bilingual.sh` shows both markers
- [ ] Supabase secrets updated: `supabase secrets list`
- [ ] Intelligence refreshes successfully in app
- [ ] Arabic content displays properly (not placeholder)

---

## Next Steps

Once configuration is complete:

1. **Bulk refresh** all existing intelligence:
   - Go to each country dossier
   - Click refresh on all intelligence types
   - Or use the `intelligence-batch-update` Edge Function

2. **Monitor quality**:
   - Check if Arabic translations are accurate
   - Verify both languages have equivalent content
   - Report any format violations

3. **Optimize performance**:
   - Monitor API costs on OpenAI dashboard
   - Adjust cache TTLs if needed
   - Consider using GPT-3.5-turbo for cost savings

4. **Add documents** (optional):
   - Upload country reports, policy briefs to AnythingLLM
   - Enable RAG for more accurate intelligence
   - See `README.md` for document upload instructions

---

## References

- [AnythingLLM Documentation](https://docs.anythingllm.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Feature Specification](../../specs/029-dynamic-country-intelligence/spec.md)
- [Edge Function Code](../../supabase/functions/intelligence-refresh/index.ts)
