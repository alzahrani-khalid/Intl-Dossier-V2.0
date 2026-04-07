import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter'

export default class FlakeReporter implements Reporter {
  private retried: { title: string; retry: number }[] = []

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.retry > 0) {
      this.retried.push({
        title: test.titlePath().join(' > '),
        retry: result.retry,
      })
    }
  }

  onEnd(): void {
    if (this.retried.length === 0) return
    console.warn('\n=== RETRIED TESTS (potential flakes) ===')
    for (const t of this.retried) {
      console.warn(`  retry=${t.retry}  ${t.title}`)
    }
    console.warn(`Total retried: ${this.retried.length}`)
    console.warn('=> Log in .planning/phases/18-e2e-test-suite/18-FLAKE-LOG.md')
  }
}
