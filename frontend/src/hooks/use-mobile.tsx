/**
 * Mobile Detection Hook
 * @module hooks/use-mobile
 * @feature 034-dossier-ui-polish
 *
 * Simple hook for detecting mobile viewport sizes.
 *
 * @description
 * Provides a boolean flag for mobile detection based on a 768px breakpoint.
 * Uses window.matchMedia for efficient media query matching.
 * Returns undefined initially for SSR compatibility.
 *
 * @example
 * const isMobile = useIsMobile();
 * if (isMobile) {
 *   return <MobileView />;
 * }
 */

import * as React from "react"

/** Mobile breakpoint threshold in pixels */
const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect if viewport is mobile-sized
 *
 * @description
 * Returns true if viewport width is less than 768px.
 * Uses matchMedia API for efficient detection.
 * Returns false during SSR/initial render (coerced from undefined).
 *
 * @returns Boolean indicating mobile viewport
 *
 * @example
 * const isMobile = useIsMobile();
 * return isMobile ? <MobileLayout /> : <DesktopLayout />;
 */
export function useIsMobile() {
 const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

 React.useEffect(() => {
 const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
 const onChange = () => {
 setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
 }
 mql.addEventListener("change", onChange)
 setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
 return () => mql.removeEventListener("change", onChange)
 }, [])

 return !!isMobile
}
