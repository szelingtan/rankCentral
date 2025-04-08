
import React from 'react';
import { Link } from 'react-router-dom';
import RankCentralLogo from './RankCentralLogo';
import { Button } from '@/components/ui/button';
import { BarChart3, FileText, Settings, Home, Compare } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <Link to="/">
            <RankCentralLogo className="mx-auto" />
          </Link>
        </div>
        <nav className="flex-1 pt-5 pb-4 overflow-y-auto">
          <div className="px-2 space-y-1">
            <Link 
              to="/" 
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-light"
            >
              <Home className="mr-3 h-5 w-5 text-gray-500" />
              Home
            </Link>
            <Link 
              to="/documents" 
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-light"
            >
              <Compare className="mr-3 h-5 w-5 text-gray-500" />
              Comparison
            </Link>
            <Link 
              to="/results" 
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-light"
            >
              <BarChart3 className="mr-3 h-5 w-5 text-gray-500" />
              Results
            </Link>
            <Link 
              to="/settings" 
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-brand-light"
            >
              <Settings className="mr-3 h-5 w-5 text-gray-500" />
              Settings
            </Link>
          </div>
        </nav>
      </div>

      {/* Mobile header */}
      <div className="md:hidden w-full bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <Link to="/">
          <RankCentralLogo size={32} />
        </Link>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon">
            <Compare className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <BarChart3 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
