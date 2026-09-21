import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

export type Category = Database['public']['Tables']['categories']['Row'] & {
  display_order?: number;
  depth?: number;
  is_active?: boolean;
};

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  display_order: number;
  depth: number;
  is_active: boolean;
  subcategories: CategoryNode[];
}

// In-memory cache for fast navigations
let categoryTreeCache: CategoryNode[] | null = null;
let allCategoriesCache: Category[] | null = null;

// Slugs that are superseded duplicates and should NOT appear in the UI
const SUPERSEDED_SLUGS = new Set(['clothing-fashion', 'furniture-dorm']);

export const categoryService = {
  /**
   * Fetches live categories from Supabase (is_active = true) and returns an organized tree.
   * - Top-level rows have parent_id IS NULL (depth = 0)
   * - Subcategories have parent_id pointing to parent (depth = 1)
   * - Ordered by display_order
   * - Filters out superseded duplicate categories ('clothing-fashion', 'furniture-dorm')
   */
  async getCategoryTree(forceRefresh = false): Promise<CategoryNode[]> {
    if (!forceRefresh && categoryTreeCache && categoryTreeCache.length > 0) {
      return categoryTreeCache;
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase getCategoryTree failed:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      categoryTreeCache = [];
      return [];
    }

    // Filter out superseded duplicates from UI
    const activeItems = (data as any[]).filter(
      (c) => !SUPERSEDED_SLUGS.has(c.slug)
    );

    // Top-level categories: parent_id is null
    const topLevel = activeItems
      .filter((c) => !c.parent_id)
      .sort((a, b) => {
        const orderA = a.display_order ?? 0;
        const orderB = b.display_order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

    const tree: CategoryNode[] = topLevel.map((parent) => {
      const subcategories: CategoryNode[] = activeItems
        .filter((c) => c.parent_id === parent.id)
        .sort((a, b) => {
          const orderA = a.display_order ?? 0;
          const orderB = b.display_order ?? 0;
          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name);
        })
        .map((sub) => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          icon: sub.icon || null,
          parent_id: sub.parent_id,
          display_order: sub.display_order ?? 0,
          depth: sub.depth ?? 1,
          is_active: sub.is_active ?? true,
          subcategories: []
        }));

      return {
        id: parent.id,
        name: parent.name,
        slug: parent.slug,
        icon: parent.icon || null,
        parent_id: null,
        display_order: parent.display_order ?? 0,
        depth: parent.depth ?? 0,
        is_active: parent.is_active ?? true,
        subcategories
      };
    });

    categoryTreeCache = tree;
    return tree;
  },

  /**
   * Fetches all active categories flat list
   */
  async getCategories(forceRefresh = false): Promise<Category[]> {
    if (!forceRefresh && allCategoriesCache && allCategoriesCache.length > 0) {
      return allCategoriesCache;
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name');

    if (error) {
      console.error('Supabase getCategories failed:', error);
      throw error;
    }

    const filtered = ((data || []) as Category[]).filter((c) => !SUPERSEDED_SLUGS.has(c.slug));
    allCategoriesCache = filtered;
    return filtered;
  },

  /**
   * Find a category by slug or id from DB
   */
  async getCategoryBySlug(slugOrId: string): Promise<Category | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    let query = supabase.from('categories').select('*');
    if (isUuid) {
      query = query.eq('id', slugOrId);
    } else {
      query = query.eq('slug', slugOrId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error(`Supabase getCategoryBySlug for ${slugOrId} failed:`, error);
      throw error;
    }
    return data as Category | null;
  }
};
