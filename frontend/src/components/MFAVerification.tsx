import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../services/auth'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { 
  Shield, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface MFAVerificationProps {
  onSuccess: () => void
  onBack: () => void
  onUseBackupCode: () => void
  email: string
}

export function MFAVerification({ onSuccess, onBack, onUseBackupCode, email }: MFAVerificationProps) {
  const { t } = useTranslation()
  const { verifyMFA, verifyBackupCode, isLoading, error } = useAuthStore()
  
  const [code, setCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [isBackupMode, setIsBackupMode] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [isBackupMode])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [timeLeft])

  const handleCodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6)
    setCode(numericValue)
    
    if (numericValue.length === 6) {
      handleVerify()
    }
  }

  const handleBackupCodeChange = (value: string) => {
    const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)
    setBackupCode(alphanumericValue)
    
    if (alphanumericValue.length === 8) {
      handleVerifyBackup()
    }
  }

  const handleVerify = async () => {
    if (code.length !== 6) {
      return
    }

    try {
      await verifyMFA(code)
      onSuccess()
    } catch (error) {
      console.error('MFA verification failed:', error)
      setCode('')
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  const handleVerifyBackup = async () => {
    if (backupCode.length !== 8) {
      return
    }

    try {
      await verifyBackupCode(backupCode)
      onSuccess()
    } catch (error) {
      console.error('Backup code verification failed:', error)
      setBackupCode('')
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  const handleResend = () => {
    // This would typically trigger a new MFA challenge
    // For now, we'll just reset the timer
    setTimeLeft(30)
    setCanResend(false)
  }

  const toggleMode = () => {
    setIsBackupMode(!isBackupMode)
    setCode('')
    setBackupCode('')
    setError(null)
  }

  if (isBackupMode) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Enter Backup Code
          </CardTitle>
          <CardDescription>
            Use one of your saved backup codes to sign in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-code">Backup Code</Label>
            <Input
              ref={inputRef}
              id="backup-code"
              value={backupCode}
              onChange={(e) => handleBackupCodeChange(e.target.value)}
              placeholder="Enter 8-character backup code"
              className="text-center text-lg font-mono tracking-widest"
              maxLength={8}
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">Note:</p>
                <p>Each backup code can only be used once. After use, it will be removed from your account.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleVerifyBackup} 
              disabled={backupCode.length !== 8 || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Verifying...' : 'Verify Backup Code'}
            </Button>
            <Button variant="outline" onClick={toggleMode}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Check your authenticator app for a new code
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mfa-code">Verification Code</Label>
          <Input
            ref={inputRef}
            id="mfa-code"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="123456"
            className="text-center text-lg font-mono tracking-widest"
            maxLength={6}
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Code expires in {timeLeft}s</span>
          </div>
          {canResend && (
            <Button
              variant="link"
              size="sm"
              onClick={handleResend}
              className="p-0 h-auto"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Resend
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleVerify} 
            disabled={code.length !== 6 || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Button>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center">
          <Button
            variant="link"
            size="sm"
            onClick={toggleMode}
            className="text-sm"
          >
            Use backup code instead
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default MFAVerification

