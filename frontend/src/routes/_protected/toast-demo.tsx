/**
 * Route: /toast-demo
 * Toast Variants Demo Page
 * Feature: 007-add-success-and-warning-toast-variants
 */

import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

export const Route = createFileRoute('/_protected/toast-demo')({
  component: ToastDemoPage,
})

function ToastDemoPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { toast } = useToast()

  const showDefaultToast = () => {
    toast({
      title: 'Default Toast',
      description: 'This is a neutral informational message.',
      variant: 'default',
    })
  }

  const showSuccessToast = () => {
    toast({
      title: 'Success!',
      description: 'Your changes have been saved successfully.',
      variant: 'success',
    })
  }

  const showWarningToast = () => {
    toast({
      title: 'Warning',
      description: 'Your session will expire in 5 minutes.',
      variant: 'warning',
    })
  }

  const showDestructiveToast = () => {
    toast({
      title: 'Error',
      description: 'Failed to save changes. Please try again.',
      variant: 'destructive',
    })
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Toast Variants Demo</h1>
        <p className="text-muted-foreground mt-1">
          Test all toast notification variants with different colors and styles
        </p>
      </div>

      {/* Demo Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Toast Notification Variants</CardTitle>
          <CardDescription>
            Click each button to test the corresponding toast variant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Default Toast */}
            <Button
              onClick={showDefaultToast}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
            >
              <div className="flex items-center gap-2 w-full">
                <Info className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">Default</span>
              </div>
              <span className="text-xs text-muted-foreground text-start">
                Neutral informational messages
              </span>
            </Button>

            {/* Success Toast */}
            <Button
              onClick={showSuccessToast}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 border-green-500/50 hover:bg-green-500/10"
            >
              <div className="flex items-center gap-2 w-full">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-700 dark:text-green-400">Success</span>
              </div>
              <span className="text-xs text-muted-foreground text-start">
                Successful operations and confirmations
              </span>
            </Button>

            {/* Warning Toast */}
            <Button
              onClick={showWarningToast}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 border-yellow-500/50 hover:bg-yellow-500/10"
            >
              <div className="flex items-center gap-2 w-full">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-700 dark:text-yellow-400">Warning</span>
              </div>
              <span className="text-xs text-muted-foreground text-start">
                Important warnings and cautions
              </span>
            </Button>

            {/* Destructive Toast */}
            <Button
              onClick={showDestructiveToast}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 border-red-500/50 hover:bg-red-500/10"
            >
              <div className="flex items-center gap-2 w-full">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-700 dark:text-red-400">Destructive</span>
              </div>
              <span className="text-xs text-muted-foreground text-start">
                Errors and critical failures
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ToastDemoPage
