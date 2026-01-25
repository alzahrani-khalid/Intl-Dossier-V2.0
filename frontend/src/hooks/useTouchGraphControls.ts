/**
 * useTouchGraphControls Hook
 *
 * Provides touch-optimized controls for relationship graph navigation.
 * Features:
 * - Pinch-to-zoom with smooth scaling
 * - Two-finger pan gesture
 * - Tap-to-focus on nodes
 * - Double-tap to expand connections
 * - RTL-aware gesture handling
 *
 * @example
 * const { handlers, zoomLevel, resetView } = useTouchGraphControls({
 *   onNodeFocus: (nodeId) => highlightNode(nodeId),
 *   onNodeExpand: (nodeId) => expandConnections(nodeId),
 *   reactFlowInstance: rfInstance,
 * });
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { ReactFlowInstance, Node } from '@xyflow/react'
import { useHapticFeedback } from './useHapticFeedback'

export interface TouchGraphControlsConfig {
  /** React Flow instance for zoom/pan control */
  reactFlowInstance?: ReactFlowInstance | null
  /** Callback when node is tapped (focused) */
  onNodeFocus?: (nodeId: string) => void
  /** Callback when node is double-tapped (expand connections) */
  onNodeExpand?: (nodeId: string) => void
  /** Callback when zoom level changes */
  onZoomChange?: (zoom: number) => void
  /** Minimum zoom level. Default: 0.1 */
  minZoom?: number
  /** Maximum zoom level. Default: 2 */
  maxZoom?: number
  /** Default zoom level. Default: 1 */
  defaultZoom?: number
  /** Double-tap timeout in ms. Default: 300 */
  doubleTapTimeout?: number
  /** Enable/disable the hook. Default: true */
  enabled?: boolean
}

export interface TouchGraphControlsState {
  /** Current zoom level (0.1 - 2) */
  zoomLevel: number
  /** Zoom as percentage string */
  zoomPercentage: string
  /** Whether pinch gesture is active */
  isPinching: boolean
  /** Whether panning with two fingers */
  isPanning: boolean
  /** Whether any touch gesture is active */
  isGestureActive: boolean
  /** ID of the currently focused node */
  focusedNodeId: string | null
  /** Last tap timestamp for double-tap detection */
  lastTapTime: number
}

export interface TouchGraphControlsHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

export interface TouchGraphControlsResult {
  /** Touch event handlers to attach to the graph container */
  handlers: TouchGraphControlsHandlers
  /** Current state of touch controls */
  state: TouchGraphControlsState
  /** Reset view to default position and zoom */
  resetView: () => void
  /** Zoom in by step */
  zoomIn: (step?: number) => void
  /** Zoom out by step */
  zoomOut: (step?: number) => void
  /** Set zoom to specific level */
  setZoom: (level: number) => void
  /** Focus on a specific node */
  focusNode: (nodeId: string) => void
  /** Fit view to show all nodes */
  fitView: () => void
}

export function useTouchGraphControls(
  config: TouchGraphControlsConfig = {},
): TouchGraphControlsResult {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const haptic = useHapticFeedback()

  const {
    reactFlowInstance,
    onNodeFocus,
    onNodeExpand,
    onZoomChange,
    minZoom = 0.1,
    maxZoom = 2,
    defaultZoom = 1,
    doubleTapTimeout = 300,
    enabled = true,
  } = config

  // State
  const [zoomLevel, setZoomLevel] = useState(defaultZoom)
  const [isPinching, setIsPinching] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
  const [lastTapTime, setLastTapTime] = useState(0)

  // Refs for gesture tracking
  const initialPinchDistance = useRef<number | null>(null)
  const initialZoom = useRef(defaultZoom)
  const lastPanPosition = useRef<{ x: number; y: number } | null>(null)
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTapPosition = useRef<{ x: number; y: number } | null>(null)

  // Sync zoom level with React Flow instance
  useEffect(() => {
    if (reactFlowInstance) {
      const viewport = reactFlowInstance.getViewport()
      setZoomLevel(viewport.zoom)
    }
  }, [reactFlowInstance])

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Calculate center point between two touches
  const getTouchCenter = useCallback(
    (touch1: React.Touch, touch2: React.Touch): { x: number; y: number } => {
      return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      }
    },
    [],
  )

  // Apply zoom with bounds checking
  const applyZoom = useCallback(
    (newZoom: number, center?: { x: number; y: number }) => {
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom))
      setZoomLevel(clampedZoom)
      onZoomChange?.(clampedZoom)

      if (reactFlowInstance) {
        if (center) {
          // Zoom towards the pinch center
          reactFlowInstance.zoomTo(clampedZoom, { duration: 0 })
        } else {
          reactFlowInstance.zoomTo(clampedZoom, { duration: 200 })
        }
      }
    },
    [reactFlowInstance, minZoom, maxZoom, onZoomChange],
  )

  // Handle touch start
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return

      const touches = e.touches

      if (touches.length === 2) {
        // Two-finger gesture start (pinch or pan)
        e.preventDefault()
        const distance = getTouchDistance(touches[0], touches[1])
        initialPinchDistance.current = distance
        initialZoom.current = zoomLevel
        lastPanPosition.current = getTouchCenter(touches[0], touches[1])
        setIsPinching(true)
        haptic.selection()
      } else if (touches.length === 1) {
        // Single tap - check for double-tap
        const now = Date.now()
        const tapPosition = { x: touches[0].clientX, y: touches[0].clientY }

        // Check if this could be a double-tap
        if (
          lastTapPosition.current &&
          now - lastTapTime < doubleTapTimeout &&
          Math.abs(tapPosition.x - lastTapPosition.current.x) < 30 &&
          Math.abs(tapPosition.y - lastTapPosition.current.y) < 30
        ) {
          // Double-tap detected
          if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current)
            tapTimeoutRef.current = null
          }

          // Find node at tap position
          const nodeAtPosition = findNodeAtPosition(tapPosition.x, tapPosition.y)
          if (nodeAtPosition) {
            onNodeExpand?.(nodeAtPosition.id)
            haptic.impact()
          }
          lastTapPosition.current = null
        } else {
          // Potential first tap of double-tap
          lastTapPosition.current = tapPosition
          setLastTapTime(now)
        }
      }
    },
    [
      enabled,
      getTouchDistance,
      getTouchCenter,
      zoomLevel,
      lastTapTime,
      doubleTapTimeout,
      onNodeExpand,
      haptic,
    ],
  )

  // Handle touch move
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return

      const touches = e.touches

      if (touches.length === 2 && initialPinchDistance.current !== null) {
        e.preventDefault()

        // Calculate pinch scale
        const currentDistance = getTouchDistance(touches[0], touches[1])
        const scale = currentDistance / initialPinchDistance.current
        const newZoom = initialZoom.current * scale

        // Apply pinch zoom
        const center = getTouchCenter(touches[0], touches[1])
        applyZoom(newZoom, center)

        // Two-finger pan
        if (lastPanPosition.current && reactFlowInstance) {
          const currentCenter = center
          const dx = currentCenter.x - lastPanPosition.current.x
          const dy = currentCenter.y - lastPanPosition.current.y

          // Apply RTL adjustment for horizontal panning
          const adjustedDx = isRTL ? -dx : dx

          const viewport = reactFlowInstance.getViewport()
          reactFlowInstance.setViewport(
            {
              x: viewport.x + adjustedDx,
              y: viewport.y + dy,
              zoom: viewport.zoom,
            },
            { duration: 0 },
          )
          lastPanPosition.current = currentCenter
          setIsPanning(true)
        }
      }
    },
    [enabled, getTouchDistance, getTouchCenter, applyZoom, reactFlowInstance, isRTL],
  )

  // Handle touch end
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return

      const touches = e.touches

      if (touches.length < 2) {
        // Reset pinch/pan state
        initialPinchDistance.current = null
        lastPanPosition.current = null
        setIsPinching(false)
        setIsPanning(false)
      }

      // Handle single tap (after release)
      if (e.changedTouches.length === 1 && touches.length === 0) {
        const touch = e.changedTouches[0]
        const tapPosition = { x: touch.clientX, y: touch.clientY }

        // Set a timeout for single tap action
        if (!lastTapPosition.current || Date.now() - lastTapTime >= doubleTapTimeout) {
          tapTimeoutRef.current = setTimeout(() => {
            // Single tap - focus on node if any
            const nodeAtPosition = findNodeAtPosition(tapPosition.x, tapPosition.y)
            if (nodeAtPosition) {
              setFocusedNodeId(nodeAtPosition.id)
              onNodeFocus?.(nodeAtPosition.id)
              haptic.selection()
            }
          }, doubleTapTimeout)
        }
      }
    },
    [enabled, lastTapTime, doubleTapTimeout, onNodeFocus, haptic],
  )

  // Find node at screen position (placeholder - would need React Flow integration)
  const findNodeAtPosition = useCallback(
    (x: number, y: number): Node | null => {
      if (!reactFlowInstance) return null

      // Get all nodes and check if any contains the tap position
      const nodes = reactFlowInstance.getNodes()
      const viewport = reactFlowInstance.getViewport()

      // Convert screen coordinates to flow coordinates
      const flowX = (x - viewport.x) / viewport.zoom
      const flowY = (y - viewport.y) / viewport.zoom

      // Find node that contains this position
      for (const node of nodes) {
        if (!node.position || !node.width || !node.height) continue

        const nodeX = node.position.x
        const nodeY = node.position.y
        const nodeWidth = node.width || 200
        const nodeHeight = node.height || 100

        if (
          flowX >= nodeX &&
          flowX <= nodeX + nodeWidth &&
          flowY >= nodeY &&
          flowY <= nodeY + nodeHeight
        ) {
          return node
        }
      }

      return null
    },
    [reactFlowInstance],
  )

  // Reset view to default
  const resetView = useCallback(() => {
    setZoomLevel(defaultZoom)
    setFocusedNodeId(null)
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 })
    }
    haptic.success()
  }, [reactFlowInstance, defaultZoom, haptic])

  // Zoom in
  const zoomIn = useCallback(
    (step = 0.2) => {
      const newZoom = Math.min(maxZoom, zoomLevel + step)
      applyZoom(newZoom)
      haptic.selection()
    },
    [zoomLevel, maxZoom, applyZoom, haptic],
  )

  // Zoom out
  const zoomOut = useCallback(
    (step = 0.2) => {
      const newZoom = Math.max(minZoom, zoomLevel - step)
      applyZoom(newZoom)
      haptic.selection()
    },
    [zoomLevel, minZoom, applyZoom, haptic],
  )

  // Set specific zoom level
  const setZoom = useCallback(
    (level: number) => {
      applyZoom(level)
    },
    [applyZoom],
  )

  // Focus on a specific node
  const focusNode = useCallback(
    (nodeId: string) => {
      if (!reactFlowInstance) return

      const node = reactFlowInstance.getNodes().find((n) => n.id === nodeId)
      if (node) {
        setFocusedNodeId(nodeId)
        reactFlowInstance.setCenter(
          node.position.x + (node.width || 200) / 2,
          node.position.y + (node.height || 100) / 2,
          { zoom: 1, duration: 500 },
        )
        onNodeFocus?.(nodeId)
        haptic.impact()
      }
    },
    [reactFlowInstance, onNodeFocus, haptic],
  )

  // Fit view to show all nodes
  const fitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 })
      const viewport = reactFlowInstance.getViewport()
      setZoomLevel(viewport.zoom)
    }
  }, [reactFlowInstance])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current)
      }
    }
  }, [])

  // Memoize handlers
  const handlers = useMemo<TouchGraphControlsHandlers>(
    () => ({
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    }),
    [onTouchStart, onTouchMove, onTouchEnd],
  )

  // Memoize state
  const state = useMemo<TouchGraphControlsState>(
    () => ({
      zoomLevel,
      zoomPercentage: `${Math.round(zoomLevel * 100)}%`,
      isPinching,
      isPanning,
      isGestureActive: isPinching || isPanning,
      focusedNodeId,
      lastTapTime,
    }),
    [zoomLevel, isPinching, isPanning, focusedNodeId, lastTapTime],
  )

  return {
    handlers,
    state,
    resetView,
    zoomIn,
    zoomOut,
    setZoom,
    focusNode,
    fitView,
  }
}

export default useTouchGraphControls
