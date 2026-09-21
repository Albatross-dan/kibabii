import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { adminService } from '@/services/adminService';
import { ShieldAlert, Terminal, ArrowLeft, Home } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const verifyAdmin = async () => {
      try {
        const authorized = await adminService.checkAdminStatus();
        if (!active) return;
        
        if (authorized) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          toast.error('Not Authorized: Access restricted to Administrators!');
          navigate('/', { replace: true });
        }
      } catch (err) {
        if (!active) return;
        setIsAdmin(false);
        toast.error('Authorization expired. Please login again.');
        navigate('/auth/login', { replace: true });
      } finally {
        if (active) setLoading(false);
      }
    };

    verifyAdmin();

    return () => {
      active = false;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 font-sans text-slate-100">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center p-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Terminal className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Verifying Privileges</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Decoding session certificate and validating KibabiiMarket security access scopes...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return null; // Don't flash any content, redirect in progress
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-emerald-500/10 selection:text-emerald-500">
      {/* Absolute Admin Privileged State Banner with Back Navigation */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white px-3 sm:px-6 py-2 border-b border-emerald-500/20 text-xs font-medium flex items-center justify-between gap-3 shadow-inner select-none relative z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-emerald-500/20 text-slate-200 hover:text-white transition-all text-xs font-semibold cursor-pointer border border-white/10 hover:border-emerald-500/30"
            title="Return to main marketplace"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Back to Marketplace</span>
          </button>

          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wider animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" /> Live Admin Session
          </div>
        </div>

        <div className="text-right hidden md:block text-slate-300 text-xs truncate max-w-md">
          Privileged Console Active. Every modification is registered in the <strong className="text-slate-100 underline decoration-dashed decoration-slate-400">Secure Audit Logs</strong>.
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 transition-all text-xs font-semibold"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Storefront</span>
        </Link>
      </div>
      
      {/* Children Console pages */}
      <div className="flex-1 flex flex-col relative">
        {children}
      </div>
    </div>
  );
}
