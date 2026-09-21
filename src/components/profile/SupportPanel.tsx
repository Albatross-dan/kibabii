import * as React from 'react';
import { useState } from 'react';
import { HelpCircle, ChevronRight, MessageSquare, PhoneCall, AlertTriangle, FileText, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SupportPanel() {
  const [reportText, setReportText] = useState('');
  const [reportCategory, setReportCategory] = useState('Listing Issue');

  // FAQ states
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { q: "Is Kibu Market official?", a: "We are a safe student peer-to-peer ecosystem designed to connect buyers and sellers within Kibabii University. Always read safety recommendations before transactions!" },
    { q: "How does the Escrow wallet protect money?", a: "When you pay via escrow, Kibu Market holds the cash securely. Funds are only released to the seller after you confirm delivery of the item at Gate A, Hall 1, or public hostels." },
    { q: "How can I earn a verified student badge?", a: "Go to Section 5 (Verification & Badges) and provide your *.ac.ke regular student email or register student card scan for review. The administrative committee verifies details instantly under 10 minutes!" },
    { q: "Can non-students sell on Kibabii Market?", a: "We support specialized Verified Store profiles for established local shops around major campus gates (Gate A, B, Soweto areas). Apply for official store status in Settings." }
  ];

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    toast.success(`📩 Report dispatched successfully! Support Desk has logged Ticket: #${Math.floor(Math.random() * 89999 + 10000)}.`);
    setReportText('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
      
      {/* List items / FAQ Section */}
      <div className="md:col-span-12 space-y-4">
        <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">Frequently Answered Comrade Questions</span>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors overflow-hidden"
            >
              <button 
                type="button" 
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full p-3.5 flex justify-between items-center text-xs font-black text-secondary text-left leading-normal"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary shrink-0" /> {faq.q}
                </span>
                <span className="text-slate-400 shrink-0 font-extrabold ml-3">
                  {expandedFaq === idx ? '▲' : '▼'}
                </span>
              </button>
              
              {expandedFaq === idx && (
                <div className="px-5 pb-3.5 text-[11px] leading-relaxed text-slate-500 font-semibold border-t pt-2.5 bg-white">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Grid columns for problem logging and documents links */}
      <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
        
        {/* Log ticket */}
        <Card className="border border-slate-100 bg-white rounded-2xl p-4 sm:p-5">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Report a Problem</span>
          
          <form onSubmit={handleSendReport} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2 text-xs">
                <Label htmlFor="spCat" className="font-bold text-slate-700">Issue Category</Label>
                <select 
                  id="spCat"
                  value={reportCategory} 
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full h-10 border rounded-xl px-3 text-xs bg-white"
                >
                  <option>Listing Issue</option>
                  <option>Scam Alert / Suspicious behavior</option>
                  <option>Verification delay</option>
                  <option>Technical bug</option>
                </select>
              </div>

              <div className="space-y-1 col-span-2 text-xs">
                <Label htmlFor="spText" className="font-bold text-slate-700">Explain the problem</Label>
                <Input 
                  id="spText"
                  required 
                  placeholder="e.g. Cynthia is unresponsive with study desk after I paid escrow..." 
                  value={reportText} 
                  onChange={(e) => setReportText(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-9 text-xs bg-slate-900 border text-white font-black rounded-xl hover:bg-slate-800">
              Dispatched Safety Report
            </Button>
          </form>
        </Card>

        {/* Support Help contacts & document options */}
        <div className="space-y-4">
          <Card className="border border-slate-100 bg-white rounded-2xl p-4 sm:p-5 space-y-3">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Direct Contact Desk</span>
            
            <div className="space-y-2 text-xs text-slate-600 font-bold">
              <button 
                onClick={() => toast.success('Dispatching WhatsApp support link: +254 712 345 678')}
                className="w-full p-3 bg-emerald-50 text-emerald-800 rounded-xl hover:bg-emerald-100/80 transition-all flex items-center justify-between font-extrabold text-left"
              >
                <span className="flex items-center gap-2"><MessageSquare className="h-4.5 w-4.5 text-emerald-500" /> WhatsApp Hotline</span>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </button>

              <button 
                onClick={() => toast.success('Dialing student call line: 0712-34-56-78')}
                className="w-full p-3 bg-sky-50 text-sky-800 rounded-xl hover:bg-sky-100/80 transition-all flex items-center justify-between font-extrabold text-left"
              >
                <span className="flex items-center gap-2"><PhoneCall className="h-4.5 w-4.5 text-sky-500" /> Hotline Call Support</span>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </button>
            </div>
          </Card>

          {/* Docs files links */}
          <div className="flex gap-4 justify-between text-xs font-semibold text-slate-500 px-2 pt-2">
            <button 
              type="button" 
              onClick={() => toast.info('Displaying full Kibabii Market terms and trade guidelines!')}
              className="hover:underline flex items-center gap-1 hover:text-primary font-bold"
            >
              <FileText className="h-3.5 w-3.5" /> Terms & Conditions
            </button>
            <button 
              type="button" 
              onClick={() => toast.info('Displaying privacy encryption levels and GDPR compliant statements')}
              className="hover:underline flex items-center gap-1 hover:text-primary font-bold"
            >
              <Lock className="h-3.5 w-3.5" /> Privacy Policy
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
