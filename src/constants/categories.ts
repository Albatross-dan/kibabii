export interface Subcategory {
  id?: string;
  name: string;
  slug: string;
  icon?: string | null;
  display_order?: number;
}

export interface Category {
  id?: string;
  name: string;
  slug: string;
  icon: string;
  display_order?: number;
  subcategories?: Subcategory[];
}

/**
 * Authoritative Category List (15 top-level categories, 26 subcategories)
 * Excludes superseded duplicates (clothing-fashion and furniture-dorm)
 */
export const AUTHORITATIVE_CATEGORIES: Category[] = [
  // 1. Books & Notes (Flat)
  {
    name: 'Books & Notes',
    slug: 'books-notes',
    icon: 'Book',
    display_order: 0
  },
  // 2. Electronics (Flat)
  {
    name: 'Electronics',
    slug: 'electronics',
    icon: 'Monitor',
    display_order: 0
  },
  // 3. Food (Flat)
  {
    name: 'Food',
    slug: 'food-snacks',
    icon: 'Utensils',
    display_order: 0
  },
  // 4. Sports (Flat)
  {
    name: 'Sports',
    slug: 'sports-fitness',
    icon: 'Trophy',
    display_order: 0
  },
  // 5. Stationery (Flat)
  {
    name: 'Stationery',
    slug: 'stationery-art',
    icon: 'PenTool',
    display_order: 0
  },
  // 6. Services (Flat)
  {
    name: 'Services',
    slug: 'services',
    icon: 'Wrench',
    display_order: 0
  },
  // 7. Other (Flat)
  {
    name: 'Other',
    slug: 'other',
    icon: 'Package',
    display_order: 0
  },
  // 8. Phones (With 3 subcategories)
  {
    name: 'Phones',
    slug: 'phones',
    icon: 'smartphone',
    display_order: 1,
    subcategories: [
      { name: 'Smartphones', slug: 'phones-smartphones', display_order: 1 },
      { name: 'Feature Phones', slug: 'phones-feature', display_order: 2 },
      { name: 'Phone Accessories', slug: 'phones-accessories', display_order: 3 }
    ]
  },
  // 9. TVs & Audio (With 3 subcategories)
  {
    name: 'TVs & Audio',
    slug: 'tvs-audio',
    icon: 'tv',
    display_order: 2,
    subcategories: [
      { name: 'Televisions', slug: 'tvs-audio-televisions', display_order: 1 },
      { name: 'Speakers & Sound Systems', slug: 'tvs-audio-speakers', display_order: 2 },
      { name: 'Headphones & Earphones', slug: 'tvs-audio-headphones', display_order: 3 }
    ]
  },
  // 10. Appliances (With 3 subcategories)
  {
    name: 'Appliances',
    slug: 'appliances',
    icon: 'refrigerator',
    display_order: 3,
    subcategories: [
      { name: 'Kitchen Appliances', slug: 'appliances-kitchen', display_order: 1 },
      { name: 'Laundry & Cleaning', slug: 'appliances-laundry', display_order: 2 },
      { name: 'Cooling & Heating', slug: 'appliances-cooling-heating', display_order: 3 }
    ]
  },
  // 11. Health & Beauty (With 3 subcategories)
  {
    name: 'Health & Beauty',
    slug: 'health-beauty',
    icon: 'heart-pulse',
    display_order: 4,
    subcategories: [
      { name: 'Skincare', slug: 'health-beauty-skincare', display_order: 1 },
      { name: 'Haircare', slug: 'health-beauty-haircare', display_order: 2 },
      { name: 'Makeup', slug: 'health-beauty-makeup', display_order: 3 }
    ]
  },
  // 12. Fashion (With 4 subcategories)
  {
    name: 'Fashion',
    slug: 'fashion',
    icon: 'shirt',
    display_order: 5,
    subcategories: [
      { name: "Men's Clothing", slug: 'fashion-mens-clothing', display_order: 1 },
      { name: "Women's Clothing", slug: 'fashion-womens-clothing', display_order: 2 },
      { name: 'Shoes', slug: 'fashion-shoes', display_order: 3 },
      { name: 'Bags', slug: 'fashion-bags', display_order: 4 }
    ]
  },
  // 13. Computing (With 4 subcategories)
  {
    name: 'Computing',
    slug: 'computing',
    icon: 'laptop',
    display_order: 6,
    subcategories: [
      { name: 'Laptops', slug: 'computing-laptops', display_order: 1 },
      { name: 'Desktops & Monitors', slug: 'computing-desktops', display_order: 2 },
      { name: 'Computer Accessories', slug: 'computing-accessories', display_order: 3 },
      { name: 'Printers & Scanners', slug: 'computing-printers', display_order: 4 }
    ]
  },
  // 14. Furniture (With 3 subcategories)
  {
    name: 'Furniture',
    slug: 'furniture',
    icon: 'armchair',
    display_order: 7,
    subcategories: [
      { name: 'Beds & Mattresses', slug: 'furniture-beds', display_order: 1 },
      { name: 'Tables & Chairs', slug: 'furniture-tables-chairs', display_order: 2 },
      { name: 'Storage & Shelving', slug: 'furniture-storage', display_order: 3 }
    ]
  },
  // 15. Watches & Jewellery (With 3 subcategories)
  {
    name: 'Watches & Jewellery',
    slug: 'watches-jewellery',
    icon: 'watch',
    display_order: 8,
    subcategories: [
      { name: 'Watches', slug: 'watches-jewellery-watches', display_order: 1 },
      { name: 'Necklaces & Bracelets', slug: 'watches-jewellery-necklaces', display_order: 2 },
      { name: 'Rings & Earrings', slug: 'watches-jewellery-rings', display_order: 3 }
    ]
  }
];

export const SUBCATEGORIES_BY_PARENT_SLUG: Record<string, Subcategory[]> = AUTHORITATIVE_CATEGORIES.reduce(
  (acc, cat) => {
    if (cat.subcategories && cat.subcategories.length > 0) {
      acc[cat.slug] = cat.subcategories;
    }
    return acc;
  },
  {} as Record<string, Subcategory[]>
);

export const ALL_SUBCATEGORIES: Subcategory[] = AUTHORITATIVE_CATEGORIES.flatMap(
  (cat) => cat.subcategories || []
);

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return AUTHORITATIVE_CATEGORIES.find((c) => c.slug === slug);
};

export const getSubcategoriesForCategory = (slugOrName: string): Subcategory[] => {
  const cat = AUTHORITATIVE_CATEGORIES.find(
    (c) => c.slug === slugOrName || c.name.toLowerCase() === slugOrName.toLowerCase()
  );
  return cat?.subcategories || [];
};
