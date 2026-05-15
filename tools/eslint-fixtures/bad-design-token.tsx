// Phase 51 D-10 regression fixture for design-token compliance.
// `pnpm lint tools/eslint-fixtures/bad-design-token.tsx` MUST exit non-zero
// after Phase 51 flips D-05 from warn to error.
// The fixture deliberately includes raw hex, palette literal, and template literal violations.
// See frontend/src/index.css @theme block and CLAUDE.md Design rules.

const flag = true

const badDesignTokenFixture = (
  <div style={{ color: '#3B82F6' }}>
    <span className="bg-red-500">bad palette literal</span>
    <span className={`text-red-500 ${flag ? 'font-medium' : ''}`}>
      bad template literal
    </span>
  </div>
)

void badDesignTokenFixture

export {}
