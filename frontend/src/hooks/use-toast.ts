/**
 * Toast Hook
 * @module hooks/use-toast
 * @feature 034-dossier-ui-polish
 *
 * Wrapper around react-hot-toast for consistent toast notifications across the application.
 *
 * @description
 * This module provides a unified toast notification hook with support for:
 * - Success, error (destructive), and default toast variants
 * - Title and optional description
 * - Customizable duration
 * - Consistent styling across the application
 *
 * Mobile-first design with RTL support.
 *
 * @example
 * // Success toast
 * const { toast } = useToast();
 * toast({ title: 'Saved!', variant: 'success' });
 *
 * @example
 * // Error toast with description
 * const { toast } = useToast();
 * toast({
 *   title: 'Error',
 *   description: 'Failed to save dossier',
 *   variant: 'destructive',
 * });
 *
 * @example
 * // Custom duration
 * const { toast } = useToast();
 * toast({ title: 'Processing...', duration: 8000 });
 */

import toast from 'react-hot-toast';

/**
 * Toast variant types
 *
 * @typedef {'default' | 'destructive' | 'success'} ToastVariant
 */
type ToastVariant = 'default' | 'destructive' | 'success';

/**
 * Toast configuration options
 *
 * @interface ToastOptions
 * @property {string} title - Main toast message (required)
 * @property {string} [description] - Optional secondary message
 * @property {ToastVariant} [variant='default'] - Toast style variant
 * @property {number} [duration=4000] - Display duration in milliseconds
 */
interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

/**
 * Hook to show toast notifications
 *
 * @description
 * Provides a toast function for displaying notifications with consistent styling.
 * Automatically formats title and description, applies variant styles,
 * and handles duration.
 *
 * @returns Object containing toast function
 *
 * @example
 * const { toast } = useToast();
 * toast({ title: 'Success!', variant: 'success' });
 */
export function useToast() {
  const showToast = (options: ToastOptions) => {
    const { title, description, variant = 'default', duration = 4000 } = options;

    const message = description ? `${title}\n${description}` : title;

    switch (variant) {
      case 'destructive':
        toast.error(message, { duration });
        break;
      case 'success':
        toast.success(message, { duration });
        break;
      default:
        toast(message, { duration });
    }
  };

  return {
    toast: showToast,
  };
}
