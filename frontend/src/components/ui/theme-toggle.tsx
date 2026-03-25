/**
 * ThemeToggle Component
 *
 * A HeroUI-based theme toggle that supports light/dark/system modes.
 * Mobile-first, RTL-compatible with proper touch targets.
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Sun, Moon, Monitor, ChevronDown, Check } from 'lucide-react'
import { Button, Dropdown } from '@heroui/react'
import { cn } from '@/lib/utils'
import { useTheme, AVAILABLE_COLOR_MODES } from '@/components/theme-provider/theme-provider'
import { useDirection } from '@/hooks/useDirection'

type ColorMode = 'light' | 'dark' | 'system'

interface ThemeToggleProps {
  /** Show as icon-only button */
  iconOnly?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional class names */
  className?: string
  /** Whether to show dropdown for all options */
  showDropdown?: boolean
}

/** Icon components for each mode */
const modeIcons: Record<ColorMode, React.ElementType> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

/** Translation keys for each mode */
const modeLabels: Record<ColorMode, { en: string; ar: string }> = {
  light: { en: 'Light', ar: 'فاتح' },
  dark: { en: 'Dark', ar: 'داكن' },
  system: { en: 'System', ar: 'النظام' },
}

export function ThemeToggle({
  iconOnly = false,
  size = 'sm',
  className,
  showDropdown = true,
}: ThemeToggleProps) {
  const { t } = useTranslation(['common'])
  const { colorMode, resolvedColorMode, setColorMode, toggleColorMode } = useTheme()
  const { isRTL } = useDirection()
// Get current icon based on resolved mode (what's actually shown)
  const CurrentIcon = modeIcons[resolvedColorMode]

  // Get current mode label
  const currentLabel = isRTL ? modeLabels[colorMode].ar : modeLabels[colorMode].en

  const handleModeChange = useCallback(
    (key: string | number) => {
      const mode = key as ColorMode
      if (AVAILABLE_COLOR_MODES.includes(mode)) {
        setColorMode(mode)
      }
    },
    [setColorMode],
  )

  // Size mappings
  const sizeClasses = {
    sm: 'min-h-9 min-w-9',
    md: 'min-h-10 min-w-10',
    lg: 'min-h-11 min-w-11',
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-5 w-5',
  }

  // Simple toggle mode (just light/dark toggle)
  if (!showDropdown) {
    return (
      <Button
        isIconOnly={iconOnly}
        size={size}
        variant="secondary"
        onPress={toggleColorMode}
        className={cn(
          sizeClasses[size],
          'bg-default-100 hover:bg-default-200 transition-colors',
          className,
        )}
        aria-label={
          resolvedColorMode === 'light'
            ? t('common.switchToDark', 'Switch to dark mode')
            : t('common.switchToLight', 'Switch to light mode')
        }
      >
        <CurrentIcon className={iconSizes[size]} />
        {!iconOnly && <span className="ms-2 text-sm">{currentLabel}</span>}
      </Button>
    )
  }

  // Dropdown mode with all options
  return (
    <Dropdown>
      <Dropdown.Trigger>
        <Button
          isIconOnly={iconOnly}
          size={size}
          variant="secondary"
          className={cn(
            sizeClasses[size],
            'bg-default-100 hover:bg-default-200 transition-colors',
            !iconOnly && 'px-3',
            className,
          )}
          aria-label={t('common.selectTheme', 'Select theme')}
        >
          <CurrentIcon className={iconSizes[size]} />
          {!iconOnly && (
            <>
              <span className="ms-2 text-sm">{currentLabel}</span>
              <ChevronDown className="ms-1 h-3 w-3 text-muted-foreground" />
            </>
          )}
        </Button>
      </Dropdown.Trigger>

      <Dropdown.Popover placement={isRTL ? 'bottom end' : 'bottom start'}>
        <Dropdown.Menu
          aria-label={t('common.themeOptions', 'Theme options')}
          selectionMode="single"
          selectedKeys={new Set([colorMode])}
          onAction={handleModeChange}
        >
          {AVAILABLE_COLOR_MODES.map((mode) => {
            const Icon = modeIcons[mode]
            const label = isRTL ? modeLabels[mode].ar : modeLabels[mode].en
            const isSelected = colorMode === mode

            return (
              <Dropdown.Item key={mode} id={mode} textValue={label} className="min-h-10">
                <div className="flex items-center gap-3 w-full">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{label}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
              </Dropdown.Item>
            )
          })}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}

/**
 * Simple theme toggle button (just light/dark)
 * For use in compact spaces like headers
 */
export function ThemeToggleSimple({
  className,
  size = 'sm',
}: Pick<ThemeToggleProps, 'className' | 'size'>) {
  const { t } = useTranslation(['common'])
  const { resolvedColorMode, toggleColorMode } = useTheme()

  const Icon = resolvedColorMode === 'light' ? Moon : Sun

  return (
    <Button
      isIconOnly
      size={size}
      variant="secondary"
      onPress={toggleColorMode}
      className={cn(
        'bg-default-100 hover:bg-default-200 transition-colors',
        size === 'sm' && 'min-h-9 min-w-9',
        size === 'md' && 'min-h-10 min-w-10',
        className,
      )}
      aria-label={
        resolvedColorMode === 'light'
          ? t('common.switchToDark', 'Switch to dark mode')
          : t('common.switchToLight', 'Switch to light mode')
      }
    >
      <Icon className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
    </Button>
  )
}

export default ThemeToggle
