export interface CategoryPlate {
  src: string;
  caption: string;
  alt: string;
}

export const RESTAURANT_IMAGES = {
  hero: '/src/assets/images/hero_table_and_tale_1795263857803.jpg',
  categories: {
    0: '/src/assets/images/cat_desi_delights_1795263857540.jpg',
    1: '/src/assets/images/cat_fast_food_1795263856865.jpg',
    2: '/src/assets/images/cat_international_1795263857066.jpg',
    3: '/src/assets/images/cat_desserts_1795264592349.jpg',
    4: '/src/assets/images/cat_beverages_1795264592727.jpg',
  } as Record<number, string>,
  categoryPlates: {
    0: [
      {
        src: '/src/assets/images/cat_desi_delights_1795263857540.jpg',
        caption: 'Chicken Biryani & Chicken Karahi',
        alt: 'Fragrant saffron Chicken Biryani and sizzling Chicken Karahi in stoneware and hammered copper bowls',
      },
      {
        src: '/src/assets/images/dish_nihari_pulao_1795267318977.jpg',
        caption: 'Beef Nihari & Chicken Pulao',
        alt: 'Slow-simmered Beef Nihari garnished with ginger julienne alongside spiced Chicken Pulao',
      },
    ],
    1: [
      {
        src: '/src/assets/images/cat_fast_food_1795263856865.jpg',
        caption: 'Zinger Burger & Chicken Pizza',
        alt: 'Crispy Zinger brioche burger and wood-fired artisan Chicken Pizza',
      },
      {
        src: '/src/assets/images/dish_sandwich_fries_1795267318083.jpg',
        caption: 'Club Sandwich & French Fries',
        alt: 'Triple-decker toasted Club Sandwich served with golden seasoned French Fries',
      },
    ],
    2: [
      {
        src: '/src/assets/images/cat_international_1795263857066.jpg',
        caption: 'Alfredo Pasta & Chicken Steak',
        alt: 'Creamy fettuccine Alfredo Pasta and chargrilled Chicken Steak with herb butter',
      },
      {
        src: '/src/assets/images/dish_lasagna_chowmein_1795267318306.jpg',
        caption: 'Lasagna & Chow Mein',
        alt: 'Baked mozzarella Chicken Lasagna beside wok-seared Chicken Chow Mein',
      },
    ],
    3: [
      {
        src: '/src/assets/images/cat_desserts_1795264592349.jpg',
        caption: 'Chocolate Cake & Cheesecake',
        alt: 'Rich dark Chocolate Cake and velvety berry Cheesecake on ivory porcelain',
      },
      {
        src: '/src/assets/images/dish_brownie_icecream_1795267319283.jpg',
        caption: 'Brownie & Ice Cream',
        alt: 'Warm chocolate fudge Brownie with ganache and artisan vanilla bean Ice Cream',
      },
    ],
    4: [
      {
        src: '/src/assets/images/cat_beverages_1795264592727.jpg',
        caption: 'Fresh Juice & Mineral Water',
        alt: 'Chilled golden Fresh Juice and sparkling Mineral Water carafe on travertine',
      },
      {
        src: '/src/assets/images/dish_milkshake_cold_drink_1795267318732.jpg',
        caption: 'Milkshake & Cold Drink',
        alt: 'Thick Chocolate Milkshake with cocoa curls beside iced sparkling Cold Drink',
      },
    ],
  } as Record<number, [CategoryPlate, CategoryPlate]>,
};

export { formatCurrency, formatWholeCurrency } from '@/lib/formatters';
