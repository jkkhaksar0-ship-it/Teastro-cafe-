import { InventoryItem } from '../types.ts';

const today = new Date().toISOString().split('T')[0];
const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const RAW_ITEMS_DATA: Array<{ category: string; name: string; unit: string; prev: number; curr: number; price: number; notes?: string }> = [
  // Chocolates
  { category: "Chocolates", name: "KitKat Chocolate", unit: "packs", prev: 24, curr: 8, price: 120, notes: "Popular snack bar" },
  { category: "Chocolates", name: "Bueno Chocolate", unit: "packs", prev: 18, curr: 4, price: 180, notes: "White & milk blend" },
  { category: "Chocolates", name: "Dairy Milk", unit: "bars", prev: 20, curr: 20, price: 90, notes: "Full stock" },
  { category: "Chocolates", name: "M&M's", unit: "pouches", prev: 15, curr: 5, price: 150, notes: "Peanut & regular" },

  // Biscuits
  { category: "Biscuits", name: "Oreo Biscuits", unit: "boxes", prev: 12, curr: 3, price: 220, notes: "For shakes & toppings" },
  { category: "Biscuits", name: "Lotus Biscuits", unit: "boxes", prev: 10, curr: 2, price: 450, notes: "Biscoff crumbles" },
  { category: "Biscuits", name: "Candy Biscuits", unit: "boxes", prev: 8, curr: 8, price: 160, notes: "Shelf 2" },
  { category: "Biscuits", name: "Sprinkles", unit: "jars", prev: 6, curr: 1, price: 300, notes: "Rainbow & chocolate" },

  // Sauces / Spreads
  { category: "Sauces / Spreads", name: "Nutella", unit: "tubs (3kg)", prev: 6, curr: 2, price: 3200, notes: "Dessert station" },
  { category: "Sauces / Spreads", name: "Choc Bliss", unit: "bottles", prev: 8, curr: 3, price: 650, notes: "Drizzle squeeze" },
  { category: "Sauces / Spreads", name: "Pistachio", unit: "jars (1kg)", prev: 4, curr: 1, price: 1850, notes: "Premium topping" },
  { category: "Sauces / Spreads", name: "Bueno Sauce", unit: "bottles", prev: 6, curr: 6, price: 780, notes: "Backup in storage" },
  { category: "Sauces / Spreads", name: "Lotus Sauce", unit: "bottles", prev: 8, curr: 2, price: 950, notes: "High demand" },

  // Ice Cream
  { category: "Ice Cream", name: "Vanilla Ice Cream", unit: "tubs (5L)", prev: 5, curr: 1, price: 1200, notes: "Freezer 1" },
  { category: "Ice Cream", name: "Chocolate Ice Cream", unit: "tubs (5L)", prev: 4, curr: 2, price: 1350, notes: "Freezer 1" },

  // Tea / Drinks
  { category: "Tea / Drinks", name: "Tea Leaf", unit: "kg", prev: 10, curr: 10, price: 850, notes: "Danedar premium" },
  { category: "Tea / Drinks", name: "Malai", unit: "kg", prev: 6, curr: 1, price: 600, notes: "Fresh dairy daily" },
  { category: "Tea / Drinks", name: "Coffee", unit: "jars (500g)", prev: 6, curr: 3, price: 1400, notes: "Espresso roast" },
  { category: "Tea / Drinks", name: "Kahwa", unit: "boxes", prev: 5, curr: 5, price: 320, notes: "Green tea bags" },

  // Chicken / Crispy Items
  { category: "Chicken / Crispy Items", name: "Crispy Chicken Strips", unit: "kg", prev: 25, curr: 7, price: 950, notes: "Prep station" },
  { category: "Chicken / Crispy Items", name: "Boneless Chicken", unit: "kg", prev: 30, curr: 12, price: 820, notes: "Marinated batch" },
  { category: "Chicken / Crispy Items", name: "Chicken for Stuffing", unit: "kg", prev: 15, curr: 3, price: 780, notes: "Wrap & sandwich mix" },

  // Other Food Items
  { category: "Other Food Items", name: "Nachos", unit: "packs (1kg)", prev: 12, curr: 4, price: 420, notes: "Crispy chips" },
  { category: "Other Food Items", name: "Cheese", unit: "blocks", prev: 10, curr: 3, price: 1100, notes: "Cheddar / Mozzarella" },
  { category: "Other Food Items", name: "Waffle Fries", unit: "bags (2.5kg)", prev: 8, curr: 2, price: 850, notes: "Freezer 2" },
  { category: "Other Food Items", name: "Curly Fries", unit: "bags (2.5kg)", prev: 8, curr: 8, price: 850, notes: "Good stock" },
  { category: "Other Food Items", name: "Crinkle Fries", unit: "bags (2.5kg)", prev: 10, curr: 4, price: 750, notes: "Reorder" },
  { category: "Other Food Items", name: "Plain Fries", unit: "bags (2.5kg)", prev: 14, curr: 5, price: 680, notes: "Fast mover" },
  { category: "Other Food Items", name: "Tomato", unit: "kg", prev: 10, curr: 4, price: 120, notes: "Fresh produce" },
  { category: "Other Food Items", name: "Olive", unit: "jars", prev: 6, curr: 6, price: 480, notes: "Black sliced" },
  { category: "Other Food Items", name: "Wrap Bread", unit: "packets", prev: 20, curr: 6, price: 260, notes: "Tortilla 10-inch" },
  { category: "Other Food Items", name: "Sandwich Bread", unit: "loaves", prev: 12, curr: 3, price: 190, notes: "Jumbo sliced" },
  { category: "Other Food Items", name: "Vanilla Essence", unit: "bottles", prev: 3, curr: 3, price: 220, notes: "Bakery essence" },

  // Soft Drinks
  { category: "Soft Drinks", name: "Pepsi", unit: "cans (case)", prev: 10, curr: 3, price: 1800, notes: "330ml chilled" },
  { category: "Soft Drinks", name: "Mirinda", unit: "cans (case)", prev: 6, curr: 1, price: 1800, notes: "Reorder case" },
  { category: "Soft Drinks", name: "7UP", unit: "cans (case)", prev: 8, curr: 4, price: 1800, notes: "330ml chilled" },
];

export function getInitialItems(): InventoryItem[] {
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return RAW_ITEMS_DATA.map((item, idx) => {
    const required = Math.max(0, item.prev - item.curr);
    return {
      id: `item-${idx + 1}`,
      category: item.category,
      name: item.name,
      unit: item.unit,
      unitPrice: item.price,
      previousStock: item.prev,
      currentStock: item.curr,
      requiredQty: required,
      date: dateStr,
      status: required > 0 ? 'DEMAND' : 'OK',
      notes: item.notes || '',
      lastUpdatedDate: dateStr,
      lastUpdatedTime: timeStr,
      lastUpdated: timeStr,
    };
  });
}

export const PRESET_LIBRARY_ITEMS: Array<{ category: string; name: string; unit: string; price: number; notes: string }> = [
  // Dairy & Bakery
  { category: "Dairy & Bakery", name: "Fresh Milk", unit: "liters", price: 180, notes: "Whole pasteurized" },
  { category: "Dairy & Bakery", name: "Heavy Whipping Cream", unit: "packs (1L)", price: 680, notes: "For dessert topping" },
  { category: "Dairy & Bakery", name: "Burger Buns", unit: "packets (6pcs)", price: 240, notes: "Brioche sesame" },
  { category: "Dairy & Bakery", name: "Butter Unsalted", unit: "blocks (200g)", price: 320, notes: "Baking butter" },
  { category: "Dairy & Bakery", name: "Condensed Milk", unit: "tins (395g)", price: 290, notes: "Dessert prep" },
  
  // Condiments & Toppings
  { category: "Sauces / Spreads", name: "Mayonnaise", unit: "tubs (3kg)", price: 1250, notes: "Classic garlic blend" },
  { category: "Sauces / Spreads", name: "Chili Garlic Sauce", unit: "bottles (1L)", price: 380, notes: "Dip station" },
  { category: "Sauces / Spreads", name: "Caramel Drizzle", unit: "bottles", price: 540, notes: "Sweet topping" },
  { category: "Sauces / Spreads", name: "Maple Syrup", unit: "bottles", price: 620, notes: "Waffles & pancakes" },
  
  // Packaging & Disposables
  { category: "Packaging & Disposables", name: "Paper Cups 8oz", unit: "sleeves (50pcs)", price: 350, notes: "Hot drink cups" },
  { category: "Packaging & Disposables", name: "Clear Cold Cups 16oz", unit: "sleeves (50pcs)", price: 420, notes: "Iced drink cups" },
  { category: "Packaging & Disposables", name: "Cup Lids", unit: "sleeves (50pcs)", price: 180, notes: "Dome & flat" },
  { category: "Packaging & Disposables", name: "Kraft Takeaway Bags", unit: "packs (100pcs)", price: 850, notes: "Medium delivery" },
  { category: "Packaging & Disposables", name: "Paper Straws", unit: "boxes (100pcs)", price: 210, notes: "Eco-friendly" },
  { category: "Packaging & Disposables", name: "Burger Wrapping Foil", unit: "rolls", price: 490, notes: "Greaseproof" },

  // Meat & Proteins
  { category: "Chicken / Crispy Items", name: "Chicken Patty", unit: "boxes (12pcs)", price: 920, notes: "Pre-seasoned" },
  { category: "Chicken / Crispy Items", name: "Chicken Wings", unit: "kg", price: 650, notes: "Buffalo & BBQ" },
  { category: "Chicken / Crispy Items", name: "Chicken Sausages", unit: "packs (10pcs)", price: 480, notes: "Breakfast wrap" },

  // Syrups & Beverages
  { category: "Tea / Drinks", name: "Vanilla Syrup", unit: "bottles (750ml)", price: 950, notes: "Flavor pump" },
  { category: "Tea / Drinks", name: "Caramel Syrup", unit: "bottles (750ml)", price: 950, notes: "Flavor pump" },
  { category: "Tea / Drinks", name: "Hazelnut Syrup", unit: "bottles (750ml)", price: 950, notes: "Flavor pump" },
  { category: "Tea / Drinks", name: "Matcha Powder", unit: "tins (250g)", price: 1400, notes: "Japanese green tea" },
  { category: "Soft Drinks", name: "Mineral Water 500ml", unit: "crates (24pcs)", price: 720, notes: "Chilled bottle" },
];

export const DEFAULT_CATEGORIES = [
  "Chocolates",
  "Biscuits",
  "Sauces / Spreads",
  "Ice Cream",
  "Tea / Drinks",
  "Chicken / Crispy Items",
  "Other Food Items",
  "Soft Drinks",
  "Dairy & Bakery",
  "Packaging & Disposables"
];

export const COMMON_UNITS = [
  "packs",
  "boxes",
  "bottles",
  "jars",
  "cans (case)",
  "kg",
  "liters",
  "tubs (3kg)",
  "tubs (5L)",
  "packets",
  "loaves",
  "bars",
  "blocks",
  "bags (2.5kg)",
  "pouches",
  "sleeves (50pcs)",
  "pcs"
];
