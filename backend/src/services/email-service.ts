/**
 * Email Service Integration
 *
 * Provides email sending functionality for user activation, notifications,
 * and password reset workflows.
 *
 * Feature: 019-user-management-access
 * Task: T019
 *
 * @module services/email-service
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError, logWarn } from '../utils/logger';

// Initialize Supabase client for email sending
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@stats.gov.sa';
const APP_URL = process.env.APP_URL || 'https://intl-dossier.stats.gov.sa';
const APP_NAME = 'GASTAT International Dossier';

/**
 * Email template types
 */
export enum EmailTemplate {
  ACCOUNT_ACTIVATION = 'account_activation',
  PASSWORD_RESET = 'password_reset',
  ROLE_CHANGED = 'role_changed',
  DELEGATION_EXPIRING = 'delegation_expiring',
  DELEGATION_REVOKED = 'delegation_revoked',
  ACCESS_REVIEW_NOTIFICATION = 'access_review_notification',
  APPROVAL_PENDING = 'approval_pending',
  APPROVAL_APPROVED = 'approval_approved',
  APPROVAL_REJECTED = 'approval_rejected',
}

/**
 * Email sending options
 */
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template?: EmailTemplate;
  templateData?: Record<string, unknown>;
}

/**
 * Send email using Supabase Auth email system
 *
 * @param options - Email options
 * @returns Success status
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // For now, we'll use console logging in development
    // In production, integrate with SendGrid, AWS SES, or other email provider

    if (process.env.NODE_ENV === 'development') {
      logInfo('Email would be sent', {
        to: options.to,
        subject: options.subject,
        template: options.template,
      });

      // Log email content for debugging
      console.log('\n=== EMAIL CONTENT ===');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Template: ${options.template || 'custom'}`);
      console.log('---');
      console.log(options.text || options.html);
      console.log('=====================\n');

      return true;
    }

    // Production email sending would go here
    // Example with SendGrid:
    // const msg = {
    //   to: options.to,
    //   from: FROM_EMAIL,
    //   subject: options.subject,
    //   text: options.text,
    //   html: options.html,
    // };
    // await sgMail.send(msg);

    logWarn('Email sending not configured for production', { to: options.to });
    return false;
  } catch (error) {
    logError('Email sending failed', error);
    return false;
  }
}

/**
 * Send account activation email
 *
 * @param email - User email address
 * @param fullName - User full name
 * @param activationToken - Activation token
 * @param language - Email language (ar or en)
 * @returns Success status
 */
export async function sendActivationEmail(
  email: string,
  fullName: string,
  activationToken: string,
  language: 'ar' | 'en' = 'en'
): Promise<boolean> {
  const activationLink = `${APP_URL}/activate?token=${activationToken}`;

  const subject = language === 'ar'
    ? 'تفعيل حساب نظام الملف الدولي'
    : `Activate Your ${APP_NAME} Account`;

  const html = language === 'ar'
    ? `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>مرحباً ${fullName}،</h2>
        <p>تم إنشاء حساب لك في نظام الملف الدولي - الهيئة العامة للإحصاء.</p>
        <p>للبدء، يرجى تفعيل حسابك بالنقر على الرابط أدناه:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}"
             style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            تفعيل الحساب
          </a>
        </p>
        <p>أو انسخ هذا الرابط إلى متصفحك:</p>
        <p style="direction: ltr; text-align: left; background: #f5f5f5; padding: 10px; word-break: break-all;">${activationLink}</p>
        <p>هذا الرابط صالح لمدة 24 ساعة.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          الهيئة العامة للإحصاء<br>
          نظام الملف الدولي
        </p>
      </div>
    `
    : `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome ${fullName},</h2>
        <p>An account has been created for you in the ${APP_NAME} system.</p>
        <p>To get started, please activate your account by clicking the link below:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}"
             style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Activate Account
          </a>
        </p>
        <p>Or copy this link to your browser:</p>
        <p style="background: #f5f5f5; padding: 10px; word-break: break-all;">${activationLink}</p>
        <p>This link is valid for 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          General Authority for Statistics<br>
          International Dossier System
        </p>
      </div>
    `;

  return sendEmail({
    to: email,
    subject,
    html,
    template: EmailTemplate.ACCOUNT_ACTIVATION,
    templateData: { fullName, activationLink, language },
  });
}

/**
 * Send password reset email
 *
 * @param email - User email address
 * @param fullName - User full name
 * @param resetToken - Password reset token
 * @param language - Email language (ar or en)
 * @returns Success status
 */
export async function sendPasswordResetEmail(
  email: string,
  fullName: string,
  resetToken: string,
  language: 'ar' | 'en' = 'en'
): Promise<boolean> {
  const resetLink = `${APP_URL}/reset-password?token=${resetToken}`;

  const subject = language === 'ar'
    ? 'إعادة تعيين كلمة المرور'
    : 'Reset Your Password';

  const html = language === 'ar'
    ? `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>مرحباً ${fullName}،</h2>
        <p>تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك.</p>
        <p>للمتابعة، انقر على الرابط أدناه:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}"
             style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            إعادة تعيين كلمة المرور
          </a>
        </p>
        <p>أو انسخ هذا الرابط إلى متصفحك:</p>
        <p style="direction: ltr; text-align: left; background: #f5f5f5; padding: 10px; word-break: break-all;">${resetLink}</p>
        <p>هذا الرابط صالح لمدة ساعة واحدة.</p>
        <p style="color: #d32f2f;"><strong>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.</strong></p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          الهيئة العامة للإحصاء<br>
          نظام الملف الدولي
        </p>
      </div>
    `
    : `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${fullName},</h2>
        <p>We received a request to reset the password for your account.</p>
        <p>To proceed, click the link below:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}"
             style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>Or copy this link to your browser:</p>
        <p style="background: #f5f5f5; padding: 10px; word-break: break-all;">${resetLink}</p>
        <p>This link is valid for 1 hour.</p>
        <p style="color: #d32f2f;"><strong>If you didn't request a password reset, please ignore this email.</strong></p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          General Authority for Statistics<br>
          International Dossier System
        </p>
      </div>
    `;

  return sendEmail({
    to: email,
    subject,
    html,
    template: EmailTemplate.PASSWORD_RESET,
    templateData: { fullName, resetLink, language },
  });
}

/**
 * Send role change notification email
 *
 * @param email - User email address
 * @param fullName - User full name
 * @param oldRole - Previous role
 * @param newRole - New role
 * @param language - Email language (ar or en)
 * @returns Success status
 */
export async function sendRoleChangeEmail(
  email: string,
  fullName: string,
  oldRole: string,
  newRole: string,
  language: 'ar' | 'en' = 'en'
): Promise<boolean> {
  const roleNames = {
    super_admin: language === 'ar' ? 'مدير النظام' : 'Super Admin',
    admin: language === 'ar' ? 'مسؤول' : 'Administrator',
    manager: language === 'ar' ? 'مدير' : 'Manager',
    analyst: language === 'ar' ? 'محلل' : 'Analyst',
    viewer: language === 'ar' ? 'مشاهد' : 'Viewer',
  };

  const subject = language === 'ar'
    ? 'تم تحديث صلاحيات حسابك'
    : 'Your Account Permissions Have Been Updated';

  const html = language === 'ar'
    ? `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>مرحباً ${fullName}،</h2>
        <p>تم تحديث صلاحيات حسابك في نظام الملف الدولي.</p>
        <p><strong>الدور السابق:</strong> ${roleNames[oldRole as keyof typeof roleNames] || oldRole}</p>
        <p><strong>الدور الجديد:</strong> ${roleNames[newRole as keyof typeof roleNames] || newRole}</p>
        <p>تم إنهاء جميع الجلسات النشطة. يرجى تسجيل الدخول مرة أخرى لتطبيق الصلاحيات الجديدة.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/login"
             style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            تسجيل الدخول
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          الهيئة العامة للإحصاء<br>
          نظام الملف الدولي
        </p>
      </div>
    `
    : `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${fullName},</h2>
        <p>Your account permissions in the ${APP_NAME} system have been updated.</p>
        <p><strong>Previous Role:</strong> ${roleNames[oldRole as keyof typeof roleNames] || oldRole}</p>
        <p><strong>New Role:</strong> ${roleNames[newRole as keyof typeof roleNames] || newRole}</p>
        <p>All active sessions have been terminated. Please log in again to apply your new permissions.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/login"
             style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Log In
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          General Authority for Statistics<br>
          International Dossier System
        </p>
      </div>
    `;

  return sendEmail({
    to: email,
    subject,
    html,
    template: EmailTemplate.ROLE_CHANGED,
    templateData: { fullName, oldRole, newRole, language },
  });
}

/**
 * Send delegation expiring notification email
 *
 * @param email - User email address
 * @param fullName - User full name
 * @param otherUserName - Name of the other user (grantor or grantee)
 * @param expiresAt - Expiration timestamp
 * @param isGrantor - Whether recipient is the grantor
 * @param language - Email language (ar or en)
 * @returns Success status
 */
export async function sendDelegationExpiringEmail(
  email: string,
  fullName: string,
  otherUserName: string,
  expiresAt: string,
  isGrantor: boolean = true,
  language: 'ar' | 'en' = 'en'
): Promise<boolean> {
  const expiryDate = new Date(expiresAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const subject = language === 'ar'
    ? 'تنبيه: انتهاء صلاحية التفويض قريباً'
    : 'Alert: Delegation Expiring Soon';

  const message = isGrantor
    ? (language === 'ar'
      ? `التفويض الممنوح لـ ${otherUserName} سينتهي في ${expiryDate}`
      : `Your delegation to ${otherUserName} will expire on ${expiryDate}`)
    : (language === 'ar'
      ? `التفويض الممنوح من ${otherUserName} سينتهي في ${expiryDate}`
      : `Your delegated access from ${otherUserName} will expire on ${expiryDate}`);

  const html = language === 'ar'
    ? `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>مرحباً ${fullName}،</h2>
        <p>${message}</p>
        <p>إذا كنت ترغب في تجديد هذا التفويض، يرجى القيام بذلك قبل انتهاء صلاحيته.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/delegations"
             style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            إدارة التفويضات
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          الهيئة العامة للإحصاء<br>
          نظام الملف الدولي
        </p>
      </div>
    `
    : `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${fullName},</h2>
        <p>${message}</p>
        <p>If you wish to renew this delegation, please do so before it expires.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/delegations"
             style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Manage Delegations
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          General Authority for Statistics<br>
          International Dossier System
        </p>
      </div>
    `;

  return sendEmail({
    to: email,
    subject,
    html,
    template: EmailTemplate.DELEGATION_EXPIRING,
    templateData: { fullName, otherUserName, expiresAt, isGrantor, language },
  });
}
