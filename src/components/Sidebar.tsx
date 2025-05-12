
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  FolderOpen, 
  BarChart2, 
  Settings 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: <Home className="h-5 w-5" />
    },
    {
      name: 'Documents',
      path: '/documents',
      icon: <FileText className="h-5 w-5" />
    },
    {
      name: 'Projects',
      path: '/projects',
      icon: <FolderOpen className="h-5 w-5" />
    },
    {
      name: 'Reports',
      path: '/results',
      icon: <BarChart2 className="h-5 w-5" />
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="h-5 w-5" />
    }
  ];
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="hidden md:flex flex-col h-screen border-r bg-white w-64 p-4">
      <div className="flex items-center justify-center py-4">
        <h1 className="text-xl font-bold text-brand-primary">rankCentral</h1>
      </div>
      <div className="mt-8 flex flex-col space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-all ${
              isActive(item.path)
                ? 'bg-brand-primary text-white font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
