import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNavigation from './BottomNavigation';

export default function Layout() {
  const location = useLocation();
  const isChatThreadRoute = location.pathname.startsWith('/messages/') || location.pathname.startsWith('/chat/');
  const isMessagesInbox = location.pathname === '/messages';

  return (
    <div className={`flex flex-col ${isChatThreadRoute ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'} bg-background text-foreground font-sans w-full max-w-[100vw] overflow-x-hidden`}>
      {/* On mobile chat thread (/messages/:id), hide top Navbar so the card's native header sits cleanly at the top */}
      <div className={isChatThreadRoute ? 'hidden md:block shrink-0' : 'shrink-0'}>
        <Navbar />
      </div>

      <main className={`flex-grow w-full max-w-7xl mx-auto overflow-hidden ${
        isChatThreadRoute 
          ? 'h-full flex flex-col p-1 sm:p-2 md:p-4 pb-[calc(4rem+env(safe-area-inset-bottom,16px))] md:pb-4' 
          : 'px-2 sm:px-4 pt-1 sm:pt-2 md:pt-4 pb-16 md:pb-8 overflow-x-hidden'
      }`}>
        <Outlet />
      </main>

      {!isChatThreadRoute && !isMessagesInbox && (
        <div className="w-full overflow-x-hidden">
          <Footer />
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
