import { Minus, Plus, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { parseQuickOrderLine } from '@/api/client';
import { ResilientImage } from '@/components/common';
import { SectionStage } from '@/components/ui';
import { RESTAURANT_IMAGES } from '@/constants/assets';
import { formatWholeCurrency } from '@/lib/formatters';
import type { AppSection, MenuCategory, MenuItem } from '@/types/restaurant';

interface MenuShowcaseProps {
  categories: MenuCategory[];
  items: MenuItem[];
  cart: Record<number, number>;
  onAddItem: (itemNumber: number, qty?: number) => void;
  onSetQuantity: (itemNumber: number, qty: number) => void;
  onNavigate: (section: AppSection) => void;
}

export function MenuShowcase({
  categories,
  items,
  cart,
  onAddItem,
  onSetQuantity,
  onNavigate,
}: MenuShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickInput, setQuickInput] = useState('');
  const [quickQty, setQuickQty] = useState(1);
  const [activePlateByCategory, setActivePlateByCategory] = useState<Record<number, 0 | 1>>({});
  const [quickFeedback, setQuickFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [parsingQuick, setParsingQuick] = useState(false);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const catMatch = selectedCategory === 'all' || item.categoryIndex === selectedCategory;
      const textMatch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q) ||
        String(item.itemNumber) === q;
      return catMatch && textMatch;
    });
  }, [items, selectedCategory, searchQuery]);

  const groupedCategories = useMemo(() => {
    const activeCats =
      selectedCategory === 'all'
        ? categories
        : categories.filter((c) => c.index === selectedCategory);

    return activeCats
      .map((cat) => ({
        category: cat,
        dishes: filteredItems.filter((item) => item.categoryIndex === cat.index),
      }))
      .filter((group) => group.dishes.length > 0);
  }, [categories, filteredItems, selectedCategory]);

  const totalCartItems = useMemo(
    () => Object.values(cart).reduce((sum, q) => sum + q, 0),
    [cart]
  );

  const handleQuickOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    setParsingQuick(true);
    setQuickFeedback(null);

    try {
      const parsed = await parseQuickOrderLine(quickInput);
      if (!parsed.ok) {
        setQuickFeedback({
          type: 'error',
          text: parsed.error || 'Enter valid item numbers between 1 and 20.',
        });
        return;
      }

      if (parsed.validItemNumbers.length === 0) {
        setQuickFeedback({
          type: 'success',
          text: 'Order entry finished. Proceed to Checkout to review your order.',
        });
        return;
      }

      const qtyToAdd = Math.max(1, quickQty);
      const addedNames: string[] = [];
      for (const num of parsed.validItemNumbers) {
        onAddItem(num, qtyToAdd);
        const found = items.find((i) => i.itemNumber === num);
        if (found) addedNames.push(`${qtyToAdd} x ${found.name}`);
      }

      const skippedNote =
        parsed.skippedNumbers.length > 0
          ? ` (Skipped invalid item #${parsed.skippedNumbers.join(', #')})`
          : '';

      setQuickFeedback({
        type: 'success',
        text: `Added ${addedNames.join(', ')}${skippedNote}`,
      });
      setQuickInput('');
    } catch (err) {
      setQuickFeedback({
        type: 'error',
        text: (err as Error).message,
      });
    } finally {
      setParsingQuick(false);
    }
  };

  return (
    <SectionStage
      id="menu"
      kicker="20 Curated Dishes · Numbered 01–20"
      title="The Table & Tale Menu"
      subtitle="Browse every course with live kitchen pricing, preview signature platters, or enter dish numbers directly."
      tone="blush"
      backgroundImageSrc={RESTAURANT_IMAGES.hero}
      backgroundImageAlt="Table & Tale fine dining culinary table spread"
      floatingImages={[
        {
          src: '/assets/aistudio/images_6cc74a94.png',
          alt: 'Stone-baked Chicken Pizza',
        },
        {
          src: '/assets/aistudio/plate-food-with-noodles-meat-veg_8ecb98be.png',
          alt: 'Aromatic Chicken Biryani platter',
        },
      ]}
      headerAction={
        <div className="w-full lg:w-auto flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:flex-1 sm:min-w-[240px] lg:flex-none lg:w-64">
            <Search className="w-4 h-4 text-[#3D2E28] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dish or number..."
              aria-label="Search menu items"
              className="w-full h-11 pl-10 pr-4 rounded-full bg-[#EFE1DA]/95 focus:bg-[#FAF1EB] border border-[#C6A36A]/65 text-base sm:text-sm font-medium text-[#1E1512] placeholder:text-[#5B4740] transition-colors focus:outline-none focus:border-[#B58E4C] focus:ring-2 focus:ring-[#C6A36A]/30"
            />
          </div>

          {totalCartItems > 0 && (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('order')}
              className="w-full sm:w-auto h-11 px-6 rounded-full bg-[#C6A36A] border border-[#7D591D]/45 text-[#1E1512] text-sm font-bold hover:bg-[#D4B47B] transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums shadow-[0_8px_18px_-6px_rgba(30,21,18,0.3)]"
            >
              Review Order ({totalCartItems})
            </motion.button>
          )}
        </div>
      }
    >
      {/* Category Filter Tabs + C++ Multi-Item Line Entry */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Menu Categories"
          className="flex flex-wrap xl:flex-nowrap items-center gap-1 p-1.5 rounded-2xl xl:rounded-full bg-[#EED8D3]/95 border border-[#C6A36A]/65 max-w-full shadow-[0_8px_22px_-14px_rgba(30,21,18,0.22)]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
            className={`relative px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'text-[#FFF9F1]'
                : 'text-[#1E1512] hover:bg-[#FAF1EB]/65'
            }`}
          >
            {selectedCategory === 'all' && (
              <motion.span
                layoutId="menuCategoryPill"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full bg-[#1E1512] border border-[#C6A36A]/60 shadow-xs"
              />
            )}
            <span className="relative z-10">All Courses</span>
          </button>
          {categories.map((cat) => {
            const active = selectedCategory === cat.index;
            return (
              <button
                key={cat.index}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat.index)}
                className={`relative px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'text-[#FFF9F1]'
                    : 'text-[#1E1512] hover:bg-[#FAF1EB]/65'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="menuCategoryPill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-[#1E1512] border border-[#C6A36A]/60 shadow-xs"
                  />
                )}
                <span className="relative z-10">{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Preserved C++ Quick Item-Number Entry */}
        <form
          onSubmit={handleQuickOrderSubmit}
          className="w-full xl:w-auto flex flex-wrap sm:flex-nowrap items-center gap-2"
        >
          <label
            htmlFor="quick-order-input"
            className="w-full sm:w-auto text-xs font-bold text-[#2D201B] whitespace-nowrap"
          >
            Quick Add #
          </label>
          <input
            id="quick-order-input"
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="e.g. 1 2 4"
            className="flex-1 min-w-[110px] xl:flex-none xl:w-32 h-10 px-3.5 rounded-full bg-[#FAF1EB] border border-[#C6A36A]/65 font-mono text-base sm:text-xs font-medium text-[#1E1512] placeholder:text-[#5B4740] focus:outline-none focus:border-[#B58E4C] focus:ring-2 focus:ring-[#C6A36A]/25"
          />
          <input
            type="number"
            min={1}
            max={20}
            value={quickQty}
            onChange={(e) => setQuickQty(Math.max(1, Number(e.target.value) || 1))}
            aria-label="Quick add quantity"
            className="w-16 h-10 px-3 rounded-full bg-[#FAF1EB] border border-[#C6A36A]/65 font-mono text-base sm:text-xs font-semibold text-center text-[#1E1512] tabular-nums focus:outline-none focus:border-[#B58E4C] focus:ring-2 focus:ring-[#C6A36A]/25"
          />
          <motion.button
            type="submit"
            disabled={parsingQuick}
            whileTap={{ scale: 0.97 }}
            className="h-10 px-4 sm:px-5 rounded-full bg-[#1E1512] text-[#FFF9F1] border border-[#C6A36A]/70 text-xs font-semibold hover:bg-[#2E211C] hover:border-[#DFBD7E] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {parsingQuick ? 'Parsing...' : 'Add Items'}
          </motion.button>
        </form>
      </div>

      {quickFeedback && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`mt-4 px-5 py-3.5 rounded-xl border text-sm font-medium surface-card ${
            quickFeedback.type === 'error'
              ? 'bg-[#EED8D3] border-[#B58E4C] text-[#1E1512]'
              : 'bg-[#FAF1EB] border-[#C6A36A] text-[#1E1512]'
          }`}
        >
          {quickFeedback.text}
        </motion.div>
      )}

      {/* Categorized Menu Sections */}
      {groupedCategories.length === 0 ? (
        <div className="mt-10 p-10 sm:p-12 text-center rounded-3xl bg-[#FAF1EB]/95 border border-[#C6A36A]/65 surface-card space-y-4">
          <div>
            <p className="font-display text-2xl font-bold text-[#1E1512]">
              No matching dishes found
            </p>
            <p className="mt-1.5 text-sm font-medium text-[#3D2E28]">
              Try clearing your search or selecting All Courses to explore all 20 dishes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#1E1512] text-[#FFF9F1] text-xs font-semibold border border-[#C6A36A]/75 hover:bg-[#2E211C] hover:border-[#DFBD7E] transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-10 sm:mt-12 space-y-12 sm:space-y-16">
          {groupedCategories.map(({ category, dishes }) => {
            const plates = RESTAURANT_IMAGES.categoryPlates[category.index];
            const activePlateIdx: 0 | 1 = activePlateByCategory[category.index] ?? 0;
            const activePlate = plates ? plates[activePlateIdx] : null;

            return (
              <div
                key={category.index}
                className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start"
              >
                {/* Category Editorial Dual-Plate Gallery */}
                <motion.div
                  initial={{ y: 10 }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="lg:col-span-5 rounded-3xl overflow-hidden bg-[#EED8D3] border border-[#C6A36A]/75 hover:border-[#B58E4C] surface-card surface-card-hover md:grid md:grid-cols-12 lg:block"
                >
                  <div className="relative aspect-[4/3] md:aspect-auto md:h-full lg:aspect-[4/3] md:col-span-6 w-full overflow-hidden bg-[#E5CEC8] border-b md:border-b-0 md:border-r lg:border-r-0 lg:border-b border-[#C6A36A]/45">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activePlate?.src || RESTAURANT_IMAGES.categories[category.index]}
                        initial={{ opacity: 0.72, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0.72 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full h-full"
                      >
                        <ResilientImage
                          src={activePlate?.src || RESTAURANT_IMAGES.categories[category.index]}
                          alt={activePlate?.alt || `${category.name} culinary showcase`}
                          loading="eager"
                          className="w-full h-full object-cover"
                          fallbackLabel={category.name}
                        />
                      </motion.div>
                    </AnimatePresence>
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1E1512]/85 via-[#1E1512]/35 to-transparent"
                    />
                    {activePlate && (
                      <p className="pointer-events-none absolute bottom-4 left-5 right-5 text-xs font-semibold tracking-wide text-[#FFF9F1]">
                        Featured: {activePlate.caption}
                      </p>
                    )}
                  </div>

                  <div className="p-5 sm:p-6 md:col-span-6 flex flex-col justify-between space-y-4">
                    <div>
                      <p className="section-kicker tabular-nums">
                        Course 0{category.index + 1} · {dishes.length} Selections
                      </p>
                      <h3 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#1E1512]">
                        {category.name}
                      </h3>
                    </div>

                    {plates && (
                      <div className="grid grid-cols-2 gap-2.5 pt-2">
                        {plates.map((plate, idx) => {
                          const plateIndex = idx as 0 | 1;
                          const isSelected = activePlateIdx === plateIndex;
                          return (
                            <button
                              key={plate.src}
                              type="button"
                              onClick={() =>
                                setActivePlateByCategory((prev) => ({
                                  ...prev,
                                  [category.index]: plateIndex,
                                }))
                              }
                              className={`group/thumb text-left rounded-xl overflow-hidden border transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-[#B58E4C] ring-2 ring-[#C6A36A]/65 bg-[#FAF1EB]'
                                  : 'border-[#C6A36A]/45 bg-[#FAF1EB]/85 hover:border-[#B58E4C]'
                              }`}
                            >
                              <div className="aspect-[4/3] w-full overflow-hidden">
                                <ResilientImage
                                  src={plate.src}
                                  alt={plate.alt}
                                  loading="eager"
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-[1.04]"
                                  fallbackLabel={plate.caption}
                                />
                              </div>
                              <p className="px-2.5 py-2 text-xs font-bold text-[#1E1512] truncate">
                                {plate.caption}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Dish Cards Grid */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dishes.map((dish) => {
                    const qty = cart[dish.itemNumber] || 0;
                    const dishPlateIndex: 0 | 1 = dish.itemIndex < 2 ? 0 : 1;

                    return (
                      <motion.div
                        key={dish.itemNumber}
                        initial={{ y: 8 }}
                        whileInView={{ y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        whileHover={{ y: -3 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        onMouseEnter={() =>
                          setActivePlateByCategory((prev) =>
                            prev[category.index] === dishPlateIndex
                              ? prev
                              : { ...prev, [category.index]: dishPlateIndex }
                          )
                        }
                        className={`p-5 sm:p-6 rounded-2xl border surface-card surface-card-hover flex flex-col justify-between gap-5 transition-colors ${
                          qty > 0
                            ? 'bg-[#EED5D1] border-[#B58E4C] ring-2 ring-[#C6A36A]/45 shadow-[0_14px_30px_-16px_rgba(30,21,18,0.3)]'
                            : 'bg-[#FAF1EB]/95 border-[#C6A36A]/55 hover:border-[#B58E4C]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#3D2E28]">
                            <span>{dish.categoryName}</span>
                            <span className="font-mono font-bold tabular-nums text-[#7D591D]">
                              #{String(dish.itemNumber).padStart(2, '0')}
                            </span>
                          </div>
                          <h4 className="mt-2 font-display text-2xl font-bold text-[#1E1512]">
                            {dish.name}
                          </h4>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#C6A36A]/35">
                          <span className="font-mono text-base font-bold text-[#1E1512] tabular-nums">
                            {formatWholeCurrency(dish.price)}
                          </span>

                          {qty === 0 ? (
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onAddItem(dish.itemNumber, 1)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1E1512] text-[#FFF9F1] border border-[#C6A36A]/65 text-xs font-semibold hover:bg-[#2E211C] hover:border-[#DFBD7E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 text-[#DFBD7E]" />
                              Add
                            </motion.button>
                          ) : (
                            <div className="inline-flex items-center gap-2 bg-[#FAF1EB] border border-[#B58E4C] rounded-full p-1">
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.9 }}
                                aria-label={`Decrease quantity of ${dish.name}`}
                                onClick={() => onSetQuantity(dish.itemNumber, qty - 1)}
                                className="w-8 h-8 inline-flex items-center justify-center rounded-full text-[#1E1512] hover:bg-[#EED8D3] transition-colors cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </motion.button>
                              <span className="w-6 text-center font-mono text-sm font-bold text-[#1E1512] tabular-nums">
                                {qty}
                              </span>
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.9 }}
                                aria-label={`Increase quantity of ${dish.name}`}
                                onClick={() => onSetQuantity(dish.itemNumber, qty + 1)}
                                className="w-8 h-8 inline-flex items-center justify-center rounded-full text-[#1E1512] hover:bg-[#EED8D3] transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionStage>
  );
}
