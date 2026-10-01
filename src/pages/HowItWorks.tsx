import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Tag, 
  ShieldCheck, 
  Search, 
  MessageSquare, 
  MapPin, 
  PlusCircle, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  DollarSign, 
  Flag, 
  ArrowRight,
  HelpCircle,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HowItWorks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Determine active tab from URL query params or default to 'buy'
  const sectionParam = searchParams.get('section') || searchParams.get('tab') || 'buy';
  const validTabs = ['buy', 'sell', 'safety', 'all'];
  const [activeTab, setActiveTab] = useState<string>(
    validTabs.includes(sectionParam.toLowerCase()) ? sectionParam.toLowerCase() : 'buy'
  );

  useEffect(() => {
    const current = searchParams.get('section') || searchParams.get('tab');
    if (current && validTabs.includes(current.toLowerCase())) {
      setActiveTab(current.toLowerCase());
      // Smoothly scroll to the section if 'all' is selected or on deep-link
      const el = document.getElementById(`section-${current.toLowerCase()}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ section: tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startWalkthrough = () => {
    window.dispatchEvent(new CustomEvent('kibumall-start-onboarding'));
  };

  const openSellModal = () => {
    window.dispatchEvent(new CustomEvent('kibumall-open-sell'));
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3 sm:space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>KibuMall User Guide</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How KibuMall Works
        </h1>
        <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
          Your simple, secure campus marketplace at Kibabii University. Learn how to buy, sell, and stay safe.
        </p>

        {/* Quick Tour Button */}
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startWalkthrough}
            className="rounded-full text-xs font-bold gap-2 text-slate-700 hover:text-primary hover:border-primary/50 shadow-xs cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span>Interactive App Tour</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-center">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap items-center justify-center gap-1 sm:gap-2 max-w-md w-full border border-slate-200/80 shadow-xs">
          <button
            type="button"
            onClick={() => handleTabChange('buy')}
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'buy'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>How to Buy</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('sell')}
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'sell'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Tag className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Selling & Policy</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('safety')}
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'safety'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-red-500 shrink-0" />
            <span>Safety Tips</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: HOW TO BUY */}
      {(activeTab === 'buy' || activeTab === 'all') && (
        <section id="section-buy" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">How to Buy</h2>
              <p className="text-xs text-slate-500 font-medium">Quick 3-step guide to finding and purchasing items on campus</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Step 1 */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  1
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-emerald-600" />
                  <span>Search or Browse</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Search or browse by category on the homepage to find electronics, revision books, accommodation, fashion, and services.
                </p>
              </div>
              <div className="text-[11px] text-slate-400 font-semibold bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Filter by price, category, or student sellers</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  2
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Message on WhatsApp</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Message the seller directly on WhatsApp using the contact button on any listing — no in-app checkout required for most items.
                </p>
              </div>
              <div className="text-[11px] text-slate-400 font-semibold bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Direct, instant talk with no waiting</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  3
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Campus Meetup & Pay</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Arrange a meetup on campus to inspect and pay for the item. Verify everything before making payment.
                </p>
              </div>
              <div className="text-[11px] text-slate-400 font-semibold bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Pay in person upon inspection</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>Explore campus listings now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <div className="flex gap-2">
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold px-4 h-9">
                <Link to="/search">Search Products</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: SELLING */}
      {(activeTab === 'sell' || activeTab === 'all') && (
        <section id="section-sell" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Selling on KibuMall</h2>
              <p className="text-xs text-slate-500 font-medium">Turn unused items into cash or promote your student business</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Step 1 */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  1
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span>Tap "Sell"</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Tap "Sell" from the top nav bar anytime to open the listing creator.
                </p>
              </div>
              <div className="text-[11px] text-slate-400 font-semibold bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                <span className="text-indigo-500 font-bold">✓</span>
                <span>Available anywhere across the app</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  2
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Choose Listing Type</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Choose a listing type: Product, Service, Accommodation, Event, or Lost & Found.
                </p>
              </div>
              <div className="text-[11px] text-slate-400 font-semibold bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                <span className="text-indigo-500 font-bold">✓</span>
                <span>Tailored fields for every campus category</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  3
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Fill Details & Publish</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Fill in the details and publish — it goes live after brief review. Buyers reach you directly on WhatsApp.
                </p>
              </div>
              <div className="text-[11px] text-slate-400 font-semibold bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                <span className="text-indigo-500 font-bold">✓</span>
                <span>Live within minutes after review</span>
              </div>
            </div>
          </div>

          {/* Seller Policy Highlights */}
          <div className="bg-indigo-50/50 rounded-2xl p-4 sm:p-5 border border-indigo-100/70 space-y-2">
            <h4 className="text-xs sm:text-sm font-extrabold text-indigo-950 flex items-center gap-1.5">
              <span>📋 Seller Policy Guidelines</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-indigo-900 font-medium">
              <div className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>List genuine items with accurate photos and honest descriptions.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>No prohibited items, counterfeit goods, or academic dishonesty services.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Be responsive and polite on WhatsApp when fellow comrades inquire.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              onClick={openSellModal}
              className="bg-primary hover:bg-primary/95 text-white rounded-full text-xs font-bold px-5 h-9 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              <span>Post a Listing Now</span>
            </Button>
          </div>
        </section>
      )}

      {/* SECTION 3: SAFETY TIPS */}
      {(activeTab === 'safety' || activeTab === 'all') && (
        <section id="section-safety" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Campus Safety Tips</h2>
              <p className="text-xs text-slate-500 font-medium">Essential rules to keep every transaction safe and scam-free</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rule 1 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-red-100/70 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm">Meet in Public Campus Spots</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Meet in public, well-lit campus spots (e.g. near hostels, main gate, library, or cafeteria). Never meet in isolated or unfamiliar off-campus locations.
                </p>
              </div>
            </div>

            {/* Rule 2 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <Eye className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm">Inspect in Person First</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Inspect the item in person before paying. Turn on phones, check laptop specs, inspect book pages, or view hostel rooms before parting with money.
                </p>
              </div>
            </div>

            {/* Rule 3 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100/70 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <DollarSign className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm">Never Pay in Advance</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Never send payment before seeing the item. Avoid upfront "holding deposits" or courier charges from unverified sellers.
                </p>
              </div>
            </div>

            {/* Rule 4 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Flag className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm">Report Suspicious Users</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Report suspicious listings or users. If a deal feels questionable or a seller behaves suspiciously, inform our admin team immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-medium">Notice something suspicious on KibuMall?</span>
            </div>
            <Link
              to="/profile"
              className="text-amber-300 hover:text-white font-bold underline transition-colors"
            >
              Contact Admin Support Desk
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
