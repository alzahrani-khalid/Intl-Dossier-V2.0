# Deployment Guide: Feature 014 - Full Assignment Detail
**Date**: 2025-10-04
**Status**: Ready for Deployment

## 📦 Pre-Deployment Checklist

- ✅ Database migrations deployed (12/12)
- ✅ Edge Functions deployed (21/21)
- ✅ Frontend build successful
- ✅ Preview server tested and working
- ⏳ Production hosting deployment
- ⏳ QA testing execution
- ⏳ Performance monitoring

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

**Why Vercel**: Best for Next.js and React apps, automatic deployments, edge network.

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod

# Follow prompts:
# - Link to existing project or create new
# - Set build command: npm run build
# - Set output directory: dist
# - Set root directory: ./
```

**Environment Variables** (Set in Vercel Dashboard):
```env
VITE_SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_APP_URL=<your-vercel-url>
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy from frontend directory
cd frontend
netlify deploy --prod

# Settings:
# - Build command: npm run build
# - Publish directory: dist
```

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Manual Deployment (Any Static Host)

1. **Build the frontend**:
```bash
cd frontend
npm run build
```

2. **Upload `dist/` folder** to any static hosting:
   - AWS S3 + CloudFront
   - Google Cloud Storage
   - Azure Static Web Apps
   - GitHub Pages
   - Traditional web hosting (cPanel, etc.)

3. **Configure redirects** for SPA routing (all routes → index.html)

4. **Set environment variables** via `.env.production` or hosting provider

## 🔧 Post-Deployment Configuration

### 1. Update Supabase Auth Settings

Navigate to: https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/auth/url-configuration

Add your deployment URL:
```
Site URL: https://your-app.vercel.app
Redirect URLs:
  - https://your-app.vercel.app/**
  - http://localhost:5173/**  (keep for dev)
```

### 2. Configure CORS (if needed)

If using Edge Functions from frontend:
```sql
-- Run in Supabase SQL Editor
UPDATE auth.config
SET cors_allowed_origins = array_append(
  cors_allowed_origins,
  'https://your-app.vercel.app'
);
```

### 3. Test Authentication Flow

```bash
# Open deployed app
open https://your-app.vercel.app

# Test login flow
# - Navigate to /login
# - Enter credentials
# - Verify redirect to dashboard
# - Check token in localStorage
```

## 🧪 QA Testing Checklist

### Critical Path Testing (30 minutes)

#### 1. Assignment Detail Page Load (FR-001 to FR-005)
- [ ] Navigate to `/assignments/{valid-id}`
- [ ] Verify assignment metadata displays
- [ ] Verify SLA countdown is running
- [ ] Verify work item preview loads
- [ ] Verify timeline shows creation event

#### 2. Comments System (FR-011 to FR-012)
- [ ] Add a comment with text
- [ ] Add a comment with @mention
- [ ] Verify comment appears in real-time
- [ ] Verify mentioned user gets notification (check Supabase)
- [ ] Add emoji reaction to comment
- [ ] Verify reaction count updates

#### 3. Checklist Management (FR-013 to FR-013d)
- [ ] Click "Import Template" button
- [ ] Select a template from modal
- [ ] Verify checklist items appear
- [ ] Toggle a checklist item
- [ ] Verify progress percentage updates
- [ ] Add custom checklist item
- [ ] Verify new item appears in list

#### 4. Assignment Actions (FR-006 to FR-007)
- [ ] Click "Escalate" button
- [ ] Fill escalation form
- [ ] Verify escalation event in timeline
- [ ] Click "Mark Complete" button
- [ ] Verify status updates to "completed"
- [ ] Verify completion event in timeline

#### 5. Real-time Updates (FR-019 to FR-021c)
- [ ] Open same assignment in two browser windows
- [ ] Add comment in window 1
- [ ] Verify comment appears in window 2 < 1s
- [ ] Toggle checklist in window 1
- [ ] Verify update appears in window 2 < 1s
- [ ] Check browser console for WebSocket connection

#### 6. Engagement Context (FR-029 to FR-032)
- [ ] Open assignment linked to engagement
- [ ] Verify engagement banner displays
- [ ] Click "View Full Engagement"
- [ ] Verify navigation to engagement detail
- [ ] Verify "Related Tasks" section shows siblings
- [ ] Click on related task
- [ ] Verify navigation works

#### 7. Kanban Board (FR-033 to FR-036)
- [ ] Navigate to engagement kanban view
- [ ] Verify workflow columns render
- [ ] Drag assignment card between columns
- [ ] Verify assignment.workflow_stage updates
- [ ] Open in second window
- [ ] Verify real-time column update

#### 8. Bilingual Support
- [ ] Toggle language to Arabic
- [ ] Verify all UI text translates
- [ ] Verify RTL layout applies
- [ ] Verify dates format correctly
- [ ] Toggle back to English
- [ ] Verify LTR layout applies

#### 9. Accessibility (WCAG 2.1 AA)
- [ ] Navigate using Tab key only
- [ ] Verify focus indicators are visible
- [ ] Use screen reader (VoiceOver/NVDA)
- [ ] Verify ARIA labels are announced
- [ ] Check color contrast (Chrome DevTools)
- [ ] Verify 4.5:1 ratio for text

### Performance Testing (15 minutes)

#### Browser DevTools (Network Tab)
```javascript
// In browser console
performance.mark('start-load');
// Navigate to assignment detail page
performance.mark('end-load');
performance.measure('page-load', 'start-load', 'end-load');
console.log(performance.getEntriesByType('measure'));
```

**Target Metrics**:
- Assignment detail load: < 100ms (p95)
- Comment creation: < 50ms (p95)
- Checklist toggle: < 50ms (p95)
- Real-time latency: < 1s
- Bundle size: 1.87 MB (already optimized)

#### Lighthouse Audit
```bash
# Run Lighthouse
npx lighthouse https://your-app.vercel.app/assignments/{id} --view

# Target Scores:
# - Performance: > 80
# - Accessibility: > 95
# - Best Practices: > 90
# - SEO: > 80
```

### Load Testing (Optional)
```bash
# Install k6
brew install k6  # macOS
# or download from https://k6.io

# Create test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function() {
  const res = http.get('https://your-app.vercel.app/assignments/test-id');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
EOF

# Run test
k6 run load-test.js
```

## 🔍 Monitoring Setup

### 1. Supabase Dashboard Monitoring

**Real-time Subscriptions**:
- Navigate to: https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/realtime
- Monitor active connections
- Check for connection errors
- Verify message throughput

**Database Performance**:
- Navigate to: https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/reports
- Monitor query performance
- Check slow queries
- Verify RLS policy execution time

**Edge Function Logs**:
- Navigate to: https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions
- Click on each function
- View logs and errors
- Check invocation counts

### 2. Frontend Error Tracking

Add error tracking (optional):
```bash
# Install Sentry (example)
npm install @sentry/react @sentry/vite-plugin

# Configure in src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 3. Custom Analytics (Optional)

Track feature usage:
```typescript
// In src/lib/analytics.ts
export function trackEvent(event: string, properties?: Record<string, any>) {
  // Send to your analytics platform
  console.log('Event:', event, properties);

  // Example: Plausible, Mixpanel, Segment, etc.
  window.plausible?.(event, { props: properties });
}

// Usage in components
trackEvent('assignment_detail_viewed', { assignment_id });
trackEvent('comment_created', { has_mention: true });
trackEvent('checklist_item_toggled', { completed: true });
```

## 📋 Rollback Plan

If issues are discovered post-deployment:

### Frontend Rollback
```bash
# Vercel
vercel rollback <previous-deployment-url>

# Netlify
netlify rollback

# Manual
# Re-deploy previous dist/ folder
```

### Database Rollback
```bash
# Revert migrations (CAUTION)
supabase db reset --linked
# Then apply migrations up to previous version
supabase db push --exclude=20251003045452_*
```

### Edge Functions Rollback
```bash
# Redeploy previous versions
cd supabase/functions
# Use git to checkout previous versions
git checkout HEAD~1 assignments-get/index.ts
supabase functions deploy assignments-get
```

## ✅ Deployment Verification

After deployment, verify:

1. **Application loads**: `curl -I https://your-app.vercel.app`
2. **Auth works**: Login flow completes successfully
3. **API calls work**: Check Network tab for 200 responses
4. **Real-time works**: Check WebSocket connection in DevTools
5. **No console errors**: Check browser console for errors

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: "Failed to fetch" errors
- **Cause**: CORS not configured
- **Fix**: Add deployment URL to Supabase auth settings

**Issue**: Real-time not working
- **Cause**: WebSocket blocked or RLS policies
- **Fix**: Check browser console, verify RLS policies

**Issue**: Slow page loads
- **Cause**: Large bundle size or slow Edge Functions
- **Fix**: Use browser DevTools Network tab, optimize queries

**Issue**: 404 on routes
- **Cause**: SPA routing not configured
- **Fix**: Add redirect rules for hosting provider

### Debug Commands

```bash
# Check Supabase connection
curl https://zkrcjzdemdmwhearhfgg.supabase.co/rest/v1/

# Test Edge Function directly
curl -X POST https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/assignments-get \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"assignment_id": "test-id"}'

# Check real-time status
curl https://zkrcjzdemdmwhearhfgg.supabase.co/realtime/v1/health
```

## 🎉 Success Criteria

Deployment is successful when:

- ✅ Frontend accessible at production URL
- ✅ Authentication flow works end-to-end
- ✅ All critical QA tests pass
- ✅ Real-time updates work < 1s latency
- ✅ No console errors in production
- ✅ Lighthouse scores meet targets
- ✅ Database queries performant (< 100ms p95)
- ✅ Edge Functions responding (< 50ms p95)

## 📚 Resources

- **Supabase Dashboard**: https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg
- **Frontend Build**: `/frontend/dist/`
- **Quickstart Guide**: `/specs/014-full-assignment-detail/quickstart.md`
- **API Spec**: `/specs/014-full-assignment-detail/contracts/api-spec.yaml`
- **Build Fix Summary**: `/FRONTEND_BUILD_FIX_SUMMARY.md`
- **Deployment Status**: `/DEPLOYMENT_STATUS_014.md`

---

**Prepared By**: Claude Code
**Date**: 2025-10-04
**Next Review**: After production deployment
