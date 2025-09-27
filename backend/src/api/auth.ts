import { Router } from 'express';
import { z } from 'zod';
import AuthService from '../services/AuthService';
import { validate, createBilingualError, getRequestLanguage } from '../utils/validation';
import { logInfo, logError } from '../utils/logger';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();
const authService = new AuthService();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  mfaCode: z.string().length(6).optional()
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number and special character'
  ),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: z.string().optional(),
  preferredLanguage: z.enum(['en', 'ar']).default('en')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string()
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number and special character'
  )
});

const verifyMfaSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6)
});

const setupMfaSchema = z.object({
  userId: z.string().uuid()
});

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return tokens
 * @access Public
 */
router.post('/login', validate({ body: loginSchema }), async (req, res, next) => {
  try {
    const { email, password, mfaCode } = req.body;
    const lang = getRequestLanguage(req);

    logInfo('Login attempt', { email, ip: req.ip });

    const result = await authService.login(email, password, mfaCode);

    if (result.requiresMFA && !result.accessToken) {
      return res.status(200).json({
        requiresMFA: true,
        userId: result.user?.id,
        message: createBilingualError(
          'MFA code required',
          'رمز المصادقة الثنائية مطلوب',
          lang
        )
      });
    }

    logInfo('Login successful', {
      userId: result.user?.id,
      email,
      role: result.user?.role
    });

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
      expiresIn: result.expiresIn
    });
  } catch (error) {
    logError('Login failed', error as Error, { email: req.body.email });
    next(error);
  }
});

/**
 * @route POST /api/auth/register
 * @desc Register new user
 * @access Public
 */
router.post('/register', validate({ body: registerSchema }), async (req, res, next) => {
  try {
    const lang = getRequestLanguage(req);
    const userData = req.body;

    logInfo('Registration attempt', { email: userData.email });

    const result = await authService.register(userData);

    if (!result.success) {
      return res.status(400).json({
        error: result.error || createBilingualError('Registration failed', 'فشل التسجيل', lang)
      });
    }

    logInfo('Registration successful', {
      userId: result.user?.id,
      email: userData.email
    });

    res.status(201).json({
      user: result.user,
      message: createBilingualError(
        'Registration successful. Please verify your email.',
        'تم التسجيل بنجاح. يرجى التحقق من بريدك الإلكتروني.',
        lang
      )
    });
  } catch (error) {
    logError('Registration failed', error as Error, { email: req.body.email });
    next(error);
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', validate({ body: refreshTokenSchema }), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn
    });
  } catch (error) {
    logError('Token refresh failed', error as Error);
    next(error);
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate tokens
 * @access Public
 */
router.post('/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    const lang = getRequestLanguage(req);

    if (token) {
      // Verify session to get userId
      const user = await authService.verifySession(token);
      if (user) {
        await authService.logout(user.id);
      }
    }

    res.json({
      message: createBilingualError(
        'Logged out successfully',
        'تم تسجيل الخروج بنجاح',
        lang
      )
    });
  } catch (error) {
    logError('Logout failed', error as Error);
    next(error);
  }
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), async (req, res, next) => {
  try {
    const { email } = req.body;
    const lang = getRequestLanguage(req);

    logInfo('Password reset requested', { email });

    await authService.requestPasswordReset(email);

    res.json({
      message: createBilingualError(
        'If an account exists with this email, a password reset link has been sent',
        'إذا كان هناك حساب بهذا البريد الإلكتروني، فقد تم إرسال رابط إعادة تعيين كلمة المرور',
        lang
      )
    });
  } catch (error) {
    logError('Password reset request failed', error as Error);
    // Don't expose whether email exists
    res.json({
      message: createBilingualError(
        'If an account exists with this email, a password reset link has been sent',
        'إذا كان هناك حساب بهذا البريد الإلكتروني، فقد تم إرسال رابط إعادة تعيين كلمة المرور',
        getRequestLanguage(req)
      )
    });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', validate({ body: resetPasswordSchema }), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const lang = getRequestLanguage(req);

    await authService.resetPasswordWithToken(token, newPassword);

    logInfo('Password reset successful');

    res.json({
      message: createBilingualError(
        'Password reset successful',
        'تم إعادة تعيين كلمة المرور بنجاح',
        lang
      )
    });
  } catch (error) {
    logError('Password reset failed', error as Error);
    next(error);
  }
});

/**
 * @route POST /api/auth/verify-email
 * @desc Verify email with token
 * @access Public
 */
router.get('/verify-email/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const lang = getRequestLanguage(req);

    // Email verification - using simplified approach for now
    // AuthService.verifyEmail expects a token
    const verified = await authService.verifyEmail(token);
    if (!verified) {
      throw new Error('Invalid verification token');
    }

    res.json({
      message: createBilingualError(
        'Email verified successfully',
        'تم التحقق من البريد الإلكتروني بنجاح',
        lang
      )
    });
  } catch (error) {
    logError('Email verification failed', error as Error);
    next(error);
  }
});

/**
 * @route POST /api/auth/setup-mfa
 * @desc Setup MFA for user
 * @access Private
 */
router.post('/setup-mfa', validate({ body: setupMfaSchema }), async (req, res, next) => {
  try {
    const { userId } = req.body;
    const lang = getRequestLanguage(req);

    const result = await authService.setupMFA(userId);

    res.json({
      secret: result.secret,
      qrCode: result.qrCodeUrl,
      backupCodes: result.backupCodes,
      message: createBilingualError(
        'Scan the QR code with your authenticator app',
        'امسح رمز QR باستخدام تطبيق المصادقة الخاص بك',
        lang
      )
    });
  } catch (error) {
    logError('MFA setup failed', error as Error);
    next(error);
  }
});

/**
 * @route POST /api/auth/verify-mfa
 * @desc Verify MFA code
 * @access Public
 */
router.post('/verify-mfa', validate({ body: verifyMfaSchema }), async (req, res, next) => {
  try {
    const { userId, code } = req.body;

    const verified = await authService.verifyMFA(userId, code);

    res.json({
      verified: verified,
      message: verified
        ? createBilingualError('MFA verified successfully', 'تم التحقق من المصادقة الثنائية بنجاح', getRequestLanguage(req))
        : createBilingualError('MFA verification failed', 'فشل التحقق من المصادقة الثنائية', getRequestLanguage(req))
    });
  } catch (error) {
    logError('MFA verification failed', error as Error);
    next(error);
  }
});

/**
 * @route POST /api/auth/disable-mfa
 * @desc Disable MFA for user
 * @access Private
 */
router.post('/disable-mfa', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    const lang = getRequestLanguage(req);

    if (!token) {
      return res.status(401).json({
        error: createBilingualError(
          'Authentication required',
          'المصادقة مطلوبة',
          lang
        )
      });
    }

    // Get user from token first
    const user = await authService.verifySession(token);
    if (!user) {
      throw new Error('Invalid session');
    }

    // disableMFA requires userId and password
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        error: createBilingualError('Password is required', 'كلمة المرور مطلوبة', lang)
      });
    }

    await authService.disableMFA(user.id, password);

    res.json({
      message: createBilingualError(
        'MFA disabled successfully',
        'تم تعطيل المصادقة الثنائية بنجاح',
        lang
      )
    });
  } catch (error) {
    logError('MFA disable failed', error as Error);
    next(error);
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // verifySession returns the user from token
    const user = await authService.verifySession(token);
    if (!user) {
      throw new Error('Invalid session');
    }

    res.json({ user });
  } catch (error) {
    logError('Get current user failed', error as Error);
    next(error);
  }
});

export default router;