/**
 * Step-Up MFA Component (T063)
 *
 * Purpose: Modal dialog for step-up authentication challenge before approval actions
 * Supports TOTP/SMS/Push challenge types with countdown timer and elevated token storage
 *
 * Features:
 * - Challenge type detection (TOTP/SMS/Push)
 * - 6-digit verification code input
 * - Countdown timer (10 minutes expiry)
 * - Resend code functionality
 * - Error handling with retry logic
 * - Elevated token storage
 * - Auto-trigger before approval actions
 * - Bilingual support (EN/AR)
 * - Full accessibility
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { supabase } from '@/lib/supabase';

interface StepUpMFAProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Action being performed (e.g., 'approve') */
  action: string;
  /** Position ID for the approval action */
  positionId: string;
  /** Callback when verification succeeds, receives elevated token */
  onSuccess: (elevatedToken: string, validUntil: string) => void;
  /** Callback when dialog is closed/cancelled */
  onCancel: () => void;
  /** Optional custom reason for step-up */
  reason?: string;
}

type ChallengeType = 'totp' | 'sms' | 'push';

interface ChallengeData {
  challenge_id: string;
  challenge_type: ChallengeType;
  expires_at: string;
}

interface VerificationResponse {
  elevated_token: string;
  valid_until: string;
}

export function StepUpMFA({
  open,
  action,
  positionId,
  onSuccess,
  onCancel,
  reason,
}: StepUpMFAProps) {
  const { t, i18n } = useTranslation('positions');
  const isRTL = i18n.language === 'ar';

  // State
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isInitiating, setIsInitiating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Format time remaining as MM:SS
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Start countdown timer
   */
  const startTimer = useCallback((expiresAt: string) => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const updateTimer = () => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

      setTimeRemaining(remaining);

      // Enable resend button after 30 seconds for SMS/Push
      if (remaining < 570 && (challengeData?.challenge_type === 'sms' || challengeData?.challenge_type === 'push')) {
        setCanResend(true);
      }

      // Timer expired
      if (remaining === 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setError(t('stepUp.errors.expired'));
      }
    };

    // Initial update
    updateTimer();

    // Update every second
    timerRef.current = setInterval(updateTimer, 1000);
  }, [challengeData?.challenge_type, t]);

  /**
   * Initiate step-up challenge
   */
  const initiateChallenge = useCallback(async () => {
    setIsInitiating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-step-up-initiate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action,
            position_id: positionId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initiate step-up challenge');
      }

      const data: ChallengeData = await response.json();
      setChallengeData(data);
      startTimer(data.expires_at);

      // Focus input after challenge is initiated
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (err) {
      console.error('Failed to initiate step-up challenge:', err);
      setError(err instanceof Error ? err.message : t('stepUp.errors.networkError'));
    } finally {
      setIsInitiating(false);
    }
  }, [action, positionId, startTimer, t]);

  /**
   * Verify step-up code
   */
  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!challengeData) {
      setError(t('stepUp.errors.noChallengeActive'));
      return;
    }

    // Validate code format
    if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
      setError(t('stepUp.errors.invalidFormat'));
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-step-up-complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            challenge_id: challengeData.challenge_id,
            verification_code: verificationCode,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error(t('stepUp.errors.invalidCode'));
        }
        throw new Error(errorData.message || 'Verification failed');
      }

      const data: VerificationResponse = await response.json();

      // Store elevated token in sessionStorage for this session only
      sessionStorage.setItem('elevated_token', data.elevated_token);
      sessionStorage.setItem('elevated_token_valid_until', data.valid_until);

      // Call success callback
      onSuccess(data.elevated_token, data.valid_until);

      // Reset state
      resetState();
    } catch (err) {
      console.error('Failed to verify step-up code:', err);
      setError(err instanceof Error ? err.message : t('stepUp.errors.verificationFailed'));
      setVerificationCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Resend challenge code (for SMS/Push)
   */
  const resendCode = async () => {
    if (!canResend || !challengeData) return;

    setIsResending(true);
    setError(null);
    setCanResend(false);

    try {
      // Re-initiate challenge to get a new code
      await initiateChallenge();
      setVerificationCode('');
    } catch (err) {
      console.error('Failed to resend code:', err);
      setError(t('stepUp.errors.resendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  /**
   * Reset component state
   */
  const resetState = () => {
    setChallengeData(null);
    setVerificationCode('');
    setError(null);
    setTimeRemaining(0);
    setCanResend(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  /**
   * Handle dialog close
   */
  const handleCancel = () => {
    resetState();
    onCancel();
  };

  /**
   * Effect: Initiate challenge when dialog opens
   */
  useEffect(() => {
    if (open && !challengeData) {
      initiateChallenge();
    } else if (!open) {
      resetState();
    }
  }, [open, challengeData, initiateChallenge]);

  /**
   * Effect: Cleanup timer on unmount
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /**
   * Get challenge type label
   */
  const getChallengeTypeLabel = (): string => {
    if (!challengeData) return '';

    switch (challengeData.challenge_type) {
      case 'totp':
        return t('stepUp.challengeTypes.totp');
      case 'sms':
        return t('stepUp.challengeTypes.sms');
      case 'push':
        return t('stepUp.challengeTypes.push');
      default:
        return '';
    }
  };

  /**
   * Get placeholder text based on challenge type
   */
  const getPlaceholder = (): string => {
    if (!challengeData) return '000000';

    switch (challengeData.challenge_type) {
      case 'totp':
        return t('stepUp.placeholders.totp');
      case 'sms':
        return t('stepUp.placeholders.sms');
      case 'push':
        return t('stepUp.placeholders.push');
      default:
        return '000000';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent
        className="max-w-md"
        aria-describedby="step-up-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" aria-hidden="true" />
            <span>{t('stepUp.title')}</span>
          </DialogTitle>
          <DialogDescription id="step-up-description">
            {t('stepUp.description')}
          </DialogDescription>
        </DialogHeader>

        {/* Reason for step-up */}
        {reason && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm text-amber-900">{reason}</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isInitiating && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ms-3 text-sm text-muted-foreground">
              {t('stepUp.initiating')}
            </span>
          </div>
        )}

        {/* Challenge form */}
        {challengeData && !isInitiating && (
          <form onSubmit={verifyCode} className="space-y-4">
            {/* Challenge type info */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm font-medium">
                  {getChallengeTypeLabel()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span
                  aria-live="polite"
                  aria-atomic="true"
                  className={timeRemaining < 60 ? 'text-destructive font-medium' : ''}
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>

            {/* Verification code input */}
            <div className="space-y-2">
              <label
                htmlFor="verification-code"
                className="text-sm font-medium"
              >
                {t('stepUp.codeLabel')}
              </label>
              <Input
                ref={inputRef}
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setVerificationCode(value);
                  setError(null); // Clear error on input
                }}
                placeholder={getPlaceholder()}
                disabled={isVerifying || timeRemaining === 0}
                className="text-center text-2xl tracking-widest font-mono"
                aria-invalid={!!error}
                aria-describedby={error ? 'verification-error' : undefined}
                autoComplete="one-time-code"
              />
            </div>

            {/* Error message */}
            {error && (
              <div
                id="verification-error"
                className="rounded-md bg-destructive/10 border border-destructive/20 p-3"
                role="alert"
              >
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Resend code button (for SMS/Push only) */}
            {(challengeData.challenge_type === 'sms' || challengeData.challenge_type === 'push') && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resendCode}
                disabled={!canResend || isResending || timeRemaining === 0}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 me-2 ${isResending ? 'animate-spin' : ''}`} aria-hidden="true" />
                {isResending ? t('stepUp.resending') : t('stepUp.resendCode')}
              </Button>
            )}

            {/* Actions */}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isVerifying}
                className="w-full sm:w-auto"
              >
                {t('stepUp.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={
                  isVerifying ||
                  verificationCode.length !== 6 ||
                  timeRemaining === 0
                }
                className="w-full sm:w-auto"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white me-2"></div>
                    {t('stepUp.verifying')}
                  </>
                ) : (
                  t('stepUp.verify')
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Help text */}
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground text-center">
            {t('stepUp.helpText')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to get elevated token from storage
 */
export function useElevatedToken(): {
  token: string | null;
  isValid: boolean;
  validUntil: string | null;
} {
  const token = sessionStorage.getItem('elevated_token');
  const validUntil = sessionStorage.getItem('elevated_token_valid_until');

  const isValid = token && validUntil
    ? new Date(validUntil).getTime() > Date.now()
    : false;

  return {
    token,
    isValid,
    validUntil,
  };
}

/**
 * Hook to clear elevated token
 */
export function clearElevatedToken(): void {
  sessionStorage.removeItem('elevated_token');
  sessionStorage.removeItem('elevated_token_valid_until');
}
