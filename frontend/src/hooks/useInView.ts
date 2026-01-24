/**
 * InView Hook
 * @module hooks/useInView
 * @feature 034-dossier-ui-polish
 *
 * Hook for detecting when an element enters/exits the viewport using IntersectionObserver.
 *
 * @description
 * Provides a boolean flag indicating whether a referenced element is currently
 * visible in the viewport. Uses the IntersectionObserver API for efficient detection.
 * Supports custom IntersectionObserver options for threshold and root configuration.
 *
 * Useful for lazy loading, animations, and analytics tracking.
 *
 * @example
 * const ref = useRef(null);
 * const isInView = useInView(ref);
 *
 * return (
 *   <div ref={ref} className={isInView ? 'fade-in' : ''}>
 *     {/* Content */}
 *   </div>
 * );
 */

import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

/**
 * Hook to detect when an element is in the viewport
 *
 * @description
 * Uses IntersectionObserver to track when the referenced element becomes visible.
 * Returns true when the element intersects with the viewport (or custom root).
 * Automatically cleans up the observer on unmount.
 *
 * @param ref - React ref object pointing to the target element
 * @param options - Optional IntersectionObserver configuration (threshold, root, rootMargin)
 * @returns Boolean indicating whether the element is currently in view
 *
 * @example
 * // Basic usage for fade-in animation
 * const ref = useRef<HTMLDivElement>(null);
 * const isInView = useInView(ref);
 *
 * return (
 *   <div ref={ref} className={isInView ? 'animate-fade-in' : 'opacity-0'}>
 *     Content
 *   </div>
 * );
 *
 * @example
 * // Custom threshold (trigger when 50% visible)
 * const isInView = useInView(ref, { threshold: 0.5 });
 *
 * @example
 * // Lazy load images
 * const imageRef = useRef<HTMLImageElement>(null);
 * const isInView = useInView(imageRef);
 *
 * useEffect(() => {
 *   if (isInView && imageRef.current) {
 *     imageRef.current.src = imageRef.current.dataset.src || '';
 *   }
 * }, [isInView]);
 */
export function useInView(
  ref: RefObject<HTMLElement>,
  options?: IntersectionObserverInit
): boolean {
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting)
    }, options)

    observer.observe(ref.current)

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [ref, options])

  return isInView
}