import type { Locator, Page } from '@playwright/test'

export type DossierTabName = 'overview' | 'engagements' | 'docs' | 'tasks' | 'timeline'

// Maps a tab key to a regex matching its rendered label (English + Arabic).
// Labels come from the `dossier-shell` i18n namespace (tabs.*). Note that the
// `docs` tab renders as "Documents", so a /docs/ pattern would not match.
const TAB_LABEL_PATTERNS: Record<DossierTabName, RegExp> = {
  overview: /overview|نظرة عامة/i,
  engagements: /engagements|المشاركات/i,
  docs: /documents|المستندات/i,
  tasks: /tasks|المهام/i,
  timeline: /timeline|الجدول الزمني/i,
}

export default class DossierDetailPage {
  constructor(public readonly page: Page) {}

  tab(name: DossierTabName): Locator {
    return this.page.getByRole('tab', { name: TAB_LABEL_PATTERNS[name] })
  }

  // The RelationshipSidebar renders as a persistent desktop <aside>
  // (landmark role="complementary") that carries aria-expanded; it is not a
  // testid'd drawer. On desktop it is always present and toggled (not hidden).
  get relationshipSidebar(): Locator {
    return this.page.getByRole('complementary')
  }

  get collapseSidebarButton(): Locator {
    return this.page.getByRole('button', { name: /collapse sidebar|طي الشريط الجانبي/i })
  }

  get expandSidebarButton(): Locator {
    return this.page.getByRole('button', { name: /expand sidebar|توسيع الشريط الجانبي/i })
  }

  async gotoById(id: string): Promise<void> {
    await this.page.goto(`/dossiers/countries/${id}`)
  }

  async openTab(name: DossierTabName): Promise<void> {
    await this.tab(name).click()
  }

  async collapseRelationshipSidebar(): Promise<void> {
    await this.collapseSidebarButton.click()
  }

  async expandRelationshipSidebar(): Promise<void> {
    await this.expandSidebarButton.click()
  }
}
