import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../services/auth'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { 
  Shield, 
  Settings, 
  Trash2, 
  RefreshCw, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { MFASetup } from './MFASetup'

interface MFAManagementProps {
  className?: string
}

export function MFAManagement({ className }: MFAManagementProps) {
  const { t } = useTranslation()
  const { 
    mfaConfig, 
    isLoading, 
    error, 
    enableMFA, 
    disableMFA, 
    generateBackupCodes,
    refreshMFAConfig 
  } = useAuthStore()
  
  const [showSetup, setShowSetup] = useState(false)
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  useEffect(() => {
    refreshMFAConfig()
  }, [])

  const handleEnableMFA = () => {
    setShowSetup(true)
  }

  const handleDisableMFA = async () => {
    try {
      await disableMFA()
      setShowDisableConfirm(false)
    } catch (error) {
      console.error('Failed to disable MFA:', error)
    }
  }

  const handleGenerateBackupCodes = async () => {
    try {
      const codes = await generateBackupCodes()
      setBackupCodes(codes)
      setShowBackupCodes(true)
    } catch (error) {
      console.error('Failed to generate backup codes:', error)
    }
  }

  const downloadBackupCodes = () => {
    if (!backupCodes.length) return
    
    const content = `GASTAT International Dossier - MFA Backup Codes\n\n${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nGenerated: ${new Date().toLocaleString()}\n\nKeep these codes safe and do not share them.`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mfa-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (showSetup) {
    return (
      <div className={className}>
        <MFASetup 
          onComplete={() => {
            setShowSetup(false)
            refreshMFAConfig()
          }}
          onCancel={() => setShowSetup(false)}
        />
      </div>
    )
  }

  if (showBackupCodes) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Backup Codes Generated
          </CardTitle>
          <CardDescription>
            Save these codes in a secure location. Each code can only be used once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{index + 1}.</span>
                  <span>{code}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={downloadBackupCodes} className="flex-1">
              <Download className="me-2 size-4" />
              Download Codes
            </Button>
            <Button variant="outline" onClick={() => setShowBackupCodes(false)}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Two-Factor Authentication</span>
              {mfaConfig?.enabled ? (
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="me-1 size-3" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Disabled
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {mfaConfig?.enabled 
                ? 'Your account is protected with 2FA'
                : 'Add an extra layer of security to your account'
              }
            </p>
          </div>
          
          <Switch
            checked={mfaConfig?.enabled || false}
            onCheckedChange={(checked) => {
              if (checked) {
                handleEnableMFA()
              } else {
                setShowDisableConfirm(true)
              }
            }}
            disabled={isLoading}
          />
        </div>

        {mfaConfig?.enabled && (
          <div className="space-y-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 size-4 text-green-600 dark:text-green-400" />
                <div className="text-sm text-green-800 dark:text-green-200">
                  <p className="font-medium">2FA is active</p>
                  <p>Your account is protected with two-factor authentication</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleGenerateBackupCodes}
                disabled={isLoading}
                className="flex-1"
              >
                <RefreshCw className="me-2 size-4" />
                Generate New Backup Codes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDisableConfirm(true)}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="me-2 size-4" />
                Disable 2FA
              </Button>
            </div>
          </div>
        )}

        {showDisableConfirm && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-5 text-red-600 dark:text-red-400" />
              <div className="space-y-2">
                <h4 className="font-medium text-red-800 dark:text-red-200">
                  Disable Two-Factor Authentication?
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This will remove the extra security layer from your account. 
                  You'll only need your password to sign in.
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={handleDisableMFA}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Disabling...' : 'Yes, Disable 2FA'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowDisableConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MFAManagement

