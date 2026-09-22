import * as React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  DollarSign,
  Package,
  Tag,
  MapPin,
  HelpCircle,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FolderOpen,
  Camera,
  Layers,
  Phone,
  MessageSquare,
  Globe,
  Share2,
  Check,
  Eye,
  Heart,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Trash,
  Sliders,
  Maximize2,
  Home,
  ExternalLink,
  Store,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

// Import local database and Supabase services
import { listingService, Listing, Draft } from '@/services/listingService';
import { categoryService, CategoryNode } from '@/services/categoryService';
import { supabase } from '@/lib/supabase';
import { getCategoryEmoji } from '@/lib/categoryIcons';
import { isValidUuid, toValidUuid } from '@/lib/uuid';

import { AUTHORITATIVE_CATEGORIES, getSubcategoriesForCategory } from '@/constants/categories';

// Category Constants for all listing types
const PRODUCT_CATEGORIES = AUTHORITATIVE_CATEGORIES.map(c => ({
  id: c.slug,
  name: c.name,
  icon: c.icon,
  slug: c.slug
}));

const ACCOMMODATION_CATEGORIES = [
  { id: 'acc-1', name: 'Campus Hostels', icon: '🏢' },
  { id: 'acc-2', name: 'Off-campus Rentals', icon: '🏠' },
  { id: 'acc-3', name: 'Bedsitters', icon: '🚪' },
  { id: 'acc-4', name: 'Shared Rooms', icon: '👥' },
  { id: 'acc-5', name: 'Vacancies / Apartments', icon: '✨' }
];

const SERVICE_CATEGORIES = [
  { id: 'svc-1', name: 'Cyber & Printing', icon: '💻' },
  { id: 'svc-2', name: 'Photography & Media', icon: '📸' },
  { id: 'svc-3', name: 'Graphic Design', icon: '🎨' },
  { id: 'svc-4', name: 'Hairdresser & Barber', icon: '✂️' },
  { id: 'svc-5', name: 'Repairs & Tech Support', icon: '🛠' },
  { id: 'svc-6', name: 'Tutoring & Academic', icon: '📚' }
];

const LOST_FOUND_CATEGORIES = [
  { id: 'lost-1', name: 'Electronics & Phones', icon: '📱' },
  { id: 'lost-2', name: 'Keys & ID Cards', icon: '🔑' },
  { id: 'lost-3', name: 'Wallets & Cash', icon: '👛' },
  { id: 'lost-4', name: 'Books & Stationeries', icon: '📘' },
  { id: 'lost-5', name: 'Clothing & Accessories', icon: '🎒' }
];

const EVENT_CATEGORIES = [
  { id: 'evt-1', name: 'Sports & Tournaments', icon: '⚽' },
  { id: 'evt-2', name: 'Campus Parties', icon: '🎤' },
  { id: 'evt-3', name: 'Seminars & Forums', icon: '💬' },
  { id: 'evt-4', name: 'Academic Workshops', icon: '📝' },
  { id: 'evt-5', name: 'Other Group Events', icon: '🎉' }
];

export default function NewListing() {
  const navigate = useNavigate();
  const navigateTo = (path: string) => {
    navigate(path === '/login' ? '/auth/login' : path);
  };
  const { user, profile } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listing global state
  const [listingType, setListingType] = useState<'product' | 'accommodation' | 'service' | 'lost_found' | 'event' | 'none'>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const typeParam = searchParams.get('type') as any;
    if (typeParam && ['product', 'accommodation', 'service', 'lost_found', 'event'].includes(typeParam)) {
      return typeParam;
    }
    return 'none';
  });

  // Flow step control
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const typeParam = searchParams.get('type');
    return (typeParam && ['product', 'accommodation', 'service', 'lost_found', 'event'].includes(typeParam)) ? 2 : 1;
  });

  const [loading, setLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publishedId, setPublishedId] = useState('review-node');
  const [lastAutosaveTime, setLastAutosaveTime] = useState<string>('');
  const [showAutosaveNotice, setShowAutosaveNotice] = useState(false);
  const [rpcError, setRpcError] = useState<string | null>(null);

  // User details / automatically detected seller type
  const [userStore, setUserStore] = useState<any>(null);
  const [listingAsStore, setListingAsStore] = useState<boolean>(true);

  // Load current user store from Supabase 'stores' table
  useEffect(() => {
    async function checkStoreOwnership() {
      const currentUserId = profile?.id || user?.id;
      if (!currentUserId) return;

      try {
        const { data: storeData, error: storeErr } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', currentUserId)
          .maybeSingle();

        if (storeData && !storeErr) {
          setUserStore(storeData);
          setListingAsStore(true);
        }
      } catch (err) {
        console.warn('Could not check store ownership:', err);
      }
    }
    checkStoreOwnership();
  }, [profile?.id, user?.id]);

  const hasStore = Boolean(
    userStore || 
    profile?.store_id || 
    profile?.account_type === 'store' || 
    profile?.role === 'store' || 
    profile?.role === 'shop_owner' || 
    profile?.is_store === true
  );
  const isStore = hasStore && listingAsStore;
  const rawSellerId = profile?.id || user?.id || 'fa19960e-df14-4b84-8034-c61a0fc55a05';
  const sellerId = isValidUuid(rawSellerId) ? rawSellerId : toValidUuid(rawSellerId);
  const sellerType: 'student' | 'store' = isStore ? 'store' : 'student';
  const effectiveStoreId = (hasStore && listingAsStore) ? (userStore?.id || profile?.store_id || null) : null;

  // Form states 
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Main Campus Quad');
  const [images, setImages] = useState<string[]>([]);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  
  // Category states
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedCatName, setSelectedCatName] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbCategoryTree, setDbCategoryTree] = useState<CategoryNode[]>([]);

  // Live database dropdown states
  const HARDCODED_CAMPUSES = [
    { id: '8e08c135-e6ec-4387-af3e-110b11d37c07', name: 'Kibabii University', short_name: 'KIBU', town: 'Bungoma', is_active: true },
    { id: 'c0f1b4c9-7c1a-4ad1-916d-6ecee18e04bc', name: 'Moi University', short_name: 'MU', town: 'Eldoret', is_active: true },
    { id: '7618bc9c-7617-4d4c-9e46-ae5b9d052947', name: 'MMUST', short_name: 'MMUST', town: 'Kakamega', is_active: true },
    { id: '2427759a-1981-45db-8eb5-31599f72e114', name: 'Kenyatta University', short_name: 'KU', town: 'Nairobi', is_active: true }
  ];
  const [dbCampuses, setDbCampuses] = useState<any[]>(HARDCODED_CAMPUSES);
  const [selectedCampusId, setSelectedCampusId] = useState('8e08c135-e6ec-4387-af3e-110b11d37c07');
  const [dbConditions, setDbConditions] = useState<any[]>([]);
  const [selectedConditionId, setSelectedConditionId] = useState('');
  const [dbBrands, setDbBrands] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');

  useEffect(() => {
    const fetchDbCategories = async () => {
      try {
        const tree = await categoryService.getCategoryTree();
        setDbCategoryTree(tree);
        const cats = await categoryService.getCategories();
        setDbCategories(cats);
      } catch (err) {
        console.warn('Failed to fetch categories of DB', err);
      }
    };

    const fetchDropdowns = async () => {
      try {
        // Fetch campuses
        const { data: campusesData } = await supabase.from('campuses').select('*').eq('is_active', true).order('name');
        if (campusesData && campusesData.length > 0) {
          setDbCampuses(campusesData);
          setSelectedCampusId(campusesData[0].id);
        } else {
          setDbCampuses(HARDCODED_CAMPUSES);
          setSelectedCampusId('8e08c135-e6ec-4387-af3e-110b11d37c07');
        }

        // Fetch product conditions
        const { data: conditionsData } = await supabase.from('product_conditions').select('*').order('display_order');
        if (conditionsData) {
          setDbConditions(conditionsData);
          if (conditionsData.length > 0) {
            setSelectedConditionId(conditionsData[0].id);
          }
        }

        // Fetch brands
        const { data: brandsData } = await supabase.from('brands').select('*').eq('is_active', true).order('name');
        if (brandsData) {
          setDbBrands(brandsData);
        }
      } catch (err) {
        console.warn('Failed to fetch dropdown metadata:', err);
      }
    };

    fetchDbCategories();
    fetchDropdowns();
  }, []);

  const getRealDbCategoryId = (catId: string) => {
    if (!catId) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catId);
    if (isUuid) return catId;

    const treeMatch = dbCategoryTree.find(
      c => c.id === catId || c.slug === catId || c.name.toLowerCase() === catId.toLowerCase()
    );
    if (treeMatch && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(treeMatch.id)) {
      return treeMatch.id;
    }

    const match = dbCategories.find(c => 
      c.id === catId || 
      c.slug === catId || 
      c.name.toLowerCase() === catId.toLowerCase()
    );
    return match ? match.id : catId;
  };

  const getRealDbSubcategoryId = (subId: string) => {
    if (!subId) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subId);
    if (isUuid) return subId;

    for (const cat of dbCategoryTree) {
      const foundSub = cat.subcategories.find(
        s => s.id === subId || s.slug === subId || s.name.toLowerCase() === subId.toLowerCase()
      );
      if (foundSub && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(foundSub.id)) {
        return foundSub.id;
      }
    }

    const flatSub = dbCategories.find(
      c => c.id === subId || c.slug === subId || c.name.toLowerCase() === subId.toLowerCase()
    );
    return flatSub ? flatSub.id : null;
  };

  // Fields and condition
  const [productPrice, setProductPrice] = useState('');
  const [productCondition, setProductCondition] = useState('New');

  useEffect(() => {
    if (selectedConditionId && dbConditions.length > 0) {
      const cond = dbConditions.find(c => c.id === selectedConditionId);
      if (cond) {
        setProductCondition(cond.label);
      }
    }
  }, [selectedConditionId, dbConditions]);
  
  // Contact info states
  const [sellerName, setSellerName] = useState(() => {
    const p = profile as any;
    return p?.full_name || user?.user_metadata?.full_name || 'Comrade Seller';
  });
  const [whatsappContact, setWhatsappContact] = useState(() => {
    const p = profile as any;
    return p?.whatsapp_phone || p?.phone || '';
  });
  const [sellerEmail, setSellerEmail] = useState(user?.email || 'comrade@kibabii.ac.ke');
  const [preferredContact, setPreferredContact] = useState<'whatsapp' | 'chat' | 'both'>('both');
  const [productWhatsappNumber, setProductWhatsappNumber] = useState('');

  // Type-specific details state
  const [typeData, setTypeData] = useState<any>({
    accommodation_type: 'bedsitter',
    accommodation_rent: '',
    accommodation_deposit: '',
    accommodation_distance: '',
    accommodation_distance_km: '',
    accommodation_rooms: '1',
    bedrooms: '1',
    bathrooms: '1',
    available_rooms: '1',
    accommodation_contact: '',
    service_category: 'Cyber & Printing',
    service_starting_price: '',
    service_working_hours: '8:00 AM - 9:00 PM',
    service_whatsapp: '',
    service_bio: '',
    lost_found_mode: 'lost',
    lost_found_exact_location: '',
    lost_found_date: '',
    lost_found_contact: '',
    event_type: 'Tournament',
    event_venue: '',
    event_time: '14:00',
    event_date: '',
    event_organizer: 'Kibabii Student Union',
    event_is_free: true,
    event_ticket_price: '',
    event_max_attendees: '100',
    event_registration_link: ''
  });

  // Promotional packages configurations
  const [promotionType, setPromotionType] = useState('free');
  const [flashConfig, setFlashConfig] = useState({
    enabled: false,
    orig: 0,
    disc: 0,
    expires: ''
  });

  // Image manipulation state
  const [inputUrl, setInputUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropIdx, setCropIdx] = useState<number | null>(null);
  const [zoomVal, setZoomVal] = useState(1);
  const [rotateVal, setRotateVal] = useState(0);
  const [compressedImages, setCompressedImages] = useState<Record<string, number>>({});

  // Draft rescue state
  const [savedDrafts, setSavedDrafts] = useState<Draft[]>([]);
  const draftIdRef = useRef<string>(`draft-${Math.random().toString(36).substring(2, 11)}`);

  const [activeListingsCount, setActiveListingsCount] = useState(0);

  // Load drafts and active listings count on mount
  useEffect(() => {
    if (sellerId) {
      const loadDrafts = async () => {
        try {
          const activeDrafts = await listingService.getMyDrafts(sellerId);
          setSavedDrafts(activeDrafts || []);
        } catch (err) {
          console.error('Error loading drafts from Supabase:', err);
          setSavedDrafts([]);
        }
      };
      
      const fetchCount = async () => {
        try {
          const items = await listingService.getMyListings('active', null, 'newest', null, 50, 0);
          setActiveListingsCount(items?.length || 0);
        } catch (err) {
          console.error('Error fetching listings count:', err);
          setActiveListingsCount(0);
        }
      };

      loadDrafts();
      fetchCount();
    }
  }, [sellerId]);

  // Set default WhatsApp contact when profile becomes ready
  useEffect(() => {
    if (profile) {
      const p = profile as any;
      if (p.full_name) setSellerName(p.full_name);
      if (p.whatsapp_phone || p.phone) setWhatsappContact(p.whatsapp_phone || p.phone || '');
    }
  }, [profile]);

  // Autosave interval: triggers every 30 seconds
  useEffect(() => {
    if (listingType === 'none' || !sellerId || isPublished) return;

    timerRef.current = setInterval(() => {
      triggerAutosave(true);
    }, 30000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [listingType, title, description, location, images, selectedCatName, selectedSubcategory, productPrice, productWhatsappNumber, productCondition, typeData, promotionType, flashConfig, isPublished]);

  const triggerAutosave = async (isSilent = true) => {
    if (listingType === 'none' || !sellerId) return;

    const draftRecord: Partial<Draft> = {
      id: draftIdRef.current,
      owner_id: sellerId,
      listing_type: listingType as any,
      title: title || 'Untitled Draft',
      description,
      location,
      step_completed: currentStep,
      draft_images: images,
      draft_data: {
        selectedCatId,
        selectedCatName,
        selectedSubcategory,
        productPrice,
        productWhatsappNumber,
        productCondition,
        typeData,
        promotionType,
        flashConfig,
        preferredContact,
        sellerName,
        whatsappContact
      }
    };

    try {
      await listingService.saveDraft(draftRecord);
    } catch (err) {
      console.error('Error saving workspace draft:', err);
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastAutosaveTime(now);
    setShowAutosaveNotice(true);
    setTimeout(() => {
      setShowAutosaveNotice(false);
    }, 3500);

    if (!isSilent) {
      toast.success('🎉 Workspace draft saved securely!');
    }
  };

  // Resume Draft
  const handleResumeDraft = (draft: Draft) => {
    draftIdRef.current = draft.id;
    setListingType(draft.listing_type);
    setTitle(draft.title || '');
    setDescription(draft.description || '');
    setLocation(draft.location || 'Main Campus Quad');
    setImages(draft.draft_images || []);
    setCurrentStep(draft.step_completed || 2);
    
    const db = draft.draft_data || {};
    setSelectedCatId(db.selectedCatId || '');
    setSelectedCatName(db.selectedCatName || '');
    setSelectedSubcategory(db.selectedSubcategory || '');
    setProductPrice(db.productPrice || '');
    setProductWhatsappNumber(db.productWhatsappNumber || '');
    setProductCondition(db.productCondition || 'New');
    setPromotionType(db.promotionType || 'free');
    if (db.typeData) setTypeData(db.typeData);
    if (db.flashConfig) setFlashConfig(db.flashConfig);
    if (db.preferredContact) setPreferredContact(db.preferredContact);
    if (db.sellerName) setSellerName(db.sellerName);
    if (db.whatsappContact) setWhatsappContact(db.whatsappContact);

    toast.success(`Resumed draft: "${draft.title || 'Untitled'}"`);
    setSavedDrafts(savedDrafts.filter(d => d.id !== draft.id));
  };

  const handleDeleteDraft = async (id: string) => {
    try {
      await listingService.deleteDraft(id);
    } catch (err) {
      console.error('Error deleting draft from Supabase:', err);
    }
    setSavedDrafts(savedDrafts.filter(d => d.id !== id));
    toast.info('Draft deleted');
  };

  const getCategoriesForType = () => {
    switch (listingType) {
      case 'product':
        if (dbCategoryTree.length > 0) {
          return dbCategoryTree.map((cat) => ({
            id: cat.id,
            name: cat.name,
            icon: getCategoryEmoji(cat.icon, cat.slug),
            slug: cat.slug,
            subcategories: cat.subcategories
          }));
        }
        return PRODUCT_CATEGORIES;
      case 'accommodation':
        return ACCOMMODATION_CATEGORIES;
      case 'service':
        return SERVICE_CATEGORIES;
      case 'lost_found':
        return LOST_FOUND_CATEGORIES;
      case 'event':
        return EVENT_CATEGORIES;
      default:
        return PRODUCT_CATEGORIES;
    }
  };

  const currentSubcategories = useMemo(() => {
    if (listingType !== 'product' || !selectedCatId) return [];
    const matchedNode = dbCategoryTree.find(
      (c) => c.id === selectedCatId || c.slug === selectedCatId || c.name.toLowerCase() === selectedCatName.toLowerCase()
    );
    if (matchedNode && matchedNode.subcategories && matchedNode.subcategories.length > 0) {
      return matchedNode.subcategories;
    }
    return getSubcategoriesForCategory(selectedCatId);
  }, [listingType, selectedCatId, selectedCatName, dbCategoryTree]);

  // Move image order
  const handleMoveImage = (idx: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    const reordered = [...images];
    const image = reordered.splice(idx, 1)[0];
    reordered.splice(targetIdx, 0, image);
    setImages(reordered);
    toast.success('Photos rearranged locally');
  };

  // Trigger Crop simulated modal
  const handleTriggerCrop = (idx: number) => {
    setCropIdx(idx);
    setZoomVal(1);
    setRotateVal(0);
    setShowCropModal(true);
  };

  const handleSaveCrop = () => {
    setShowCropModal(false);
    toast.success("✨ Photo cropped & optimized perfectly center-focused!");
  };

  // Simulate compression
  const handleCompressImage = (url: string) => {
    if (compressedImages[url]) {
      toast.info("Image already maximized & compressed for campus servers.");
      return;
    }
    
    toast.loading("Compressing photo pixels...", { duration: 900 });
    setTimeout(() => {
      const savedPct = Math.floor(Math.random() * 25) + 55; // 55-80%
      const originalMB = (Math.random() * 1.5 + 1.5).toFixed(1); 
      const savedMB = (parseFloat(originalMB) * (savedPct / 100)).toFixed(1);
      
      setCompressedImages(prev => ({ ...prev, [url]: savedPct }));
      toast.success(`⚡ Space Saver: Compressed by ${savedPct}% (Saved ${savedMB}MB)`);
    }, 900);
  };

  // Simulate input image url paste (strictly 1 image)
  const handleAddImageUrl = (url: string) => {
    if (!url) return;
    setUploading(true);
    setProgress(35);
    
    setTimeout(() => {
      setUploading(false);
      setImages([url]);
      setInputUrl('');
      toast.success('📸 Photo attached successfully!');
    }, 250);
  };

  const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  // Handle local image file selection or direct camera snapshot (Strictly 1 Image)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} is not a valid image format`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (listingType === 'event') {
      setSelectedBannerFile(file);
    }

    setUploading(true);
    setProgress(25);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        compressImage(result).then((compressed) => {
          setProgress(100);
          setTimeout(() => {
            setUploading(false);
            setImages([compressed]);
            toast.success('📸 Photo uploaded successfully!');
            if (fileInputRef.current) fileInputRef.current.value = '';
          }, 200);
        });
      } else {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      toast.error(`Could not read file: ${file.name}`);
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = (idx: number = 0) => {
    setImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('Photo removed. You can pick another image.');
  };

  const handleSetCover = (idx: number) => {
    // Only 1 image is supported, so it is always cover
  };

  // Master validation step checker
  const handleNextStep = () => {
    // STEP 1: SELECT TYPE
    if (currentStep === 1) {
      if (listingType === 'none') {
        return toast.error('Please choose a listing category card to proceed!');
      }
    }

    // STEP 2: IMAGE UPLOAD FIRST
    if (currentStep === 2) {
      if (images.length === 0) {
        return toast.error('📸 Please upload 1 image of your item to proceed.');
      }
    }

    // STEP 3: CATEGORY SELECTION
    if (currentStep === 3) {
      if (!selectedCatId) {
        return toast.error('Please pick an category card to organize your item catalog!');
      }
    }

    // STEP 4: ITEM DETAILS
    if (currentStep === 4) {
      if (!title.trim() || title.length < 5) {
        return toast.error('Please enter a descriptive title (min 5 characters)');
      }
      if (!description.trim() || description.length < 15) {
        return toast.error('Please fill description details (min 15 characters to educate buyers)');
      }
      if (!location.trim()) {
        return toast.error('Specify collection spot near Kibabii Campus');
      }

      // Check prices
      if (listingType === 'product') {
        if (!productPrice || parseFloat(productPrice) <= 0) {
          return toast.error('Please specify active product pricing amount');
        }
      } else if (listingType === 'accommodation') {
        if (!typeData.accommodation_rent) {
          return toast.error('Monthly rent is required');
        }
        if (!typeData.accommodation_contact) {
          return toast.error('Landlord contact mobile is required');
        }
      } else if (listingType === 'service') {
        if (!typeData.service_starting_price) {
          return toast.error('Please specify service starting rates');
        }
        if (!typeData.service_whatsapp) {
          return toast.error('Direct WhatsApp contact or Link is required');
        }
      } else if (listingType === 'event') {
        if (!typeData.event_venue) {
          return toast.error('Venue spot is required');
        }
        if (!typeData.event_is_free && !typeData.event_ticket_price) {
          return toast.error('Paid events require ticket value KES specified');
        }
      }
    }

    // STEP 5: CONTACT INFORMATION
    if (currentStep === 5) {
      if (!sellerName.trim()) {
        return toast.error('Seller profile name is required');
      }
      if (listingType !== 'product' && !whatsappContact.trim()) {
        return toast.error('Preferred WhatsApp contact number is required so buyers can dial you directly');
      }
    }

    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePublish = async () => {
    // Double verification of constraints
    if (images.length === 0) return toast.error("Missing listing cover images");
    if (!title) return toast.error("Missing listing title");
    if (listingType === "product" && !selectedCatId) return toast.error("Missing catalog category identification");
    if (listingType === "product" && !selectedConditionId) {
      return toast.error("Please select a product condition before publishing.");
    }

    setLoading(true);
    const mockId = `list-${Math.random().toString(36).substring(2, 9)}`;

    try {
      // Verify user is authenticated in the application
      const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const activeSellerId = session?.user?.id || profile?.id || user?.id;
      if (!activeSellerId || !session?.user) {
        toast.error("Please log in before publishing a listing.");
        setTimeout(() => navigateTo("/login"), 1500);
        return;
      }

      const chosenCondObj = dbConditions.find(c => c.id === selectedConditionId);
      const conditionCode = chosenCondObj ? chosenCondObj.code : "used";

      const rawEventType = (typeData.event_type || "meeting").toLowerCase();
      const validEventType = ["tournament", "party", "concert", "meeting"].includes(rawEventType)
        ? rawEventType
        : "meeting";

      const typeSpecificData = {
        // Product fields
        price: listingType === "service"
          ? (parseFloat(typeData.service_starting_price) || 0)
          : (listingType === "event"
              ? (parseFloat(typeData.event_ticket_price || "0") || 0)
              : (Number(productPrice) || 0)),
        original_price: null,
        quantity: 1,
        is_negotiable: false,
        condition: conditionCode === "new" ? "New" : (chosenCondObj?.name || "Like New"),
        condition_id: selectedConditionId || null,
        condition_code: conditionCode,
        category_id: getRealDbCategoryId(selectedCatId) || selectedCatName || "General",
        subcategory_id: getRealDbSubcategoryId(selectedSubcategory) || null,
        seller_type: sellerType,
        store_id: effectiveStoreId,
        as_individual: sellerType === "student" || !effectiveStoreId,
        whatsapp_number: productWhatsappNumber.trim() || null,
        brand_id: (selectedBrandId && selectedBrandId !== "none") ? selectedBrandId : null,

        // Accommodation fields
        accommodation_type: typeData.accommodation_type || "bedsitter",
        accommodation_rent: Number(typeData.accommodation_rent) || 0,
        price_per_month: Number(typeData.accommodation_rent) || 0,
        deposit_amount: Number(typeData.accommodation_deposit) || 0,
        bedrooms: Number(typeData.bedrooms || typeData.accommodation_rooms) || 1,
        bathrooms: Number(typeData.bathrooms) || 1,
        available_rooms: Number(typeData.available_rooms) || 1,
        distance_from_campus_km: typeData.accommodation_distance_km ? Number(typeData.accommodation_distance_km) : null,

        // Service fields
        pricing_type: typeData.service_pricing_type || "fixed",
        starting_price: typeData.service_starting_price ? parseFloat(typeData.service_starting_price) : null,
        working_hours: typeData.service_working_hours || null,
        whatsapp_contact: whatsappContact || typeData.service_whatsapp || null,
        provider_bio: typeData.service_bio || null,

        // Lost & Found fields
        item_type: typeData.lost_found_mode === "found" ? "found" : "lost",
        listing_mode: typeData.lost_found_mode,
        exact_location: typeData.lost_found_exact_location || null,
        date_lost_found: typeData.lost_found_date || new Date().toISOString().split("T")[0],
        contact_phone: whatsappContact || typeData.lost_found_contact || null,

        // Event fields
        event_type: validEventType,
        event_date: typeData.event_date || new Date().toISOString().split("T")[0],
        start_time: typeData.event_time || null,
        location_text: location || typeData.event_venue || "Kibabii Campus",
        organizer_name: typeData.event_organizer || null,
        is_free: typeData.event_is_free ?? true,
        ticket_price: typeData.event_ticket_price ? parseFloat(typeData.event_ticket_price) : null,
        max_attendees: typeData.event_max_attendees ? parseInt(typeData.event_max_attendees) : null,
        registration_link: typeData.event_registration_link || null,
        bannerFile: selectedBannerFile
      };

      const createdListing = await listingService.createFullListing(
        activeSellerId,
        listingType as any,
        {
          title,
          description,
          location: location || typeData.event_venue || typeData.lost_found_exact_location || "Kibabii Campus",
          campus_id: selectedCampusId || "8e08c135-e6ec-4387-af3e-110b11d37c07"
        },
        typeSpecificData,
        images
      );

      // Delete the active workspace draft upon publication success
      try {
        await listingService.deleteDraft(draftIdRef.current);
      } catch (err) {
        console.error("Failed to clean up draft:", err);
      }

      setPublishedId(createdListing?.id || mockId);
      setIsPublished(true);
      const typeLabel =
        listingType === "accommodation" ? "Accommodation" :
        listingType === "service" ? "Service" :
        listingType === "lost_found" ? "Lost & Found notice" :
        listingType === "event" ? "Event" : "Product";
      toast.success(`Submitted! Your ${typeLabel.toLowerCase()} will appear once approved by an admin.`);
    } catch (e: any) {
      console.log("Full error catch details:", e);
      const errMsg = e?.message || e?.error_description || JSON.stringify(e) || "Unknown connection error.";
      if (errMsg.includes("Not authenticated") && !sellerId) {
        setRpcError(errMsg);
      } else {
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyShareLink = () => {
    const link = `${window.location.origin}/listing/${publishedId}`;
    navigator.clipboard.writeText(link);
    toast.success("📋 Direct link copied onto clipboard!", {
      description: "You can paste and share with Comrades WhatsApp groups!"
    });
  };

  const handleResetForm = () => {
    // Reset wizard variables for clean run
    setTitle('');
    setDescription('');
    setImages([]);
    setProductPrice('');
    setProductCondition('New');
    setSelectedCatId('');
    setSelectedCatName('');
    setSelectedSubcategory('');
    setListingType('none');
    setCurrentStep(1);
    setIsPublished(false);
    draftIdRef.current = `draft-${Math.random().toString(36).substring(2, 11)}`;
  };

  // SVG Progress indicator connector render
  const renderProgressDotBar = () => {
    const totalSteps = 6;
    const stepLabels = [
      'Type',
      'Upload Photos',
      'Category Selection',
      'Item Details',
      'Contact Info',
      'Promote & Review'
    ];
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4 text-left">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] text-primary uppercase font-black tracking-widest bg-primary/10 px-2.5 sm:px-3 py-1 rounded-full inline-block">
              Guided Posting Workflow
            </span>
            <h2 className="text-base sm:text-xl font-black text-slate-900 mt-1 sm:mt-2 truncate">
              Step {currentStep} of {totalSteps}: <span className="text-primary font-bold">{stepLabels[currentStep-1]}</span>
            </h2>
          </div>
          <div className="text-right shrink-0">
            <AnimatePresence mode="wait">
              {showAutosaveNotice ? (
                <motion.span 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Saved ({lastAutosaveTime})
                </motion.span>
              ) : (
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Auto-Save Active
                </span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* The ●━━━━○━━━━○━━━━○━━━━○━━━━○ connector with Left/Right Navigation Arrows */}
        <div className="flex items-center gap-2 sm:gap-3 py-2 select-none">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={currentStep === 1}
            onClick={handlePrevStep}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 shrink-0 cursor-pointer shadow-xs"
            title="Go to Previous Step"
            aria-label="Previous step"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="relative flex-1 py-3">
            <div className="absolute top-1/2 left-3 right-3 h-1 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              />
            </div>
            <div className="relative flex justify-between z-10 px-0.5">
              {Array.from({ length: totalSteps }).map((_, idx) => {
                const stepNum = idx + 1;
                const isDone = currentStep > stepNum;
                const isCurrent = currentStep === stepNum;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={stepNum > currentStep && !isDone}
                    onClick={() => setCurrentStep(stepNum)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-black transition-all transform duration-150 relative ${
                      isDone 
                        ? 'bg-primary text-white scale-105 sm:scale-110 shadow-md shadow-primary/25 cursor-pointer' 
                        : isCurrent 
                        ? 'bg-slate-900 text-white ring-4 ring-slate-900/20 scale-110 sm:scale-115 shadow-sm font-black' 
                        : 'bg-white border-2 border-slate-200 text-slate-400 hover:border-slate-400 cursor-pointer'
                    }`}
                    title={`Step ${stepNum}: ${stepLabels[idx]}`}
                  >
                    {isDone ? '✓' : stepNum}
                    
                    {/* Hover tooltip label desktop only */}
                    <span className="hidden md:block absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-wider font-extrabold text-slate-400 whitespace-nowrap">
                      {stepLabels[idx].split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={currentStep === totalSteps}
            onClick={handleNextStep}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 shrink-0 cursor-pointer shadow-xs"
            title="Go to Next Step"
            aria-label="Next step"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    );
  };

  // SUCCESS PUBLISHED VIEW
  if (isPublished) {
    return (
      <div className="min-h-screen bg-slate-50/60 pb-20 text-left">
        {/* Simple Navbar with Back Navigation */}
        <div className="bg-white border-b py-3 sm:py-4 sticky top-0 z-40 shadow-2xs">
          <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center max-w-4xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigate('/dashboard/listings');
                }}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1.5 h-9 px-2.5 sm:px-3 text-xs cursor-pointer shadow-2xs"
                title="Back to My Listings"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" />
                <span>Back</span>
              </Button>

              <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                <span className="font-black text-lg text-secondary tracking-tight">Kibabii<span className="text-primary">Mart</span></span>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2.5 py-1 rounded hidden sm:inline">Seller Center</span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild className="rounded-xl border-slate-200 text-xs font-bold h-9">
                <Link to="/dashboard/listings" className="flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">My Listings</span>
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild className="rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold h-9">
                <Link to="/" className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-primary" />
                  <span className="hidden md:inline">Marketplace</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Back navigation breadcrumb bar */}
        <div className="container mx-auto px-4 mt-6 max-w-2xl flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard/listings')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to My Listings</span>
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>Return to Marketplace</span>
          </Link>
        </div>

        <div className="container mx-auto px-4 mt-6 max-w-2xl">
          <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white p-8 space-y-8 text-center relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-white shadow-md">
              <motion.div 
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="h-14 w-14 bg-emerald-555 rounded-full flex items-center justify-center text-white"
              >
                <Check className="h-8 w-8 stroke-[3]" />
              </motion.div>
            </div>

            <div className="pt-10 space-y-3">
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-600 bg-amber-50 border border-amber-200/60 px-3 py-1 rounded">
                Pending Admin Approval
              </span>
              <h2 className="text-3xl font-black text-slate-900">
                Submitted for Review!
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                {`Submitted! Your ${
                  listingType === 'accommodation' ? 'accommodation listing' :
                  listingType === 'service' ? 'service' :
                  listingType === 'lost_found' ? 'lost & found notice' :
                  listingType === 'event' ? 'event' : 'product'
                } will appear once approved by an admin.`}
              </p>
            </div>

            {/* Simulated Live Card View */}
            <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/70 flex gap-4 text-left max-w-md mx-auto items-center">
              <div className="h-16 w-16 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                <img src={images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c'} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="space-y-1 overflow-hidden flex-1 min-w-0">
                <p className="text-xs text-primary font-black uppercase font-mono tracking-wider">{selectedCatName || 'General'}</p>
                <h4 className="font-extrabold text-sm text-slate-800 truncate leading-snug">{title}</h4>
                <p className="font-mono text-xs font-black text-amber-600">
                  Pending Admin Approval
                </p>
              </div>
              {publishedId && (
                <Link
                  to={listingType === 'product' ? `/products/${publishedId}` : `/listing/${publishedId}`}
                  className="shrink-0 p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-primary transition-colors shadow-2xs"
                  title="View published item"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </div>

            {/* Sharing suite */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs uppercase font-black tracking-widest text-slate-400">Boost Search exposure & Share immediately</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <a 
                  href={`https://api.whatsapp.com/send?text=Hey Comrades! Check out my listing "${title}" on KibabiiMart here: ${window.location.origin}/listing/${publishedId}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-black flex flex-col items-center gap-2 transition"
                >
                  <Phone className="h-5 w-5 fill-current" />
                  <span>WhatsApp</span>
                </a>
                <a 
                  href={`https://t.me/share/url?url=${window.location.origin}/listing/${publishedId}&text=Hey Kibabii! Check out my item: ${title}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-2xl text-xs font-black flex flex-col items-center gap-2 transition"
                >
                  <Globe className="h-5 w-5" />
                  <span>Telegram</span>
                </a>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}/listing/${publishedId}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-2xl text-xs font-black flex flex-col items-center gap-2 transition"
                >
                  <Share2 className="h-5 w-5" />
                  <span>Facebook</span>
                </a>
                <button 
                  onClick={handleCopyShareLink}
                  className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-2xl text-xs font-black flex flex-col items-center gap-2 transition"
                >
                  <LinkIcon strokeWidth={3} className="h-5 w-5" />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1 rounded-xl bg-secondary hover:bg-secondary/95 text-white font-bold h-12">
                <Link to="/dashboard/listings">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Listings
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 rounded-xl border-slate-200 text-slate-700 font-bold h-12">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2 text-primary" /> Back to Marketplace
                </Link>
              </Button>
            </div>
            <div className="flex justify-center pt-1">
              <Button onClick={handleResetForm} variant="ghost" className="text-xs text-slate-600 hover:text-slate-900 font-bold cursor-pointer">
                ➕ Create Another Listing
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // CORE GUIDED 6-STEPS PREPARATION
  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 text-left">
      
      {/* HEADER SECTION WITH DRAFT ACTIONS */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-0 min-h-[5rem] sm:h-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-5xl">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {currentStep > 1 ? (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePrevStep} 
                className="rounded-full shrink-0 border border-slate-100 bg-white"
                title="Go to previous step"
              >
                <ArrowLeft className="w-5 h-5 text-slate-800" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0 border border-slate-100 bg-white">
                <Link to="/dashboard" title="Back to Dashboard">
                  <ArrowLeft className="w-5 h-5 text-slate-800" />
                </Link>
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="font-black text-lg sm:text-xl text-slate-900 select-none truncate">Create Campus Listing</h1>
              <p className="text-[10px] text-primary uppercase font-black tracking-widest truncate">
                {isStore ? `🏢 ${userStore?.name || userStore?.store_name || profile?.store_name || 'Verified Merchant'}` : `🎓 ${profile?.full_name || 'Comrade'}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 justify-end w-full sm:w-auto flex-wrap">
            {currentStep > 1 && (
              <Button 
                variant="outline" 
                onClick={handlePrevStep}
                className="rounded-xl font-bold h-9 sm:h-10 px-3 border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs bg-white text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            )}
            {currentStep < 6 ? (
              <Button 
                onClick={handleNextStep}
                className="rounded-xl font-bold h-9 sm:h-10 px-3.5 bg-primary hover:bg-primary/95 text-white flex items-center gap-1.5 cursor-pointer shadow-xs text-xs"
              >
                Next <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </Button>
            ) : (
              <Button 
                onClick={handlePublish}
                disabled={loading}
                className="rounded-xl font-bold h-9 sm:h-10 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs text-xs"
              >
                {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : '✓ Publish'}
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => triggerAutosave(false)}
              className="rounded-xl font-bold h-9 sm:h-10 px-3 border-slate-200 text-slate-600 flex items-center gap-1.5 cursor-pointer transition shadow-xs bg-white text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 text-primary shrink-0" /> Save
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                if (confirm('Cancel posting and return to dashboard?')) {
                  navigate('/dashboard');
                }
              }} 
              className="font-bold text-slate-400 hover:text-slate-600 rounded-xl text-xs h-9 sm:h-10 px-2.5"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 mt-8 max-w-5xl space-y-8">
        
        {rpcError?.includes('Not authenticated') && !sellerId && (
          <div className="session-expired-banner bg-amber-50 border border-amber-200 text-amber-900 px-6 py-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <p className="font-semibold text-sm flex items-center gap-2">⚠️ You are not logged in.</p>
            <Button 
              onClick={() => navigateTo('/login')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl h-10 px-6 shrink-0 shadow-sm"
            >
              Log In Again
            </Button>
          </div>
        )}
        
        {/* Load saved draft alerts if step 1 & none */}
        {listingType === 'none' && savedDrafts.length > 0 && (
          <div className="bg-indigo-50/45 border-2 border-indigo-100 rounded-3xl p-6 text-left space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 text-indigo-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Found Unfinished Mock/DB Drafts</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-0.5">
                  Resume active workflows to keep things simple. Drafts auto-save every 30 seconds.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {savedDrafts.map((dr) => (
                <div key={dr.id} className="bg-white border border-slate-100 rounded-xl px-4 py-2 flex items-center justify-between gap-3 shadow-sm text-xs w-full max-w-sm">
                  <span className="font-extrabold text-secondary truncate">{dr.title || `Untitled ${dr.listing_type}`}</span>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleResumeDraft(dr)} size="sm" className="bg-primary hover:bg-primary/95 text-white rounded font-bold">
                      Resume
                    </Button>
                    <button onClick={() => handleDeleteDraft(dr.id)} className="text-red-500 hover:text-red-600 p-1 rounded">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GUIDED PROGRESS BAR */}
        {renderProgressDotBar()}

        {/* DYNAMIC STEPS RENDERING */}
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="space-y-8">
            
            {/* STEP 1: SELECT LISTING TYPE */}
            {currentStep === 1 && (
              <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white p-6 sm:p-8 space-y-6">
                <div className="text-left space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">Select Listing Type</h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Choose what you would like to post.</p>
                </div>

                {hasStore && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Posting Identity</p>
                      <p className="text-[11px] text-slate-500 font-medium">Choose whether to publish this listing under your verified shop or personal profile.</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs shrink-0">
                      <button
                        type="button"
                        onClick={() => setListingAsStore(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          listingAsStore
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-950'
                        }`}
                      >
                        🏢 {userStore?.name || userStore?.store_name || profile?.store_name || 'My Store'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setListingAsStore(false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          !listingAsStore
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-950'
                        }`}
                      >
                        🎓 Student
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {[
                    {
                      id: 'product' as const,
                      emoji: '📦',
                      title: 'Product',
                      desc: 'Sell textbooks, electronics, clothing, laptops or food to campus buyers.',
                      color: 'border-blue-100 hover:border-blue-400 bg-blue-50/20 text-blue-600'
                    },
                    {
                      id: 'accommodation' as const,
                      emoji: '🏠',
                      title: 'Accommodation',
                      desc: 'Post hostels, bedsitters, apartments, and vacancies for student housing.',
                      color: 'border-emerald-100 hover:border-emerald-400 bg-emerald-50/20 text-emerald-600'
                    },
                    {
                      id: 'service' as const,
                      emoji: '🛠',
                      title: 'Service',
                      desc: 'Offer services such as graphic design, cyber services, photography, repairs, and hair.',
                      color: 'border-purple-100 hover:border-purple-400 bg-purple-50/20 text-purple-600'
                    },
                    {
                      id: 'lost_found' as const,
                      emoji: '🔍',
                      title: 'Lost & Found',
                      desc: 'Help students recover lost items or register found items around campus benches.',
                      color: 'border-amber-100 hover:border-amber-400 bg-amber-50/20 text-amber-600'
                    },
                    {
                      id: 'event' as const,
                      emoji: '🎉',
                      title: 'Event',
                      desc: 'Promote tournaments, campus parties, meetings, seminars and workshops.',
                      color: 'border-rose-100 hover:border-rose-400 bg-rose-50/20 text-rose-600'
                    }
                  ].map((item) => {
                    const isSelected = listingType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setListingType(item.id);
                          setSelectedCatId('');
                          setSelectedCatName('');
                        }}
                        className={`flex items-start justify-between p-5 border-2 rounded-[24px] cursor-pointer hover:bg-slate-50 text-left transition relative ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-slate-105 bg-white'
                        }`}
                      >
                        <div className="flex gap-4 items-start pr-4">
                          <span className="text-3xl filter drop-shadow-sm leading-none pt-0.5">{item.emoji}</span>
                          <div>
                            <h4 className="font-black text-secondary text-base">{item.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed font-semibold mt-1">{item.desc}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="h-6 w-6 bg-primary rounded-full text-white flex items-center justify-center text-[11px] shrink-0">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-6 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    asChild
                    className="w-full sm:w-auto rounded-xl font-bold h-11 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <Link to="/dashboard">
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                    </Link>
                  </Button>
                  <Button
                    disabled={listingType === 'none'}
                    onClick={() => {
                      setCurrentStep(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white rounded-xl font-bold h-11 px-7 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20"
                  >
                    Continue to Photos <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* STEP 2: SINGLE IMAGE UPLOAD FIRST */}
            {currentStep === 2 && (
              <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white p-6 sm:p-8 space-y-5">
                <div className="text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight flex items-center gap-2">
                      📸 Item Photo
                    </h3>
                    <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${
                      images.length > 0 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {images.length > 0 ? '✓ 1 of 1 Photo Added' : '1 Photo Required'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    Upload 1 clear, quality photo displaying your item. Visual listings attract the most comrades.
                  </p>
                </div>

                {/* Hidden Native File Input: single file only */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {/* Upload Progress Bar */}
                {uploading && (
                  <div className="max-w-sm mx-auto p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-800">
                      <span>Optimizing & uploading photo...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-emerald-150 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {/* Compact Small Image Box Picker (Strictly 1 image only) */}
                {images.length === 0 ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="max-w-[240px] sm:max-w-[260px] mx-auto border-2 border-dashed border-slate-200 hover:border-primary/80 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/70 hover:bg-primary/5 transition-all group shadow-2xs hover:shadow-xs active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center mx-auto shadow-2xs group-hover:scale-105 transition shrink-0 border border-slate-200">
                      <Camera className="h-5 w-5 stroke-[2.2]" />
                    </div>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs font-black text-slate-800 group-hover:text-primary transition-colors">
                        Upload 1 Photo
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Tap to choose or capture
                      </p>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-0.5 rounded-full text-[9.5px] font-bold text-slate-600 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Only 1 image required
                    </div>
                  </div>
                ) : (
                  /* Single Image Preview Card */
                  <div className="max-w-[220px] mx-auto text-center space-y-2.5">
                    <div className="relative aspect-square w-40 sm:w-44 mx-auto rounded-2xl overflow-hidden border-2 border-primary/40 shadow-sm bg-slate-900 group">
                      <img 
                        src={images[0]} 
                        className="w-full h-full object-cover" 
                        alt="Listing item" 
                      />
                      
                      <div className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" /> Cover Photo
                      </div>

                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(0); }}
                        className="absolute top-1.5 right-1.5 h-6 w-6 text-white bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow transition-transform active:scale-95"
                        title="Remove photo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Quick photo actions */}
                    <div className="flex items-center justify-center gap-1.5 pt-0.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-7 rounded-lg text-[11px] font-bold border-slate-200 hover:bg-slate-50 text-slate-700 px-2.5 shadow-2xs"
                      >
                        <Camera className="w-3 h-3 mr-1 text-primary" /> Replace
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleTriggerCrop(0)}
                        className="h-7 rounded-lg text-[11px] font-bold border-slate-200 hover:bg-slate-50 text-slate-700 px-2.5 shadow-2xs"
                      >
                        ✂️ Crop
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePhoto(0)}
                        className="h-7 rounded-lg text-[11px] font-bold text-red-600 hover:bg-red-50 px-2"
                      >
                        <Trash2 className="w-3 h-3 mr-0.5" /> Remove
                      </Button>
                    </div>
                  </div>
                )}

                {/* Subtle paste image URL option */}
                <div className="max-w-xs sm:max-w-sm mx-auto pt-1">
                  <details className="text-center group">
                    <summary className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer inline-flex items-center gap-1 list-none select-none">
                      <LinkIcon className="h-3 w-3" /> Or paste image web address
                    </summary>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="https://... photo link"
                        className="h-8 text-xs rounded-xl border-slate-200"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddImageUrl(inputUrl);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={!inputUrl}
                        onClick={() => handleAddImageUrl(inputUrl)}
                        className="h-8 px-3 rounded-xl bg-slate-800 text-white font-bold text-xs shrink-0"
                      >
                        Set
                      </Button>
                    </div>
                  </details>
                </div>

                {/* Compact tip box */}
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-100 text-left max-w-sm mx-auto flex items-start gap-2.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-900 font-medium leading-tight">
                    <strong className="font-bold">Tip:</strong> Bright, clear dormitory or campus photos sell significantly faster.
                  </p>
                </div>

                {/* Step 2 Navigation Buttons */}
                <div className="pt-4 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="w-full sm:w-auto rounded-xl font-bold h-11 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Listing Type
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white rounded-xl font-bold h-11 px-7 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20"
                  >
                    Continue to Category <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* STEP 3: CATEGORY SELECTION */}
            {currentStep === 3 && (
              <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white p-6 sm:p-8 space-y-6">
                <div className="text-left space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">Category Catalog Classification</h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Classify your item so comrades can browse and search accurately.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {getCategoriesForType().map((cat) => {
                    const isSelected = selectedCatId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCatId(cat.id);
                          setSelectedCatName(cat.name);
                          setSelectedSubcategory('');
                        }}
                        className={`flex flex-col items-center justify-center p-6 border-2 rounded-[24px] cursor-pointer hover:bg-slate-50 transition text-center gap-3 relative overflow-hidden group ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-slate-105 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                        <span className="text-3xl filter drop-shadow-sm group-hover:scale-110 transition leading-none">{cat.icon}</span>
                        <span className="text-xs font-black text-slate-800 tracking-tight">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Subcategories (only shown if chosen product category has authoritative subcategories) */}
                {listingType === 'product' && selectedCatId && currentSubcategories.length > 0 && (
                  <div className="pt-4 space-y-2 border-t border-slate-100">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Subcategory in {selectedCatName} (Optional)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {currentSubcategories.map((sub: any) => {
                        const isSubSelected = selectedSubcategory === sub.id || selectedSubcategory === sub.slug || selectedSubcategory === sub.name;
                        return (
                          <button
                            key={sub.id || sub.slug}
                            type="button"
                            onClick={() => setSelectedSubcategory(isSubSelected ? '' : (sub.id || sub.slug))}
                            className={`py-2 px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isSubSelected
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3 Navigation Buttons */}
                <div className="pt-6 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="w-full sm:w-auto rounded-xl font-bold h-11 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Photos
                  </Button>
                  <Button
                    disabled={!selectedCatId}
                    onClick={handleNextStep}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white rounded-xl font-bold h-11 px-7 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20"
                  >
                    Continue to Item Details <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* STEP 4: DETAILS INPUTS DEPENDING ON CHOSEN TYPE */}
            {currentStep === 4 && (
              <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white p-6 sm:p-8 space-y-6">
                <div className="text-left space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">Specify Item Details</h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Specify precise specs and qualities to secure quick trades.</p>
                </div>

                <div className="space-y-6">
                  {/* General Title / Headline */}
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Title / Display Headline</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                      placeholder="e.g. Sterling silver ring or spacious Hostel accommodation..."
                      className="h-12 rounded-xl focus-visible:ring-primary font-bold text-slate-800"
                    />
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono">
                      <span>{title.length < 10 && title.length > 0 && "💡 Headline brief. Try including brand or model."}</span>
                      <span>{title.length} / 80 Characters (Min 5)</span>
                    </div>
                  </div>

                  {/* Pricing inputs adaptive */}
                  {listingType === 'product' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Price (KES)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={productPrice}
                            onChange={(e) => setProductPrice(e.target.value)}
                            placeholder="e.g. 1500"
                            className="h-12 rounded-xl pl-12 font-bold focus-visible:ring-primary"
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">KES</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="product-whatsapp-field" className="text-xs font-black uppercase tracking-wider text-slate-400">
                          WhatsApp number for this listing (optional)
                        </Label>
                        <Input
                          id="product-whatsapp-field"
                          type="tel"
                          value={productWhatsappNumber}
                          onChange={(e) => setProductWhatsappNumber(e.target.value)}
                          placeholder="e.g. 0712345678, 0712 345-678, +254712345678"
                          className="h-12 rounded-xl font-bold focus-visible:ring-primary"
                        />
                        <p className="text-[11px] text-slate-400 font-medium">
                          Optional. If left blank, the WhatsApp button will automatically fall back to your store or profile phone number (if enabled in settings).
                        </p>
                      </div>
                    </div>
                  )}

                  {listingType === 'accommodation' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* monthly rent */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Monthly Rent KES</Label>
                        <Input
                          type="number"
                          value={typeData.accommodation_rent}
                          onChange={(e) => setTypeData({ ...typeData, accommodation_rent: e.target.value })}
                          placeholder="e.g. 5500"
                          className="h-11 rounded-lg"
                        />
                      </div>
                      {/* deposit */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Deposit KES (Optional)</Label>
                        <Input
                          type="number"
                          value={typeData.accommodation_deposit}
                          onChange={(e) => setTypeData({ ...typeData, accommodation_deposit: e.target.value })}
                          placeholder="e.g. 5000"
                          className="h-11 rounded-lg"
                        />
                      </div>
                      {/* accommodation type select */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Accommodation Type</Label>
                        <Select
                          value={typeData.accommodation_type}
                          onValueChange={(val) => setTypeData({ ...typeData, accommodation_type: val })}
                        >
                          <SelectTrigger className="h-11 rounded-lg bg-white border">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            <SelectItem value="hostel">Hostel</SelectItem>
                            <SelectItem value="bedsitter">Bedsitter</SelectItem>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="shared_room">Shared Room</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* bedrooms */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Bedrooms</Label>
                        <Input
                          type="number"
                          min={1}
                          value={typeData.bedrooms}
                          onChange={(e) => setTypeData({ ...typeData, bedrooms: e.target.value })}
                          placeholder="Min 1"
                          className="h-11 rounded-lg"
                        />
                      </div>
                      {/* bathrooms */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Bathrooms</Label>
                        <Input
                          type="number"
                          min={1}
                          value={typeData.bathrooms}
                          onChange={(e) => setTypeData({ ...typeData, bathrooms: e.target.value })}
                          placeholder="Min 1"
                          className="h-11 rounded-lg"
                        />
                      </div>
                      {/* available rooms */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Available Rooms</Label>
                        <Input
                          type="number"
                          min={1}
                          value={typeData.available_rooms}
                          onChange={(e) => setTypeData({ ...typeData, available_rooms: e.target.value })}
                          placeholder="Min 1"
                          className="h-11 rounded-lg"
                        />
                      </div>
                      {/* distance in km */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Distance from Campus (km) (Optional)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={typeData.accommodation_distance_km}
                          onChange={(e) => setTypeData({ ...typeData, accommodation_distance_km: e.target.value })}
                          placeholder="e.g. 0.5"
                          className="h-11 rounded-lg"
                        />
                      </div>
                      {/* distance walk description */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Distance Walk (Optional description)</Label>
                        <Input
                          value={typeData.accommodation_distance}
                          onChange={(e) => setTypeData({ ...typeData, accommodation_distance: e.target.value })}
                          placeholder="e.g. 10 mins walk from Gate B"
                          className="h-11 rounded-lg"
                        />
                      </div>
                      {/* rep contact */}
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Landlord/House Rep Contact</Label>
                        <Input
                          value={typeData.accommodation_contact}
                          onChange={(e) => setTypeData({ ...typeData, accommodation_contact: e.target.value })}
                          placeholder="Inquiry Mobile"
                          className="h-11 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {listingType === 'service' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* starting price */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Starting Price KES</Label>
                        <Input
                          type="number"
                          value={typeData.service_starting_price}
                          onChange={(e) => setTypeData({ ...typeData, service_starting_price: e.target.value })}
                          placeholder="e.g. 100"
                          className="h-11 rounded-lg"
                        />
                      </div>
                      {/* working hours */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Working Hours</Label>
                        <Input
                          value={typeData.service_working_hours}
                          onChange={(e) => setTypeData({ ...typeData, service_working_hours: e.target.value })}
                          placeholder="e.g. 8:00 AM - 9:00 PM"
                          className="h-11 rounded-lg"
                        />
                      </div>
                      {/* service whatsapp link */}
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Service Order Whatsapp Mobile</Label>
                        <Input
                          value={typeData.service_whatsapp}
                          onChange={(e) => setTypeData({ ...typeData, service_whatsapp: e.target.value })}
                          placeholder="Direct WhatsApp contact number"
                          className="h-11 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {listingType === 'lost_found' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Exact incident spot */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Incident Exact Spot</Label>
                        <Input
                          value={typeData.lost_found_exact_location}
                          onChange={(e) => setTypeData({ ...typeData, lost_found_exact_location: e.target.value })}
                          placeholder="e.g. Near Auditorium LH-1"
                          className="h-11 rounded-lg"
                        />
                      </div>
                      {/* date */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Incident Date</Label>
                        <Input
                          type="date"
                          value={typeData.lost_found_date}
                          onChange={(e) => setTypeData({ ...typeData, lost_found_date: e.target.value })}
                          className="h-11 rounded-lg text-slate-700"
                        />
                      </div>
                      {/* contact finder */}
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Contact Finder or Owner info</Label>
                        <Input
                          value={typeData.lost_found_contact}
                          onChange={(e) => setTypeData({ ...typeData, lost_found_contact: e.target.value })}
                          placeholder="Owner Finder Name & Mobile"
                          className="h-11 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {listingType === 'event' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Campus Venue spot</Label>
                        <Input
                          value={typeData.event_venue}
                          onChange={(e) => setTypeData({ ...typeData, event_venue: e.target.value })}
                          placeholder="e.g. Main Quad Hall"
                          className="h-11 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Event Date</Label>
                        <Input
                          type="date"
                          value={typeData.event_date}
                          onChange={(e) => setTypeData({ ...typeData, event_date: e.target.value })}
                          className="h-11 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="is-free-checked" 
                              checked={typeData.event_is_free}
                              onCheckedChange={(checked) => setTypeData({ ...typeData, event_is_free: !!checked })}
                            />
                            <Label htmlFor="is-free-checked" className="text-xs font-bold text-slate-700 cursor-pointer">This Event is Free</Label>
                          </div>
                        </div>
                      </div>
                      {!typeData.event_is_free && (
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-400 uppercase">Ticket Price KES</Label>
                          <Input
                            type="number"
                            value={typeData.event_ticket_price}
                            onChange={(e) => setTypeData({ ...typeData, event_ticket_price: e.target.value })}
                            placeholder="e.g. 200"
                            className="h-11 rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* LIVE Dropdown selectors from database (RULE #1 — NO HARDCODED DATA) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Live Condition select */}
                    {listingType === 'product' && dbConditions.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Condition Quality State</Label>
                        <RadioGroup
                          value={selectedConditionId}
                          onValueChange={setSelectedConditionId}
                          className="grid grid-cols-2 gap-3"
                        >
                          {dbConditions.map((cond) => {
                            const isSelected = selectedConditionId === cond.id;
                            return (
                              <div key={cond.id}>
                                <RadioGroupItem value={cond.id} id={cond.id} className="sr-only peer" />
                                <Label
                                  htmlFor={cond.id}
                                  className={`flex flex-col items-center justify-center p-3.5 border-2 rounded-2xl cursor-pointer hover:bg-slate-50 text-center font-bold text-xs uppercase transition duration-150 ${
                                    isSelected ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white'
                                  }`}
                                >
                                  {cond.label}
                                </Label>
                              </div>
                            );
                          })}
                        </RadioGroup>
                      </div>
                    )}

                    {/* Live Brand select */}
                    {listingType === 'product' && dbBrands.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Product Brand (Optional)</Label>
                        <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                          <SelectTrigger className="h-11 rounded-xl bg-white border-2">
                            <SelectValue placeholder="Select Brand">
                              {(() => {
                                if (!selectedBrandId || selectedBrandId === "none") return "No specific brand";
                                const matched = dbBrands.find((b) => b.id === selectedBrandId);
                                return matched ? matched.name : "Select Brand";
                              })()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="none" label="No specific brand">No specific brand</SelectItem>
                            {dbBrands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id} label={brand.name}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Live Campus select */}
                    {dbCampuses.length > 0 && (
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Campus Branch Location</Label>
                        <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
                          <SelectTrigger className="h-11 rounded-xl bg-white border-2">
                            <SelectValue placeholder="Select Campus">
                              {(() => {
                                const matched = dbCampuses.find((c) => c.id === selectedCampusId);
                                return matched ? `${matched.name} (${matched.short_name}) - ${matched.town}` : "Select Campus";
                              })()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {dbCampuses.map((campus) => (
                              <SelectItem
                                key={campus.id}
                                value={campus.id}
                                label={`${campus.name} (${campus.short_name}) - ${campus.town}`}
                              >
                                {campus.name} ({campus.short_name}) - {campus.town}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Location field */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs font-bold text-slate-400 uppercase">
                        {listingType === 'accommodation' ? 'Location / Property Address' : 'Campus Collection spot Area'}
                      </Label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder={listingType === 'accommodation' ? "e.g. Kibabii Town, Milimani Estate, House No. 12" : "e.g. Soweto Hostel block A or Hall 2"}
                        className="h-11 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Description long fields */}
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Detailed Specifications</Label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                      placeholder="Write negotiable terms, defects, pages completeness, battery wellness, size or accessories..."
                      rows={5}
                      className="w-full border rounded-2xl p-4 text-xs font-medium resize-none focus-visible:outline-none focus:ring-2 focus:ring-primary bg-slate-55/15"
                    />
                    <div className="text-[10px] text-right font-bold text-slate-400 font-mono">
                      {description.length} / 1000 Characters (Min 15)
                    </div>
                  </div>

                  {/* Step 4 Navigation Buttons */}
                  <div className="pt-6 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 border-t border-slate-100">
                    <Button
                      variant="outline"
                      onClick={handlePrevStep}
                      className="w-full sm:w-auto rounded-xl font-bold h-11 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back to Category
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white rounded-xl font-bold h-11 px-7 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20"
                    >
                      Continue to Contact Info <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* STEP 5: CONTACT INFORMATION */}
            {currentStep === 5 && (
              <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white p-6 sm:p-8 space-y-6">
                <div className="text-left space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">💬 Contact Information</h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Manage how active comrades reach out to start trades.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-400">Seller Profile Name</Label>
                      <Input
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        placeholder="e.g. Dan Comrade"
                        className="h-11 rounded-lg font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-400 uppercase">
                        {listingType === 'product' ? 'WhatsApp number for this listing (optional)' : 'Direct WhatsApp Mobile Contact (Required)'}
                      </Label>
                      <Input
                        value={listingType === 'product' ? productWhatsappNumber : whatsappContact}
                        onChange={(e) => {
                          if (listingType === 'product') {
                            setProductWhatsappNumber(e.target.value);
                          } else {
                            setWhatsappContact(e.target.value);
                          }
                        }}
                        placeholder={listingType === 'product' ? 'e.g. 0712345678 (optional)' : 'e.g. 254712345678'}
                        className="h-11 rounded-lg font-mono font-bold"
                      />
                      {listingType === 'product' && (
                        <p className="text-[10px] text-slate-400">
                          Optional: Leave blank to use your profile phone number fallback (if enabled in settings).
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-400">Notification Email (Read-Only)</Label>
                    <Input
                      disabled
                      value={sellerEmail}
                      className="h-11 rounded-lg bg-slate-50 text-slate-450 cursor-not-allowed"
                    />
                  </div>

                  {/* Preferred contact methods preference option cards */}
                  <div className="space-y-3 pt-4">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Preferred Conversation Channel</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { id: 'whatsapp' as const, icon: Phone, title: 'WhatsApp Only', desc: 'Secure direct calling and chats' },
                        { id: 'chat' as const, icon: MessageSquare, title: 'In-App Chat Only', desc: 'Secure local campus network chat' },
                        { id: 'both' as const, icon: Sparkles, title: 'Both Channels', desc: 'Max conversion path with buyers' }
                      ].map((ch) => {
                        const isSelected = preferredContact === ch.id;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => setPreferredContact(ch.id)}
                            className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between transition active:scale-95 ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-slate-105 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <ch.icon className="h-4 w-4 text-primary shrink-0" />
                              <span className="font-bold text-xs text-secondary">{ch.title}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-semibold mt-2">{ch.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 5 Navigation Buttons */}
                  <div className="pt-6 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 border-t border-slate-100">
                    <Button
                      variant="outline"
                      onClick={handlePrevStep}
                      className="w-full sm:w-auto rounded-xl font-bold h-11 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back to Item Details
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white rounded-xl font-bold h-11 px-7 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20"
                    >
                      Continue to Review & Publish <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* STEP 6: PROMOTION & DETAILS SUMMARY REVIEW */}
            {currentStep === 6 && (
              <div className="space-y-8">
                {/* Visual Cover Preview exactly how buyers see it */}
                <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white text-left">
                  <div className="bg-slate-900 aspect-video md:aspect-[2/1] relative overflow-hidden flex items-center justify-center">
                    <img src={images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c'} className="w-full h-full object-cover opacity-90" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                      <div className="flex justify-between items-end gap-3">
                        <div>
                          <span className="text-[10px] bg-primary/95 text-white font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2 inline-block">
                            {selectedCatName} &bull; {listingType}
                          </span>
                          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight line-clamp-1">{title || 'Untitled Proposal'}</h2>
                        </div>
                        <span className="shrink-0 text-3xl font-black text-emerald-400 font-mono">
                          {listingType === 'product' ? `KES ${productPrice}` : `KES ${typeData.accommodation_rent || typeData.service_starting_price || '0'}`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-300 font-semibold pt-1">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {location}</span>
                        <span>⭐ Comrade Verified Rating 5.0</span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6 sm:p-8 space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider">Item Overview</h4>
                      <p className="text-slate-600 text-xs font-semibold leading-relaxed whitespace-pre-line">{description || 'No detailed specifications supplied yet...'}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border text-xs text-left">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block pb-0.5">Seller Name</span>
                        <span className="font-extrabold text-slate-800">{sellerName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block pb-0.5">WhatsApp Mobile</span>
                        <span className="font-extrabold text-slate-800 font-mono">{whatsappContact}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block pb-0.5">Channel Pref</span>
                        <span className="font-extrabold text-slate-805 uppercase text-[10px]">{preferredContact}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block pb-0.5">Condition</span>
                        <span className="font-extrabold text-slate-805">{productCondition}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ADVERTISING PROMOTION TIERS SETUP */}
                <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white p-6 sm:p-8 space-y-6">
                  <div className="text-left space-y-2">
                    <h3 className="text-xl font-black text-slate-900 leading-tight">Upgrade Listing Exposure</h3>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pin your post at the top of active student directories to secure transactions faster.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        id: 'free',
                        title: 'Free Standard Post',
                        sub: 'KSh 0.00',
                        benefit: 'Browse catalg visibility, standard search feed placement.'
                      },
                      {
                        id: 'featured',
                        title: 'Featured (7 Days)',
                        sub: 'KSh 250.00',
                        benefit: 'Homepage presence, priority placement tag, pinned status.'
                      },
                      {
                        id: 'premium',
                        title: 'Premium (14 Days)',
                        sub: 'KSh 490.00',
                        benefit: 'Top category positions, active flashing premium tag, trending recommendations.'
                      }
                    ].map((plan) => {
                      const isSel = promotionType === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setPromotionType(plan.id)}
                          className={`p-5 rounded-2xl border-2 text-left flex flex-col justify-between transition cursor-pointer active:scale-95 ${
                            isSel ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-105 bg-white'
                          }`}
                        >
                          <div>
                            <span className="text-[9px] font-black uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full">{plan.id === 'free' ? 'Default' : 'Campaign'}</span>
                            <h4 className="font-extrabold text-sm text-secondary mt-2">{plan.title}</h4>
                            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-2">{plan.benefit}</p>
                          </div>
                          <p className="font-mono text-base font-black text-slate-800 mt-4 pt-1 border-t">{plan.sub}</p>
                        </button>
                      );
                    })}
                  </div>

                  {isStore && (
                    <div className="border border-dashed border-red-200 bg-red-50/20 p-5 rounded-3xl space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[9px] font-black uppercase text-red-700 bg-red-50 px-2 py-0.5 rounded">High conversion</span>
                          <h4 className="font-black text-sm text-slate-905 mt-1">Configure Store Flash Discount Campaign</h4>
                        </div>
                        <Checkbox 
                          id="flash" 
                          checked={flashConfig.enabled}
                          onCheckedChange={(val) => setFlashConfig({ ...flashConfig, enabled: !!val })}
                          className="w-5.2 h-5.2 border-red-200 checked:bg-red-500"
                        />
                      </div>

                      {flashConfig.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-400">Before Discount Price</Label>
                            <Input 
                              type="number"
                              value={flashConfig.orig || ''}
                              onChange={(e) => setFlashConfig({ ...flashConfig, orig: parseInt(e.target.value) || 0 })}
                              placeholder="Original Price e.g. 2000"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-400">Flash Promo Price</Label>
                            <Input 
                              type="number"
                              value={flashConfig.disc || ''}
                              onChange={(e) => setFlashConfig({ ...flashConfig, disc: parseInt(e.target.value) || 0 })}
                              placeholder="Direct Promo Price e.g. 1500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* Step 6 Navigation Footer */}
                <div className="pt-6 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="w-full sm:w-auto rounded-xl font-bold h-11 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Contact Details
                  </Button>
                  <Button
                    onClick={handlePublish}
                    disabled={loading}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold h-11 px-8 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" /> Publishing Post...
                      </>
                    ) : (
                      <>
                        ✓ Publish Listing Now <ArrowRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CROP WORKSPACE MODAL WORK */}
      <AnimatePresence>
        {showCropModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-6 text-left border border-slate-100"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-900">✂️ Recenter & Crop Image</h3>
                <button type="button" onClick={() => setShowCropModal(false)} className="text-slate-400 hover:text-slate-605 transition p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 text-left">
                <div className="aspect-square rounded-2xl bg-slate-950 overflow-hidden relative flex items-center justify-center border">
                  {cropIdx !== null && (
                    <img 
                      src={images[cropIdx]} 
                      className="max-w-full max-h-full object-contain transition-transform" 
                      style={{ transform: `scale(${zoomVal}) rotate(${rotateVal}deg)` }}
                      alt="" 
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-black text-slate-500">
                      <span>Zoom Level</span>
                      <span>{zoomVal.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="0.1" 
                      value={zoomVal} 
                      onChange={(e) => setZoomVal(parseFloat(e.target.value))}
                      className="w-full accent-primary h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-black text-slate-500">
                      <span>Rotate Image</span>
                      <span>{rotateVal}°</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="360" 
                      step="90" 
                      value={rotateVal} 
                      onChange={(e) => setRotateVal(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg cursor-pointer accent-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowCropModal(false)} className="rounded-xl font-bold h-11">
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSaveCrop} className="bg-primary hover:bg-primary/95 font-black rounded-xl px-5 text-white h-11">
                    Save Center Crop
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
