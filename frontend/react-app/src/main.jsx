// 1. Modifie src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

// 2. Modifie Sidebar.jsx - REMPLACE LES DIV PAR DES LINKS
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/admin', icon: '📊', label: 'Tableau de bord' },
    { path: '/admin/users', icon: '👥', label: 'Utilisateurs' },
    { path: '/admin/content', icon: '📝', label: 'Contenu' },
    { path: '/admin/analytics', icon: '📈', label: 'Analytiques' },
    { path: '/admin/settings', icon: '⚙️', label: 'Paramètres' },
  ];
  
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">
        <h2>Admin Panel</h2>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};