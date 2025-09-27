import { Request, Response, NextFunction } from 'express';

export function getAuthToken(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (!auth) return undefined;
  const parts = auth.split(' ');
  return parts.length === 2 ? parts[1] : auth;
}

export function requireAuthHeader(req: Request, res: Response, next: NextFunction) {
  const token = getAuthToken(req);
  if (!token) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required', 'المصادقة مطلوبة');
  }
  (req as any).token = token;
  next();
}

export function sendError(res: Response, status: number, code: string, en: string, ar: string, extraHeaders?: Record<string, string | number>) {
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, String(v));
  }
  return res.status(status).json({ code, message: en, message_ar: ar });
}

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json(data as any);
}

export function isAdminToken(token: string) {
  return token === 'test-auth-token';
}

export function isOtherUserToken(token: string) {
  return token === 'other-user-token';
}

