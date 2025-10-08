import React from 'react';
import { NavLink } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '../context/AuthContext';
import { Home, FolderKanban, Star, Settings, Wrench, Target, LogOut, User } from 'lucide-react';

function Navigation() {
  const { instance } = useMsal();
  const { user } = useAuth();

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: '/'
    });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>AI Reporting</h1>
        <p>Track and Monitor AI Initiatives</p>
      </div>

      {/* User Info */}
      {user && (
        <div className="user-info">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <Home />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/initiatives" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FolderKanban />
          <span>Initiatives</span>
        </NavLink>
        <NavLink to="/featured" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <Star />
          <span>Featured Solutions</span>
        </NavLink>
        <NavLink to="/tools/roi-assistant" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <Wrench />
          <span>ROI Assistant</span>
        </NavLink>
        <NavLink to="/tools/complexity-analyzer" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <Target />
          <span>Complexity Analyzer</span>
        </NavLink>
        <NavLink to="/management" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <Settings />
          <span>Management</span>
        </NavLink>
      </nav>

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-button">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Navigation;
