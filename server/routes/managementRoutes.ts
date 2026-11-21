import { Router } from 'express';
import {
  extractBearerToken,
  getClientKey,
  getLoginLockoutSeconds,
  issueStaffSession,
  recordFailedLoginAttempt,
  requireStaffAuth,
  revokeStaffSession,
} from '../middleware/staffAuth.ts';
import { invokeCppEngine } from '../services/cppBridge.ts';

export const managementRoutes = Router();

managementRoutes.post('/login', async (req, res) => {
  try {
    const clientKey = getClientKey(req);
    const now = Date.now();
    const lockedSeconds = getLoginLockoutSeconds(clientKey, now);

    if (lockedSeconds > 0) {
      res.status(429).json({
        ok: false,
        attemptsRemaining: 0,
        lockedSeconds,
        message: `Too many wrong attempts. Try again in ${lockedSeconds}s.`,
      });
      return;
    }

    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const data = await invokeCppEngine<{ ok: boolean; message: string }>({
      action: 'staff_login',
      password,
    });

    if (data.ok) {
      const token = issueStaffSession(clientKey, now);
      res.setHeader('Set-Cookie', [
        `staff_token=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=86400`,
      ]);
      res.json({
        ok: true,
        token,
        message: data.message,
      });
      return;
    }

    const attemptsRemaining = recordFailedLoginAttempt(clientKey, now);

    res.status(401).json({
      ok: false,
      attemptsRemaining,
      message:
        attemptsRemaining > 0
          ? `Incorrect password. Attempts left: ${attemptsRemaining}`
          : 'Too many wrong attempts. Management login temporarily locked for 60 seconds.',
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

managementRoutes.post('/logout', (req, res) => {
  const token = extractBearerToken(req);
  revokeStaffSession(token);
  res.setHeader('Set-Cookie', [
    `staff_token=; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  ]);
  res.json({ ok: true });
});

managementRoutes.get('/orders', requireStaffAuth, async (_req, res) => {
  try {
    const data = await invokeCppEngine({ action: 'management_orders' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

managementRoutes.patch('/orders/:orderIndex/kitchen-status', requireStaffAuth, async (req, res) => {
  try {
    const orderIndex = Number(req.params.orderIndex);
    const kitchenStatus =
      typeof req.body?.kitchenStatus === 'string' ? req.body.kitchenStatus.trim() : '';

    const data = await invokeCppEngine<{ ok: boolean }>({
      action: 'update_kitchen_status',
      orderIndex,
      kitchenStatus,
    });

    res.status(data.ok ? 200 : 400).json(data);
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

managementRoutes.get('/sales', requireStaffAuth, async (_req, res) => {
  try {
    const data = await invokeCppEngine({ action: 'management_sales' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

managementRoutes.get('/staff', requireStaffAuth, async (_req, res) => {
  try {
    const data = await invokeCppEngine({ action: 'management_staff' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

managementRoutes.get('/feedback', requireStaffAuth, async (_req, res) => {
  try {
    const data = await invokeCppEngine({ action: 'management_feedback' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

managementRoutes.post('/tables/release', requireStaffAuth, async (req, res) => {
  try {
    const tableNumbers = Array.isArray(req.body?.tableNumbers)
      ? req.body.tableNumbers.map((n: unknown) => Number(n))
      : [];
    const data = await invokeCppEngine({
      action: 'release_tables',
      tableNumbers,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});
