# Aceternity UI Migration Map

## Component Inventory

**Total Components**: 249 TypeScript/React components
**UI Components**: 35 shadcn/ui base components
**Domain Components**: ~214 feature-specific components

## Migration Strategy

Following user-specified priority order:
1. **Navigation & Layout** (Week 2)
2. **Forms & Inputs** (Week 3)
3. **Data Display** (Week 4-5)
4. **Dashboard & Analytics** (Week 6)

## Phase 1: Navigation & Layout Components (Priority: CRITICAL)

| Current Component | Path | Aceternity Replacement | Pro? | Status |
|-------------------|------|----------------------|------|--------|
| **Sidebar.tsx** | `Layout/` | `sidebar` | No | ⏳ Pending |
| **AnimatedSidebar.tsx** | `Layout/` | `sidebar` + animations | Yes | ⏳ Pending |
| **Header.tsx** | `Layout/` | `floating-navbar` | No | ⏳ Pending |
| **Breadcrumbs.tsx** | `Layout/` | Custom + `link-preview` | No | ⏳ Pending |
| **MainLayout.tsx** | `Layout/` | `layout-grid` or `bento-grid` | No | ⏳ Pending |
| **Navigation.tsx** | `components/` | `navigation-menu` | No | ⏳ Pending |
| **modern-nav/** | `components/modern-nav/` | Aceternity Pro dashboard nav | Yes | ⏳ Pending |

**Aceternity Components to Install**:
```bash
npx shadcn@latest add https://ui.aceternity.com/registry/sidebar.json --yes
npx shadcn@latest add https://ui.aceternity.com/registry/floating-navbar.json --yes
npx shadcn@latest add https://ui.aceternity.com/registry/floating-dock.json --yes
npx shadcn@latest add https://ui.aceternity.com/registry/link-preview.json --yes
npx shadcn@latest add https://ui.aceternity.com/registry/layout-grid.json --yes
# bento-grid already installed ✅
```

## Phase 2: Forms & Inputs Components (Priority: CRITICAL)

| Current Component | Path | Aceternity Replacement | Pro? | Status |
|-------------------|------|----------------------|------|--------|
| **FormInput.tsx** | `Forms/` | `vanish-input` | No | ⏳ Pending |
| **FormSelect.tsx** | `Forms/` | Custom select + Aceternity styling | No | ⏳ Pending |
| **FileUpload.tsx** | `components/` | `file-upload` | No | ⏳ Pending |
| **AttachmentUploader.tsx** | `components/` | `file-upload` | No | ⏳ Pending |
| **IntakeForm.tsx** | `components/` | Multi-step form | Yes | ⏳ Pending |
| **ContactForm.tsx** | `contacts/` | `signup-form` adapted | No | ⏳ Pending |
| **GlobalSearchInput.tsx** | `components/` | Custom + command palette | No | ⏳ Pending |
| **SearchSuggestions.tsx** | `components/` | Custom dropdown | No | ⏳ Pending |
| **input.tsx** | `ui/` | `vanish-input` | No | ⏳ Pending |
| **textarea.tsx** | `ui/` | Custom + Aceternity styling | No | ⏳ Pending |
| **select.tsx** | `ui/` | Keep or enhance with Aceternity | No | ⏳ Pending |
| **checkbox.tsx** | `ui/` | Keep (shadcn fallback) | No | ⏳ Pending |
| **radio-group.tsx** | `ui/` | Keep (shadcn fallback) | No | ⏳ Pending |

**Aceternity Components to Install**:
```bash
npx shadcn@latest add https://ui.aceternity.com/registry/vanish-input.json --yes
npx shadcn@latest add https://ui.aceternity.com/registry/file-upload.json --yes
npx shadcn@latest add https://ui.aceternity.com/registry/signup-form.json --yes
```

**Pro Components** (verify installation method):
```bash
# Multi-step form for IntakeForm
npx shadcn@latest add @aceternity-pro/multi-step-form
```

## Phase 3: Data Display Components (Priority: HIGH)

### Cards

| Current Component | Path | Aceternity Replacement | Pro? | Status |
|-------------------|------|----------------------|------|--------|
| **card.tsx** | `ui/` | `3d-card` or `hover-card` | No | ⏳ Pending |
| **DossierCard.tsx** | `components/` | `expandable-card` | No | ⏳ Pending |
| **ContactCard.tsx** | `contacts/` | `3d-card` with animations | Yes | ⏳ Pending |
| **PositionCard.tsx** | `components/` | `hover-card` | No | ⏳ Pending |
| **StatCard.tsx** | `Dashboard/components/` | Animated metric card | Yes | ⏳ Pending |
| **UniversalDossierCard.tsx** | `Dossier/` | `expandable-card` | No | ⏳ Pending |

**Aceternity Components to Install**:
```bash
npx shadcn@latest add https://ui.aceternity.com/registry/3d-card.json --yes
npx shadcn@latest add https://ui.aceternity.com/registry/hover-card.json --yes
npx shadcn@latest add https://ui.aceternity.com/registry/expandable-card.json --yes
npx shadcn@latest add https://ui.aceternity.com/registry/evervault-card.json --yes
```

### Tables

| Current Component | Path | Aceternity Replacement | Pro? | Status |
|-------------------|------|----------------------|------|--------|
| **table.tsx** | `ui/` | Aceternity Pro data table | Yes | ⏳ Pending |
| **DataTable.tsx** | `Table/` | Aceternity Pro data table | Yes | ⏳ Pending |
| **AdvancedDataTable.tsx** | `Table/` | Enhanced Pro table | Yes | ⏳ Pending |
| **responsive-table.tsx** | `responsive/` | Mobile-responsive table | Yes | ⏳ Pending |

**Pro Components** (verify installation method):
```bash
npx shadcn@latest add @aceternity-pro/data-table-block
```

### Lists & Timelines

| Current Component | Path | Aceternity Replacement | Pro? | Status |
|-------------------|------|----------------------|------|--------|
| **DossierTimeline.tsx** | `components/` | `timeline` | No | ⏳ Pending |
| **Timeline.tsx** | `assignments/` | `timeline` | No | ⏳ Pending |
| **ActivityFeed.tsx** | `Dashboard/components/` | `timeline` + custom cards | No | ⏳ Pending |
| **DecisionList.tsx** | `components/` | Custom list + `bento-grid` | No | ⏳ Pending |
| **RiskList.tsx** | `components/` | Custom list + animations | No | ⏳ Pending |
| **FollowUpList.tsx** | `components/` | Custom list | No | ⏳ Pending |

**Aceternity Components to Install**:
```bash
npx shadcn@latest add https://ui.aceternity.com/registry/timeline.json --yes
```

### Kanban & Drag-Drop

| Current Component | Path | Aceternity Replacement | Pro? | Status |
|-------------------|------|----------------------|------|--------|
| **kanban.tsx** | `ui/` | Custom + @dnd-kit + `3d-card` | No | ⏳ Pending |
| **KanbanBoard.tsx** | `kanban/`, `assignments/` | Custom Kanban with Aceternity cards | No | ⏳ Pending |
| **KanbanColumn.tsx** | `assignments/` | Custom with Aceternity styling | No | ⏳ Pending |
| **KanbanTaskCard.tsx** | `assignments/` | `3d-card` or `hover-card` | No | ⏳ Pending |

**Note**: No direct Kanban in Aceternity. Build custom with @dnd-kit + Aceternity card components.

## Phase 4: Dashboard & Analytics Components (Priority: HIGH)

| Current Component | Path | Aceternity Replacement | Pro? | Status |
|-------------------|------|----------------------|------|--------|
| **DashboardPage.tsx** | `pages/Dashboard/` | Aceternity Pro dashboard template | Yes | ⏳ Pending |
| **StatCard.tsx** | `Dashboard/components/` | Animated metric card | Yes | ⏳ Pending |
| **MetricCard.tsx** | `modern-nav/Dashboard/` | Count-up metric card | Yes | ⏳ Pending |
| **ActivityFeed.tsx** | `Dashboard/components/` | `timeline` + cards | No | ⏳ Pending |
| **RelationshipHealthChart.tsx** | `Dashboard/components/` | Custom chart with Aceternity wrapper | No | ⏳ Pending |
| **UpcomingEvents.tsx** | `Dashboard/components/` | Card list + `bento-grid` | No | ⏳ Pending |

**Aceternity Pro Components** (verify installation method):
```bash
npx shadcn@latest add @aceternity-pro/dashboard-template-one
npx shadcn@latest add @aceternity-pro/analytics-dashboard
npx shadcn@latest add @aceternity-pro/metric-card-blocks
```

### Visualizations

| Current Component | Path | Aceternity Replacement | Pro? | Status |
|-------------------|------|----------------------|------|--------|
| **RelationshipGraph.tsx** | `dossiers/`, `relationships/` | `github-globe` | No | ⏳ Pending |
| **GraphVisualization.tsx** | `relationships/` | `github-globe` + React Flow | No | ⏳ Pending |
| **ClusterVisualization.tsx** | `analytics/` | `world-map` or custom | No | ⏳ Pending |

**Aceternity Components to Install**:
```bash
npx shadcn@latest add https://ui.aceternity.com/registry/github-globe.json --yes
npx shadcn@latest add https://ui.aceternity.com/registry/world-map.json --yes
```

## Phase 5: Special Components & Effects (Priority: MEDIUM)

### Buttons

| Current Component | Path | Aceternity Replacement | Pro? | Status |
|-------------------|------|----------------------|------|--------|
| **button.tsx** | `ui/` | `moving-border-button` or keep enhanced | No | ⏳ Pending |
| **AIExtractionButton.tsx** | `components/` | `moving-border-button` + custom logic | No | ⏳ Pending |
| **PDFGeneratorButton.tsx** | `components/` | Custom button + Aceternity styling | No | ⏳ Pending |

**Aceternity Components to Install**:
```bash
npx shadcn@latest add https://ui.aceternity.com/registry/moving-border-button.json --yes
npx shadcn@latest add https://ui.aceternity.com/registry/hover-border-gradient.json --yes
```

### Modals & Dialogs

| Current Component | Path | Aceternity Replacement | Pro? | Status |
|-------------------|------|----------------------|------|--------|
| **dialog.tsx** | `ui/` | `animated-modal` | No | ⏳ Pending |
| **alert-dialog.tsx** | `ui/` | `animated-modal` variant | No | ⏳ Pending |
| **sheet.tsx** | `ui/` | Keep or enhance with animations | No | ⏳ Pending |
| **ConflictDialog.tsx** | `components/`, `tasks/` | `animated-modal` | No | ⏳ Pending |
| **CreateDossierDialog.tsx** | `components/` | `animated-modal` + form | No | ⏳ Pending |

**Aceternity Components to Install**:
```bash
npx shadcn@latest add https://ui.aceternity.com/registry/animated-modal.json --yes
```

### Tooltips & Popovers

| Current Component | Path | Aceternity Replacement | Pro? | Status |
|-------------------|------|----------------------|------|--------|
| **tooltip.tsx** | `ui/` | `animated-tooltip` | No | ⏳ Pending |
| **popover.tsx** | `ui/` | Keep or enhance | No | ⏳ Pending |

**Aceternity Components to Install**:
```bash
npx shadcn@latest add https://ui.aceternity.com/registry/animated-tooltip.json --yes
```

### Background Effects

| Current Component | Path | Aceternity Replacement | Pro? | Status |
|-------------------|------|----------------------|------|--------|
| **Hero sections** | Various pages | `aurora-background`, `sparkles` | No | ⏳ Pending |
| **Landing pages** | Marketing | `spotlight`, `gradient-animation` | Yes | ⏳ Pending |

**Aceternity Components to Install**:
```bash
npx shadcn@latest add https://ui.aceternity.com/registry/aurora-background.json --yes
npx shadcn@latest add https://ui.aceternity.com/registry/sparkles.json --yes
npx shadcn@latest add https://ui.aceternity.com/registry/spotlight.json --yes
```

## Components to Keep (shadcn fallback)

These components don't have direct Aceternity equivalents and will remain as shadcn/ui:

| Component | Path | Reason | Status |
|-----------|------|--------|--------|
| **form.tsx** | `ui/` | React Hook Form integration, no Aceternity equivalent | Keep |
| **command.tsx** | `ui/` | Command palette, works well | Keep |
| **accordion.tsx** | `ui/` | No Aceternity equivalent | Keep |
| **collapsible.tsx** | `ui/` | No Aceternity equivalent | Keep |
| **pagination.tsx** | `ui/` | No Aceternity equivalent | Keep |
| **progress.tsx** | `ui/` | No Aceternity equivalent | Keep |
| **scroll-area.tsx** | `ui/` | Works well, no replacement needed | Keep |
| **separator.tsx** | `ui/` | Simple component, no replacement needed | Keep |
| **badge.tsx** | `ui/` | No Aceternity equivalent | Keep |
| **avatar.tsx** | `ui/` | No Aceternity equivalent | Keep |
| **skeleton.tsx** | `ui/` | Loading state, no replacement needed | Keep |
| **label.tsx** | `ui/` | Form label, no replacement needed | Keep |
| **switch.tsx** | `ui/` | Toggle switch, no replacement needed | Keep |

## Migration Statistics

| Category | Total Components | Aceternity Free | Aceternity Pro | Kibo-UI | Keep shadcn | Custom Build |
|----------|-----------------|----------------|----------------|---------|-------------|--------------|
| Navigation & Layout | 7 | 4 | 2 | 0 | 1 | 0 |
| Forms & Inputs | 13 | 3 | 1 | 0 | 5 | 4 |
| Data Display | 30 | 6 | 3 | 1 | 6 | 14 |
| Dashboard & Analytics | 6 | 2 | 3 | 0 | 0 | 1 |
| Buttons | 3 | 2 | 0 | 0 | 1 | 0 |
| Modals & Dialogs | 5 | 1 | 0 | 0 | 3 | 1 |
| Effects | 2 | 2 | 0 | 0 | 0 | 0 |
| Keep as-is | 14 | 0 | 0 | 0 | 14 | 0 |
| **TOTAL** | **80** | **20** | **9** | **1** | **30** | **20** |

## Timeline Estimate

- **Week 2**: Navigation & Layout (7 components)
- **Week 3**: Forms & Inputs (13 components)
- **Week 4-5**: Data Display (30 components)
- **Week 6**: Dashboard & Analytics (6 components)
- **Week 7-8**: Special Components & Polish (24 components)
- **Week 9**: QA & Cleanup
- **Week 10**: Deployment

**Total Duration**: 10 weeks for complete migration

## Next Actions

1. ✅ Install Aceternity components for Phase 1 (Navigation)
2. Create feature branch: `feature/aceternity-ui-migration`
3. Begin Navigation & Layout migration (Week 2)
4. Test thoroughly with mobile + RTL
5. Review and iterate

## Notes

- All Aceternity components need RTL adaptation (logical properties)
- Test every component on 375px viewport (mobile-first)
- Ensure animations respect `prefers-reduced-motion`
- Performance test with Lighthouse (target: >90)
- Accessibility test with axe DevTools (target: WCAG AA)
