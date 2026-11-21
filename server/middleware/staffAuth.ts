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
const loginAttempts = new Map<string, LoginAttemptTracker>();

const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_DURATION_MS = 60 * 1000;

export function getClientKey(req: Request): string {
  return req.ip || 'local';
}

export function extractBearerToken(req: Request): string {
  const authHeader = req.headers.authorization || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
}

export function requireStaffAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);

  if (!token || !activeSessions.has(token)) {
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
  const token = crypto.randomBytes(24).toString('hex');
  activeSessions.set(token, { token, createdAt: now });
  return token;
}

export function revokeStaffSession(token: string): void {
  if (token) {
    activeSessions.delete(token);
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
