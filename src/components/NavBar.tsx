
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, BarChart, Settings, FolderOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NavBar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const navItems = [
    { name: 'Home', icon: <Home className="h-5 w-5" />, path: '/' },
    { name: 'Documents', icon: <FileText className="h-5 w-5" />, path: '/documents' },
    { name: 'Projects', icon: <FolderOpen className="h-5 w-5" />, path: '/projects' },
    { name: 'Results', icon: <BarChart className="h-5 w-5" />, path: '/results' },
    { name: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/settings' },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm
            ${location.pathname === item.path
              ? 'bg-brand-primary text-white font-medium'
              : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          {item.icon}
          <span>{item.name}</span>
        </Link>
      ))}
    </div>
  );
};

export default NavBar;
