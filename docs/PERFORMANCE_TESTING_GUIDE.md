# Performance Testing Guide for List Virtualization

## Overview

This guide provides step-by-step instructions for manually testing the performance improvements from implementing react-window virtualization in 4 components. The goal is to verify 60fps scrolling and low DOM node count with 100+ items.

## Prerequisites

1. **Start the dev server**: `cd frontend && pnpm dev`
2. **Open Chrome DevTools**: Press `F12` or `Cmd+Option+I` (Mac)
3. **Ensure test data**: Each component needs 100+ items for realistic testing

## Test Scenarios

### 1. NotificationCenter (FixedSizeList)

**Component**: `src/components/Notifications/NotificationCenter.tsx`
**URL**: `http://localhost:5173/` (bell icon in header)
**Virtualization**: FixedSizeList with 80px item height, 384px container

#### Test Setup
```javascript
// In browser console, generate 150 test notifications
const generateNotifications = () => {
  const userId = localStorage.getItem('supabase.auth.token')
    ? JSON.parse(localStorage.getItem('supabase.auth.token')).user.id
    : 'test-user';

  const types = ['info', 'success', 'warning', 'error'];
  const notifications = Array.from({ length: 150 }, (_, i) => ({
    id: `notif-${i}`,
    type: types[i % 4],
    title: `Notification ${i + 1}`,
    message: `This is test notification number ${i + 1}`,
    timestamp: new Date(Date.now() - i * 60000).toISOString(),
    read: i % 3 === 0,
    userId: userId
  }));

  localStorage.setItem(`notifications-${userId}`, JSON.stringify(notifications));
  location.reload();
};

generateNotifications();
```

#### Performance Testing Steps

1. **Open Performance Tab** in Chrome DevTools
2. **Click the bell icon** to open NotificationCenter dropdown
3. **Start recording** (click the record button or `Cmd+E`)
4. **Scroll smoothly** through the entire list (top to bottom, then back)
5. **Stop recording** after 5-10 seconds

#### Expected Results

- **FPS**: Should maintain 60fps during scroll (green bar, no red drops)
- **DOM Nodes**: ~5-6 notification items visible at once (not all 150)
  - Check in Elements tab: count `<div>` elements inside the FixedSizeList
  - Expected: 8-10 DOM nodes (5 visible + 3 overscan buffer)
  - Without virtualization: 150 DOM nodes
- **Frame rendering time**: < 16.67ms per frame (60fps)
- **Scripting time**: Minimal spikes, mostly < 5ms
- **Layout/Paint**: Should be minimal during scroll

#### Verification Checklist

- [ ] Dropdown opens instantly
- [ ] Scrolling is smooth (no janks or stutters)
- [ ] FPS stays at 60fps in Performance tab
- [ ] DOM node count is low (~8-10 items, not 150)
- [ ] Mark as read, delete, and clear all still work
- [ ] No console errors

---

### 2. AuditLogTable (FixedSizeList)

**Component**: `src/components/audit-logs/AuditLogTable.tsx`
**URL**: `http://localhost:5173/audit-logs`
**Virtualization**: FixedSizeList with 120px row height, 600px container

#### Test Setup

You'll need 100+ audit log entries. If not available in staging/dev database:

```sql
-- Run in Supabase SQL Editor to generate test audit logs
INSERT INTO audit_logs (
  user_id, operation, table_name, record_id,
  old_values, new_values, ip_address, user_agent
)
SELECT
  (SELECT id FROM auth.users LIMIT 1),
  CASE (random() * 2)::int
    WHEN 0 THEN 'INSERT'
    WHEN 1 THEN 'UPDATE'
    ELSE 'DELETE'
  END,
  CASE (random() * 4)::int
    WHEN 0 THEN 'dossiers'
    WHEN 1 THEN 'commitments'
    WHEN 2 THEN 'positions'
    ELSE 'contacts'
  END,
  gen_random_uuid()::text,
  jsonb_build_object('field1', 'old_value_' || generate_series),
  jsonb_build_object('field1', 'new_value_' || generate_series),
  '192.168.1.' || (random() * 255)::int,
  'Mozilla/5.0 (Test Agent)'
FROM generate_series(1, 150);
```

#### Performance Testing Steps

1. **Navigate to** `http://localhost:5173/audit-logs`
2. **Open Performance Tab** in Chrome DevTools
3. **Start recording**
4. **Scroll through the audit log table** (top to bottom, then back)
5. **Click to expand 2-3 rows** during scrolling
6. **Stop recording** after 10 seconds

#### Expected Results

- **FPS**: Should maintain 60fps during scroll
- **DOM Nodes**: ~5-6 table rows visible at once (not all 150)
  - Container height: 600px, row height: 120px = ~5 rows visible
  - Expected: 8-11 DOM nodes (5 visible + 3 overscan)
  - Without virtualization: 150+ table rows
- **Expand/collapse**: Should be instant, no lag
- **Layout thrashing**: Minimal during scroll

#### Verification Checklist

- [ ] Table renders with sortable headers
- [ ] Scrolling is smooth (60fps, no stutters)
- [ ] DOM node count is low (~8-11 rows, not 150)
- [ ] Expand/collapse row details works instantly
- [ ] Sorting still works correctly
- [ ] Tooltips appear on hover
- [ ] No console errors

---

### 3. CommitmentsList (VariableSizeList)

**Component**: `src/components/commitments/CommitmentsList.tsx`
**URL**: `http://localhost:5173/commitments`
**Virtualization**: VariableSizeList with estimated 156px item size

#### Test Setup

Generate test commitments via Supabase SQL Editor:

```sql
-- Generate 150 test commitments
INSERT INTO commitments (
  title, description, commitment_type, status, priority,
  responsible_party, due_date, source, dossier_id, created_by
)
SELECT
  'Test Commitment ' || generate_series,
  'This is a test commitment for performance testing. Item number ' || generate_series,
  CASE (random() * 2)::int
    WHEN 0 THEN 'internal'
    WHEN 1 THEN 'external'
    ELSE 'bilateral'
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN 'pending'
    WHEN 1 THEN 'in_progress'
    WHEN 2 THEN 'completed'
    ELSE 'cancelled'
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN 'low'
    WHEN 1 THEN 'medium'
    WHEN 2 THEN 'high'
    ELSE 'urgent'
  END,
  'Test Organization ' || (random() * 20)::int,
  NOW() + (generate_series || ' days')::interval,
  'after_action_record',
  (SELECT id FROM dossiers WHERE dossier_type = 'country' LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1)
FROM generate_series(1, 150);
```

#### Performance Testing Steps

1. **Navigate to** `http://localhost:5173/commitments`
2. **Open Performance Tab** in Chrome DevTools
3. **Start recording**
4. **Scroll through the list** (top to bottom, then back)
5. **Trigger pull-to-refresh** (pull down from top)
6. **Scroll to bottom** to trigger infinite scroll load more
7. **Stop recording** after 15 seconds

#### Expected Results

- **FPS**: Should maintain 60fps during scroll
- **DOM Nodes**: Variable based on viewport height
  - Viewport ~600px, avg item ~156px = ~4 items visible
  - Expected: 7-10 DOM nodes (4 visible + 3 overscan)
  - Without virtualization: 150+ commitment cards
- **Infinite scroll**: Should load seamlessly when reaching bottom
- **Pull-to-refresh**: Should work without performance degradation

#### Verification Checklist

- [ ] List renders in single column
- [ ] Scrolling is smooth (60fps)
- [ ] DOM node count is low (~7-10 cards, not 150)
- [ ] Infinite scroll loads more items seamlessly
- [ ] Pull-to-refresh works and refreshes data
- [ ] Filter chips and filtering work correctly
- [ ] Edit and create dialogs still work
- [ ] No console errors

---

### 4. DossierListPage (VariableSizeGrid)

**Component**: `src/pages/dossiers/DossierListPage.tsx`
**URL**: `http://localhost:5173/dossiers`
**Virtualization**: VariableSizeGrid with responsive columns (1/2/3), estimated 308px row height

#### Test Setup

Generate test dossiers via Supabase SQL Editor:

```sql
-- Generate 150 test dossiers
INSERT INTO dossiers (
  name, dossier_type, status, description,
  country_code, organization_type, created_by
)
SELECT
  'Test Dossier ' || generate_series,
  CASE (random() * 6)::int
    WHEN 0 THEN 'country'
    WHEN 1 THEN 'organization'
    WHEN 2 THEN 'forum'
    WHEN 3 THEN 'engagement'
    WHEN 4 THEN 'topic'
    WHEN 5 THEN 'working_group'
    ELSE 'person'
  END,
  CASE (random() * 2)::int
    WHEN 0 THEN 'active'
    WHEN 1 THEN 'inactive'
    ELSE 'archived'
  END,
  'This is test dossier number ' || generate_series || ' for performance testing',
  CASE WHEN (random() * 6)::int = 0 THEN 'US' ELSE NULL END,
  CASE WHEN (random() * 6)::int = 1 THEN 'multilateral' ELSE NULL END,
  (SELECT id FROM auth.users LIMIT 1)
FROM generate_series(1, 150);
```

#### Performance Testing Steps

1. **Navigate to** `http://localhost:5173/dossiers`
2. **Test at different viewport widths**:
   - Mobile: 375px (1 column)
   - Tablet: 768px (2 columns)
   - Desktop: 1440px (3 columns)
3. **For each viewport**:
   - Open Performance Tab
   - Start recording
   - Scroll through the grid (top to bottom, then back)
   - Expand 2-3 cards during scrolling
   - Hover over cards (to test prefetch)
   - Stop recording after 10 seconds

#### Expected Results

- **FPS**: Should maintain 60fps at all viewport sizes
- **DOM Nodes**: Variable based on viewport and column count
  - Mobile (1 col): Viewport ~600px, row ~308px = ~2 rows visible = ~5 cards (2 visible + 3 overscan)
  - Tablet (2 cols): ~2 rows × 2 cols = ~8 cards (4 visible + 4 overscan)
  - Desktop (3 cols): ~2 rows × 3 cols = ~12 cards (6 visible + 6 overscan)
  - Without virtualization: 150 dossier cards in DOM
- **Grid reflow**: Should be instant when resizing viewport
- **Card animations**: Expand/collapse should be smooth

#### Verification Checklist

- [ ] Grid renders in correct column count (1/2/3) based on viewport
- [ ] Scrolling is smooth (60fps) at all viewport sizes
- [ ] DOM node count scales with viewport (~5-12 cards, not 150)
- [ ] Card expand/collapse animations work smoothly
- [ ] Card actions (view, edit) work correctly
- [ ] Prefetch on hover works (check Network tab)
- [ ] Filter and search still work
- [ ] Pagination controls work
- [ ] RTL layout works correctly (switch language to Arabic)
- [ ] No console errors

---

## Performance Metrics Summary

### Key Performance Indicators (KPIs)

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **FPS** | 60fps (no red drops) | Smooth scrolling experience |
| **Frame time** | < 16.67ms | 60fps = 16.67ms per frame budget |
| **DOM nodes** | Only visible + buffer | Memory efficiency, faster repaints |
| **Scripting time** | < 5ms per frame | Minimal JavaScript overhead |
| **Layout thrashing** | Minimal | Avoid forced reflows |

### How to Read Performance Tab

1. **FPS Chart** (top): Green bars = good (60fps), Red bars = janks
2. **Main Thread**: Look for long tasks (> 50ms) - should be minimal during scroll
3. **Frames**: Click individual frames to see what took time (scripting, rendering, painting)
4. **Memory**: Should stay flat during scroll (not grow with list size)

### DOM Node Count Verification

**Before virtualization** (using `.map()`):
```
Component                 | Items | DOM Nodes | Memory Impact
--------------------------|-------|-----------|---------------
NotificationCenter        | 150   | ~150      | High
AuditLogTable            | 150   | ~150      | High
CommitmentsList          | 150   | ~150      | High
DossierListPage (3 cols) | 150   | ~150      | High
**Total**                | 600   | ~600      | **Very High**
```

**After virtualization** (react-window):
```
Component                 | Items | DOM Nodes | Memory Impact
--------------------------|-------|-----------|---------------
NotificationCenter        | 150   | ~8-10     | Low
AuditLogTable            | 150   | ~8-11     | Low
CommitmentsList          | 150   | ~7-10     | Low
DossierListPage (3 cols) | 150   | ~12       | Low
**Total**                | 600   | ~35-43    | **Low** ✅
```

**Improvement**: ~93% reduction in DOM nodes (600 → 43)

### How to Count DOM Nodes

1. Open **Elements** tab in DevTools
2. Find the virtualized list container (look for `data-testid="virtualized-list"` or similar)
3. Expand the container and count child elements
4. Should see only visible items + overscan buffer (not all items)

## Common Issues & Troubleshooting

### Issue: FPS drops below 60fps

**Possible causes:**
- Too many items in overscan buffer (reduce `overscanCount`)
- Complex item components (simplify or memoize)
- Heavy computations during scroll (move to `useMemo`/`useCallback`)
- Large images loading (use lazy loading)

**Solution:**
- Check overscan settings in component
- Memoize item renderer functions
- Use `React.memo` for item components

### Issue: DOM node count is still high

**Possible causes:**
- Virtualization not working (check component implementation)
- Multiple lists rendered simultaneously
- Items not being recycled properly

**Solution:**
- Verify `FixedSizeList`/`VariableSizeList`/`VariableSizeGrid` is used
- Check `itemCount` prop is correct
- Ensure `height` and `itemSize` props are set

### Issue: Scrolling feels janky

**Possible causes:**
- Layout thrashing (reading/writing DOM in quick succession)
- Forced synchronous layouts
- Too many event listeners

**Solution:**
- Use `will-change: transform` on scrollable container
- Debounce scroll handlers
- Use passive event listeners

## Browser Testing Matrix

Test in multiple browsers to ensure cross-browser performance:

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Primary testing browser |
| Firefox | Latest | ⚠️ May have different performance characteristics |
| Safari | Latest | ⚠️ Test on macOS/iOS |
| Edge | Latest | ✅ Chromium-based, similar to Chrome |

## Accessibility Note

While testing performance, also verify:
- **Keyboard navigation** still works (Tab, Arrow keys)
- **Screen reader** announces items correctly
- **Focus indicators** are visible
- **RTL layout** works (switch to Arabic language)

## Documentation of Results

After completing all tests, document results in `build-progress.txt`:

```markdown
## Performance Testing Results (YYYY-MM-DD)

### NotificationCenter
- ✅ 60fps scrolling with 150 items
- ✅ DOM nodes: 8-10 (vs 150 without virtualization)
- ✅ All functionality preserved

### AuditLogTable
- ✅ 60fps scrolling with 150 logs
- ✅ DOM nodes: 8-11 (vs 150 without virtualization)
- ✅ Sorting, expansion, tooltips all work

### CommitmentsList
- ✅ 60fps scrolling with 150 commitments
- ✅ DOM nodes: 7-10 (vs 150 without virtualization)
- ✅ Infinite scroll, pull-to-refresh work

### DossierListPage
- ✅ 60fps scrolling at all viewports
- ✅ DOM nodes: 5-12 (vs 150 without virtualization)
- ✅ Responsive grid, card interactions work

### Overall Results
- ✅ ~93% reduction in DOM nodes (600 → 43)
- ✅ Smooth 60fps scrolling across all components
- ✅ No functionality regressions
- ✅ Memory usage independent of list size
```

## Next Steps

After completing performance testing:
1. Document results in `build-progress.txt`
2. Take screenshots of Performance tab results (save as evidence)
3. Update subtask status in `implementation_plan.json`
4. Commit changes
5. Proceed to subtask-2-3: Accessibility and RTL verification
