import * as React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Store, 
  ArrowLeft, 
  CheckCircle2, 
  GraduationCap, 
  ShoppingBag, 
  PlusCircle, 
  Heart, 
  Mail, 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  Edit3, 
  ArrowRight,
  Clipboard,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Reusable custom components
import { AccountTypeCard } from '@/components/auth/AccountTypeCard';
import { RegistrationForm } from '@/components/auth/RegistrationForm';
import { WelcomeActionCard } from '@/components/auth/WelcomeActionCard';

type SignupStep = 'welcome' | 'registration' | 'email_verification' | 'first_login_experience';

export default function Signup() {
  const navigate = useNavigate();
  const { 
    registerStudent, 
    registerStore, 
    verifyOtpCode, 
    profile, 
    setProfile, 
    sentOtp, 
    setSentOtp,
    user,
    setUser
  } = useAuthStore();
  
  const [step, setStep] = useState<SignupStep>('welcome');
  const [selectedType, setSelectedType] = useState<'student' | 'store'>('student');
  const [isLoading, setIsLoading] = useState(false);
  
  // Email verification simulator state
  const [otpCode, setOtpCode] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);

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
          password: formData.password, // REAL TYPED PASSWORD
          campus: formData.campus,
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
          store_banner_image: formData.store_banner_image
        };
        await registerStore(payload);
      }
      
      toast.success('Account created! Please check your email to confirm your account.');
      setStep('email_verification');
    } catch (err: any) {
      // STOP HERE! Do NOT advance to success screen or fake profile
      console.error('Registration error:', err);
      toast.error(err.message || 'Registration failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Resend real confirmation email
  const handleResendConfirmationEmail = async () => {
    const targetEmail = profile?.email || user?.email;
    if (!targetEmail) {
      toast.error('No email address found to resend confirmation to.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail
      });

      if (error) {
        throw error;
      }

      toast.success(`Confirmation email resent to ${targetEmail}!`);
    } catch (err: any) {
      console.error('Resend confirmation email error:', err);
      toast.error(err.message || 'Failed to resend confirmation email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if email was already confirmed
  const handleCheckEmailConfirmed = async () => {
    setIsLoading(true);
    try {
      const { data: { user: refreshedUser }, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (refreshedUser?.email_confirmed_at) {
        setVerificationSuccess(true);
        toast.success('Email confirmed successfully!');
      } else {
        toast.info('Email is not yet confirmed. Please click the link in your email.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not verify confirmation status.');
    } finally {
      setIsLoading(false);
    }
  };

  // Transition to First Login Experience or Dashboard
  const handleContinueAfterVerification = () => {
    setStep('first_login_experience');
  };

  // 4. Handle First Onboarding Actions
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
                title="Store / Business Account"
                description="Create a store and reach campus customers."
                buttonText="Continue as Store Owner"
                onClick={() => handleSelectAccountType('store')}
                features={[
                  'Customize complete store banner cover',
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
                  {selectedType === 'student' ? 'Student Registration' : 'Store Owner Registration'}
                </h2>
                <p className="text-xs text-muted-foreground font-semibold">
                  {selectedType === 'student' 
                    ? 'Get both buyer and seller capabilities instantly using peer-to-peer student tags.' 
                    : 'Establish official shop listings and custom pages accessible by hundreds of scholars.'
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

        {/* ================= STEP 3: EMAIL VERIFICATION ================= */}
        {step === 'email_verification' && (
          <div className="p-8 space-y-6">
            <div className="max-w-md mx-auto text-center space-y-6">
              
              {!verificationSuccess ? (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-secondary">Check Your Email</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We have created your account and sent a confirmation link to <b className="text-secondary">{profile?.email || user?.email}</b>. Please check your inbox and click the verification link.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100/60 flex items-center justify-center shrink-0 text-blue-700 font-bold text-xs">
                        1
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Open the verification email sent from Kibabii Marketplace / Supabase.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100/60 flex items-center justify-center shrink-0 text-blue-700 font-bold text-xs">
                        2
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Click the confirmation link to automatically activate your student or shop account.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <Button
                      id="check-email-status"
                      type="button"
                      disabled={isLoading}
                      onClick={handleCheckEmailConfirmed}
                      className="w-full h-11 bg-primary text-white font-bold rounded-xl text-xs shadow-md shadow-primary/25"
                    >
                      {isLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                      I've Clicked the Confirmation Link
                    </Button>

                    <Button
                      id="resend-confirmation-email"
                      type="button"
                      variant="outline"
                      disabled={isLoading}
                      onClick={handleResendConfirmationEmail}
                      className="w-full h-11 text-xs gap-1.5 font-bold rounded-xl text-slate-700 border"
                    >
                      <RefreshCw className="h-4 w-4" /> Resend Confirmation Email
                    </Button>
                  </div>

                  <div className="pt-3 flex flex-col gap-2">
                    <Button
                      id="continue-without-verification"
                      variant="ghost"
                      className="text-muted-foreground hover:text-primary font-bold text-xs"
                      onClick={() => setStep('first_login_experience')}
                    >
                      Continue to Marketplace Dashboard
                    </Button>
                    <Button
                      id="go-to-login"
                      variant="link"
                      className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
                      onClick={() => navigate('/login')}
                    >
                      Already verified? Sign in here
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-6 pt-4 animate-fadeIn">
                  <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-md">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 fill-emerald-50" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-emerald-900">Email Confirmed!</h2>
                    <p className="text-sm font-semibold text-emerald-700">
                      Your Kibabii University account is now active and ready for campus trade.
                    </p>
                  </div>

                  <Button
                    id="continue-after-verification"
                    onClick={handleContinueAfterVerification}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white rounded-xl gap-2 shadow-lg"
                  >
                    <span>Enter Marketplace</span>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 4: FIRST LOGIN EXPERIENCE ================= */}
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
