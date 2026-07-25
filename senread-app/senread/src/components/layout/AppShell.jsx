import { Outlet, useLocation } from 'react-router-dom';
import TabBar from './TabBar.jsx';
import DesktopNavbar from '../navigation/DesktopNavbar.jsx';
import FloatingAudioPlayer from '../reader/FloatingAudioPlayer.jsx';
import QuickShortcutsDrawer from '../navigation/QuickShortcutsDrawer.jsx';
import NotificationDrawer from '../notifications/NotificationDrawer.jsx';
import TopLogoHeader from '../navigation/TopLogoHeader.jsx';
import InteractiveAppGuide from '../guide/InteractiveAppGuide.jsx';

export default function AppShell() {
  const { pathname } = useLocation();
  const isReader = pathname.includes('/read/');

  return (
    <div className="min-h-screen flex flex-col items-center bg-paper">
      {/* Desktop Top Navbar Navigation (Hidden on Mobile & Reader) */}
      {!isReader && <DesktopNavbar />}

      {/* Main Responsive App Container */}
      <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl min-h-screen bg-paper relative flex flex-col shadow-[0_0_60px_-15px_rgba(0,0,0,0.08)]">
        
        {/* Mobile Top Header Floating Controls */}
        {!isReader && (
          <>
            <TopLogoHeader />
            <NotificationDrawer />
            <QuickShortcutsDrawer />
            <InteractiveAppGuide />
          </>
        )}

        {/* Main App Content Scroll View */}
        <main className={`flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-12 ${isReader ? '' : 'pt-16 sm:pt-14 md:pt-4'}`}>
          <Outlet />
        </main>

        {/* Floating Mini Audio Player & Fixed Bottom Dock Navigation (Hidden on Desktop via TabBar md:hidden) */}
        {!isReader && (
          <div className="sticky bottom-0 left-0 right-0 z-50">
            <FloatingAudioPlayer />
            <TabBar />
          </div>
        )}
      </div>
    </div>
  );
}
