import React from 'react';
import {
  BookOpen,
  Monitor,
  Utensils,
  Trophy,
  PenTool,
  Wrench,
  Package,
  Smartphone,
  Tv,
  Refrigerator,
  HeartPulse,
  Shirt,
  Laptop,
  Armchair,
  Watch,
  Tag,
  Home,
  Search,
  Calendar,
  Layers,
  LucideIcon
} from 'lucide-react';

/**
 * Normalizes an icon name from Supabase categories table
 * Handles casing differences ('Book' vs 'smartphone') and special characters ('heart-pulse')
 */
export function normalizeCategoryIcon(iconName?: string | null): string {
  if (!iconName) return '';
  return iconName.toLowerCase().replace(/[-_\s]/g, '');
}

/**
 * Maps database category icon strings to Lucide icon components.
 * Falls back gracefully to category slug or generic icons.
 */
export function getCategoryLucideIcon(iconName?: string | null, slug?: string): LucideIcon {
  const normalized = normalizeCategoryIcon(iconName);
  const slugNorm = normalizeCategoryIcon(slug);

  // 1. Check icon name match
  switch (normalized) {
    case 'book':
    case 'bookopen':
    case 'books':
      return BookOpen;
    case 'monitor':
    case 'screen':
      return Monitor;
    case 'utensils':
    case 'food':
      return Utensils;
    case 'trophy':
    case 'cup':
      return Trophy;
    case 'pentool':
    case 'pen':
      return PenTool;
    case 'wrench':
    case 'tool':
      return Wrench;
    case 'package':
    case 'box':
      return Package;
    case 'smartphone':
    case 'phone':
    case 'mobile':
      return Smartphone;
    case 'tv':
    case 'television':
      return Tv;
    case 'refrigerator':
    case 'fridge':
      return Refrigerator;
    case 'heartpulse':
    case 'heart':
      return HeartPulse;
    case 'shirt':
    case 'clothing':
      return Shirt;
    case 'laptop':
    case 'pc':
    case 'computer':
      return Laptop;
    case 'armchair':
    case 'bed':
    case 'sofa':
    case 'chair':
      return Armchair;
    case 'watch':
    case 'clock':
      return Watch;
  }

  // 2. Check slug match fallback
  switch (slugNorm) {
    case 'booksnotes':
    case 'books':
      return BookOpen;
    case 'electronics':
      return Monitor;
    case 'foodsnacks':
    case 'food':
      return Utensils;
    case 'sportsfitness':
    case 'sports':
      return Trophy;
    case 'stationeryart':
    case 'stationery':
      return PenTool;
    case 'services':
      return Wrench;
    case 'other':
      return Package;
    case 'phones':
    case 'phonessmartphones':
      return Smartphone;
    case 'tvsaudio':
      return Tv;
    case 'appliances':
      return Refrigerator;
    case 'healthbeauty':
      return HeartPulse;
    case 'fashion':
      return Shirt;
    case 'computing':
      return Laptop;
    case 'furniture':
      return Armchair;
    case 'watchesjewellery':
      return Watch;
    case 'accommodation':
      return Home;
    case 'lostfound':
      return Search;
    case 'events':
      return Calendar;
    default:
      return Tag;
  }
}

/**
 * Returns an emoji representation for mobile/form badges
 */
export function getCategoryEmoji(iconName?: string | null, slug?: string): string {
  const norm = normalizeCategoryIcon(iconName) || normalizeCategoryIcon(slug);
  switch (norm) {
    case 'book':
    case 'booksnotes':
      return '📚';
    case 'monitor':
    case 'electronics':
      return '⚡';
    case 'utensils':
    case 'foodsnacks':
    case 'food':
      return '🍔';
    case 'trophy':
    case 'sportsfitness':
    case 'sports':
      return '⚽';
    case 'pentool':
    case 'stationeryart':
    case 'stationery':
      return '✏️';
    case 'wrench':
    case 'services':
      return '🔧';
    case 'package':
    case 'other':
      return '📦';
    case 'smartphone':
    case 'phones':
      return '📱';
    case 'tv':
    case 'tvsaudio':
      return '📺';
    case 'refrigerator':
    case 'appliances':
      return '🔌';
    case 'heartpulse':
    case 'healthbeauty':
      return '✨';
    case 'shirt':
    case 'fashion':
      return '👗';
    case 'laptop':
    case 'computing':
      return '💻';
    case 'armchair':
    case 'furniture':
      return '🛋️';
    case 'watch':
    case 'watchesjewellery':
      return '⌚';
    case 'accommodation':
      return '🏠';
    case 'lostfound':
      return '🔍';
    case 'events':
      return '📅';
    default:
      return '🏷️';
  }
}

/**
 * Category badge styles
 */
export function getCategoryBadgeColor(slug?: string): string {
  const s = (slug || '').toLowerCase();
  if (s.includes('book')) return 'bg-amber-50 text-amber-800 border-amber-200';
  if (s.includes('electron')) return 'bg-blue-50 text-blue-800 border-blue-200';
  if (s.includes('food')) return 'bg-orange-50 text-orange-800 border-orange-200';
  if (s.includes('sport')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (s.includes('station')) return 'bg-sky-50 text-sky-800 border-sky-200';
  if (s.includes('service')) return 'bg-purple-50 text-purple-800 border-purple-200';
  if (s.includes('phone')) return 'bg-amber-50 text-amber-800 border-amber-200';
  if (s.includes('tv') || s.includes('audio')) return 'bg-indigo-50 text-indigo-800 border-indigo-200';
  if (s.includes('appliance')) return 'bg-orange-50 text-orange-800 border-orange-200';
  if (s.includes('beauty') || s.includes('health')) return 'bg-pink-50 text-pink-800 border-pink-200';
  if (s.includes('fashion') || s.includes('cloth')) return 'bg-rose-50 text-rose-800 border-rose-200';
  if (s.includes('comput')) return 'bg-cyan-50 text-cyan-800 border-cyan-200';
  if (s.includes('furnitur')) return 'bg-teal-50 text-teal-800 border-teal-200';
  if (s.includes('watch') || s.includes('jewel')) return 'bg-violet-50 text-violet-800 border-violet-200';
  if (s.includes('accommodat')) return 'bg-teal-50 text-teal-800 border-teal-200';
  if (s.includes('lost')) return 'bg-yellow-50 text-yellow-800 border-yellow-200';
  if (s.includes('event')) return 'bg-red-50 text-red-800 border-red-200';
  return 'bg-slate-50 text-slate-800 border-slate-200';
}

/**
 * Category descriptions
 */
export function getCategoryDescription(slug?: string, name?: string): string {
  const s = (slug || '').toLowerCase();
  if (s.includes('book')) return 'Course textbooks, revised past papers, revision notes, handouts, and academic reference guides.';
  if (s.includes('electron')) return 'Power banks, chargers, subwoofers, electric iron boxes, and dorm electronic essentials.';
  if (s.includes('food')) return 'Hostel snacks, cooked student meals, cereals, fresh produce, and cooking ingredients.';
  if (s.includes('sport')) return 'Gym gear, soccer boots, basketballs, jerseys, workout resistance bands, and fitness wear.';
  if (s.includes('station')) return 'Mathematical sets, scientific calculators, notebooks, pens, highlighters, and art supplies.';
  if (s.includes('service')) return 'Campus printing & cyber, laptop repair, photography, barber services, and academic tutoring.';
  if (s.includes('phone')) return 'Smartphones, feature phones (mulika mwizi), and verified phone accessories.';
  if (s.includes('tv') || s.includes('audio')) return 'Smart televisions, surround soundbars, Bluetooth speakers, headphones, and earphones.';
  if (s.includes('appliance')) return 'Kitchen cookers, kettles, mini fridges, washing gear, heaters, and cooling fans.';
  if (s.includes('beauty') || s.includes('health')) return 'Skincare cleansers, lotions, fragrances, haircare oils, and makeup sets.';
  if (s.includes('fashion') || s.includes('cloth')) return "Men's & women's designer wear, footwear, sneakers, campus backpacks, and bags.";
  if (s.includes('comput')) return 'Laptops, monitors, keyboards, mice, printers, scanners, and tech accessories for coursework.';
  if (s.includes('furnitur')) return 'Mattresses, bedframes, study tables, orthopedic chairs, shoe racks, and wardrobe storage.';
  if (s.includes('watch') || s.includes('jewel')) return 'Smart watches, analog wristwatches, silver necklaces, bracelets, rings, and earrings.';
  if (s.includes('other')) return 'Miscellaneous student items, accessories, tools, and campus utilities.';
  if (s.includes('accommodat')) return 'Vacant bedsitters, campus hostels, and shared rooms listed directly by operators.';
  if (s.includes('lost')) return 'Campus lost items and found recoveries posted to help fellow comrades.';
  if (s.includes('event')) return 'Inter-hostel sports tournaments, parties, seminars, and academic workshops.';
  return `Browse student listings and campus gear in ${name || 'Marketplace'}.`;
}
