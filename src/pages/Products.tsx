import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Filter, 
  ChevronDown, 
  LayoutGrid, 
  List,
  Search as SearchIcon,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ProductCard from '@/components/products/ProductCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { productService, Product } from '@/services/productService';
import { categoryService, Category } from '@/services/categoryService';
import { toast } from 'sonner';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategorySlug = searchParams.get('category');
  const initialSearch = searchParams.get('search');

  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerTypeFilter, setSellerTypeFilter] = useState<'all' | 'student' | 'store'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, cats] = await Promise.all([
          productService.getProducts({ limit: 100 }),
          categoryService.getCategories()
        ]);

        setProducts(prods || []);
        setCategories(cats);

        // Pre-select category if provided in query URL
        if (initialCategorySlug && cats.length > 0) {
          const matched = cats.find(c => c.slug === initialCategorySlug);
          if (matched) {
            setSelectedCategories([matched.id]);
          }
        }
      } catch (error) {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [initialCategorySlug]);

  const filteredProducts = products.filter(p => {
    const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    const matchesCondition = selectedConditions.length === 0 || selectedConditions.includes(p.condition);
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category_id || '');
    const matchesSearch = !initialSearch || 
      p.title.toLowerCase().includes(initialSearch.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(initialSearch.toLowerCase()));
    
    const matchesSellerType = 
      sellerTypeFilter === 'all' ||
      (sellerTypeFilter === 'store' && p.condition === 'new') ||
      (sellerTypeFilter === 'student' && p.condition === 'second_hand');

    return matchesPrice && matchesCondition && matchesCategory && matchesSearch && matchesSellerType;
  });

  const FilterSidebar = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Categories</h3>
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center space-x-2">
              <Checkbox 
                id={cat.id} 
                checked={selectedCategories.includes(cat.id)}
                onCheckedChange={(checked) => {
                  setSelectedCategories(prev => 
                    checked ? [...prev, cat.id] : prev.filter(id => id !== cat.id)
                  )
                }}
              />
              <label htmlFor={cat.id} className="text-sm font-medium leading-none cursor-pointer">
                {cat.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Price Range (KES)</h3>
        <div className="space-y-4">
          <Slider 
            defaultValue={[0, 50000]} 
            max={50000} 
            step={500} 
            value={priceRange}
            onValueChange={(val) => setPriceRange(Array.isArray(val) ? val : [val])}
            className="mt-6"
          />
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase">Min</p>
              <Input type="number" value={priceRange[0]} className="h-8" readOnly />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase">Max</p>
              <Input type="number" value={priceRange[1]} className="h-8" readOnly />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Condition</h3>
        <div className="space-y-3">
          {[
            { id: 'new', label: 'New' },
            { id: 'second_hand', label: 'Second Hand' }
          ].map(cond => (
            <div key={cond.id} className="flex items-center space-x-2">
              <Checkbox 
                id={cond.id} 
                checked={selectedConditions.includes(cond.id)}
                onCheckedChange={(checked) => {
                  setSelectedConditions(prev => 
                    checked ? [...prev, cond.id] : prev.filter(id => id !== cond.id)
                  )
                }}
              />
              <label htmlFor={cond.id} className="text-sm font-medium leading-none cursor-pointer">
                {cond.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={() => {
        setPriceRange([0, 50000]);
        setSelectedCategories([]);
        setSelectedConditions([]);
      }}>
        Reset Filters
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <FilterSidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Products</h1>
            <Badge variant="secondary">{filteredProducts.length} Results</Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Filter Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-8">
                  <FilterSidebar />
                </div>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Sort By: {sortBy === 'newest' ? 'Newest' : sortBy === 'price-low' ? 'Price: Low to High' : 'Price: High to Low'} <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('newest')}>Newest</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('price-low')}>Price: Low to High</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('price-high')}>Price: High to Low</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden sm:flex border rounded-lg overflow-hidden">
              <Button variant="ghost" size="icon" className="rounded-none bg-muted"><LayoutGrid className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="rounded-none"><List className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {/* Seller Type Filter Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto self-start border gap-1.5 font-sans">
          {[
            { id: 'all', label: 'All Results', icon: '🔍' },
            { id: 'student', label: 'Student Marketplace', icon: '🎓' },
            { id: 'store', label: 'Official Stores', icon: '🏪' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSellerTypeFilter(tab.id as any)}
              className={`flex-1 sm:flex-initial text-xs font-black px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                sellerTypeFilter === tab.id
                  ? 'bg-white text-primary shadow-sm border border-slate-200/40 font-extrabold'
                  : 'text-gray-500 hover:text-secondary font-bold'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Selected Filters Chips */}
        <div className="flex flex-wrap gap-2">
          {initialSearch && (
            <Badge variant="secondary" className="gap-1 pl-2 pr-1 h-7 bg-primary/10 text-primary border-primary/20 font-bold">
              Search: "{initialSearch}"
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete('search');
                setSearchParams(params);
              }} />
            </Badge>
          )}
          {selectedCategories.map(catId => (
            <Badge key={catId} variant="secondary" className="gap-1 pl-2 pr-1 h-7">
              {categories.find(c => c.id === catId)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategories(prev => prev.filter(id => id !== catId))} />
            </Badge>
          ))}
          {selectedConditions.map(condId => (
            <Badge key={condId} variant="secondary" className="gap-1 pl-2 pr-1 h-7 capitalize">
              {condId.replace('_', ' ')}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedConditions(prev => prev.filter(id => id !== condId))} />
            </Badge>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
            {filteredProducts.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-muted/20 rounded-3xl border border-dashed">
            <div className="p-4 bg-muted rounded-full">
              <SearchIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
            </div>
            <Button variant="outline" onClick={() => {
               setPriceRange([0, 50000]);
               setSelectedCategories([]);
               setSelectedConditions([]);
            }}>Clear all filters</Button>
          </div>
        )}
      </div>
    </div>
  );
}
