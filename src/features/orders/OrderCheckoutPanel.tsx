import { Minus, Plus, Printer, Star, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import {
  checkoutOrder,
  previewBill,
  releaseTables,
  submitOrderFeedback,
} from '@/api/client';
import { SectionStage } from '@/components/ui';
import { RESTAURANT_IMAGES } from '@/constants/assets';
import { formatCurrency, formatWholeCurrency } from '@/lib/formatters';
import type {
  AppSection,
  BillSummary,
  CartItemInput,
  CheckoutResponse,
  DiningType,
  MenuItem,
  OrderRecord,
  PaymentMethod,
  RestaurantInfo,
  RestaurantSettings,
} from '@/types/restaurant';

interface OrderCheckoutPanelProps {
  restaurant: RestaurantInfo;
  settings: RestaurantSettings;
  menuItems: MenuItem[];
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  diningType: DiningType;
  onDiningTypeChange: (type: DiningType) => void;
  deliveryAddress: string;
  onDeliveryAddressChange: (addr: string) => void;
  reservedTables: number[];
  guests: number;
  cart: Record<number, number>;
  onSetQuantity: (itemNumber: number, qty: number) => void;
  onClearCartAndReservation: () => void;
  onNavigate: (section: AppSection) => void;
  onRefreshTables: () => Promise<void>;
}

const DINING_TYPES: DiningType[] = ['Dine-in', 'Takeaway', 'Online Delivery'];

export function OrderCheckoutPanel({
  restaurant,
  settings,
  menuItems,
  customerName,
  onCustomerNameChange,
  diningType,
  onDiningTypeChange,
  deliveryAddress,
  onDeliveryAddressChange,
  reservedTables,
  guests,
  cart,
  onSetQuantity,
  onClearCartAndReservation,
  onNavigate,
  onRefreshTables,
}: OrderCheckoutPanelProps) {
  const [bill, setBill] = useState<BillSummary>({
    subtotal: 0,
    discount: 0,
    discountedSubtotal: 0,
    tax: 0,
    deliveryCharge: 0,
    billTotal: 0,
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashGivenInput, setCashGivenInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResponse | null>(null);

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [tipInput, setTipInput] = useState('0');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState<string | null>(null);
  const [finalOrderRecord, setFinalOrderRecord] = useState<OrderRecord | null>(null);

  const cartLines = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([itemNumStr, qty]) => {
        const itemNumber = Number(itemNumStr);
        const dish = menuItems.find((m) => m.itemNumber === itemNumber);
        return dish
          ? {
              ...dish,
              quantity: qty,
              lineTotal: dish.price * qty,
            }
          : null;
      })
      .filter((line): line is NonNullable<typeof line> => line !== null);
  }, [cart, menuItems]);

  const cartInputs: CartItemInput[] = useMemo(
    () => cartLines.map((l) => ({ itemNumber: l.itemNumber, quantity: l.quantity })),
    [cartLines]
  );

  useEffect(() => {
    let active = true;
    const syncBill = async () => {
      if (cartInputs.length === 0) {
        if (active) {
          setBill({
            subtotal: 0,
            discount: 0,
            discountedSubtotal: 0,
            tax: 0,
            deliveryCharge: diningType === 'Online Delivery' ? settings.deliveryFee : 0,
            billTotal: 0,
          });
        }
        return;
      }

      try {
        const resp = await previewBill({ items: cartInputs, diningType });
        if (active && resp.ok) {
          setBill(resp.bill);
        }
      } catch {
        // Keep last preview if transient error
      }
    };

    void syncBill();
    return () => {
      active = false;
    };
  }, [cartInputs, diningType, settings.deliveryFee]);

  const handleCheckout = async (method: PaymentMethod) => {
    setErrorMsg(null);

    if (!customerName.trim()) {
      setErrorMsg('Customer name cannot be empty.');
      return;
    }

    if (cartInputs.length === 0) {
      setErrorMsg('Your order is empty. Add items from the menu first.');
      return;
    }

    if (diningType === 'Online Delivery' && !deliveryAddress.trim()) {
      setErrorMsg('Delivery address cannot be empty for Online Delivery.');
      return;
    }

    const cashAmount = method === 'cash' ? Number(cashGivenInput || 0) : 0;
    if (method === 'cash' && (Number.isNaN(cashAmount) || cashAmount < bill.billTotal)) {
      setErrorMsg(`Insufficient cash given. Minimum required: ${formatCurrency(bill.billTotal)}.`);
      return;
    }

    setProcessing(true);
    try {
      const resp = await checkoutOrder({
        customerName: customerName.trim(),
        diningType,
        deliveryAddress: diningType === 'Online Delivery' ? deliveryAddress.trim() : '',
        guests: diningType === 'Dine-in' ? guests : 0,
        tableNumbers: diningType === 'Dine-in' ? reservedTables : [],
        items: cartInputs,
        paymentMethod: method,
        cashGiven: cashAmount,
      });

      setCheckoutResult(resp);
      setFinalOrderRecord(resp.order);
      onClearCartAndReservation();
      await onRefreshTables();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelDraftOrder = async () => {
    setErrorMsg(null);
    if (reservedTables.length > 0) {
      try {
        await releaseTables(reservedTables);
        await onRefreshTables();
      } catch {
        // Non-blocking release
      }
    }
    onClearCartAndReservation();
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutResult || checkoutResult.orderIndex < 0) return;

    const tipAmount = Math.max(0, Number(tipInput) || 0);
    setSubmittingFeedback(true);
    setErrorMsg(null);

    try {
      const resp = await submitOrderFeedback(checkoutResult.orderIndex, {
        rating,
        review: rating > 0 ? review.trim() : '',
        tip: tipAmount,
      });
      setFeedbackSaved(resp.message);
      if (resp.order) {
        setFinalOrderRecord(resp.order);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const startNewCustomerFlow = () => {
    setCheckoutResult(null);
    setFinalOrderRecord(null);
    setFeedbackSaved(null);
    setRating(0);
    setReview('');
    setTipInput('0');
    setCashGivenInput('');
    setErrorMsg(null);
  };

  const discountGap = Math.max(0, settings.discountLimit - bill.subtotal);

  if (checkoutResult) {
    const order = finalOrderRecord || checkoutResult.order;
    return (
      <SectionStage
        id="order"
        kicker={checkoutResult.paid ? 'Official Receipt · Paid' : 'Order Cancelled'}
        title={restaurant.name}
        subtitle="Your itemized hospitality record and optional gratuity or dining review."
        tone="blush"
        backgroundImageSrc={RESTAURANT_IMAGES.categories[3]}
        backgroundImageAlt="Table & Tale dessert showcase"
        floatingImages={[
          {
            src: RESTAURANT_IMAGES.categories[3],
            alt: 'Artisanal Chocolate Cake & Cheesecake',
          },
          {
            src: '/assets/aistudio/lemon-orange-strawberry-juice-bl_5c0d976a.png',
            alt: 'Freshly pressed craft juices',
          },
        ]}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ y: 14 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="p-5 sm:p-8 lg:p-11 rounded-3xl bg-[#FAF1EB] border border-[#C6A36A] ring-2 ring-[#C6A36A]/35 surface-card"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#C6A36A]/40">
              <div>
                <p className="section-kicker">
                  {checkoutResult.paid ? 'Official Receipt · Paid' : 'Order Cancelled'}
                </p>
                <h3 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold text-[#1E1512]">
                  {restaurant.name}
                </h3>
                <p className="mt-1 text-xs font-medium text-[#3D2E28]">
                  {restaurant.address} · {restaurant.contact}
                </p>
              </div>

              <div className="no-print flex flex-wrap items-center gap-3">
                {checkoutResult.paid && (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#C6A36A]/75 bg-[#EFE1DA] text-xs font-semibold text-[#1E1512] hover:bg-[#EED8D3] hover:border-[#B58E4C] transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#7D591D]" />
                    Print Receipt
                  </button>
                )}
                <button
                  type="button"
                  onClick={startNewCustomerFlow}
                  className="px-5 py-2.5 rounded-full bg-[#1E1512] text-[#FFF9F1] text-xs font-semibold border border-[#C6A36A]/75 hover:bg-[#2E211C] hover:border-[#DFBD7E] transition-colors cursor-pointer"
                >
                  New Order
                </button>
              </div>
            </div>

            {order && (
              <>
                <div className="py-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-[#C6A36A]/35 text-sm">
                  <div>
                    <p className="text-xs font-medium text-[#3D2E28]">Customer</p>
                    <p className="mt-0.5 font-bold text-[#1E1512]">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#3D2E28]">Order # &amp; Type</p>
                    <p className="mt-0.5 font-bold text-[#1E1512] tabular-nums">
                      #{order.orderNumber} · {order.diningType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#3D2E28]">
                      {order.diningType === 'Online Delivery'
                        ? 'Delivery Address'
                        : 'Table Seating'}
                    </p>
                    <p className="mt-0.5 font-bold text-[#1E1512]">
                      {order.diningType === 'Online Delivery'
                        ? order.deliveryAddress
                        : order.reservedTables.length > 0
                        ? `Table(s) ${order.reservedTables.join(', ')} (${order.guests} guests)`
                        : 'Walk-in / No Reservation'}
                    </p>
                  </div>
                </div>

                <div className="py-6 border-b border-[#C6A36A]/35 overflow-x-auto">
                  <table className="w-full min-w-[460px] text-sm">
                    <thead>
                      <tr className="text-left text-xs text-[#3D2E28] border-b border-[#C6A36A]/35">
                        <th className="pb-3 font-semibold">Food Item</th>
                        <th className="pb-3 font-semibold text-right">Qty</th>
                        <th className="pb-3 font-semibold text-right">Price</th>
                        <th className="pb-3 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#C6A36A]/25">
                      {order.items.map((line) => (
                        <tr key={line.itemNumber}>
                          <td className="py-3 text-[#1E1512] font-semibold">{line.name}</td>
                          <td className="py-3 text-right font-mono font-semibold tabular-nums text-[#1E1512]">
                            {line.quantity}
                          </td>
                          <td className="py-3 text-right font-mono tabular-nums text-[#3D2E28]">
                            {formatWholeCurrency(line.unitPrice)}
                          </td>
                          <td className="py-3 text-right font-mono tabular-nums text-[#1E1512] font-bold">
                            {formatWholeCurrency(line.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-6 space-y-2.5 text-sm max-w-sm ml-auto">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#3D2E28]">Subtotal</span>
                    <span className="font-mono font-semibold tabular-nums text-[#1E1512]">
                      {formatCurrency(order.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-[#3D2E28]">Discount (10%)</span>
                    <span className="font-mono font-semibold tabular-nums text-[#7D591D]">
                      -{formatCurrency(order.discount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-[#3D2E28]">Tax (5%)</span>
                    <span className="font-mono font-semibold tabular-nums text-[#1E1512]">
                      {formatCurrency(order.tax)}
                    </span>
                  </div>
                  {order.deliveryCharge > 0 && (
                    <div className="flex justify-between">
                      <span className="font-medium text-[#3D2E28]">Delivery Charge</span>
                      <span className="font-mono font-semibold tabular-nums text-[#1E1512]">
                        {formatCurrency(order.deliveryCharge)}
                      </span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-[#C6A36A]/45 flex justify-between text-base font-bold text-[#1E1512]">
                    <span>{order.paid ? 'Amount Paid' : 'Order Total'}</span>
                    <span className="font-mono tabular-nums">{formatCurrency(order.billTotal)}</span>
                  </div>
                  {checkoutResult.paid && checkoutResult.change > 0 && (
                    <div className="flex justify-between text-xs text-[#7D591D] font-semibold">
                      <span>Cash Change Returned</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(checkoutResult.change)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs pt-1">
                    <span className="font-medium text-[#3D2E28]">Payment Status</span>
                    <span className="font-mono font-bold text-[#1E1512]">
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                <p className="mt-9 pt-6 border-t border-[#C6A36A]/35 text-center font-display italic font-medium text-base text-[#362823]">
                  {restaurant.receiptClosing}
                </p>
              </>
            )}
          </motion.div>

          {checkoutResult.paid && (
            <motion.div
              initial={{ y: 14 }}
              animate={{ y: 0 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="no-print p-5 sm:p-8 lg:p-10 rounded-3xl bg-[#EED8D3] border border-[#C6A36A]/65 surface-card surface-card-hover"
            >
              <h3 className="font-display text-3xl font-bold text-[#1E1512]">
                Customer Feedback &amp; Gratuity
              </h3>
              <p className="mt-1.5 text-sm font-medium text-[#362823]">
                Share your dining experience (1–5 stars) and optionally add a tip for our staff.
              </p>

              {feedbackSaved ? (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 p-5 rounded-2xl bg-[#FAF1EB] border border-[#C6A36A] ring-2 ring-[#C6A36A]/30 text-sm text-[#1E1512] surface-card"
                >
                  <p className="font-bold">{feedbackSaved}</p>
                  {finalOrderRecord && (
                    <p className="mt-1 text-xs font-medium text-[#3D2E28]">
                      Rating:{' '}
                      {finalOrderRecord.rating > 0 ? `${finalOrderRecord.rating}/5` : 'Skipped'} ·
                      Tip: {formatCurrency(finalOrderRecord.tip)}
                    </p>
                  )}
                </motion.div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="mt-6 space-y-5">
                  <div>
                    <span className="block text-xs font-bold text-[#1E1512] mb-2">
                      Rate Your Experience (or leave unselected to skip)
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          type="button"
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => setRating(rating === star ? 0 : star)}
                          aria-label={`Rate ${star} out of 5`}
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                            star <= rating
                              ? 'bg-[#1E1512] border-[#C6A36A] text-[#DFBD7E] ring-2 ring-[#C6A36A]/35'
                              : 'bg-[#FAF1EB] border-[#C6A36A]/60 text-[#3D2E28] hover:border-[#B58E4C]'
                          }`}
                        >
                          <Star
                            className="w-4 h-4"
                            fill={star <= rating ? '#DFBD7E' : 'none'}
                            stroke={star <= rating ? '#DFBD7E' : '#7D591D'}
                          />
                        </motion.button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-1 sm:ml-2 font-mono text-xs font-bold text-[#1E1512] tabular-nums">
                          {rating} / 5
                        </span>
                      )}
                    </div>
                  </div>

                  {rating > 0 && (
                    <div>
                      <label
                        htmlFor="feedback-review"
                        className="block text-xs font-bold text-[#1E1512] mb-1.5"
                      >
                        Short Review (Optional)
                      </label>
                      <textarea
                        id="feedback-review"
                        rows={2}
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Share a note about your meal or service..."
                        className="w-full px-4 py-3 rounded-xl bg-[#FAF1EB] border border-[#C6A36A]/65 text-base sm:text-sm text-[#1E1512] placeholder:text-[#5B4740] focus:outline-none focus:border-[#B58E4C] focus:ring-2 focus:ring-[#C6A36A]/25"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="feedback-tip"
                      className="block text-xs font-bold text-[#1E1512] mb-1.5"
                    >
                      Gratuity / Tip Amount (Rs.)
                    </label>
                    <input
                      id="feedback-tip"
                      type="number"
                      min={0}
                      step="10"
                      value={tipInput}
                      onChange={(e) => setTipInput(e.target.value)}
                      className="w-44 h-11 px-4 rounded-xl bg-[#FAF1EB] border border-[#C6A36A]/65 font-mono text-base sm:text-sm font-semibold text-[#1E1512] tabular-nums focus:outline-none focus:border-[#B58E4C] focus:ring-2 focus:ring-[#C6A36A]/25"
                    />
                  </div>

                  {errorMsg && (
                    <p className="text-sm font-medium text-[#1E1512] bg-[#FAF1EB] p-3.5 rounded-xl border border-[#C6A36A]">
                      {errorMsg}
                    </p>
                  )}

                  <motion.button
                    type="submit"
                    disabled={submittingFeedback}
                    whileTap={{ scale: 0.985 }}
                    className="px-7 py-3.5 rounded-full bg-[#1E1512] text-[#FFF9F1] text-sm font-semibold border border-[#C6A36A]/75 hover:bg-[#2E211C] hover:border-[#DFBD7E] transition-colors cursor-pointer"
                  >
                    {submittingFeedback ? 'Saving Feedback...' : 'Submit Feedback & Complete'}
                  </motion.button>
                </form>
              )}
            </motion.div>
          )}
        </div>
      </SectionStage>
    );
  }

  return (
    <SectionStage
      id="order"
      kicker="Customer Flow · Review & Checkout"
      title="Order Summary & Billing"
      subtitle={`Select Dine-in, Takeaway, or Online Delivery and inspect real-time discount and ${Math.round(settings.taxRate * 100)}% tax calculations.`}
      tone="blush"
      backgroundImageSrc={RESTAURANT_IMAGES.categories[2]}
      backgroundImageAlt="Table & Tale culinary service"
      floatingImages={[
        {
          src: '/assets/aistudio/view-delicious-food-sold-streets_614bf49c.png',
          alt: 'Crispy golden Zinger Burger',
        },
        {
          src: '/assets/aistudio/lemon-orange-strawberry-juice-bl_5c0d976a.png',
          alt: 'Chilled citrus and berry craft juices',
        },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-start">
        {/* Left: Customer Details + Order Review Table */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div
            initial={{ y: 10 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="p-5 sm:p-7 rounded-3xl bg-[#EED8D3] border border-[#C6A36A]/65 surface-card surface-card-hover space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-5">
                <label
                  htmlFor="checkout-customer-name"
                  className="block text-xs font-bold text-[#1E1512] mb-1.5"
                >
                  Customer Name
                </label>
                <input
                  id="checkout-customer-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => onCustomerNameChange(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF1EB] border border-[#C6A36A]/65 text-base sm:text-sm font-medium text-[#1E1512] placeholder:text-[#5B4740] focus:outline-none focus:border-[#B58E4C] focus:ring-2 focus:ring-[#C6A36A]/25"
                />
              </div>

              <div className="sm:col-span-7">
                <span id="checkout-dining-type-label" className="block text-xs font-bold text-[#1E1512] mb-1.5">
                  Order / Dining Type
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="checkout-dining-type-label"
                  className="grid grid-cols-3 gap-1 h-11 p-1 rounded-xl bg-[#FAF1EB] border border-[#C6A36A]/65"
                >
                  {DINING_TYPES.map((type) => {
                    const active = diningType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onDiningTypeChange(type)}
                        className={`relative px-1.5 sm:px-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          active
                            ? 'text-[#FFF9F1]'
                            : 'text-[#362823] hover:text-[#1E1512]'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="checkoutDiningPill"
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                            className="absolute inset-0 rounded-lg bg-[#1E1512] border border-[#C6A36A]/75"
                          />
                        )}
                        <span className="relative z-10">
                          {type === 'Online Delivery' ? 'Delivery' : type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {diningType === 'Dine-in' && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#C6A36A]/35 text-sm">
                <span className="font-medium text-[#1E1512]">
                  {reservedTables.length > 0
                    ? `Reserved Table(s): ${reservedTables.join(', ')} (${guests} guests)`
                    : 'Dining without table reservation (walk-in)'}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('reservations')}
                  className="text-xs font-bold text-[#7D591D] underline underline-offset-4 hover:text-[#1E1512] cursor-pointer"
                >
                  {reservedTables.length > 0 ? 'Manage Table' : 'Reserve a Table'}
                </button>
              </div>
            )}

            {diningType === 'Online Delivery' && (
              <div>
                <label
                  htmlFor="delivery-address"
                  className="block text-xs font-bold text-[#1E1512] mb-1.5"
                >
                  Delivery Address (Required · +{formatWholeCurrency(settings.deliveryFee)} fee)
                </label>
                <input
                  id="delivery-address"
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => onDeliveryAddressChange(e.target.value)}
                  placeholder="House / Street / Phase, City"
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF1EB] border border-[#C6A36A]/65 text-base sm:text-sm font-medium text-[#1E1512] placeholder:text-[#5B4740] focus:outline-none focus:border-[#B58E4C] focus:ring-2 focus:ring-[#C6A36A]/25"
                />
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ y: 10 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="p-5 sm:p-7 rounded-3xl bg-[#FAF1EB]/95 border border-[#C6A36A]/65 surface-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#C6A36A]/35">
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#1E1512]">
                Your Selected Items
              </h3>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('menu')}
                  className="text-xs font-bold text-[#7D591D] hover:text-[#1E1512] underline underline-offset-4 cursor-pointer"
                >
                  Add More Items
                </button>
                {cartLines.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleCancelDraftOrder()}
                    className="text-xs font-semibold text-[#3D2E28] hover:text-[#1E1512] cursor-pointer"
                  >
                    Clear Order
                  </button>
                )}
              </div>
            </div>

            {cartLines.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <p className="font-display text-2xl font-bold text-[#1E1512]">
                  Your order tray is empty
                </p>
                <p className="text-sm font-medium text-[#362823]">
                  Select dishes from our 20-item kitchen menu to preview your itemized bill.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('menu')}
                  className="mt-2 px-6 py-2.5 rounded-full bg-[#1E1512] text-[#FFF9F1] text-xs font-semibold border border-[#C6A36A]/75 hover:bg-[#2E211C] hover:border-[#DFBD7E] transition-colors cursor-pointer"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#C6A36A]/30">
                <AnimatePresence initial={false}>
                  {cartLines.map((line) => (
                    <motion.div
                      key={line.itemNumber}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-semibold text-[#7D591D]">
                          {line.categoryName} · #{String(line.itemNumber).padStart(2, '0')}
                        </p>
                        <p className="font-display text-xl font-bold text-[#1E1512]">
                          {line.name}
                        </p>
                        <p className="font-mono text-xs font-medium text-[#3D2E28] tabular-nums">
                          {formatWholeCurrency(line.price)} each
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="inline-flex items-center gap-1.5 bg-[#EFE1DA] border border-[#C6A36A]/65 rounded-full p-1">
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            aria-label={`Remove one ${line.name}`}
                            onClick={() => onSetQuantity(line.itemNumber, line.quantity - 1)}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-full text-[#1E1512] hover:bg-[#FAF1EB] transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </motion.button>
                          <span className="w-7 text-center font-mono text-sm font-bold text-[#1E1512] tabular-nums">
                            {line.quantity}
                          </span>
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            aria-label={`Add one ${line.name}`}
                            onClick={() => onSetQuantity(line.itemNumber, line.quantity + 1)}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-full text-[#1E1512] hover:bg-[#FAF1EB] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>

                        <span className="w-24 text-right font-mono text-sm font-bold text-[#1E1512] tabular-nums">
                          {formatWholeCurrency(line.lineTotal)}
                        </span>

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          aria-label={`Remove ${line.name} completely`}
                          onClick={() => onSetQuantity(line.itemNumber, 0)}
                          className="p-2 text-[#3D2E28] hover:text-[#1E1512] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: C++ Bill Calculation & Payment Processing */}
        <motion.div
          initial={{ y: 10 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 p-5 sm:p-8 lg:p-9 rounded-3xl bg-[#EED8D3] border border-[#C6A36A]/75 ring-1 ring-[#C6A36A]/25 surface-card surface-card-hover space-y-6"
        >
          <div>
            <h3 className="font-display text-3xl font-bold text-[#1E1512]">
              Checkout &amp; Bill
            </h3>
            {cartLines.length > 0 && discountGap > 0 && (
              <p className="mt-1.5 text-xs font-medium text-[#362823] tabular-nums">
                Add {formatWholeCurrency(discountGap)} more to unlock the 10% bill discount (orders{' '}
                {formatWholeCurrency(settings.discountLimit)}+).
              </p>
            )}
            {bill.discount > 0 && (
              <p className="mt-1.5 text-xs font-bold text-[#7D591D]">
                10% fine-dining order discount applied.
              </p>
            )}
          </div>

          <div className="space-y-2.5 text-sm border-y border-[#C6A36A]/40 py-5">
            <div className="flex justify-between gap-3">
              <span className="font-medium text-[#362823]">Subtotal</span>
              <span className="font-mono font-semibold tabular-nums text-[#1E1512] shrink-0">
                {formatCurrency(bill.subtotal)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="font-medium text-[#362823]">
                Discount ({Math.round(settings.discountRate * 100)}% on {formatWholeCurrency(settings.discountLimit)}+)
              </span>
              <span className="font-mono font-semibold tabular-nums text-[#7D591D] shrink-0">
                -{formatCurrency(bill.discount)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="font-medium text-[#362823]">
                Tax ({Math.round(settings.taxRate * 100)}% after discount)
              </span>
              <span className="font-mono font-semibold tabular-nums text-[#1E1512] shrink-0">
                {formatCurrency(bill.tax)}
              </span>
            </div>
            {diningType === 'Online Delivery' && (
              <div className="flex justify-between gap-3">
                <span className="font-medium text-[#362823]">Delivery Charge</span>
                <span className="font-mono font-semibold tabular-nums text-[#1E1512] shrink-0">
                  {formatCurrency(bill.deliveryCharge)}
                </span>
              </div>
            )}
            <div className="pt-3 border-t border-[#C6A36A]/45 flex justify-between items-baseline gap-3">
              <span className="font-display text-2xl font-bold text-[#1E1512]">
                Grand Total
              </span>
              <span className="font-mono text-xl font-bold text-[#1E1512] tabular-nums shrink-0">
                {formatCurrency(bill.billTotal)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <span id="checkout-payment-method-label" className="block text-xs font-bold text-[#1E1512]">
              Payment Method
            </span>
            <div
              role="radiogroup"
              aria-labelledby="checkout-payment-method-label"
              className="grid grid-cols-2 gap-2"
            >
              <button
                type="button"
                role="radio"
                aria-checked={paymentMethod === 'cash'}
                onClick={() => setPaymentMethod('cash')}
                className={`relative py-2.5 px-2 sm:px-3 rounded-full border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'border-[#C6A36A] text-[#FFF9F1]'
                    : 'bg-[#FAF1EB] border-[#C6A36A]/60 text-[#1E1512] hover:bg-[#EFE1DA] hover:border-[#B58E4C]'
                }`}
              >
                {paymentMethod === 'cash' && (
                  <motion.span
                    layoutId="checkoutPaymentPill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-[#1E1512] border border-[#C6A36A]/75"
                  />
                )}
                <span className="relative z-10">Cash Payment</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={paymentMethod === 'online'}
                onClick={() => setPaymentMethod('online')}
                className={`relative py-2.5 px-2 sm:px-3 rounded-full border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  paymentMethod === 'online'
                    ? 'border-[#C6A36A] text-[#FFF9F1]'
                    : 'bg-[#FAF1EB] border-[#C6A36A]/60 text-[#1E1512] hover:bg-[#EFE1DA] hover:border-[#B58E4C]'
                }`}
              >
                {paymentMethod === 'online' && (
                  <motion.span
                    layoutId="checkoutPaymentPill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-[#1E1512] border border-[#C6A36A]/75"
                  />
                )}
                <span className="relative z-10">Online Payment</span>
              </button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="pt-2 space-y-2">
                <label
                  htmlFor="cash-given"
                  className="block text-xs font-bold text-[#1E1512]"
                >
                  Cash Amount Given (Rs.)
                </label>
                <input
                  id="cash-given"
                  type="number"
                  min={0}
                  step="10"
                  value={cashGivenInput}
                  onChange={(e) => setCashGivenInput(e.target.value)}
                  placeholder={bill.billTotal > 0 ? String(Math.ceil(bill.billTotal)) : '0'}
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF1EB] border border-[#C6A36A]/65 font-mono text-base sm:text-sm font-semibold text-[#1E1512] placeholder:text-[#5B4740] tabular-nums focus:outline-none focus:border-[#B58E4C] focus:ring-2 focus:ring-[#C6A36A]/25"
                />
                {Number(cashGivenInput) >= bill.billTotal && bill.billTotal > 0 && (
                  <p className="text-xs font-mono font-semibold text-[#7D591D] tabular-nums">
                    Change to Return: {formatCurrency(Number(cashGivenInput) - bill.billTotal)}
                  </p>
                )}
              </div>
            )}
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#FAF1EB] border border-[#C6A36A] text-xs font-semibold text-[#1E1512]"
            >
              {errorMsg}
            </div>
          )}

          <div className="space-y-2.5">
            <motion.button
              type="button"
              disabled={processing || cartLines.length === 0}
              whileTap={{ scale: 0.985 }}
              onClick={() => void handleCheckout(paymentMethod)}
              className="w-full py-3.5 px-6 rounded-full bg-[#1E1512] text-[#FFF9F1] text-sm font-semibold border border-[#C6A36A]/75 hover:bg-[#2E211C] hover:border-[#DFBD7E] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {processing
                ? 'Processing Payment...'
                : paymentMethod === 'cash'
                ? 'Confirm Cash Payment'
                : 'Complete Online Payment'}
            </motion.button>

            {cartLines.length > 0 && (
              <button
                type="button"
                disabled={processing}
                onClick={() => void handleCheckout('cancel')}
                className="w-full py-2.5 px-5 rounded-full border border-[#C6A36A]/65 bg-[#FAF1EB] text-xs font-semibold text-[#362823] hover:text-[#1E1512] hover:border-[#B58E4C] transition-colors cursor-pointer"
              >
                Cancel Payment &amp; Record as Cancelled
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </SectionStage>
  );
}
