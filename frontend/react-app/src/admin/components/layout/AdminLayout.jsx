import React from 'react';
// Layout principal pour l'administration
import Sidebar from './Sidebar';
import Header from './Header';

export const AdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 font-sans fixed inset-0 z-[9999] overflow-hidden w-screen h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Header />
        <div className="flex-1 p-10 overflow-y-auto scroll-smooth animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};