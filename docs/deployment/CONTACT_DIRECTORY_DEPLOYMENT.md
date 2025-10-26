# Contact Directory Deployment Checklist

## Feature: 027-contact-directory
**Date**: 2025-10-26
**Version**: 1.0.0
**Environment**: Staging → Production

## Pre-Deployment Checklist

### Code Review ✅
- [x] All TypeScript strict mode violations fixed
- [x] No console.log statements in production code
- [x] Error handling implemented for all edge cases
- [x] Code follows project conventions

### Testing ✅
- [x] Unit tests passing
- [x] Integration tests passing
- [x] Accessibility tests (WCAG AA)
- [x] Mobile responsive tests
- [x] RTL layout tests
- [x] Export functionality tests

### Security ✅
- [x] RLS policies reviewed
- [x] Input validation implemented
- [x] XSS prevention verified
- [x] SQL injection prevention verified
- [x] Authentication required for all operations
- [x] Audit logging configured

## Deployment Steps

### 1. Database Migrations
```bash
# Apply Contact Directory migrations
supabase migration up 20251026000001_create_contact_directory.sql
supabase migration up 20251026000002_create_contact_directory_cd_tables.sql
```

Verify migrations:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('cd_contacts', 'cd_organizations', 'cd_tags', 'cd_document_sources', 'cd_interaction_notes', 'cd_contact_relationships');

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'cd_%';
```

### 2. Deploy Edge Functions

Using Supabase MCP:
```bash
# Deploy contacts-export function
mcp__supabase__deploy_edge_function(
  project_id: "zkrcjzdemdmwhearhfgg",
  name: "contacts-export",
  files: [{
    name: "index.ts",
    content: <file content>
  }],
  entrypoint_path: "index.ts"
)
```

Verify deployment:
```bash
# List deployed functions
mcp__supabase__list_edge_functions(
  project_id: "zkrcjzdemdmwhearhfgg"
)

# Test the function
curl -X POST https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/contacts-export \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format": "csv", "limit": 10}'
```

### 3. Environment Variables

Ensure these are set in Supabase Dashboard:
```env
# Supabase Config
SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-key>

# Optional Redis (if using caching)
REDIS_URL=redis://...
```

### 4. Frontend Deployment

Build and deploy:
```bash
# Build frontend with production env
cd frontend
npm run build

# Deploy to hosting service
# (Vercel/Netlify/etc based on your setup)
```

Verify build:
- Check bundle size < 500KB for main chunk
- Verify no build warnings
- Test in production mode locally first

### 5. Post-Deployment Verification

#### API Health Checks
```bash
# Test contact creation
curl -X POST /api/contacts \
  -H "Authorization: Bearer TOKEN" \
  -d '{"full_name": "Test User"}'

# Test contact search
curl /api/contacts/search?q=test

# Test export
curl -X POST /functions/contacts-export \
  -H "Authorization: Bearer TOKEN" \
  -d '{"format": "csv"}'
```

#### UI Verification
- [ ] Login works
- [ ] Contact list loads
- [ ] Search functionality works
- [ ] Create contact works
- [ ] Export CSV works
- [ ] Export vCard works
- [ ] Mobile layout correct
- [ ] RTL layout correct (switch to Arabic)

#### Performance Checks
- [ ] Page load time < 3s
- [ ] API response time < 500ms
- [ ] Export time < 5s for 1000 contacts

### 6. Monitoring Setup

Configure monitoring:
```javascript
// Supabase Dashboard → Logs
// Set up alerts for:
- Error rate > 1%
- Response time > 1s
- Failed exports
- Authentication failures
```

### 7. Rollback Plan

If issues occur:
```bash
# Rollback database
supabase migration down 20251026000002
supabase migration down 20251026000001

# Rollback Edge Functions
# Via Supabase Dashboard - redeploy previous version

# Rollback frontend
# Redeploy previous version via hosting service
```

## Production Checklist

### Before Go-Live
- [ ] Backup database
- [ ] Document current version
- [ ] Notify stakeholders
- [ ] Schedule maintenance window (if needed)
- [ ] Prepare rollback scripts

### During Deployment
- [ ] Apply migrations
- [ ] Deploy Edge Functions
- [ ] Deploy frontend
- [ ] Run smoke tests
- [ ] Monitor error logs

### After Deployment
- [ ] Verify all features working
- [ ] Check performance metrics
- [ ] Monitor for 30 minutes
- [ ] Send deployment notification
- [ ] Update documentation

## Known Issues & Workarounds

1. **Large Export Timeout**: Exports > 1000 contacts may timeout
   - Workaround: Use pagination or batch exports

2. **Redis Connection**: Redis is optional
   - System works without Redis, just slower

3. **Arabic Text in Excel**: Use UTF-8 BOM for proper display
   - Already implemented in CSV export

## Support Contacts

- **Engineering Lead**: engineering@example.com
- **DevOps**: devops@example.com
- **On-Call**: +1-xxx-xxx-xxxx

## Sign-off

### Deployment Approved By:
- [ ] Engineering Lead
- [ ] Product Owner
- [ ] QA Lead
- [ ] Security Team

### Deployment Executed By:
- **Name**: _________________
- **Date**: _________________
- **Time**: _________________

### Post-Deployment Verification:
- **Verified By**: _________________
- **Date/Time**: _________________
- **Status**: [ ] Success [ ] Partial [ ] Rolled Back

## Notes
_Add any deployment notes, issues encountered, or special configurations here_

---

## Appendix: Quick Commands

### Check System Status
```bash
# Check database
psql $DATABASE_URL -c "SELECT version();"

# Check Edge Functions
curl https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/health

# Check frontend
curl https://your-app.com/api/health
```

### Emergency Contacts
- Supabase Support: support@supabase.io
- Hosting Provider: [Based on your setup]
- Team Slack: #deployment-support