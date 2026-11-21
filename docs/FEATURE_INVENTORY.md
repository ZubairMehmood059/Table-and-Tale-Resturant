# Feature Inventory & C++ Parity Matrix

| Feature | Original C++ Function(s) | C++ Engine Action | Web Component |
| :--- | :--- | :--- | :--- |
| Restaurant Info & Menu | `welcomeScreen`, `displayMenu` | `info` | `HeroSection`, `MenuShowcase` |
| Quick Item Number Parser | `takeOrder` | `parse_quick_order` | `MenuShowcase` quick-add bar |
| Order Review & Item Removal | `reviewOrder`, `removeItem`, `displayOrder` | `preview_bill` | `OrderCheckoutPanel` |
| Table Status & Floor Plan | `displayTables`, `showReservationSummary` | `tables` | `ReservationWorkspace` |
| Guest-Based Table Reservation | `reserveTable` | `reserve_tables` | `ReservationWorkspace` |
| Release Tables | `releaseTable` | `release_tables` | `ReservationWorkspace`, `ManagementConsole` |
| Bill Calculation & Checkout | `placeOrder`, `calculateBill`, `processPayment`, `printReceipt` | `checkout` | `OrderCheckoutPanel` |
| Customer Feedback & Tip | `askFeedback` | `feedback` | `OrderCheckoutPanel` |
| Staff Login (3 Attempts) | `staffLogin`, `readPassword` | `staff_login` | `ManagementConsole` |
| Orders Report | `viewOrders` | `management_orders` | `ManagementConsole` |
| Sales & Ratings Report | `showTotalSales` | `management_sales` | `ManagementConsole` |
| Staff Roster (`ST101`–`ST104`) | `staffManagement` | `management_staff` | `ManagementConsole` |
