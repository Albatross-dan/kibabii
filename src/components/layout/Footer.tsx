import { Link } from 'react-router-dom';
import { Store, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white px-6 py-8 border-t border-gray-100">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-gray-400">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
            <Link to="/" className="shrink-0">
              <img 
                src="/logo-horizontal.svg" 
                alt="KibuMall Marketplace" 
                className="h-8 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
            </Link>
            <span className="hidden sm:block h-3 w-px bg-gray-200"></span>
            <span>&copy; {new Date().getFullYear()} KibuMall</span>
            <span className="hidden sm:block h-3 w-px bg-gray-200"></span>
            <span className="hidden sm:block">Official Kibabii University Marketplace</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-black uppercase tracking-widest">
            <Link to="#" className="hover:text-primary transition-colors">Safety Tips</Link>
            <Link to="#" className="hover:text-primary transition-colors">How to Buy</Link>
            <Link to="#" className="hover:text-primary transition-colors">Seller Policy</Link>
            <Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-primary transition-colors">Contact Admin</Link>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-300 font-medium">
          <p>Kibabii University, Bungoma - Kenya</p>
          <div className="flex gap-4">
             <span className="hover:text-secondary cursor-pointer transition-colors">Facebook</span>
             <span className="hover:text-secondary cursor-pointer transition-colors">Twitter</span>
             <span className="hover:text-secondary cursor-pointer transition-colors">Instagram</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
