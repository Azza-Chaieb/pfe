import React from 'react';

const Header = () => {
  return (
    <header className="h-20 px-8 flex justify-end items-center bg-transparent">
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-slate-400 hover:text-blue-500 transition-colors rounded-full hover:bg-white/50">
          <span className="text-xl">🔔</span>
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-slate-50">
            3
          </span>
        </button>

        <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
          <div className="bg-gradient-to-tr from-blue-500 to-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            👨‍💼
          </div>
          <div className="flex flex-col">
            <div className="font-bold text-slate-700 text-sm">Administrateur</div>
            <div className="text-xs text-slate-500 font-medium">admin@sunspace.com</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;