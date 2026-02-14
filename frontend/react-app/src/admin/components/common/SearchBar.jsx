import React, { useState } from 'react';

const SearchBar = ({ onSearch, placeholder = "Search..." }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(inputValue);
    };

    const handleChange = (e) => {
        setInputValue(e.target.value);
        // Optional: if you want real-time search, uncomment next line
        onSearch(e.target.value);
    };

    return (
        <form onSubmit={handleSubmit} className="relative flex items-center w-full">
            <div className="relative w-full group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </span>
                <input
                    type="text"
                    className="w-full py-3 pl-12 pr-4 bg-white/60 backdrop-blur-md border border-slate-200 rounded-2xl 
                               text-slate-700 placeholder-slate-400 shadow-sm outline-none transition-all duration-300
                               focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={handleChange}
                />
            </div>
            <button
                type="submit"
                className="ml-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl
                           shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0
                           transition-all duration-300"
            >
                Rechercher
            </button>
        </form>
    );
};

export default SearchBar;
