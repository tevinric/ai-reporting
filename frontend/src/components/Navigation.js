import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FolderKanban, Star, Settings, BarChart3 } from 'lucide-react';

function Navigation() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>AI Reporting</h1>
        <p>Track and Monitor AI Initiatives</p>
      </div>
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
        <NavLink to="/management" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <Settings />
          <span>Management</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default Navigation;
