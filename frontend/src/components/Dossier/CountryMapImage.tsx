/**
 * Country Map Image Component
 *
 * Displays an isolated country map from the pre-rendered country assets.
 * Supports 200+ countries with automatic fallback handling.
 *
 * Features:
 * - Dynamic country loading via ISO 2-letter code
 * - Multiple PNG sizes (16-1024px) with srcset for responsive images
 * - SVG vector support for crisp rendering
 * - Automatic fallback to Globe icon for missing countries
 * - Mobile-first responsive design with optimal image selection
 * - RTL compatible
 * - Lazy loading support
 * - Error boundary for graceful degradation
 *
 * Performance:
 * - ~5-20KB per country (vs 228KB for world map)
 * - Instant rendering with optimized PNGs
 * - Perfect for mobile networks
 *
 * @example
 * <CountryMapImage countryCode="sa" size="md" />
 * <CountryMapImage countryCode="us" size="lg" className="h-64" />
 */

import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface CountryMapImageProps {
  /** ISO 2-letter country code (e.g., 'sa', 'us', 'cn') - case insensitive */
  countryCode: string;
  /** Optional CSS classes */
  className?: string;
  /** Base size for the image (used as fallback if srcset fails) */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Show loading state */
  showLoading?: boolean;
  /** Optional alt text override */
  alt?: string;
}

/**
 * Map of size presets to pixel dimensions
 * Matches available PNG sizes in /assets/maps/all_countries/{code}/
 */
const SIZE_MAP = {
  xs: 64,
  sm: 128,
  md: 256,
  lg: 512,
  xl: 1024,
} as const;

export function CountryMapImage({
  countryCode,
  className,
  size = 'md',
  showLoading = true,
  alt,
}: CountryMapImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Normalize country code to lowercase for URL
  const normalizedCode = countryCode.toLowerCase().trim();

  // Base size for fallback
  const baseSize = SIZE_MAP[size];

  // Available PNG sizes for srcset
  const availableSizes = [16, 24, 32, 48, 64, 80, 96, 128, 256, 512, 1024];

  // Build paths
  const basePath = `/assets/maps/all_countries/${normalizedCode}`;
  const svgPath = `${basePath}/vector.svg`;
  const pngPath = (sizeInPx: number) => `${basePath}/${sizeInPx}.png`;

  // Build srcset for responsive loading
  const srcSet = availableSizes.map((s) => `${pngPath(s)} ${s}w`).join(', ');

  // Build sizes attribute for optimal image selection
  // Mobile: use smaller images, Desktop: use larger images
  const sizes = `
    (max-width: 320px) 64px,
    (max-width: 640px) 128px,
    (max-width: 768px) 256px,
    (max-width: 1024px) 512px,
    ${baseSize}px
  `.trim();

  // Handle image load error - fallback to Globe icon
  const handleError = () => {
    console.warn(`Country map not found for code: ${normalizedCode}`);
    setImageError(true);
    setIsLoading(false);
  };

  // Handle successful image load
  const handleLoad = () => {
    setIsLoading(false);
  };

  // Fallback UI for missing country maps or future countries
  if (imageError || !normalizedCode) {
    return (
      <div
        className={cn(
          'relative overflow-hidden flex items-center justify-center',
          'bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg',
          'min-h-32 sm:min-h-48',
          className
        )}
        title={alt || `Map not available for ${countryCode.toUpperCase()}`}
      >
        <Globe className="h-16 w-16 sm:h-24 sm:w-24 text-primary/30" strokeWidth={1.5} />
        {/* Optional: Show country code */}
        <span className="absolute bottom-2 right-2 text-xs text-muted-foreground font-mono">
          {countryCode.toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden flex items-center justify-center',
        'bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg',
        className
      )}
    >
      {/* Loading skeleton */}
      {isLoading && showLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Globe
            className="h-16 w-16 sm:h-24 sm:w-24 text-primary/20 animate-pulse"
            strokeWidth={1.5}
          />
        </div>
      )}

      {/* Picture element with SVG + PNG fallbacks */}
      <picture className="w-full h-full flex items-center justify-center">
        {/* Prefer SVG for crisp vector rendering */}
        <source type="image/svg+xml" srcSet={svgPath} />

        {/* Fallback to optimized PNGs with responsive srcset */}
        <img
          src={pngPath(baseSize)}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt || `Map of ${countryCode.toUpperCase()}`}
          onError={handleError}
          onLoad={handleLoad}
          loading="lazy"
          decoding="async"
          className={cn(
            'object-contain w-full h-full transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            // Add subtle filter for better visual integration
            'filter drop-shadow-sm'
          )}
          style={{
            // Ensure map doesn't exceed container
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        />
      </picture>

      {/* Country code label (optional) */}
      <span className="absolute bottom-2 end-2 text-xs text-muted-foreground font-mono opacity-60">
        {countryCode.toUpperCase()}
      </span>
    </div>
  );
}

/**
 * Lightweight version without loading states (for lists/grids)
 */
export function CountryMapImageSimple({
  countryCode,
  className,
  size = 'sm',
}: Pick<CountryMapImageProps, 'countryCode' | 'className' | 'size'>) {
  return (
    <CountryMapImage
      countryCode={countryCode}
      className={className}
      size={size}
      showLoading={false}
    />
  );
}
