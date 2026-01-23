/**
 * Toast Hook
 *
 * Wrapper around react-hot-toast for consistent toast notifications
 * across the application.
 */

import toast from 'react-hot-toast';

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

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
