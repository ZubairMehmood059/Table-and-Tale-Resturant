import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

interface StaffSession {
  token: string;
  createdAt: number;
}

interface LoginAttemptTracker {
  failedCount: number;
  lockedUntil: number;
}

const activeSessions = new Map<string, StaffSession>();
const revokedSessions = new Set<string>();
const loginAttempts = new Map<string, LoginAttemptTracker>();

const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_DURATION_MS = 60 * 1000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.MANAGEMENT_SECRET ||
  crypto.createHash('sha256').update('table_tale_management_session_key_2026').digest('hex');

export function getClientKey(req: Request): string {
  return req.ip || 'local';
}

export function extractBearerToken(req: Request): string {
  const authHeader = (req.headers.authorization || req.headers['Authorization'] || '') as string;
  if (authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }

  const customHeader = (req.headers['x-staff-token'] || req.headers['X-Staff-Token'] || '') as string;
  if (customHeader.trim()) {
    return customHeader.trim();
  }

  const cookieHeader = (req.headers.cookie || req.headers['Cookie'] || '') as string;
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)staff_token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1].trim());
    }
  }

  return '';
}

export function isValidStaffSession(token: string, now = Date.now()): boolean {
  if (!token || revokedSessions.has(token)) {
    return false;
  }

  const existing = activeSessions.get(token);
  if (existing) {
    if (now - existing.createdAt > SESSION_TTL_MS) {
      activeSessions.delete(token);
      return false;
    }
    return true;
  }

  // Stateless verification for serverless instances and server restarts
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) {
    return false;
  }

  const payload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  const colonIndex = payload.indexOf(':');
  if (colonIndex === -1) {
    return false;
  }

  const createdAt = Number(payload.slice(0, colonIndex));
  if (Number.isNaN(createdAt) || now - createdAt > SESSION_TTL_MS || now < createdAt - 60000) {
    return false;
  }

  try {
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }

    activeSessions.set(token, { token, createdAt });
    return true;
  } catch {
    return false;
  }
}

export function requireStaffAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);

  if (!token || !isValidStaffSession(token)) {
    res.status(401).json({
      ok: false,
      message: 'Management authentication required.',
    });
    return;
  }

  next();
}

export function getLoginLockoutSeconds(clientKey: string, now = Date.now()): number {
  const tracker = loginAttempts.get(clientKey);
  if (!tracker || tracker.lockedUntil <= now) {
    return 0;
  }
  return Math.ceil((tracker.lockedUntil - now) / 1000);
}

export function issueStaffSession(clientKey: string, now = Date.now()): string {
  loginAttempts.delete(clientKey);
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${now}:${nonce}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  const token = `${payload}.${signature}`;
  activeSessions.set(token, { token, createdAt: now });
  return token;
}

export function revokeStaffSession(token: string): void {
  if (token) {
    activeSessions.delete(token);
    revokedSessions.add(token);
  }
}

export function recordFailedLoginAttempt(clientKey: string, now = Date.now()): number {
  const tracker = loginAttempts.get(clientKey) || { failedCount: 0, lockedUntil: 0 };
  tracker.failedCount += 1;
  const attemptsRemaining = Math.max(0, MAX_LOGIN_ATTEMPTS - tracker.failedCount);

  if (attemptsRemaining === 0) {
    tracker.lockedUntil = now + LOCK_DURATION_MS;
    tracker.failedCount = 0;
  }

  loginAttempts.set(clientKey, tracker);
  return attemptsRemaining;
}
