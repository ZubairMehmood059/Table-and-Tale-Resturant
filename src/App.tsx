import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchRestaurantInfo, fetchTables } from '@/api/client';
import { FloatingWhatsApp } from '@/components/common';
import { Footer, Header } from '@/components/layout';
import {
  HeroSection,
  ManagementConsole,
  MenuShowcase,
  OrderCheckoutPanel,
  ReservationWorkspace,
} from '@/features';
import type {
  AppSection,
  DiningType,
  RestaurantBootstrap,
  TableInfo,
  TableSummary,
} from '@/types/restaurant';

function getSectionFromPath(pathname: string): AppSection {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (clean === '/menu') return 'menu';
  if (clean === '/reservations' || clean === '/reservation' || clean === '/tables') return 'reservations';
  if (clean === '/order' || clean === '/checkout' || clean === '/orders') return 'order';
  if (clean === '/management' || clean === '/admin' || clean === '/staff') return 'management';
  return 'home';
}

function getPathForSection(section: AppSection): string {
  switch (section) {
    case 'menu':
      return '/menu';
    case 'reservations':
      return '/reservations';
    case 'order':
      return '/order';
    case 'management':
      return '/management';
    case 'home':
    default:
      return '/';
  }
}

export default function App() {
  const [bootstrap, setBootstrap] = useState<RestaurantBootstrap | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AppSection>(() => {
    if (typeof window !== 'undefined') {
      return getSectionFromPath(window.location.pathname);
    }
    return 'home';
  });

  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tableSummary, setTableSummary] = useState<TableSummary | null>(null);

  // Customer flow shared state
  const [customerName, setCustomerName] = useState('');
  const [diningType, setDiningType] = useState<DiningType>('Dine-in');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [reservedTables, setReservedTables] = useState<number[]>([]);
  const [guests, setGuests] = useState(0);
  const [cart, setCart] = useState<Record<number, number>>({});

  const refreshTables = useCallback(async () => {
    try {
      const data = await fetchTables();
      setTables(data.tables);
      setTableSummary(data.summary);
    } catch {
      // Handled via initial bootstrap or user actions
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const [infoData, tablesData] = await Promise.all([
          fetchRestaurantInfo(),
          fetchTables(),
        ]);
        if (!active) return;
        setBootstrap(infoData);
        setTables(tablesData.tables);
        setTableSummary(tablesData.summary);
      } catch (err) {
        if (active) {
          setLoadError((err as Error).message || 'Failed to connect to Table & Tale C++ engine.');
        }
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, []);

  // Sync browser back and forward button navigation
  useEffect(() => {
    const handlePopState = () => {
      const section = getSectionFromPath(window.location.pathname);
      setActiveSection(section);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update page title on navigation
  useEffect(() => {
    if (!bootstrap) return;
    const titles: Record<AppSection, string> = {
      home: `${bootstrap.restaurant.name} — Fine Dining & Unforgettable Stories`,
      menu: `${bootstrap.restaurant.name} — Editorial Menu`,
      reservations: `${bootstrap.restaurant.name} — Table Reservations`,
      order: `${bootstrap.restaurant.name} — Order & Checkout`,
      management: `${bootstrap.restaurant.name} — Management Console`,
    };
    document.title = titles[activeSection] || bootstrap.restaurant.name;
  }, [activeSection, bootstrap]);

  const handleNavigate = useCallback((section: AppSection) => {
    setActiveSection(section);
    const targetPath = getPathForSection(section);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ section }, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAddItem = useCallback((itemNumber: number, qty = 1) => {
    setCart((prev) => ({
      ...prev,
      [itemNumber]: (prev[itemNumber] || 0) + qty,
    }));
  }, []);

  const handleSetQuantity = useCallback((itemNumber: number, qty: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[itemNumber];
      } else {
        next[itemNumber] = qty;
      }
      return next;
    });
  }, []);

  const handleClearCartAndReservation = useCallback(() => {
    setCart({});
    setReservedTables([]);
    setGuests(0);
    setDeliveryAddress('');
  }, []);

  const totalCartCount = useMemo(
    () => Object.values(cart).reduce((sum, q) => sum + q, 0),
    [cart]
  );

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F5E7E1] text-[#1E1512] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#FAF1EB] border border-[#C6A36A] space-y-4 text-center surface-card">
          <h1 className="font-display text-2xl font-bold text-[#1E1512]">Unable to Start Table &amp; Tale</h1>
          <p className="text-sm text-[#3D2E28]">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-lg bg-[#1E1512] text-[#FFF9F1] border border-[#C6A36A]/55 text-sm font-semibold cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!bootstrap) {
    return (
      <div className="min-h-screen bg-[#F5E7E1] text-[#1E1512]">
        <div className="h-16 border-b border-[#C6A36A]/45 bg-[#FAF1EB]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 h-80 rounded-2xl bg-[#EED8D3]/70 border border-[#C6A36A]/35" />
            <div className="lg:col-span-6 h-80 rounded-2xl bg-[#EED8D3]/50 border border-[#C6A36A]/35" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="h-24 rounded-xl bg-[#EED8D3]/50" />
            <div className="h-24 rounded-xl bg-[#EED8D3]/50" />
            <div className="h-24 rounded-xl bg-[#EED8D3]/50" />
            <div className="h-24 rounded-xl bg-[#EED8D3]/50" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5E7E1] text-[#1E1512] overflow-x-clip">
      <Header
        activeSection={activeSection}
        onNavigate={handleNavigate}
        cartCount={totalCartCount}
      />

      <main className="flex-1">
        {activeSection === 'home' && (
          <HeroSection
            restaurant={bootstrap.restaurant}
            settings={bootstrap.settings}
            tableSummary={tableSummary}
            onNavigate={handleNavigate}
          />
        )}

        {activeSection === 'menu' && (
          <MenuShowcase
            categories={bootstrap.menu.categories}
            items={bootstrap.menu.items}
            cart={cart}
            onAddItem={handleAddItem}
            onSetQuantity={handleSetQuantity}
            onNavigate={handleNavigate}
          />
        )}

        {activeSection === 'reservations' && (
          <ReservationWorkspace
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            tables={tables}
            summary={tableSummary}
            reservedByMe={reservedTables}
            guests={guests}
            tableCapacity={bootstrap.settings.tableCapacity}
            onReservationUpdated={(nextTables, nextSummary, myTables, nextGuests) => {
              setTables(nextTables);
              setTableSummary(nextSummary);
              setReservedTables(myTables);
              setGuests(nextGuests);
              if (myTables.length > 0) {
                setDiningType('Dine-in');
              }
            }}
            onRefreshTables={refreshTables}
          />
        )}

        {activeSection === 'order' && (
          <OrderCheckoutPanel
            restaurant={bootstrap.restaurant}
            settings={bootstrap.settings}
            menuItems={bootstrap.menu.items}
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            diningType={diningType}
            onDiningTypeChange={setDiningType}
            deliveryAddress={deliveryAddress}
            onDeliveryAddressChange={setDeliveryAddress}
            reservedTables={reservedTables}
            guests={guests}
            cart={cart}
            onSetQuantity={handleSetQuantity}
            onClearCartAndReservation={handleClearCartAndReservation}
            onNavigate={handleNavigate}
            onRefreshTables={refreshTables}
          />
        )}

        {activeSection === 'management' && (
          <ManagementConsole
            menuItems={bootstrap.menu.items}
            tables={tables}
            tableSummary={tableSummary}
            onTablesSynced={(nextTables, nextSummary) => {
              setTables(nextTables);
              setTableSummary(nextSummary);
            }}
            onRefreshTables={refreshTables}
          />
        )}
      </main>

      <Footer
        restaurant={bootstrap.restaurant}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        defaultCustomerName={customerName}
      />

      <FloatingWhatsApp
        contact={bootstrap.restaurant.contact}
        restaurantName={bootstrap.restaurant.name}
      />
    </div>
  );
}
