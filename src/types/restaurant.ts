export type AppSection = 'home' | 'menu' | 'reservations' | 'order' | 'management';

export type DiningType = 'Dine-in' | 'Takeaway' | 'Online Delivery';

export type PaymentMethod = 'cash' | 'online' | 'cancel';

export interface RestaurantInfo {
  name: string;
  tagline: string;
  address: string;
  contact: string;
  hours: string;
  receiptClosing: string;
}

export interface RestaurantSettings {
  discountRate: number;
  discountLimit: number;
  taxRate: number;
  deliveryFee: number;
  tableCapacity: number;
  numTables: number;
  maxOrders: number;
}

export interface MenuCategory {
  index: number;
  name: string;
}

export interface MenuItem {
  itemNumber: number;
  categoryIndex: number;
  categoryName: string;
  itemIndex: number;
  name: string;
  price: number;
}

export interface RestaurantBootstrap {
  ok: boolean;
  restaurant: RestaurantInfo;
  settings: RestaurantSettings;
  menu: {
    categories: MenuCategory[];
    items: MenuItem[];
  };
}

export interface TableInfo {
  tableNumber: number;
  capacity: number;
  booked: boolean;
  reservedBy: string;
}

export interface TableSummary {
  totalTables: number;
  bookedTables: number;
  availableTables: number;
  tableCapacity: number;
  availableSeats: number;
}

export interface TablesResponse {
  ok: boolean;
  tables: TableInfo[];
  summary: TableSummary;
}

export interface CartItemInput {
  itemNumber: number;
  quantity: number;
}

export interface BillSummary {
  subtotal: number;
  discount: number;
  discountedSubtotal: number;
  tax: number;
  deliveryCharge: number;
  billTotal: number;
}

export interface OrderLineItem {
  itemNumber: number;
  name: string;
  categoryName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export type KitchenStatus = 'Queued' | 'Preparing' | 'Ready' | 'Served' | 'Cancelled';

export interface OrderRecord {
  orderNumber: number;
  orderIndex: number;
  customerName: string;
  diningType: DiningType;
  deliveryAddress: string;
  guests: number;
  reservedTables: number[];
  items: OrderLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryCharge: number;
  billTotal: number;
  bill?: BillSummary;
  paid: boolean;
  cancelled: boolean;
  paymentStatus: 'PAID' | 'CANCELLED' | 'UNPAID';
  kitchenStatus: KitchenStatus;
  rating: number;
  review: string;
  tip: number;
}

export interface CheckoutResponse {
  ok: boolean;
  message: string;
  orderIndex: number;
  paid: boolean;
  cancelled: boolean;
  change: number;
  bill: BillSummary;
  order: OrderRecord | null;
}

export interface SalesReport {
  totalOrders: number;
  totalCompletedOrders: number;
  cancelledOrders: number;
  totalSales: number;
  totalTips: number;
  ratingCount: number;
  averageRating: number;
  guestFeedbackCount?: number;
}

export interface GuestFeedback {
  id: number;
  feedbackIndex: number;
  customerName: string;
  rating: number;
  categories: string[];
  comment: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  shift: string;
  hours: string;
}
