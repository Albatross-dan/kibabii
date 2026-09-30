import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  PlusCircle, 
  MessageCircle, 
  User, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export const ONBOARDING_STORAGE_KEY = 'kibumall_onboarding_seen';

interface TourStep {
  id: string;
  stepNumber: number;
  badge: string;
  title: string;
  headline: string;
  subtext: string;
  targetSelectors: string[];
  illustrationType: 'search' | 'sell' | 'whatsapp' | 'account';
  icon: React.ComponentType<{ className?: string }>;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'search',
    stepNumber: 1,
    badge: 'Step 1 of 4',
    title: 'Browse & Discover',
    headline: 'Browse by category or search',
    subtext: 'Find textbooks, electronics, campus housing, services, and student deals across Kibabii University in seconds.',
    targetSelectors: ['#tour-search-bar', '#tour-home-search-bar', '[data-tour="search-bar"]'],
    illustrationType: 'search',
    icon: Search
  },
  {
    id: 'sell',
    stepNumber: 2,
    badge: 'Step 2 of 4',
    title: 'Sell to Comrades',
    headline: 'Tap Sell to post anything — products, services, events, even lost & found.',
    subtext: 'Turn your unused items into quick cash or market your student services to thousands of campus peers.',
    targetSelectors: ['#tour-sell-button', '[data-tour="sell-button"]'],
    illustrationType: 'sell',
    icon: PlusCircle
  },
  {
    id: 'whatsapp',
    stepNumber: 3,
    badge: 'Step 3 of 4',
    title: 'Direct WhatsApp Contact',
    headline: 'Message sellers directly on WhatsApp — no waiting, no middleman.',
    subtext: 'Tap the green WhatsApp button on any listing to negotiate, ask questions, and arrange quick meetups on campus.',
    targetSelectors: ['[data-tour="whatsapp-button"]', '.tour-whatsapp-trigger'],
    illustrationType: 'whatsapp',
    icon: MessageCircle
  },
  {
    id: 'account',
    stepNumber: 4,
    badge: 'Step 4 of 4',
    title: 'Your Student Hub',
    headline: 'Check Account for your listings, orders, and messages.',
    subtext: 'Manage student verification, track listed items, view customer inquiries, and update your profile anytime.',
    targetSelectors: ['#tour-account-button', '#tour-account-bottom-nav', '[data-tour="account-button"]'],
    illustrationType: 'account',
    icon: User
  }
];

export default function OnboardingTour() {
  const { user, isLoading } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Auto-show for logged-in users on their first session
  useEffect(() => {
    if (user && !isLoading) {
      const seen = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!seen) {
        const timer = setTimeout(() => {
          setCurrentStepIndex(0);
          setIsOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isLoading]);

  // Listen for manual walkthrough triggers (e.g. from HowItWorks page or help buttons)
  useEffect(() => {
    const handleManualStart = () => {
      setCurrentStepIndex(0);
      setIsOpen(true);
    };
    window.addEventListener('kibumall-start-onboarding', handleManualStart);
    return () => window.removeEventListener('kibumall-start-onboarding', handleManualStart);
  }, []);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Measure and highlight target element position
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    const findAndMeasureTarget = () => {
      let foundEl: HTMLElement | null = null;
      for (const selector of currentStep.targetSelectors) {
        const el = document.querySelector(selector) as HTMLElement;
        if (el && el.offsetParent !== null) {
          foundEl = el;
          break;
        }
      }

      if (foundEl) {
        // Scroll into view gently if needed
        foundEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        const rect = foundEl.getBoundingClientRect();
        // Check if rect has valid dimensions
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
          return;
        }
      }
      setTargetRect(null);
    };

    findAndMeasureTarget();
    window.addEventListener('resize', findAndMeasureTarget);
    window.addEventListener('scroll', findAndMeasureTarget, true);

    return () => {
      window.removeEventListener('resize', findAndMeasureTarget);
      window.removeEventListener('scroll', findAndMeasureTarget, true);
    };
  }, [isOpen, currentStepIndex, currentStep]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const StepIcon = currentStep.icon;

  // Render visual representation for each step
  const renderStepIllustration = () => {
    switch (currentStep.illustrationType) {
      case 'search':
        return (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
            <div className="h-9 rounded-full bg-white border border-slate-200 flex items-center px-3 gap-2 shadow-xs">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Search on Kibu Mall...</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold text-slate-600 no-scrollbar">
              <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">📱 Phones</span>
              <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">💻 Computing</span>
              <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">📚 Books</span>
              <span className="bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">🏠 Rooms</span>
            </div>
          </div>
        );

      case 'sell':
        return (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Quick Post Categories</span>
              <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">+ Sell</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold text-slate-700">
              <div className="p-2 bg-white rounded-xl border border-slate-200/70 flex items-center gap-1.5">
                <span>📦</span>
                <span>Product</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200/70 flex items-center gap-1.5">
                <span>🔧</span>
                <span>Service</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200/70 flex items-center gap-1.5">
                <span>🏠</span>
                <span>Accommodation</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200/70 flex items-center gap-1.5">
                <span>🔍</span>
                <span>Lost & Found</span>
              </div>
            </div>
          </div>
        );

      case 'whatsapp':
        return (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  💬
                </div>
                <span className="font-extrabold text-emerald-950">WhatsApp Direct Connect</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                No Middleman
              </span>
            </div>
            <div className="bg-white rounded-xl p-2.5 border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Hp Laptop Charger</span>
                <span className="text-[11px] font-black text-emerald-600">KSh 1,200</span>
              </div>
              <button 
                type="button" 
                className="bg-[#25D366] text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                👤
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">Comrade Account</span>
                <span className="text-[10px] text-slate-500 font-medium">Kibabii University</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
              <div className="bg-white p-1.5 rounded-xl border border-slate-200 text-slate-700">
                <span>📋 Listings</span>
              </div>
              <div className="bg-white p-1.5 rounded-xl border border-slate-200 text-slate-700">
                <span>💬 Messages</span>
              </div>
              <div className="bg-white p-1.5 rounded-xl border border-slate-200 text-slate-700">
                <span>🛡️ Verified</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleSkip}
    >
      {/* Target Element Spotlight Cutout (if element is visible on page) */}
      {targetRect && (
        <div 
          className="fixed rounded-2xl pointer-events-none transition-all duration-300 ring-4 ring-primary ring-offset-2 ring-offset-white shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            zIndex: 10000
          }}
        />
      )}

      {/* Main Tour Card Modal */}
      <div 
        ref={tooltipRef}
        onClick={(e) => e.stopPropagation()}
        className="relative z-[10001] w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 text-slate-900 space-y-5 animate-in zoom-in-95 duration-200 my-auto"
      >
        {/* Top Header: Step Counter, Dots & Close Button */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded-full text-[10px] font-black tracking-wider uppercase">
              {currentStep.badge}
            </span>
            <div className="flex items-center gap-1 ml-1">
              {TOUR_STEPS.map((step, idx) => (
                <div
                  key={step.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? 'w-5 bg-primary'
                      : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Skip walkthrough"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Headline & Body Copy */}
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wide">
            <StepIcon className="w-4 h-4 shrink-0" />
            <span>{currentStep.title}</span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
            "{currentStep.headline}"
          </h3>

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {currentStep.subtext}
          </p>
        </div>

        {/* Feature Illustration */}
        <div className="pt-1">
          {renderStepIllustration()}
        </div>

        {/* Action Controls: Skip, Back, Next */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer px-2 py-1"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="h-8 px-3 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                <span>Back</span>
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="h-8 px-4 bg-primary hover:bg-primary/95 text-white font-black rounded-xl text-xs shadow-sm flex items-center gap-1 cursor-pointer transition-all transform active:scale-95"
            >
              <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Got it!' : 'Next'}</span>
              {currentStepIndex < TOUR_STEPS.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
