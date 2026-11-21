import { Check, RefreshCw, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { releaseTables, reserveTables } from '@/api/client';
import { SectionStage } from '@/components/ui';
import { RESTAURANT_IMAGES } from '@/constants/assets';
import type { TableInfo, TableSummary } from '@/types/restaurant';

interface ReservationWorkspaceProps {
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  tables: TableInfo[];
  summary: TableSummary | null;
  reservedByMe: number[];
  guests: number;
  onReservationUpdated: (
    tables: TableInfo[],
    summary: TableSummary,
    myTables: number[],
    guests: number
  ) => void;
  onRefreshTables: () => Promise<void>;
  tableCapacity: number;
}

export function ReservationWorkspace({
  customerName,
  onCustomerNameChange,
  tables,
  summary,
  reservedByMe,
  guests,
  onReservationUpdated,
  onRefreshTables,
  tableCapacity,
}: ReservationWorkspaceProps) {
  const [guestInput, setGuestInput] = useState(guests > 0 ? guests : 2);
  const [selectedDraft, setSelectedDraft] = useState<number[]>(reservedByMe);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    setSelectedDraft(reservedByMe);
  }, [reservedByMe]);

  const tablesNeeded = guestInput > 0 ? Math.ceil(guestInput / tableCapacity) : 0;
  const maxSeatsAvailable = summary
    ? summary.availableSeats
    : tables.filter((t) => !t.booked).length * tableCapacity;

  const toggleDraftTable = (table: TableInfo) => {
    if (reservedByMe.length > 0) return;
    if (table.booked && !reservedByMe.includes(table.tableNumber)) return;

    setFeedback(null);
    setSelectedDraft((prev) => {
      if (prev.includes(table.tableNumber)) {
        return prev.filter((n) => n !== table.tableNumber);
      }
      if (prev.length >= tablesNeeded) {
        return [...prev.slice(1), table.tableNumber];
      }
      return [...prev, table.tableNumber];
    });
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!customerName.trim()) {
      setFeedback({ type: 'error', text: 'Please enter your customer name first.' });
      return;
    }

    if (guestInput <= 0) {
      setFeedback({ type: 'error', text: 'Number of guests must be greater than zero.' });
      return;
    }

    if (selectedDraft.length !== tablesNeeded) {
      setFeedback({
        type: 'error',
        text: `${guestInput} guest(s) require exactly ${tablesNeeded} table(s). Please select ${tablesNeeded} available table(s).`,
      });
      return;
    }

    setSubmitting(true);
    try {
      const resp = await reserveTables({
        customerName: customerName.trim(),
        guests: guestInput,
        tableNumbers: selectedDraft,
      });
      onReservationUpdated(resp.tables, resp.summary, resp.reservedTables, guestInput);
      setFeedback({
        type: 'success',
        text: `Reserved Table(s) ${resp.reservedTables.join(', ')} for ${guestInput} guest(s) under ${customerName.trim()}.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', text: (err as Error).message });
      await onRefreshTables();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async () => {
    if (reservedByMe.length === 0) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const resp = await releaseTables(reservedByMe);
      onReservationUpdated(resp.tables, resp.summary, [], 0);
      setSelectedDraft([]);
      setFeedback({
        type: 'success',
        text: 'Your reserved table(s) have been released back to the dining room.',
      });
    } catch (err) {
      setFeedback({ type: 'error', text: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const reservedByOthers = tables.filter(
    (t) => t.booked && !reservedByMe.includes(t.tableNumber)
  );
  const stillAvailable = tables.filter((t) => !t.booked);

  return (
    <SectionStage
      id="reservations"
      kicker={`10 Dining Tables · ${tableCapacity} Guests Per Table`}
      title="Dine-In Table Reservations"
      subtitle="Select available tables across our chandelier dining floor and lock your seating directly with live kitchen sync."
      tone="linen"
      backgroundImageSrc="/assets/aistudio/images__1__1cd3772a.png"
      backgroundImageAlt="Table & Tale chandelier dining room"
      floatingImages={[
        {
          src: RESTAURANT_IMAGES.categories[0],
          alt: 'Desi Delights table presentation',
        },
        {
          src: RESTAURANT_IMAGES.categories[2],
          alt: 'International gourmet plates',
        },
      ]}
      headerAction={
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => void onRefreshTables()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#C6A36A]/75 bg-[#EFE1DA]/95 text-xs font-semibold text-[#1E1512] hover:bg-[#EED8D3] hover:border-[#B58E4C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#7D591D]" />
          Refresh Floor
        </motion.button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-start">
        {/* Left Form: Guest Calculation & Reservation Trigger */}
        <motion.form
          onSubmit={handleReserve}
          initial={{ y: 10 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 p-5 sm:p-8 lg:p-9 rounded-3xl bg-[#EED8D3] border border-[#C6A36A]/75 hover:border-[#B58E4C] surface-card surface-card-hover space-y-5"
        >
          <div>
            <h3 className="font-display text-3xl font-bold text-[#1E1512]">
              Reserve Your Seating
            </h3>
            <p className="mt-1.5 text-sm font-medium text-[#362823] leading-relaxed">
              Each table seats up to {tableCapacity} guests. Reserved tables are released
              automatically after checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-5">
            <div>
              <label
                htmlFor="res-customer-name"
                className="block text-xs font-bold text-[#1E1512] mb-1.5"
              >
                Guest / Customer Name
              </label>
              <input
                id="res-customer-name"
                type="text"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                placeholder="Enter your full name"
                disabled={reservedByMe.length > 0}
                className="w-full h-11 px-4 rounded-xl bg-[#FAF1EB] border border-[#C6A36A]/65 text-base sm:text-sm font-medium text-[#1E1512] placeholder:text-[#5B4740] disabled:opacity-75 focus:outline-none focus:border-[#B58E4C] focus:ring-2 focus:ring-[#C6A36A]/25"
              />
            </div>

            <div>
              <label
                htmlFor="res-guests"
                className="block text-xs font-bold text-[#1E1512] mb-1.5"
              >
                Number of Guests (Max {maxSeatsAvailable} available seats)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  id="res-guests"
                  type="number"
                  min={1}
                  max={60}
                  value={guestInput}
                  disabled={reservedByMe.length > 0}
                  onChange={(e) => {
                    const next = Math.max(1, Number(e.target.value) || 1);
                    setGuestInput(next);
                    setSelectedDraft([]);
                  }}
                  className="w-24 sm:w-28 h-11 px-4 rounded-xl bg-[#FAF1EB] border border-[#C6A36A]/65 font-mono text-base sm:text-sm font-semibold text-[#1E1512] tabular-nums disabled:opacity-75 focus:outline-none focus:border-[#B58E4C] focus:ring-2 focus:ring-[#C6A36A]/25"
                />
                <span className="text-xs sm:text-sm font-medium text-[#1E1512] tabular-nums">
                  Requires <strong>{tablesNeeded}</strong> table{tablesNeeded === 1 ? '' : 's'} (
                  {tablesNeeded * tableCapacity} seats)
                </span>
              </div>
            </div>
          </div>

          {feedback && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`p-4 rounded-xl border text-sm font-medium surface-card ${
                feedback.type === 'error'
                  ? 'bg-[#FAF1EB] border-[#B58E4C] text-[#1E1512]'
                  : 'bg-[#FAF1EB] border-[#C6A36A] text-[#1E1512]'
              }`}
            >
              {feedback.text}
            </motion.div>
          )}

          {reservedByMe.length === 0 ? (
            <motion.button
              type="submit"
              disabled={submitting || selectedDraft.length !== tablesNeeded}
              whileTap={{ scale: 0.985 }}
              className="w-full py-3.5 px-6 rounded-full bg-[#1E1512] text-[#FFF9F1] border border-[#C6A36A]/75 text-sm font-semibold hover:bg-[#2E211C] hover:border-[#DFBD7E] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting
                ? 'Reserving...'
                : `Confirm ${tablesNeeded} Table${tablesNeeded === 1 ? '' : 's'} (${selectedDraft.length}/${tablesNeeded} Selected)`}
            </motion.button>
          ) : (
            <motion.button
              type="button"
              disabled={submitting}
              whileTap={{ scale: 0.985 }}
              onClick={() => void handleRelease()}
              className="w-full py-3.5 px-6 rounded-full border border-[#C6A36A] bg-[#FAF1EB] text-[#1E1512] text-sm font-semibold hover:bg-[#EFE1DA] transition-colors cursor-pointer"
            >
              {submitting ? 'Releasing...' : 'Cancel & Release My Tables'}
            </motion.button>
          )}

          {/* C++ Reservation Summary Parity */}
          <div className="pt-5 border-t border-[#C6A36A]/40 space-y-2 text-xs text-[#1E1512]">
            <p className="section-kicker">Reservation Summary</p>
            <p>
              <span className="font-medium text-[#3D2E28]">Booked by you: </span>
              <span className="font-mono font-bold text-[#1E1512]">
                {reservedByMe.length > 0
                  ? reservedByMe.map((t) => `Table ${t}`).join(', ')
                  : 'None'}
              </span>
            </p>
            <p>
              <span className="font-medium text-[#3D2E28]">Reserved by others: </span>
              <span className="font-mono font-semibold text-[#1E1512]">
                {reservedByOthers.length > 0
                  ? reservedByOthers.map((t) => `T${t.tableNumber} (${t.reservedBy})`).join(', ')
                  : 'None'}
              </span>
            </p>
            <p>
              <span className="font-medium text-[#3D2E28]">Still available: </span>
              <span className="font-mono font-semibold text-[#1E1512]">
                {stillAvailable.length > 0
                  ? stillAvailable.map((t) => `T${t.tableNumber}`).join(', ')
                  : 'None'}
              </span>
            </p>
          </div>
        </motion.form>

        {/* Right Floor Grid: 10 Tables */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-3.5">
            {tables.map((table) => {
              const isMine = reservedByMe.includes(table.tableNumber);
              const isSelectedDraft = selectedDraft.includes(table.tableNumber);
              const isOccupiedByOther = table.booked && !isMine;
              const isSelectable = !isOccupiedByOther && reservedByMe.length === 0;

              return (
                <motion.button
                  key={table.tableNumber}
                  type="button"
                  aria-pressed={isMine || isSelectedDraft}
                  disabled={isOccupiedByOther || reservedByMe.length > 0}
                  initial={{ y: 8 }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  whileHover={isSelectable ? { y: -3, scale: 1.015 } : undefined}
                  whileTap={isSelectable ? { scale: 0.98 } : undefined}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => toggleDraftTable(table)}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-colors duration-150 flex flex-col justify-between min-h-[114px] sm:min-h-[132px] surface-card ${
                    isMine
                      ? 'bg-[#1E1512] border-[#C6A36A] ring-2 ring-[#C6A36A]/45 text-[#FFF9F1] shadow-[0_14px_28px_-12px_rgba(30,21,18,0.55)]'
                      : isSelectedDraft
                      ? 'bg-[#EED5D1] border-[#B58E4C] ring-2 ring-[#C6A36A]/65 text-[#1E1512] cursor-pointer shadow-[0_12px_24px_-12px_rgba(30,21,18,0.32)]'
                      : isOccupiedByOther
                      ? 'bg-[#E5D2CB] border-[#C6A36A]/40 text-[#362823] cursor-not-allowed'
                      : 'bg-[#FAF1EB]/95 border-[#C6A36A]/60 text-[#1E1512] hover:border-[#B58E4C] surface-card-hover cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-display text-lg xl:text-xl font-bold tabular-nums whitespace-nowrap">
                      Table {table.tableNumber}
                    </span>
                    {(isMine || isSelectedDraft) && (
                      <motion.span
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <Check className="w-4 h-4 text-[#DFBD7E] shrink-0" />
                      </motion.span>
                    )}
                  </div>

                  <div className="mt-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium tabular-nums">
                      <Users className="w-3.5 h-3.5" />
                      <span>{table.capacity} seats</span>
                    </div>
                    <p
                      className={`text-xs font-bold ${
                        isMine
                          ? 'text-[#DFBD7E]'
                          : isSelectedDraft
                          ? 'text-[#7D591D]'
                          : isOccupiedByOther
                          ? 'text-[#3D2E28]'
                          : 'text-[#1E1512]'
                      }`}
                    >
                      {isMine
                        ? 'Your Table'
                        : isSelectedDraft
                        ? 'Selected'
                        : isOccupiedByOther
                        ? `Booked · ${table.reservedBy}`
                        : 'Available'}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </SectionStage>
  );
}
