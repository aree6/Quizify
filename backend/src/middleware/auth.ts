import type { NextFunction, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        email: string;
        role?: string;
      };
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

async function getUserFromToken(
  token: string,
): Promise<{ id: string; email: string; role?: string } | null> {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email || '',
    role: data.user.user_metadata?.role,
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }

  getUserFromToken(token)
    .then((user) => {
      if (user) req.authUser = user;
      next();
    })
    .catch(() => next());
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  getUserFromToken(token)
    .then((user) => {
      if (!user) {
        res.status(401).json({ message: 'Invalid authentication token' });
        return;
      }
      req.authUser = user;
      next();
    })
    .catch(() => {
      res.status(401).json({ message: 'Authentication failed' });
    });
}
