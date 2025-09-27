import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime: Date;
      };
    }
  }
}

export {};