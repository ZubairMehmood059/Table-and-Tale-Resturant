import {
  CheckCircle2,
  ChefHat,
  Clock,
  Lock,
  LogOut,
  RefreshCw,
  Star,
  UtensilsCrossed,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchManagementFeedback,
  fetchManagementOrders,
  fetchManagementSales,
  fetchManagementStaff,
  managementLogin,
  managementLogout,
  managementReleaseTables,
  updateManagementOrderKitchenStatus,
} from '@/api/client';
import { SectionStage } from '@/components/ui';
import { RESTAURANT_IMAGES } from '@/constants/assets';
import { formatCurrency, formatWholeCurrency } from '@/lib/formatters';
import type {
  GuestFeedback,
  KitchenStatus,
  MenuItem,
  OrderRecord,
  SalesReport,
  StaffMember,
  TableInfo,
  TableSummary,
} from '@/types/restaurant';

interface ManagementConsoleProps {
  menuItems: MenuItem[];
  tables: TableInfo[];
  tableSummary: TableSummary | null;
  onTablesSynced: (tables: TableInfo[], summary: TableSummary) => void;
  onRefreshTables: () => Promise<void>;
}

type ManagementTab = 'orders' | 'tables' | 'sales' | 'feedback' | 'staff' | 'menu';
type ActiveKitchenStage = Exclude<KitchenStatus, 'Cancelled'>;

const KITCHEN_STAGES: ActiveKitchenStage[] = ['Queued', 'Preparing', 'Ready', 'Served'];

function getNextKitchenStage(current: KitchenStatus): ActiveKitchenStage | null {
  if (current === 'Queued') return 'Preparing';
  if (current === 'Preparing') return 'Ready';
  if (current === 'Ready') return 'Served';
  return null;
}

function getAdvanceLabel(next: ActiveKitchenStage): string {
  if (next === 'Preparing') return 'Start Preparing';
  if (next === 'Ready') return 'Mark Ready';
  return 'Mark Served';
}

export function ManagementConsole({
  menuItems,
  tables,
  tableSummary,
  onTablesSynced,
  onRefreshTables,
}: ManagementConsoleProps) {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return typeof window !== 'undefined' ? sessionStorage.getItem('tabletale_staff_token') : null;
    } catch {
      return null;
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<ManagementTab>('orders');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [guestFeedbacks, setGuestFeedbacks] = useState<GuestFeedback[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PAID' | 'CANCELLED'>('ALL');

  const [kitchenFilter, setKitchenFilter] = useState<'ALL' | KitchenStatus>('ALL');
  const [updatingOrderIndex, setUpdatingOrderIndex] = useState<number | null>(null);
  const [kitchenMessage, setKitchenMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadManagementData = useCallback(
    async (authToken: string) => {
      setLoadingData(true);
      try {
        const [ordersRes, salesRes, staffRes, feedbackRes] = await Promise.allSettled([
          fetchManagementOrders(authToken),
          fetchManagementSales(authToken),
          fetchManagementStaff(authToken),
          fetchManagementFeedback(authToken),
        ]);

        let isAuthError = false;

        if (ordersRes.status === 'fulfilled') {
          setOrders(ordersRes.value.orders || []);
        } else if (ordersRes.reason?.message?.includes('authentication required')) {
          isAuthError = true;
        }

        if (salesRes.status === 'fulfilled') {
          setSales(salesRes.value.report || null);
        } else if (salesRes.reason?.message?.includes('authentication required')) {
          isAuthError = true;
        }

        if (staffRes.status === 'fulfilled') {
          setStaff(staffRes.value.staff || []);
        } else if (staffRes.reason?.message?.includes('authentication required')) {
          isAuthError = true;
        }

        if (feedbackRes.status === 'fulfilled') {
          setGuestFeedbacks(feedbackRes.value.feedbacks || []);
        } else if (feedbackRes.reason?.message?.includes('authentication required')) {
          isAuthError = true;
        }

        if (isAuthError) {
          try {
            sessionStorage.removeItem('tabletale_staff_token');
          } catch {
            // ignore
          }
          setToken(null);
        } else {
          await onRefreshTables();
        }
      } catch {
        // preserve current session
      } finally {
        setLoadingData(false);
      }
    },
    [onRefreshTables]
  );

  useEffect(() => {
    if (token) {
      void loadManagementData(token);
    }
  }, [token, loadManagementData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const resp = await managementLogin(password);
      try {
        sessionStorage.setItem('tabletale_staff_token', resp.token);
      } catch {
        // ignore
      }
      setToken(resp.token);
      setPassword('');
      setShowPassword(false);
    } catch (err) {
      setLoginError((err as Error).message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await managementLogout(token);
      } catch {
        // Clear local session regardless
      }
    }
    try {
      sessionStorage.removeItem('tabletale_staff_token');
    } catch {
      // ignore
    }
    setToken(null);
    setOrders([]);
    setSales(null);
    setGuestFeedbacks([]);
    setKitchenMessage(null);
  };

  const handleForceReleaseTable = async (tableNumber: number) => {
    if (!token) return;
    try {
      const resp = await managementReleaseTables(token, [tableNumber]);
      onTablesSynced(resp.tables, resp.summary);
    } catch {
      // Ignore transient error
    }
  };

  const handleKitchenStatusUpdate = async (
    orderIndex: number,
    nextStatus: ActiveKitchenStage
  ) => {
    if (!token) return;
    setUpdatingOrderIndex(orderIndex);
    setKitchenMessage(null);
    try {
      const resp = await updateManagementOrderKitchenStatus(token, orderIndex, nextStatus);
      if (resp.order) {
        setOrders((prev) =>
          prev.map((ord) => (ord.orderIndex === orderIndex ? resp.order! : ord))
        );
      }
      setKitchenMessage({ type: 'success', text: resp.message });
    } catch (err) {
      setKitchenMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setUpdatingOrderIndex(null);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    if (orderFilter === 'ALL') return true;
    const paymentStatus =
      ord.paymentStatus || (ord.paid ? 'PAID' : (ord.cancelled ? 'CANCELLED' : 'UNPAID'));
    return paymentStatus === orderFilter;
  });

  const recentOrders = useMemo(() => [...orders].reverse().slice(0, 12), [orders]);

  const kitchenCounts = useMemo(() => {
    const counts: Record<KitchenStatus, number> = {
      Queued: 0,
      Preparing: 0,
      Ready: 0,
      Served: 0,
      Cancelled: 0,
    };
    for (const ord of recentOrders) {
      const status = ord.kitchenStatus || (ord.cancelled ? 'Cancelled' : 'Queued');
      counts[status] = (counts[status] || 0) + 1;
    }
    return counts;
  }, [recentOrders]);

  const filteredKitchenOrders = useMemo(() => {
    if (kitchenFilter === 'ALL') return recentOrders;
    return recentOrders.filter((ord) => ord.kitchenStatus === kitchenFilter);
  }, [recentOrders, kitchenFilter]);

  return (
    <SectionStage
      id="management"
      kicker="Staff & Operations Portal"
      title="Management Panel"
      subtitle="Protected operations workspace for customer order ledgers, live floor control, kitchen prep stages, and hospitality reviews."
      tone="linen"
      backgroundImageSrc={RESTAURANT_IMAGES.hero}
      backgroundImageAlt="Table & Tale dining room management backdrop"
      floatingImages={[
        {
          src: RESTAURANT_IMAGES.categories[1],
          alt: 'Kitchen Fast Food Signatures',
        },
        {
          src: RESTAURANT_IMAGES.categories[3],
          alt: 'Table & Tale Desserts Showcase',
        },
      ]}
      headerAction={
        token ? (
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => void loadManagementData(token)}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full border border-[#C6A36A]/75 bg-[#EFE1DA]/95 text-xs font-semibold text-[#1E1512] hover:bg-[#EED8D3] hover:border-[#B58E4C] transition-colors whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#7D591D]" />
              Refresh Reports
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#1E1512] text-[#FFF9F1] text-xs font-semibold border border-[#C6A36A]/75 hover:bg-[#2E211C] hover:border-[#DFBD7E] transition-colors whitespace-nowrap cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#DFBD7E]" />
              Lock Panel
            </motion.button>
          </div>
        ) : undefined
      }
    >
      {!token ? (
        <motion.div
          initial={{ y: 10 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 max-w-md mx-auto p-6 sm:p-10 rounded-3xl bg-[#EED8D3] border border-[#C6A36A]/75 ring-1 ring-[#C6A36A]/25 surface-card surface-card-hover"
        >
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-11 h-11 rounded-full bg-[#1E1512] border border-[#C6A36A]/75 text-[#FFF9F1] flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-[#DFBD7E]" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-[#1E1512]">Staff Login</h3>
              <p className="text-xs font-medium text-[#362823]">Up to 3 password attempts permitted</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="staff-password"
                className="block text-xs font-bold text-[#1E1512] mb-1.5"
              >
                Staff Password
              </label>
              <input
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter staff password"
                className="w-full h-11 px-4 rounded-xl bg-[#FAF1EB] border border-[#C6A36A]/65 text-base sm:text-sm font-medium text-[#1E1512] placeholder:text-[#5B4740] focus:outline-none focus:border-[#B58E4C] focus:ring-2 focus:ring-[#C6A36A]/25"
              />
              <label
                htmlFor="show-staff-password"
                className="mt-2.5 inline-flex items-center gap-2 text-xs font-semibold text-[#2D201B] hover:text-[#1E1512] cursor-pointer select-none"
              >
                <input
                  id="show-staff-password"
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-4 h-4 rounded border border-[#C6A36A] accent-[#1E1512] cursor-pointer"
                />
                <span>Show password</span>
              </label>
            </div>

            {loginError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-[#FAF1EB] border border-[#C6A36A] text-xs font-semibold text-[#1E1512]"
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn || !password}
              className="w-full py-3.5 px-6 rounded-full bg-[#1E1512] text-[#FFF9F1] text-sm font-semibold border border-[#C6A36A]/75 hover:bg-[#2E211C] hover:border-[#DFBD7E] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loggingIn ? 'Verifying...' : 'Unlock Management Panel'}
            </button>
          </form>
        </motion.div>
      ) : (
        <div className="space-y-12">
          {/* Management Sub-Navigation */}
          <div className="space-y-8">
            <div
              role="tablist"
              aria-label="Management Sections"
              className="flex flex-wrap xl:inline-flex xl:flex-nowrap items-center gap-1 p-1.5 rounded-2xl xl:rounded-full bg-[#EED8D3] border border-[#C6A36A]/65 max-w-full shadow-[0_8px_22px_-14px_rgba(30,21,18,0.25)]"
            >
              {(
                [
                  { id: 'orders', label: 'Customer Orders' },
                  { id: 'tables', label: 'Table Status' },
                  { id: 'sales', label: 'Total Sales Report' },
                  { id: 'feedback', label: `Guest Feedback (${guestFeedbacks.length})` },
                  { id: 'staff', label: 'Staff Roster' },
                  { id: 'menu', label: 'Menu Reference' },
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isActive
                        ? 'text-[#FFF9F1]'
                        : 'text-[#1E1512] hover:bg-[#FAF1EB]/75'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="mgmtTabPill"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        className="absolute inset-0 rounded-full bg-[#1E1512] border border-[#C6A36A]/75 shadow-xs"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {loadingData && (
              <p className="text-sm font-medium text-[#3D2E28]">Loading persisted C++ records...</p>
            )}

            {/* Tab 1: View Customer Orders */}
            {activeTab === 'orders' && (
              <motion.div
                key="tab-orders"
                initial={{ opacity: 0.85, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[#362823] tabular-nums">
                    Showing {filteredOrders.length} of {orders.length} recorded order(s)
                  </p>
                  <div className="flex items-center gap-1 p-1 rounded-full bg-[#EED8D3] border border-[#C6A36A]/65">
                    {(['ALL', 'PAID', 'CANCELLED'] as const).map((status) => {
                      const active = orderFilter === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setOrderFilter(status)}
                          className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                            active ? 'text-[#FFF9F1]' : 'text-[#1E1512]'
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="mgmtOrderFilterPill"
                              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                              className="absolute inset-0 rounded-full bg-[#1E1512] border border-[#C6A36A]/75"
                            />
                          )}
                          <span className="relative z-10">{status}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-[#FAF1EB]/95 border border-[#C6A36A]/60 text-center surface-card">
                    <p className="font-display text-2xl font-bold text-[#1E1512]">
                      No customer orders recorded yet
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#3D2E28]">
                      Completed and cancelled orders saved to the restaurant ledger will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...filteredOrders].reverse().map((ord) => {
                      const orderNum = ord.orderNumber || (ord.orderIndex + 1);
                      const paymentStatus =
                        ord.paymentStatus || (ord.paid ? 'PAID' : (ord.cancelled ? 'CANCELLED' : 'UNPAID'));
                      const billTotal = ord.billTotal ?? ord.bill?.billTotal ?? 0;
                      const subtotal = ord.subtotal ?? ord.bill?.subtotal ?? 0;
                      const tax = ord.tax ?? ord.bill?.tax ?? 0;

                      return (
                        <motion.div
                          key={orderNum}
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="p-5 sm:p-7 rounded-2xl bg-[#FAF1EB]/95 border border-[#C6A36A]/60 hover:border-[#B58E4C] surface-card surface-card-hover"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#C6A36A]/35">
                            <div>
                              <p className="font-mono text-xs font-semibold text-[#7D591D] tabular-nums">
                                Order #{orderNum} · {ord.diningType} · {paymentStatus} ·
                                Kitchen: {ord.kitchenStatus || 'Queued'}
                              </p>
                              <h3 className="mt-1 font-display text-2xl font-bold text-[#1E1512]">
                                {ord.customerName}
                              </h3>
                              {ord.diningType === 'Online Delivery' && ord.deliveryAddress && (
                                <p className="mt-0.5 text-xs font-medium text-[#3D2E28]">
                                  Address: {ord.deliveryAddress}
                                </p>
                              )}
                              {ord.diningType === 'Dine-in' && (
                                <p className="mt-0.5 text-xs font-medium text-[#3D2E28]">
                                  {ord.reservedTables && ord.reservedTables.length > 0
                                    ? `Tables: ${ord.reservedTables.join(', ')} · ${ord.guests} guests`
                                    : 'Walk-in (Not Reserved)'}
                                </p>
                              )}
                            </div>

                            <div className="text-right">
                              <p className="font-mono text-lg font-bold text-[#1E1512] tabular-nums">
                                {formatCurrency(billTotal)}
                              </p>
                              <p className="font-mono text-xs font-medium text-[#3D2E28] tabular-nums">
                                Subtotal {formatCurrency(subtotal)} · Tax {formatCurrency(tax)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-[#1E1512]">
                            <p>
                              Items:{' '}
                              {(ord.items || []).map((item) => `${item.name} × ${item.quantity}`).join(' · ')}
                            </p>
                            {ord.paid && (
                              <p className="font-mono font-semibold text-[#7D591D] tabular-nums">
                                Rating: {ord.rating > 0 ? `${ord.rating}/5` : 'Not given'} · Tip:{' '}
                                {formatCurrency(ord.tip)}
                              </p>
                            )}
                          </div>
                          {ord.review && (
                            <p className="mt-2 text-xs italic font-medium text-[#362823]">
                              Review: &ldquo;{ord.review}&rdquo;
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab 2: Management Table Status */}
            {activeTab === 'tables' && (
              <motion.div
                key="tab-tables"
                initial={{ opacity: 0.85, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                {tableSummary && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <motion.div
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="p-6 rounded-2xl bg-[#EED8D3] border border-[#C6A36A]/65 hover:border-[#B58E4C] surface-card surface-card-hover"
                    >
                      <p className="section-kicker">Total Tables</p>
                      <p className="mt-2 font-mono text-3xl font-bold text-[#1E1512] tabular-nums">
                        {tableSummary.totalTables}
                      </p>
                    </motion.div>
                    <motion.div
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="p-6 rounded-2xl bg-[#EED8D3] border border-[#C6A36A]/65 hover:border-[#B58E4C] surface-card surface-card-hover"
                    >
                      <p className="section-kicker">Booked Tables</p>
                      <p className="mt-2 font-mono text-3xl font-bold text-[#1E1512] tabular-nums">
                        {tableSummary.bookedTables}
                      </p>
                    </motion.div>
                    <motion.div
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="p-6 rounded-2xl bg-[#FAF1EB] border border-[#C6A36A] ring-1 ring-[#C6A36A]/35 surface-card surface-card-hover"
                    >
                      <p className="section-kicker">Available Tables</p>
                      <p className="mt-2 font-mono text-3xl font-bold text-[#1E1512] tabular-nums">
                        {tableSummary.availableTables}
                      </p>
                    </motion.div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-3.5">
                  {tables.map((t) => (
                    <motion.div
                      key={t.tableNumber}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between min-h-[124px] sm:min-h-[128px] surface-card surface-card-hover ${
                        t.booked
                          ? 'bg-[#EED8D3] border-[#C6A36A] ring-1 ring-[#C6A36A]/35'
                          : 'bg-[#FAF1EB]/95 border-[#C6A36A]/55 hover:border-[#B58E4C]'
                      }`}
                    >
                      <div>
                        <p className="font-display text-lg lg:text-xl font-bold text-[#1E1512] tabular-nums whitespace-nowrap">
                          Table {t.tableNumber}
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#7D591D]">
                          {t.booked ? `BOOKED · ${t.reservedBy}` : 'AVAILABLE'}
                        </p>
                      </div>
                      {t.booked && (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => void handleForceReleaseTable(t.tableNumber)}
                          className="mt-3 py-1.5 px-3 rounded-full bg-[#1E1512] text-[#FFF9F1] text-xs font-semibold border border-[#C6A36A]/75 hover:bg-[#2E211C] hover:border-[#DFBD7E] cursor-pointer"
                        >
                          Release Table
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tab 3: Total Sales Report */}
            {activeTab === 'sales' && (
              sales ? (
                <motion.div
                  key="tab-sales"
                  initial={{ opacity: 0.85, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5"
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="p-6 rounded-2xl bg-[#EED8D3] border border-[#C6A36A]/65 hover:border-[#B58E4C] surface-card surface-card-hover"
                  >
                    <p className="section-kicker">Total Orders Placed</p>
                    <p className="mt-2 font-mono text-3xl font-bold text-[#1E1512] tabular-nums">
                      {sales.totalOrders}
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="p-6 rounded-2xl bg-[#EED8D3] border border-[#C6A36A]/65 hover:border-[#B58E4C] surface-card surface-card-hover"
                  >
                    <p className="section-kicker">Completed Paid Orders</p>
                    <p className="mt-2 font-mono text-3xl font-bold text-[#1E1512] tabular-nums">
                      {sales.totalCompletedOrders}
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="p-6 rounded-2xl bg-[#EED8D3] border border-[#C6A36A]/65 hover:border-[#B58E4C] surface-card surface-card-hover"
                  >
                    <p className="section-kicker">Cancelled Orders</p>
                    <p className="mt-2 font-mono text-3xl font-bold text-[#1E1512] tabular-nums">
                      {sales.cancelledOrders}
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="p-6 rounded-2xl bg-[#1E1512] text-[#FFF9F1] border border-[#C6A36A] ring-2 ring-[#C6A36A]/40 surface-card surface-card-hover shadow-[0_14px_30px_-14px_rgba(30,21,18,0.5)]"
                  >
                    <p className="section-kicker-gold">
                      Total Sales Revenue
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold tabular-nums">
                      {formatCurrency(sales.totalSales)}
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="p-6 rounded-2xl bg-[#FAF1EB] border border-[#C6A36A] ring-1 ring-[#C6A36A]/35 surface-card surface-card-hover"
                  >
                    <p className="section-kicker">Total Tips Received</p>
                    <p className="mt-2 font-mono text-3xl font-bold text-[#1E1512] tabular-nums">
                      {formatCurrency(sales.totalTips)}
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="p-6 rounded-2xl bg-[#FAF1EB] border border-[#C6A36A]/65 hover:border-[#B58E4C] surface-card surface-card-hover"
                  >
                    <p className="section-kicker">Average Customer Rating</p>
                    <p className="mt-2 font-mono text-3xl font-bold text-[#1E1512] tabular-nums">
                      {sales.ratingCount > 0 ? `${sales.averageRating} / 5` : 'No ratings yet'}
                    </p>
                    {sales.ratingCount > 0 && (
                      <p className="mt-1 text-xs font-medium text-[#3D2E28] tabular-nums">
                        Based on {sales.ratingCount} order review(s)
                      </p>
                    )}
                  </motion.div>
                </motion.div>
              ) : (
                <div className="p-12 rounded-3xl bg-[#FAF1EB]/95 border border-[#C6A36A]/60 text-center surface-card">
                  <p className="font-display text-2xl font-bold text-[#1E1512]">Sales Report Pending</p>
                  <p className="mt-1 text-sm font-medium text-[#3D2E28]">Connecting to ledger totals...</p>
                </div>
              )
            )}

            {/* Tab 4: Guest Feedback Log */}
            {activeTab === 'feedback' && (
              <motion.div
                key="tab-feedback"
                initial={{ opacity: 0.85, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="p-6 rounded-2xl bg-[#EED8D3] border border-[#C6A36A]/65 hover:border-[#B58E4C] surface-card surface-card-hover"
                  >
                    <p className="section-kicker">Hospitality Submissions</p>
                    <p className="mt-2 font-mono text-3xl font-bold text-[#1E1512] tabular-nums">
                      {guestFeedbacks.length}
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="p-6 rounded-2xl bg-[#FAF1EB] border border-[#C6A36A] ring-1 ring-[#C6A36A]/35 surface-card surface-card-hover"
                  >
                    <p className="section-kicker">Average Guest Experience</p>
                    <p className="mt-2 font-mono text-3xl font-bold text-[#1E1512] tabular-nums">
                      {guestFeedbacks.length > 0
                        ? `${(
                            guestFeedbacks.reduce((sum, fb) => sum + fb.rating, 0) /
                            guestFeedbacks.length
                          ).toFixed(2)} / 5`
                        : 'No feedback yet'}
                    </p>
                  </motion.div>
                </div>

                {guestFeedbacks.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-[#FAF1EB]/95 border border-[#C6A36A]/60 text-center surface-card">
                    <p className="font-display text-2xl font-bold text-[#1E1512]">
                      No guest feedback entries saved yet
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#3D2E28]">
                      Ratings and service category notes submitted from the footer feedback modal
                      will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...guestFeedbacks].reverse().map((fb, idx) => {
                      const fbId = fb.id ?? (fb.feedbackIndex != null ? fb.feedbackIndex + 1 : idx + 1);
                      return (
                        <motion.div
                          key={fbId}
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="p-6 rounded-2xl bg-[#FAF1EB]/95 border border-[#C6A36A]/60 hover:border-[#B58E4C] surface-card surface-card-hover"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4 pb-3.5 border-b border-[#C6A36A]/35">
                            <div>
                              <p className="font-mono text-xs font-semibold text-[#7D591D] tabular-nums">
                                Guest Note #{fbId} · {(fb.categories || []).join(' · ')}
                              </p>
                              <h3 className="mt-1 font-display text-2xl font-bold text-[#1E1512]">
                                {fb.customerName}
                              </h3>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <div
                                className="flex items-center gap-1"
                                aria-label={`Rated ${fb.rating} out of 5 stars`}
                              >
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <Star
                                    key={n}
                                    className="w-4 h-4"
                                    fill={n <= fb.rating ? '#C6A36A' : 'none'}
                                    stroke={n <= fb.rating ? '#7D591D' : '#B58E4C'}
                                  />
                                ))}
                                <span className="ml-1.5 font-mono text-xs font-bold text-[#1E1512] tabular-nums">
                                  {fb.rating}/5
                                </span>
                              </div>
                              {fb.createdAt && (
                                <p className="font-mono text-xs font-medium text-[#3D2E28] tabular-nums">
                                  {new Date(fb.createdAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="mt-3.5 text-sm italic font-medium text-[#1E1512] leading-relaxed">
                            &ldquo;{fb.comment}&rdquo;
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab 5: Staff Management */}
            {activeTab === 'staff' && (
              <motion.div
                key="tab-staff"
                initial={{ opacity: 0.85, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-x-auto rounded-2xl border border-[#C6A36A]/65 bg-[#FAF1EB]/95 surface-card"
              >
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-[#EED8D3] text-left text-xs font-bold text-[#1E1512] border-b border-[#C6A36A]/45">
                    <tr>
                      <th className="py-3.5 px-5">Employee ID</th>
                      <th className="py-3.5 px-5">Name</th>
                      <th className="py-3.5 px-5">Designation</th>
                      <th className="py-3.5 px-5">Shift</th>
                      <th className="py-3.5 px-5">Working Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C6A36A]/30">
                    {staff.map((member) => (
                      <tr key={member.id} className="hover:bg-[#EED8D3]/45 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#7D591D]">
                          {member.id}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-[#1E1512]">
                          {member.name}
                        </td>
                        <td className="py-3.5 px-5 font-medium text-[#1E1512]">{member.role}</td>
                        <td className="py-3.5 px-5 capitalize font-medium text-[#3D2E28]">{member.shift}</td>
                        <td className="py-3.5 px-5 font-mono text-xs font-semibold text-[#1E1512] tabular-nums">
                          {member.hours}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}

            {/* Tab 6: View Menu Reference */}
            {activeTab === 'menu' && (
              <motion.div
                key="tab-menu"
                initial={{ opacity: 0.85, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-x-auto rounded-2xl border border-[#C6A36A]/65 bg-[#FAF1EB]/95 surface-card"
              >
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="bg-[#EED8D3] text-left text-xs font-bold text-[#1E1512] border-b border-[#C6A36A]/45">
                    <tr>
                      <th className="py-3 px-5">Item #</th>
                      <th className="py-3 px-5">Category</th>
                      <th className="py-3 px-5">Food Item</th>
                      <th className="py-3 px-5 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C6A36A]/30">
                    {menuItems.map((item) => (
                      <tr key={item.itemNumber} className="hover:bg-[#EED8D3]/45 transition-colors">
                        <td className="py-3 px-5 font-mono text-xs font-bold text-[#7D591D] tabular-nums">
                          #{String(item.itemNumber).padStart(2, '0')}
                        </td>
                        <td className="py-3 px-5 font-medium text-[#3D2E28]">{item.categoryName}</td>
                        <td className="py-3 px-5 font-bold text-[#1E1512]">{item.name}</td>
                        <td className="py-3 px-5 text-right font-mono font-bold text-[#1E1512] tabular-nums">
                          {formatWholeCurrency(item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </div>

          {/* Dedicated Section: Recent Order History & Kitchen Staff Status Tracking */}
          <section
            aria-labelledby="kitchen-history-heading"
            className="pt-12 border-t border-[#C6A36A]/45 space-y-6"
          >
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
              <div>
                <p className="section-kicker">Kitchen Operations · Head Chef &amp; Line Prep</p>
                <h3
                  id="kitchen-history-heading"
                  className="mt-2 font-display text-3xl sm:text-4xl font-bold text-[#1E1512]"
                >
                  Recent Order History &amp; Kitchen Status
                </h3>
              </div>

              <div
                role="tablist"
                aria-label="Filter recent kitchen orders by preparation stage"
                className="flex flex-wrap xl:flex-nowrap items-center gap-1 p-1.5 rounded-2xl xl:rounded-full bg-[#EED8D3] border border-[#C6A36A]/65 max-w-full"
              >
                {(['ALL', 'Queued', 'Preparing', 'Ready', 'Served', 'Cancelled'] as const).map(
                  (stage) => {
                    const active = kitchenFilter === stage;
                    return (
                      <button
                        key={stage}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setKitchenFilter(stage)}
                        className={`relative px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          active
                            ? 'text-[#FFF9F1]'
                            : 'text-[#1E1512] hover:bg-[#FAF1EB]/75'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="mgmtKitchenPill"
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                            className="absolute inset-0 rounded-full bg-[#1E1512] border border-[#C6A36A]/75"
                          />
                        )}
                        <span className="relative z-10">
                          {stage === 'ALL'
                            ? `All Recent (${recentOrders.length})`
                            : `${stage} (${kitchenCounts[stage]})`}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="p-5 rounded-2xl bg-[#FAF1EB]/95 border border-[#C6A36A]/65 hover:border-[#B58E4C] surface-card surface-card-hover flex items-center justify-between gap-3"
              >
                <div>
                  <p className="section-kicker">Queued</p>
                  <p className="mt-1.5 font-mono text-2xl font-bold text-[#1E1512] tabular-nums">
                    {kitchenCounts.Queued}
                  </p>
                </div>
                <Clock className="w-5 h-5 text-[#7D591D] shrink-0" />
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="p-5 rounded-2xl bg-[#EED8D3] border border-[#C6A36A]/65 hover:border-[#B58E4C] surface-card surface-card-hover flex items-center justify-between gap-3"
              >
                <div>
                  <p className="section-kicker">Preparing</p>
                  <p className="mt-1.5 font-mono text-2xl font-bold text-[#1E1512] tabular-nums">
                    {kitchenCounts.Preparing}
                  </p>
                </div>
                <ChefHat className="w-5 h-5 text-[#1E1512] shrink-0" />
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="p-5 rounded-2xl bg-[#FAF1EB] border border-[#C6A36A] ring-1 ring-[#C6A36A]/35 surface-card surface-card-hover flex items-center justify-between gap-3"
              >
                <div>
                  <p className="section-kicker">Ready for Service</p>
                  <p className="mt-1.5 font-mono text-2xl font-bold text-[#1E1512] tabular-nums">
                    {kitchenCounts.Ready}
                  </p>
                </div>
                <UtensilsCrossed className="w-5 h-5 text-[#7D591D] shrink-0" />
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="p-5 rounded-2xl bg-[#1E1512] text-[#FFF9F1] border border-[#C6A36A] ring-2 ring-[#C6A36A]/40 surface-card surface-card-hover flex items-center justify-between gap-3 shadow-[0_12px_26px_-14px_rgba(30,21,18,0.5)]"
              >
                <div>
                  <p className="section-kicker-gold">
                    Served
                  </p>
                  <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums">
                    {kitchenCounts.Served}
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#DFBD7E] shrink-0" />
              </motion.div>
            </div>

            {kitchenMessage && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={`px-4 py-3 rounded-xl border text-xs font-semibold surface-card ${
                  kitchenMessage.type === 'error'
                    ? 'bg-[#EED8D3] border-[#B58E4C] text-[#1E1512]'
                    : 'bg-[#FAF1EB] border-[#C6A36A] text-[#1E1512]'
                }`}
              >
                {kitchenMessage.text}
              </motion.div>
            )}

            {filteredKitchenOrders.length === 0 ? (
              <div className="p-10 rounded-3xl bg-[#FAF1EB]/95 border border-[#C6A36A]/60 text-center surface-card">
                <p className="font-display text-2xl font-bold text-[#1E1512]">
                  No recent kitchen orders in this stage
                </p>
                <p className="mt-1 text-sm font-medium text-[#3D2E28]">
                  New customer orders appear here automatically as Queued for kitchen preparation.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredKitchenOrders.map((ord) => {
                  const nextStage = getNextKitchenStage(ord.kitchenStatus);
                  const isUpdating = updatingOrderIndex === ord.orderIndex;

                  return (
                    <motion.div
                      key={`kitchen-${ord.orderNumber}`}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="p-5 sm:p-6 rounded-2xl bg-[#FAF1EB]/95 border border-[#C6A36A]/60 hover:border-[#B58E4C] surface-card surface-card-hover flex flex-col xl:flex-row xl:items-center justify-between gap-4 xl:gap-5"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#3D2E28]">
                          <span className="font-mono font-bold text-[#7D591D] tabular-nums">
                            Order #{ord.orderNumber}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{ord.diningType}</span>
                          {ord.diningType === 'Dine-in' && ord.reservedTables.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                Table {ord.reservedTables.join(', ')} ({ord.guests} guests)
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-bold text-[#1E1512]">
                            Kitchen Status: {ord.kitchenStatus}
                          </span>
                        </div>

                        <h4 className="font-display text-2xl font-bold text-[#1E1512]">
                          {ord.customerName}
                        </h4>

                        <p className="text-sm font-medium text-[#1E1512]">
                          {ord.items.map((item) => (
                            <span
                              key={item.itemNumber}
                              className="inline-block mr-4 tabular-nums"
                            >
                              <strong className="font-mono">{item.quantity}×</strong> {item.name}
                            </span>
                          ))}
                        </p>
                      </div>

                      {!ord.cancelled ? (
                        <div className="w-full lg:w-auto flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 shrink-0">
                          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-1 p-1 rounded-2xl sm:rounded-full bg-[#EED8D3] border border-[#C6A36A]/65">
                            {KITCHEN_STAGES.map((stage) => {
                              const isCurrent = ord.kitchenStatus === stage;
                              return (
                                <button
                                  key={stage}
                                  type="button"
                                  disabled={isUpdating || isCurrent}
                                  onClick={() =>
                                    void handleKitchenStatusUpdate(ord.orderIndex, stage)
                                  }
                                  className={`relative px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                                    isCurrent
                                      ? 'text-[#FFF9F1]'
                                      : 'text-[#1E1512] hover:bg-[#FAF1EB]/80 cursor-pointer disabled:opacity-50'
                                  }`}
                                >
                                  {isCurrent && (
                                    <motion.span
                                      layoutId={`kitchenStage-${ord.orderNumber}`}
                                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                                      className="absolute inset-0 rounded-full bg-[#1E1512] border border-[#C6A36A]/75"
                                    />
                                  )}
                                  <span className="relative z-10">{stage}</span>
                                </button>
                              );
                            })}
                          </div>

                          {nextStage && (
                            <motion.button
                              type="button"
                              disabled={isUpdating}
                              whileTap={{ scale: 0.96 }}
                              onClick={() =>
                                void handleKitchenStatusUpdate(ord.orderIndex, nextStage)
                              }
                              className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#C6A36A] border border-[#B58E4C] text-[#1E1512] text-xs font-bold hover:bg-[#DFBD7E] disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              {isUpdating ? 'Updating...' : getAdvanceLabel(nextStage)}
                            </motion.button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-mono font-bold text-[#3D2E28]">
                          Order Cancelled · No Prep Required
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </SectionStage>
  );
}
