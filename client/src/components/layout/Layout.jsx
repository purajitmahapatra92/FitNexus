import { useState } from 'react';
import { Outlet }   from 'react-router-dom';
import Sidebar      from './Sidebar';
import Navbar       from './Navbar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex selection:bg-brand-500/30">

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60
                     backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[260px] transition-all duration-300 ease-in-out">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8
                         max-w-[1400px] w-full mx-auto
                         animate-slide-up relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}