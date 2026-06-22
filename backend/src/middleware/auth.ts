import type { NextFunction, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { env } from '../config/env.js';

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        email: string;
        name: string;
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

/**
 * Derive the trusted role for the authenticated user.
 *
 * Rules (highest priority first):
 *   1. Email in ADMIN_EMAILS env var -> 'Admin' (unconditional)
 *   2. Email in LECTURER_OVERRIDE_EMAILS env var -> 'Lecturer' (dev backdoor)
 *   3. Email ends with '@utm.my' AND Supabase user_metadata.role === 'Lecturer' -> 'Lecturer'
 *   4. Email ends with '@graduate.utm.my' AND Supabase user_metadata.role === 'Student' -> 'Student'
 *   5. Otherwise: undefined (the request is authenticated but the role is not claimed)
 *
 * Note: a client cannot spoof 'Admin' by setting user_metadata.role unless the
 * email is in ADMIN_EMAILS. This closes the previous spoofing gap.
 */
function deriveTrustedRole(email: string, metadataRole: unknown): string | undefined {
  const lower = (email || '').toLowerCase();
  if (env.auth.adminEmails.has(lower)) return 'Admin';
  if (env.auth.lecturerOverrideEmails.has(lower)) return 'Lecturer';
  if (lower.endsWith('@utm.my') && metadataRole === 'Lecturer') return 'Lecturer';
  if (lower.endsWith('@graduate.utm.my') && metadataRole === 'Student') return 'Student';
  return undefined;
}

function deriveDisplayName(email: string, metadataName: unknown): string {
  if (typeof metadataName === 'string' && metadataName.trim().length >= 2) {
    return metadataName.trim();
  }
  const local = (email || '').split('@')[0] ?? '';
  return local || 'User';
}

async function getUserFromToken(
  token: string,
): Promise<{ id: string; email: string; name: string; role?: string } | null> {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  const email = data.user.email || '';
  return {
    id: data.user.id,
    email,
    name: deriveDisplayName(email, data.user.user_metadata?.name),
    role: deriveTrustedRole(email, data.user.user_metadata?.role),
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
