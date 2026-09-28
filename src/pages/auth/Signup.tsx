import * as React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Store, 
  ArrowLeft, 
  ShoppingBag, 
  PlusCircle, 
  Heart, 
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

// Reusable custom components
import { AccountTypeCard } from '@/components/auth/AccountTypeCard';
import { RegistrationForm } from '@/components/auth/RegistrationForm';
import { WelcomeActionCard } from '@/components/auth/WelcomeActionCard';

type SignupStep = 'welcome' | 'registration' | 'first_login_experience';

export default function Signup() {
  const navigate = useNavigate();
  const { 
    registerStudent, 
    registerStore, 
    profile, 
    user
  } = useAuthStore();
  
  const [step, setStep] = useState<SignupStep>('welcome');
  const [selectedType, setSelectedType] = useState<'student' | 'store'>('student');
  const [isLoading, setIsLoading] = useState(false);

  // 1. Handle Account Type selection
  const handleSelectAccountType = (type: 'student' | 'store') => {
    setSelectedType(type);
    setStep('registration');
  };

  // 2. Handle Registration Submission
  const handleRegistrationSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      if (selectedType === 'student') {
        const payload = {
          full_name: formData.full_name,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          whatsapp_number: formData.whatsapp_number || formData.phone,
          password: formData.password, // REAL TYPED PASSWORD
          campus: formData.campus || 'Kibabii University',
          campus_id: formData.campus_id || '8e08c135-e6ec-4387-af3e-110b11d37c07',
        };
        await registerStudent(payload);
      } else {
        const payload = {
          full_name: formData.full_name,
          store_name: formData.store_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password, // REAL TYPED PASSWORD
          business_category: formData.business_category,
          store_location: formData.store_location,
          store_description: formData.store_description,
          store_banner_image: formData.store_banner_image,
          banner_file: formData.banner_file
        };
        await registerStore(payload);
      }
      
      toast.success(selectedType === 'student' ? 'Account created! Welcome to Kibabii Marketplace.' : 'Business account created! Welcome to Kibabii Marketplace.');
      setStep('first_login_experience');
    } catch (err: any) {
      console.error('Registration error:', err);
      const isAlreadyRegistered = err.message?.toLowerCase().includes('already exists') || err.message?.toLowerCase().includes('already registered');
      if (isAlreadyRegistered) {
        toast.error(err.message, {
          action: {
            label: 'Sign In',
            onClick: () => navigate('/auth/login')
          }
        });
      } else {
        toast.error(err.message || 'Registration failed. Please check your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle First Onboarding Actions
  const handleOnboardingAction = (route: string) => {
    toast.success('Onboarding choice successfully registered!');
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 py-8 select-none">
      {/* Brand logo header */}
      <Link to="/" className="flex items-center justify-center mb-6 group transition-transform active:scale-98" aria-label="KibuMall Marketplace Home">
        <img 
          src="/logo-horizontal.svg" 
          alt="KibuMall Marketplace" 
          className="h-12 w-auto object-contain transition-transform group-hover:scale-102"
          referrerPolicy="no-referrer"
        />
      </Link>

      <div className="w-full max-w-2xl bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden transition-all duration-300">
        
        {/* ================= STEP 1: WELCOME / SELECTION ================= */}
        {step === 'welcome' && (
          <div className="p-8 space-y-8">
            <div className="space-y-2 text-center">
              <span className="text-xs font-extrabold uppercase bg-primary/10 text-primary px-3.5 py-1.5 rounded-full inline-block">
                Onboarding Portal
              </span>
              <h1 className="text-3xl font-black text-secondary leading-tight pt-1">
                KibuMall Marketplace
              </h1>
              <p className="text-sm font-semibold text-muted-foreground max-w-md mx-auto leading-relaxed">
                Buy, Sell and Discover Opportunities Around Campus
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <AccountTypeCard
                id="select-student"
                icon="🎓"
                title="Student Account"
                description="Buy and sell with fellow students."
                buttonText="Continue as Student"
                onClick={() => handleSelectAccountType('student')}
                features={[
                  'List unlimited used study items',
                  'Find campus roommate and hostel deals',
                  'Earn verified student trust badge'
                ]}
              />

              <AccountTypeCard
                id="select-store"
                icon="🏪"
                title="Business Owner Account"
                description="Register your business and reach campus customers."
                buttonText="Continue as Business Owner"
                onClick={() => handleSelectAccountType('store')}
                features={[
                  'Customize complete business banner cover',
                  'Showcase physical cyber or cafe location',
                  'Access premium merchant analytics'
                ]}
              />
            </div>

            <div className="text-center pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500 font-medium">
                Already registered?{' '}
                <Link to="/auth/login" className="text-primary font-black hover:underline inline-flex items-center">
                  Sign In <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* ================= STEP 2: REGISTRATION FORM ================= */}
        {step === 'registration' && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setStep('welcome')} 
                className="rounded-full shrink-0 border h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-black text-secondary">
                  {selectedType === 'student' ? 'Student Registration' : 'Business Owner Registration'}
                </h2>
                <p className="text-xs text-muted-foreground font-semibold">
                  {selectedType === 'student' 
                    ? 'Get both buyer and seller capabilities instantly using peer-to-peer student tags.' 
                    : 'Establish official business listings and storefront accessible by hundreds of scholars.'
                  }
                </p>
              </div>
            </div>

            <RegistrationForm
              type={selectedType}
              onSubmit={handleRegistrationSubmit}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* ================= STEP 3: FIRST LOGIN EXPERIENCE ================= */}
        {step === 'first_login_experience' && (
          <div className="p-8 space-y-6">
            <div className="space-y-2 text-center">
              <span className="text-2xl">👋</span>
              <h2 className="text-2xl font-black text-secondary">
                Welcome to Kibabii Market
              </h2>
              <p className="text-sm text-muted-foreground font-semibold">
                What would you like to do first?
              </p>
            </div>

            {selectedType === 'student' ? (
              /* Student Actions */
              <div className="space-y-3 pt-4">
                <WelcomeActionCard
                  id="choice-browse"
                  title="Browse Marketplace"
                  description="Explore and shop textbooks, tech repairs, styling services, and foods."
                  icon={<ShoppingBag className="h-5 w-5" />}
                  onClick={() => handleOnboardingAction('/')}
                />
                
                <WelcomeActionCard
                  id="choice-sell"
                  title="Sell an Item"
                  description="Post your first listing for fellow comrades across camp classes instantly."
                  icon={<PlusCircle className="h-5 w-5" />}
                  onClick={() => handleOnboardingAction('/dashboard/listings/new')}
                />

                <WelcomeActionCard
                  id="choice-wishlist"
                  title="View Wishlist"
                  description="Keep track of dorm accessories, laptops and essential furniture of interest."
                  icon={<Heart className="h-5 w-5" />}
                  onClick={() => handleOnboardingAction('/wishlist')}
                />
              </div>
            ) : (
              /* Store/Business Actions */
              <div className="space-y-3 pt-4">
                <WelcomeActionCard
                  id="choice-store-setup"
                  title="Complete Store Setup"
                  description="Update business details, upload custom banners, specify gate location, cyber, or eatery tags."
                  icon={<Store className="h-5 w-5" />}
                  onClick={() => handleOnboardingAction('/profile')}
                />

                <WelcomeActionCard
                  id="choice-store-add"
                  title="Add First Product"
                  description="Launch your digital storefront catalog with your student-targeted offerings."
                  icon={<PlusCircle className="h-5 w-5" />}
                  onClick={() => handleOnboardingAction('/dashboard/listings/new')}
                />

                <WelcomeActionCard
                  id="choice-store-browse"
                  title="Browse Marketplace"
                  description="Monitor active student listings and competitors around Bungoma campus."
                  icon={<ShoppingBag className="h-5 w-5" />}
                  onClick={() => handleOnboardingAction('/')}
                />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
