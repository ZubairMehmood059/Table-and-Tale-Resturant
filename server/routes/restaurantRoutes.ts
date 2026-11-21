import { Router } from 'express';
import { ensureCppEngineBuilt, invokeCppEngine } from '../services/cppBridge.ts';

export const restaurantRoutes = Router();

restaurantRoutes.get('/health', (_req, res) => {
  try {
    ensureCppEngineBuilt();
    res.json({ ok: true, engine: 'cpp17' });
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

restaurantRoutes.get('/restaurant/info', async (_req, res) => {
  try {
    const data = await invokeCppEngine({ action: 'info' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

restaurantRoutes.post('/orders/parse-quick', async (req, res) => {
  try {
    const line = typeof req.body?.line === 'string' ? req.body.line : '';
    const data = await invokeCppEngine({ action: 'parse_quick_order', line });
    res.json(data);
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

restaurantRoutes.get('/tables', async (_req, res) => {
  try {
    const data = await invokeCppEngine({ action: 'tables' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

restaurantRoutes.post('/reservations/reserve', async (req, res) => {
  try {
    const customerName = typeof req.body?.customerName === 'string' ? req.body.customerName.trim() : '';
    const guests = Number(req.body?.guests ?? 0);
    const tableNumbers = Array.isArray(req.body?.tableNumbers)
      ? req.body.tableNumbers.map((n: unknown) => Number(n))
      : [];

    const data = await invokeCppEngine<{ ok: boolean }>({
      action: 'reserve_tables',
      customerName,
      guests,
      tableNumbers,
    });

    res.status(data.ok ? 200 : 400).json(data);
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

restaurantRoutes.post('/reservations/release', async (req, res) => {
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

restaurantRoutes.post('/orders/preview', async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const diningType = typeof req.body?.diningType === 'string' ? req.body.diningType : 'Dine-in';

    const data = await invokeCppEngine({
      action: 'preview_bill',
      items,
      diningType,
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

restaurantRoutes.post('/orders/checkout', async (req, res) => {
  try {
    const payload = {
      action: 'checkout',
      customerName: typeof req.body?.customerName === 'string' ? req.body.customerName.trim() : '',
      diningType: typeof req.body?.diningType === 'string' ? req.body.diningType : '',
      deliveryAddress:
        typeof req.body?.deliveryAddress === 'string' ? req.body.deliveryAddress.trim() : '',
      guests: Number(req.body?.guests ?? 0),
      tableNumbers: Array.isArray(req.body?.tableNumbers)
        ? req.body.tableNumbers.map((n: unknown) => Number(n))
        : [],
      items: Array.isArray(req.body?.items) ? req.body.items : [],
      paymentMethod: typeof req.body?.paymentMethod === 'string' ? req.body.paymentMethod : '',
      cashGiven: Number(req.body?.cashGiven ?? 0),
    };

    const data = await invokeCppEngine<{ ok: boolean }>(payload);
    res.status(data.ok ? 200 : 400).json(data);
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

restaurantRoutes.post('/orders/:orderIndex/feedback', async (req, res) => {
  try {
    const orderIndex = Number(req.params.orderIndex);
    const rating = Number(req.body?.rating ?? 0);
    const review = typeof req.body?.review === 'string' ? req.body.review.trim() : '';
    const tip = Number(req.body?.tip ?? 0);

    const data = await invokeCppEngine<{ ok: boolean }>({
      action: 'feedback',
      orderIndex,
      rating,
      review,
      tip,
    });

    res.status(data.ok ? 200 : 400).json(data);
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

restaurantRoutes.post('/feedback', async (req, res) => {
  try {
    const customerName =
      typeof req.body?.customerName === 'string' ? req.body.customerName.trim() : '';
    const rating = Number(req.body?.rating ?? 0);
    const categories = Array.isArray(req.body?.categories)
      ? req.body.categories.filter((c: unknown): c is string => typeof c === 'string')
      : [];
    const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';
    const createdAt = new Date().toISOString();

    const data = await invokeCppEngine<{ ok: boolean }>({
      action: 'guest_feedback',
      customerName,
      rating,
      categories,
      comment,
      createdAt,
    });

    res.status(data.ok ? 200 : 400).json(data);
  } catch (err) {
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});
