/**
 * BottomSheet Components
 *
 * Mobile-friendly bottom sheet components with:
 * - Drag-to-dismiss gestures
 * - Partial expansion states (snap points)
 * - Automatic keyboard avoidance
 * - Visual handle indicator
 * - RTL support
 */

// Core component exports
export {
  BottomSheet,
  BottomSheetPortal,
  BottomSheetOverlay,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetHandle,
  BottomSheetHeader,
  BottomSheetFooter,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetBody,
  useBottomSheetContext,
  BOTTOM_SHEET_SNAP_POINTS,
  type BottomSheetProps,
  type BottomSheetSnapPreset,
} from '@/components/ui/bottom-sheet'

// Example components
export { BottomSheetFormExample } from './BottomSheetFormExample'
export { BottomSheetDetailExample } from './BottomSheetDetailExample'
