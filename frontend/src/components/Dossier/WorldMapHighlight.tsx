/**
 * World Map Highlight Component
 *
 * Displays a world map with a specific country highlighted and centered.
 * Uses the compressed world-compressed.svg file (228KB).
 *
 * Features:
 * - Highlights the selected country with glow effect
 * - Centers the country in the viewport using viewBox transformation
 * - Falls back to Globe icon if map fails to load
 * - Mobile-first responsive design
 * - RTL compatible
 */

import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface WorldMapHighlightProps {
  countryCode: string;
  className?: string;
}

export function WorldMapHighlight({ countryCode, className }: WorldMapHighlightProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    const container = svgContainerRef.current;
    if (!container || !countryCode) return;

    // Use the compressed world map SVG (228KB)
    fetch('/assets/maps/world-compressed.svg')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load world map');
        return response.text();
      })
      .then((svgText) => {
        container.innerHTML = svgText;
        setMapLoaded(true);

        // Get the SVG element
        const svgElement = container.querySelector('svg');
        if (!svgElement) return;

        // Make SVG responsive
        svgElement.setAttribute('width', '100%');
        svgElement.setAttribute('height', '100%');
        svgElement.style.display = 'block';

        // Find the target country path by ID (ISO 2-letter code)
        const countryPath = svgElement.querySelector(`#${countryCode.toUpperCase()}`);

        if (countryPath) {
          // Get the bounding box of the country
          const bbox = (countryPath as SVGPathElement).getBBox();

          // Calculate viewBox to center the country with some padding
          const padding = Math.max(bbox.width, bbox.height) * 0.3; // 30% padding
          const viewBoxX = bbox.x - padding;
          const viewBoxY = bbox.y - padding;
          const viewBoxWidth = bbox.width + padding * 2;
          const viewBoxHeight = bbox.height + padding * 2;

          // Set viewBox to center the country
          svgElement.setAttribute(
            'viewBox',
            `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`
          );

          // Style all paths (base map)
          const allPaths = svgElement.querySelectorAll('path');
          allPaths.forEach((path) => {
            (path as SVGPathElement).style.fill = '#e5e7eb'; // Light gray
            (path as SVGPathElement).style.stroke = '#ffffff';
            (path as SVGPathElement).style.strokeWidth = '1';
            (path as SVGPathElement).style.transition = 'all 0.3s ease';
          });

          // Highlight the target country
          (countryPath as SVGPathElement).style.fill = 'currentColor'; // Uses theme color
          (countryPath as SVGPathElement).style.stroke = '#ffffff';
          (countryPath as SVGPathElement).style.strokeWidth = '2';
          (countryPath as SVGPathElement).style.filter =
            'drop-shadow(0 0 10px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))';
        } else {
          console.warn(`Country with code "${countryCode}" not found in map`);
          setMapError(true);
        }
      })
      .catch((error) => {
        console.error('Error loading world map:', error);
        setMapError(true);
      });
  }, [countryCode]);

  if (mapError) {
    return (
      <div
        className={cn(
          'relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10',
          'min-h-64 sm:min-h-80',
          className
        )}
      >
        <Globe className="h-24 w-24 sm:h-32 sm:w-32 text-primary/30" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10',
        'min-h-64 sm:min-h-80',
        'text-primary', // Sets the color for the highlighted country
        className
      )}
    >
      {/* SVG container - fills entire space with no padding */}
      <div
        ref={svgContainerRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: mapLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
        }}
      />

      {/* Loading state */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Globe className="h-24 w-24 sm:h-32 sm:w-32 text-primary/20 animate-pulse" />
        </div>
      )}
    </div>
  );
}
