'use client'

import { useRef, useMemo, useCallback } from 'react'
import { motion } from 'motion/react'
import DottedMap from 'dotted-map'

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string }
    end: { lat: number; lng: number; label?: string }
  }>
  lineColor?: string
  theme?: 'light' | 'dark'
  markers?: Array<{
    lat: number
    lng: number
    label?: string
    color?: string
    size?: 'small' | 'medium' | 'large'
    intensity?: number // 0-100 for heatmap
    onClick?: () => void
  }>
  onMarkerClick?: (marker: { lat: number; lng: number; label?: string }) => void
  className?: string
  showLabels?: boolean
  animateConnections?: boolean
}

export default function WorldMap({
  dots = [],
  lineColor = '#0ea5e9',
  theme = 'light',
  markers = [],
  onMarkerClick,
  className = '',
  showLabels = false,
  animateConnections = true,
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  // Memoize the map to avoid recreation on each render
  const map = useMemo(() => new DottedMap({ height: 100, grid: 'diagonal' }), [])

  const svgMap = useMemo(
    () =>
      map.getSVG({
        radius: 0.22,
        color: theme === 'dark' ? '#FFFFFF40' : '#00000040',
        shape: 'circle',
        backgroundColor: theme === 'dark' ? 'black' : 'white',
      }),
    [map, theme],
  )

  const projectPoint = useCallback((lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360)
    const y = (90 - lat) * (400 / 180)
    return { x, y }
  }, [])

  const createCurvedPath = useCallback(
    (start: { x: number; y: number }, end: { x: number; y: number }) => {
      const midX = (start.x + end.x) / 2
      const midY = Math.min(start.y, end.y) - 50
      return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`
    },
    [],
  )

  // Get marker size in pixels
  const getMarkerSize = useCallback((size?: 'small' | 'medium' | 'large'): number => {
    switch (size) {
      case 'small':
        return 3
      case 'large':
        return 8
      default:
        return 5
    }
  }, [])

  // Get intensity color for heatmap
  const getIntensityColor = useCallback((intensity: number, baseColor: string): string => {
    // Intensity 0-100 maps to opacity
    const alpha = Math.max(0.3, intensity / 100)
    return baseColor
  }, [])

  return (
    <div
      className={`w-full aspect-[2/1] rounded-lg relative font-sans ${theme === 'dark' ? 'bg-black' : 'bg-white'} ${className}`}
    >
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
        alt="world map"
        height="495"
        width="1056"
        draggable={false}
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-none select-none"
      >
        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng)
          const endPoint = projectPoint(dot.end.lat, dot.end.lng)
          return (
            <g key={`path-group-${i}`}>
              {animateConnections ? (
                <motion.path
                  d={createCurvedPath(startPoint, endPoint)}
                  fill="none"
                  stroke="url(#path-gradient)"
                  strokeWidth="1"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 1,
                    delay: 0.5 * i,
                    ease: 'easeOut',
                  }}
                  key={`start-upper-${i}`}
                />
              ) : (
                <path
                  d={createCurvedPath(startPoint, endPoint)}
                  fill="none"
                  stroke="url(#path-gradient)"
                  strokeWidth="1"
                  key={`static-path-${i}`}
                />
              )}
            </g>
          )
        })}

        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {dots.map((dot, i) => (
          <g key={`points-group-${i}`}>
            <g key={`start-${i}`}>
              <circle
                cx={projectPoint(dot.start.lat, dot.start.lng).x}
                cy={projectPoint(dot.start.lat, dot.start.lng).y}
                r="2"
                fill={lineColor}
              />
              <circle
                cx={projectPoint(dot.start.lat, dot.start.lng).x}
                cy={projectPoint(dot.start.lat, dot.start.lng).y}
                r="2"
                fill={lineColor}
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="2"
                  to="8"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
            <g key={`end-${i}`}>
              <circle
                cx={projectPoint(dot.end.lat, dot.end.lng).x}
                cy={projectPoint(dot.end.lat, dot.end.lng).y}
                r="2"
                fill={lineColor}
              />
              <circle
                cx={projectPoint(dot.end.lat, dot.end.lng).x}
                cy={projectPoint(dot.end.lat, dot.end.lng).y}
                r="2"
                fill={lineColor}
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="2"
                  to="8"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          </g>
        ))}

        {/* Render markers */}
        {markers.map((marker, i) => {
          const point = projectPoint(marker.lat, marker.lng)
          const size = getMarkerSize(marker.size)
          const color = marker.color || lineColor
          const intensity = marker.intensity ?? 100
          const opacity = Math.max(0.4, intensity / 100)

          return (
            <g
              key={`marker-${i}`}
              style={{ cursor: marker.onClick || onMarkerClick ? 'pointer' : 'default' }}
              onClick={() => {
                if (marker.onClick) marker.onClick()
                if (onMarkerClick) onMarkerClick(marker)
              }}
              className="pointer-events-auto"
            >
              {/* Marker circle */}
              <circle cx={point.x} cy={point.y} r={size} fill={color} opacity={opacity} />
              {/* Pulse animation for high intensity */}
              {intensity >= 50 && (
                <circle cx={point.x} cy={point.y} r={size} fill={color} opacity="0.5">
                  <animate
                    attributeName="r"
                    from={size.toString()}
                    to={(size * 3).toString()}
                    dur="2s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.5"
                    to="0"
                    dur="2s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              {/* Label */}
              {showLabels && marker.label && (
                <text
                  x={point.x}
                  y={point.y - size - 4}
                  textAnchor="middle"
                  fontSize="8"
                  fill={theme === 'dark' ? '#fff' : '#000'}
                  opacity="0.8"
                >
                  {marker.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// Export types for use in other components
export type { MapProps }
