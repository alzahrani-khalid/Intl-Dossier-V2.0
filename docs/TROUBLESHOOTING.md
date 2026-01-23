# Troubleshooting & Debugging Guide

## Overview

This guide provides comprehensive troubleshooting solutions for common issues encountered in the GASTAT International Dossier System. Given the complex tech stack (React 19, TypeScript, Supabase, TanStack Query, Real-time subscriptions, i18n with RTL support), this guide accelerates issue resolution and reduces debugging time.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Docker & Infrastructure Issues](#docker--infrastructure-issues)
3. [Database & Supabase Issues](#database--supabase-issues)
4. [Authentication & Authorization Issues](#authentication--authorization-issues)
5. [Frontend & React Issues](#frontend--react-issues)
6. [TanStack Query Issues](#tanstack-query-issues)
7. [Real-time Subscription Issues](#real-time-subscription-issues)
8. [Internationalization & RTL Issues](#internationalization--rtl-issues)
9. [API & Network Issues](#api--network-issues)
10. [Performance & Optimization Issues](#performance--optimization-issues)
11. [Build & Deployment Issues](#build--deployment-issues)
12. [Debugging Tools & Techniques](#debugging-tools--techniques)
13. [Common Error Messages](#common-error-messages)
14. [FAQ](#faq)
15. [Getting Help](#getting-help)

## Quick Diagnostics

### System Health Check

```bash
# Check all Docker containers are running
docker ps --filter "name=intl-dossier"

# Check application logs
pnpm logs

# Verify database connection
docker exec -it intl-dossier-postgres psql -U postgres -c "SELECT version();"

# Test Redis connection
docker exec -it intl-dossier-redis redis-cli ping

# Check frontend dev server
curl http://localhost:5173

# Check backend API
curl http://localhost:4000/health
```

### Environment Validation

```bash
# Verify all required environment variables are set
grep -E "^[A-Z_]+=.+" .env | cut -d= -f1 | sort

# Check Node.js version (requires 18+ LTS)
node --version

# Check pnpm version
pnpm --version

# Verify TypeScript version (requires 5.8+)
pnpm tsc --version
```

## Docker & Infrastructure Issues

### Port Already in Use

**Symptoms:**
- Error: `bind: address already in use`
- Container fails to start

**Solution:**

```bash
# Find what's using the port (e.g., PostgreSQL on 54322)
lsof -i :54322

# Kill the process
kill -9 <PID>

# Or change the port in docker-compose.yml
# ports:
#   - "54323:5432"  # Use different host port
```

### Container Keeps Restarting

**Symptoms:**
- Container status shows "Restarting"
- Services unavailable

**Solution:**

```bash
# Check container logs
docker logs intl-dossier-<service> --tail 100

# Check container health status
docker inspect intl-dossier-<service> | grep -A 10 Health

# Check resource usage
docker stats intl-dossier-<service>

# Restart container
docker compose restart <service>
```

### Volume Permission Issues

**Symptoms:**
- Permission denied errors in logs
- Database won't start

**Solution:**

```bash
# Fix volume permissions
docker compose down
sudo chown -R $USER:$USER ./volumes/

# Reset volumes (WARNING: deletes data)
docker compose down --volumes
docker compose up -d
```

### Network Connectivity Issues

**Symptoms:**
- Services can't reach each other
- DNS resolution fails

**Solution:**

```bash
# Inspect network
docker network inspect intl-dossier_default

# Recreate network
docker compose down
docker network prune
docker compose up -d

# Test connectivity between containers
docker exec intl-dossier-frontend ping intl-dossier-postgres
```

## Database & Supabase Issues

### Connection Refused

**Symptoms:**
- `ECONNREFUSED` errors
- Application can't connect to database

**Solution:**

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Verify connection string in .env
# DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Test connection from host
psql postgresql://postgres:postgres@localhost:54322/postgres

# Check PostgreSQL logs
docker logs intl-dossier-postgres --tail 50
```

### Migration Failures

**Symptoms:**
- Migrations fail to apply
- Schema version mismatch

**Solution:**

```bash
# Check current migration status
pnpm db:status

# Rollback last migration
pnpm db:rollback

# Re-run migrations
pnpm db:migrate

# Reset database (development only)
pnpm db:reset

# View migration history
psql $DATABASE_URL -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

### RLS Policy Issues (403 Forbidden)

**Symptoms:**
- `new row violates row-level security policy`
- 403 errors on data mutations
- Data not visible despite existing

**Root Causes:**
- Missing RLS policy
- Incorrect `auth.uid()` usage
- Policy not matching current user context

**Solution:**

```bash
# 1. Verify user is authenticated
# In browser console:
supabase.auth.getUser().then(console.log)

# 2. Check RLS policies for table
psql $DATABASE_URL -c "
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'your_table_name';
"

# 3. Test query as service role (bypasses RLS)
# In Supabase dashboard, run query with service_role key

# 4. Common fixes:
# - Add SELECT policy: CREATE POLICY "Users can view own data" ON table_name FOR SELECT USING (auth.uid() = user_id);
# - Add INSERT policy: CREATE POLICY "Users can insert own data" ON table_name FOR INSERT WITH CHECK (auth.uid() = user_id);
# - Check user_id column exists and matches auth.uid()
```

### Slow Queries

**Symptoms:**
- API requests timeout
- Database CPU high

**Solution:**

```bash
# Enable query logging
# In docker-compose.yml, add:
# command: postgres -c log_statement=all -c log_duration=on

# Identify slow queries
psql $DATABASE_URL -c "
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"

# Add missing indexes
# Analyze query plan
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM your_table WHERE condition;"

# Create index
psql $DATABASE_URL -c "CREATE INDEX idx_column_name ON table_name(column_name);"
```

## Authentication & Authorization Issues

### Token Refresh Failures

**Symptoms:**
- User logged out unexpectedly
- 401 Unauthorized errors after timeout
- "Failed to refresh access token" in logs

**Solution:**

```javascript
// 1. Check token expiry configuration
// In Supabase dashboard: Authentication > Settings
// Access token expiry: 3600 (1 hour recommended)

// 2. Verify refresh token handling
// frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 3. Manual refresh if needed
const { data, error } = await supabase.auth.refreshSession()

// 4. Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully')
  }
  if (event === 'SIGNED_OUT') {
    // Redirect to login
  }
})
```

### Session Not Persisting

**Symptoms:**
- User logged out on page refresh
- Session lost in new tab

**Solution:**

```typescript
// Check localStorage for Supabase session
localStorage.getItem('sb-<project-ref>-auth-token')

// Ensure persistSession is enabled
const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    storage: window.localStorage, // or custom storage
  }
})

// Clear corrupted session
localStorage.removeItem('sb-<project-ref>-auth-token')
```

### CORS Errors on Auth

**Symptoms:**
- CORS errors on login/signup
- `Access-Control-Allow-Origin` errors

**Solution:**

```bash
# In Supabase dashboard: Authentication > URL Configuration
# Add allowed URLs:
# - http://localhost:5173
# - https://your-domain.com

# Verify Site URL and Redirect URLs match your application
```

## Frontend & React Issues

### React 19 Hydration Mismatch

**Symptoms:**
- Warning: "Hydration failed"
- Content flashing/flickering
- Mismatched server/client rendering

**Solution:**

```tsx
// 1. Check for browser-only APIs in SSR
// Bad:
const width = window.innerWidth

// Good:
const [width, setWidth] = useState(0)
useEffect(() => {
  setWidth(window.innerWidth)
}, [])

// 2. Use suppressHydrationWarning for dynamic content
<div suppressHydrationWarning>
  {new Date().toLocaleString()}
</div>

// 3. Check for mismatched HTML structure
// Server and client must render identical markup
```

### Component Not Re-rendering

**Symptoms:**
- UI not updating after state change
- Stale data displayed

**Solution:**

```tsx
// 1. Verify state is immutable
// Bad:
data.push(newItem)
setData(data)

// Good:
setData([...data, newItem])

// 2. Check dependency array
useEffect(() => {
  fetchData()
}, [id]) // Include all dependencies

// 3. Use key prop for list items
{items.map(item => (
  <Component key={item.id} {...item} />
))}
```

### Route Not Found (TanStack Router)

**Symptoms:**
- 404 on valid route
- Navigation not working

**Solution:**

```tsx
// 1. Check route definition
// frontend/src/routes/__root.tsx
export const Route = createRootRoute({
  component: RootComponent,
})

// 2. Verify route registration
// frontend/src/main.tsx
const routeTree = rootRoute.addChildren([
  indexRoute,
  // Add your routes here
])

// 3. Check route params
// Use $param for dynamic segments: /dossiers/$dossierId
```

## TanStack Query Issues

### Stale Data Not Updating

**Symptoms:**
- Old data displayed after mutation
- Cache not invalidating

**Solution:**

```typescript
// 1. Invalidate queries after mutation
import { useMutation, useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: updateData,
  onSuccess: () => {
    // Invalidate all queries with key 'dossiers'
    queryClient.invalidateQueries({ queryKey: ['dossiers'] })

    // Or invalidate specific query
    queryClient.invalidateQueries({ queryKey: ['dossiers', id] })
  }
})

// 2. Use optimistic updates
const mutation = useMutation({
  mutationFn: updateDossier,
  onMutate: async (newDossier) => {
    await queryClient.cancelQueries({ queryKey: ['dossiers', id] })
    const previousDossier = queryClient.getQueryData(['dossiers', id])

    queryClient.setQueryData(['dossiers', id], newDossier)

    return { previousDossier }
  },
  onError: (err, newDossier, context) => {
    queryClient.setQueryData(['dossiers', id], context.previousDossier)
  }
})
```

### Infinite Loading State

**Symptoms:**
- `isLoading` always true
- Spinner never disappears

**Solution:**

```typescript
// 1. Check query key stability
// Bad:
useQuery({ queryKey: ['data', { filter }] }) // New object every render

// Good:
useQuery({ queryKey: ['data', filter] }) // Primitive value

// 2. Verify queryFn returns data
const { data, isLoading, error } = useQuery({
  queryKey: ['dossiers'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')

    if (error) throw error
    return data // Must return data
  }
})

// 3. Check for errors
if (error) {
  console.error('Query error:', error)
}
```

### Query Not Refetching

**Symptoms:**
- Data not updating on focus/reconnect
- Stale data persists

**Solution:**

```typescript
// Configure refetch behavior
const { data } = useQuery({
  queryKey: ['dossiers'],
  queryFn: fetchDossiers,
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: false, // Or set interval
})

// Manually refetch
const { refetch } = useQuery({ ... })
refetch()

// Check global defaults
// frontend/src/main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 3,
    },
  },
})
```

## Real-time Subscription Issues

### Subscription Not Receiving Updates

**Symptoms:**
- Real-time updates not appearing
- No data on `INSERT`/`UPDATE`/`DELETE`

**Solution:**

```typescript
// 1. Enable Realtime in Supabase dashboard
// Database > Replication > Enable for table

// 2. Check subscription code
const channel = supabase
  .channel('dossiers-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // or 'INSERT', 'UPDATE', 'DELETE'
      schema: 'public',
      table: 'dossiers',
    },
    (payload) => {
      console.log('Change received!', payload)
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    }
  )
  .subscribe((status) => {
    console.log('Subscription status:', status)
  })

// 3. Verify RLS policies allow SELECT
// User must have SELECT permission to receive real-time updates

// 4. Check connection status
supabase.realtime.connectionState() // Should be 'connected'

// 5. Cleanup subscription
useEffect(() => {
  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

### Connection Drops Frequently

**Symptoms:**
- `CLOSED` status in logs
- Intermittent updates

**Solution:**

```typescript
// 1. Implement reconnection logic
const channel = supabase
  .channel('dossiers', {
    config: {
      broadcast: { self: true },
      presence: { key: userId },
    },
  })
  .subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      console.error('Subscription error, retrying...')
      setTimeout(() => {
        channel.subscribe()
      }, 5000)
    }
  })

// 2. Check network stability
// Monitor browser console for WebSocket errors

// 3. Verify Supabase project status
// Check Supabase dashboard for outages
```

## Internationalization & RTL Issues

### RTL Layout Broken

**Symptoms:**
- Arabic text displays left-aligned
- Icons not flipped
- Margins/padding incorrect

**Solution:**

```tsx
// 1. Use logical properties (ALWAYS)
// Bad:
<div className="ml-4 text-left">

// Good:
<div className="ms-4 text-start">

// 2. Flip directional icons
import { useTranslation } from 'react-i18next'

const { i18n } = useTranslation()
const isRTL = i18n.language === 'ar'

<ChevronRight className={isRTL ? 'rotate-180' : ''} />

// 3. Set dir attribute
<div dir={isRTL ? 'rtl' : 'ltr'}>
  {content}
</div>

// 4. Check Tailwind config
// tailwind.config.js
module.exports = {
  // Enable RTL support
  plugins: [
    require('tailwindcss-rtl'),
  ],
}
```

### Translations Not Loading

**Symptoms:**
- Keys displayed instead of translations
- `t('key')` returns 'key'

**Solution:**

```typescript
// 1. Verify translation files exist
// frontend/src/locales/en/common.json
// frontend/src/locales/ar/common.json

// 2. Check i18n initialization
// frontend/src/i18n/config.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: require('../locales/en/common.json'),
      },
      ar: {
        common: require('../locales/ar/common.json'),
      },
    },
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
  })

// 3. Use correct namespace
const { t } = useTranslation('common')
t('key') // Looks in common.json

// 4. Check JSON syntax
// Validate JSON files at jsonlint.com
```

### Language Not Switching

**Symptoms:**
- Language selector doesn't work
- UI stays in same language

**Solution:**

```typescript
// 1. Verify language change handler
import { useTranslation } from 'react-i18next'

const { i18n } = useTranslation()

const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng)
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
}

// 2. Check localStorage persistence
localStorage.getItem('i18nextLng') // Should match current language

// 3. Re-render after language change
// Use i18n.language in components to trigger re-render
```

## API & Network Issues

### 404 Not Found

**Symptoms:**
- API endpoint returns 404
- Route not defined

**Solution:**

```bash
# 1. Check backend routes
# backend/src/routes/index.ts
grep -r "router.get\|router.post" backend/src/routes/

# 2. Verify base URL
# frontend/.env
VITE_API_URL=http://localhost:4000

# 3. Check proxy configuration
# frontend/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:4000'
    }
  }
})

# 4. Test endpoint directly
curl http://localhost:4000/api/dossiers
```

### Request Timeout

**Symptoms:**
- Long wait times
- `ETIMEDOUT` errors

**Solution:**

```typescript
// 1. Increase timeout in fetch/axios
const response = await fetch(url, {
  signal: AbortSignal.timeout(30000) // 30 seconds
})

// 2. Check for slow database queries
// See Database & Supabase Issues > Slow Queries

// 3. Monitor network tab
// Chrome DevTools > Network > Check request timing

// 4. Implement retry logic
import { useQuery } from '@tanstack/react-query'

useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
})
```

## Performance & Optimization Issues

### Slow Page Load

**Symptoms:**
- High Time to Interactive (TTI)
- Large bundle size

**Solution:**

```bash
# 1. Analyze bundle size
pnpm build
pnpm analyze

# 2. Check for large dependencies
npx vite-bundle-visualizer

# 3. Implement code splitting
# Use dynamic imports
const Component = lazy(() => import('./Component'))

# 4. Optimize images
# Use WebP format, lazy loading
<img src="image.webp" loading="lazy" />
```

### Memory Leaks

**Symptoms:**
- Increasing memory usage
- Browser tab crashes

**Solution:**

```typescript
// 1. Cleanup subscriptions
useEffect(() => {
  const subscription = subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [])

// 2. Cancel pending requests
useEffect(() => {
  const controller = new AbortController()

  fetch(url, { signal: controller.signal })

  return () => {
    controller.abort()
  }
}, [])

// 3. Profile memory usage
// Chrome DevTools > Memory > Take heap snapshot
```

## Build & Deployment Issues

### Build Failures

**Symptoms:**
- `pnpm build` fails
- TypeScript errors

**Solution:**

```bash
# 1. Clear cache and node_modules
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 2. Check TypeScript errors
pnpm typecheck

# 3. Verify environment variables
grep -E "^VITE_" .env

# 4. Check for missing dependencies
pnpm install --frozen-lockfile

# 5. Review build logs
pnpm build 2>&1 | tee build.log
```

### Environment Variables Not Working

**Symptoms:**
- `undefined` values in production
- Config not loading

**Solution:**

```bash
# 1. Frontend: Use VITE_ prefix
VITE_API_URL=https://api.example.com

# 2. Backend: Load from .env
# backend/.env
DATABASE_URL=postgresql://...

# 3. Verify loading in code
# frontend/src/config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
}

# 4. Check Docker environment
# docker-compose.yml
environment:
  - DATABASE_URL=${DATABASE_URL}
```

## Debugging Tools & Techniques

### React Developer Tools

```bash
# Install extension
# Chrome: https://chrome.google.com/webstore React Developer Tools

# Usage:
# 1. Open DevTools > Components tab
# 2. Inspect component props/state
# 3. Profiler tab for performance analysis
```

### TanStack Query DevTools

```tsx
// Enable in development
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <>
      <RouterProvider />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

### Supabase Logs

```bash
# View real-time logs in Supabase dashboard
# Logs & Reports > Logs

# Filter by:
# - Status code (400, 500)
# - Method (GET, POST)
# - Path (/rest/v1/dossiers)

# Export logs
# Logs > Export > Download CSV
```

### Network Monitoring

```bash
# Chrome DevTools > Network
# 1. Filter by type (Fetch/XHR)
# 2. Check request/response headers
# 3. Verify payload
# 4. Check timing (TTFB, Download)

# HAR file export for analysis
# Network > Export HAR
```

### Database Query Logging

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
SELECT pg_reload_conf();

-- View slow queries
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Browser Console Tips

```javascript
// Debug TanStack Query
window.queryClient = queryClient

// Debug Supabase
window.supabase = supabase

// Check auth state
supabase.auth.getUser().then(console.log)

// Monitor real-time
supabase.realtime.connectionState()

// Test i18n
i18n.changeLanguage('ar')
```

## Common Error Messages

### `Cannot read property 'map' of undefined`

**Cause:** Data not loaded before rendering

**Fix:**
```tsx
const { data, isLoading } = useQuery({ ... })

if (isLoading) return <Loading />
if (!data) return null

return <>{data.map(...)}</>
```

### `401 Unauthorized`

**Cause:** Missing or expired auth token

**Fix:**
```typescript
// Check user session
const { data: { user } } = await supabase.auth.getUser()

// Refresh session
const { data } = await supabase.auth.refreshSession()

// Re-login
await supabase.auth.signInWithPassword({ email, password })
```

### `403 Forbidden`

**Cause:** RLS policy blocking access

**Fix:** See [RLS Policy Issues](#rls-policy-issues-403-forbidden)

### `ECONNREFUSED`

**Cause:** Service not running or wrong port

**Fix:**
```bash
# Check service is running
docker ps | grep <service>

# Verify port in connection string
# localhost:54322 (not 5432 from inside Docker)
```

### `Hydration failed`

**Cause:** Server/client HTML mismatch

**Fix:** See [React 19 Hydration Mismatch](#react-19-hydration-mismatch)

## FAQ

### Q: How do I reset the development database?

```bash
pnpm db:reset
```

### Q: How do I clear TanStack Query cache?

```typescript
queryClient.clear()
```

### Q: How do I debug RLS policies?

```sql
-- Check policies
\dp table_name

-- Test as user
SET SESSION AUTHORIZATION 'user_id';
SELECT * FROM table_name;
```

### Q: How do I enable verbose logging?

```bash
# Frontend
VITE_LOG_LEVEL=debug pnpm dev

# Backend
LOG_LEVEL=debug pnpm dev
```

### Q: Where are error logs stored?

```bash
# Docker logs
docker logs intl-dossier-<service>

# Application logs (if configured)
./logs/error.log
./logs/combined.log
```

## Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Search existing GitHub issues
3. ✅ Review application logs
4. ✅ Try the Quick Diagnostics steps
5. ✅ Reproduce in minimal environment

### Information to Include

```markdown
**Environment:**
- OS: macOS 13.0 / Ubuntu 22.04 / Windows 11
- Node.js: v18.17.0
- pnpm: 8.6.0
- Docker: 24.0.5

**Issue:**
Clear description of the problem

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Logs:**
```
Paste relevant logs here
```

**Screenshots:**
(if applicable)
```

### Contact Channels

- **GitHub Issues:** https://github.com/gastat/intl-dossier/issues
- **Email:** support@gastat.sa
- **Slack:** #intl-dossier-support (internal)

---

_Last updated: 2025-01-24_
