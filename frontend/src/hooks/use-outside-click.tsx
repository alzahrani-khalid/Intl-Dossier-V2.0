/**
 * Outside Click Hook
 * @module hooks/use-outside-click
 * @feature 034-dossier-ui-polish
 *
 * Hook for detecting clicks outside a referenced element.
 *
 * @description
 * Listens for mousedown and touchstart events on the document and triggers
 * a callback when a click occurs outside the referenced element.
 * Useful for closing dropdowns, modals, and popovers.
 *
 * Supports both mouse and touch events for mobile compatibility.
 *
 * @example
 * const ref = useRef(null);
 * useOutsideClick(ref, () => setIsOpen(false));
 *
 * return <div ref={ref}>{/* Dropdown content */}</div>;
 */

import { useEffect, RefObject } from "react";

/**
 * Hook to detect clicks outside a referenced element
 *
 * @description
 * Attaches event listeners to detect clicks outside the provided element ref.
 * Calls the callback function when an outside click is detected.
 * Automatically cleans up listeners on unmount.
 *
 * @param ref - React ref object pointing to the target element
 * @param callback - Function to call when outside click is detected
 *
 * @example
 * // Close dropdown on outside click
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * useOutsideClick(dropdownRef, () => setIsOpen(false));
 *
 * return (
 *   <div ref={dropdownRef} className="dropdown">
 *     {/* Dropdown content */}
 *   </div>
 * );
 *
 * @example
 * // Close modal on outside click
 * const modalRef = useRef<HTMLDivElement>(null);
 * useOutsideClick(modalRef, handleClose);
 */
export const useOutsideClick = (
  ref: RefObject<HTMLElement>,
  callback: () => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      callback();
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
};
