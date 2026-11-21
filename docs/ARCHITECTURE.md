# Architecture & Asset Manifest

## Layered Architecture
1. **C++17 Core Engine (`/cpp`)**:
   - `cpp/legacy/table_and_tale_original.cpp`: Original source preserved verbatim.
   - `cpp/include/models.hpp`: Domain structs, constants, menu, and staff arrays.
   - `cpp/include/business_logic.hpp`: Pure business logic (billing, table math, checkout, kitchen tracking, guest feedback, reports).
   - `cpp/include/storage.hpp`: Line-based `tabletale_data.txt` (`TTv3` with backward compatibility for `TTv2`/v1) serializer/deserializer.
   - `cpp/include/json_util.hpp`: Dependency-free JSON parser/serializer.
   - `cpp/src/engine.cpp`: JSON stdin/stdout binary (`cpp/bin/table_tale_engine`).
2. **Express API Gateway (`/server.ts`, `/server/*`)**:
   - `server.ts`: Runtime bootstrapper (Vite dev middleware & production static server).
   - `server/app.ts`: Modular Express app factory (`createApp`).
   - `server/routes/restaurantRoutes.ts`: Public guest, reservation, order checkout, and guest feedback endpoints.
   - `server/routes/managementRoutes.ts`: Staff login/logout and protected console endpoints.
   - `server/middleware/staffAuth.ts`: Bearer session store, lockout rate-limiting, and `requireStaffAuth`.
   - `server/services/cppBridge.ts`: Async mutex queue compiling & invoking `cpp/bin/table_tale_engine`.
3. **React + Tailwind Frontend (`/src`)**:
   - `src/features/{hero,menu,reservations,orders,management}`: Feature-scoped interactive modules.
   - `src/components/{common,layout,ui}`: Shared primitives (`BrandMark`, `FloatingWhatsApp`, `ResilientImage`), shell chrome (`Header`, `Footer`), and architectural stage primitives (`FloatingFoodHero`, `SectionStage`).
   - `src/api/client.ts`, `src/types/restaurant.ts`, `src/constants/assets.ts`, `src/lib/{formatters,utils}.ts`: Typed API client, contracts, media constants, and utilities.
   - Implements the **Blush Pink × Champagne Gold × Ivory × Espresso** palette with high-contrast dark typography.

## Asset Inventory
| Filename | Location | Usage | Component |
| :--- | :--- | :--- | :--- |
| `hero_table_and_tale_1795263857803.jpg` | `/src/assets/images/` | Dining room hero photography | `HeroSection.tsx` |
| `cat_desi_delights_1795263857540.jpg` | `/src/assets/images/` | Desi Delights (Biryani & Karahi) | `MenuShowcase.tsx` |
| `dish_nihari_pulao_1795267318977.jpg` | `/src/assets/images/` | Desi Delights (Nihari & Pulao) | `MenuShowcase.tsx` |
| `cat_fast_food_1795263856865.jpg` | `/src/assets/images/` | Fast Food (Zinger & Pizza) | `MenuShowcase.tsx` |
| `dish_sandwich_fries_1795267318083.jpg` | `/src/assets/images/` | Fast Food (Sandwich & Fries) | `MenuShowcase.tsx` |
| `cat_international_1795263857066.jpg` | `/src/assets/images/` | International (Alfredo & Steak) | `MenuShowcase.tsx` |
| `dish_lasagna_chowmein_1795267318306.jpg` | `/src/assets/images/` | International (Lasagna & Chow Mein) | `MenuShowcase.tsx` |
| `cat_desserts_1795264592349.jpg` | `/src/assets/images/` | Desserts (Cake & Cheesecake) | `MenuShowcase.tsx` |
| `dish_brownie_icecream_1795267319283.jpg` | `/src/assets/images/` | Desserts (Brownie & Ice Cream) | `MenuShowcase.tsx` |
| `cat_beverages_1795264592727.jpg` | `/src/assets/images/` | Beverages (Juice & Water) | `MenuShowcase.tsx` |
| `dish_milkshake_cold_drink_1795267318732.jpg` | `/src/assets/images/` | Beverages (Milkshake & Cold Drink) | `MenuShowcase.tsx` |
| `favicon.svg` | `/public/` | Browser tab favicon | `index.html` |
