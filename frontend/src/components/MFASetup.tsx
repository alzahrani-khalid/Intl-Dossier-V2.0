import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../services/auth'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { 
 Shield, 
 QrCode, 
 Copy, 
 Check, 
 Eye, 
 EyeOff, 
 Download,
 AlertCircle
} from 'lucide-react'

interface MFASetupProps {
 onComplete?: () => void
 onCancel?: () => void
}

export function MFASetup({ onComplete, onCancel }: MFASetupProps) {
 const { t } = useTranslation()
 const { enableMFA, verifyMFA, generateBackupCodes, mfaConfig, isLoading, error } = useAuthStore()
 
 const [step, setStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup')
 const [verificationCode, setVerificationCode] = useState('')
 const [secret, setSecret] = useState('')
 const [qrCode, setQrCode] = useState('')
 const [backupCodes, setBackupCodes] = useState<string[]>([])
 const [showBackupCodes, setShowBackupCodes] = useState(false)
 const [copied, setCopied] = useState(false)

 useEffect(() => {
 if (step === 'setup' && !secret) {
 initializeMFA()
 }
 }, [step])

 const initializeMFA = async () => {
 try {
 const result = await enableMFA()
 setSecret(result.secret)
 setQrCode(result.qrCode)
 setBackupCodes(result.backupCodes)
 } catch (error) {
 console.error('Failed to initialize MFA:', error)
 }
 }

 const handleVerify = async () => {
 if (!verificationCode || verificationCode.length !== 6) {
 return
 }

 try {
 await verifyMFA(verificationCode)
 setStep('backup')
 } catch (error) {
 console.error('MFA verification failed:', error)
 }
 }

 const handleGenerateBackupCodes = async () => {
 try {
 const codes = await generateBackupCodes()
 setBackupCodes(codes)
 } catch (error) {
 console.error('Failed to generate backup codes:', error)
 }
 }

 const copyToClipboard = async (text: string) => {
 try {
 await navigator.clipboard.writeText(text)
 setCopied(true)
 setTimeout(() => setCopied(false), 2000)
 } catch (error) {
 console.error('Failed to copy to clipboard:', error)
 }
 }

 const downloadBackupCodes = () => {
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

 if (step === 'setup') {
 return (
 <Card className="mx-auto w-full max-w-md">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Shield className="size-5" />
 Enable Two-Factor Authentication
 </CardTitle>
 <CardDescription>
 Scan the QR code with your authenticator app to set up 2FA
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 {qrCode && (
 <div className="text-center">
 <div className="inline-block rounded-lg border bg-white p-4">
 <img src={qrCode} alt="MFA QR Code" className="size-48" />
 </div>
 </div>
 )}

 {secret && (
 <div className="space-y-2">
 <Label htmlFor="secret">Manual Entry Key</Label>
 <div className="flex gap-2">
 <Input
 id="secret"
 value={secret}
 readOnly
 className="font-mono text-sm"
 />
 <Button
 size="sm"
 variant="outline"
 onClick={() => copyToClipboard(secret)}
 >
 {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
 </Button>
 </div>
 </div>
 )}

 <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
 <div className="flex items-start gap-2">
 <AlertCircle className="mt-0.5 size-4 text-yellow-600 dark:text-yellow-400" />
 <div className="text-sm text-yellow-800 dark:text-yellow-200">
 <p className="font-medium">Important:</p>
 <ul className="mt-1 space-y-1 text-xs">
 <li>• Save this secret key in a secure location</li>
 <li>• Use an authenticator app like Google Authenticator or Authy</li>
 <li>• Do not share this information with anyone</li>
 </ul>
 </div>
 </div>
 </div>

 <div className="flex gap-2">
 <Button onClick={() => setStep('verify')} className="flex-1">
 I've Set Up My Authenticator
 </Button>
 {onCancel && (
 <Button variant="outline" onClick={onCancel}>
 Cancel
 </Button>
 )}
 </div>
 </CardContent>
 </Card>
 )
 }

 if (step === 'verify') {
 return (
 <Card className="mx-auto w-full max-w-md">
 <CardHeader>
 <CardTitle>Verify Setup</CardTitle>
 <CardDescription>
 Enter the 6-digit code from your authenticator app
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="verification-code">Verification Code</Label>
 <Input
 id="verification-code"
 value={verificationCode}
 onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
 placeholder="123456"
 className="text-center font-mono text-lg tracking-widest"
 maxLength={6}
 />
 </div>

 {error && (
 <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
 <div className="flex items-center gap-2">
 <AlertCircle className="size-4 text-red-600 dark:text-red-400" />
 <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
 </div>
 </div>
 )}

 <div className="flex gap-2">
 <Button 
 onClick={handleVerify} 
 disabled={verificationCode.length !== 6 || isLoading}
 className="flex-1"
 >
 {isLoading ? 'Verifying...' : 'Verify & Continue'}
 </Button>
 <Button variant="outline" onClick={() => setStep('setup')}>
 Back
 </Button>
 </div>
 </CardContent>
 </Card>
 )
 }

 if (step === 'backup') {
 return (
 <Card className="mx-auto w-full max-w-md">
 <CardHeader>
 <CardTitle>Backup Codes</CardTitle>
 <CardDescription>
 Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Label>Your Backup Codes</Label>
 <div className="flex gap-2">
 <Button
 size="sm"
 variant="outline"
 onClick={() => setShowBackupCodes(!showBackupCodes)}
 >
 {showBackupCodes ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
 </Button>
 <Button
 size="sm"
 variant="outline"
 onClick={downloadBackupCodes}
 >
 <Download className="size-4" />
 </Button>
 </div>
 </div>
 
 <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
 <div className="grid grid-cols-2 gap-2 font-mono text-sm">
 {backupCodes.map((code, index) => (
 <div key={index} className="flex items-center justify-between">
 <span>{index + 1}.</span>
 <span>{showBackupCodes ? code : '••••••••'}</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
 <div className="flex items-start gap-2">
 <AlertCircle className="mt-0.5 size-4 text-blue-600 dark:text-blue-400" />
 <div className="text-sm text-blue-800 dark:text-blue-200">
 <p className="font-medium">Important:</p>
 <ul className="mt-1 space-y-1 text-xs">
 <li>• Each code can only be used once</li>
 <li>• Store them in a secure location</li>
 <li>• You can generate new codes anytime</li>
 </ul>
 </div>
 </div>
 </div>

 <div className="flex gap-2">
 <Button onClick={() => setStep('complete')} className="flex-1">
 I've Saved My Codes
 </Button>
 <Button 
 variant="outline" 
 onClick={handleGenerateBackupCodes}
 disabled={isLoading}
 >
 {isLoading ? 'Generating...' : 'Generate New Codes'}
 </Button>
 </div>
 </CardContent>
 </Card>
 )
 }

 if (step === 'complete') {
 return (
 <Card className="mx-auto w-full max-w-md">
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
 <Check className="size-5" />
 MFA Enabled Successfully
 </CardTitle>
 <CardDescription>
 Two-factor authentication is now active on your account
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="text-center">
 <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
 <Shield className="mx-auto mb-2 size-12 text-green-600 dark:text-green-400" />
 <p className="text-sm text-green-800 dark:text-green-200">
 Your account is now protected with two-factor authentication
 </p>
 </div>
 </div>

 <div className="flex gap-2">
 <Button onClick={onComplete} className="flex-1">
 Continue
 </Button>
 </div>
 </CardContent>
 </Card>
 )
 }

 return null
}

export default MFASetup

