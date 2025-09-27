import { AxeBuilder } from '@axe-core/playwright'

export const axeConfig = {
  // WCAG 2.1 AA compliance
  rules: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-order-semantics': { enabled: true },
    'aria-labels': { enabled: true },
    'aria-roles': { enabled: true },
    'aria-properties': { enabled: true },
    'aria-required-children': { enabled: true },
    'aria-required-parent': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'aria-valid-role': { enabled: true },
    'aria-allowed-attr': { enabled: true },
    'aria-allowed-role': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-unsupported-elements': { enabled: true },
    'aria-hidden-body': { enabled: true },
    'aria-hidden-focus': { enabled: true },
    'aria-input-field-name': { enabled: true },
    'aria-meter-name': { enabled: true },
    'aria-progressbar-name': { enabled: true },
    'aria-slider-name': { enabled: true },
    'aria-spinbutton-name': { enabled: true },
    'aria-switch-name': { enabled: true },
    'aria-tablist-name': { enabled: true },
    'aria-tooltip-name': { enabled: true },
    'aria-treeitem-name': { enabled: true },
    'button-name': { enabled: true },
    'checkboxgroup': { enabled: true },
    'color-contrast-enhanced': { enabled: true },
    'color-contrast': { enabled: true },
    'document-title': { enabled: true },
    'duplicate-id': { enabled: true },
    'duplicate-id-active': { enabled: true },
    'duplicate-id-aria': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'frame-title': { enabled: true },
    'heading-order': { enabled: true },
    'html-has-lang': { enabled: true },
    'html-lang-valid': { enabled: true },
    'html-valid': { enabled: true },
    'image-alt': { enabled: true },
    'input-button-name': { enabled: true },
    'input-image-alt': { enabled: true },
    'label': { enabled: true },
    'link-name': { enabled: true },
    'list': { enabled: true },
    'listitem': { enabled: true },
    'marquee': { enabled: true },
    'meta-refresh': { enabled: true },
    'meta-viewport': { enabled: true },
    'object-alt': { enabled: true },
    'radiogroup': { enabled: true },
    'region': { enabled: true },
    'scope': { enabled: true },
    'server-side-image-map': { enabled: true },
    'svg-img-alt': { enabled: true },
    'td-headers-attr': { enabled: true },
    'th-has-data-cells': { enabled: true },
    'valid-lang': { enabled: true },
    'video-caption': { enabled: true },
    'video-description': { enabled: true }
  },
  
  // Tags to include
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
  
  // Exclude certain elements from testing
  exclude: [
    '[data-testid="skip-link"]',
    '[data-testid="external-link"]',
    '[data-testid="third-party-widget"]'
  ],
  
  // Include specific elements
  include: [
    'main',
    '[role="main"]',
    '[data-testid="main-content"]'
  ]
}

export const createAxeBuilder = (page: any) => {
  return new AxeBuilder({ page })
    .withTags(axeConfig.tags)
    .withRules(axeConfig.rules)
    .exclude(axeConfig.exclude)
    .include(axeConfig.include)
}

export const runAccessibilityTest = async (page: any, options?: {
  include?: string[]
  exclude?: string[]
  tags?: string[]
}) => {
  const builder = createAxeBuilder(page)
  
  if (options?.include) {
    builder.include(options.include)
  }
  
  if (options?.exclude) {
    builder.exclude(options.exclude)
  }
  
  if (options?.tags) {
    builder.withTags(options.tags)
  }
  
  return await builder.analyze()
}

export const checkColorContrast = async (page: any, selector: string) => {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withRules({ 'color-contrast': { enabled: true } })
    .analyze()
  
  return results.violations.filter(v => v.id === 'color-contrast')
}

export const checkKeyboardNavigation = async (page: any, selector: string) => {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withRules({ 'keyboard-navigation': { enabled: true } })
    .analyze()
  
  return results.violations.filter(v => v.id === 'keyboard-navigation')
}

export const checkARIALabels = async (page: any, selector: string) => {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withRules({ 
      'aria-labels': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-valid-attr': { enabled: true }
    })
    .analyze()
  
  return results.violations.filter(v => 
    v.id === 'aria-labels' || 
    v.id === 'aria-required-attr' || 
    v.id === 'aria-valid-attr'
  )
}

export const checkFormAccessibility = async (page: any, formSelector: string) => {
  const results = await new AxeBuilder({ page })
    .include(formSelector)
    .withRules({
      'label': { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-valid-attr': { enabled: true }
    })
    .analyze()
  
  return results.violations.filter(v => 
    v.id === 'label' || 
    v.id === 'form-field-multiple-labels' ||
    v.id === 'aria-required-attr' ||
    v.id === 'aria-valid-attr'
  )
}

export const checkTableAccessibility = async (page: any, tableSelector: string) => {
  const results = await new AxeBuilder({ page })
    .include(tableSelector)
    .withRules({
      'th-has-data-cells': { enabled: true },
      'td-headers-attr': { enabled: true },
      'scope': { enabled: true }
    })
    .analyze()
  
  return results.violations.filter(v => 
    v.id === 'th-has-data-cells' || 
    v.id === 'td-headers-attr' ||
    v.id === 'scope'
  )
}

export const checkModalAccessibility = async (page: any, modalSelector: string) => {
  const results = await new AxeBuilder({ page })
    .include(modalSelector)
    .withRules({
      'aria-hidden-focus': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-valid-attr': { enabled: true },
      'aria-valid-role': { enabled: true }
    })
    .analyze()
  
  return results.violations.filter(v => 
    v.id === 'aria-hidden-focus' || 
    v.id === 'aria-required-attr' ||
    v.id === 'aria-valid-attr' ||
    v.id === 'aria-valid-role'
  )
}

export const checkRTLSupport = async (page: any) => {
  const results = await new AxeBuilder({ page })
    .withRules({
      'html-has-lang': { enabled: true },
      'html-lang-valid': { enabled: true },
      'valid-lang': { enabled: true }
    })
    .analyze()
  
  return results.violations.filter(v => 
    v.id === 'html-has-lang' || 
    v.id === 'html-lang-valid' ||
    v.id === 'valid-lang'
  )
}

export const checkMobileAccessibility = async (page: any) => {
  const results = await new AxeBuilder({ page })
    .withRules({
      'meta-viewport': { enabled: true },
      'color-contrast': { enabled: true },
      'touch-target-size': { enabled: true }
    })
    .analyze()
  
  return results.violations.filter(v => 
    v.id === 'meta-viewport' || 
    v.id === 'color-contrast' ||
    v.id === 'touch-target-size'
  )
}