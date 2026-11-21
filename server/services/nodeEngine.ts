import fs from 'fs';
import path from 'path';

export const NUM_CATEGORIES = 5;
export const ITEMS_PER_CATEGORY = 4;
export const TOTAL_MENU_ITEMS = NUM_CATEGORIES * ITEMS_PER_CATEGORY;
export const NUM_TABLES = 10;
export const TABLE_CAPACITY = 6;
export const MAX_ORDERS = 100;

export const DISCOUNT_RATE = 0.10;
export const TAX_RATE = 0.05;
export const DISCOUNT_LIMIT = 2000;
export const DELIVERY_FEE = 150;
export const MANAGEMENT_PASSWORD = 'staff123';

export const RESTAURANT_NAME = 'TABLE & TALE';
export const RESTAURANT_TAGLINE = 'Where Fine Dining Meets Unforgettable Stories.';
export const RESTAURANT_ADDRESS = 'Plot 18-C, Main Khayaban-e-Shahbaz, Phase 6, DHA';
export const RESTAURANT_CONTACT = '92+ 03-1234567';
export const RESTAURANT_HOURS = '6 PM - 1 AM';
export const RECEIPT_CLOSING =
  'Thank you for choosing us! We hope your evening with us becomes a cherished chapter.';

export const CATEGORIES = [
  'Desi Delights',
  'Fast Food',
  'International Specials',
  'Desserts',
  'Beverages',
];

export const FOOD_ITEMS = [
  ['Chicken Biryani', 'Chicken Karahi', 'Beef Nihari', 'Chicken Pulao'],
  ['Zinger Burger', 'Chicken Pizza', 'French Fries', 'Club Sandwich'],
  ['Alfredo Pasta', 'Lasagna', 'Chicken Steak', 'Chow Mein'],
  ['Chocolate Cake', 'Brownie', 'Ice Cream', 'Cheesecake'],
  ['Mineral Water', 'Cold Drink', 'Fresh Juice', 'Milkshake'],
];

export const PRICES = [
  [350, 900, 550, 300],
  [450, 850, 200, 400],
  [650, 750, 950, 500],
  [250, 200, 150, 350],
  [80, 100, 180, 250],
];

export const STAFF_ROSTER = [
  { id: 'ST101', name: 'Ayesha Khan', role: 'Cashier', shift: 'night', hours: '6 PM - 9 PM' },
  { id: 'ST102', name: 'Hamza Ali', role: 'Order Manager', shift: 'mid night', hours: '9 PM - 1 AM' },
  { id: 'ST103', name: 'Sana Malik', role: 'Head Chef', shift: 'night', hours: '6 PM - 1 AM' },
  { id: 'ST104', name: 'Bilal Ahmed', role: 'Floor Supervisor', shift: 'mid night', hours: '9 PM - 1 AM' },
];

export interface BillSummary {
  subtotal: number;
  discount: number;
  discountedSubtotal: number;
  tax: number;
  deliveryCharge: number;
  billTotal: number;
}

export interface OrderRecord {
  customerName: string;
  diningType: string;
  deliveryAddress: string;
  guests: number;
  tables: boolean[];
  quantities: number[][];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryCharge: number;
  billTotal: number;
  paid: boolean;
  cancelled: boolean;
  kitchenStatus: string;
  rating: number;
  review: string;
  tip: number;
}

export interface GuestFeedback {
  customerName: string;
  rating: number;
  categories: string[];
  comment: string;
  createdAt: string;
}

export interface RestaurantState {
  totalOrders: number;
  totalSales: number;
  totalCompletedOrders: number;
  tableBooked: boolean[];
  reservedBy: string[];
  orders: OrderRecord[];
  guestFeedbacks: GuestFeedback[];
}

function roundMoney(val: number): number {
  return Math.round(val * 100) / 100;
}

export function serializeMenu() {
  const categoriesArr = CATEGORIES.map((name, index) => ({ index, name }));
  const itemsArr: Array<{
    itemNumber: number;
    categoryIndex: number;
    categoryName: string;
    itemIndex: number;
    name: string;
    price: number;
  }> = [];

  for (let i = 0; i < NUM_CATEGORIES; i++) {
    for (let j = 0; j < ITEMS_PER_CATEGORY; j++) {
      itemsArr.push({
        itemNumber: i * ITEMS_PER_CATEGORY + j + 1,
        categoryIndex: i,
        categoryName: CATEGORIES[i],
        itemIndex: j,
        name: FOOD_ITEMS[i][j],
        price: PRICES[i][j],
      });
    }
  }

  return { categories: categoriesArr, items: itemsArr };
}

export function serializeTables(state: RestaurantState) {
  const tablesArr = [];
  let booked = 0;
  for (let i = 0; i < NUM_TABLES; i++) {
    const isBooked = state.tableBooked[i] || false;
    if (isBooked) booked++;
    tablesArr.push({
      tableNumber: i + 1,
      capacity: TABLE_CAPACITY,
      booked: isBooked,
      reservedBy: state.reservedBy[i] || '',
    });
  }

  return {
    tables: tablesArr,
    summary: {
      totalTables: NUM_TABLES,
      bookedTables: booked,
      availableTables: NUM_TABLES - booked,
      tableCapacity: TABLE_CAPACITY,
      availableSeats: (NUM_TABLES - booked) * TABLE_CAPACITY,
    },
  };
}

export function serializeOrder(ord: OrderRecord, index: number) {
  const reservedTables: number[] = [];
  for (let t = 0; t < NUM_TABLES; t++) {
    if (ord.tables[t]) reservedTables.push(t + 1);
  }

  const items: Array<{
    itemNumber: number;
    name: string;
    categoryName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }> = [];

  for (let i = 0; i < NUM_CATEGORIES; i++) {
    for (let j = 0; j < ITEMS_PER_CATEGORY; j++) {
      const qty = ord.quantities[i]?.[j] || 0;
      if (qty > 0) {
        const price = PRICES[i][j];
        items.push({
          itemNumber: i * ITEMS_PER_CATEGORY + j + 1,
          name: FOOD_ITEMS[i][j],
          categoryName: CATEGORIES[i],
          quantity: qty,
          unitPrice: price,
          lineTotal: qty * price,
        });
      }
    }
  }

  return {
    orderIndex: index,
    orderId: `ORD-${(index + 1).toString().padStart(3, '0')}`,
    customerName: ord.customerName,
    diningType: ord.diningType,
    deliveryAddress: ord.deliveryAddress,
    guests: ord.guests,
    reservedTables,
    items,
    bill: {
      subtotal: ord.subtotal,
      discount: ord.discount,
      discountedSubtotal: roundMoney(ord.subtotal - ord.discount),
      tax: ord.tax,
      deliveryCharge: ord.deliveryCharge,
      billTotal: ord.billTotal,
    },
    paid: ord.paid,
    cancelled: ord.cancelled,
    kitchenStatus: ord.kitchenStatus,
    rating: ord.rating,
    review: ord.review,
    tip: ord.tip,
  };
}

export function parseQuantities(rawItems: unknown): number[][] {
  const quantities = Array.from({ length: NUM_CATEGORIES }, () =>
    Array(ITEMS_PER_CATEGORY).fill(0)
  );

  if (Array.isArray(rawItems)) {
    for (const entry of rawItems) {
      const itemNumber = Number(entry?.itemNumber ?? 0);
      const quantity = Math.max(0, Number(entry?.quantity ?? 0));
      if (itemNumber >= 1 && itemNumber <= TOTAL_MENU_ITEMS) {
        const cat = Math.floor((itemNumber - 1) / ITEMS_PER_CATEGORY);
        const it = (itemNumber - 1) % ITEMS_PER_CATEGORY;
        quantities[cat][it] += quantity;
      }
    }
  }
  return quantities;
}

export function calculateBillBreakdown(quantities: number[][], diningType: string): BillSummary {
  let subtotalInt = 0;
  for (let i = 0; i < NUM_CATEGORIES; i++) {
    for (let j = 0; j < ITEMS_PER_CATEGORY; j++) {
      const qty = Math.max(0, quantities[i]?.[j] || 0);
      subtotalInt += PRICES[i][j] * qty;
    }
  }

  const subtotal = subtotalInt;
  const discount = subtotalInt >= DISCOUNT_LIMIT ? roundMoney(subtotal * DISCOUNT_RATE) : 0;
  const discountedSubtotal = roundMoney(subtotal - discount);
  const tax = roundMoney(discountedSubtotal * TAX_RATE);
  const deliveryCharge = diningType === 'Online Delivery' ? DELIVERY_FEE : 0;
  const billTotal = roundMoney(discountedSubtotal + tax + deliveryCharge);

  return { subtotal, discount, discountedSubtotal, tax, deliveryCharge, billTotal };
}

function loadState(dataFile: string): RestaurantState {
  const defaultState: RestaurantState = {
    totalOrders: 0,
    totalSales: 0,
    totalCompletedOrders: 0,
    tableBooked: Array(NUM_TABLES).fill(false),
    reservedBy: Array(NUM_TABLES).fill(''),
    orders: [],
    guestFeedbacks: [],
  };

  try {
    if (!fs.existsSync(dataFile)) {
      return defaultState;
    }
    const content = fs.readFileSync(dataFile, 'utf8');
    const lines = content.split(/\r?\n/);
    if (!lines.length || !lines[0].trim()) return defaultState;

    let cursor = 0;
    const firstLine = lines[cursor++].trim();
    const isV3 = firstLine === 'TTv3';
    const hasKitchen = firstLine === 'TTv2' || isV3;
    const orderCountLine = hasKitchen ? lines[cursor++].trim() : firstLine;
    const totalOrders = Math.min(MAX_ORDERS, Math.max(0, parseInt(orderCountLine, 10) || 0));

    defaultState.totalOrders = totalOrders;
    defaultState.totalSales = parseFloat(lines[cursor++].trim()) || 0;
    defaultState.totalCompletedOrders = parseInt(lines[cursor++].trim(), 10) || 0;

    for (let i = 0; i < NUM_TABLES; i++) {
      const booked = lines[cursor++].trim() === '1';
      const owner = lines[cursor++].trim();
      defaultState.tableBooked[i] = booked;
      defaultState.reservedBy[i] = booked ? owner : '';
    }

    for (let k = 0; k < totalOrders; k++) {
      const ord: OrderRecord = {
        customerName: lines[cursor++].trim(),
        diningType: lines[cursor++].trim(),
        deliveryAddress: lines[cursor++].trim(),
        guests: parseInt(lines[cursor++].trim(), 10) || 0,
        tables: Array(NUM_TABLES).fill(false),
        quantities: Array.from({ length: NUM_CATEGORIES }, () => Array(ITEMS_PER_CATEGORY).fill(0)),
        subtotal: 0,
        discount: 0,
        tax: 0,
        deliveryCharge: 0,
        billTotal: 0,
        paid: false,
        cancelled: false,
        kitchenStatus: 'Queued',
        rating: 0,
        review: '',
        tip: 0,
      };

      for (let t = 0; t < NUM_TABLES; t++) {
        ord.tables[t] = lines[cursor++].trim() === '1';
      }

      for (let i = 0; i < NUM_CATEGORIES; i++) {
        for (let j = 0; j < ITEMS_PER_CATEGORY; j++) {
          ord.quantities[i][j] = parseInt(lines[cursor++].trim(), 10) || 0;
        }
      }

      ord.subtotal = parseFloat(lines[cursor++].trim()) || 0;
      ord.discount = parseFloat(lines[cursor++].trim()) || 0;
      ord.tax = parseFloat(lines[cursor++].trim()) || 0;
      ord.deliveryCharge = parseFloat(lines[cursor++].trim()) || 0;
      ord.billTotal = parseFloat(lines[cursor++].trim()) || 0;
      ord.paid = lines[cursor++].trim() === '1';
      ord.cancelled = lines[cursor++].trim() === '1';

      if (hasKitchen) {
        ord.kitchenStatus = lines[cursor++].trim() || (ord.cancelled ? 'Cancelled' : 'Queued');
      }

      ord.rating = parseInt(lines[cursor++].trim(), 10) || 0;
      ord.review = lines[cursor++].trim();
      ord.tip = parseFloat(lines[cursor++].trim()) || 0;

      defaultState.orders.push(ord);
    }

    if (isV3 && cursor < lines.length) {
      const fbCount = parseInt(lines[cursor++].trim(), 10) || 0;
      for (let f = 0; f < fbCount && cursor < lines.length; f++) {
        const name = lines[cursor++].trim();
        const rating = parseInt(lines[cursor++].trim(), 10) || 0;
        const cats = (lines[cursor++].trim() || '').split('|').filter(Boolean);
        const comment = lines[cursor++].trim();
        const createdAt = lines[cursor++].trim();
        defaultState.guestFeedbacks.push({
          customerName: name,
          rating,
          categories: cats,
          comment,
          createdAt,
        });
      }
    }
  } catch {
    // Return defaultState gracefully
  }

  return defaultState;
}

function saveState(dataFile: string, state: RestaurantState): void {
  try {
    const dir = path.dirname(dataFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const lines: string[] = ['TTv3'];
    lines.push(state.totalOrders.toString());
    lines.push(state.totalSales.toFixed(2));
    lines.push(state.totalCompletedOrders.toString());

    for (let i = 0; i < NUM_TABLES; i++) {
      lines.push(state.tableBooked[i] ? '1' : '0');
      lines.push((state.reservedBy[i] || '').replace(/[\r\n]/g, ' '));
    }

    for (let k = 0; k < state.totalOrders && k < state.orders.length; k++) {
      const ord = state.orders[k];
      lines.push((ord.customerName || '').replace(/[\r\n]/g, ' '));
      lines.push((ord.diningType || '').replace(/[\r\n]/g, ' '));
      lines.push((ord.deliveryAddress || '').replace(/[\r\n]/g, ' '));
      lines.push(ord.guests.toString());

      for (let t = 0; t < NUM_TABLES; t++) {
        lines.push(ord.tables[t] ? '1' : '0');
      }

      for (let i = 0; i < NUM_CATEGORIES; i++) {
        for (let j = 0; j < ITEMS_PER_CATEGORY; j++) {
          lines.push((ord.quantities[i]?.[j] || 0).toString());
        }
      }

      lines.push(ord.subtotal.toFixed(2));
      lines.push(ord.discount.toFixed(2));
      lines.push(ord.tax.toFixed(2));
      lines.push(ord.deliveryCharge.toFixed(2));
      lines.push(ord.billTotal.toFixed(2));
      lines.push(ord.paid ? '1' : '0');
      lines.push(ord.cancelled ? '1' : '0');
      lines.push((ord.kitchenStatus || (ord.cancelled ? 'Cancelled' : 'Queued')).replace(/[\r\n]/g, ' '));
      lines.push(ord.rating.toString());
      lines.push((ord.review || '').replace(/[\r\n]/g, ' '));
      lines.push(ord.tip.toFixed(2));
    }

    lines.push(state.guestFeedbacks.length.toString());
    for (const fb of state.guestFeedbacks) {
      lines.push((fb.customerName || '').replace(/[\r\n]/g, ' '));
      lines.push(fb.rating.toString());
      lines.push(fb.categories.map((c) => c.replace(/[\r\n|]/g, ' ')).join('|'));
      lines.push((fb.comment || '').replace(/[\r\n]/g, ' '));
      lines.push((fb.createdAt || '').replace(/[\r\n]/g, ' '));
    }

    fs.writeFileSync(dataFile, lines.join('\n') + '\n', 'utf8');
  } catch {
    // Ignore save failure in read-only / serverless contexts
  }
}

export function executeNodeEngine(payload: Record<string, unknown>): Record<string, unknown> {
  const action = String(payload.action || '');
  const dataFile = String(payload.dataFile || path.join(process.cwd(), 'data', 'tabletale_data.txt'));

  if (action === 'info') {
    return {
      ok: true,
      restaurant: {
        name: RESTAURANT_NAME,
        tagline: RESTAURANT_TAGLINE,
        address: RESTAURANT_ADDRESS,
        contact: RESTAURANT_CONTACT,
        hours: RESTAURANT_HOURS,
        receiptClosing: RECEIPT_CLOSING,
      },
      settings: {
        discountRate: DISCOUNT_RATE,
        discountLimit: DISCOUNT_LIMIT,
        taxRate: TAX_RATE,
        deliveryFee: DELIVERY_FEE,
        tableCapacity: TABLE_CAPACITY,
        numTables: NUM_TABLES,
        maxOrders: MAX_ORDERS,
      },
      menu: serializeMenu(),
    };
  }

  if (action === 'parse_quick_order') {
    const line = String(payload.line || '');
    for (const ch of line) {
      if (!(ch >= '0' && ch <= '9') && ch !== ' ' && ch !== ',') {
        return {
          ok: false,
          finishRequested: false,
          validItemNumbers: [],
          skippedNumbers: [],
          error: 'Invalid input! Use only numbers separated by spaces or commas (example: 1 2 4).',
        };
      }
    }

    const selected = Array(TOTAL_MENU_ITEMS).fill(false);
    const validItemNumbers: number[] = [];
    const skippedNumbers: number[] = [];
    let finishRequested = false;

    const tokens = line.split(/[ ,]+/).filter(Boolean);
    for (const t of tokens) {
      const num = parseInt(t, 10);
      if (num === 0) {
        finishRequested = true;
      } else if (num > TOTAL_MENU_ITEMS) {
        skippedNumbers.push(num);
      } else if (num >= 1 && !selected[num - 1]) {
        selected[num - 1] = true;
        validItemNumbers.push(num);
      }
    }

    if (validItemNumbers.length === 0 && !finishRequested) {
      return {
        ok: false,
        finishRequested,
        validItemNumbers,
        skippedNumbers,
        error: 'No valid item numbers entered. Enter item numbers between 1 and 20.',
      };
    }

    return {
      ok: true,
      finishRequested,
      validItemNumbers,
      skippedNumbers,
      error: '',
    };
  }

  if (action === 'preview_bill') {
    const quantities = parseQuantities(payload.items);
    const diningType = String(payload.diningType || 'Dine-in');
    const bill = calculateBillBreakdown(quantities, diningType);
    return { ok: true, bill };
  }

  const state = loadState(dataFile);

  if (action === 'tables') {
    const snapshot = serializeTables(state);
    return { ok: true, ...snapshot };
  }

  if (action === 'reserve_tables') {
    const customerName = String(payload.customerName || '').trim();
    const guests = Number(payload.guests || 0);
    const tableNumbers = Array.isArray(payload.tableNumbers)
      ? payload.tableNumbers.map(Number)
      : [];

    if (!customerName) {
      return { ok: false, message: 'Customer name cannot be empty.' };
    }

    let availableTables = 0;
    for (let i = 0; i < NUM_TABLES; i++) {
      if (!state.tableBooked[i]) availableTables++;
    }

    if (availableTables === 0) {
      return { ok: false, message: 'Sorry! All tables are currently reserved.' };
    }

    if (guests <= 0) {
      return { ok: false, message: 'Number of guests must be greater than zero.' };
    }

    if (guests > availableTables * TABLE_CAPACITY) {
      return {
        ok: false,
        message: `Sorry! Only ${availableTables * TABLE_CAPACITY} seats are currently available.`,
      };
    }

    const tablesNeeded = Math.ceil(guests / TABLE_CAPACITY);
    if (tableNumbers.length !== tablesNeeded) {
      return {
        ok: false,
        message: `${guests} guest(s) need exactly ${tablesNeeded} table(s) (${tablesNeeded * TABLE_CAPACITY} seats).`,
      };
    }

    const seen: Record<number, boolean> = {};
    for (const t of tableNumbers) {
      if (t < 1 || t > NUM_TABLES) {
        return { ok: false, message: `Invalid table number ${t}. Select between 1 and 10.` };
      }
      if (seen[t]) {
        return { ok: false, message: `Table ${t} was selected more than once.` };
      }
      if (state.tableBooked[t - 1]) {
        return {
          ok: false,
          message: `Table ${t} is already booked by ${state.reservedBy[t - 1]}.`,
        };
      }
      seen[t] = true;
    }

    for (const t of tableNumbers) {
      state.tableBooked[t - 1] = true;
      state.reservedBy[t - 1] = customerName;
    }

    saveState(dataFile, state);
    const tableSnapshot = serializeTables(state);

    return {
      ok: true,
      message: 'Reservation completed successfully!',
      tablesNeeded,
      reservedTables: tableNumbers,
      tables: tableSnapshot.tables,
      summary: tableSnapshot.summary,
    };
  }

  if (action === 'release_tables') {
    const tableNumbers = Array.isArray(payload.tableNumbers)
      ? payload.tableNumbers.map(Number)
      : [];
    let released = 0;
    for (const t of tableNumbers) {
      if (t >= 1 && t <= NUM_TABLES && state.tableBooked[t - 1]) {
        state.tableBooked[t - 1] = false;
        state.reservedBy[t - 1] = '';
        released++;
      }
    }
    saveState(dataFile, state);
    const tableSnapshot = serializeTables(state);
    return {
      ok: true,
      message: `Released ${released} table(s).`,
      tables: tableSnapshot.tables,
      summary: tableSnapshot.summary,
    };
  }

  if (action === 'checkout') {
    const customerName = String(payload.customerName || '').trim();
    const diningType = String(payload.diningType || '');
    const deliveryAddress = String(payload.deliveryAddress || '').trim();
    const guests = Number(payload.guests || 0);
    const tableNumbers = Array.isArray(payload.tableNumbers)
      ? payload.tableNumbers.map(Number)
      : [];
    const quantities = parseQuantities(payload.items);
    const paymentMethod = String(payload.paymentMethod || '');
    const cashGiven = Number(payload.cashGiven || 0);

    if (!customerName) return { ok: false, message: 'Customer name cannot be empty.' };
    if (!['Dine-in', 'Takeaway', 'Online Delivery'].includes(diningType)) {
      return { ok: false, message: 'Invalid order type!' };
    }
    if (diningType === 'Online Delivery' && !deliveryAddress) {
      return { ok: false, message: 'Delivery address cannot be empty!' };
    }
    if (state.totalOrders >= MAX_ORDERS) {
      return { ok: false, message: `Order limit reached (${MAX_ORDERS}). Cannot save more orders.` };
    }

    const bill = calculateBillBreakdown(quantities, diningType);
    if (bill.subtotal <= 0) return { ok: false, message: 'No items were ordered.' };

    if (!['cash', 'online', 'cancel'].includes(paymentMethod)) {
      return { ok: false, message: 'Invalid payment method! Choose cash, online, or cancel.' };
    }

    let change = 0;
    if (paymentMethod === 'cash') {
      if (cashGiven < 0) return { ok: false, message: 'Invalid cash amount.' };
      if (cashGiven + 1e-6 < bill.billTotal) {
        return {
          ok: false,
          message: `Insufficient cash given! Required: Rs. ${Math.ceil(bill.billTotal)}`,
        };
      }
      change = roundMoney(cashGiven - bill.billTotal);
    }

    const record: OrderRecord = {
      customerName,
      diningType,
      deliveryAddress: diningType === 'Online Delivery' ? deliveryAddress : '',
      guests: diningType === 'Dine-in' ? guests : 0,
      tables: Array(NUM_TABLES).fill(false),
      quantities,
      subtotal: bill.subtotal,
      discount: bill.discount,
      tax: bill.tax,
      deliveryCharge: bill.deliveryCharge,
      billTotal: bill.billTotal,
      paid: paymentMethod !== 'cancel',
      cancelled: paymentMethod === 'cancel',
      kitchenStatus: paymentMethod === 'cancel' ? 'Cancelled' : 'Queued',
      rating: 0,
      review: '',
      tip: 0,
    };

    if (diningType === 'Dine-in') {
      for (const t of tableNumbers) {
        if (t >= 1 && t <= NUM_TABLES) record.tables[t - 1] = true;
      }
    }

    if (paymentMethod !== 'cancel') {
      state.totalSales = roundMoney(state.totalSales + bill.billTotal);
      state.totalCompletedOrders++;
    }

    const orderIndex = state.totalOrders;
    state.orders.push(record);
    state.totalOrders++;

    if (tableNumbers.length > 0) {
      for (const t of tableNumbers) {
        if (t >= 1 && t <= NUM_TABLES) {
          state.tableBooked[t - 1] = false;
          state.reservedBy[t - 1] = '';
        }
      }
    }

    saveState(dataFile, state);

    return {
      ok: true,
      message:
        paymentMethod === 'cancel'
          ? 'Payment cancelled. Order has been marked as CANCELLED.'
          : paymentMethod === 'cash'
          ? 'Cash payment received successfully.'
          : 'Online payment processed successfully.',
      orderIndex,
      paid: record.paid,
      cancelled: record.cancelled,
      change,
      bill,
      order: serializeOrder(record, orderIndex),
    };
  }

  if (action === 'feedback') {
    const orderIndex = Number(payload.orderIndex ?? -1);
    const rating = Number(payload.rating ?? 0);
    const review = String(payload.review || '').trim();
    const tip = Number(payload.tip ?? 0);

    if (orderIndex < 0 || orderIndex >= state.orders.length) {
      return { ok: false, message: 'Order not found.' };
    }

    const ord = state.orders[orderIndex];
    if (!ord.paid) {
      return { ok: false, message: 'Feedback is only available for paid orders.' };
    }
    if (rating < 0 || rating > 5) {
      return { ok: false, message: 'Invalid rating! Enter a number from 0 to 5.' };
    }
    if (tip < 0) {
      return { ok: false, message: 'Invalid tip amount! Enter a non-negative amount.' };
    }

    ord.rating = rating;
    ord.review = rating > 0 ? review : '';
    ord.tip = roundMoney(tip);

    saveState(dataFile, state);

    return {
      ok: true,
      message: rating > 0 || tip > 0 ? 'Thank you for your feedback!' : 'Thank you for dining with us!',
      order: serializeOrder(ord, orderIndex),
    };
  }

  if (action === 'guest_feedback') {
    const customerName = String(payload.customerName || '').trim();
    const rating = Number(payload.rating ?? 0);
    const categories = Array.isArray(payload.categories)
      ? payload.categories.map((c) => String(c).trim()).filter(Boolean)
      : [];
    const comment = String(payload.comment || '').trim();
    const createdAt = String(payload.createdAt || '').trim();

    if (!customerName) return { ok: false, message: 'Please enter your name before submitting feedback.' };
    if (rating < 1 || rating > 5) return { ok: false, message: 'Please select an experience rating between 1 and 5 stars.' };
    if (categories.length === 0) return { ok: false, message: 'Please select at least one service category.' };
    if (!comment) return { ok: false, message: 'Please share a comment about your dining experience.' };
    if (state.guestFeedbacks.length >= 1000) return { ok: false, message: 'Feedback log capacity reached.' };

    const entry: GuestFeedback = {
      customerName,
      rating,
      categories,
      comment,
      createdAt,
    };

    const feedbackIndex = state.guestFeedbacks.length;
    state.guestFeedbacks.push(entry);
    saveState(dataFile, state);

    return {
      ok: true,
      message: 'Thank you for sharing your story with Table & Tale!',
      feedbackIndex,
      feedback: {
        feedbackIndex,
        customerName: entry.customerName,
        rating: entry.rating,
        categories: entry.categories,
        comment: entry.comment,
        createdAt: entry.createdAt,
      },
    };
  }

  if (action === 'update_kitchen_status') {
    const orderIndex = Number(payload.orderIndex ?? -1);
    const kitchenStatus = String(payload.kitchenStatus || '');

    if (orderIndex < 0 || orderIndex >= state.orders.length) {
      return { ok: false, message: 'Order not found.' };
    }

    const ord = state.orders[orderIndex];
    if (ord.cancelled) {
      return { ok: false, message: 'Cancelled orders cannot be updated in the kitchen queue.' };
    }
    if (!['Queued', 'Preparing', 'Ready', 'Served'].includes(kitchenStatus)) {
      return {
        ok: false,
        message: 'Invalid kitchen status. Allowed values: Queued, Preparing, Ready, Served.',
      };
    }

    ord.kitchenStatus = kitchenStatus;
    saveState(dataFile, state);

    return {
      ok: true,
      message: `Order #${orderIndex + 1} kitchen status updated to ${kitchenStatus}.`,
      order: serializeOrder(ord, orderIndex),
    };
  }

  if (action === 'staff_login') {
    const password = String(payload.password || '');
    const valid = password === MANAGEMENT_PASSWORD;
    return {
      ok: valid,
      message: valid ? 'Access granted. Welcome, staff member!' : 'Incorrect password.',
    };
  }

  if (action === 'management_orders') {
    const ordersArr = state.orders.map((ord, idx) => serializeOrder(ord, idx));
    return {
      ok: true,
      totalOrders: state.totalOrders,
      orders: ordersArr,
    };
  }

  if (action === 'management_sales') {
    let cancelledOrders = 0;
    let totalTips = 0;
    let ratingCount = 0;
    let ratingSum = 0;

    for (const ord of state.orders) {
      if (ord.cancelled) cancelledOrders++;
      if (ord.rating > 0) {
        ratingCount++;
        ratingSum += ord.rating;
      }
      totalTips = roundMoney(totalTips + ord.tip);
    }

    const averageRating = ratingCount > 0 ? roundMoney(ratingSum / ratingCount) : 0;

    return {
      ok: true,
      report: {
        totalOrders: state.totalOrders,
        totalCompletedOrders: state.totalCompletedOrders,
        cancelledOrders,
        totalSales: roundMoney(state.totalSales),
        totalTips,
        ratingCount,
        averageRating,
        guestFeedbackCount: state.guestFeedbacks.length,
      },
    };
  }

  if (action === 'management_feedback') {
    return {
      ok: true,
      totalFeedback: state.guestFeedbacks.length,
      feedbacks: state.guestFeedbacks.map((fb, idx) => ({
        feedbackIndex: idx,
        customerName: fb.customerName,
        rating: fb.rating,
        categories: fb.categories,
        comment: fb.comment,
        createdAt: fb.createdAt,
      })),
    };
  }

  if (action === 'management_staff') {
    return {
      ok: true,
      staff: STAFF_ROSTER,
    };
  }

  return { ok: false, message: `Unknown action: ${action}` };
}
