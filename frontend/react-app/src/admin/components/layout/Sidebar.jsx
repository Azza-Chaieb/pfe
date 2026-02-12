import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', icon: '📊', label: 'Tableau de bord' },
    { path: '/admin/users', icon: '👥', label: 'Utilisateurs' },
    { path: '/admin/settings', icon: '⚙️', label: 'Paramètres' },
  ];

  return (
    <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-white/50 flex flex-col py-6 shadow-xl z-10 h-full">
      <div className="px-8 mb-8 text-center">
        <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-violet-600 bg-clip-text text-transparent tracking-tighter">
          Admin Panel
        </h2>
      </div>

      <nav className="flex-1 flex flex-col gap-2 px-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center px-5 py-3.5 text-slate-500 rounded-xl transition-all duration-300 ease-out font-medium
                    ${isActive
                  ? 'bg-blue-50 text-blue-600 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/10'
                  : 'hover:bg-white hover:text-blue-500 hover:shadow-sm hover:translate-x-1'
                }`}
            >
              <span className={`text-xl mr-3 transition-all duration-300 ${isActive ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-5 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     text-red-500 bg-red-50 hover:bg-red-500 hover:text-white
                     transition-all duration-300 shadow-sm hover:shadow-red-500/20 hover:-translate-y-0.5"
        >
          <span>🚪</span>
          <span className="font-semibold">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;