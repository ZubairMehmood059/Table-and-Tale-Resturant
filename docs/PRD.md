# Product Requirements Document — Table & Tale

## Vision
Transform the Table & Tale console-based C++ Restaurant Management System into a refined, responsive full-stack web application while preserving 100% of the C++ business logic, pricing rules, table allocation math, staff roster, and `tabletale_data.txt` persistence format.

## Venue Identity
- **Name**: Table & Tale
- **Tagline**: Where Fine Dining Meets Unforgettable Stories.
- **Address**: Plot 18-C, Main Khayaban-e-Shahbaz, Phase 6, DHA
- **Contact**: 92+ 03-1234567
- **Hours**: 6 PM - 1 AM

## User Roles
1. **Customer**: Browse 20 numbered menu items across 5 categories, enter quick-order codes (`1 2 4`), reserve dine-in tables (6 seats per table), choose Dine-in / Takeaway / Online Delivery, review & edit orders, pay via Cash or Online Payment (or cancel), view printable receipts, and submit 1–5 star ratings, reviews, and tips.
2. **Management Staff**: Authenticate with `staff123` (max 3 attempts before temporary lockout), view full customer order history, inspect/release live table status, inspect sales/tips/ratings report, view staff shifts (`ST101`–`ST104`), and view menu pricing.

## Business Rules (Enforced in C++ Engine)
- **Menu**: 5 categories × 4 dishes = 20 items (`#01`–`#20`).
- **Tables**: 10 tables, `TABLE_CAPACITY = 6` guests per table; `tablesNeeded = ceil(guests / 6)`.
- **Discount**: 10% discount when subtotal >= Rs. 2,000 (`DISCOUNT_LIMIT = 2000`).
- **Tax**: 5% tax applied to `(subtotal - discount)`.
- **Delivery Fee**: Rs. 150 added when `diningType == "Online Delivery"`.
- **Persistence**: Maximum 100 orders stored in `tabletale_data.txt`.
