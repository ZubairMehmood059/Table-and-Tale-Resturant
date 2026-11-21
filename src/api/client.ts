import type {
  BillSummary,
  CartItemInput,
  CheckoutResponse,
  DiningType,
  GuestFeedback,
  KitchenStatus,
  OrderRecord,
  PaymentMethod,
  RestaurantBootstrap,
  SalesReport,
  StaffMember,
  TablesResponse,
} from '@/types/restaurant';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const finalUrl = url.startsWith('/') && API_BASE ? `${API_BASE}${url}` : url;
  const response = await fetch(finalUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    if (text.trim().startsWith('<') || text.includes('<!doctype') || text.includes('<html')) {
      throw new Error(
        `API server returned HTML instead of JSON (${response.status}) from ${url}. Ensure the backend or Netlify function is active.`
      );
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Invalid JSON received (${response.status}): ${text.slice(0, 100)}`);
    }
  }

  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

export function fetchRestaurantInfo(): Promise<RestaurantBootstrap> {
  return requestJson<RestaurantBootstrap>('/api/restaurant/info');
}

export function fetchTables(): Promise<TablesResponse> {
  return requestJson<TablesResponse>('/api/tables');
}

export function parseQuickOrderLine(line: string): Promise<{
  ok: boolean;
  finishRequested: boolean;
  validItemNumbers: number[];
  skippedNumbers: number[];
  error: string;
}> {
  return requestJson('/api/orders/parse-quick', {
    method: 'POST',
    body: JSON.stringify({ line }),
  });
}

export function reserveTables(payload: {
  customerName: string;
  guests: number;
  tableNumbers: number[];
}): Promise<
  TablesResponse & {
    message: string;
    tablesNeeded: number;
    reservedTables: number[];
  }
> {
  return requestJson('/api/reservations/reserve', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function releaseTables(tableNumbers: number[]): Promise<TablesResponse & { message: string }> {
  return requestJson('/api/reservations/release', {
    method: 'POST',
    body: JSON.stringify({ tableNumbers }),
  });
}

export function previewBill(payload: {
  items: CartItemInput[];
  diningType: DiningType;
}): Promise<{ ok: boolean; bill: BillSummary }> {
  return requestJson('/api/orders/preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function checkoutOrder(payload: {
  customerName: string;
  diningType: DiningType;
  deliveryAddress: string;
  guests: number;
  tableNumbers: number[];
  items: CartItemInput[];
  paymentMethod: PaymentMethod;
  cashGiven: number;
}): Promise<CheckoutResponse> {
  return requestJson('/api/orders/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function submitOrderFeedback(
  orderIndex: number,
  payload: { rating: number; review: string; tip: number }
): Promise<{ ok: boolean; message: string; order: OrderRecord | null }> {
  return requestJson(`/api/orders/${orderIndex}/feedback`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function managementLogin(password: string): Promise<{
  ok: boolean;
  token: string;
  message: string;
}> {
  return requestJson('/api/management/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export function managementLogout(token: string): Promise<{ ok: boolean }> {
  return requestJson('/api/management/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchManagementOrders(token: string): Promise<{
  ok: boolean;
  totalOrders: number;
  orders: OrderRecord[];
}> {
  return requestJson('/api/management/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchManagementSales(token: string): Promise<{
  ok: boolean;
  report: SalesReport;
}> {
  return requestJson('/api/management/sales', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchManagementStaff(token: string): Promise<{
  ok: boolean;
  staff: StaffMember[];
}> {
  return requestJson('/api/management/staff', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function managementReleaseTables(
  token: string,
  tableNumbers: number[]
): Promise<TablesResponse & { message: string }> {
  return requestJson('/api/management/tables/release', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tableNumbers }),
  });
}

export function updateManagementOrderKitchenStatus(
  token: string,
  orderIndex: number,
  kitchenStatus: Exclude<KitchenStatus, 'Cancelled'>
): Promise<{ ok: boolean; message: string; order: OrderRecord | null }> {
  return requestJson(`/api/management/orders/${orderIndex}/kitchen-status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ kitchenStatus }),
  });
}

export function submitGuestFeedback(payload: {
  customerName: string;
  rating: number;
  categories: string[];
  comment: string;
}): Promise<{
  ok: boolean;
  message: string;
  feedbackIndex: number;
  feedback: GuestFeedback | null;
}> {
  return requestJson('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchManagementFeedback(token: string): Promise<{
  ok: boolean;
  totalFeedback: number;
  feedbacks: GuestFeedback[];
}> {
  return requestJson('/api/management/feedback', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

