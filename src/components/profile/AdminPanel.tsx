import * as React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  Store, 
  AlertTriangle, 
  BarChart3, 
  TrendingUp, 
  Check, 
  X,
  Star,
  UserCheck,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore, UserProfile } from '@/store/authStore';
import { toast } from 'sonner';

export default function AdminPanel() {
  const { 
    accounts,
    setProfile,
    profile,
    adminApproveStudent,
    adminRejectStudent,
    adminApproveStore,
    adminRejectStore,
    adminToggleTopSeller
  } = useAuthStore();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'verifications' | 'users' | 'reports' | 'revenue'>('verifications');

  // Simulated live logged complaints
  const [complaints, setComplaints] = useState([
    { id: 'rep-502', complainant: 'John Mwangi', accused: 'Felix Juma', issue: 'Unresponsive after cash delivery deposit', date: 'Just now', resolved: false },
    { id: 'rep-499', complainant: 'Sylvia Atieno', accused: 'Comrada Printers', issue: 'Print ink quality faded back covers', date: '3 hours ago', resolved: true }
  ]);

  const handleResolveComplaint = (id: string) => {
    setComplaints(complaints.map(c => c.id === id ? { ...c, resolved: true } : c));
    toast.success('🎉 Complain status marked RESOLVED. Dispatched warning email to target user.');
  };

  // Get pending lists from auth accounts
  const pendingStudents = accounts.filter(a => a.student_verification_status === 'pending');
  const pendingStores = accounts.filter(a => a.store_verification_status === 'pending');

  const handleApproveStudent = (userId: string, name: string) => {
    adminApproveStudent(userId);
    // If the currently logged in profile is the target user, sync changes back
    if (profile && profile.id === userId) {
      setProfile({ ...profile, student_verification_status: 'approved' });
    }
    toast.success(`🎓 Approved student credentials for ${name}!`);
  };

  const handleRejectStudent = (userId: string, name: string) => {
    adminRejectStudent(userId);
    if (profile && profile.id === userId) {
      setProfile({ ...profile, student_verification_status: 'rejected' });
    }
    toast.warning(`Credentials rejected for ${name}.`);
  };

  const handleApproveStore = (userId: string, name: string) => {
    adminApproveStore(userId);
    if (profile && profile.id === userId) {
      setProfile({ ...profile, store_verification_status: 'approved', role: 'store' });
    }
    toast.success(`🏪 Approved storefront credentials for ${name}!`);
  };

  const handleRejectStore = (userId: string, name: string) => {
    adminRejectStore(userId);
    if (profile && profile.id === userId) {
      setProfile({ ...profile, store_verification_status: 'rejected' });
    }
    toast.warning(`Storefront rejected for ${name}.`);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
            <ShieldCheck className="h-4.5 w-4.5 text-blue-400" /> KIBABII MAIN ADMIN CONTROL DESK
          </h4>
          <p className="text-[10px] text-slate-300 font-bold">Manage Student credentials verification, dispute resolution, and platform revenue indexing.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <span>Open Full Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <span className="text-[9.5px] uppercase font-black bg-blue-500/20 text-blue-300 px-2.5 py-1.5 rounded border border-blue-500/20 hidden sm:inline">
            Super-Admin
          </span>
        </div>
      </div>

      {/* Admin Subtabs selection */}
      <div className="flex gap-2 border-b pb-2">
        {[
          { id: 'verifications', label: 'Pending Verifications', count: pendingStudents.length + pendingStores.length, icon: <UserCheck className="h-4 w-4" /> },
          { id: 'users', label: 'Student Accounts', count: accounts.length, icon: <Users className="h-4 w-4" /> },
          { id: 'reports', label: 'Logged Abuse Reports', count: complaints.filter(c => !c.resolved).length || null, icon: <AlertTriangle className="h-4 w-4 text-orange-400" /> },
          { id: 'revenue', label: 'Revenue & Commission INDEX', count: null, icon: <BarChart3 className="h-4 w-4 text-emerald-400" /> }
        ].map(tb => (
          <button
            key={tb.id}
            onClick={() => setActiveAdminSubTab(tb.id as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              activeAdminSubTab === tb.id 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tb.icon}
            <span>{tb.label}</span>
            {tb.count !== null && (
              <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-black">
                {tb.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Admin Content Area panels */}
      <Card className="border border-slate-100 rounded-2xl p-4 sm:p-5 bg-stone-50/20">
        <CardContent className="p-0">
          
          {/* A1: VERIFICATION APPLICATIONS LIST */}
          {activeAdminSubTab === 'verifications' && (
            <div className="space-y-5">
              
              {/* Students application */}
              <div className="space-y-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">🎓 Pending Student Verifications ({pendingStudents.length})</span>
                {pendingStudents.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No pending regular student credentials applications.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingStudents.map(student => (
                      <div key={student.id} className="p-3.5 border rounded-xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                        <div className="space-y-1">
                          <h5 className="text-xs font-black text-secondary leading-none">{student.full_name} (@{student.username})</h5>
                          <p className="text-[9.5px] font-bold text-slate-400">Reg No: {student.student_reg_number || 'KIBU/T/84992'}</p>
                          <p className="text-[10px] text-indigo-600 font-semibold italic">University Target Email: {student.student_verification_details?.university_email || 'student@kibabii.ac.ke'}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="xs" 
                            variant="outline" 
                            onClick={() => handleRejectStudent(student.id, student.full_name)}
                            className="text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300 text-[10px] h-8 rounded"
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Refuse Card
                          </Button>
                          <Button 
                            size="xs" 
                            onClick={() => handleApproveStudent(student.id, student.full_name)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-8 rounded"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Approved Verify
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stores application */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">🏪 Pending Storefront Requests ({pendingStores.length})</span>
                {pendingStores.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No pending store authorization documents.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingStores.map(store => (
                      <div key={store.id} className="p-3.5 border rounded-xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                        <div className="space-y-1">
                          <h5 className="text-xs font-black text-secondary leading-none">{store.store_name || store.full_name}</h5>
                          <p className="text-[9.5px] text-slate-400 font-bold">Category: {store.business_category || 'Electronics Repair'}</p>
                          <p className="text-[10px] text-indigo-600 font-semibold">Location: {store.store_location || 'Gate A Side'}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="xs" 
                            variant="destructive" 
                            onClick={() => handleRejectStore(store.id, store.store_name || store.full_name)}
                            className="text-[10px] h-8 rounded"
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Refuse Docs
                          </Button>
                          <Button 
                            size="xs" 
                            onClick={() => handleApproveStore(store.id, store.store_name || store.full_name)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-8 rounded"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Approve Store
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* A2: ALL ACCOUNTS MANAGEMENT LIST */}
          {activeAdminSubTab === 'users' && (
            <div className="space-y-3">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Registered Student Profiles ({accounts.length})</span>
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {accounts.map(acc => (
                  <div key={acc.id} className="p-3 border rounded-xl bg-white flex items-center justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-black text-secondary leading-none">{acc.full_name}</h5>
                      <span className="text-[9.5px] font-bold text-slate-400">@{acc.username} • Role: {acc.role.toUpperCase()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          adminToggleTopSeller(acc.id);
                          toast.success(`Top Seller Status updated for ${acc.full_name}!`);
                        }}
                        className={`text-[9.5px] h-7 font-black ${acc.is_top_seller ? 'text-amber-600 bg-amber-50' : 'text-slate-500'}`}
                      >
                        <Star className={`h-3 w-3 mr-1 ${acc.is_top_seller ? 'fill-current' : ''}`} /> Top Seller
                      </Button>
                      <span className={`text-[9.5px] uppercase font-black px-2 py-0.5 rounded leading-none ${
                        acc.student_verification_status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {acc.student_verification_status === 'approved' ? 'V-Student' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* A3: COMPLAINTS / ABUSE DESK LIST */}
          {activeAdminSubTab === 'reports' && (
            <div className="space-y-3">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Logged Abuse Complaints ({complaints.filter(c => !c.resolved).length})</span>
              <div className="space-y-3">
                {complaints.map(comp => (
                  <div key={comp.id} className="p-4 border rounded-xl bg-white space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[9.5px] font-extrabold text-red-500 uppercase tracking-widest block">COMPLAINT RECORD #{comp.id}</span>
                        <h5 className="text-xs font-black text-slate-900 leading-snug">Accused Seller: {comp.accused}</h5>
                        <p className="text-xs text-slate-400 font-semibold">Complainant: {comp.complainant} • {comp.date}</p>
                        <p className="text-xs bg-red-50 text-red-750 p-2.5 rounded-lg border border-red-100 font-medium leading-normal mt-2">
                          🌱 "{comp.issue}"
                        </p>
                      </div>
                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                        comp.resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {comp.resolved ? 'Resolved' : 'Active Duty'}
                      </span>
                    </div>

                    {!comp.resolved && (
                      <div className="flex justify-end pt-1.5 border-t">
                        <Button 
                          size="xs" 
                          onClick={() => handleResolveComplaint(comp.id)}
                          className="h-7 text-[10px] font-black bg-slate-900 text-white rounded"
                        >
                          Resolve & Warn Seller
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* A4: REVENUE & COMMISSION METRICS INDEX */}
          {activeAdminSubTab === 'revenue' && (
            <div className="space-y-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Platform Financial Index</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Escrow Vault Funds</span>
                  <span className="font-black text-lg text-emerald-700 block">KSh 324,500</span>
                  <span className="text-[9px] text-green-600 block mt-1">▲ +12% growth index</span>
                </div>

                <div className="p-3 bg-white border rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">2.5% Escrow Commissions</span>
                  <span className="font-black text-lg text-slate-900 block font-mono">KSh 8,112.50</span>
                  <span className="text-[9px] text-slate-405 block mt-1">Funds accrued inside developer ledger</span>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold leading-relaxed">
                📈 **Kibu Commission Desk**: All financial transaction streams on Kibu Market are secured via the double-auth client-side ledger node. 100% of escrow releases are logged and tracked inside database journals cleanly.
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
