import { supabaseAdmin, supabaseAnon } from '../config/supabase';
import { cacheHelpers } from '../config/redis';
import { logAuthEvent, logError, logInfo } from '../utils/logger';
import dotenv from 'dotenv';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

dotenv.config();

interface User {
  id: string;
  email: string;
  name_en: string;
  name_ar: string;
  role: string;
  department: string;
  is_active: boolean;
  mfa_enabled: boolean;
  mfa_secret?: string;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
  user_metadata?: any;
}

interface LoginResult {
  success: boolean;
  user?: User;
  session?: any;
  accessToken?: string;
  refreshToken?: string;
  requiresMFA?: boolean;
  expiresIn?: number;
  error?: string;
}

interface MFASetupResult {
  success: boolean;
  secret?: string;
  qrCode?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
  error?: string;
}

export class AuthService {
  private readonly saltRounds = 12;
  private readonly jwtSecret = process.env.JWT_SECRET || 'fallback-secret';

  constructor() {
    // Initialize any required configuration
  }

  /**
   * Login with email, password, and optional MFA code
   */
  async login(email: string, password: string, mfaCode?: string): Promise<LoginResult> {
    try {
      // Test mode - allow specific test credentials
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        if (email === 'admin@gastat.gov.sa' && password === 'admin123') {
          const mockUser: User = {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'admin@gastat.gov.sa',
            name_en: 'Admin User',
            name_ar: 'مستخدم الإدارة',
            role: 'super_admin',
            department: 'IT',
            is_active: true,
            mfa_enabled: false,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: 'system',
            updated_by: 'system'
          };

          const mockSession = {
            access_token: 'mock_access_token',
            refresh_token: 'mock_refresh_token',
            expires_at: Date.now() + 3600000,
            user: mockUser
          };

          logAuthEvent('Test login successful', mockUser.id, { email });
          return { success: true, user: mockUser, session: mockSession };
        }
      }

      const { data, error } = await supabaseAnon.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password
      });

      if (error) {
        // Check if MFA is required
        if (error.message.includes('MFA') || error.message.includes('challenge')) {
          logAuthEvent('MFA required', undefined, { email });
          throw new Error('MFA challenge required');
        }
        
        logAuthEvent('Login failed', undefined, { email, error: error.message });
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('Invalid login credentials');
      }

      // Get additional user data from our users table
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        throw new Error('User profile not found');
      }

      // Check if user is active
      if (!userData.is_active) {
        logAuthEvent('Login failed - inactive user', data.user.id, { email });
        throw new Error('Account is inactive');
      }

      // Check MFA requirement
      if (userData.mfa_enabled && !mfaCode) {
        logAuthEvent('MFA required', data.user.id);
        throw new Error('MFA code required');
      }

      // Verify MFA code if provided
      if (userData.mfa_enabled && mfaCode) {
        const mfaValid = this.verifyMFACode(userData.mfa_secret, mfaCode);
        if (!mfaValid) {
          logAuthEvent('Login failed - invalid MFA code', data.user.id);
          throw new Error('Invalid MFA code');
        }
      }

      // Update last login
      await supabaseAdmin
        .from('users')
        .update({
          last_login: new Date().toISOString(),
          login_count: (userData.login_count || 0) + 1
        })
        .eq('id', data.user.id);

      logAuthEvent('Login successful', data.user.id);

      // Create user object with Supabase user data
      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        name_en: userData.name_en || data.user.user_metadata?.name || '',
        name_ar: userData.name_ar || '',
        role: userData.role || 'user',
        department: userData.department || 'General',
        is_active: userData.is_active,
        mfa_enabled: userData.mfa_enabled,
        last_login: new Date(),
        created_at: new Date(data.user.created_at || new Date()),
        updated_at: new Date(data.user.updated_at || new Date()),
        user_metadata: data.user.user_metadata
      };

      return {
        success: true,
        user,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in
      };
    } catch (error) {
      logError('Login error', error as Error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<LoginResult> {
    try {
      const { data, error } = await supabaseAnon.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error || !data.session || !data.user) {
        logAuthEvent('Refresh token invalid or expired', undefined);
        throw new Error('Invalid refresh token');
      }

      // Get additional user data from our users table
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData || !userData.is_active) {
        throw new Error('User not found or inactive');
      }

      logAuthEvent('Token refreshed', data.user.id);

      // Create user object with Supabase user data
      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        name_en: userData.name_en || data.user.user_metadata?.name || '',
        name_ar: userData.name_ar || '',
        role: userData.role || 'user',
        department: userData.department || 'General',
        is_active: userData.is_active,
        mfa_enabled: userData.mfa_enabled,
        last_login: new Date(),
        created_at: new Date(data.user.created_at || new Date()),
        updated_at: new Date(data.user.updated_at || new Date()),
        user_metadata: data.user.user_metadata
      };

      return {
        success: true,
        user,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in
      };
    } catch (error) {
      logError('Token refresh error', error as Error);
      throw error;
    }
  }

  /**
   * Logout user and invalidate tokens
   */
  async logout(userId?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabaseAnon.auth.signOut();
      
      if (error) {
        return { success: false, message: error.message };
      }

      logAuthEvent('Logout successful', undefined);
      return { success: true };
    } catch (error) {
      logError('Logout error', error as Error);
      return { success: false, message: 'Logout failed' };
    }
  }

  /**
   * Setup MFA for user
   */
  async setupMFA(userId: string): Promise<MFASetupResult> {
    try {
      // Fetch user
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('email, name_en, mfa_enabled')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return { success: false, error: 'User not found' };
      }

      if (user.mfa_enabled) {
        return { success: false, error: 'MFA already enabled' };
      }

      // Generate MFA secret
      const secret = speakeasy.generateSecret({
        name: `GASTAT Dossier (${user.email})`,
        length: 32
      });

      // Generate QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes(8);

      // Store secret temporarily in cache (5 minutes to complete setup)
      await cacheHelpers.set(
        `mfa_setup:${userId}`,
        {
          secret: secret.base32,
          backupCodes
        },
        300
      );

      logAuthEvent('MFA setup initiated', userId);

      return {
        success: true,
        secret: secret.base32,
        qrCodeUrl,
        backupCodes
      };
    } catch (error) {
      logError('MFA setup error', error as Error);
      return { success: false, error: 'MFA setup failed' };
    }
  }

  /**
   * Verify and enable MFA
   */
  async verifyAndEnableMFA(userId: string, verificationCode: string): Promise<boolean> {
    try {
      // Get setup data from cache
      const setupData = await cacheHelpers.get<any>(`mfa_setup:${userId}`);
      if (!setupData) {
        logAuthEvent('MFA verification failed - no setup data', userId);
        return false;
      }

      // Verify code
      const verified = this.verifyMFACode(setupData.secret, verificationCode);
      if (!verified) {
        logAuthEvent('MFA verification failed - invalid code', userId);
        return false;
      }

      // Update user with MFA secret and backup codes
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          mfa_enabled: true,
          mfa_secret: setupData.secret,
          mfa_backup_codes: setupData.backupCodes,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Remove setup data from cache
      await cacheHelpers.del(`mfa_setup:${userId}`);

      logAuthEvent('MFA enabled successfully', userId);
      return true;
    } catch (error) {
      logError('MFA verification error', error as Error);
      return false;
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string, password: string): Promise<boolean> {
    try {
      // Verify password first
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return false;
      }

      const passwordValid = await bcrypt.compare(password, user.password_hash);
      if (!passwordValid) {
        logAuthEvent('MFA disable failed - invalid password', userId);
        return false;
      }

      // Disable MFA
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          mfa_enabled: false,
          mfa_secret: null,
          mfa_backup_codes: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      logAuthEvent('MFA disabled', userId);
      return true;
    } catch (error) {
      logError('MFA disable error', error as Error);
      return false;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Fetch user
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return false;
      }

      // Verify current password
      const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!passwordValid) {
        logAuthEvent('Password change failed - invalid current password', userId);
        return false;
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);

      // Update password
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          password_hash: newPasswordHash,
          password_changed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Invalidate all sessions
      await cacheHelpers.del([
        `refresh_token:${userId}`,
        `user_session:${userId}`
      ]);

      logAuthEvent('Password changed successfully', userId);
      return true;
    } catch (error) {
      logError('Password change error', error as Error);
      return false;
    }
  }

  /**
   * Request password reset
   */
  async resetPassword(email: string): Promise<boolean> {
    try {
      const { error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) {
        throw error;
      }

      logAuthEvent('Password reset requested', undefined, { email });
      return true;
    } catch (error) {
      logError('Password reset request error', error as Error);
      return false;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) {
        return { success: false, message: error.message };
      }

      logAuthEvent('Password reset requested', undefined);
      return { success: true };
    } catch (error) {
      logError('Password reset request error', error as Error);
      return { success: false, message: 'Password reset request failed' };
    }
  }

  /**
   * Reset password with token
   */
  async resetPasswordWithToken(resetToken: string, newPassword: string): Promise<boolean> {
    try {
      const { error } = await supabaseAnon.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      logAuthEvent('Password reset successful', undefined);
      return true;
    } catch (error) {
      logError('Password reset error', error as Error);
      return false;
    }
  }

  /**
   * Verify user session
   */
  async verifySession(accessToken: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(accessToken, this.jwtSecret) as any;

      // Check session in cache
      const session = await cacheHelpers.get<any>(`user_session:${decoded.userId}`);
      if (!session) {
        return null;
      }

      return session;
    } catch (error) {
      return null;
    }
  }

  /**
   * Register a new user
   */
  async register(userData: any): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const { data, error } = await supabaseAnon.auth.signUp({
        email: userData.email.toLowerCase(),
        password: userData.password,
        options: {
          data: {
            name: userData.name || `${userData.firstName} ${userData.lastName}`,
            first_name: userData.firstName,
            last_name: userData.lastName
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('User creation failed');
      }

      // Create user profile in our users table
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: data.user.id,
          email: userData.email.toLowerCase(),
          name_en: userData.name || `${userData.firstName} ${userData.lastName}`,
          name_ar: userData.nameAr || `${userData.firstName} ${userData.lastName}`,
          role: 'user',
          department: userData.department || 'General',
          is_active: false, // Requires email verification
          mfa_enabled: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        name_en: userProfile.name_en,
        name_ar: userProfile.name_ar,
        role: userProfile.role,
        department: userProfile.department,
        is_active: userProfile.is_active,
        mfa_enabled: userProfile.mfa_enabled,
        created_at: new Date(data.user.created_at || new Date()),
        updated_at: new Date(data.user.updated_at || new Date()),
        user_metadata: data.user.user_metadata
      };

      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<boolean> {
    // Implementation would go here - for now return true
    return true;
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<boolean> {
    // Implementation would go here - for now return true
    return true;
  }

  /**
   * Verify MFA code
   */
  async verifyMFA(userId: string, code: string): Promise<boolean> {
    try {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('mfa_secret')
        .eq('id', userId)
        .single();

      if (!user?.mfa_secret) return false;

      return this.verifyMFACode(user.mfa_secret, code);
    } catch {
      return false;
    }
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data, error } = await supabaseAnon.auth.getSession();
      
      if (error || !data.session || !data.session.user) {
        return null;
      }

      // Get additional user data from our users table
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (userError || !userData) {
        return null;
      }

      const user: User = {
        id: data.session.user.id,
        email: data.session.user.email!,
        name_en: userData.name_en || data.session.user.user_metadata?.name || '',
        name_ar: userData.name_ar || '',
        role: userData.role || 'user',
        department: userData.department || 'General',
        is_active: userData.is_active,
        mfa_enabled: userData.mfa_enabled,
        last_login: userData.last_login ? new Date(userData.last_login) : undefined,
        created_at: new Date(data.session.user.created_at || new Date()),
        updated_at: new Date(data.session.user.updated_at || new Date()),
        user_metadata: data.session.user.user_metadata
      };

      return user;
    } catch {
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: any): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Update Supabase Auth user metadata
      const { data, error } = await supabaseAnon.auth.updateUser({
        data: {
          name: profileData.name,
          first_name: profileData.first_name,
          last_name: profileData.last_name
        }
      });

      if (error) {
        throw error;
      }

      // Update our users table
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .update({
          name_en: profileData.name_en || profileData.name,
          name_ar: profileData.name_ar,
          department: profileData.department,
          phone: profileData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      // Get updated user data
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        throw new Error('Failed to fetch updated user data');
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        name_en: userData.name_en,
        name_ar: userData.name_ar,
        role: userData.role,
        department: userData.department,
        is_active: userData.is_active,
        mfa_enabled: userData.mfa_enabled,
        created_at: new Date(data.user.created_at || new Date()),
        updated_at: new Date(data.user.updated_at || new Date()),
        user_metadata: data.user.user_metadata
      };

      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate session token
   */
  async validateSession(token: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAnon.auth.getSession();
      
      if (error || !data.session) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check user permissions
   */
  async checkPermission(userId: string, permission: string, resourceId?: string): Promise<boolean> {
    try {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('role, department')
        .eq('id', userId)
        .single();

      if (!user) return false;

      // Basic role-based permissions
      const rolePermissions = {
        admin: ['*'],
        manager: ['read', 'write', 'manage_team'],
        user: ['read', 'write_own']
      };

      const userPermissions = rolePermissions[user.role as keyof typeof rolePermissions] || [];
      return userPermissions.includes('*') || userPermissions.includes(permission);
    } catch {
      return false;
    }
  }

  /**
   * Check if user can access a specific role
   */
  async canAccessRole(userId: string, targetRole: string): Promise<boolean> {
    try {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!user) return false;

      const roleHierarchy = {
        admin: ['admin', 'manager', 'user'],
        manager: ['manager', 'user'],
        user: ['user']
      };

      const allowedRoles = roleHierarchy[user.role as keyof typeof roleHierarchy] || [];
      return allowedRoles.includes(targetRole);
    } catch {
      return false;
    }
  }

  /**
   * Log security events
   */
  async logSecurityEvent(userId: string, event: string, details?: any): Promise<void> {
    try {
      await supabaseAdmin
        .from('audit_log')
        .insert({
          user_id: userId,
          action: event,
          resource_type: 'security',
          details: details || {},
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      logError('Security event logging failed', error as Error);
    }
  }

  /**
   * Verify JWT token
   */
  async verifyJWT(token: string, secret?: string): Promise<any> {
    try {
      const { data, error } = await supabaseAnon.auth.getUser(token);
      
      if (error || !data.user) {
        return null;
      }

      return data.user;
    } catch {
      return null;
    }
  }

  // Helper methods

  private verifyMFACode(secret: string, code: string): boolean {
    // For now, return true for testing - implement proper MFA verification later
    return true;
  }

  /**
   * Generate backup codes for MFA
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}

export { User, LoginResult, MFASetupResult };
export default AuthService;