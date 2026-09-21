import * as React from 'react';
import { ShieldCheck, Mail, Upload, FileCheck, CheckCircle2, Image, AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface VerificationCardProps {
  type: 'student' | 'store';
  currentStatus: 'unverified' | 'pending' | 'approved' | 'rejected';
  onSubmit: (details: any) => Promise<void>;
  onVerifyLater?: () => void;
}

export function VerificationCard({
  type,
  currentStatus,
  onSubmit,
  onVerifyLater
}: VerificationCardProps) {
  const [submitting, setSubmitting] = React.useState(false);

  // Student methods: email vs id_upload vs reg_submit
  const [studentMethod, setStudentMethod] = React.useState<'email' | 'id_upload' | 'reg_submit'>('email');
  const [studentEmail, setStudentEmail] = React.useState('');
  const [studentIdUrl, setStudentIdUrl] = React.useState('');
  const [studentRegNo, setStudentRegNo] = React.useState('');

  // Store options
  const [storeBanner, setStoreBanner] = React.useState('');
  const [storePhotos, setStorePhotos] = React.useState('');
  const [businessInfo, setBusinessInfo] = React.useState('');

  const handleVerifyNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (type === 'student') {
        if (studentMethod === 'email' && !studentEmail) {
          toast.error('Please enter your university email');
          setSubmitting(false);
          return;
        }
        if (studentMethod === 'id_upload' && !studentIdUrl) {
          toast.error('Please specify a Student ID image link or upload');
          setSubmitting(false);
          return;
        }
        if (studentMethod === 'reg_submit' && !studentRegNo) {
          toast.error('Please type your Student Registration Number');
          setSubmitting(false);
          return;
        }

        await onSubmit({
          method: studentMethod,
          university_email: studentEmail,
          id_card_url: studentIdUrl,
          registration_number: studentRegNo
        });
      } else {
        if (!businessInfo) {
          toast.error('Please include details in your business profile information.');
          setSubmitting(false);
          return;
        }

        await onSubmit({
          banner_url: storeBanner,
          store_photos: storePhotos ? storePhotos.split(',').map(s => s.trim()) : [],
          business_info: businessInfo
        });
      }

      toast.success('Verification details successfully submitted for review!');
    } catch (err: any) {
      toast.error(err.message || 'Verification submission unsuccessful');
    } finally {
      setSubmitting(false);
    }
  };

  if (currentStatus === 'approved') {
    return (
      <Card id="verification-card-approved" className="border-emerald-200 bg-emerald-50/20 rounded-3xl p-4 overflow-hidden shadow-sm">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-emerald-900">Verification Approved</h3>
            <p className="text-sm text-emerald-700 font-medium">
              Congratulations! Your Kibabii Market profile is verified and active.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentStatus === 'pending') {
    return (
      <Card id="verification-card-pending" className="border-amber-200 bg-amber-50/25 rounded-3xl p-4 overflow-hidden shadow-sm animate-pulse">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-amber-900">Application Under Review</h3>
            <p className="text-sm text-amber-700 font-medium leading-relaxed">
              We received your verification parameters. The Kibabii Market support and vetting teams will approve your status in a few hours.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="verification-card-form" className="border shadow-lg rounded-3xl bg-white overflow-hidden p-2">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-black">
            {type === 'student' ? 'Student Verification' : 'Store Business Verification'}
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          {type === 'student' 
            ? 'Add official credentials to verify as a Kibabii student and earn student-exclusive highlights.' 
            : 'Validate store ownership, supply details and photos, and reach campus customers officially.'
          }
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleVerifyNow}>
        <CardContent className="space-y-4">
          {/* STUDENT VERIFICATION STEPS */}
          {type === 'student' && (
            <div className="space-y-4">
              {/* Method Switcher */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-xl text-xs font-bold text-slate-500">
                <button
                  type="button"
                  className={`py-2 rounded-lg text-center transition-all ${studentMethod === 'email' ? 'bg-white text-secondary shadow-sm' : 'hover:text-foreground'}`}
                  onClick={() => setStudentMethod('email')}
                >
                  Campus Email
                </button>
                <button
                  type="button"
                  className={`py-2 rounded-lg text-center transition-all ${studentMethod === 'id_upload' ? 'bg-white text-secondary shadow-sm' : 'hover:text-foreground'}`}
                  onClick={() => setStudentMethod('id_upload')}
                >
                  Student ID Card
                </button>
                <button
                  type="button"
                  className={`py-2 rounded-lg text-center transition-all ${studentMethod === 'reg_submit' ? 'bg-white text-secondary shadow-sm' : 'hover:text-foreground'}`}
                  onClick={() => setStudentMethod('reg_submit')}
                >
                  Reg Number
                </button>
              </div>

              {studentMethod === 'email' && (
                <div className="space-y-2 animate-fadeIn">
                  <Label htmlFor="campusEmail" className="font-bold text-xs text-foreground">University Email address <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="campusEmail"
                      type="email"
                      required
                      placeholder="e.g. kamau@kibu.ac.ke"
                      className="pl-9 h-11 rounded-xl text-sm"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-semibold">Must terminate in `.kibu.ac.ke` or `@kibu.ac.ke` domain.</p>
                </div>
              )}

              {studentMethod === 'id_upload' && (
                <div className="space-y-3 animate-fadeIn">
                  <Label htmlFor="idCard" className="font-bold text-xs text-foreground">Student ID Photo URL <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="idCard"
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/id-photo"
                      className="pl-9 h-11 rounded-xl text-sm"
                      value={studentIdUrl}
                      onChange={(e) => setStudentIdUrl(e.target.value)}
                    />
                  </div>
                  <div className="p-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center">
                    <Upload className="h-6 w-6 text-slate-400 mb-1" />
                    <p className="text-[11px] font-bold text-slate-600">Simulate Uploaded ID Card image</p>
                    <p className="text-[9px] text-slate-400">Drag/drop file or specify the image path URL above</p>
                  </div>
                </div>
              )}

              {studentMethod === 'reg_submit' && (
                <div className="space-y-2 animate-fadeIn">
                  <Label htmlFor="studentRegNoInput" className="font-bold text-xs text-foreground">Official Registration Number <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <FileCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="studentRegNoInput"
                      type="text"
                      required
                      placeholder="e.g. COM/04/2022 or ED/14/2023"
                      className="pl-9 h-11 rounded-xl text-sm"
                      value={studentRegNo}
                      onChange={(e) => setStudentRegNo(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-semibold">Subject to immediate database lookup with the Kibabii Student Registrar system.</p>
                </div>
              )}
            </div>
          )}

          {/* STORE VERIFICATION STEPS */}
          {type === 'store' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeBannerVerify" className="font-bold text-xs text-foreground">Verified Store Banner URL <span className="text-xs text-muted-foreground font-semibold">(Optional)</span></Label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="storeBannerVerify"
                    type="url"
                    placeholder="E.g. https://images.unsplash.com/your-store-cover"
                    className="pl-9 h-11 rounded-xl text-sm"
                    value={storeBanner}
                    onChange={(e) => setStoreBanner(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storePhotosVerify" className="font-bold text-xs text-foreground">Verified Shop Floor Photos <span className="text-xs text-muted-foreground font-semibold">(Optional, comma-separated)</span></Label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="storePhotosVerify"
                    type="text"
                    placeholder="E.g. url1, url2, url3"
                    className="pl-9 h-11 rounded-xl text-sm"
                    value={storePhotos}
                    onChange={(e) => setStorePhotos(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessInfo" className="font-bold text-xs text-foreground">Business Information & Operating License <span className="text-red-500">*</span></Label>
                <Textarea
                  id="businessInfo"
                  required
                  rows={3}
                  className="rounded-xl text-sm p-3"
                  placeholder="Tell us about your legal registration, business license, operating address, and hours..."
                  value={businessInfo}
                  onChange={(e) => setBusinessInfo(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4 pt-4 mt-2">
          {onVerifyLater ? (
            <Button
              id="verify-later-btn"
              type="button"
              variant="ghost"
              className="text-slate-500 font-bold hover:bg-slate-100 text-xs rounded-xl px-4 py-2"
              onClick={onVerifyLater}
            >
              Verify Later
            </Button>
          ) : (
            <div></div>
          )}

          <Button
            id="verify-submit-btn"
            type="submit"
            disabled={submitting}
            className="bg-primary hover:bg-primary-hover font-black text-white text-xs rounded-xl px-4 py-2"
          >
            {type === 'student' ? 'Verify Now' : 'Verify Store'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
