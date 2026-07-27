import { Outlet, useLocation } from 'react-router-dom';
import TabBar from './TabBar.jsx';
import GlobalSidebar from '../navigation/GlobalSidebar.jsx';
import QuickShortcutsDrawer from '../navigation/QuickShortcutsDrawer.jsx';
import NotificationDrawer from '../notifications/NotificationDrawer.jsx';
import TopLogoHeader from '../navigation/TopLogoHeader.jsx';
import InteractiveAppGuide from '../guide/InteractiveAppGuide.jsx';
import AnnouncementModal from '../notifications/AnnouncementModal.jsx';

export default function AppShell() {
  const { pathname } = useLocation();
  const isReader = pathname.includes('/read/');
  const isAdminOrPublish = pathname === '/admin' || pathname === '/publish';

  return (
    <div className="min-h-screen flex bg-paper text-ink">
      {/* Real-time Admin Announcement SVG Modal */}
      <AnnouncementModal />

      {/* Global Left Sidebar Navigation (Desktop md:flex) */}
      {!isReader && <GlobalSidebar />}

      {/* Main Responsive App Container */}
      <div className="flex-1 flex flex-col items-center min-w-0">
        
        {/* Mobile Top Header Floating Controls */}
        {!isReader && (
          <div className="w-full md:hidden">
            <TopLogoHeader />
            <NotificationDrawer />
            <QuickShortcutsDrawer />
            <InteractiveAppGuide />
          </div>
        )}

        {/* Main App Content Scroll View */}
        <div className={`w-full ${isAdminOrPublish ? 'max-w-7xl px-2 sm:px-4' : 'max-w-md md:max-w-4xl lg:max-w-5xl'} min-h-screen relative flex flex-col`}>
          <main className={`flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-12 ${isReader ? '' : 'pt-16 sm:pt-14 md:pt-6'}`}>
            <Outlet />
          </main>
        </div>

        {/* Fixed Bottom Dock Navigation (Mobile Only via TabBar md:hidden) */}
        {!isReader && (
          <div className="sticky bottom-0 left-0 right-0 z-50 w-full md:hidden">
            <TabBar />
          </div>
        )}
      </div>
    </div>
  );
}
