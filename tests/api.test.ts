import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createApp } from '../server.ts';
import { ensureCppEngineBuilt } from '../server/services/cppBridge.ts';

async function runTests() {
  console.log('Running Table & Tale Express + C++ Integration Tests...');
  ensureCppEngineBuilt();

  const dataFile = path.join(process.cwd(), 'data', 'tabletale_data.txt');
  const backupPath = dataFile + '.bak';
  const hadExistingData = fs.existsSync(dataFile);
  if (hadExistingData) {
    fs.copyFileSync(dataFile, backupPath);
    try {
      fs.unlinkSync(dataFile);
    } catch {
      fs.writeFileSync(dataFile, '', 'utf8');
    }
  }

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  assert(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Restaurant info & 20 menu items
    const infoRes = await fetch(`${baseUrl}/api/restaurant/info`);
    assert.equal(infoRes.status, 200);
    const info = await infoRes.json();
    assert.equal(info.ok, true);
    assert.equal(info.restaurant.name, 'TABLE & TALE');
    assert.equal(info.menu.items.length, 20);

    // 2. Quick order line parsing via C++
    const quickRes = await fetch(`${baseUrl}/api/orders/parse-quick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line: '1, 2 11' }),
    });
    const quickData = await quickRes.json();
    assert.equal(quickData.ok, true);
    assert.deepEqual(quickData.validItemNumbers, [1, 2, 11]);

    // 3. Reserve tables (7 guests -> 2 tables)
    const reserveRes = await fetch(`${baseUrl}/api/reservations/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Ayesha',
        guests: 7,
        tableNumbers: [3, 4],
      }),
    });
    assert.equal(reserveRes.status, 200);
    const reserveData = await reserveRes.json();
    assert.equal(reserveData.ok, true);
    assert.deepEqual(reserveData.reservedTables, [3, 4]);

    // 4. Preview bill (2 x Chicken Steak = 1900 + Online Delivery 150)
    const previewRes = await fetch(`${baseUrl}/api/orders/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diningType: 'Online Delivery',
        items: [{ itemNumber: 11, quantity: 2 }],
      }),
    });
    const previewData = await previewRes.json();
    assert.equal(previewData.bill.subtotal, 1900);
    assert.equal(previewData.bill.discount, 0);
    assert.equal(previewData.bill.tax, 95);
    assert.equal(previewData.bill.deliveryCharge, 150);
    assert.equal(previewData.bill.billTotal, 2145);

    // 5. Checkout Dine-in with Cash >= Rs. 2000 (3 x Chicken Steak = 2850 -> 10% off = 2565 -> 5% tax = 128.25 -> 2693.25)
    const checkoutRes = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Ayesha',
        diningType: 'Dine-in',
        deliveryAddress: '',
        guests: 7,
        tableNumbers: [3, 4],
        items: [{ itemNumber: 11, quantity: 3 }],
        paymentMethod: 'cash',
        cashGiven: 3000,
      }),
    });
    assert.equal(checkoutRes.status, 200);
    const checkoutData = await checkoutRes.json();
    assert.equal(checkoutData.ok, true);
    assert.equal(checkoutData.paid, true);
    assert.equal(checkoutData.bill.discount, 285);
    assert.equal(checkoutData.bill.tax, 128.25);
    assert.equal(checkoutData.bill.billTotal, 2693.25);
    assert.equal(checkoutData.change, 306.75);

    // Verify tables 3 & 4 were released automatically after checkout
    const tablesRes = await fetch(`${baseUrl}/api/tables`);
    const tablesData = await tablesRes.json();
    assert.equal(tablesData.summary.bookedTables, 0);

    // 6. Submit feedback & tip
    const fbRes = await fetch(`${baseUrl}/api/orders/${checkoutData.orderIndex}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 5, review: 'Exceptional steak!', tip: 200 }),
    });
    assert.equal(fbRes.status, 200);

    // 7. Management auth enforcement (401 without token)
    const unauthRes = await fetch(`${baseUrl}/api/management/orders`);
    assert.equal(unauthRes.status, 401);

    // 8. Management login & verify reports
    const loginRes = await fetch(`${baseUrl}/api/management/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'staff123' }),
    });
    assert.equal(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.ok(loginData.token);

    const salesRes = await fetch(`${baseUrl}/api/management/sales`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    const salesData = await salesRes.json();
    assert.equal(salesData.report.totalOrders, 1);
    assert.equal(salesData.report.totalCompletedOrders, 1);
    assert.equal(salesData.report.totalSales, 2693.25);
    assert.equal(salesData.report.totalTips, 200);
    assert.equal(salesData.report.averageRating, 5);

    const staffRes = await fetch(`${baseUrl}/api/management/staff`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    const staffData = await staffRes.json();
    assert.equal(staffData.staff.length, 4);

    // 9. Kitchen status tracking update & persistence
    const ordersBeforeRes = await fetch(`${baseUrl}/api/management/orders`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    const ordersBefore = await ordersBeforeRes.json();
    assert.equal(ordersBefore.orders[0].kitchenStatus, 'Queued');

    const ksPatchRes = await fetch(
      `${baseUrl}/api/management/orders/${checkoutData.orderIndex}/kitchen-status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginData.token}`,
        },
        body: JSON.stringify({ kitchenStatus: 'Preparing' }),
      }
    );
    assert.equal(ksPatchRes.status, 200);
    const ksPatchData = await ksPatchRes.json();
    assert.equal(ksPatchData.ok, true);
    assert.equal(ksPatchData.order.kitchenStatus, 'Preparing');

    // 10. General guest feedback submission from footer modal & management retrieval
    const unauthFbRes = await fetch(`${baseUrl}/api/management/feedback`);
    assert.equal(unauthFbRes.status, 401);

    const badGuestFbRes = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Guest',
        rating: 5,
        categories: [],
        comment: 'Nice place',
      }),
    });
    assert.equal(badGuestFbRes.status, 400);

    const guestFbRes = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Bilal Tariq',
        rating: 5,
        categories: ['Food Quality', 'Ambiance & Seating', 'Dine-in'],
        comment: 'Blush ivory dining room felt calm and the Chicken Biryani stood out.',
      }),
    });
    assert.equal(guestFbRes.status, 200);
    const guestFbData = await guestFbRes.json();
    assert.equal(guestFbData.ok, true);
    assert.equal(guestFbData.feedback.customerName, 'Bilal Tariq');
    assert.deepEqual(guestFbData.feedback.categories, [
      'Food Quality',
      'Ambiance & Seating',
      'Dine-in',
    ]);

    const mgmtFbRes = await fetch(`${baseUrl}/api/management/feedback`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    assert.equal(mgmtFbRes.status, 200);
    const mgmtFbData = await mgmtFbRes.json();
    assert.equal(mgmtFbData.totalFeedback, 1);
    assert.equal(mgmtFbData.feedbacks[0].customerName, 'Bilal Tariq');

    // 10. Netlify Functions serverless handler test
    interface ServerlessResponse {
      statusCode: number;
      body: string;
      headers?: Record<string, string | string[]>;
      isBase64Encoded?: boolean;
    }

    const isServerlessResponse = (res: object): res is ServerlessResponse => {
      return (
        typeof res === 'object' &&
        res !== null &&
        'statusCode' in res &&
        typeof (res as { statusCode: unknown }).statusCode === 'number' &&
        'body' in res &&
        typeof (res as { body: unknown }).body === 'string'
      );
    };

    const { handler } = await import('../netlify/functions/api.ts');
    const netlifyRes = await handler(
      { httpMethod: 'GET', path: '/api/restaurant/info', headers: {} },
      {}
    );
    assert(isServerlessResponse(netlifyRes));
    assert.equal(netlifyRes.statusCode, 200);
    const netlifyInfo = JSON.parse(netlifyRes.body);
    assert.equal(netlifyInfo.ok, true);
    assert.equal(netlifyInfo.restaurant.name, 'TABLE & TALE');

    const netlifyDirectRes = await handler(
      { httpMethod: 'GET', path: '/.netlify/functions/api/tables', headers: {} },
      {}
    );
    assert(isServerlessResponse(netlifyDirectRes));
    assert.equal(netlifyDirectRes.statusCode, 200);
    const netlifyTables = JSON.parse(netlifyDirectRes.body);
    assert.equal(netlifyTables.ok, true);

    console.log('All Express + C++ API integration tests PASSED!');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    try {
      if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
    } catch {
      // ignore
    }
    if (hadExistingData) {
      fs.copyFileSync(backupPath, dataFile);
      try {
        fs.unlinkSync(backupPath);
      } catch {
        // ignore
      }
    }
  }
}

runTests().catch((err) => {
  console.error('Integration tests FAILED:', err);
  process.exit(1);
});
